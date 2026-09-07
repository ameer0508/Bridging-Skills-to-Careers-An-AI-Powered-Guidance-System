import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Code2, Globe, BookOpen, Cpu } from 'lucide-react';

export const ImmersiveFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-950/95 text-slate-400 py-16 px-4 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
        {/* Brand Info */}
        <div className="md:col-span-5 space-y-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight text-white">
                SkillBridge
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-widest text-cyan-400 uppercase -mt-1 flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 inline" /> AI Intelligence OS
              </span>
            </div>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Bridging skills to careers with intelligent resume analysis, vector similarity matching, and adaptive learning roadmaps.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All Systems Operational (v1.0.0)</span>
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="#platform" className="hover:text-white transition-colors">
                Career Universe
              </a>
            </li>
            <li>
              <a href="#digital-twin" className="hover:text-white transition-colors">
                Digital Twin
              </a>
            </li>
            <li>
              <a href="#live-ai" className="hover:text-white transition-colors">
                Live AI Engine
              </a>
            </li>
            <li>
              <a href="#transformation" className="hover:text-white transition-colors">
                Methodology
              </a>
            </li>
            <li>
              <a href="#agents" className="hover:text-white transition-colors">
                Agent Constellation
              </a>
            </li>
          </ul>
        </div>

        {/* Product Access */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Access</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/login" className="hover:text-white transition-colors">
                Sign In
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-white transition-colors">
                Get Started
              </Link>
            </li>
            <li>
              <Link to="/home" className="hover:text-white transition-colors">
                Dashboard Console
              </Link>
            </li>
          </ul>
        </div>

        {/* Developer & Specs */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Developer & Specs</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>GitHub Repository</span>
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>LinkedIn Platform</span>
              </a>
            </li>
            <li>
              <a
                href="/docs/API_REFERENCE.md"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>API Documentation</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 font-mono">
        <span>© {new Date().getFullYear()} SkillBridge Platform. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Security Specification</span>
        </div>
      </div>
    </footer>
  );
};
