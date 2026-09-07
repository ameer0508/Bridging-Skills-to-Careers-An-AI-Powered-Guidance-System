import React, { forwardRef, useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { PasswordStrengthBar } from './PasswordStrengthBar';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showStrengthMeter?: boolean;
  onPasswordChange?: (val: string) => void;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = 'Password', error, showStrengthMeter = false, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [passwordValue, setPasswordValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        setIsCapsLockOn(true);
      } else {
        setIsCapsLockOn(false);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordValue(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const calculateStrength = (pass: string) => {
      let score = 0;
      if (pass.length >= 8) score++;
      if (/[A-Z]/.test(pass)) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^A-Za-z0-9]/.test(pass)) score++;
      return score;
    };

    const strengthScore = calculateStrength(passwordValue);

    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
          {error && (
            <span className="text-[11px] font-medium text-rose-400 font-sans normal-case">
              {error}
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>

          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            onKeyDown={handleKeyDown}
            {...props}
            onChange={handleChange}
            className={`w-full pl-10 pr-10 py-3 bg-slate-900/80 border ${
              error
                ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-500/20'
            } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Caps Lock Indicator */}
        {isCapsLockOn && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 pt-0.5 font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Caps Lock is ON</span>
          </div>
        )}

        {/* Optional Strength Meter */}
        {showStrengthMeter && (
          <PasswordStrengthBar score={strengthScore} passwordValue={passwordValue} />
        )}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
