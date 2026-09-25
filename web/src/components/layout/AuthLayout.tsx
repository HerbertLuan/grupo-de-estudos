import { useEffect, type ReactNode } from 'react';
import { BrandLogo } from '../ui/DesignSystem';
import { ThemeSelect } from '../ui/ThemeSelect';
import './auth.css';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => { document.title = `${title} · Estuda Junto`; }, [title]);
  return <main className="ej-auth">
    <section className="ej-auth-brand" aria-label="Estuda Junto">
      <BrandLogo/>
      <div className="ej-auth-manifesto"><p className="ej-eyebrow">O próximo passo é seu.</p><h2>Disciplina hoje.<br/><span>Conquistas<br/>amanhã.</span></h2><p>Mais que estudos, uma comunidade. Construa sua rotina, acompanhe sua evolução e vá mais longe, junto.</p></div>
      <div className="ej-auth-values"><span>Disciplina</span><span>Evolução</span><span>Conquistas</span><span>Juntos</span></div>
      <div className="ej-brand-angle" aria-hidden="true"/>
    </section>
    <section className="ej-auth-form-side" aria-label={title}>
      <div className="ej-auth-theme"><ThemeSelect/></div>
      <div className="ej-auth-mobile-logo"><BrandLogo/><span>Disciplina hoje.<br/>Conquistas amanhã.</span></div>
      <div className="ej-auth-form">{children}</div>
      <p className="ej-auth-footer">Estuda Junto · Cada dia de estudo conta.</p>
    </section>
  </main>;
}
