import React from 'react';
import { Search, Filter, SlidersHorizontal, BookOpen, Terminal, Award, FileText } from 'lucide-react';

export interface IntelligenceCategoryFilterProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  statusCounts: {
    active: number;
    saved_for_later: number;
    completed: number;
    dismissed: number;
  };
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const IntelligenceCategoryFilter: React.FC<IntelligenceCategoryFilterProps> = ({
  activeStatus,
  onStatusChange,
  statusCounts,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}) => {
  const statuses = [
    { id: 'active', label: 'Active Queue', count: statusCounts.active },
    { id: 'saved_for_later', label: 'Saved for Later', count: statusCounts.saved_for_later },
    { id: 'completed', label: 'Completed Moves', count: statusCounts.completed },
    { id: 'dismissed', label: 'Dismissed', count: statusCounts.dismissed },
  ];

  const categories = [
    { id: 'all', label: 'All Dimensions', icon: Filter },
    { id: 'Learning Resources', label: 'Learning & Courses', icon: BookOpen },
    { id: 'Projects', label: 'Hands-on Projects', icon: Terminal },
    { id: 'Certifications', label: 'Certifications', icon: Award },
    { id: 'Resume Improvements', label: 'Resume & Profile', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {/* Top Row: Status Tabs + Search + Sort Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 overflow-x-auto custom-scrollbar">
          {statuses.map((tab) => {
            const isActive = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter actions or skills..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-mono text-slate-300 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 hidden sm:inline">Sort:</span>
            <select
              aria-label="Sort by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="impact_desc" className="bg-slate-900 text-white">Highest Impact</option>
              <option value="priority_desc" className="bg-slate-900 text-white">Priority Score</option>
              <option value="time_asc" className="bg-slate-900 text-white">Quickest Win</option>
              <option value="difficulty_asc" className="bg-slate-900 text-white">Difficulty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Spectrum Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-2 transition-all border ${
                isSelected
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IntelligenceCategoryFilter;
