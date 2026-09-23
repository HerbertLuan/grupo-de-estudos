import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { joinGroupWithCode, createGroup } from '../services/groupService';
import { authService } from '../services/authService';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button, Icon } from '../components/ui/DesignSystem';

export const JoinGroupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [customInviteCode, setCustomInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setError(''); setIsLoading(true);
    try { await joinGroupWithCode(code); navigate('/'); }
    catch (err: any) { setError(err.message || 'Código de convite inválido ou grupo não encontrado'); }
    finally { setIsLoading(false); }
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!groupName.trim()) { setError('Por favor, informe o nome do grupo.'); return; }
    setError(''); setIsLoading(true);
    try {
      const codeToSend = customInviteCode.trim() ? customInviteCode.trim().toUpperCase() : undefined;
      await createGroup(groupName.trim(), codeToSend); navigate('/');
    } catch (err: any) { setError(err.message || 'Erro ao criar grupo.'); }
    finally { setIsLoading(false); }
  };
  const handleLogout = async () => {
    try { await authService.logout(); navigate('/login'); }
    catch (err) { console.error('Erro ao sair:', err); }
  };
  return <AuthLayout title="Seu grupo">
    <p className="ej-eyebrow">Seu próximo passo</p><h1>Encontre sua comunidade.</h1>
    <p className="ej-auth-intro">Uma rotina fica mais forte quando é compartilhada. Entre em um grupo ou comece o seu.</p>
    <div className="ej-group-tabs" role="group" aria-label="Como participar">
      <button type="button" aria-pressed={activeTab === 'join'} onClick={() => { setActiveTab('join'); setError(''); }}>Tenho um convite</button>
      <button type="button" aria-pressed={activeTab === 'create'} onClick={() => { setActiveTab('create'); setError(''); }}>Criar um grupo</button>
    </div>
    {error && <div role="alert" id="group-error" className="ej-form-error">{error}</div>}
    {activeTab === 'join' ? <form onSubmit={handleJoin} aria-busy={isLoading} aria-describedby={error ? 'group-error' : undefined}>
      <div className="ej-field"><label htmlFor="group-code">Código de convite</label><input id="group-code" autoCapitalize="characters" spellCheck={false} value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="font-mono tracking-widest uppercase" placeholder="Ex: ESTUDO10" maxLength={10} aria-describedby="group-code-help" required/><p id="group-code-help" className="ej-field-note">Peça o código ao administrador do seu grupo.</p></div>
      <Button type="submit" busy={isLoading} disabled={code.length < 3} className="ej-auth-submit"><span>{isLoading ? 'Entrando…' : 'Entrar no grupo'}</span><Icon name="arrow" size={18}/></Button>
    </form> : <form onSubmit={handleCreate} aria-busy={isLoading} aria-describedby={error ? 'group-error' : undefined}>
      <div className="ej-field"><label htmlFor="group-name">Nome do grupo</label><input id="group-name" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ex: Foco nos estudos" required/></div>
      <div className="ej-field"><label htmlFor="group-invite">Código de convite <span className="font-normal text-text-muted">(opcional)</span></label><input id="group-invite" value={customInviteCode} onChange={e => setCustomInviteCode(e.target.value.toUpperCase())} placeholder="Ex: ESTUDO10" className="font-mono uppercase tracking-wider" maxLength={10} aria-describedby="group-invite-help"/><p id="group-invite-help" className="ej-field-note">Deixe em branco para gerar um código automaticamente.</p></div>
      <Button type="submit" busy={isLoading} disabled={groupName.trim().length < 2} className="ej-auth-submit"><span>{isLoading ? 'Criando…' : 'Criar meu grupo'}</span><Icon name="arrow" size={18}/></Button>
    </form>}
    <div className="ej-auth-switch"><Button type="button" variant="ghost" onClick={handleLogout}><Icon name="logout" size={16}/>Sair da conta</Button></div>
  </AuthLayout>;
};
