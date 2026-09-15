import { Container } from '@Components/Container';
import { ArrowUpRight, Code2, ExternalLink } from 'lucide-react';
import type React from 'react';
import { projects } from './constants';

const splitTextToSpans = (text: string): React.ReactNode => {
  return text.split(' ').map((word, i) => (
    <span key={`${word}-${i.toString()}`} className="mr-2 inline-flex overflow-hidden pb-1">
      <span className="reveal-word inline-block translate-y-[105%] will-change-transform">
        {word}
      </span>
    </span>
  ));
};

export const Projects: React.FC = () => {
  return (
    <section id="projects" className="bg-[#05040a] py-20 md:py-28 lg:py-36">
      <Container>
        <div className="mb-16">
          <span className="glow-cyan mb-3 block font-bold text-[#06b6d4] text-xs uppercase tracking-[0.25em]">
            SELECTED PROJECTS
          </span>
          <h2 className="reveal-container mb-4 font-[family-name:var(--font-raleway)] font-extrabold text-3xl text-white md:text-5xl">
            {splitTextToSpans('Visualizing Creations & Experiments')}
          </h2>
          <p className="max-w-xl text-zinc-400">
            A curated catalog of tools, web-apps, and creative animations showcasing
            performance-oriented design and motion mechanics.
          </p>
        </div>

        {/* Stacking Cards List */}
        <div className="stacking-cards-container relative gap-12">
          {projects.map((proj, i) => (
            <div
              key={proj.id}
              style={{ '--card-index': i } as React.CSSProperties}
              className="project-card sticky-card group glass-card relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0c0b14]/50 shadow-2xl transition-colors duration-500 hover:border-[#8b5cf6]/20 md:sticky lg:flex-row"
            >
              {/* Left - Narrative Info */}
              <div className="flex w-full flex-col justify-between p-6 md:p-8 lg:w-[50%] lg:p-12">
                <div>
                  <h3 className="mb-3 font-[family-name:var(--font-raleway)] font-bold text-white text-xl transition-colors duration-300 group-hover:text-[#8b5cf6] md:text-2xl">
                    {proj.title}
                  </h3>
                  <p className="mb-6 text-sm text-zinc-400 leading-relaxed">{proj.description}</p>
                </div>

                <div className="mt-auto flex items-center gap-6">
                  <a
                    href={proj.link}
                    className="inline-flex items-center gap-1 font-semibold text-white text-xs transition-colors duration-300 group-hover:text-[#8b5cf6]"
                  >
                    Live Preview <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <a
                    href={proj.code}
                    className="inline-flex items-center gap-1 font-semibold text-xs text-zinc-400 transition-colors duration-300 hover:text-white"
                  >
                    GitHub Repo <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Right - Code Editor Preview */}
              <div className="relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden border-white/5 border-t bg-black/50 lg:aspect-auto lg:w-[50%] lg:border-t-0 lg:border-l">
                {/* Visual Header bar */}
                <div className="flex h-8 items-center justify-between border-white/5 border-b bg-black/30 px-4">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500/50" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                    <div className="h-2 w-2 rounded-full bg-green-500/50" />
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                    <Code2 className="h-3 w-3 text-[#8b5cf6]" /> component.ts
                  </span>
                </div>

                {/* Highlight gradient back */}
                <div
                  className={`absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-gradient-to-br ${proj.gradient} opacity-25 blur-[50px] transition-transform duration-700 group-hover:scale-125`}
                />

                {/* Code body block */}
                <pre className="relative z-10 select-none overflow-x-auto p-5 font-mono text-[10px] text-zinc-500 leading-relaxed lg:p-8">
                  <code className="text-zinc-400">{proj.previewCode}</code>
                </pre>

                {/* Visual Tag */}
                <div className="absolute top-12 right-4 z-20 flex flex-col gap-2">
                  {proj.tags.map((tag) => (
                    <span
                      key={tag}
                      className="select-none rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-zinc-400 backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
