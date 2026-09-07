import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X, Cpu } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export const ImmersiveNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Platform', href: '#platform' },
    { name: 'Intelligence', href: '#live-ai' },
    { name: 'Digital Twin', href: '#digital-twin' },
    { name: 'Methodology', href: '#transformation' },
    { name: 'Agents', href: '#agents' },
    { name: 'CareerOS', href: '#careeros' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pointer-events-none transition-all duration-300"
    >
      <div
        className={`pointer-events-auto flex items-center justify-between w-full max-w-7xl transition-all duration-500 rounded-full border ${
          isScrolled
            ? 'bg-slate-950/85 backdrop-blur-2xl py-3 px-6 border-white/15 shadow-2xl shadow-indigo-950/30'
            : 'bg-slate-900/40 backdrop-blur-md py-4 px-8 border-white/10'
        }`}
      >
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-500 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-extrabold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
              SkillBridge
            </span>
            <span className="text-[9px] font-mono font-semibold tracking-widest text-cyan-400 uppercase -mt-1 flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5 inline" /> AI Intelligence OS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full bg-slate-900/70 border border-white/10 px-4 py-1.5 backdrop-blur-xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Authentication Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/home')}
              className="relative group overflow-hidden rounded-full bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-500 p-px font-medium text-xs text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 transition-all duration-300"
            >
              <span className="flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 group-hover:bg-opacity-80 transition-all">
                <span>Go to App</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-full transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="relative group inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-full bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 text-slate-300 hover:text-white rounded-xl bg-white/5 border border-white/10"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Fullscreen Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto absolute top-20 left-4 right-4 lg:hidden rounded-3xl border border-white/15 bg-slate-950/95 backdrop-blur-3xl p-6 shadow-2xl shadow-black flex flex-col gap-5 z-50"
          >
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-2xl transition-colors flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/home');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Launch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center font-semibold text-sm text-slate-300 hover:text-white border border-white/15 rounded-2xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3.5 text-center font-bold text-sm text-white bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
