import React from 'react';
import { Button } from '../Button';
import { Icon } from '../../primitives/Icon';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        leftIcon={
          <Icon size="sm">
            <polyline points="15 18 9 12 15 6" />
          </Icon>
        }
      >
        Prev
      </Button>

      {getPages().map((page, index) =>
        page === '...' ? (
          <span key={index} className="px-2 text-xs text-[var(--color-text-tertiary)] select-none">
            ...
          </span>
        ) : (
          <Button
            key={index}
            variant={currentPage === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(page as number)}
            aria-current={currentPage === page ? 'page' : undefined}
            className="min-w-[32px] h-8 px-0"
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        rightIcon={
          <Icon size="sm">
            <polyline points="9 18 15 12 9 6" />
          </Icon>
        }
      >
        Next
      </Button>
    </nav>
  );
};

Pagination.displayName = 'Pagination';
