import type { Transition, Variants } from 'framer-motion';

/** Aurora Elite motion: short, eased, transform and opacity only. */
export const auroraEase = [0.22, 1, 0.36, 1] as const;

export const auroraTransition: Transition = { duration: 0.6, ease: auroraEase };

/** Children rise into place one after another. With reduced motion nothing moves. */
export const staggerParent = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const riseChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: auroraTransition },
};

export const fadeChild: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: auroraEase } },
};
