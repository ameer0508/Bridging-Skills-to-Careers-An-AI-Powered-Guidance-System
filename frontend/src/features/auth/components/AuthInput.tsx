import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon: Icon, rightElement, className = '', ...props }, ref) => {
    const inputId = props.id || props.name;

    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-aurora-muted">
            {label}
          </label>
          {error && (
            <span className="text-[11px] font-medium text-rose-700 font-sans normal-case">
              {error}
            </span>
          )}
        </div>

        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurora-muted">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            {...props}
            className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${
              rightElement ? 'pr-10' : 'pr-4'
            } py-3 bg-aurora-canvas/60 border ${
              error
                ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-aurora-line focus:border-indigo-400 focus:ring-indigo-500/20'
            } rounded-xl text-aurora-ink placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${className}`}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
