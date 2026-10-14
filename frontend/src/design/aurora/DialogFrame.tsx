import React, { useRef } from 'react';
import { Portal } from '../../components/primitives/Portal/Portal';
import { useDialogBehaviour } from './useDialogBehaviour';

/**
 * Full-screen frame for a dialog or slide-over whose panel is drawn by the caller: renders in a
 * portal over a dimmed page, is announced as a modal dialog, keeps Tab inside, closes on Escape or
 * a click on the dimmed area, and returns focus to what opened it. Mount it only while open.
 */
export const DialogFrame: React.FC<{
  onClose: () => void;
  /** Accessible name of the dialog */
  label: string;
  /** 'center' for dialogs, 'right' for slide-overs */
  side?: 'center' | 'right';
  children: React.ReactNode;
}> = ({ onClose, label, side = 'center', children }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  useDialogBehaviour(true, onClose, frameRef);
  return (
    <Portal theme="aurora">
      <div
        ref={frameRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className={`fixed inset-0 z-[60] flex bg-aurora-ink/40 text-aurora-ink focus-visible:outline-none ${
          side === 'right' ? 'justify-end' : 'items-end justify-center p-0 sm:items-center sm:p-4'
        }`}
      >
        {children}
      </div>
    </Portal>
  );
};
