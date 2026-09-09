import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import { updateProfile, uploadAvatar } from '../services/profileService';
import { mapFirebaseError } from '../utils/errors';

export const EditProfilePage: React.FC = () => {
  const { user, profile } = useAuthContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo: 5MB', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('Selecione uma imagem válida', 'error');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || name.trim().length < 2) {
      showToast('Nome deve ter pelo menos 2 caracteres', 'error');
      return;
    }

    setIsLoading(true);
    try {
      let newAvatarUrl: string | undefined;

      // Upload avatar if changed
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.uid, avatarFile);
      }

      // Update profile
      await updateProfile(user.uid, {
        name: name.trim(),
        ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      });

      showToast('Perfil atualizado com sucesso!', 'success');
      navigate('/profile');
    } catch (err: any) {
      showToast(mapFirebaseError(err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto w-full pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary transition-colors p-1"
          aria-label="Voltar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Editar Perfil</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar section */}
        <div className="bg-bg-secondary rounded-2xl border border-border p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar
              src={avatarPreview}
              name={name || profile?.name || 'U'}
              size="xl"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent-primary text-white flex items-center justify-center shadow-lg hover:bg-accent-primary-hover transition-colors"
              aria-label="Alterar foto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
          >
            Alterar foto de perfil
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          {avatarFile && (
            <p className="text-xs text-text-muted">
              Nova foto: {avatarFile.name}
            </p>
          )}
        </div>

        {/* Fields */}
        <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
              placeholder="Seu nome completo"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Apelido
            </label>
            <input
              type="text"
              value={`@${profile?.nickname || ''}`}
              disabled
              className="w-full bg-bg-tertiary/50 border border-border rounded-xl px-4 py-3 text-text-muted cursor-not-allowed"
            />
            <p className="text-xs text-text-muted mt-1.5">O apelido não pode ser alterado.</p>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white font-bold rounded-xl py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-primary/25"
        >
          {isLoading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </form>
    </div>
  );
};
