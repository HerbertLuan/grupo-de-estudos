import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/ui/LoadingState';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JoinGroupPage } from './pages/JoinGroupPage';
import { StudyPage } from './pages/StudyPage';
import { RankingPage } from './pages/RankingPage';
import { SeasonsPage } from './pages/SeasonsPage';
import { ProgressPage } from './pages/ProgressPage';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { UserProgressPage } from './pages/UserProgressPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, profile, user } = useAuthContext();

  if (loading) {
    return <LoadingState fullPage message="Carregando..." />;
  }

  if (user && !profile) {
    return <LoadingState fullPage message="Configurando perfil..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user has no group, redirect to join group page
  if (profile && !profile.groupId) {
    return <Navigate to="/join-group" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, profile, user } = useAuthContext();

  if (loading) {
    return <LoadingState fullPage message="Carregando..." />;
  }

  if (user && !profile) {
    return <LoadingState fullPage message="Configurando perfil..." />;
  }

  if (isAuthenticated) {
    if (profile && !profile.groupId) {
      return <Navigate to="/join-group" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function SemiProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user, profile } = useAuthContext();

  if (loading) {
    return <LoadingState fullPage message="Carregando..." />;
  }

  if (user && !profile) {
    return <LoadingState fullPage message="Configurando perfil..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Semi-protected: authenticated but may not have a group */}
      <Route path="/join-group" element={<SemiProtectedRoute><JoinGroupPage /></SemiProtectedRoute>} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<StudyPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="seasons" element={<SeasonsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="progress/:uid" element={<UserProgressPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
