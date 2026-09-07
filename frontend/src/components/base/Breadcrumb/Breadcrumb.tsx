import React from 'react';
import { Icon } from '../../primitives/Icon';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = (
    <Icon size={14} className="text-[var(--color-text-tertiary)]">
      <polyline points="9 18 15 12 9 6" />
    </Icon>
  ),
  className = '',
}) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-medium ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">{separator}</span>}
              {isLast ? (
                <span className="text-[var(--color-text-primary)] font-semibold" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = 'Breadcrumb';
