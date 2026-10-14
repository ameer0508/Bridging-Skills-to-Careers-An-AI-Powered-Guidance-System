import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell, LogOut, Menu, Search, Sparkles, Target, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/base/Avatar';
import apiClient from '../../lib/axios';

export interface TopBarProps {
  onOpenMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

/** Page names, grouped as in the sidebar. */
const ROUTE_TITLES: Record<string, { title: string; group: string }> = {
  '/home': { title: 'Command Center', group: 'Overview' },
  '/ai': { title: 'AI Command Center', group: 'Overview' },
  '/recommendations': { title: 'Recommendations', group: 'Overview' },
  '/resume': { title: 'Resume Intelligence', group: 'Discover' },
  '/skills': { title: 'Skill Intelligence', group: 'Discover' },
  '/careers': { title: 'Career Intelligence', group: 'Discover' },
  '/readiness': { title: 'Career Readiness', group: 'Discover' },
  '/career-lab': { title: 'Career Lab', group: 'Discover' },
  '/career-domains': { title: 'More Career Domains', group: 'Discover' },
  '/resume-language': { title: 'Resume Language Check', group: 'Discover' },
  '/roadmap': { title: 'Learning Roadmap', group: 'Learn & build' },
  '/activity': { title: 'Learning Activity', group: 'Learn & build' },
  '/portfolio': { title: 'Portfolio', group: 'Learn & build' },
  '/exams': { title: 'Exam Practice', group: 'Learn & build' },
  '/analytics': { title: 'Progress Analytics', group: 'Learn & build' },
  '/interview-agent': { title: 'Interview Prep', group: 'Practice & apply' },
  '/interviews': { title: 'Interviews', group: 'Practice & apply' },
  '/job-agent': { title: 'Job Search', group: 'Practice & apply' },
  '/opportunities': { title: 'Job Search', group: 'Practice & apply' },
  '/applications': { title: 'Applications', group: 'Practice & apply' },
  '/application-outcomes': { title: 'Application Outcomes', group: 'Practice & apply' },
  '/employer-postings': { title: 'Employer Postings', group: 'Practice & apply' },
  '/orchestrator': { title: 'Agent Orchestrator', group: 'Practice & apply' },
  '/market': { title: 'Market Evidence', group: 'Market' },
  '/market/salaries': { title: 'Salary Insights', group: 'Market' },
  '/ai-observability': { title: 'AI Observability', group: 'Administration' },
  '/profile': { title: 'Profile & Settings', group: 'Account' },
  '/settings': { title: 'Settings', group: 'Account' },
};

const titleFor = (path: string) =>
  ROUTE_TITLES[path] ?? Object.entries(ROUTE_TITLES).find(([route]) => route !== '/' && path.startsWith(`${route}/`))?.[1] ?? { title: 'SkillBridge', group: 'Workspace' };

const iconButton =
  'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-aurora-muted transition-colors hover:bg-white hover:text-aurora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet';

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileSidebar, onOpenCommandPalette }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const clearSession = useAuthStore(state => state.clearSession);
  const user = useAuthStore(state => state.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = titleFor(location.pathname);

  // Real unread notifications; refreshed with the activity page and when the tab regains focus
  const unread = useQuery<number>({
    queryKey: ['activity', 'unread'],
    queryFn: async () => (await apiClient.get('/activity/unread-count')).data.data.unreadCount,
    staleTime: 60_000,
  });
  const unreadCount = unread.data ?? 0;

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sb-aurora sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-aurora-line/70 bg-aurora-canvas/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onOpenMobileSidebar} aria-label="Open navigation" className={`${iconButton} md:hidden`}>
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-aurora-muted sm:block">{current.group}</p>
          <p className="truncate font-heading text-lg font-extrabold tracking-tight text-aurora-ink sm:text-xl">{current.title}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Search pages"
          className="hidden h-10 items-center gap-2 rounded-full border border-aurora-line bg-white px-4 text-sm text-aurora-muted shadow-aurora-sm transition-colors hover:border-aurora-lavender hover:text-aurora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet md:inline-flex"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span>Search</span>
          <kbd className="rounded-md border border-aurora-line bg-aurora-canvas px-1.5 py-0.5 font-sans text-[10px] font-semibold text-aurora-muted">Ctrl K</kbd>
        </button>
        <button type="button" onClick={onOpenCommandPalette} aria-label="Search pages" className={`${iconButton} md:hidden`}>
          <Search className="h-[18px] w-[18px]" aria-hidden />
        </button>
        <Link
          to="/ai"
          className="hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-aurora-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet focus-visible:ring-offset-2 [background:var(--aurora-gradient-action)] sm:inline-flex"
        >
          <Sparkles className="h-4 w-4" aria-hidden /> Ask the assistant
        </Link>
        <Link to="/ai" aria-label="Ask the assistant" className={`${iconButton} sm:hidden`}>
          <Sparkles className="h-[18px] w-[18px] text-aurora-violet" aria-hidden />
        </Link>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          data-testid="notification-bell"
          data-unread={unreadCount}
          onClick={() => navigate('/activity')}
          className={iconButton}
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {/* Shown only when there really is something unread */}
          {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-aurora-violet ring-2 ring-aurora-canvas" />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            className="rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-aurora-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet"
          >
            <Avatar name={user?.fullName || user?.email} size="sm" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                initial={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-50 w-64 origin-top-right rounded-3xl border border-aurora-line bg-white p-2 shadow-aurora-lg"
              >
                <div className="border-b border-aurora-line px-3 pb-3 pt-2">
                  <p className="truncate text-sm font-semibold text-aurora-ink">{user?.fullName || 'Your account'}</p>
                  <p className="truncate text-xs text-aurora-muted">{user?.email}</p>
                  {user?.targetRole && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-aurora-violet/[0.08] px-2.5 py-1 text-xs font-semibold text-aurora-indigo">
                      <Target className="h-3.5 w-3.5" aria-hidden /> Goal: {user.targetRole}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-aurora-ink hover:bg-aurora-canvas"
                >
                  <User className="h-4 w-4 text-aurora-violet" aria-hidden /> Profile & Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    clearSession();
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Sign Out
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
