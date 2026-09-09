import React from 'react';
import { UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderProps {
  profile: UserProfile;
  levelName: string;
  levelIcon: string;
  isCurrentUser: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, levelName, levelIcon, isCurrentUser }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center py-6 bg-bg-secondary rounded-2xl border border-border">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-bg-tertiary flex items-center justify-center text-4xl overflow-hidden border-4 border-bg-primary">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>
        {isCurrentUser && (
          <button 
            onClick={() => navigate('/profile/edit')}
            className="absolute bottom-0 right-0 w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center text-white border-2 border-bg-primary"
            aria-label="Editar Perfil"
          >
            ✏️
          </button>
        )}
      </div>
      
      <h1 className="mt-4 text-2xl font-bold text-text-primary">{profile.name}</h1>
      <span className="text-text-secondary">@{profile.nickname}</span>
      
      <div className="mt-3 inline-flex items-center gap-2 bg-bg-tertiary px-4 py-1.5 rounded-full border border-border">
        <span>{levelIcon}</span>
        <span className="text-sm font-medium text-text-primary">{levelName}</span>
      </div>
    </div>
  );
};
