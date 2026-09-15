import { Container } from '@Components/Container';
import { Mail, Send } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

const splitTextToSpans = (text: string): React.ReactNode => {
  return text.split(' ').map((word, i) => (
    <span key={`${word}-${i.toString()}`} className="mr-2 inline-flex overflow-hidden pb-1">
      <span className="reveal-word inline-block translate-y-[105%] will-change-transform">
        {word}
      </span>
    </span>
  ));
};

export const Contact: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setFormStatus('success');
    setTimeout(() => {
      setFormStatus('idle');
      setFormState({ name: '', email: '', message: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="bg-[#05040a] py-20 md:py-28 lg:py-36">
      <Container>
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Header */}
          <div className="lg:col-span-5">
            <span className="glow-rose mb-3 block font-bold text-[#f43f5e] text-xs uppercase tracking-[0.25em]">
              GET IN TOUCH
            </span>
            <h2 className="reveal-container mb-6 font-[family-name:var(--font-raleway)] font-extrabold text-3xl text-white md:text-5xl">
              {splitTextToSpans("Let's construct something extraordinary.")}
            </h2>
            <div className="mb-8 h-1 w-12 bg-[#f43f5e]" />
            <p className="mb-8 text-zinc-400 leading-relaxed">
              Whether you have an upcoming project, want to discuss web architectures, or simply
              wish to say hello, feel free to drop a message. I will get back to you as soon as
              possible.
            </p>

            {/* Direct email display */}
            <a
              href="mailto:hello@alexnguyen.dev"
              className="group flex w-fit items-center gap-3 rounded-xl border border-white/5 bg-[#0e0c1a]/40 p-4 transition-all duration-300 hover:border-[#f43f5e]/30"
            >
              <div className="rounded-lg bg-[#f43f5e]/10 p-2.5 text-[#f43f5e]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                  Write an Email
                </h4>
                <span className="font-semibold text-sm text-white transition-colors duration-300 group-hover:text-[#f43f5e]">
                  hello@alexnguyen.dev
                </span>
              </div>
            </a>
          </div>

          {/* Right Contact Form */}
          <div className="lg:col-span-7">
            <div className="glass-card glow-rose rounded-2xl border border-white/5 bg-[#0e0c1a]/40 p-8">
              {formStatus === 'success' ? (
                <div className="py-12 text-center">
                  <div className="glow-cyan mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#06b6d4]/10 text-[#06b6d4]">
                    <Send className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="mb-2 font-bold text-white text-xl">Message Sent Successfully!</h3>
                  <p className="mx-auto max-w-xs text-sm text-zinc-400">
                    Thank you, Alex. I will review your information and get back to you within 24
                    hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="name"
                        className="font-mono text-xs text-zinc-500 uppercase tracking-widest"
                      >
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e): void => {
                          setFormState((prev) => ({ ...prev, name: e.target.value }));
                        }}
                        className="rounded-lg border border-white/5 bg-black/40 px-4 py-3 text-sm text-white transition-all duration-300 focus:border-[#f43f5e] focus:outline-none focus:ring-1 focus:ring-[#f43f5e]"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="email"
                        className="font-mono text-xs text-zinc-500 uppercase tracking-widest"
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e): void => {
                          setFormState((prev) => ({ ...prev, email: e.target.value }));
                        }}
                        className="rounded-lg border border-white/5 bg-black/40 px-4 py-3 text-sm text-white transition-all duration-300 focus:border-[#f43f5e] focus:outline-none focus:ring-1 focus:ring-[#f43f5e]"
                        placeholder="your.email@domain.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="message"
                      className="font-mono text-xs text-zinc-500 uppercase tracking-widest"
                    >
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={formState.message}
                      onChange={(e): void => {
                        setFormState((prev) => ({ ...prev, message: e.target.value }));
                      }}
                      className="resize-none rounded-lg border border-white/5 bg-black/40 px-4 py-3 text-sm text-white transition-all duration-300 focus:border-[#f43f5e] focus:outline-none focus:ring-1 focus:ring-[#f43f5e]"
                      placeholder="Hello Alex, I'd like to talk about..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="group glow-rose inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f43f5e] font-semibold text-sm text-white transition-all duration-300 hover:bg-[#e11d48]"
                  >
                    Send Message{' '}
                    <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
