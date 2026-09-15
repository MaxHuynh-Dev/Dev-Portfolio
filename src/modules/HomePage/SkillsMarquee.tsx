import type React from 'react';
import { techMarquee } from './constants';

export const SkillsMarquee: React.FC = () => {
  return (
    <section className="relative overflow-hidden border-white/5 border-y bg-[#0c0b14]/50 py-10">
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-24 bg-gradient-to-r from-[#05040a] to-transparent md:w-48" />
        <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-24 bg-gradient-to-l from-[#05040a] to-transparent md:w-48" />

        {/* Marquee track */}
        <div className="marquee-track flex items-center">
          {[...techMarquee, ...techMarquee].map((tech, i) => (
            <div
              key={`${tech}-${String(i)}`}
              className="mx-8 flex flex-shrink-0 items-center gap-3 font-bold text-xl text-zinc-600 tracking-wider transition-colors duration-300 hover:text-white md:text-2xl"
            >
              <span>{tech}</span>
              <span className="h-2 w-2 rounded-full bg-[#06b6d4]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
