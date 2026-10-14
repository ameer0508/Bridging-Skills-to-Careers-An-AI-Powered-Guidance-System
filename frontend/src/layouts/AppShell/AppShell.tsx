import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { TopBar } from '../Header';
import { WorkspaceContainer } from '../WorkspaceContainer';
import { CommandPalette, CommandItem } from '../../components/composite/CommandPalette';
import { ToastProvider } from '../../components/composite/Toast';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuthStore } from '../../store/authStore';
import { CareerDomainOnboardingModal } from '../../features/onboarding/components/CareerDomainOnboardingModal';

export interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShellContent: React.FC<AppShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isLaptop, isMobile } = useBreakpoint();
  const { user, isHydrated, fetchCurrentUser, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      fetchCurrentUser();
    }
  }, [accessToken, fetchCurrentUser]);

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sb-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Responsive sidebar collapse adjustment
  useEffect(() => {
    if (isLaptop) {
      setIsCollapsed(true);
    }
  }, [isLaptop]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sb-sidebar-collapsed', JSON.stringify(next));
      return next;
    });
  };

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation commands for Command Palette
  const commands: CommandItem[] = [
    {
      id: 'nav-home',
      label: 'Go to Home Command Center',
      category: 'Navigation',
      shortcut: '⌘1',
      onSelect: () => navigate('/home'),
    },
    {
      id: 'nav-ai',
      label: 'Go to AI Command Center',
      category: 'AI Engine',
      shortcut: '⌘2',
      onSelect: () => navigate('/ai'),
    },
    {
      id: 'nav-recommendations',
      label: 'Go to AI Recommendations',
      category: 'AI Engine',
      shortcut: '⌘3',
      onSelect: () => navigate('/recommendations'),
    },
    {
      id: 'nav-careers',
      label: 'Go to Career Intelligence',
      category: 'Career Path',
      shortcut: '⌘4',
      onSelect: () => navigate('/careers'),
    },
    {
      id: 'nav-readiness',
      label: 'Go to Career Readiness',
      category: 'Career Path',
      shortcut: '⌘5',
      onSelect: () => navigate('/readiness'),
    },
    {
      id: 'nav-roadmap',
      label: 'Go to Learning Roadmap',
      category: 'Career Path',
      shortcut: '⌘6',
      onSelect: () => navigate('/roadmap'),
    },
    {
      id: 'nav-skills',
      label: 'Go to Skill Intelligence',
      category: 'Skills & Telemetry',
      shortcut: '⌘7',
      onSelect: () => navigate('/skills'),
    },
    {
      id: 'nav-analytics',
      label: 'Go to Progress Analytics',
      category: 'Skills & Telemetry',
      shortcut: '⌘8',
      onSelect: () => navigate('/analytics'),
    },
    {
      id: 'nav-resume',
      label: 'Go to Resume Intelligence',
      category: 'Profile & Identity',
      onSelect: () => navigate('/resume'),
    },
    {
      id: 'nav-profile',
      label: 'Go to Profile & Settings',
      category: 'Profile & Identity',
      onSelect: () => navigate('/profile'),
    },
  ];

  return (
    <div className="sb-aurora flex h-screen w-screen overflow-hidden bg-aurora-canvas font-sans text-aurora-ink antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-aurora-indigo focus:shadow-aurora-lg focus:outline-none focus:ring-2 focus:ring-aurora-violet"
      >
        Skip to content
      </a>
      {/* PERSISTENT AI SIDEBAR */}
      <Sidebar
        isCollapsed={isMobile ? false : isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <TopBar
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <WorkspaceContainer>{children}</WorkspaceContainer>
      </div>

      {/* COMMAND PALETTE OVERLAY */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />

      {/* CAREER DOMAIN ONBOARDING MODAL */}
      <CareerDomainOnboardingModal
        isOpen={Boolean(isHydrated && user && !user.onboardingCompleted)}
      />

    </div>
  );
};

export const AppShell: React.FC<AppShellProps> = (props) => {
  return (
    <ToastProvider>
      <AppShellContent {...props} />
    </ToastProvider>
  );
};

AppShell.displayName = 'AppShell';
