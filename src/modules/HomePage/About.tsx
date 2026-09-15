import { Container } from '@Components/Container';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import type React from 'react';
import { skillCategories } from './constants';

const splitTextToSpans = (text: string): React.ReactNode => {
  return text.split(' ').map((word, i) => (
    <span key={`${word}-${i.toString()}`} className="mr-2 inline-flex overflow-hidden pb-1">
      <span className="reveal-word inline-block translate-y-[105%] will-change-transform">
        {word}
      </span>
    </span>
  ));
};

export const About: React.FC = () => {
  return (
    <section
      id="about"
      className="relative border-white/5 border-b bg-[#0c0b14]/20 py-20 md:py-28 lg:py-36"
    >
      <Container>
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left narrative */}
          <div className="lg:col-span-5">
            <span className="glow-purple mb-3 block font-bold text-[#8b5cf6] text-xs uppercase tracking-[0.25em]">
              WHO AM I
            </span>
            <h2 className="reveal-container mb-6 font-[family-name:var(--font-raleway)] font-extrabold text-3xl text-white leading-tight md:text-5xl">
              {splitTextToSpans('Bridging code engineering and visual aesthetics.')}
            </h2>
            <div className="mb-8 h-1 w-12 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4]" />
            <p className="mb-6 text-zinc-400 leading-relaxed">
              For over 4 years, I have worked at the intersection of creative animation and rigid
              software architectures. I believe that digital interfaces should be alive, responding
              to user actions with organic movement.
            </p>
            <p className="mb-8 text-zinc-400 leading-relaxed">
              Whether deploying optimized Next.js frameworks, structuring reactive database schemas,
              or writing clean GLSL shaders for canvas effects, I prioritize smoothness,
              accessability, and performance above all.
            </p>

            {/* Download Resume Button */}
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-sm transition-all duration-300 hover:border-[#8b5cf6] hover:bg-white/10"
            >
              Download Resume{' '}
              <Download className="h-4 w-4 text-[#8b5cf6] transition-transform duration-300 group-hover:translate-y-0.5" />
            </a>
          </div>

          {/* Right Skills Grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {skillCategories.map((cat, index) => (
                <div
                  key={cat.title}
                  className="glass-card relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#0e0c1a]/40 p-6"
                >
                  <div>
                    <div className="mb-4 w-fit rounded-lg border border-white/5 bg-white/5 p-2.5">
                      {cat.icon}
                    </div>
                    <h3 className="mb-6 font-bold text-base text-white">{cat.title}</h3>
                  </div>

                  <div className="space-y-4">
                    {cat.skills.map((skill) => (
                      <div key={skill.name}>
                        <div className="mb-1.5 flex justify-between font-medium text-xs text-zinc-300">
                          <span>{skill.name}</span>
                          <span>{String(skill.level)}%</span>
                        </div>
                        {/* Visual level bar */}
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${String(skill.level)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: Number(index) * 0.15 + 0.2 }}
                            className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
