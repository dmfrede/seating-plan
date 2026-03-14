import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import LandingPage from './Auth/LandingPage';
import LoginForm from './Auth/LoginForm';
import SignupForm from './Auth/SignupForm';
import MainApp from './App/MainApp';
import Demo from '../pages/Demo';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-agerup-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function LoginPage() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/app');
    } catch {
      // error is surfaced via useAuth
    }
  };

  return (
    <LoginForm
      onLogin={handleLogin}
      onSwitchToSignup={() => navigate('/signup')}
      onDemo={() => navigate('/demo')}
      error={error}
      loading={loading}
    />
  );
}

function SignupPage() {
  const { signup, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      await signup(email, password, name);
      navigate('/app');
    } catch {
      // error is surfaced via useAuth
    }
  };

  return (
    <SignupForm
      onSignup={handleSignup}
      onSwitchToLogin={() => navigate('/login')}
      onDemo={() => navigate('/demo')}
      error={error}
      loading={loading}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/app" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
