import { Container } from '@Components/Container';
import { Sparkles, Terminal } from 'lucide-react';
import type React from 'react';

interface HeroProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onMouseEnter, onMouseLeave }) => {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center pt-28 pb-16 md:pt-20 lg:pt-0"
    >
      <Container className="relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Narrative */}
          <div className="flex flex-col justify-center lg:col-span-7">
            {/* Sparkle Tag */}
            <div className="hero-sub mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3.5 py-1.5">
              <Sparkles className="h-4.5 w-4.5 animate-pulse text-[#06b6d4]" />
              <span className="font-semibold text-xs text-zinc-300 uppercase tracking-wider">
                Available for Freelance & Contract
              </span>
            </div>

            {/* Mask Title */}
            <h1 className="hero-title mb-6 font-[family-name:var(--font-raleway)] font-extrabold text-5xl text-white leading-[1.05] tracking-tight md:text-7xl lg:text-[80px]">
              <div className="block h-fit overflow-hidden py-1">
                <span className="inline-block origin-left">CRAFTING</span>
              </div>
              <div className="block h-fit overflow-hidden py-1">
                <span className="inline-block origin-left text-[#8b5cf6]">DIGITAL</span>
              </div>
              <div className="block h-fit overflow-hidden py-1">
                <span className="inline-block origin-left">EXPERIENCES</span>
              </div>
            </h1>

            {/* Sub description */}
            <p className="hero-sub mb-8 max-w-lg text-lg text-zinc-400 leading-relaxed">
              Hi, I'm Alex. A creative front-end developer based in Dallas. I design and build
              highly interactive interfaces with smooth scroll mechanics, pixel-perfect
              responsiveness, and creative 3D layouts.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta flex flex-wrap items-center gap-4">
              <a
                href="#projects"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className="glow-purple inline-flex h-12 items-center justify-center rounded-full bg-[#8b5cf6] px-8 font-semibold text-sm text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7c4dff]"
              >
                View My Work
              </a>
              <a
                href="#contact"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 font-semibold text-sm text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-white/10"
              >
                Let's Connect
              </a>
            </div>
          </div>

          {/* Right Graphic Card */}
          <div className="flex justify-center lg:col-span-5">
            <div className="hero-card glass-card glow-purple relative aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/10 sm:max-w-[380px]">
              {/* Visual decoration overlay */}
              <div className="absolute top-4 left-4 z-20 flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              </div>
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                <Terminal className="h-3.5 w-3.5" /> index.js
              </div>

              {/* Editor display */}
              <div className="absolute inset-0 flex select-none flex-col justify-between bg-black/40 px-6 pt-14 font-mono text-[#06b6d4] text-[11px] leading-relaxed">
                <div>
                  <span className="text-zinc-500">{'// Initialize portfolio configurations'}</span>
                  <br />
                  <span className="text-purple-400">const</span> developer = {'{'}
                  <div className="pl-4">
                    name: <span className="text-zinc-100">'Alex Nguyen'</span>,
                    <br />
                    role: <span className="text-zinc-100">'Creative Front-End'</span>,
                    <br />
                    stack: [<span className="text-[#f43f5e]">'Next.js'</span>,{' '}
                    <span className="text-[#8b5cf6]">'GSAP'</span>,{' '}
                    <span className="text-[#06b6d4]">'WebGL'</span>],
                    <br />
                    designFirst: <span className="text-amber-400">true</span>,
                    <br />
                    fluidAnimations: <span className="text-amber-400">true</span>
                  </div>
                  {'};'}
                  <br />
                  <br />
                  <span className="text-zinc-500">{'// Render creative interactive grid'}</span>
                  <br />
                  developer.<span className="text-zinc-200">mount</span>();
                </div>

                <div className="flex items-center justify-between border-white/5 border-t pt-4 pb-6 text-[10px] text-zinc-500">
                  <span>Lighthouse Score: 100/100</span>
                  <div className="flex gap-1">
                    <div className="glow-cyan h-2.5 w-2.5 animate-pulse rounded-full bg-[#06b6d4]" />
                    <div className="glow-purple h-2.5 w-2.5 animate-pulse rounded-full bg-[#8b5cf6]" />
                  </div>
                </div>
              </div>

              {/* Outer gradients */}
              <div className="absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-[#f43f5e] opacity-30 blur-[60px]" />
              <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-[#8b5cf6] opacity-20 blur-[60px]" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
