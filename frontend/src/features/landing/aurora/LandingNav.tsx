import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { BrandLockup } from '../../../design/aurora/Brand';
import { auroraButtonClass } from '../../../design/aurora/buttonStyles';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#career-lab', label: 'Career Lab' },
  { href: '#learn', label: 'Learn & build' },
  { href: '#interviews', label: 'Interviews' },
  { href: '#trust', label: 'Transparency' },
];

/** Floating navigation: transparent over the hero, porcelain once the page scrolls. */
export const LandingNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open ? 'border-b border-aurora-line bg-white/85 shadow-aurora-sm backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet" aria-label="SkillBridge home">
          <BrandLockup />
        </Link>
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map(l => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-aurora-muted transition-colors hover:bg-aurora-sidebar hover:text-aurora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 sm:flex">
          <Link to="/login" className={auroraButtonClass('ghost')}>
            Sign in
          </Link>
          <Link to="/register" className={auroraButtonClass('primary')}>
            Start Your Journey
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-aurora-line bg-white text-aurora-ink shadow-aurora-sm sm:hidden lg:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            id="landing-mobile-menu"
            initial={reduce ? undefined : { opacity: 0, y: -8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-aurora-line bg-white px-4 pb-6 pt-2 sm:hidden"
          >
            <ul className="flex flex-col">
              {LINKS.map(l => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium text-aurora-ink hover:bg-aurora-sidebar">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" className={auroraButtonClass('secondary')}>
                Sign in
              </Link>
              <Link to="/register" className={auroraButtonClass('primary')}>
                Start
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
