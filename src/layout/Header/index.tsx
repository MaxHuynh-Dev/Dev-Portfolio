'use client';

import { ROUTER } from '@Constants/router';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

function Header(): React.ReactElement {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 20);

      // Simple active section detection
      const sections = ROUTER.map((item) => item.href.replace('#', ''));
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const target = document.getElementById(targetId);
      if (target) {
        setIsMobileMenuOpen(false);
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
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? 'h-16 border-white/5 border-b bg-[#05040a]/80 shadow-lg shadow-purple-500/5 backdrop-blur-xl'
          : 'h-20 bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 md:px-12 lg:px-16">
        {/* Logo */}
        {/* biome-ignore lint/a11y/useValidAnchor: anchor navigation to section */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, '#home')}
          className="group relative z-50 flex items-center gap-1"
        >
          <span className="font-[family-name:var(--font-raleway)] font-extrabold text-2xl text-white tracking-tight">
            Alex
          </span>
          <span className="font-[family-name:var(--font-raleway)] font-extrabold text-2xl text-[#8b5cf6] tracking-tight transition-colors duration-300 group-hover:text-[#06b6d4]">
            .dev
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 lg:flex">
          {ROUTER.map((item) => {
            const sectionId = item.href.replace('#', '');
            const isActive = activeSection === sectionId;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`group relative px-4 py-2 font-medium text-sm transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <span className="glow-purple absolute bottom-1 left-1/2 h-[4px] w-[4px] -translate-x-1/2 rounded-full bg-[#8b5cf6]" />
                )}
                <span className="absolute bottom-1 left-1/2 h-[4px] w-0 -translate-x-1/2 rounded-full bg-[#06b6d4] opacity-0 transition-all duration-300 group-hover:w-4 group-hover:opacity-100" />
              </a>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* biome-ignore lint/a11y/useValidAnchor: anchor navigation to section */}
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 px-6 font-medium text-white text-xs tracking-wider transition-all duration-300 hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/10"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              LET'S TALK
              <span className="glow-cyan h-1.5 w-1.5 animate-pulse rounded-full bg-[#06b6d4]" />
            </span>
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/5 lg:hidden"
          aria-label="Toggle menu"
        >
          <div className="flex w-6 flex-col items-end gap-[5px]">
            <span
              className={`h-[2px] rounded-full bg-white transition-all duration-300 ${
                isMobileMenuOpen ? 'w-full translate-y-[7px] rotate-45' : 'w-full'
              }`}
            />
            <span
              className={`h-[2px] rounded-full bg-[#8b5cf6] transition-all duration-300 ${
                isMobileMenuOpen ? 'w-full opacity-0' : 'w-4'
              }`}
            />
            <span
              className={`h-[2px] rounded-full bg-white transition-all duration-300 ${
                isMobileMenuOpen ? 'w-full -translate-y-[7px] -rotate-45' : 'w-full'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#05040a]/98 backdrop-blur-2xl transition-all duration-500 lg:hidden ${
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex h-full flex-col items-center justify-center gap-8">
          {ROUTER.map((item, index) => {
            const sectionId = item.href.replace('#', '');
            const isActive = activeSection === sectionId;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`font-semibold text-2xl transition-all duration-300 ${
                  isActive ? 'text-[#8b5cf6]' : 'text-white hover:text-[#06b6d4]'
                }`}
                style={{
                  transitionDelay: isMobileMenuOpen ? `${String(index * 50)}ms` : '0ms',
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(16px)'
                }}
              >
                {item.label}
              </a>
            );
          })}

          <div
            className="mt-6 transition-all duration-300"
            style={{
              transitionDelay: isMobileMenuOpen ? `${String(ROUTER.length * 50)}ms` : '0ms',
              opacity: isMobileMenuOpen ? 1 : 0,
              transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(16px)'
            }}
          >
            {/* biome-ignore lint/a11y/useValidAnchor: anchor navigation to section */}
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-8 font-semibold text-sm text-white transition-all duration-300 hover:bg-[#8b5cf6]/20"
            >
              <span>GET IN TOUCH</span>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
