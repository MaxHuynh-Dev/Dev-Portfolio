'use client';

import type React from 'react';

const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' }
];

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    )
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  }
];

function Footer(): React.ReactElement {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string): void => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const target = document.getElementById(targetId);
      if (target) {
        if (window.lenis) {
          window.lenis.scrollTo(target, { offset: -80 });
        } else {
          const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  return (
    <footer className="relative overflow-hidden bg-[#05040a]">
      {/* Top gradient accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8b5cf6]/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-8 pt-16 pb-8 lg:px-16">
        {/* Grid layout */}
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12">
          {/* Brand & Narrative */}
          <div className="md:col-span-6 lg:col-span-7">
            {/* biome-ignore lint/a11y/useValidAnchor: anchor navigation to section */}
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, '#home')}
              className="group inline-flex items-center gap-1"
            >
              <span className="font-[family-name:var(--font-raleway)] font-extrabold text-2xl text-white tracking-tight">
                Alex
              </span>
              <span className="font-[family-name:var(--font-raleway)] font-extrabold text-2xl text-[#8b5cf6] tracking-tight transition-colors duration-300 group-hover:text-[#06b6d4]">
                .dev
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm text-zinc-400 leading-relaxed">
              Creative Front-End Developer & UI Engineer. Crafting pixel-perfect layouts,
              interactive digital narratives, and fluid user experiences with code.
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition-all duration-300 hover:scale-105 hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-6 md:col-span-6 md:items-end lg:col-span-5">
            <h3 className="font-semibold text-[#06b6d4] text-sm uppercase tracking-wider">
              Navigation
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:text-right">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-white/5 border-t" />

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Alex Nguyen. All rights reserved.
          </p>

          <p className="flex items-center gap-1 text-xs text-zinc-500">
            Built with
            <span className="font-semibold text-[#f43f5e]">Next.js</span>,
            <span className="font-semibold text-[#8b5cf6]">GSAP</span> &
            <span className="font-semibold text-[#06b6d4]">Tailwind v4</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
