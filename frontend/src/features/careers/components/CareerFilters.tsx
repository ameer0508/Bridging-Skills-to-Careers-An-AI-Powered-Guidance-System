import React from 'react';
import { SearchInput } from '../../../components/base/Input/SearchInput';
import { Select } from '../../../components/base/Select';
import { Chip } from '../../../components/base/Chip';

export interface CareerFiltersProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  compareCount?: number;
  onOpenCompare?: () => void;
}

export const CareerFilters: React.FC<CareerFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  compareCount = 0,
  onOpenCompare,
}) => {
  const sortOptions = [
    { value: 'matchScore-desc', label: 'Match Score (Highest)' },
    { value: 'confidence-desc', label: 'Confidence (Highest)' },
    { value: 'title-asc', label: 'Title (A-Z)' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Sort, Compare CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            placeholder="Search role title, category, or skills..."
            fullWidth
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {compareCount > 0 && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="px-3 py-2 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] text-[var(--color-text-on-primary)] shadow-sm hover:bg-[var(--color-interactive-primary-hover)] transition-colors cursor-pointer"
            >
              Compare Selected ({compareCount})
            </button>
          )}

          <div className="w-48">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
              selectSize="md"
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        <span className="text-xs font-semibold text-[var(--color-text-tertiary)] shrink-0 mr-1">
          Categories:
        </span>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <Chip
              key={cat}
              variant="interactive"
              onClick={() => onSelectCategory(cat)}
              className={
                isSelected
                  ? 'bg-[var(--color-interactive-primary)] text-[var(--color-text-on-primary)] border-[var(--color-interactive-primary)] font-semibold'
                  : 'bg-[var(--color-bg-surface-sunken)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
              }
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Chip>
          );
        })}
      </div>
    </div>
  );
};

CareerFilters.displayName = 'CareerFilters';
