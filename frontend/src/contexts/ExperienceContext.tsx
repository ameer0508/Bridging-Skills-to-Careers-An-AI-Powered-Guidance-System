/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

import { LightingProfileName } from '../tokens/lightingProfiles';

export type InitializationState =
  | 'idle'
  | 'authenticating'
  | 'initializing'
  | 'context_activating'
  | 'ready';

export interface CursorState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isHovering: boolean;
}

export interface ExperienceContextValue {
  reducedMotion: boolean;
  lowPerformanceMode: boolean;
  cursor: CursorState;
  activeLightingProfile: LightingProfileName;
  setActiveLightingProfile: (profile: LightingProfileName) => void;
  initializationState: InitializationState;
  setInitializationState: (state: InitializationState) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
}

export const ExperienceContext = createContext<ExperienceContextValue | undefined>(undefined);

export function useExperience(): ExperienceContextValue {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error('useExperience must be used within an ExperienceProvider');
  }
  return context;
}

export default ExperienceContext;
