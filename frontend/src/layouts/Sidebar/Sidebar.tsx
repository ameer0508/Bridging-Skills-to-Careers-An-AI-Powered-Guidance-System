import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Sparkles,
  Compass,
  Award,
  Layers,
  Cpu,
  BarChart3,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  Briefcase,
  Bot,
  MessageSquare,
  GitBranch,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/base/Avatar';
import apiClient from '../../lib/axios';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const { user, clearSession, refreshToken } = useAuthStore();
  const [agentsExpanded, setAgentsExpanded] = useState(true);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Clear session regardless of logout endpoint status
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  // Grouped Navigation Items with Shortcuts
  const navGroups = [
    {
      title: 'MISSION CONTROL',
      items: [
        {
          to: '/home',
          label: 'Home Command Center',
          icon: <Home className="w-4 h-4" />,
          shortcut: '⌘1',
        },
      ],
    },
    {
      title: 'AI ENGINE',
      items: [
        {
          to: '/ai',
          label: 'AI Command Center',
          isAi: true,
          icon: <Sparkles className="w-4 h-4" />,
          shortcut: '⌘2',
        },
        {
          to: '/recommendations',
          label: 'Recommendations',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          shortcut: '⌘3',
        },
      ],
    },
    {
      title: 'CAREER PATH',
      items: [
        {
          to: '/careers',
          label: 'Career Intelligence',
          icon: <Compass className="w-4 h-4" />,
          shortcut: '⌘4',
        },
        {
          to: '/readiness',
          label: 'Career Readiness',
          icon: <Award className="w-4 h-4" />,
          shortcut: '⌘5',
        },
        {
          to: '/roadmap',
          label: 'Learning Roadmap',
          icon: <Layers className="w-4 h-4" />,
          shortcut: '⌘6',
        },
      ],
    },
    {
      title: 'SKILLS & TELEMETRY',
      items: [
        {
          to: '/skills',
          label: 'Skill Intelligence',
          icon: <Cpu className="w-4 h-4" />,
          shortcut: '⌘7',
        },
        {
          to: '/analytics',
          label: 'Progress Analytics',
          icon: <BarChart3 className="w-4 h-4" />,
          shortcut: '⌘8',
        },
      ],
    },
    {
      title: 'INTELLIGENT AGENTS',
      isCollapsible: true,
      items: [
        {
          to: '/job-agent',
          label: 'Job Search Agent',
          icon: <Briefcase className="w-4 h-4 text-cyan-400" />,
        },
        {
          to: '/interview-agent',
          label: 'Interview Prep Agent',
          icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
        },
        {
          to: '/orchestrator',
          label: 'Agent Orchestrator',
          icon: <Bot className="w-4 h-4 text-purple-400" />,
        },
        {
          to: '/github',
          label: 'GitHub Intelligence',
          icon: <GitBranch className="w-4 h-4 text-slate-300" />,
        },
      ],
    },
    {
      title: 'PROFILE & IDENTITY',
      items: [
        {
          to: '/resume',
          label: 'Resume Intelligence',
          icon: <FileText className="w-4 h-4" />,
        },
        {
          to: '/profile',
          label: 'Profile & Settings',
          icon: <User className="w-4 h-4" />,
        },
      ],
    },
  ];

  const sidebarContent = (
    <aside
      role="navigation"
      aria-label="Workspace Navigation Hub"
      className={`h-full bg-slate-950/90 border-r border-white/10 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* BRAND & LOGO HEADER */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 bg-slate-900/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-lg shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-bold font-display text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400 text-xs">
                SB
              </div>
            </div>

            {!isCollapsed && (
              <div className="truncate space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white tracking-tight font-display">
                    SkillBridge
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
                    OS v2.0
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                  <span>AI Engine Online</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* GROUPED NAVIGATION LIST */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          {navGroups.map((group) => {
            const isCollapsible = group.isCollapsible;

            return (
              <div key={group.title} className="space-y-1">
                {!isCollapsed && (
                  <div
                    onClick={() => isCollapsible && setAgentsExpanded(!agentsExpanded)}
                    className={`px-3 py-1 flex items-center justify-between text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase ${
                      isCollapsible ? 'cursor-pointer hover:text-slate-300' : ''
                    }`}
                  >
                    <span>{group.title}</span>
                    {isCollapsible && (
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${agentsExpanded ? 'rotate-90' : ''}`}
                      />
                    )}
                  </div>
                )}
                {(!isCollapsible || agentsExpanded || isCollapsed) &&
                  group.items.map((item) => (
                    <SidebarItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      isCollapsed={isCollapsed}
                      isAi={item.isAi}
                      shortcut={item.shortcut}
                      onClick={onCloseMobile}
                    />
                  ))}
              </div>
            );
          })}
        </nav>
      </div>

      {/* FOOTER USER CARD & LOGOUT */}
      <div className="p-3 border-t border-white/10 bg-slate-900/30">
        <div
          className={`flex items-center justify-between gap-2 p-2 rounded-xl border border-white/5 bg-slate-900/60 ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar name={user?.fullName || user?.email || 'User'} size="sm" />
            {!isCollapsed && (
              <div className="truncate text-left space-y-0.5">
                <p className="text-xs font-bold text-white truncate">
                  {user?.fullName || 'Authenticated User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0 z-40">
        {sidebarContent}
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Mobile Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 h-full max-w-xs w-full shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
