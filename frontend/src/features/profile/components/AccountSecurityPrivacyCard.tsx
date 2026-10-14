import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { DialogFrame } from '../../../design/aurora/DialogFrame';

export interface AccountSecurityPrivacyCardProps {
  userId: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt?: string;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const AccountSecurityPrivacyCard: React.FC<AccountSecurityPrivacyCardProps> = ({
  userId,
  email,
  accountStatus,
  createdAt,
  onLogout,
  isLoggingOut = false,
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Mask user ID for security (show first 6 and last 4 chars)
  const maskedId = userId && userId.length > 10
    ? `${userId.slice(0, 6)}••••••••${userId.slice(-4)}`
    : userId;

  return (
    <div className="w-full space-y-6">
      {/* Account Security & Telemetry Card */}
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-aurora-violet/25">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-aurora-line">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <Lock className="w-4 h-4 text-aurora-indigo" />
              Account and security
            </span>
            <p className="text-[11px] text-aurora-muted">
              Identity parameters, authentication credentials, and cryptographic session protection.
            </p>
          </div>
        </div>

        {/* Security Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-aurora-canvas border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Account Identity</span>
            <strong className="text-aurora-ink text-xs block truncate">{email}</strong>
            <span className="text-[9px] text-emerald-700 font-bold block">Status: {accountStatus.toUpperCase()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-aurora-canvas border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Authentication Mechanism</span>
            <strong className="text-aurora-ink text-xs block">Local Bcrypt Security</strong>
            <span className="text-[9px] text-aurora-indigo block">Salted Multi-Round Hashing</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-aurora-canvas border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Cryptographic Session</span>
            <strong className="text-aurora-ink text-xs block">JWT Bearer Token</strong>
            <span className="text-[9px] text-aurora-violet block">Auto Refresh Rotation</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-aurora-canvas border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Account Created</span>
            <strong className="text-aurora-ink text-xs block">
              {createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not available'}
            </strong>
            <span className="text-[9px] text-aurora-muted block tabular-nums">{maskedId}</span>
          </div>
        </div>

        {/* Privacy & Multi-Tenant Data Transparency */}
        <div className="p-5 rounded-2xl bg-aurora-canvas border border-aurora-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Privacy & Data Protection Transparency
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              MULTI-TENANT ISOLATED
            </span>
          </div>

          <p className="text-[11px] text-aurora-muted leading-relaxed">
            SkillBridge operates under strict context isolation. Your uploaded documents, extracted skills, and interview simulations are scoped exclusively to your tenant profile and are never commingled or used to fine-tune public foundation models. AI inference is routed through an authenticated gateway with sanitized payloads.
          </p>

          <div className="pt-2 flex items-center gap-4 text-[10px] text-aurora-muted border-t border-aurora-line flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              Zero Third-Party Ad Trackers
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              Bcrypt Hashed Credentials
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              Ephemeral Inference Context
            </span>
          </div>
        </div>
      </GlassPanel>

      {/* Danger Zone: Session Termination */}
      <GlassPanel className="p-6 sm:p-8 space-y-4 border-rose-200 bg-rose-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              Danger Zone • Session Lifecycle
            </h4>
            <p className="text-[11px] text-aurora-muted">
              Revoke active refresh tokens, clear local session state, and securely terminate your session across devices.
            </p>
          </div>

          <button
            onClick={() => setIsConfirmModalOpen(true)}
            type="button"
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-700 hover:text-aurora-indigo text-xs font-bold transition cursor-pointer self-start sm:self-auto flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </GlassPanel>

      {/* Logout Confirmation Dialog */}
      {isConfirmModalOpen && (
        <DialogFrame onClose={() => setIsConfirmModalOpen(false)} label="Confirm sign out">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto p-6 rounded-t-3xl sm:rounded-3xl bg-white border border-rose-200 shadow-aurora-lg space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-aurora-line pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <h4 className="text-sm font-bold text-aurora-ink">Confirm Sign Out</h4>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                type="button"
                aria-label="Close"
                className="p-1 rounded-lg hover:bg-aurora-canvas text-aurora-muted hover:text-aurora-indigo transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-aurora-muted text-xs leading-relaxed">
              Are you sure you want to terminate your current SkillBridge session? Your refresh token will be revoked on the server and you will be redirected to the authentication portal.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-aurora-line">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-aurora-canvas hover:bg-aurora-line text-aurora-muted text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  onLogout();
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? 'Terminating...' : 'Terminate Session'}</span>
              </button>
            </div>
          </div>
        </DialogFrame>
      )}
    </div>
  );
};
