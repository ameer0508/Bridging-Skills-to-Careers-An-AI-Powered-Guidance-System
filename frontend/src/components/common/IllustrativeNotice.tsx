import React from 'react';
import { Info } from 'lucide-react';

type NoticeKind = 'sample' | 'heuristic';

const COPY: Record<NoticeKind, { title: string; body: string }> = {
  sample: {
    title: 'Illustrative sample data',
    body: 'This section shows built-in example content to demonstrate the design. It is not based on your profile or on live market data.',
  },
  heuristic: {
    title: 'Heuristic indicators',
    body: 'Figures in this section are estimates calculated in your browser from your current SkillBridge data. They are not measurements or predictions.',
  },
};

export interface IllustrativeNoticeProps {
  kind?: NoticeKind;
  /** Overrides the default explanation. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Marks content that is not the user's own verified data, so that sample screens and
 * rough estimates are never mistaken for real results.
 */
export const IllustrativeNotice: React.FC<IllustrativeNoticeProps> = ({ kind = 'sample', children, className = '' }) => (
  <div
    role="note"
    className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 ${className}`}
  >
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
    <p className="leading-relaxed">
      <strong className="font-semibold text-amber-900">{COPY[kind].title}.</strong> {children ?? COPY[kind].body}
    </p>
  </div>
);

/** Wraps a whole experimental screen with a prominent sample-data notice. */
export const DemoWorkspace: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-4">
    <div className="mx-auto max-w-7xl px-4">
      <IllustrativeNotice>
        This is an experimental design preview. Everything on this screen is built-in example content, not
        your data and not connected to any external account or live service.
      </IllustrativeNotice>
    </div>
    {children}
  </div>
);

export default IllustrativeNotice;
