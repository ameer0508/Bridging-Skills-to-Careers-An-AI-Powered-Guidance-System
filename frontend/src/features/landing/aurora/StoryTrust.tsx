import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, FileSearch, KeyRound, Scale, ShieldCheck, Trash2 } from 'lucide-react';
import { JourneyScene } from '../../../design/aurora/JourneyScene';
import { BrandLockup } from '../../../design/aurora/Brand';
import { AuroraButton, Reveal, RevealItem, SectionHeading } from '../../../design/aurora/primitives';

const EXPLAIN = [
  { icon: Scale, title: 'Published weights', text: 'Matches come from weighted requirements you can read. AI never sets a score silently.' },
  { icon: FileSearch, title: 'Evidence you can trace', text: 'Every skill points to the resume line, project, check or portfolio entry behind it.' },
  { icon: Eye, title: 'Honest when data is missing', text: 'Market, salary and demand figures say “unavailable”, with the reason, until a licensed source exists. Nothing is estimated in their place.' },
];
const PRIVACY = [
  { icon: ShieldCheck, title: 'Consent first', text: 'The microphone, dictation and portfolio sharing are off until you turn them on.' },
  { icon: KeyRound, title: 'Only yours', text: 'Your data is visible to your account alone, unless you choose to share your portfolio link. Recordings are never sent to an AI.' },
  { icon: Trash2, title: 'Delete everything', text: 'One action removes your account and every record and file, at once.' },
];

/** 11–12. Explainable AI and privacy, side by side. */
export const TrustSection: React.FC = () => (
  <section id="trust" aria-labelledby="trust-title" className="scroll-mt-24 bg-white py-14 lg:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        id="trust-title"
        eyebrow="Transparency & control"
        align="center"
        title="Explainable by design. Private by default."
        lead="SkillBridge works without any paid AI. When an AI provider is used, every answer says so. When it is not, you get a labelled fallback, never an invented result."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {[
          { heading: 'Explainable', items: EXPLAIN },
          { heading: 'In your control', items: PRIVACY },
        ].map(group => (
          <div key={group.heading} className="rounded-[32px] border border-aurora-line bg-aurora-canvas p-6 sm:p-8">
            <h3 className="font-heading text-xl font-extrabold text-aurora-ink">{group.heading}</h3>
            <Reveal as="ul" className="mt-6 space-y-5">
              {group.items.map(({ icon: Icon, title, text }) => (
                <RevealItem as="li" key={title} className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-aurora-violet shadow-aurora-sm">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-aurora-ink">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-aurora-muted">{text}</p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SCENARIOS = [
  { title: 'A final-year student with a resume and no plan', steps: 'Resume check → three matching careers → a 10-week roadmap → a practice project for the biggest gap' },
  { title: 'A frontend developer considering data work', steps: 'Career Lab comparison → what-if for SQL and Statistics → a staged transition plan' },
  { title: 'A candidate preparing for interviews', steps: 'Role rubric → mock interview with follow-ups → recorded answers to review → technical assessment' },
];

/** Example situations: what the product does, with no people and no outcomes. */
export const ExampleScenarios: React.FC = () => (
  <section aria-labelledby="scenarios-title" className="py-14 lg:py-20" data-testid="example-scenarios">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading id="scenarios-title" eyebrow="Example scenarios" title="Three ways to use SkillBridge." />
      <Reveal as="ul" className="mt-10 grid gap-5 md:grid-cols-3">
        {SCENARIOS.map(s => (
          <RevealItem as="li" key={s.title} className="rounded-[28px] border border-aurora-line bg-white p-6 shadow-aurora-sm">
            <p className="font-heading text-lg font-bold text-aurora-ink">{s.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-aurora-muted">{s.steps}</p>
          </RevealItem>
        ))}
      </Reveal>
      <p data-testid="scenarios-note" className="mt-6 text-sm text-aurora-muted">
        These are example situations, not customer stories: SkillBridge has no user outcomes or reviews to show.
      </p>
    </div>
  </section>
);

/** 13. The closing call to action, with the journey scene as its horizon. */
export const FinalCta: React.FC = () => (
  <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 lg:px-8">
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[40px] shadow-aurora-lg ring-1 ring-aurora-line">
      <JourneyScene className="absolute inset-0" compact title="Your journey ahead" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/20" />
      <div className="relative flex flex-col items-start gap-6 px-6 py-16 sm:px-12 lg:py-24">
        <h2 id="cta-title" className="max-w-xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-aurora-ink sm:text-5xl">
          Know your strengths. See your gaps. Take the next step.
        </h2>
        <p className="max-w-lg text-base text-aurora-muted sm:text-lg">Upload a resume to see your skills with their evidence, your matching careers and one clear next action. Free, and yours to delete.</p>
        <div className="flex flex-wrap gap-3">
          <AuroraButton to="/register" size="lg">
            Start Your Journey <ArrowRight size={18} aria-hidden="true" />
          </AuroraButton>
          <AuroraButton to="/login" variant="secondary" size="lg">
            I already have an account
          </AuroraButton>
        </div>
      </div>
    </div>
  </section>
);

/** 14. Footer. */
export const LandingFooter: React.FC = () => (
  <footer className="border-t border-aurora-line bg-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div>
        <BrandLockup />
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-aurora-muted">
          Bridging Skills to Careers: an AI-assisted career guidance system. A college major project, free to use, with no paid plan and no advertising.
        </p>
      </div>
      <nav aria-label="Product">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-aurora-muted">Product</p>
        <ul className="mt-4 space-y-2.5 text-sm">
          {[
            ['#how-it-works', 'How it works'],
            ['#discover', 'Career discovery'],
            ['#career-lab', 'Career Lab'],
            ['#interviews', 'Interviews'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-aurora-ink hover:text-aurora-violet">{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Account">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-aurora-muted">Account</p>
        <ul className="mt-4 space-y-2.5 text-sm">
          <li><Link to="/register" className="text-aurora-ink hover:text-aurora-violet">Create an account</Link></li>
          <li><Link to="/login" className="text-aurora-ink hover:text-aurora-violet">Sign in</Link></li>
          <li><a href="#trust" className="text-aurora-ink hover:text-aurora-violet">Privacy & control</a></li>
        </ul>
      </nav>
    </div>
    <p className="border-t border-aurora-line px-4 py-6 text-center text-xs text-aurora-muted">Sample screens on this page are illustrative and use sample data.</p>
  </footer>
);
