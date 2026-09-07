import React, { useState } from 'react';
import { SearchInput } from '../../../components/base/Input/SearchInput';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';

export interface ConversationSummary {
  _id: string;
  title: string;
  careerId?: string;
  createdAt?: string;
}

export interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations = [],
  activeId,
  onSelect,
  onNewChat,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-64 bg-[var(--color-bg-surface-raised)] border-r border-[var(--color-border-default)] flex flex-col shrink-0 h-full rounded-l-[var(--radius-xl)]">
      <div className="p-3 border-b border-[var(--color-border-subtle)] space-y-2">
        <Button variant="primary" size="sm" fullWidth onClick={onNewChat} leftIcon={
          <Icon size="sm">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </Icon>
        }>
          New Conversation
        </Button>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search chats..."
          inputSize="sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-[var(--color-text-tertiary)] italic">
            Loading conversations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--color-text-tertiary)] italic">
            No conversations found.
          </div>
        ) : (
          filtered.map(c => {
            const isActive = c._id === activeId;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => onSelect(c._id)}
                className={`w-full p-2.5 rounded-[var(--radius-md)] text-xs text-left truncate transition-colors cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[var(--color-interactive-primary)] text-[var(--color-text-on-primary)] font-semibold shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-interactive-secondary-hover)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon size="sm" className="shrink-0">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </Icon>
                <span className="truncate">{c.title}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

ConversationSidebar.displayName = 'ConversationSidebar';
