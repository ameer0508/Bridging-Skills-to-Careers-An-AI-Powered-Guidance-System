import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { riseChild, staggerParent } from './motion';
import { auroraButtonClass, type ButtonSize, type ButtonVariant } from './buttonStyles';

/**
 * Aurora Elite primitives. Light porcelain surfaces, navy ink, one violet action gradient.
 * Every animated element renders in place, without movement, when the user prefers reduced motion.
 */

type AuroraButtonProps = { variant?: ButtonVariant; size?: ButtonSize; children: React.ReactNode; className?: string } & (
  | { to: string; href?: never; onClick?: never; type?: never }
  | { href: string; to?: never; onClick?: never; type?: never }
  | { onClick?: () => void; type?: 'button' | 'submit'; to?: never; href?: never }
);

/** A button, an in-app link (`to`) or an in-page anchor (`href`), styled the same way. */
export const AuroraButton: React.FC<AuroraButtonProps> = ({ variant = 'primary', size = 'md', children, className = '', ...rest }) => {
  const cls = `${auroraButtonClass(variant, size)} ${className}`;
  if ('to' in rest && rest.to) return <Link to={rest.to} className={cls}>{children}</Link>;
  if ('href' in rest && rest.href) return <a href={rest.href} className={cls}>{children}</a>;
  const { onClick, type = 'button' } = rest as { onClick?: () => void; type?: 'button' | 'submit' };
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-aurora-violet ${className}`}>
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full [background:var(--aurora-gradient-action)]" />
    {children}
  </p>
);

export const SectionHeading: React.FC<{ eyebrow?: string; title: React.ReactNode; lead?: React.ReactNode; id?: string; align?: 'left' | 'center'; className?: string }> = ({
  eyebrow,
  title,
  lead,
  id,
  align = 'left',
  className = '',
}) => (
  <div className={`flex flex-col gap-4 ${align === 'center' ? 'mx-auto items-center text-center' : ''} max-w-2xl ${className}`}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 id={id} className="font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-aurora-ink sm:text-4xl lg:text-[44px]">
      {title}
    </h2>
    {lead && <p className="text-base leading-relaxed text-aurora-muted sm:text-lg">{lead}</p>}
  </div>
);

/** Every sample screen says so. The test id lets the landing test check that samples are labelled. */
export const IllustrativeBadge: React.FC<{ label?: string; className?: string }> = ({ label = 'Illustrative demo', className = '' }) => (
  <span
    data-testid="landing-sample-note"
    className={`inline-flex items-center gap-1.5 rounded-full border border-aurora-line bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-aurora-muted shadow-aurora-sm backdrop-blur ${className}`}
  >
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-aurora-lavender" />
    {label}
  </span>
);

/** A porcelain card with a hairline border and a soft, layered shadow. */
export const AuroraCard: React.FC<{ children: React.ReactNode; className?: string; as?: 'div' | 'article' | 'section' | 'li' }> = ({ children, className = '', as = 'div' }) => {
  const Tag = as;
  return <Tag className={`rounded-[28px] border border-aurora-line bg-white shadow-aurora-md ${className}`}>{children}</Tag>;
};

/** Children rise into place as the block scrolls into view, once. */
export const Reveal: React.FC<{ children: React.ReactNode; className?: string; stagger?: number; delay?: number; as?: 'div' | 'ul' | 'ol' }> = ({
  children,
  className = '',
  stagger = 0.08,
  delay = 0,
  as = 'div',
}) => {
  const reduce = useReducedMotion();
  const Component = as === 'ul' ? motion.ul : as === 'ol' ? motion.ol : motion.div;
  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <Component className={className} variants={staggerParent(stagger, delay)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      {children}
    </Component>
  );
};

/** One item inside a Reveal. */
export const RevealItem: React.FC<{ children: React.ReactNode; className?: string; as?: 'div' | 'li' }> = ({ children, className = '', as = 'div' }) => {
  const reduce = useReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const Component = as === 'li' ? motion.li : motion.div;
  return (
    <Component className={className} variants={riseChild}>
      {children}
    </Component>
  );
};
