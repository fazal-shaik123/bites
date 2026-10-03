import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { DisguisePage } from './pages/DisguisePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { HerHomePage } from './pages/HerHomePage.js';
import { PuzzlePage } from './pages/PuzzlePage.js';
import { AlbumPage } from './pages/AlbumPage.js';
import { AdminDashboard } from './pages/AdminDashboard.js';

// Route guards
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'her' }> = ({
  children,
  requiredRole
}) => {
  const { user, loading, instantLogin } = useAuth();
  const [autoLoggingIn, setAutoLoggingIn] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user && requiredRole !== 'admin' && !autoLoggingIn && !failed) {
      setAutoLoggingIn(true);
      instantLogin('her')
        .catch(() => {
          setFailed(true);
        })
        .finally(() => {
          setAutoLoggingIn(false);
        });
    }
  }, [loading, user, requiredRole, autoLoggingIn, failed, instantLogin]);

  if (loading || autoLoggingIn) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col items-center justify-center text-rose-500 gap-3">
        <div className="animate-spin text-4xl">🍓</div>
        <p className="text-xs text-stone-500 font-medium">Opening your cozy space...</p>
      </div>
    );
  }

  if (!user) {
    if (requiredRole === 'admin') {
      return <Navigate to="/login" replace />;
    }
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-3">🍓</div>
        <h2 className="text-base font-bold text-stone-700 dark:text-stone-200 mb-1">
          Waking up Bites server...
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 max-w-xs">
          The server is warming up. Tap below to enter! ✨
        </p>
        <button
          onClick={() => {
            setFailed(false);
            setAutoLoggingIn(true);
            instantLogin('her')
              .catch(() => setFailed(true))
              .finally(() => setAutoLoggingIn(false));
          }}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-sm shadow-soft hover:shadow-glow transition-all active:scale-95 cursor-pointer"
        >
          Enter Bites 🌸
        </button>
      </div>
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === 'admin') {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Disguise page is root */}
            <Route path="/" element={<DisguisePage />} />

            {/* Secret login screen */}
            <Route path="/login" element={<LoginPage />} />

            {/* Her views */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <HerHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/puzzle"
              element={
                <ProtectedRoute>
                  <PuzzlePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/album"
              element={
                <ProtectedRoute>
                  <AlbumPage />
                </ProtectedRoute>
              }
            />

            {/* Admin control dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
