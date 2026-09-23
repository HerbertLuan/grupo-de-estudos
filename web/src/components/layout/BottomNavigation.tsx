import { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '../ui/DesignSystem';
import { useDialogA11y } from '../ui/Dialog';
import { useGroupAdmin } from '../../hooks/useGroupAdmin';
import { navigationItems } from './navigation';

const primaryItems = [
  {path:'/',label:'Estudar',icon:'study' as const},
  {path:'/ranking',label:'Ranking',icon:'ranking' as const},
  {path:'/progress',label:'Progresso',icon:'progress' as const},
  {path:'/feed',label:'Comunidade',icon:'feed' as const},
];
export function BottomNavigation() {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useGroupAdmin();
  const location = useLocation();
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialogA11y(sheetRef, open, () => setOpen(false));
  const otherActive = !primaryItems.some(item => item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path));
  return <>
    <nav className="ej-bottom-nav" aria-label="Navegação no celular">
      {primaryItems.map(item => <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({isActive}) => `ej-bottom-link${isActive ? ' active' : ''}`}><Icon name={item.icon} size={21}/><span>{item.label}</span></NavLink>)}
      <button className={`ej-bottom-link${otherActive || open ? ' active' : ''}`} aria-expanded={open} aria-controls="mobile-more-menu" onClick={() => setOpen(true)}><Icon name="menu" size={21}/><span>Mais</span></button>
    </nav>
    {open && <div className="ej-more-overlay" onClick={() => setOpen(false)}><div id="mobile-more-menu" ref={sheetRef} className="ej-more-sheet" aria-labelledby="mobile-menu-title" onClick={event => event.stopPropagation()}>
      <div className="ej-sheet-handle"/>
      <div className="ej-sheet-title"><h2 id="mobile-menu-title" className="font-bold text-lg">Sua jornada</h2><button className="ej-icon-button" aria-label="Fechar menu" onClick={() => setOpen(false)}><Icon name="close"/></button></div>
      {navigationItems.filter(item => !primaryItems.some(primary => primary.path === item.path) && (!item.admin || isAdmin)).map(item => <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)} className="ej-nav-link"><Icon name={item.icon}/>{item.label}</NavLink>)}
      <NavLink to="/profile" onClick={() => setOpen(false)} className="ej-nav-link"><Icon name="profile"/>Meu perfil e configurações</NavLink>
    </div></div>}
  </>;
}
