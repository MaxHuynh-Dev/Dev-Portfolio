import { Code2, Cpu, Sparkles } from 'lucide-react';
import type React from 'react';

export const techMarquee = [
  'React',
  'Next.js',
  'TypeScript',
  'GSAP Animations',
  'Framer Motion',
  'Three.js / WebGL',
  'Tailwind CSS',
  'UI/UX Prototyping',
  'Creative Coding',
  'Node.js',
  'Vite / Webpack',
  'Performance Optimization'
];

export interface Skill {
  name: string;
  level: number;
}

export interface SkillCategory {
  title: string;
  icon: React.ReactNode;
  skills: Skill[];
}

export const skillCategories: SkillCategory[] = [
  {
    title: 'Core Development',
    icon: <Code2 className="h-5 w-5 text-[#06b6d4]" />,
    skills: [
      { name: 'JavaScript / ES6+', level: 95 },
      { name: 'TypeScript', level: 90 },
      { name: 'React.js', level: 92 },
      { name: 'Next.js', level: 90 }
    ]
  },
  {
    title: 'Creative & Motion',
    icon: <Sparkles className="h-5 w-5 text-[#8b5cf6]" />,
    skills: [
      { name: 'GSAP (GreenSock)', level: 95 },
      { name: 'Framer Motion', level: 90 },
      { name: 'Three.js / WebGL', level: 75 },
      { name: 'CSS Sculpting & Canvas', level: 85 }
    ]
  },
  {
    title: 'Architecture & Tooling',
    icon: <Cpu className="h-5 w-5 text-[#f43f5e]" />,
    skills: [
      { name: 'Tailwind CSS v4', level: 95 },
      { name: 'Vite / Module Bundlers', level: 85 },
      { name: 'Git & CI/CD Pipelines', level: 80 },
      { name: 'Performance Auditing', level: 88 }
    ]
  }
];

export interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  gradient: string;
  link: string;
  code: string;
  previewCode: string;
}

export const projects: Project[] = [
  {
    id: 1,
    title: 'Aether - Immersive Audio Visualizer',
    description:
      'A real-time 3D audio visualizer utilizing WebGL and Web Audio API. Rendered with custom vertex shaders and synchronized with GSAP timelines.',
    tags: ['Next.js', 'Three.js', 'Web Audio API', 'GSAP'],
    gradient: 'from-[#8b5cf6] to-[#06b6d4]',
    link: '#',
    code: '#',
    previewCode: `const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
// 3D Shader Uniform Update
uniforms.u_freq.value = dataArray[i];`
  },
  {
    id: 2,
    title: 'Chrono - Creative Production Suite',
    description:
      'A fluid workspace application for creative filmmakers. Developed with a high-performance grid layout, drag-and-drop timeline modules, and Framer Motion spring physical layers.',
    tags: ['React.js', 'Framer Motion', 'Zustand', 'Sass'],
    gradient: 'from-[#06b6d4] to-[#f43f5e]',
    link: '#',
    code: '#',
    previewCode: `// Drag physics simulation
<motion.div 
  drag="x" 
  dragConstraints={{ left: 0, right: 1000 }}
  style={{ x: springX }}
/>`
  },
  {
    id: 3,
    title: 'Kinetik - Kinetic Typography Engine',
    description:
      'An interactive design tool for sculpting animated kinetic typography grids. Supports dynamic text-wrapping, canvas texture rendering, and SVG animation exports.',
    tags: ['TypeScript', 'HTML5 Canvas', 'GSAP', 'Vite'],
    gradient: 'from-[#f43f5e] to-[#8b5cf6]',
    link: '#',
    code: '#',
    previewCode: `// Grid particle rendering
ctx.fillText(char, p.x, p.y);
gsap.to(p, {
  scale: Math.sin(t) * 1.5,
  duration: 1
});`
  },
  {
    id: 4,
    title: 'Flux - Web3 NFT Art Platform',
    description:
      'A decentralized artistic marketplace featuring fluid layouts, interactive gallery sliders, custom page transitions, and smart contract connections.',
    tags: ['Next.js', 'Ethers.js', 'Tailwind CSS', 'Framer Motion'],
    gradient: 'from-[#06b6d4] to-[#8b5cf6]',
    link: '#',
    code: '#',
    previewCode: `// Smart contract request
const contract = new ethers.Contract(address, abi, signer);
const metadata = await contract.tokenURI(tokenId);
setArt(metadata.image);`
  }
];

export interface Experience {
  role: string;
  company: string;
  period: string;
  desc: string;
}

export const experiences: Experience[] = [
  {
    role: 'Creative Front-End Engineer',
    company: 'Studio Morph (Dallas, TX / Remote)',
    period: '2024 - Present',
    desc: 'Crafting award-winning, interactive marketing sites and immersive visual products for modern startups and global brands. Integrating rich animations, Three.js shaders, and custom layouts.'
  },
  {
    role: 'Senior UI Developer',
    company: 'Aether Digital',
    period: '2022 - 2024',
    desc: 'Led the development of a Next.js design system used across 5 enterprise apps. Coordinated transition from REST to GraphQL, increasing rendering speeds by 40% and optimizing Lighthouse performance score to 98+.'
  },
  {
    role: 'Front-End Specialist',
    company: 'Vertex Labs',
    period: '2020 - 2022',
    desc: 'Built custom responsive web portals, rich micro-interaction components, and custom scroll-triggered storytelling campaigns using GSAP and canvas elements.'
  }
];
