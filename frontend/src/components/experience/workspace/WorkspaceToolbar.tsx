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
      className={`p-3 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3 ${className}`}
    >
      {/* Search Input Bar */}
      <div className="relative w-full md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={internalQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-9 py-2 bg-slate-950/80 border border-white/10 focus:border-indigo-400 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
        />
        {internalQuery && (
          <button
            onClick={() => handleQueryChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Filter Pills */}
      {filterOptions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1 hidden sm:block" />
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onFilterChange && onFilterChange(opt.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize shrink-0 transition-all ${
                activeFilter === opt.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
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
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-300 flex items-center gap-2 transition-colors"
          >
            <Command className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Commands</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}

        {viewMode && onViewModeChange && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
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
