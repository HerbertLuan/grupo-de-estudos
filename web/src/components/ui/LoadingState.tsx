import { BrandLogo } from './DesignSystem';
export interface LoadingStateProps { fullPage?:boolean; message?:string; }
export function LoadingState({ fullPage, message = 'Carregando…' }: LoadingStateProps) {
 return <div role="status" aria-live="polite" className={`ej-loading flex flex-col items-center justify-center ${fullPage ? 'fixed inset-0 bg-bg-primary z-50' : 'p-8'}`}>{fullPage && <BrandLogo/>}<div className="ej-loading-track" aria-hidden="true"/><p className="text-text-secondary text-xs">{message}</p></div>;
}
