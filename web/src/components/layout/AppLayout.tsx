import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { DesktopSidebar } from './DesktopSidebar';
import { Avatar } from '../ui/Avatar';
import { BrandLogo, Icon } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import { navigationItems } from './navigation';

export function AppLayout() {
  const { profile } = useAuthContext();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const lastPath = useRef(location.pathname);
  const route = navigationItems.find(item => item.path === location.pathname);
  const title = route?.label || (location.pathname === '/profile/edit' ? 'Editar perfil' : location.pathname.startsWith('/progress/') ? 'Progresso do estudante' : 'Meu perfil');
  useEffect(() => {
    document.title = `${title} · Estuda Junto`;
    if (lastPath.current !== location.pathname) {
      window.scrollTo(0, 0);
      contentRef.current?.focus({ preventScroll: true });
      lastPath.current = location.pathname;
    }
  }, [title, location.pathname]);
  return <div className="ej-shell">
    <a className="ej-skip-link" href="#main-content">Pular para o conteúdo</a>
    <DesktopSidebar/>
    <div className="ej-main">
      <header className="ej-topbar">
        <div className="ej-topbar-context"><span>Estuda Junto</span><span aria-hidden="true">/</span><strong>{title}</strong></div>
        <Link to="/" className="ej-mobile-brand" aria-label="Estuda Junto — início"><BrandLogo/><span>Mais que estudos.<br/>Uma comunidade.</span></Link>
        <div className="ej-topbar-right"><time className="ej-topbar-date" dateTime={new Date().toISOString().slice(0,10)}>{new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long'}).format(new Date())}</time><span className="ej-topbar-streak" title="Sequência de dias de estudo"><Icon name="bolt" size={16}/>{profile?.currentStreak || 0} {(profile?.currentStreak || 0) === 1 ? 'dia' : 'dias'}</span><Link to="/profile" aria-label="Abrir meu perfil"><Avatar name={profile?.name || 'Estudante'} src={profile?.avatarUrl} size="sm"/></Link></div>
      </header>
      <main id="main-content" ref={contentRef} tabIndex={-1}><Outlet/></main>
    </div>
    <BottomNavigation/>
  </div>;
}
