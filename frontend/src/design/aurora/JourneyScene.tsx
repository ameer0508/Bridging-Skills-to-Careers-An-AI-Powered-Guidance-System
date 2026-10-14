import React, { useId, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * SkillBridge's signature: a luminous path winding up through blue-violet mountains at sunrise,
 * past the five stages of the journey. An original, lightweight inline SVG (no images), so it is
 * sharp at any size and costs a few kilobytes.
 *
 * Motion: the path draws itself, the milestones appear in turn and the layers drift slightly
 * apart on scroll (parallax). With reduced motion the finished scene is shown, still.
 */

export const JOURNEY_STAGES = ['Discover', 'Learn', 'Build', 'Practice', 'Opportunities'] as const;

// The route, as cubic segments that end exactly on each milestone
const START = 'M 120 660';
const SEGMENTS = [
  'C 210 620, 280 585, 360 560',
  'C 455 532, 610 532, 575 478',
  'C 545 432, 405 432, 470 392',
  'C 525 360, 590 366, 655 344',
  'C 725 322, 772 300, 820 282',
];
const MILESTONES: Array<{ x: number; y: number; label: (typeof JOURNEY_STAGES)[number]; side: 'left' | 'right' }> = [
  { x: 360, y: 560, label: 'Discover', side: 'left' },
  { x: 575, y: 478, label: 'Learn', side: 'right' },
  { x: 470, y: 392, label: 'Build', side: 'left' },
  { x: 655, y: 344, label: 'Practice', side: 'right' },
  { x: 820, y: 282, label: 'Opportunities', side: 'right' },
];
const ROUTE = [START, ...SEGMENTS].join(' ');

export const JourneyScene: React.FC<{ className?: string; compact?: boolean; title?: string }> = ({ className = '', compact = false, title = 'The SkillBridge journey' }) => {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Far layers move least; the effect is a few pixels, and none with reduced motion
  const far = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -18]);
  const mid = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const near = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  // The caller may position the scene itself (absolute or fixed); otherwise it is relative
  const positioned = className.split(' ').some(c => c === 'absolute' || c === 'fixed');
  const id = (name: string) => `${name}-${uid}`;
  const draw = reduce ? undefined : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 2.2, ease: [0.65, 0, 0.35, 1], delay: 0.4 } };

  return (
    <div ref={ref} className={`overflow-hidden ${positioned ? '' : 'relative'} ${className}`}>
      <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-labelledby={id('title')}>
        <title id={id('title')}>{`${title}: ${JOURNEY_STAGES.join(', then ')}.`}</title>
        <defs>
          <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9e6ff" />
            <stop offset="42%" stopColor="#f4efff" />
            <stop offset="62%" stopColor="#ffe9dc" />
            <stop offset="100%" stopColor="#f5f7ff" />
          </linearGradient>
          <radialGradient id={id('sun')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fff6e8" />
            <stop offset="35%" stopColor="#ffd9b0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffc9a8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('far')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9c2f7" />
            <stop offset="100%" stopColor="#e2defb" />
          </linearGradient>
          <linearGradient id={id('mid')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9c8ff0" />
            <stop offset="100%" stopColor="#c3bbf6" />
          </linearGradient>
          <linearGradient id={id('near')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d58f2" />
            <stop offset="100%" stopColor="#4a3ad8" />
          </linearGradient>
          <linearGradient id={id('front')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f2fc4" />
            <stop offset="100%" stopColor="#1f1b6e" />
          </linearGradient>
          <linearGradient id={id('route')} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#e9e3ff" />
            <stop offset="100%" stopColor="#fff1dd" />
          </linearGradient>
          <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id={id('glow')} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <rect width="1200" height="720" fill={`url(#${id('sky')})`} />
        <circle cx="820" cy="300" r="190" fill={`url(#${id('sun')})`} />
        <circle cx="820" cy="300" r="46" fill="#fff8ee" opacity="0.9" />

        <motion.g style={{ y: far }}>
          <path d="M0 430 L120 360 L230 395 L360 300 L470 350 L600 260 L720 330 L840 250 L960 320 L1080 270 L1200 330 L1200 720 L0 720 Z" fill={`url(#${id('far')})`} />
          <ellipse cx="300" cy="420" rx="320" ry="40" fill="#ffffff" opacity="0.55" filter={`url(#${id('soft')})`} />
          <ellipse cx="980" cy="390" rx="300" ry="36" fill="#ffffff" opacity="0.5" filter={`url(#${id('soft')})`} />
        </motion.g>

        <motion.g style={{ y: mid }}>
          <path d="M0 500 L140 420 L260 470 L390 380 L520 440 L640 360 L760 430 L900 350 L1040 420 L1200 380 L1200 720 L0 720 Z" fill={`url(#${id('mid')})`} />
          <ellipse cx="640" cy="470" rx="380" ry="34" fill="#ffffff" opacity="0.45" filter={`url(#${id('soft')})`} />
        </motion.g>

        <motion.g style={{ y: near }}>
          <path d="M0 600 C 160 520, 300 560, 430 470 C 520 410, 600 430, 700 360 C 790 300, 880 330, 960 380 C 1060 440, 1130 430, 1200 410 L1200 720 L0 720 Z" fill={`url(#${id('near')})`} />
          <path d="M0 700 C 200 620, 360 650, 520 600 C 700 545, 880 600, 1200 560 L1200 720 L0 720 Z" fill={`url(#${id('front')})`} />

          {/* The route: a soft glow under a crisp line that draws itself */}
          <path d={ROUTE} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="14" strokeLinecap="round" filter={`url(#${id('glow')})`} />
          <motion.path d={ROUTE} fill="none" stroke={`url(#${id('route')})`} strokeWidth="5" strokeLinecap="round" {...draw} />
          <motion.path d={ROUTE} fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.5" strokeDasharray="2 10" strokeLinecap="round" {...draw} />

          {MILESTONES.map((m, i) => (
            <motion.g
              key={m.label}
              initial={reduce ? undefined : { opacity: 0, y: 8 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <circle cx={m.x} cy={m.y} r="22" fill="#ffffff" opacity="0.3" />
              <circle cx={m.x} cy={m.y} r="10" fill="#ffffff" stroke="#5540f5" strokeWidth="4" />
              {!compact && (
                <g transform={`translate(${m.side === 'left' ? m.x - 30 : m.x + 30} ${m.y - 4})`}>
                  <rect
                    x={m.side === 'left' ? -(m.label.length * 15.5 + 40) : 0}
                    y="-25"
                    width={m.label.length * 15.5 + 40}
                    height="46"
                    rx="23"
                    fill="#ffffff"
                    opacity="0.95"
                  />
                  <text
                    x={m.side === 'left' ? -20 : 20}
                    y="6"
                    textAnchor={m.side === 'left' ? 'end' : 'start'}
                    fontFamily="Manrope, Inter, sans-serif"
                    fontSize="21"
                    fontWeight="800"
                    letterSpacing="1.6"
                    fill="#10153b"
                  >
                    {m.label.toUpperCase()}
                  </text>
                </g>
              )}
            </motion.g>
          ))}
        </motion.g>
      </svg>
    </div>
  );
};

export default JourneyScene;
