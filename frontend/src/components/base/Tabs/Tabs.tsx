import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  variant?: 'underline' | 'pill';
  activeTabId?: string;
  defaultTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  variant = 'underline',
  activeTabId,
  defaultTabId,
  onTabChange,
  className = '',
}) => {
  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : '')
  );

  const currentActiveId = activeTabId !== undefined ? activeTabId : internalActiveId;

  const handleSelect = (id: string) => {
    if (activeTabId === undefined) {
      setInternalActiveId(id);
    }
    onTabChange?.(id);
  };

  const isUnderline = variant === 'underline';

  return (
    <div className={`w-full ${className}`}>
      <div
        role="tablist"
        aria-label="Tabs"
        className={`flex items-center gap-1 overflow-x-auto custom-scrollbar ${
          isUnderline
            ? 'border-b border-[var(--color-border-subtle)] pb-px'
            : 'bg-[var(--color-bg-surface-sunken)] p-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]'
        }`}
      >
        {tabs.map(tab => {
          const isActive = tab.id === currentActiveId;

          const underlineClasses = isActive
            ? 'border-b-2 border-[var(--color-interactive-primary)] text-[var(--color-interactive-primary)] font-semibold'
            : 'border-b-2 border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium';

          const pillClasses = isActive
            ? 'bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] shadow-sm font-semibold'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium';

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && handleSelect(tab.id)}
              className={`px-4 py-2 text-sm flex items-center gap-2 transition-all duration-[var(--duration-fast)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                isUnderline ? underlineClasses : pillClasses
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span className="ml-1 shrink-0">{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tabs.map(tab => {
          if (tab.id !== currentActiveId) return null;
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`tabpanel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              className="animate-fade-in"
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';
