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

  React.useEffect(() => {
    if (!loading && !user && requiredRole !== 'admin' && !autoLoggingIn) {
      setAutoLoggingIn(true);
      instantLogin('her').finally(() => {
        setAutoLoggingIn(false);
      });
    }
  }, [loading, user, requiredRole, autoLoggingIn, instantLogin]);

  if (loading || autoLoggingIn) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center text-rose-400">
        <div className="animate-spin text-3xl">🍓</div>
      </div>
    );
  }

  if (!user) {
    if (requiredRole === 'admin') {
      return <Navigate to="/login" replace />;
    }
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center text-rose-400">
        <div className="animate-spin text-3xl">🍓</div>
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
