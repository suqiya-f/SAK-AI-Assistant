import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import Splash from './components/Splash';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(() => {
    // Show splash only on a fresh tab session, not on every route change
    return sessionStorage.getItem('sak_splash_seen') === '1';
  });

  const finishSplash = () => {
    sessionStorage.setItem('sak_splash_seen', '1');
    setSplashDone(true);
  };

  return (
    <ThemeProvider>
      {!splashDone && <Splash onDone={finishSplash} />}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<PublicOnly><Auth /></PublicOnly>} />
            <Route path="/app/*" element={<Protected><Dashboard /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <SpeedInsights />
    </ThemeProvider>
  );
}
