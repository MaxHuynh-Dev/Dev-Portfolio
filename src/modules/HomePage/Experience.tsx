import { Container } from '@Components/Container';
import { Briefcase } from 'lucide-react';
import type React from 'react';
import { experiences } from './constants';

const splitTextToSpans = (text: string): React.ReactNode => {
  return text.split(' ').map((word, i) => (
    <span key={`${word}-${i.toString()}`} className="mr-2 inline-flex overflow-hidden pb-1">
      <span className="reveal-word inline-block translate-y-[105%] will-change-transform">
        {word}
      </span>
    </span>
  ));
};

interface ExperienceProps {
  triggerLineRef: React.RefObject<HTMLDivElement | null>;
  timelineSvgRef: React.RefObject<SVGSVGElement | null>;
  timelinePathRef: React.RefObject<SVGPathElement | null>;
}

export const Experience: React.FC<ExperienceProps> = ({
  triggerLineRef,
  timelineSvgRef,
  timelinePathRef
}) => {
  return (
    <section
      id="experience"
      className="border-white/5 border-y bg-[#0c0b14]/30 py-20 md:py-28 lg:py-36"
    >
      <Container>
        <div className="mb-20 text-center">
          <span className="glow-purple mb-3 block font-bold text-[#8b5cf6] text-xs uppercase tracking-[0.25em]">
            CAREER TIMELINE
          </span>
          <h2 className="reveal-container font-[family-name:var(--font-raleway)] font-extrabold text-3xl text-white md:text-5xl">
            {splitTextToSpans('Professional Journey')}
          </h2>
          <div className="mx-auto mt-6 h-1 w-12 bg-[#8b5cf6]" />
        </div>

        <div ref={triggerLineRef} className="relative mx-auto max-w-4xl pl-8 md:pl-0">
          {/* SVG Scroll Line Overlay */}
          <div className="absolute top-0 bottom-0 left-[8px] z-0 hidden w-[2px] transform md:left-1/2 md:block md:-translate-x-1/2">
            <svg
              ref={timelineSvgRef}
              className="h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 2 100"
              fill="none"
            >
              <line x1="1" y1="0" x2="1" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
              <path
                ref={timelinePathRef}
                d="M 1 0 L 1 100"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Fallback vertical static bar for mobile */}
          <div className="absolute top-0 bottom-0 left-[8px] w-[2px] bg-white/5 md:hidden" />

          <div className="space-y-16">
            {experiences.map((exp, index) => {
              const isEven = index % 2 === 0;
              return (
                <div
                  key={exp.role}
                  className={`timeline-item relative flex flex-col items-start md:flex-row md:items-center ${
                    isEven ? 'md:justify-start' : 'md:justify-end'
                  }`}
                >
                  {/* Circle Indicator */}
                  <div className="timeline-dot absolute left-[3px] z-20 h-[12px] w-[12px] rounded-full border-2 border-[#8b5cf6] bg-[#05040a] transition-all duration-300 md:left-1/2 md:-translate-x-1/2" />

                  {/* Timeline card */}
                  <div
                    className={`glass-card w-full rounded-xl border border-white/5 bg-[#0e0c1a]/40 p-6 md:w-[45%] ${
                      isEven ? 'md:mr-auto' : 'md:ml-auto'
                    }`}
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-semibold text-[#06b6d4] text-xs uppercase tracking-wider">
                        <Briefcase className="h-3.5 w-3.5" /> {exp.period}
                      </span>
                      <span className="rounded border border-white/5 bg-white/5 px-2 py-0.5 font-medium text-[10px] text-zinc-400 uppercase">
                        Full-Time
                      </span>
                    </div>
                    <h3 className="mb-1 font-bold text-lg text-white">{exp.role}</h3>
                    <h4 className="mb-4 font-semibold text-sm text-zinc-400">{exp.company}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">{exp.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};
