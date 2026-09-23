import { Link, NavLink } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { BrandLogo, Icon } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import { useGroupAdmin } from '../../hooks/useGroupAdmin';
import { navigationItems } from './navigation';

export function DesktopSidebar() {
  const { user, profile } = useAuthContext();
  const { isAdmin } = useGroupAdmin();
  const displayName = profile?.name || user?.displayName || 'Estudante';
  return <aside className="ej-sidebar" aria-label="Navegação principal">
    <Link to="/" className="ej-sidebar-brand" aria-label="Estuda Junto — meu estudo"><BrandLogo/><p>Disciplina. Evolução. Conquistas.</p></Link>
    <nav>
      {(['routine', 'community'] as const).map(section => <div key={section}>
        <p className="ej-nav-section">{section === 'routine' ? 'Sua jornada' : 'Vamos juntos'}</p>
        {navigationItems.filter(item => item.section === section && (!item.admin || isAdmin)).map(item => <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({isActive}) => `ej-nav-link${isActive ? ' active' : ''}`}><Icon name={item.icon}/><span>{item.label}</span></NavLink>)}
      </div>)}
    </nav>
    <div className="ej-sidebar-note"><p>Disciplina hoje,<br/><em>conquistas amanhã.</em></p></div>
    <Link to="/profile" className="ej-sidebar-user"><Avatar name={displayName} src={profile?.avatarUrl} size="md"/><div className="min-w-0 flex-1"><strong>{displayName}</strong><small>{profile?.nickname ? `@${profile.nickname}` : 'Meu perfil'}</small></div><Icon name="arrow" size={16}/></Link>
  </aside>;
}
