import React from 'react';
import { Chip } from '../../../components/base/Chip';

export interface PromptSuggestionsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  prompts,
  onSelectPrompt,
}) => {
  return (
    <div className="p-4 border-t border-[var(--color-border-subtle)] space-y-2 bg-[var(--color-bg-surface-sunken)]">
      <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider block">
        Suggested Advisory Questions:
      </span>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, i) => (
          <Chip
            key={i}
            variant="interactive"
            onClick={() => onSelectPrompt(p)}
            className="bg-[var(--color-bg-surface-raised)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-interactive-primary)] text-xs"
          >
            {p}
          </Chip>
        ))}
      </div>
    </div>
  );
};

PromptSuggestions.displayName = 'PromptSuggestions';
