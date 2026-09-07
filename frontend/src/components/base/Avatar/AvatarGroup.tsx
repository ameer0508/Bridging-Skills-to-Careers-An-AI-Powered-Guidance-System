import React from 'react';
import { AvatarSize } from './Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  max?: number;
  className?: string;
  children: React.ReactNode;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  size = 'md',
  max,
  className = '',
  children,
  ...props
}) => {
  const childrenArray = React.Children.toArray(children);
  const totalAvatars = childrenArray.length;

  const visibleAvatars = max ? childrenArray.slice(0, max) : childrenArray;
  const remainingCount = max && totalAvatars > max ? totalAvatars - max : 0;

  return (
    <div className={`flex items-center -space-x-2 overflow-hidden ${className}`} {...props}>
      {visibleAvatars.map((child, index) => (
        <div key={index} className="inline-block ring-2 ring-[var(--color-bg-app)] rounded-full">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`relative inline-flex items-center justify-center rounded-full bg-[var(--primitive-neutral-700)] text-[var(--color-text-primary)] font-bold text-xs ring-2 ring-[var(--color-bg-app)] shrink-0 ${
            size === 'xs' ? 'w-5 h-5 text-[9px]' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-xs'
          }`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';
