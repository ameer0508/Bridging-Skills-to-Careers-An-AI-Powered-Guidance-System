import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Tooltip } from '../../components/base/Tooltip';

export interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
}

/** One navigation link: porcelain when active, with a violet indicator that glides between items. */
export const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, isCollapsed = false, badge, onClick }) => {
  const reduce = useReducedMotion();
  const content = (
    <NavLink
      to={to}
      end={to === '/market'}
      onClick={onClick}
      aria-label={label}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-2xl text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${
          isCollapsed ? 'h-11 justify-center' : 'px-3 py-2.5'
        } ${isActive ? 'text-aurora-indigo' : 'text-aurora-muted hover:bg-white/70 hover:text-aurora-ink'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="aurora-nav-active"
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl border border-aurora-line bg-white shadow-aurora-sm"
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
            />
          )}
          {isActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full [background:var(--aurora-gradient-action)]" />}
          <span className={`relative shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-aurora-violet' : ''}`}>{icon}</span>
          {!isCollapsed && <span className="relative truncate">{label}</span>}
          {!isCollapsed && badge && <span className="relative ml-auto">{badge}</span>}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} position="right" delay={100}>
        {content}
      </Tooltip>
    );
  }
  return content;
};

SidebarItem.displayName = 'SidebarItem';
