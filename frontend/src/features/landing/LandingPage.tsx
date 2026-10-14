import React from 'react';
import { LandingNav } from './aurora/LandingNav';
import { LandingHero } from './aurora/LandingHero';
import { CareerDiscovery, HowItWorks, ResumeIntelligence } from './aurora/StoryDiscover';
import { CareerLabPreview, LearnAndBuild } from './aurora/StoryGrow';
import { InterviewPractice, LanguagesSection, OpportunitiesSection } from './aurora/StoryPractice';
import { ExampleScenarios, FinalCta, LandingFooter, TrustSection } from './aurora/StoryTrust';

/**
 * The public landing page in the Aurora Elite language: one long narrative that follows the
 * journey (discover, learn, build, practice, opportunities). Every sample screen is labelled,
 * and nothing claims users, outcomes, partners or figures SkillBridge does not have
 * (docs/PRODUCT_CLAIMS.md, enforced by e2e/tests/landing.mjs).
 */
export const LandingPage: React.FC = () => (
  <div className="min-h-screen overflow-x-clip bg-aurora-canvas font-sans text-aurora-ink antialiased selection:bg-aurora-violet/20 selection:text-aurora-ink">
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-aurora-ink focus:shadow-aurora-md">
      Skip to content
    </a>
    <LandingNav />
    <main id="main">
      <LandingHero />
      <HowItWorks />
      <ResumeIntelligence />
      <CareerDiscovery />
      <CareerLabPreview />
      <LearnAndBuild />
      <InterviewPractice />
      <OpportunitiesSection />
      <LanguagesSection />
      <TrustSection />
      <ExampleScenarios />
      <FinalCta />
    </main>
    <LandingFooter />
  </div>
);

export default LandingPage;
