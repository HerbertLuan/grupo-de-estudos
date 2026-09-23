import React from 'react';
import { UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { Badge, Button, Icon } from '../ui/DesignSystem';
import '../../styles/social-redesign.css';

interface ProfileHeaderProps { profile: UserProfile; levelName: string; levelIcon: string; isCurrentUser: boolean; }

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, levelName, levelIcon, isCurrentUser }) => {
  const navigate = useNavigate();
  return (
    <section className="student-identity">
      <div className="student-identity__banner" aria-hidden="true"><span>DISCIPLINA / EVOLUÇÃO / CONQUISTAS</span></div>
      <div className="student-identity__content">
        <div className="student-identity__avatar"><Avatar src={profile.avatarUrl} name={profile.name} size="xl" /></div>
        <div className="student-identity__name">
          <p className="social-eyebrow">Perfil do estudante</p><h1>{profile.name}</h1>
          <p className="text-text-secondary">@{profile.nickname}</p>
          <div className="mt-4"><Badge tone="purple"><span aria-hidden="true">{levelIcon}</span> {levelName}</Badge></div>
        </div>
        {isCurrentUser && <Button variant="secondary" onClick={() => navigate('/profile/edit')}><Icon name="profile" size={17} /> Editar perfil</Button>}
      </div>
    </section>
  );
};
