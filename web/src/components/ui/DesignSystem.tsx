import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export type IconName = 'study' | 'ranking' | 'progress' | 'feed' | 'profile' | 'subjects' | 'seasons' | 'admin' | 'arrow' | 'close' | 'check' | 'bolt' | 'menu' | 'logout';
const paths: Record<IconName, ReactNode> = {
  study: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/></>,
  ranking: <><path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7-3h6v3"/></>,
  progress: <><path d="M4 20V10h4v10m2 0V5h4v15m2 0V2h4v18M3 21h18"/></>,
  feed: <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 5h10M7 13h6"/>,
  profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  subjects: <><path d="M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H3V4Zm18 0h-6a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h5V4Z"/></>,
  seasons: <><path d="M4 5h16v16H4zM8 2v6m8-6v6M4 10h16m-12 4h2m4 0h2m-8 3h2"/></>,
  admin: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  logout: <><path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h13"/></>,
};
export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>;
}

/** The supplied artwork is displayed intact, with its surrounding whitespace clipped by CSS. */
export function BrandLogo({ className = '' }: { className?: string }) {
  return <span className={`brand-logo ${className}`}><img src="/brand/estuda-junto.png?v=05cce5a6" alt="Estuda Junto" width="1672" height="941" fetchPriority="high" /></span>;
}

export function PageHeader({ eyebrow, title, description, actions, children, className = '' }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string }) {
  return <header className={`ej-page-header ${className}`}><div className="ej-page-heading">{eyebrow && <p className="ej-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="ej-page-description">{description}</p>}</div>{actions && <div className="ej-page-actions">{actions}</div>}{children}</header>;
}
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ej-card ${className}`} {...props} />;
}
export type Tone = 'blue' | 'yellow' | 'purple' | 'green' | 'neutral';
export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={`ej-badge ej-tone-${tone} ${className}`}>{children}</span>;
}
export function Button({ children, variant = 'primary', busy, className = '', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; busy?: boolean }) {
  return <button className={`ej-button ej-button-${variant} ${className}`} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>{busy && <span className="ej-spinner" aria-hidden="true"/>}{children}</button>;
}
export function StatCard({ label, value, detail, icon, tone = 'blue' }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; tone?: Tone }) {
  return <Card className={`ej-stat ej-tone-${tone}`}><div className="ej-stat-label">{label}{icon && <span aria-hidden="true">{icon}</span>}</div><strong className="ej-stat-value">{value}</strong>{detail && <div className="ej-stat-detail">{detail}</div>}</Card>;
}
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const progress = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label={label || 'Progresso'} className="ej-progress"><span style={{ width: `${progress}%` }}/></div>;
}
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`ej-skeleton ${className}`}/>;
}
