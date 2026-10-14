import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Compass, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { JourneyScene } from '../../../design/aurora/JourneyScene';
import { AuroraButton, IllustrativeBadge } from '../../../design/aurora/primitives';
import { auroraEase, riseChild, staggerParent } from '../../../design/aurora/motion';

const PROMISES = [
  { icon: Sparkles, text: 'Free to use. No paid AI required' },
  { icon: FileText, text: 'Every score explained from your evidence' },
  { icon: ShieldCheck, text: 'You can delete everything, any time' },
];

/** The opening: an editorial headline beside the signature journey scene. */
export const LandingHero: React.FC = () => {
  const reduce = useReducedMotion();
  const container = reduce ? {} : { variants: staggerParent(0.09, 0.1), initial: 'hidden', animate: 'show' };
  const item = reduce ? {} : { variants: riseChild };

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pb-12 pt-28 sm:pt-32 lg:pb-16 lg:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:var(--aurora-gradient-canvas)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:px-8">
        <motion.div className="flex flex-col items-start gap-7" {...container}>
          <motion.p {...item} className="inline-flex items-center gap-2 rounded-full border border-aurora-line bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-aurora-muted shadow-aurora-sm backdrop-blur">
            <Compass size={14} className="text-aurora-violet" aria-hidden="true" />
            Career guidance built on evidence, not guesswork
          </motion.p>
          <motion.h1 {...item} id="hero-title" className="font-heading text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] text-aurora-ink sm:text-6xl lg:text-[68px]">
            Turn Your Skills Into{' '}
            <span className="bg-clip-text text-transparent [background-image:linear-gradient(100deg,#6e4bff_10%,#3929c9_55%,#5d96ff_100%)]">Meaningful Careers.</span>
          </motion.h1>
          <motion.p {...item} className="max-w-xl text-lg leading-relaxed text-aurora-muted sm:text-xl">
            Discover your strengths, explore career paths, build practical skills, and take your next step with personalized, explainable guidance.
          </motion.p>
          <motion.div {...item} className="flex flex-wrap items-center gap-3">
            <AuroraButton to="/register" size="lg">
              Start Your Journey
              <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </AuroraButton>
            <AuroraButton href="#discover" variant="secondary" size="lg">
              Explore Careers
            </AuroraButton>
          </motion.div>
          <motion.ul {...item} className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-sm font-medium text-aurora-ink">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-aurora-mint/15 text-aurora-mint-ink">
                  <Icon size={13} aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, scale: 0.97, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: auroraEase, delay: 0.15 }}
          className="relative"
        >
          <div className="relative aspect-[5/4] overflow-hidden rounded-[36px] border border-white/70 shadow-aurora-lg ring-1 ring-aurora-line sm:aspect-[6/5]">
            <JourneyScene className="absolute inset-0" />
          </div>
          {/* A sample of the Command Center's next step, floating over the scene */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 18 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: auroraEase, delay: 1.6 }}
            className="relative mx-auto -mt-16 w-[88%] max-w-sm rounded-3xl border border-aurora-line bg-white/95 p-5 shadow-aurora-lg backdrop-blur sm:absolute sm:-bottom-8 sm:-left-6 sm:mt-0 sm:w-80"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-aurora-violet">Next best action</p>
              <IllustrativeBadge />
            </div>
            <p className="mt-2 font-heading text-base font-bold text-aurora-ink">Show SQL in a project</p>
            <p className="mt-1 text-sm leading-snug text-aurora-muted">SQL is required for Data Analyst and is only listed on your resume. A project with a link turns it into applied evidence.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-aurora-sidebar" aria-hidden="true">
              <motion.div
                className="h-full rounded-full [background:var(--aurora-gradient-action)]"
                initial={reduce ? { width: '64%' } : { width: '0%' }}
                animate={{ width: '64%' }}
                transition={{ duration: 1.2, ease: auroraEase, delay: 2 }}
              />
            </div>
            <p className="mt-2 text-xs text-aurora-muted">Sample match: 64% of weighted requirements evidenced</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
