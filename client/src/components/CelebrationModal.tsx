import React, { useEffect } from 'react';
import { fireCelebrationConfetti } from '../utils/confetti.js';
import { Gift, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CelebrationModalProps {
  puzzle: {
    id: number;
    title: string;
    reward_message: string;
    fullImageUrl?: string | null;
  } | null;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ puzzle, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (puzzle) {
      fireCelebrationConfetti();
    }
  }, [puzzle]);

  if (!puzzle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-md animate-popIn">
      <div className="bg-white dark:bg-stone-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 dark:border-stone-700 text-center relative overflow-hidden">
        {/* Decorative corner sparkles */}
        <Sparkles className="w-6 h-6 text-amber-400 absolute top-4 left-4 animate-pulse" />
        <Sparkles className="w-6 h-6 text-rose-400 absolute top-4 right-12 animate-pulse" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-gradient-to-tr from-rose-400 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Gift className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-black text-rose-500 dark:text-rose-400 mb-1">
          Puzzle Complete! 🎉
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 font-medium">
          You revealed all the tiles! Here is your full photo:
        </p>

        {/* Full Revealed Photo */}
        {puzzle.fullImageUrl && (
          <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-rose-200 dark:border-stone-700 mb-4">
            <img
              src={puzzle.fullImageUrl}
              alt={puzzle.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Reward Message Box */}
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 dark:from-stone-900 dark:to-stone-850 p-4 rounded-2xl border border-amber-200 dark:border-stone-700 mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
            Your Special Reward 🎁
          </span>
          <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
            {puzzle.reward_message}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              navigate('/app/album');
            }}
            className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all shadow-md text-sm"
          >
            Save & View in Album 📖
          </button>
          <button
            onClick={onClose}
            className="w-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xs py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
