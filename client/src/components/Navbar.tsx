import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { Heart, Image, BookOpen, Settings, LogOut, Sun, Moon, EyeOff, ShieldCheck, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const goToDisguise = () => {
    navigate('/');
  };

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAdminError(null);
    try {
      await login('admin', adminPin.trim());
      setShowAdminModal(false);
      setAdminPin('');
      navigate('/admin');
    } catch (err: any) {
      setAdminError('Incorrect PIN');
      setAdminPin('');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-rose-100 dark:border-stone-800 transition-colors">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Role indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🍓</span>
          <div>
            <span className="font-bold text-lg text-rose-500 dark:text-rose-400 leading-tight block">
              Bites
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {user ? (user.role === 'admin' ? 'Admin Mode 🛠️' : `Hi, ${user.name} 💕`) : ''}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1">
          {/* Admin key button if not admin */}
          {user?.role !== 'admin' && (
            <button
              onClick={() => setShowAdminModal(true)}
              title="Admin access"
              className="p-2 rounded-full text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}

          {/* Quick Stealth Disguise Button */}
          <button
            onClick={goToDisguise}
            title="Quick disguise (return to No Internet screen)"
            className="p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <EyeOff className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-600" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-full text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-rose-100 dark:border-stone-800 pb-safe shadow-lg">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all ${
                isActive
                  ? 'text-rose-500 font-bold scale-105'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`
            }
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Today</span>
          </NavLink>

          <NavLink
            to="/app/puzzle"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all ${
                isActive
                  ? 'text-rose-500 font-bold scale-105'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`
            }
          >
            <Image className="w-5 h-5" />
            <span className="text-xs">Puzzle</span>
          </NavLink>

          <NavLink
            to="/app/album"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all ${
                isActive
                  ? 'text-rose-500 font-bold scale-105'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`
            }
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">Album</span>
          </NavLink>

          {/* Admin Navigation Button - Always available */}
          {user?.role === 'admin' ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center space-y-1 transition-all ${
                  isActive
                    ? 'text-amber-500 font-bold scale-105'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`
              }
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Admin</span>
            </NavLink>
          ) : (
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex flex-col items-center justify-center space-y-1 text-stone-400 dark:text-stone-500 hover:text-amber-500 transition-all"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Admin</span>
            </button>
          )}
        </div>
      </nav>

      {/* Admin Login Modal (Accessible from her page with PIN 0602) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-popIn">
          <div className="bg-white dark:bg-stone-800 rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-stone-100 dark:border-stone-700 relative text-center">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-1">
              Admin Access 🛠️
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Enter 4-digit admin PIN
            </p>

            <form onSubmit={handleAdminPinSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-lg font-bold py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              {adminError && (
                <p className="text-xs text-rose-500 font-medium">
                  {adminError}
                </p>
              )}

              <button
                type="submit"
                disabled={loggingIn || adminPin.length !== 4}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-40"
              >
                Enter Admin Panel
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
