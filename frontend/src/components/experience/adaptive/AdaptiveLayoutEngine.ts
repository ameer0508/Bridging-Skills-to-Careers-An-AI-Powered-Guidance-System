import { PrimaryWorkspaceFocus } from './ContextPrioritizationEngine';

export interface LayoutConfig {
  moduleOrder: string[]; // e.g. ['hero', 'focus', 'momentum', 'priorities', 'milestone', 'timeline']
  highlightedSectionId: string;
  density: 'compact' | 'comfortable';
}

export const AdaptiveLayoutEngine = {
  computeLayoutConfig(focus: PrimaryWorkspaceFocus): LayoutConfig {
    switch (focus) {
      case 'coaching':
        return {
          moduleOrder: ['focus', 'hero', 'momentum', 'priorities', 'milestone', 'timeline'],
          highlightedSectionId: 'focus-module',
          density: 'comfortable',
        };
      case 'strategy':
        return {
          moduleOrder: ['hero', 'strategy', 'focus', 'momentum', 'priorities', 'milestone'],
          highlightedSectionId: 'strategy-module',
          density: 'comfortable',
        };
      case 'planning':
        return {
          moduleOrder: ['hero', 'milestone', 'focus', 'priorities', 'momentum', 'timeline'],
          highlightedSectionId: 'milestone-module',
          density: 'comfortable',
        };
      default:
        return {
          moduleOrder: ['hero', 'focus', 'momentum', 'priorities', 'milestone', 'timeline'],
          highlightedSectionId: 'hero-module',
          density: 'comfortable',
        };
    }
  },
};
