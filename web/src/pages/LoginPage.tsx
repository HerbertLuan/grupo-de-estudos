import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button, Icon } from '../components/ui/DesignSystem';

export const LoginPage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try { await authService.login(nickname, password); navigate('/'); }
    catch (err: any) { setError(err.message || 'Erro ao fazer login'); }
    finally { setIsLoading(false); }
  };
  return <AuthLayout title="Entrar">
    <p className="ej-eyebrow">Seu espaço de evolução</p>
    <h1>Bom ter você aqui.</h1>
    <p className="ej-auth-intro">Entre na sua conta e dê continuidade à sua jornada de estudos.</p>
    {error && <div role="alert" id="login-error" className="ej-form-error">{error}</div>}
    <form onSubmit={handleSubmit} aria-busy={isLoading} aria-describedby={error ? 'login-error' : undefined}>
      <div className="ej-field"><label htmlFor="login-nickname">Apelido</label><input id="login-nickname" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={nickname} onChange={e => setNickname(e.target.value.trim())} placeholder="seu_apelido" required/></div>
      <div className="ej-field"><label htmlFor="login-password">Senha</label><div className="ej-password"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required/><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></div>
      <Button type="submit" busy={isLoading} className="ej-auth-submit"><span>{isLoading ? 'Entrando…' : 'Entrar na minha conta'}</span><Icon name="arrow" size={18}/></Button>
    </form>
    <p className="ej-auth-switch">Primeira vez por aqui?<Link to="/register">Crie sua conta</Link></p>
  </AuthLayout>;
};
