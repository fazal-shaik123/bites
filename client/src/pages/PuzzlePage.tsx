import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { Navbar } from '../components/Navbar.js';
import { TileGrid, TileData } from '../components/TileGrid.js';
import { UnlockModal } from '../components/UnlockModal.js';
import { CelebrationModal } from '../components/CelebrationModal.js';
import { Sparkles, Gift, Info } from 'lucide-react';

export const PuzzlePage: React.FC = () => {
  const [puzzle, setPuzzle] = useState<any | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<TileData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const loadPuzzle = async () => {
    try {
      const data = await apiRequest<{ puzzle: any; tiles: TileData[] }>('/api/puzzles/active');
      setPuzzle(data.puzzle);
      setTiles(data.tiles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPuzzle();
  }, []);

  const progressPercent = puzzle && puzzle.total_tiles > 0
    ? Math.round((puzzle.unlocked_tiles / puzzle.total_tiles) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pb-28 text-stone-800 dark:text-stone-100 transition-colors">
      <Navbar />

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {loading ? (
          <div className="text-center py-20 text-stone-400 text-sm">
            Unfolding your puzzle... ✨
          </div>
        ) : !puzzle ? (
          <div className="bg-white dark:bg-stone-800 rounded-3xl p-8 text-center border border-rose-100 dark:border-stone-700 shadow-soft">
            <span className="text-4xl mb-3 block">🧩</span>
            <h3 className="font-bold text-lg mb-1">No Active Puzzle</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Admin is preparing a sweet new puzzle for you! Check back soon 💕
            </p>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  Secret Photo Reveal
                </span>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  {puzzle.unlocked_tiles} / {puzzle.total_tiles} unlocked
                </span>
              </div>
              <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">
                {puzzle.title}
              </h1>

              {/* Progress bar */}
              <div className="w-full bg-rose-100 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden mt-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Puzzle Board Grid */}
            <div className="py-2">
              <TileGrid
                gridSize={puzzle.grid_size}
                tiles={tiles}
                onTileClick={(tile) => setSelectedTile(tile)}
              />
            </div>

            {/* Instruction / Note */}
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs text-stone-600 dark:text-stone-300">
              <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p>
                Each meal you eat unlocks one random tile. Tap any unlocked tile to re-read its hidden love note! 💌
              </p>
            </div>

            {/* Reward teaser */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200/80 dark:border-stone-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-500 shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Final Reward
                </span>
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                  {puzzle.reward_message}
                </p>
              </div>
            </div>

            {/* If completed, banner to re-view full photo */}
            {puzzle.is_completed && (
              <button
                onClick={() => setShowCelebration(true)}
                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-soft hover:shadow-soft-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>View Full Photo & Celebration 🎉</span>
              </button>
            )}
          </>
        )}
      </main>

      {/* Note modal */}
      <UnlockModal
        tile={selectedTile}
        onClose={() => setSelectedTile(null)}
      />

      {/* Celebration modal */}
      {puzzle && showCelebration && (
        <CelebrationModal
          puzzle={puzzle}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
};
