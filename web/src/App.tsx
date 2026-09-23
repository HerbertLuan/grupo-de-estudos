import React, { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/ui/LoadingState';
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const JoinGroupPage = lazy(() => import('./pages/JoinGroupPage').then(module => ({ default: module.JoinGroupPage })));
const StudyPage = lazy(() => import('./pages/StudyPage').then(module => ({ default: module.StudyPage })));
const RankingPage = lazy(() => import('./pages/RankingPage').then(module => ({ default: module.RankingPage })));
const SeasonsPage = lazy(() => import('./pages/SeasonsPage').then(module => ({ default: module.SeasonsPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then(module => ({ default: module.ProgressPage })));
const FeedPage = lazy(() => import('./pages/FeedPage').then(module => ({ default: module.FeedPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage').then(module => ({ default: module.EditProfilePage })));
const UserProgressPage = lazy(() => import('./pages/UserProgressPage').then(module => ({ default: module.UserProgressPage })));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then(module => ({ default: module.SubjectsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));

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
        <Route path="admin" element={<AdminPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="seasons" element={<SeasonsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
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
          <MotionConfig reducedMotion="user"><Suspense fallback={<LoadingState fullPage message="Preparando seu espaço…" />}><AppRoutes /></Suspense></MotionConfig>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
