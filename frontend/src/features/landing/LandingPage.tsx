import React from 'react';
import { AuroraBackground } from './components/effects/AuroraBackground';
import { ImmersiveNavbar } from './components/ImmersiveNavbar';
import { IntelligenceHero } from './components/IntelligenceHero';
import { CareerUniverse } from './components/CareerUniverse';
import { DigitalTwinSection } from './components/DigitalTwinSection';
import { IntelligencePipeline } from './components/IntelligencePipeline';
import { LiveAIExperience } from './components/LiveAIExperience';
import { CareerTransformation } from './components/CareerTransformation';
import { AgentConstellation } from './components/AgentConstellation';
import { MarketIntelligence } from './components/MarketIntelligence';
import { CareerOSReveal } from './components/CareerOSReveal';
import { IntelligenceTrust } from './components/IntelligenceTrust';
import { InteractiveComparison } from './components/InteractiveComparison';
import { SocialProof } from './components/SocialProof';
import { IntelligenceFAQ } from './components/IntelligenceFAQ';
import { CinematicCTA } from './components/CinematicCTA';
import { ImmersiveFooter } from './components/ImmersiveFooter';

export const LandingPage: React.FC = () => {
  return (
    <AuroraBackground showParticles={true} className="min-h-screen font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* 1. Immersive Floating Navigation */}
      <ImmersiveNavbar />

      {/* Main Continuous Narrative Container */}
      <main className="relative z-10 space-y-12">
        {/* 2. Full-Viewport Hero Opening */}
        <IntelligenceHero />

        {/* 3. Your Career Is More Than A Resume */}
        <CareerUniverse />

        {/* 4. Professional Digital Twin */}
        <DigitalTwinSection />

        {/* 5. Intelligence Engine Pipeline */}
        <IntelligencePipeline />

        {/* 6. Live AI Interaction Console */}
        <LiveAIExperience />

        {/* 7. 6-Phase Career Transformation */}
        <CareerTransformation />

        {/* 8. AI Agent Ecosystem Constellation */}
        <AgentConstellation />

        {/* 9. Market Intelligence Telemetry */}
        <MarketIntelligence />

        {/* 10. CareerOS Product Reveal */}
        <CareerOSReveal />

        {/* 11. Technical Authority & Grounding */}
        <IntelligenceTrust />

        {/* 12. Interactive Visual Comparison */}
        <InteractiveComparison />

        {/* 13. Social Proof & User Outcomes */}
        <SocialProof />

        {/* 14. Intelligence Knowledge Base (FAQ) */}
        <IntelligenceFAQ />

        {/* 15. Cinematic Final Convergence CTA */}
        <CinematicCTA />
      </main>

      {/* 16. Elevated Footer */}
      <ImmersiveFooter />
    </AuroraBackground>
  );
};

export default LandingPage;
