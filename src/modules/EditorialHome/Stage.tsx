'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface StageProps {
  accent?: string;
  className?: string;
}

/** Tokenised source lines that scroll through the reflection canvas. */
const CODE_LINES: readonly (readonly string[])[] = [
  ['const', ' tag ', '= ', 'document', '.createElement(', "'section'", ')'],
  ['export default function ', 'Hero', '({ children }) {'],
  ['  return ', '<Stage ', 'dpr={[1, 2]} ', 'shadows', ' />'],
  ['gsap', '.to(', 'stage', ', { y: 0, ease: ', "'expo.out'", ' })'],
  ['await ', 'document', '.fonts.ready'],
  ['if (', 'prefersReducedMotion', ') return ', 'null'],
  ['observer', '.observe(', 'node', ', { threshold: 0.4 })'],
  ['transform: ', 'translate3d', '(0, 0, 0)'],
  ['performance', '.mark(', "'lcp'", ')'],
  ['</', 'section', '>']
];

const CODE_W = 1024;
const CODE_H = 576;
const ENV_W = 2048;
const ENV_H = 1024;

/**
 * The code panel only reaches the chrome through a PMREM convolution, so a
 * 12Hz refresh is indistinguishable from 60Hz while costing a fifth of the
 * canvas text rasterisation and of the PMREM blur chain.
 */
const ENV_INTERVAL = 1 / 12;

/** Where the code panel lands inside the equirect strip (~the reflection hot spot). */
const PANEL_W = 660;
const PANEL_H = 372;
/** Centred on the front-reflection hot spot: u = 0.75, v = 0.5. */
const PANEL_X = ENV_W * 0.75 - PANEL_W / 2;
const PANEL_Y = ENV_H * 0.5 - PANEL_H / 2;

/**
 * Studio softboxes, in equirectangular UV.
 *
 * Chrome shows nothing but its environment, so "make it look like metal" is
 * a lighting problem, not a material one: what reads as polish is the
 * contrast between bright sources and a black field, not overall brightness.
 * The old strip put a flat mid-grey where the front faces sample, which is
 * exactly why the glyph rendered as dark plastic.
 *
 * u is azimuth (0.75 faces the camera), v is elevation (0 up, 1 down).
 */
const SOFTBOXES: readonly {
  u: number;
  v: number;
  w: number;
  h: number;
  tint: string;
  power: number;
}[] = [
  // Key: high and camera-left, the broad sweep down the outer bevels.
  { u: 0.58, v: 0.24, w: 0.16, h: 0.13, tint: '255,252,244', power: 1.6 },
  // The right chevron's front face reflects just past u = 0.75; the previous
  // rim sat at 0.95, which is side-on, so that face stayed dull grey.
  { u: 0.86, v: 0.33, w: 0.1, h: 0.17, tint: '232,242,255', power: 1.45 },
  // Twin horizon bands. A single band gives one streak; a pair reads as a
  // reflected room and is most of what separates chrome from brushed alloy.
  { u: 0.72, v: 0.47, w: 0.5, h: 0.016, tint: '255,255,255', power: 1.8 },
  { u: 0.78, v: 0.56, w: 0.34, h: 0.01, tint: '214,228,255', power: 1.2 },
  // Silhouette guard: keeps the upper-right arm's bevel off pure black so the
  // glyph does not lose its top-right corner against a #0A0A0A page.
  { u: 0.92, v: 0.14, w: 0.22, h: 0.13, tint: '198,212,236', power: 0.5 },
  // Low kicker, lifting the underside off pure black.
  { u: 0.3, v: 0.74, w: 0.13, h: 0.08, tint: '180,196,220', power: 0.5 }
];

/**
 * r149 rendered with legacy lights, which multiplied every light intensity by
 * PI. Modern three only has the physical scale, so the authored intensities are
 * pre-multiplied to keep the prototype's exposure.
 */
const LEGACY_LIGHT_SCALE = Math.PI;

/**
 * Legacy punctual falloff was pow(1 - d / distance, decay); the physical one is
 * 1 / d^2 with a windowing term. At the ~3 unit distance of the glyphs the
 * physical curve is ~3.8x dimmer, so the accent point light carries the extra
 * factor on top of the PI scale.
 */
const ACCENT_LIGHT_SCALE = LEGACY_LIGHT_SCALE * 3.8;

function createRenderer(): THREE.WebGLRenderer | null {
  try {
    return new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    // No WebGL (blocked, software rasteriser disabled, too many live contexts).
    return null;
  }
}

function extrude(shape: THREE.Shape): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 4,
    curveSegments: 6
  });
}

function chevronGeometry(dir: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const thickness = 0.34;
  shape.moveTo(dir * 0.62, 0.96);
  shape.lineTo(dir * -0.42, 0);
  shape.lineTo(dir * 0.62, -0.96);
  shape.lineTo(dir * (0.62 - thickness * 0.1), -0.96 + thickness * 1.35);
  shape.lineTo(dir * (-0.42 + thickness * 1.25), 0);
  shape.lineTo(dir * (0.62 - thickness * 0.1), 0.96 - thickness * 1.35);
  shape.closePath();
  return extrude(shape);
}

function slashGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.3, -1.02);
  shape.lineTo(-0.02, -1.02);
  shape.lineTo(0.3, 1.02);
  shape.lineTo(0.02, 1.02);
  shape.closePath();
  return extrude(shape);
}

export default function Stage({ accent = '#F2EFE9', className }: StageProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const codeCanvas = document.createElement('canvas');
    codeCanvas.width = CODE_W;
    codeCanvas.height = CODE_H;
    const code = codeCanvas.getContext('2d');

    const envCanvas = document.createElement('canvas');
    envCanvas.width = ENV_W;
    envCanvas.height = ENV_H;
    const env = envCanvas.getContext('2d');

    // Nothing disposable exists yet, so bailing here leaks nothing.
    if (code === null || env === null) return;

    const renderer = createRenderer();
    if (renderer === null) return;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The studio sources push specular highlights well above 1.0; without a
    // filmic roll-off they clip to flat white and the polish reads as paper.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    camera.position.set(0.15, 0.28, 6.4);
    camera.lookAt(0.12, 0.02, 0);

    const accentColor = new THREE.Color(accent);
    // Normalised through Color so an unparseable prop cannot poison fillStyle.
    const accentStyle = accentColor.getStyle();
    const tints = ['#F2EFE9', accentStyle, '#8C8C88'];

    const drawCode = (t: number) => {
      code.fillStyle = '#0C0C0D';
      code.fillRect(0, 0, CODE_W, CODE_H);
      code.font = '500 22px "JetBrains Mono", monospace';
      const scroll = Math.floor(t * 1.5);
      for (let i = 0; i < 18; i++) {
        const y = 40 + i * 31;
        const line = CODE_LINES[(i + scroll) % CODE_LINES.length];
        code.fillStyle = '#343432';
        code.fillText(String(((i + scroll) % 99) + 1).padStart(2, '0'), 22, y);
        let x = 74;
        for (const [k, token] of line.entries()) {
          code.fillStyle = tints[k % tints.length];
          code.fillText(token, x, y);
          x += code.measureText(token).width;
        }
      }
      if (Math.sin(t * 5) > 0) {
        code.fillStyle = accentStyle;
        code.fillRect(74, 40 + 9 * 31 - 16, 11, 21);
      }
    };

    /** A softbox with a soft edge. Hard-edged rectangles reflect as hard-edged
     *  rectangles, which is most of what makes cheap chrome look cheap. */
    const softbox = (box: (typeof SOFTBOXES)[number]) => {
      const cx = box.u * ENV_W;
      const cy = box.v * ENV_H;
      const w = box.w * ENV_W;
      const h = box.h * ENV_H;

      // Drawn in a unit-circle gradient scaled to the box, so the falloff
      // follows the box's aspect instead of being circular.
      env.save();
      env.translate(cx, cy);
      env.scale(w, h);
      const glow = env.createRadialGradient(0, 0, 0, 0, 0, 1);
      glow.addColorStop(0, `rgba(${box.tint},${String(box.power)})`);
      glow.addColorStop(0.55, `rgba(${box.tint},${String(box.power * 0.5)})`);
      glow.addColorStop(1, `rgba(${box.tint},0)`);
      env.fillStyle = glow;
      env.fillRect(-1, -1, 2, 2);
      env.restore();

      // A small solid core keeps a crisp specular hit inside the soft falloff.
      env.fillStyle = `rgba(${box.tint},${String(Math.min(box.power, 1))})`;
      env.fillRect(cx - w * 0.26, cy - h * 0.26, w * 0.52, h * 0.52);
    };

    const paintEnv = (t: number) => {
      // Near-black field. The page is #0A0A0A and the vignette deliberately
      // sinks the stage — the authored darkness stays; only the sources get
      // brighter, which is what separates polished metal from matte.
      env.fillStyle = '#050506';
      env.fillRect(0, 0, ENV_W, ENV_H);

      // Faint zenith lift so the top bevels are not perfectly dead.
      const sky = env.createLinearGradient(0, 0, 0, ENV_H * 0.5);
      sky.addColorStop(0, 'rgba(150,158,172,0.16)');
      sky.addColorStop(1, 'rgba(150,158,172,0)');
      env.fillStyle = sky;
      env.fillRect(0, 0, ENV_W, ENV_H * 0.5);

      env.globalCompositeOperation = 'lighter';
      for (const box of SOFTBOXES) softbox(box);
      env.globalCompositeOperation = 'source-over';

      // The live code panel, now actually centred on the reflection the front
      // faces sample. Screen-blended so it reads as emitted light rather than
      // a grey rectangle punched into the field.
      drawCode(t);
      env.globalCompositeOperation = 'lighter';
      env.globalAlpha = 0.34;
      env.drawImage(
        codeCanvas,
        CODE_W * 0.02,
        CODE_H * 0.18,
        CODE_W * 0.62,
        CODE_H * 0.54,
        PANEL_X,
        PANEL_Y,
        PANEL_W,
        PANEL_H
      );
      env.globalAlpha = 1;
      env.globalCompositeOperation = 'source-over';

      // Accent bar, low and camera-left: a single coloured streak that tells
      // you the metal is reflecting something with a colour in it.
      env.fillStyle = accentStyle;
      env.globalAlpha = 0.5;
      env.fillRect(ENV_W * 0.34, ENV_H * 0.6, ENV_W * 0.1, ENV_H * 0.012);
      env.globalAlpha = 1;
    };

    paintEnv(0);

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    // Authored as sRGB swatches; without this the strip is decoded as linear
    // and the chrome loses the dark horizon that makes it read as metal.
    envTexture.colorSpace = THREE.SRGBColorSpace;

    // WebGLEnvironments only refreshes its cached PMREM for render-target
    // textures, so an animated CanvasTexture environment has to be convolved
    // by hand. Reusing the same target keeps envMap identity stable.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envTarget = pmrem.fromEquirectangular(envTexture);
    const envMap = envTarget.texture;
    scene.environment = envMap;

    const updateEnv = (t: number) => {
      paintEnv(t);
      envTexture.needsUpdate = true;
      pmrem.fromEquirectangular(envTexture, envTarget);
    };

    const chrome = new THREE.MeshStandardMaterial({
      color: 0xf2efe9,
      metalness: 1,
      // Tighter than 0.13: the environment now has detail worth resolving.
      roughness: 0.075,
      envMap,
      envMapIntensity: 1.9
    });

    // The slash is the accent, but the default accent is the same off-white as
    // the chrome — so it is separated by finish instead of colour. Anisotropic
    // roughness stretches the highlight along one axis, reading as brushed
    // steel next to the mirror-polished chevrons even in monochrome.
    const chromeAccent = new THREE.MeshPhysicalMaterial({
      color: accentColor,
      metalness: 1,
      roughness: 0.28,
      anisotropy: 0.85,
      anisotropyRotation: Math.PI / 2,
      envMap,
      envMapIntensity: 1.5
    });

    const world = new THREE.Group();
    world.scale.setScalar(0.62);
    scene.add(world);

    const geometries = [chevronGeometry(1), slashGeometry(), chevronGeometry(-1)];

    const mount = (geometry: THREE.BufferGeometry, x: number, material: THREE.Material) => {
      const group = new THREE.Group();
      group.position.x = x;
      world.add(group);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -0.17;
      group.add(mesh);
      return group;
    };

    const left = mount(geometries[0], -1.12, chrome);
    const slash = mount(geometries[1], 0, chromeAccent);
    const right = mount(geometries[2], 1.12, chrome);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4 * LEGACY_LIGHT_SCALE));
    const key = new THREE.DirectionalLight(0xffffff, 2.1 * LEGACY_LIGHT_SCALE);
    key.position.set(3.2, 4.2, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb6d6, 0.85 * LEGACY_LIGHT_SCALE);
    fill.position.set(-4.2, -1.2, 2.4);
    scene.add(fill);
    const accentLight = new THREE.PointLight(accentColor, 2.2 * ACCENT_LIGHT_SCALE, 8, 2);
    accentLight.position.set(-2.6, 0.9, 1.6);
    scene.add(accentLight);

    let width = 0;
    let height = 0;
    let sized = false;

    const sync = (): boolean => {
      const nw = host.clientWidth;
      const nh = host.clientHeight;
      // Hidden below 900px, or measured before layout: the poll retries.
      if (nw === 0 || nh === 0) return false;
      if (sized && nw === width && nh === height) return false;
      width = nw;
      height = nh;
      sized = true;
      renderer.setSize(nw, nh, false);
      camera.aspect = nw / nh;
      camera.fov = nw / nh < 1.25 ? 40 : 32;
      camera.updateProjectionMatrix();
      return true;
    };

    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    let elapsed = 0;
    let last = -1;
    let rafId = 0;
    let nextEnvUpdate = ENV_INTERVAL;
    let contextLost = false;
    let disposed = false;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;

    const renderFrame = (t: number) => {
      if (!sized || contextLost) return;
      if (t >= nextEnvUpdate) {
        updateEnv(t);
        nextEnvUpdate = t + ENV_INTERVAL;
      }
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      world.rotation.y = Math.sin(t * 0.22) * 0.34 + mouseX;
      world.rotation.x = Math.sin(t * 0.17) * 0.08 + mouseY * 0.4;
      const beat = (Math.sin(t * 0.55) + 1) / 2;
      left.position.x = -1.12 - beat * 0.08;
      right.position.x = 1.12 + beat * 0.08;
      left.rotation.y = -beat * 0.07;
      right.rotation.y = beat * 0.07;
      slash.rotation.y = Math.sin(t * 0.5) * 0.12;
      accentLight.intensity = (2 + Math.sin(t * 2.6) * 0.4) * ACCENT_LIGHT_SCALE;
      renderer.render(scene, camera);
    };

    /** One frame for the paths where the loop is not (or must not be) running. */
    const renderStatic = () => {
      if (disposed || document.hidden || rafId !== 0) return;
      renderFrame(elapsed);
    };

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const delta = last < 0 ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      elapsed += delta;
      renderFrame(elapsed);
    };

    const stop = () => {
      if (rafId === 0) return;
      cancelAnimationFrame(rafId);
      rafId = 0;
      last = -1;
    };

    const start = () => {
      if (rafId !== 0 || disposed || contextLost || reducedMotion || document.hidden) return;
      // Nothing to draw while the host has no box; sync() restarts us.
      if (!sized) return;
      last = -1;
      rafId = requestAnimationFrame(loop);
    };

    let pollId: ReturnType<typeof setInterval> | undefined;
    let pollStopId: ReturnType<typeof setTimeout> | undefined;

    const stopPoll = () => {
      if (pollId !== undefined) {
        clearInterval(pollId);
        pollId = undefined;
      }
      if (pollStopId !== undefined) {
        clearTimeout(pollStopId);
        pollStopId = undefined;
      }
    };

    const onResize = () => {
      if (!sync()) return;
      // Covers the 900px breakpoint handing the host a box for the first time.
      start();
      renderStatic();
    };

    const onMove = (event: MouseEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 0.6;
      targetY = (event.clientY / window.innerHeight - 0.5) * 0.36;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      start();
      // Nothing was drawn while hidden, so reduced motion still needs its frame.
      renderStatic();
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stop();
        renderStatic();
      } else {
        start();
      }
    };

    const onContextLost = (event: Event) => {
      // Keeping the default would make the loss permanent.
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const onContextRestored = () => {
      contextLost = false;
      // The PMREM target came back empty; force a rebuild on the next frame.
      nextEnvUpdate = -1;
      sized = false;
      sync();
      if (reducedMotion) renderStatic();
      else start();
    };

    // Observe unconditionally: the host is display:none below 900px and must
    // recover the moment it gains a box.
    const observer = new ResizeObserver(onResize);
    observer.observe(host);

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    motionQuery.addEventListener('change', onMotionChange);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    pollId = setInterval(() => {
      if (sized) stopPoll();
      else onResize();
    }, 150);
    pollStopId = setTimeout(stopPoll, 15000);

    sync();
    if (reducedMotion) renderStatic();
    else start();

    return () => {
      disposed = true;
      stop();
      stopPoll();
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotionChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);

      scene.environment = null;
      for (const geometry of geometries) geometry.dispose();
      chrome.dispose();
      chromeAccent.dispose();
      envTexture.dispose();
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      // Frees the GPU context immediately instead of waiting for GC, which
      // matters when Fast Refresh remounts this a dozen times.
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [accent]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
