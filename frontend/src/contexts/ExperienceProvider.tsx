import React, { useState, useEffect, useRef } from 'react';
import {
  ExperienceContext,
  ExperienceContextValue,
  CursorState,
  InitializationState,
} from './ExperienceContext';
import { LightingProfileName } from '../tokens/lightingProfiles';

export interface ExperienceProviderProps {
  children: React.ReactNode;
  defaultLightingProfile?: LightingProfileName;
}

export const ExperienceProvider: React.FC<ExperienceProviderProps> = ({
  children,
  defaultLightingProfile = 'softAmbient',
}) => {
  // Reduced Motion Detection
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Low Performance Mode Auto-detection
  const [lowPerformanceMode, setLowPerformanceMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    return Boolean(lowCores);
  });

  // Cursor Tracking State & Velocity Calculation
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    isHovering: false,
  });

  // Active Lighting Profile State
  const [activeLightingProfile, setActiveLightingProfile] =
    useState<LightingProfileName>(defaultLightingProfile);

  // Global Initialization State Machine
  const [initializationState, setInitializationState] =
    useState<InitializationState>('idle');

  // Audio Hooks Readiness Toggle
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // Internal RAF Refs for Cursor Velocity
  const lastMousePos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const rafId = useRef<number | null>(null);

  // System Reduced Motion Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Performance Monitoring & FPS Sampling
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const samplePerformance = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 2000) {
        const fps = (frameCount * 1000) / (now - lastTime);
        if (fps < 40) {
          setLowPerformanceMode(true);
        }
        frameCount = 0;
        lastTime = now;
      }
      rafId.current = requestAnimationFrame(samplePerformance);
    };

    rafId.current = requestAnimationFrame(samplePerformance);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [reducedMotion]);

  // Mouse / Cursor Tracking Listener
  useEffect(() => {
    if (typeof window === 'undefined' || reducedMotion || lowPerformanceMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max((now - lastMousePos.current.time) / 1000, 0.016);

      const vx = (e.clientX - lastMousePos.current.x) / dt;
      const vy = (e.clientY - lastMousePos.current.y) / dt;

      lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };

      setCursor({
        x: e.clientX,
        y: e.clientY,
        velocityX: Math.round(vx),
        velocityY: Math.round(vy),
        isHovering: true,
      });
    };

    const handleMouseLeave = () => {
      setCursor((prev) => ({ ...prev, isHovering: false }));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [reducedMotion, lowPerformanceMode]);

  const value: ExperienceContextValue = {
    reducedMotion,
    lowPerformanceMode,
    cursor,
    activeLightingProfile,
    setActiveLightingProfile,
    initializationState,
    setInitializationState,
    audioEnabled,
    setAudioEnabled,
  };

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
};

export default ExperienceProvider;
