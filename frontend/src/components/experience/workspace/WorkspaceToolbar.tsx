import React, { useState } from 'react';
import { Search, Filter, LayoutGrid, List, Command, X } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
}

export interface WorkspaceToolbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onCommandPaletteOpen?: () => void;
  className?: string;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search workspace assets & skills...',
  filterOptions = [],
  activeFilter = 'all',
  onFilterChange,
  viewMode,
  onViewModeChange,
  onCommandPaletteOpen,
  className = '',
}) => {
  const [internalQuery, setInternalQuery] = useState(searchQuery);

  const handleQueryChange = (val: string) => {
    setInternalQuery(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <div
      className={`p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3 ${className}`}
    >
      {/* Search Input Bar */}
      <div className="relative w-full md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurora-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={internalQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-9 py-2 bg-aurora-canvas/60 border border-aurora-line focus:border-indigo-400 rounded-xl text-xs text-aurora-ink placeholder-slate-500 focus:outline-none transition-all"
        />
        {internalQuery && (
          <button
            onClick={() => handleQueryChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-aurora-muted hover:text-aurora-indigo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Filter Pills */}
      {filterOptions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-aurora-muted shrink-0 mr-1 hidden sm:block" />
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onFilterChange && onFilterChange(opt.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize shrink-0 transition-all ${
                activeFilter === opt.id
                  ? 'text-white [background:var(--aurora-gradient-action)] shadow-aurora-sm'
                  : 'bg-aurora-canvas/60 text-aurora-muted hover:text-aurora-indigo border border-aurora-line'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Right Controls: Command Palette & View Mode */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {onCommandPaletteOpen && (
          <button
            onClick={onCommandPaletteOpen}
            className="px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-line text-xs font-medium text-aurora-muted flex items-center gap-2 transition-colors"
          >
            <Command className="w-3.5 h-3.5 text-aurora-violet" />
            <span className="hidden sm:inline">Commands</span>
            <kbd className="px-1.5 py-0.5 rounded bg-aurora-canvas text-[10px] text-aurora-muted">
              ⌘K
            </kbd>
          </button>
        )}

        {viewMode && onViewModeChange && (
          <div className="flex items-center gap-1 bg-aurora-canvas/60 p-1 rounded-xl border border-aurora-line">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'text-white [background:var(--aurora-gradient-action)]' : 'text-aurora-muted hover:text-aurora-indigo'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'text-white [background:var(--aurora-gradient-action)]' : 'text-aurora-muted hover:text-aurora-indigo'
              }`}
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
