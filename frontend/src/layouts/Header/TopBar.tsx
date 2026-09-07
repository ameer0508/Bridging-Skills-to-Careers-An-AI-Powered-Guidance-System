import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  Menu,
  ChevronRight,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/base/Avatar';

export interface TopBarProps {
  onOpenMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

const routeTitleMap: Record<string, { title: string; category: string }> = {
  '/home': { title: 'Home Command Center', category: 'Mission Control' },
  '/profile': { title: 'Profile & Settings', category: 'Identity' },
  '/careers': { title: 'Career Intelligence', category: 'Analytics' },
  '/readiness': { title: 'Career Readiness', category: 'Assessment' },
  '/skills': { title: 'Skill Intelligence', category: 'Taxonomy' },
  '/recommendations': { title: 'AI Recommendations', category: 'Action Center' },
  '/roadmap': { title: 'Learning Roadmap', category: 'Execution' },
  '/analytics': { title: 'Progress Analytics', category: 'Intelligence' },
  '/ai': { title: 'AI Career Architect', category: 'AI Advisory' },
  '/resume': { title: 'Resume Intelligence', category: 'Document Studio' },
  '/job-agent': { title: 'Job Search Agent', category: 'Intelligent Agents' },
  '/interview-agent': { title: 'Interview Prep Agent', category: 'Intelligent Agents' },
  '/orchestrator': { title: 'Agent Orchestrator', category: 'Intelligent Agents' },
  '/github': { title: 'GitHub Intelligence', category: 'Intelligent Agents' },
};

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileSidebar,
  onOpenCommandPalette,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const currentRoute = routeTitleMap[location.pathname] || {
    title: 'Adaptive Workspace',
    category: 'SkillBridge',
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-slate-950/80 border-b border-white/10 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shadow-lg">
      {/* LEFT: MOBILE TOGGLE & BREADCRUMBS */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open mobile navigation"
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* BREADCRUMBS */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500 font-mono">SkillBridge</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-indigo-400 font-mono">{currentRoute.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white font-bold tracking-tight">{currentRoute.title}</span>
        </nav>
        <div className="sm:hidden font-bold text-sm text-white">
          {currentRoute.title}
        </div>
      </div>

      {/* RIGHT: SEARCH, THEME, NOTIFICATIONS & USER DROPDOWN */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* GLOBAL COMMAND PALETTE SEARCH TRIGGER */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-indigo-500/40 hover:bg-slate-900 transition-all cursor-pointer shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline font-mono">Search platform...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/5 border border-white/10 rounded text-slate-300">
            ⌘K
          </kbd>
        </button>

        {/* THEME TOGGLE */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Current theme ${theme}. Click to change.`}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-cyan-400" />
          ) : theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Monitor className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* NOTIFICATIONS BUTTON */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => navigate('/recommendations')}
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
        </button>

        {/* USER PROFILE DROPDOWN */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/50 transition-all cursor-pointer"
          >
            <Avatar name={user?.fullName || user?.email} size="sm" />
          </button>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-60 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl py-2 z-50 space-y-1"
              >
                <div className="px-4 py-2.5 border-b border-white/10 space-y-0.5">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-cyan-400 font-mono pt-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Systems Architect Track</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full px-4 py-2 text-xs font-semibold text-left text-slate-200 hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Profile & Settings</span>
                </button>

                <div className="my-1 border-t border-white/5" />

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    clearSession();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2 text-xs font-semibold text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

TopBar.displayName = 'TopBar';
