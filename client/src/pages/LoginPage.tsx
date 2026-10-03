import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Heart, Lock, ArrowLeft, Delete } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [role, setRole] = useState<'her' | 'admin'>('admin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, instantLogin } = useAuth();
  const navigate = useNavigate();

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        submitLogin(nextPin);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const submitLogin = async (pinToSubmit: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await login(role, pinToSubmit);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN. Try again!');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-stone-50 to-peach-50/40 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 flex flex-col justify-center items-center p-6">
      <div className="max-w-sm w-full bg-white dark:bg-stone-800 rounded-3xl p-8 shadow-soft-lg border border-rose-100 dark:border-stone-700 relative animate-popIn">
        {/* Back to Disguise shortcut */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-5 left-5 p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
          <Heart className="w-7 h-7 fill-rose-500 text-rose-500 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-center text-stone-800 dark:text-stone-100 mb-1">
          Welcome to Bites
        </h2>
        <p className="text-xs text-center text-stone-500 dark:text-stone-400 mb-6">
          A cozy, private corner just for us ✨
        </p>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-900 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('her');
              setPin('');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'her'
                ? 'bg-white dark:bg-stone-800 text-rose-500 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
            }`}
          >
            <span>Sonu</span>
            <span>🌸</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setPin('');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'admin'
                ? 'bg-white dark:bg-stone-800 text-amber-500 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
            }`}
          >
            <span>Admin</span>
            <span>🛠️</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-300 text-center font-medium">
            {error}
          </div>
        )}

        {role === 'her' ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              No password needed for Sonu! 💕
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await instantLogin('her');
                  navigate('/app');
                } catch (err: any) {
                  setError('Unable to enter right now. Retrying...');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-400 via-pink-500 to-rose-400 text-white font-bold text-base shadow-soft hover:shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Enter Bites</span>
              <span>🌸✨</span>
            </button>
          </div>
        ) : (
          <>
            {/* PIN Dots Indicator */}
            <div className="flex justify-center space-x-4 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    pin.length > index
                      ? 'bg-amber-500 scale-110 shadow-sm'
                      : 'bg-stone-200 dark:bg-stone-700'
                  }`}
                />
              ))}
            </div>

            {/* 4-digit Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  disabled={loading}
                  className="h-14 rounded-2xl bg-stone-50 dark:bg-stone-750 hover:bg-amber-50 dark:hover:bg-stone-700 active:scale-95 text-stone-800 dark:text-stone-100 font-bold text-xl transition-all shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <div className="flex items-center justify-center" />
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                disabled={loading}
                className="h-14 rounded-2xl bg-stone-50 dark:bg-stone-750 hover:bg-amber-50 dark:hover:bg-stone-700 active:scale-95 text-stone-800 dark:text-stone-100 font-bold text-xl transition-all shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                disabled={loading || pin.length === 0}
                className="h-14 rounded-2xl bg-stone-50 dark:bg-stone-750 hover:bg-amber-50 dark:hover:bg-stone-700 active:scale-95 text-stone-500 dark:text-stone-400 font-bold text-lg transition-all shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-center disabled:opacity-40"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-center text-stone-400 dark:text-stone-500 mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Private 4-digit PIN authentication
            </p>
          </>
        )}
      </div>
    </div>
  );
};
