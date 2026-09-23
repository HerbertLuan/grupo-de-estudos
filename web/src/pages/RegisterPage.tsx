import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button, Icon } from '../components/ui/DesignSystem';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try { await authService.register(name, nickname, password); navigate('/join-group'); }
    catch (err: any) { setError(err.message || 'Erro ao criar conta'); }
    finally { setIsLoading(false); }
  };
  return <AuthLayout title="Criar conta">
    <p className="ej-eyebrow">Toda conquista tem um começo</p><h1>Vamos evoluir juntos.</h1>
    <p className="ej-auth-intro">Crie sua conta. Depois, entre no seu grupo e comece a construir sua rotina.</p>
    {error && <div role="alert" id="register-error" className="ej-form-error">{error}</div>}
    <form onSubmit={handleSubmit} aria-busy={isLoading} aria-describedby={error ? 'register-error' : undefined}>
      <div className="ej-field"><label htmlFor="register-name">Nome completo</label><input id="register-name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Como você se chama?" required/></div>
      <div className="ej-field"><label htmlFor="register-nickname">Apelido</label><input id="register-nickname" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={nickname} onChange={e => setNickname(e.target.value.trim().toLowerCase())} placeholder="seu_apelido" pattern="^[a-zA-Z0-9_]+$" aria-describedby="nickname-help" required/><p id="nickname-help" className="ej-field-note">Use letras, números ou _ . Esse será seu acesso.</p></div>
      <div className="ej-field"><label htmlFor="register-password">Senha</label><div className="ej-password"><input id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="No mínimo 6 caracteres" minLength={6} required/><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></div>
      <Button type="submit" busy={isLoading} className="ej-auth-submit"><span>{isLoading ? 'Criando conta…' : 'Criar minha conta'}</span><Icon name="arrow" size={18}/></Button>
    </form>
    <p className="ej-auth-switch">Já faz parte?<Link to="/login">Entrar na conta</Link></p>
  </AuthLayout>;
};
