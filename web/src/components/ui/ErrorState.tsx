import { Button, Icon } from './DesignSystem';
export interface ErrorStateProps { message:string; onRetry?:()=>void; }
export function ErrorState({ message, onRetry }: ErrorStateProps) {
 return <div role="alert" className="ej-card ej-empty"><div className="ej-empty-symbol text-accent-danger" aria-hidden="true"><Icon name="bolt" size={24}/></div><h3>Não foi possível carregar.</h3><p>{message}</p>{onRetry && <Button className="mt-6" onClick={onRetry}>Tentar novamente</Button>}</div>;
}
