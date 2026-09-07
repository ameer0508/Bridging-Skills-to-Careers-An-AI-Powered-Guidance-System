import React, { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

const statusColorMap = {
  online: 'bg-[var(--color-status-success-text)]',
  offline: 'bg-[var(--color-text-disabled)]',
  busy: 'bg-[var(--color-status-error-text)]',
  away: 'bg-[var(--color-status-warning-text)]',
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, name, size = 'md', status, className = '', ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    const hasImage = src && !imageError;
    const initials = getInitials(name || alt);

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center rounded-full bg-[var(--primitive-neutral-800)] text-[var(--color-text-primary)] font-semibold select-none shrink-0 border border-[var(--color-border-subtle)] ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {hasImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span>{initials}</span>
        )}
        {status && (
          <span
            className={`absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--color-bg-surface)] ${statusColorMap[status]} ${
              size === 'xs' || size === 'sm' ? 'w-2 h-2' : size === 'lg' || size === 'xl' ? 'w-4 h-4' : 'w-2.5 h-2.5'
            }`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
