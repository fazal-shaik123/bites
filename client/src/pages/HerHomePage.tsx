import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api.js';
import { Navbar } from '../components/Navbar.js';
import { MealCard, MealItem } from '../components/MealCard.js';
import { GentleBanner } from '../components/GentleBanner.js';
import { LoveNoteCard } from '../components/LoveNoteCard.js';
import { UnlockModal } from '../components/UnlockModal.js';
import { CelebrationModal } from '../components/CelebrationModal.js';
import { TileData } from '../components/TileGrid.js';
import { Sparkles, Image, ArrowRight } from 'lucide-react';

export const HerHomePage: React.FC = () => {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [todayString, setTodayString] = useState<string>('');
  const [gentleReminder, setGentleReminder] = useState<string | null>(null);
  const [loveNote, setLoveNote] = useState<any | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);

  // Modals
  const [unlockedTilePopup, setUnlockedTilePopup] = useState<TileData | null>(null);
  const [celebrationPuzzle, setCelebrationPuzzle] = useState<any | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [mealsData, reminderData, noteData, puzzleData] = await Promise.all([
        apiRequest<{ today: string; meals: MealItem[] }>('/api/meals/today'),
        apiRequest<{ showBanner: boolean; message: string }>('/api/reminders/active-banner'),
        apiRequest<{ note: any }>('/api/notes/today'),
        apiRequest<{ puzzle: any; tiles: TileData[] }>('/api/puzzles/active')
      ]);

      setMeals(mealsData.meals || []);
      setTodayString(mealsData.today);
      if (reminderData.showBanner) {
        setGentleReminder(reminderData.message);
      } else {
        setGentleReminder(null);
      }
      setLoveNote(noteData.note || null);
      setActivePuzzle(puzzleData.puzzle || null);
    } catch (err) {
      console.error('Failed to load home data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Bites 🍓';
    loadData();
  }, []);

  const handleLogMeal = async (configId: number, note?: string, photo?: File) => {
    setIsLogging(true);
    try {
      const formData = new FormData();
      formData.append('meal_config_id', String(configId));
      if (note) formData.append('note', note);
      if (photo) formData.append('photo', photo);

      const res = await apiRequest<{
        success: boolean;
        unlockResult: {
          unlocked: boolean;
          tile?: TileData | null;
          puzzleCompleted: boolean;
          completedPuzzle?: any | null;
        };
      }>('/api/meals/log', {
        method: 'POST',
        body: formData
      });

      // Reload home state
      await loadData();

      // If a tile was unlocked, show cute popup!
      if (res.unlockResult?.unlocked && res.unlockResult.tile) {
        const fullTile: TileData = {
          ...res.unlockResult.tile,
          imageUrl: `/api/puzzles/${res.unlockResult.tile.puzzle_id}/tiles/${res.unlockResult.tile.id}/image`
        };
        setUnlockedTilePopup(fullTile);
      }

      // If puzzle completed, show full celebration!
      if (res.unlockResult?.puzzleCompleted && res.unlockResult.completedPuzzle) {
        setCelebrationPuzzle({
          ...res.unlockResult.completedPuzzle,
          fullImageUrl: `/api/puzzles/${res.unlockResult.completedPuzzle.id}/full-image`
        });
      }
    } catch (err: any) {
      alert(err.message || 'Could not log meal.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleUndo = async (logId: number) => {
    try {
      await apiRequest(`/api/meals/undo/${logId}`, { method: 'POST' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Could not undo meal.');
    }
  };

  const formattedDate = todayString
    ? new Date(todayString + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
    : '';

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pb-28 text-stone-800 dark:text-stone-100 transition-colors">
      <Navbar />

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        {/* Header Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
              {formattedDate} • Love you Sonu 💕
            </span>
            <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-1.5 mt-0.5">
              Today's Bites for Sonu 🍓
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
            <Sparkles className="w-5 h-5 fill-rose-400 stroke-rose-500" />
          </div>
        </div>

        {/* Gentle Reminder Banner (if any passed meal was skipped) */}
        {gentleReminder && <GentleBanner message={gentleReminder} />}

        {/* Love Note Card */}
        {loveNote && <LoveNoteCard note={loveNote} />}

        {/* Active Puzzle Teaser Card */}
        {activePuzzle && (
          <div
            onClick={() => navigate('/app/puzzle')}
            className="cursor-pointer bg-gradient-to-r from-rose-500 via-rose-500 to-pink-500 text-white p-5 rounded-3xl shadow-soft hover:shadow-soft-lg transition-all active:scale-[0.99] flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90 block">
                Current Photo Puzzle 🧩
              </span>
              <h3 className="font-bold text-lg leading-tight">
                {activePuzzle.title}
              </h3>
              <p className="text-xs opacity-90">
                {activePuzzle.unlocked_tiles} of {activePuzzle.total_tiles} tiles unlocked
              </p>
            </div>
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Meals List */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Meals for today
            </h2>
            <span className="text-xs text-rose-500 dark:text-rose-400 font-semibold">
              {meals.filter((m) => m.isLogged).length} of {meals.length} eaten
            </span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-stone-400 text-sm">
              Loading your yummy meals... 🥞
            </div>
          ) : (
            meals.map((meal) => (
              <MealCard
                key={meal.config.id}
                meal={meal}
                onLog={handleLogMeal}
                onUndo={handleUndo}
                isLogging={isLogging}
              />
            ))
          )}
        </div>
      </main>

      {/* Unlock Note Popup */}
      <UnlockModal
        tile={unlockedTilePopup}
        onClose={() => setUnlockedTilePopup(null)}
      />

      {/* Celebration Modal on 100% puzzle complete */}
      <CelebrationModal
        puzzle={celebrationPuzzle}
        onClose={() => setCelebrationPuzzle(null)}
      />
    </div>
  );
};
