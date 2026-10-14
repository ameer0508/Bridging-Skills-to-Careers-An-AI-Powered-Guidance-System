import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Compass,
  Cpu,
  FileText,
  Flame,
  FlaskConical,
  FolderGit2,
  GraduationCap,
  Home,
  Languages,
  Layers,
  LineChart,
  LogOut,
  MessageSquare,
  Sparkles,
  Target,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/base/Avatar';
import { BrandMark } from '../../design/aurora/Brand';
import apiClient from '../../lib/axios';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const icon = (Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>) => <Icon className="h-[18px] w-[18px]" aria-hidden />;

/** Every destination, grouped along the journey. Labels are the pages' names and are kept stable. */
const buildGroups = (isAdmin: boolean): Array<{ title: string; items: NavItem[] }> => [
  {
    title: 'Overview',
    items: [
      { to: '/home', label: 'Home Command Center', icon: icon(Home) },
      { to: '/ai', label: 'AI Command Center', icon: icon(Sparkles) },
      { to: '/recommendations', label: 'Recommendations', icon: icon(Zap) },
    ],
  },
  {
    title: 'Discover',
    items: [
      { to: '/resume', label: 'Resume Intelligence', icon: icon(FileText) },
      { to: '/skills', label: 'Skill Intelligence', icon: icon(Cpu) },
      { to: '/careers', label: 'Career Intelligence', icon: icon(Compass) },
      { to: '/readiness', label: 'Career Readiness', icon: icon(Award) },
      { to: '/career-lab', label: 'Career Lab', icon: icon(FlaskConical) },
      { to: '/career-domains', label: 'More Career Domains', icon: icon(Compass) },
      { to: '/resume-language', label: 'Resume Language Check', icon: icon(Languages) },
    ],
  },
  {
    title: 'Learn & build',
    items: [
      { to: '/roadmap', label: 'Learning Roadmap', icon: icon(Layers) },
      { to: '/activity', label: 'Learning Activity', icon: icon(Flame) },
      { to: '/portfolio', label: 'Portfolio', icon: icon(FolderGit2) },
      { to: '/exams', label: 'Exam Practice', icon: icon(GraduationCap) },
      { to: '/analytics', label: 'Progress Analytics', icon: icon(BarChart3) },
    ],
  },
  {
    title: 'Practice & apply',
    items: [
      { to: '/interview-agent', label: 'Interview Prep Agent', icon: icon(MessageSquare) },
      { to: '/job-agent', label: 'Job Search Agent', icon: icon(Briefcase) },
      { to: '/applications', label: 'Applications', icon: icon(ClipboardList) },
      { to: '/application-outcomes', label: 'Application Outcomes', icon: icon(Target) },
      { to: '/employer-postings', label: 'Employer Postings', icon: icon(Building2) },
      { to: '/orchestrator', label: 'Agent Orchestrator', icon: icon(Bot) },
    ],
  },
  {
    title: 'Market',
    items: [
      { to: '/market', label: 'Market Evidence', icon: icon(LineChart) },
      { to: '/market/salaries', label: 'Salary Insights', icon: icon(Wallet) },
    ],
  },
  ...(isAdmin ? [{ title: 'Administration', items: [{ to: '/ai-observability', label: 'AI Observability', icon: icon(Activity) }] }] : []),
  {
    title: 'Account',
    items: [{ to: '/profile', label: 'Profile & Settings', icon: icon(User) }],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, isMobileOpen = false, onCloseMobile }) => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { user, clearSession, refreshToken } = useAuthStore();
  const groups = buildGroups(user?.role === 'admin');
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      if (refreshToken) await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // The session is cleared whatever the server says
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  // The phone drawer closes on Escape and takes focus when it opens
  useEffect(() => {
    if (!isMobileOpen) return;
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseMobile?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileOpen, onCloseMobile]);

  const content = (collapsed: boolean, mobile: boolean) => (
    <aside
      aria-label="Main navigation"
      className={`sb-aurora flex h-full flex-col border-r border-aurora-line bg-aurora-sidebar transition-[width] duration-300 ease-out ${collapsed ? 'w-[76px]' : 'w-72'}`}
    >
      <div className={`flex h-[72px] shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between px-5'}`}>
        <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet" aria-label="SkillBridge home">
          <BrandMark />
          {!collapsed && <span className="font-heading text-lg font-extrabold tracking-tight text-aurora-ink">SkillBridge</span>}
        </button>
        {mobile ? (
          <button type="button" onClick={onCloseMobile} aria-label="Close navigation" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-aurora-muted hover:bg-white">
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          !collapsed && (
            <button type="button" onClick={onToggleCollapse} aria-label="Collapse sidebar" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-aurora-muted transition-colors hover:bg-white hover:text-aurora-ink">
              <ChevronsLeft className="h-4 w-4" aria-hidden />
            </button>
          )
        )}
      </div>

      <nav aria-label="Workspace" className="aurora-scroll flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map(group => (
          <div key={group.title}>
            {collapsed ? (
              <div aria-hidden="true" className="mx-auto mb-2 mt-1 h-px w-8 bg-aurora-line" />
            ) : (
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-aurora-muted/80">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(item => (
                <li key={item.to}>
                  <SidebarItem to={item.to} icon={item.icon} label={item.label} isCollapsed={collapsed} onClick={mobile ? onCloseMobile : undefined} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-aurora-line p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={onToggleCollapse} aria-label="Expand sidebar" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-aurora-muted hover:bg-white hover:text-aurora-ink">
              <ChevronsRight className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={handleLogout} aria-label="Sign Out" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-aurora-muted hover:bg-rose-50 hover:text-rose-600">
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-aurora-line bg-white p-2.5 shadow-aurora-sm">
            <Avatar name={user?.fullName || user?.email || 'User'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-aurora-ink">{user?.fullName || 'Your account'}</p>
              <p className="truncate text-xs text-aurora-muted">{user?.email}</p>
            </div>
            <button type="button" onClick={handleLogout} title="Sign Out" aria-label="Sign Out" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-aurora-muted transition-colors hover:bg-rose-50 hover:text-rose-600">
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="sticky top-0 z-40 hidden h-screen shrink-0 md:block">{content(isCollapsed, false)}</div>
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <motion.div
              initial={reduce ? undefined : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-aurora-ink/30 backdrop-blur-sm"
            />
            <motion.div
              ref={drawerRef}
              initial={reduce ? undefined : { x: '-100%' }}
              animate={reduce ? undefined : { x: 0 }}
              exit={reduce ? undefined : { x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              className="relative z-10 h-full shadow-aurora-lg"
            >
              {content(false, true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
