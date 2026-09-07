import React from 'react';
import { Sparkles, ArrowRight, Upload, Compass } from 'lucide-react';

import { HeroOrchestrator } from '../hero/HeroOrchestrator';
import { AuroraBackground } from '../backgrounds/AuroraBackground';
import { LightingSurface } from '../lighting/LightingSurface';
import { MorphingProgressRing } from './MorphingProgressRing';
import { MissionCard } from './MissionCard';
import { TypingHeadline } from '../typography/TypingHeadline';
import { PrimaryCTA } from '../buttons/PrimaryCTA';
import { GlowButton } from '../buttons/GlowButton';
import { AnimatedGradientText } from '../typography/AnimatedGradientText';

export interface AICommandCenterHeroProps {
  userName?: string;
  topCareerTitle?: string;
  matchScore?: number;
  readinessScore?: number;
  readinessTier?: string;
  missionTitle?: string;
  missionCategory?: string;
  missionEffort?: string;
  missionImpact?: number;
  hasResume?: boolean;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
}

export const AICommandCenterHero: React.FC<AICommandCenterHeroProps> = ({
  userName = 'Career Strategist',
  topCareerTitle,
  matchScore = 0,
  readinessScore = 0,
  readinessTier = 'Evaluating',
  missionTitle,
  missionCategory,
  missionEffort,
  missionImpact,
  hasResume = false,
  onPrimaryAction,
  onSecondaryAction,
  className = '',
}) => {
  // Time-of-day dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();

  // Authentic conversational AI briefing text generated strictly from real data
  const getBriefingText = () => {
    if (!hasResume || readinessScore === 0) {
      return 'Your AI Career Architect is standing by. Upload your resume or add verified skills to unlock real-time match scores and custom learning roadmaps.';
    }
    if (topCareerTitle) {
      return `Analysis complete. You demonstrate a ${matchScore}% skill alignment for ${topCareerTitle} with an overall readiness tier of "${readinessTier}".`;
    }
    return `Your skill profile is synchronized. Your readiness score is currently evaluated at ${readinessScore}%.`;
  };

  const briefingText = getBriefingText();

  return (
    <HeroOrchestrator className={className}>
      <LightingSurface profile="heroSpotlight" className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <AuroraBackground className="p-8 sm:p-10">
          <div className="relative z-10 space-y-8">
            {/* Top Bar Status */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Command Center Active</span>
              </div>
              <div className="text-xs font-mono text-neutral-400 hidden sm:block">
                System Status: <span className="text-emerald-400 font-semibold">100% Operational</span>
              </div>
            </div>

            {/* Hero Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Greeting, Briefing, CTAs */}
              <div className="lg:col-span-8 space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {greeting},{' '}
                  <AnimatedGradientText gradient="from-indigo-400 via-purple-400 to-sky-400">
                    {userName}
                  </AnimatedGradientText>
                </h1>

                {/* AI Conversational Briefing */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md max-w-2xl">
                  <p className="text-sm sm:text-base text-neutral-300 font-medium leading-relaxed">
                    <TypingHeadline phrases={[briefingText]} typingSpeed={30} pauseDuration={10000} />
                  </p>
                </div>

                {/* Primary & Secondary Action CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <PrimaryCTA onClick={onPrimaryAction}>
                    {hasResume ? 'Continue Learning Roadmap' : 'Upload Resume to Initialize'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </PrimaryCTA>

                  <GlowButton
                    size="md"
                    glowColor="rgba(168, 85, 247, 0.3)"
                    onClick={onSecondaryAction}
                    className="bg-neutral-900 border border-white/15 text-neutral-200 hover:text-white"
                  >
                    {hasResume ? (
                      <>
                        <Compass className="w-4 h-4" />
                        <span>Explore Career Matches</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Manage Resume</span>
                      </>
                    )}
                  </GlowButton>
                </div>
              </div>

              {/* Right Column: Morphing Progress Ring */}
              <div className="lg:col-span-4 flex justify-center">
                <div className="p-6 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
                  <MorphingProgressRing
                    score={readinessScore}
                    tier={readinessTier}
                    trendLabel={topCareerTitle ? `Top Role: ${topCareerTitle}` : 'Evaluation Active'}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Today's Mission */}
            <div className="pt-2">
              <MissionCard
                title={missionTitle}
                category={missionCategory}
                estimatedEffort={missionEffort}
                impactScore={missionImpact}
                onAction={onPrimaryAction}
              />
            </div>
          </div>
        </AuroraBackground>
      </LightingSurface>
    </HeroOrchestrator>
  );
};

export default AICommandCenterHero;
