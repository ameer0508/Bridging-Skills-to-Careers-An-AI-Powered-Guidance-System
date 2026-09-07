import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, FileCheck, Search, BookOpen, Trophy, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const CareerTransformation: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      number: 1,
      id: 'assessment',
      title: 'Career Intent & Assessment',
      subtitle: 'Define target role & aspirations',
      description: 'Input your target job title or explore market trends. SkillBridge establishes your baseline career profile and target benchmarks.',
      icon: Compass,
      output: 'Initial Career Target Blueprint',
      metric: 'Baseline Established',
    },
    {
      number: 2,
      id: 'resume',
      title: 'Resume & Skill Extraction',
      subtitle: 'Parsing your document footprint',
      description: 'Upload your current resume. NLP models extract hard skills, frameworks, domain experience, and ATS keyword metrics automatically.',
      icon: FileCheck,
      output: '24 Extracted Skill Entities',
      metric: '98/100 ATS Score',
    },
    {
      number: 3,
      id: 'gap-detection',
      title: 'Skill Gap Detection',
      subtitle: 'Deterministic taxonomy comparison',
      description: 'AI compares your capability matrix against real market requirements to pinpoint high-priority missing skills.',
      icon: Search,
      output: 'Vector Gap Matrix Report',
      metric: '3 High Priority Gaps',
    },
    {
      number: 4,
      id: 'roadmap',
      title: 'Adaptive Learning Roadmap',
      subtitle: 'Personalized phase-by-phase action plan',
      description: 'SkillBridge generates a week-by-week curriculum with curated resources, capstone projects, and recommended certifications.',
      icon: BookOpen,
      output: '7-Week Action Blueprint',
      metric: 'Step-by-Step Guidance',
    },
    {
      number: 5,
      id: 'readiness',
      title: 'Career Readiness Verification',
      subtitle: 'Tracking velocity and readiness score',
      description: 'As you complete roadmap milestones, your Career Readiness Score climbs toward the target 90%+ interview threshold.',
      icon: Trophy,
      output: 'Readiness Index: 94.8%',
      metric: 'Ready for Applications',
    },
    {
      number: 6,
      id: 'dream-job',
      title: 'Dream Role Acquisition',
      subtitle: 'Confidently land high-tier positions',
      description: 'Armed with verified skills, an ATS-hardened resume, and capstone projects, you secure your dream career role.',
      icon: Briefcase,
      output: 'Target Role Secured',
      metric: '100% Success Velocity',
    },
  ];

  const currentStep = steps.find((s) => s.number === activeStep) || steps[0];
  const Icon = currentStep.icon;

  return (
    <section id="transformation" className="py-28 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-indigo-300 tracking-wider uppercase">
            6-Phase Transformation
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Your Path To <br />
          <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Career Mastery
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          An interactive walkthrough of how SkillBridge guides you from initial assessment to securing your target role.
        </p>
      </div>

      {/* Connected Desktop Step Timeline */}
      <div className="hidden lg:flex items-center justify-between mb-12 relative">
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0" />
        <motion.div
          className="absolute top-1/2 left-8 h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-400 -translate-y-1/2 z-0"
          animate={{
            width: `${((activeStep - 1) / (steps.length - 1)) * 90}%`,
          }}
          transition={{ duration: 0.4 }}
        />

        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = step.number === activeStep;
          const isPast = step.number < activeStep;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.number)}
              className="relative z-10 flex flex-col items-center gap-2 group focus:outline-none"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-linear-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/40 scale-110 ring-4 ring-indigo-500/30'
                    : isPast
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-500 border border-white/10 group-hover:border-white/20'
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Step {step.number}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Step Buttons */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-4 mb-8">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.number)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              activeStep === step.number
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-white/10'
            }`}
          >
            Step {step.number}: {step.title}
          </button>
        ))}
      </div>

      {/* Active Phase Card */}
      <TiltCard glowColor="rgba(99, 102, 241, 0.2)" className="p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 0{currentStep.number} Execution
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Automated AI Validation
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Icon className="w-8 h-8 text-cyan-400" />
              {currentStep.title}
            </h3>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {currentStep.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Generated Output Artifact</span>
                <span className="text-sm font-bold text-white font-mono">{currentStep.output}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1">Target Benchmark Metric</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {currentStep.metric}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center items-center p-6 rounded-2xl bg-slate-950/90 border border-white/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40">
              <Icon className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Step {currentStep.number} Active</h4>
            <p className="text-xs text-slate-300">{currentStep.subtitle}</p>

            <button
              onClick={() => setActiveStep((prev) => (prev % steps.length) + 1)}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/15 transition-all"
            >
              <span>Advance to Step {(currentStep.number % steps.length) + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </TiltCard>
    </section>
  );
};
