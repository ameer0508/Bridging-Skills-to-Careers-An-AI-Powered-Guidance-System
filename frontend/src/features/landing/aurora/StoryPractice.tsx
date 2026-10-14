import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BellRing, Briefcase, Code2, Languages, Mic, ScanText, ShieldCheck } from 'lucide-react';
import { AuroraCard, IllustrativeBadge, Reveal, RevealItem, SectionHeading } from '../../../design/aurora/primitives';
import { auroraEase } from '../../../design/aurora/motion';

const RUBRIC = [
  { name: 'Structure', value: 4 },
  { name: 'Relevance', value: 4 },
  { name: 'Evidence and results', value: 3 },
  { name: 'Communication', value: 4 },
];

/** 8. Interview preparation: the question, the live recording state and the rubric. */
export const InterviewPractice: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <section id="interviews" aria-labelledby="interviews-title" className="scroll-mt-24 overflow-x-clip py-14 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8">
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[44px] bg-gradient-to-br from-aurora-lavender/25 via-transparent to-aurora-sky/20 blur-2xl" />
          <AuroraCard className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-aurora-violet">Question 2 of 5 · Behavioural</p>
              <IllustrativeBadge />
            </div>
            <p className="mt-3 font-heading text-xl font-bold leading-snug text-aurora-ink">
              Tell me about a time two teams disagreed on how a metric should be defined. What did you do?
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-aurora-line bg-aurora-canvas px-4 py-3">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white">
                <Mic size={16} aria-hidden="true" />
                {!reduce && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-40" />}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-aurora-ink">Recording · 0:42</p>
                <div className="mt-1.5 flex h-5 items-end gap-0.5" aria-hidden="true">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-1 rounded-full bg-aurora-violet/70"
                      initial={{ height: 4 }}
                      animate={reduce ? { height: 6 + ((i * 7) % 12) } : { height: [4, 6 + ((i * 7) % 14), 4] }}
                      transition={reduce ? { duration: 0 } : { duration: 1 + (i % 5) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.03 }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {RUBRIC.map((r, i) => (
                <div key={r.name}>
                  <div className="flex justify-between text-xs font-medium text-aurora-ink">
                    <span>{r.name}</span>
                    <span className="tabular-nums text-aurora-muted">{r.value}/5</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-aurora-sidebar" aria-hidden="true">
                    <motion.div
                      className="h-full rounded-full bg-aurora-sky"
                      initial={reduce ? { width: `${r.value * 20}%` } : { width: 0 }}
                      whileInView={{ width: `${r.value * 20}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.8, ease: auroraEase }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-aurora-muted">Every score states its method and uncertainty, and is not a prediction of hiring.</p>
          </AuroraCard>
        </div>
        <div className="flex flex-col gap-6">
          <SectionHeading
            id="interviews-title"
            eyebrow="Interview preparation"
            title="Practise the interview you are actually going to have."
            lead="Questions built from your target role, your skills and your gaps, scored on a published rubric for that role, with follow-ups when an answer misses a point."
          />
          <Reveal as="ul" className="grid gap-3">
            {[
              { icon: Mic, text: 'Record spoken answers or dictate them, only after you consent. Recordings stay on SkillBridge, only you can play them, and you choose how long they are kept.' },
              { icon: Code2, text: 'Technical assessments you reason through. No code is ever executed on the server.' },
              { icon: ShieldCheck, text: 'Without an AI provider, questions come from a built-in bank and scoring is rule-based. Both are labelled.' },
            ].map(({ icon: Icon, text }) => (
              <RevealItem as="li" key={text} className="flex gap-3 rounded-2xl border border-aurora-line bg-white p-4 shadow-aurora-sm">
                <Icon size={18} className="mt-0.5 shrink-0 text-aurora-violet" aria-hidden="true" />
                <span className="text-sm leading-relaxed text-aurora-ink">{text}</span>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const STAGES = [
  { name: 'Saved', count: 6 },
  { name: 'Applied', count: 4 },
  { name: 'Interview', count: 2 },
  { name: 'Offer', count: 0 },
];

/** 9. Jobs and application tracking: an honest pipeline of your own records. */
export const OpportunitiesSection: React.FC = () => (
  <section id="opportunities" aria-labelledby="opps-title" className="scroll-mt-24 bg-white py-14 lg:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-end gap-8 lg:grid-cols-2">
        <SectionHeading
          id="opps-title"
          eyebrow="Jobs & applications"
          title="Search, save and follow every application through to an answer."
          lead="Job search with honest freshness and duplicates removed. Each saved job keeps a dated history, notes and a follow-up reminder, and your outcome rates always show their denominators."
        />
        <p className="rounded-2xl border border-aurora-line bg-aurora-canvas p-5 text-sm leading-relaxed text-aurora-muted">
          <strong className="text-aurora-ink">What the listings are.</strong> Without a job-provider key, search shows built-in listings, each labelled as a demo. Live listings from OnJob.io appear only when the operator turns that source on, each with its source and a link to apply.
        </p>
      </div>
      <AuroraCard className="mt-12 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-heading text-base font-bold text-aurora-ink">
            <Briefcase size={18} className="text-aurora-violet" aria-hidden="true" /> Your applications
          </p>
          <IllustrativeBadge />
        </div>
        <Reveal as="ol" className="mt-6 grid gap-3 sm:grid-cols-4" stagger={0.12}>
          {STAGES.map((s, i) => (
            <RevealItem as="li" key={s.name} className="relative rounded-2xl border border-aurora-line bg-aurora-canvas p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-aurora-muted">{s.name}</p>
              <p className="mt-1 font-heading text-3xl font-extrabold text-aurora-ink tabular-nums">{s.count}</p>
              {i < STAGES.length - 1 && <span aria-hidden="true" className="absolute -right-2 top-1/2 hidden h-px w-4 bg-aurora-lavender sm:block" />}
            </RevealItem>
          ))}
        </Reveal>
        <p className="mt-5 flex items-center gap-2 text-sm text-aurora-ink">
          <BellRing size={16} className="text-aurora-violet" aria-hidden="true" /> Follow up with Example Retail: due Thursday
        </p>
      </AuroraCard>
    </div>
  </section>
);

/** 10. Multilingual resumes and OCR. */
export const LanguagesSection: React.FC = () => (
  <section id="languages" aria-labelledby="lang-title" className="scroll-mt-24 py-14 lg:py-20">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      <SectionHeading
        id="lang-title"
        eyebrow="Languages & scanned resumes"
        title="Read in English, Hindi and Spanish. Even from a scan."
        lead="Each value is traced to its original line, in its original language, without translation. Scanned PDFs are read by OCR that runs locally, and every OCR value is marked as a guess with its confidence. A language SkillBridge cannot read yet is refused with a message, never guessed."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <AuroraCard className="p-6">
          <Languages size={22} className="text-aurora-violet" aria-hidden="true" />
          <ul className="mt-4 space-y-2.5">
            {[
              { lang: 'English', sample: 'Skills: SQL, Excel' },
              { lang: 'Hindi', sample: 'कौशल: SQL, Excel', hindi: true },
              { lang: 'Spanish', sample: 'Habilidades: SQL, Excel' },
            ].map(l => (
              <li key={l.lang} className="flex items-center justify-between gap-3 rounded-xl bg-aurora-canvas px-3 py-2 text-sm">
                <span className="font-semibold text-aurora-ink">{l.lang}</span>
                <span lang={l.hindi ? 'hi' : l.lang === 'Spanish' ? 'es' : 'en'} className="text-aurora-muted">
                  {l.sample}
                </span>
              </li>
            ))}
          </ul>
        </AuroraCard>
        <AuroraCard className="p-6">
          <ScanText size={22} className="text-aurora-violet" aria-hidden="true" />
          <p className="mt-4 font-heading text-base font-bold text-aurora-ink">Scanned PDF</p>
          <p className="mt-1 text-sm text-aurora-muted">Read by local OCR. Nothing is sent anywhere else, and temporary images are deleted.</p>
          <p className="mt-4 inline-flex rounded-full bg-aurora-violet/[0.08] px-3 py-1 text-xs font-semibold text-aurora-indigo">OCR · confidence shown on every value</p>
        </AuroraCard>
      </div>
    </div>
  </section>
);
