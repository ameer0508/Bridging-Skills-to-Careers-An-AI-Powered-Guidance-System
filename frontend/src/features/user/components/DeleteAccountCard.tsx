import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { messageOf } from '../../../lib/collections';

/**
 * Deletes the account and everything stored about it (X12). Needs the password and the word
 * DELETE typed out, so it cannot happen by a stray click.
 */
export const DeleteAccountCard: React.FC = () => {
  const navigate = useNavigate();
  const clearSession = useAuthStore(s => s.clearSession);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const remove = useMutation({
    mutationFn: async () => (await apiClient.delete('/users/me', { data: { password, confirm } })).data.data,
    onSuccess: () => {
      clearSession();
      navigate('/login', { replace: true });
    },
  });
  const ready = password.length > 0 && confirm === 'DELETE' && !remove.isPending;

  return (
    <section aria-labelledby="delete-account-heading" data-testid="delete-account" className="rounded-2xl border border-[var(--color-status-error-border,#dc2626)] p-5 space-y-3">
      <h3 id="delete-account-heading" className="text-base font-bold text-[var(--color-status-error-text,#f87171)]">Delete account</h3>
      <p className="text-sm text-aurora-muted">
        This permanently deletes your account and everything SkillBridge stores about you: your resumes and their files, skills, career
        matches, readiness, roadmaps, portfolio, exam practice, interviews and recordings, applications, chats and settings. It cannot be undone.
        Records of market data imports you made as an administrator keep your account id, which identifies no one once the account is gone.
      </p>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={e => {
          e.preventDefault();
          if (ready) remove.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Your password
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-2xl border border-aurora-line bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Type DELETE to confirm
          <input value={confirm} onChange={e => setConfirm(e.target.value)} className="rounded-2xl border border-aurora-line bg-transparent px-3 py-2" />
        </label>
        <button type="submit" disabled={!ready} className="rounded-2xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {remove.isPending ? 'Deleting…' : 'Delete my account'}
        </button>
      </form>
      {remove.isError && <p role="alert" className="text-sm text-[var(--color-status-error-text,#f87171)]">{messageOf(remove.error, 'The account could not be deleted.')}</p>}
    </section>
  );
};

export default DeleteAccountCard;
