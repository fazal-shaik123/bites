import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { Navbar } from '../components/Navbar.js';
import { Calendar, Clock, Gift, BookOpen, ChevronRight, X, Sparkles } from 'lucide-react';

interface AlbumItem {
  id: number;
  title: string;
  grid_size: number;
  reward_message: string;
  started_at?: string;
  completed_at?: string;
  days_taken: number;
  fullImageUrl: string;
}

interface TimelineItem {
  tile_id: number;
  row_idx: number;
  col_idx: number;
  hidden_note?: string;
  unlocked_at?: string;
  meal_log_id?: number;
  log_date?: string;
  meal_note?: string;
  meal_name?: string;
  meal_icon?: string;
  imageUrl?: string;
}

export const AlbumPage: React.FC = () => {
  const [album, setAlbum] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPuzzle, setSelectedPuzzle] = useState<AlbumItem | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const loadAlbum = async () => {
    try {
      const data = await apiRequest<{ album: AlbumItem[] }>('/api/album');
      setAlbum(data.album || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbum();
  }, []);

  const openTimeline = async (item: AlbumItem) => {
    setSelectedPuzzle(item);
    setLoadingTimeline(true);
    try {
      const data = await apiRequest<{ puzzle: any; timeline: TimelineItem[] }>(
        `/api/album/${item.id}/timeline`
      );
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pb-28 text-stone-800 dark:text-stone-100 transition-colors">
      <Navbar />

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        <div>
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
            Memory Box
          </span>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">
            Our Album 📖
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Every completed puzzle and the memories made along the way
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-stone-400 text-sm">
            Opening the album... 🌸
          </div>
        ) : album.length === 0 ? (
          <div className="bg-white dark:bg-stone-800 rounded-3xl p-8 text-center border border-rose-100 dark:border-stone-700 shadow-soft">
            <span className="text-4xl mb-3 block">🎀</span>
            <h3 className="font-bold text-lg mb-1">Your Album is Starting!</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              When you finish your first photo puzzle, it will be kept here forever with every sweet memory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {album.map((item) => (
              <div
                key={item.id}
                onClick={() => openTimeline(item)}
                className="bg-white dark:bg-stone-800 rounded-3xl p-4 border border-rose-100 dark:border-stone-700 shadow-soft hover:shadow-soft-lg cursor-pointer transition-all active:scale-[0.99] flex gap-4"
              >
                {/* Photo thumbnail */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-stone-100 dark:border-stone-700 shadow-sm">
                  <img
                    src={item.fullImageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-bold text-base text-stone-800 dark:text-stone-100 leading-snug line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{item.reward_message}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.days_taken} day{item.days_taken > 1 ? 's' : ''} to complete
                    </span>
                    <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                      Timeline <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Puzzle Timeline Detail Drawer/Modal */}
      {selectedPuzzle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm animate-popIn">
          <div className="bg-white dark:bg-stone-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-rose-100 dark:border-stone-700 relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-700">
              <div>
                <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">
                  {selectedPuzzle.title}
                </h3>
                <p className="text-xs text-stone-400">
                  Completed in {selectedPuzzle.days_taken} days • {selectedPuzzle.grid_size}x{selectedPuzzle.grid_size} grid
                </p>
              </div>
              <button
                onClick={() => setSelectedPuzzle(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Full photo */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-rose-200 dark:border-stone-700 shadow-md">
                <img
                  src={selectedPuzzle.fullImageUrl}
                  alt={selectedPuzzle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Reward info */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-stone-750 border border-amber-200 dark:border-stone-700 text-xs">
                <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
                  Reward Earned 🎁
                </span>
                <p className="font-semibold text-stone-800 dark:text-stone-100">
                  {selectedPuzzle.reward_message}
                </p>
              </div>

              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-400 pt-2">
                Every Step & Note Timeline
              </h4>

              {loadingTimeline ? (
                <div className="text-center py-6 text-xs text-stone-400">
                  Loading timeline steps...
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-rose-100 dark:before:bg-stone-700">
                  {timeline.map((t, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative pl-1">
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold z-10 shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex-1 bg-stone-50 dark:bg-stone-750 p-3 rounded-2xl border border-stone-100 dark:border-stone-700 text-xs space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-[11px]">
                          <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                            {t.meal_icon || '🍽️'} {t.meal_name || 'Meal'}
                          </span>
                          <span>{t.log_date || (t.unlocked_at ? new Date(t.unlocked_at).toLocaleDateString() : '')}</span>
                        </div>

                        {t.hidden_note && (
                          <p className="text-stone-600 dark:text-stone-300 italic pt-0.5">
                            "{t.hidden_note}"
                          </p>
                        )}
                        {t.meal_note && (
                          <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                            She ate: {t.meal_note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
