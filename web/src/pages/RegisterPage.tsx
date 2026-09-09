import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await authService.register(name, nickname, password);
      navigate('/join-group');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
      <div className="w-full max-w-md bg-bg-secondary p-8 rounded-3xl border border-border shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Criar Conta</h1>
          <p className="text-text-secondary">Junte-se ao Grupo de Estudos</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Apelido <span className="text-xs text-text-muted">(letras, números e _)</span>
            </label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value.trim().toLowerCase())}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
              placeholder="joao_silva"
              pattern="^[a-zA-Z0-9_]+$"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-accent-primary text-white font-bold rounded-xl py-3 mt-4 hover:bg-accent-primary-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? 'CRIANDO...' : 'CRIAR CONTA'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-accent-primary hover:underline">
            Já tem conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  );
};
