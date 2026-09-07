import React from 'react';
import { Card } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Icon } from '../../../components/primitives/Icon';

export interface CareerOption {
  _id: string;
  title: string;
}

export interface LearningWorkspaceHeaderProps {
  careers: Array<{ careerId: CareerOption }>;
  activeCareerId: string | null;
  onSelectCareer: (careerId: string) => void;
  progressPercentage?: number;
  completedTasksCount?: number;
  totalTasksCount?: number;
  totalPhasesCount?: number;
}

export const LearningWorkspaceHeader: React.FC<LearningWorkspaceHeaderProps> = ({
  careers,
  activeCareerId,
  onSelectCareer,
  progressPercentage = 0,
  completedTasksCount = 0,
  totalTasksCount = 0,
  totalPhasesCount = 0,
}) => {
  return (
    <Card variant="elevated" className="p-6 md:p-8 bg-gradient-to-r from-[var(--color-bg-surface-raised)] to-[var(--color-bg-surface)] border-[var(--color-border-default)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="subtle" color="success" icon={
              <Icon size="sm">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </Icon>
            }>
              Sequenced Skill Acquisition
            </Badge>
            <Badge variant="outlined" color="info">
              Dependency Tree Engine
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-display text-[var(--color-text-primary)] tracking-tight">
            Learning Journey Workspace
          </h1>

          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            A strictly-ordered execution plan designed to eliminate your readiness gaps. Completing tasks automatically recalculates your career alignment.
          </p>

          {/* Target Career Selector */}
          {careers && careers.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider block mb-1.5">
                Target Role Roadmap:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {careers.map(c => {
                  const isSelected = activeCareerId === c.careerId._id;
                  return (
                    <button
                      key={c.careerId._id}
                      type="button"
                      onClick={() => onSelectCareer(c.careerId._id)}
                      className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-interactive-primary)] border-[var(--color-interactive-primary)] text-[var(--color-text-on-primary)] shadow-sm'
                          : 'bg-[var(--color-bg-surface-sunken)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      {c.careerId.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Overview Stats Widget */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] w-full md:w-auto shrink-0 text-center">
          <div className="px-3 py-1">
            <div className="text-2xl font-black font-display text-[var(--color-status-success-text)]">
              {progressPercentage}%
            </div>
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-0.5">
              Completed
            </div>
          </div>
          <div className="px-3 py-1 border-x border-[var(--color-border-subtle)]">
            <div className="text-2xl font-black font-display text-[var(--color-interactive-primary)]">
              {completedTasksCount}/{totalTasksCount}
            </div>
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-0.5">
              Tasks Done
            </div>
          </div>
          <div className="px-3 py-1">
            <div className="text-2xl font-black font-display text-[var(--color-ai-text)]">
              {totalPhasesCount}
            </div>
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-0.5">
              Phases
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

LearningWorkspaceHeader.displayName = 'LearningWorkspaceHeader';
