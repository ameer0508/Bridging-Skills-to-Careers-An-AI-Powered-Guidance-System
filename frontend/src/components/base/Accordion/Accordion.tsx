import React, { useState } from 'react';
import { Icon } from '../../primitives/Icon';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  type?: 'single' | 'multiple';
  defaultExpanded?: string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  type = 'single',
  defaultExpanded = [],
  className = '',
}) => {
  const [expanded, setExpanded] = useState<string[]>(defaultExpanded);

  const toggle = (id: string) => {
    if (type === 'single') {
      setExpanded(expanded.includes(id) ? [] : [id]);
    } else {
      setExpanded(
        expanded.includes(id) ? expanded.filter(i => i !== id) : [...expanded, id]
      );
    }
  };

  return (
    <div className={`divide-y divide-[var(--color-border-subtle)] border-y border-aurora-line ${className}`}>
      {items.map(item => {
        const isExpanded = expanded.includes(item.id);

        return (
          <div key={item.id} className="py-2">
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => toggle(item.id)}
              aria-expanded={isExpanded}
              className="w-full py-2 flex items-center justify-between text-left font-semibold text-sm text-aurora-ink hover:text-aurora-violet transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{item.title}</span>
              <Icon
                size="sm"
                className={`transform transition-transform duration-[var(--duration-normal)] ${
                  isExpanded ? 'rotate-180 text-aurora-violet' : 'text-aurora-muted'
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </Icon>
            </button>
            {isExpanded && (
              <div className="py-2 text-sm text-aurora-muted leading-relaxed animate-fade-in">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

Accordion.displayName = 'Accordion';
