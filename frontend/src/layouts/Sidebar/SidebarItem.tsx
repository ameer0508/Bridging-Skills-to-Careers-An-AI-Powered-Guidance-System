import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tooltip } from '../../components/base/Tooltip';

export interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed?: boolean;
  badge?: React.ReactNode;
  isAi?: boolean;
  shortcut?: string;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon,
  label,
  isCollapsed = false,
  badge,
  isAi = false,
  shortcut,
  onClick,
}) => {
  const content = (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all duration-200 group
        ${
          isActive
            ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.15)]'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 hover:border-white/5 border border-transparent'
        }
        ${isAi && !isCollapsed ? 'ring-1 ring-cyan-500/30 bg-cyan-500/5' : ''}
        ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active Accent Bar */}
          {isActive && (
            <motion.span
              layoutId="activeSidebarIndicator"
              className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}

          {/* Icon */}
          <span
            className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isActive
                ? isAi
                  ? 'text-cyan-400'
                  : 'text-indigo-400'
                : isAi
                ? 'text-cyan-400/80 group-hover:text-cyan-300'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            {icon}
          </span>

          {/* Label */}
          {!isCollapsed && (
            <span className="truncate tracking-wide text-xs">{label}</span>
          )}

          {/* Shortcut / Badge */}
          {!isCollapsed && (badge || shortcut) && (
            <div className="ml-auto flex items-center gap-1 shrink-0">
              {badge}
              {shortcut && (
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 group-hover:text-slate-300">
                  {shortcut}
                </span>
              )}
            </div>
          )}
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
