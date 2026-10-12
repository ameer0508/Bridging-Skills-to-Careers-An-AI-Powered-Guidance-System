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
    <div className="w-full font-mono space-y-6">
      {/* Account Security & Telemetry Card */}
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-indigo-500/30">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              Account Security & Identity Verification
            </span>
            <p className="text-[11px] text-slate-400">
              Identity parameters, authentication credentials, and cryptographic session protection.
            </p>
          </div>
        </div>

        {/* Security Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Account Identity</span>
            <strong className="text-white text-xs block truncate">{email}</strong>
            <span className="text-[9px] text-emerald-400 font-bold block">Status: {accountStatus.toUpperCase()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Authentication Mechanism</span>
            <strong className="text-white text-xs block">Local Bcrypt Security</strong>
            <span className="text-[9px] text-indigo-300 block">Salted Multi-Round Hashing</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Cryptographic Session</span>
            <strong className="text-white text-xs block">JWT Bearer Token</strong>
            <span className="text-[9px] text-cyan-300 block">Auto Refresh Rotation</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Account Created</span>
            <strong className="text-white text-xs block">
              {createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Session'}
            </strong>
            <span className="text-[9px] text-slate-400 block font-mono">{maskedId}</span>
          </div>
        </div>

        {/* Privacy & Multi-Tenant Data Transparency */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Privacy & Data Protection Transparency
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
              MULTI-TENANT ISOLATED
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            SkillBridge operates under strict context isolation. Your uploaded documents, extracted skills, and interview simulations are scoped exclusively to your tenant profile and are never commingled or used to fine-tune public foundation models. AI inference is routed through an authenticated gateway with sanitized payloads.
          </p>

          <div className="pt-2 flex items-center gap-4 text-[10px] text-slate-500 border-t border-white/5 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Zero Third-Party Ad Trackers
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Bcrypt Hashed Credentials
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Ephemeral Inference Context
            </span>
          </div>
        </div>
      </GlassPanel>

      {/* Danger Zone: Session Termination */}
      <GlassPanel className="p-6 sm:p-8 space-y-4 border-rose-500/20 bg-rose-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Danger Zone • Session Lifecycle
            </h4>
            <p className="text-[11px] text-slate-400">
              Revoke active refresh tokens, clear local session state, and securely terminate your session across devices.
            </p>
          </div>

          <button
            onClick={() => setIsConfirmModalOpen(true)}
            type="button"
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </GlassPanel>

      {/* Logout Confirmation Dialog */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-white">Confirm Sign Out</h4>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                type="button"
                aria-label="Close"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Are you sure you want to terminate your current SkillBridge session? Your refresh token will be revoked on the server and you will be redirected to the authentication portal.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
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
        </div>
      )}
    </div>
  );
};
