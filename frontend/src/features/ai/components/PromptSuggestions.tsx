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
    <div className="p-4 border-t border-aurora-line space-y-2 bg-[var(--color-bg-surface-sunken)]">
      <span className="text-[10px] uppercase font-bold text-aurora-muted tracking-wider block">
        Suggested Advisory Questions:
      </span>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, i) => (
          <Chip
            key={i}
            variant="interactive"
            onClick={() => onSelectPrompt(p)}
            className="bg-white border-aurora-line text-aurora-muted hover:text-aurora-violet text-xs"
          >
            {p}
          </Chip>
        ))}
      </div>
    </div>
  );
};

PromptSuggestions.displayName = 'PromptSuggestions';
