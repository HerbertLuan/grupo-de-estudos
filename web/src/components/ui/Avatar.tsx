import { useState } from 'react';
export interface AvatarProps { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; }
const sizeClasses = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-xl', xl:'w-20 h-20 text-3xl' };
export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).slice(0,2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
  return <div className={`ej-avatar rounded-full flex items-center justify-center shrink-0 overflow-hidden font-bold ${sizeClasses[size]}`}>
    {src && src !== failedSource ? <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setFailedSource(src)}/> : <span aria-label={name}>{initials}</span>}
  </div>;
}
