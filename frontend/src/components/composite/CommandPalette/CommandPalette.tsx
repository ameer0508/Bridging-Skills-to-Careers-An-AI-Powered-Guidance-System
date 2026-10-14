import React, { useState, useEffect, useId, useRef } from 'react';
import { useDialogBehaviour } from '../../../design/aurora/useDialogBehaviour';
import { Portal } from '../../primitives/Portal';
import { Icon } from '../../primitives/Icon';

export interface CommandItem {
  id: string;
  label: string;
  category?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: CommandItem[];
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands = [],
  placeholder = 'Type a command or search...',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  // Focus goes to the search field, stays inside, and returns to what opened the palette; Escape closes
  useDialogBehaviour(isOpen, onClose, panelRef, inputRef);

  const filteredCommands = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--modal-backdrop)] backdrop-blur-[var(--blur-md)] flex items-start justify-center pt-[15vh] p-4 animate-fade-in"
        onClick={onClose}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Search pages"
          tabIndex={-1}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xl bg-white border border-aurora-line rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden flex flex-col animate-scale-in"
        >
          {/* Header Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-aurora-line gap-3">
            <Icon size="md" color="#515b80">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Icon>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-label="Search pages"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={filteredCommands[selectedIndex] ? `${listId}-${filteredCommands[selectedIndex].id}` : undefined}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-aurora-ink placeholder-[var(--color-text-tertiary)] focus:outline-none"
            />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-bg-surface-sunken)] border border-aurora-line text-aurora-muted rounded-lg">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <div id={listId} role="listbox" aria-label="Pages" className="max-h-72 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredCommands.length === 0 ? (
              <div className="p-6 text-center text-xs text-aurora-muted">
                No matching commands found.
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={cmd.id}
                    id={`${listId}-${cmd.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      cmd.onSelect();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? '[background:var(--aurora-gradient-action)] text-[var(--color-text-on-primary)] font-semibold'
                        : 'text-aurora-ink hover:bg-[var(--color-interactive-secondary-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {cmd.icon && <span className="shrink-0">{cmd.icon}</span>}
                      <span>{cmd.label}</span>
                      {cmd.category && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                          isSelected ? 'bg-white/80 text-aurora-indigo' : 'bg-[var(--color-bg-surface-sunken)] text-aurora-muted'
                        }`}>
                          {cmd.category}
                        </span>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <span className={`text-[10px] ${isSelected ? 'text-white' : 'text-aurora-muted'}`}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

CommandPalette.displayName = 'CommandPalette';
