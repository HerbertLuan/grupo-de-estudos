import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { joinGroupWithCode, createGroup } from '../services/groupService';
import { authService } from '../services/authService';

export const JoinGroupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  
  // Entrar no grupo
  const [code, setCode] = useState('');
  
  // Criar grupo
  const [groupName, setGroupName] = useState('');
  const [customInviteCode, setCustomInviteCode] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      await joinGroupWithCode(code);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Código de convite inválido ou grupo não encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!groupName.trim()) {
      setError('Por favor, informe o nome do grupo.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const codeToSend = customInviteCode.trim() ? customInviteCode.trim().toUpperCase() : undefined;
      await createGroup(groupName.trim(), codeToSend);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar grupo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
      <div className="w-full max-w-md bg-bg-secondary p-8 rounded-3xl border border-border shadow-2xl text-center">
        {/* Alternador de Abas */}
        <div className="flex bg-bg-tertiary p-1 rounded-2xl mb-8 border border-border">
          <button
            type="button"
            onClick={() => { setActiveTab('join'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'join'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Entrar com Código
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('create'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'create'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Criar Novo Grupo
          </button>
        </div>

        {activeTab === 'join' ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary mb-2">Entrar no Grupo</h1>
              <p className="text-text-secondary text-sm">
                Digite o código de convite fornecido pelo administrador
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-sm text-center">
                {error}
                <div className="mt-2 text-xs text-text-muted">
                  Se você ainda não possui um grupo, alterne para a aba <strong className="text-accent-primary cursor-pointer underline" onClick={() => setActiveTab('create')}>Criar Novo Grupo</strong>.
                </div>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-4 text-center text-2xl tracking-widest font-mono text-text-primary focus:outline-none focus:border-accent-primary transition-colors uppercase"
                  placeholder="Ex: ESTUDO10"
                  maxLength={10}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading || code.length < 3}
                className="w-full bg-accent-primary text-white font-bold rounded-xl py-3 hover:bg-accent-primary-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? 'ENTRANDO...' : 'ENTRAR NO GRUPO'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary mb-2">Criar Novo Grupo</h1>
              <p className="text-text-secondary text-sm">
                Crie um grupo de estudos privado para você e seus colegas
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Nome do Grupo
                </label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="Ex: Foco nos Estudos"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Código de Convite <span className="text-text-muted font-normal">(Opcional)</span>
                </label>
                <input 
                  type="text" 
                  value={customInviteCode}
                  onChange={(e) => setCustomInviteCode(e.target.value.toUpperCase())}
                  className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-mono tracking-wider text-text-primary focus:outline-none focus:border-accent-primary transition-colors uppercase"
                  placeholder="Ex: ESTUDO10"
                  maxLength={10}
                />
                <p className="text-xs text-text-muted mt-1">
                  Se deixar em branco, um código aleatório será gerado automaticamente.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || groupName.trim().length < 2}
                className="w-full bg-accent-primary text-white font-bold rounded-xl py-3 mt-4 hover:bg-accent-primary-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? 'CRIANDO...' : 'CRIAR GRUPO'}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
};

