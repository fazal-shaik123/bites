import React from 'react';
import { TileData } from './TileGrid.js';
import { Heart, X } from 'lucide-react';

interface UnlockModalProps {
  tile: TileData | null;
  onClose: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ tile, onClose }) => {
  if (!tile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-popIn">
      <div className="bg-white dark:bg-stone-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 dark:border-stone-700 relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Sparkle */}
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
          <Heart className="w-6 h-6 fill-rose-500 animate-bounce" />
        </div>

        <h3 className="text-xl font-black text-rose-500 dark:text-rose-400 mb-1">
          Love you Sonu! 💕
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 font-semibold">
          You unlocked Tile ({tile.row_idx + 1}, {tile.col_idx + 1}) ✨
        </p>

        {/* Tile Image Preview */}
        {tile.imageUrl && (
          <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden shadow-md mb-4 border border-rose-200 dark:border-stone-700">
            <img
              src={tile.imageUrl}
              alt="Unlocked Tile"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Hidden Note from Admin */}
        <div className="bg-rose-50/80 dark:bg-stone-750/80 p-4 rounded-2xl border border-rose-100 dark:border-stone-700 mb-5">
          <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1">
            Secret Note 💌
          </p>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-200 italic">
            "{tile.hidden_note || 'Love you Sonu! Proud of you for taking care of yourself today! 💕'}"
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all shadow-md text-sm"
        >
          Love you too! Keep going 💕 💖
        </button>
      </div>
    </div>
  );
};
