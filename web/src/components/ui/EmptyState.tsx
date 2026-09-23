import { Icon } from './DesignSystem';
export interface EmptyStateProps { icon:string; title:string; description?:string; }
export function EmptyState({ title, description }: EmptyStateProps) {
 return <div className="ej-empty"><div className="ej-empty-symbol" aria-hidden="true"><Icon name="subjects" size={26}/></div><h3>{title}</h3>{description && <p>{description}</p>}</div>;
}
