import React from 'react';
import { ComprehensiveAdaptiveWorkspaceState } from './AdaptiveWorkspaceEngine';
import { AdaptiveModuleContainer } from './AdaptiveModuleContainer';
import { PriorityFocusCard } from './PriorityFocusCard';
import { SmartInsightFeed } from './SmartInsightFeed';

export interface AdaptiveLayoutComposerProps {
  state: ComprehensiveAdaptiveWorkspaceState;
  heroModule: React.ReactNode;
  momentumModule: React.ReactNode;
  prioritiesModule: React.ReactNode;
  milestoneModule: React.ReactNode;
  timelineModule: React.ReactNode;
  onExecuteFocusAction?: () => void;
  className?: string;
}

export const AdaptiveLayoutComposer: React.FC<AdaptiveLayoutComposerProps> = ({
  state,
  heroModule,
  momentumModule,
  prioritiesModule,
  milestoneModule,
  timelineModule,
  onExecuteFocusAction,
  className = '',
}) => {
  const { prioritization, layoutConfig } = state;

  const renderModuleById = (moduleId: string) => {
    switch (moduleId) {
      case 'hero':
        return (
          <AdaptiveModuleContainer
            key="hero"
            id="hero-module"
            title="Flagship AI Command Center"
            isPrioritized={layoutConfig.highlightedSectionId === 'hero-module'}
          >
            {heroModule}
          </AdaptiveModuleContainer>
        );

      case 'focus':
        return (
          <AdaptiveModuleContainer
            key="focus"
            id="focus-module"
            title="Primary Strategic Focus"
            isPrioritized={layoutConfig.highlightedSectionId === 'focus-module'}
            explanation={prioritization.explanation}
          >
            <PriorityFocusCard
              prioritization={prioritization}
              onTakeAction={onExecuteFocusAction}
            />
          </AdaptiveModuleContainer>
        );

      case 'momentum':
        return (
          <AdaptiveModuleContainer
            key="momentum"
            id="momentum-module"
            title="Real-Time Career Momentum"
            isPrioritized={layoutConfig.highlightedSectionId === 'momentum-module'}
          >
            {momentumModule}
          </AdaptiveModuleContainer>
        );

      case 'priorities':
        return (
          <AdaptiveModuleContainer
            key="priorities"
            id="priorities-module"
            title="Action Priorities & Wins"
            isPrioritized={layoutConfig.highlightedSectionId === 'priorities-module'}
          >
            {prioritiesModule}
          </AdaptiveModuleContainer>
        );

      case 'milestone':
        return (
          <AdaptiveModuleContainer
            key="milestone"
            id="milestone-module"
            title="Next Learning Milestone"
            isPrioritized={layoutConfig.highlightedSectionId === 'milestone-module'}
          >
            {milestoneModule}
          </AdaptiveModuleContainer>
        );

      case 'timeline':
        return (
          <AdaptiveModuleContainer
            key="timeline"
            id="timeline-module"
            title="Telemetry Feed"
            isPrioritized={layoutConfig.highlightedSectionId === 'timeline-module'}
          >
            {timelineModule}
          </AdaptiveModuleContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Smart Insight Bar */}
      <SmartInsightFeed />

      {/* Dynamically Re-ordered Modules */}
      {layoutConfig.moduleOrder.map((modId) => renderModuleById(modId))}
    </div>
  );
};

export default AdaptiveLayoutComposer;
