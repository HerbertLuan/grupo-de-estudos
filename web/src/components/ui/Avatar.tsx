import React from 'react';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-3xl'
};

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const cls = `rounded-full flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]}`;

  if (src) {
    return (
      <div className={cls}>
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${cls} bg-gradient-to-br from-accent-primary to-accent-success text-white font-bold`}>
      {initial}
    </div>
  );
}
