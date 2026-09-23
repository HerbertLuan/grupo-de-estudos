import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import { updateProfile, uploadAvatar } from '../services/profileService';
import { mapFirebaseError } from '../utils/errors';
import { PageHeader, Card, Button, Icon } from '../components/ui/DesignSystem';
import '../styles/social-redesign.css';

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
    <div className="ej-page space-y-6">
      <PageHeader eyebrow="Seu perfil" title="Sua identidade na comunidade." description="Escolha como você aparece para quem estuda com você." actions={<Button variant="ghost" onClick={() => navigate(-1)}>← Voltar</Button>} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="edit-profile-layout">
          <Card className="edit-profile-photo">
            <Avatar src={avatarPreview} name={name || profile?.name || 'U'} size="xl" />
            <div><h2 className="font-bold text-sm">Foto de perfil</h2><p className="mt-2 text-xs leading-relaxed text-text-secondary">Uma foto ajuda seu grupo a reconhecer você.</p></div>
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}><Icon name="profile" size={16} /> Alterar foto</Button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" aria-label="Selecionar foto de perfil" />
            <p className="text-xs text-text-secondary">Imagem de até 5 MB</p>
            {avatarFile && <p className="text-xs text-text-secondary break-all">Nova foto: {avatarFile.name}</p>}
          </Card>
          <Card className="edit-profile-fields">
            <h2>Informações pessoais</h2><p>Seu nome e apelido aparecem no feed, no ranking e no seu perfil.</p>
            <div className="space-y-6">
              <div><label htmlFor="profile-name">Nome de exibição</label><input id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary" placeholder="Seu nome completo" required minLength={2} autoComplete="name" /></div>
              <div><label htmlFor="profile-nickname">Apelido</label><input id="profile-nickname" type="text" value={`@${profile?.nickname || ''}`} disabled aria-describedby="nickname-help" className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-secondary cursor-not-allowed" /><p id="nickname-help" className="text-xs text-text-secondary mt-2">O apelido não pode ser alterado.</p></div>
            </div>
          </Card>
        </div>
        <div className="edit-profile-actions"><Button type="button" variant="secondary" onClick={() => navigate('/profile')}>Cancelar</Button><Button type="submit" busy={isLoading} disabled={isLoading || !name.trim()}>{isLoading ? 'Salvando...' : 'Salvar alterações'}</Button></div>
      </form>
    </div>
  );
};
