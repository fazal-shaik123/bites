import React, { useState } from 'react';
import { Check, Camera, MessageSquare, RotateCcw, Clock } from 'lucide-react';

export interface MealItem {
  config: {
    id: number;
    name: string;
    icon: string;
    start_time: string;
    end_time: string;
  };
  isLogged: boolean;
  log?: {
    id: number;
    logged_at: string;
    note?: string;
    hasPhoto?: boolean;
    canUndo?: boolean;
  } | null;
  inWindow: boolean;
  windowPassed: boolean;
}

interface MealCardProps {
  meal: MealItem;
  onLog: (configId: number, note?: string, photo?: File) => Promise<void>;
  onUndo: (logId: number) => Promise<void>;
  isLogging: boolean;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onLog, onUndo, isLogging }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSubmit = async () => {
    await onLog(meal.config.id, note, photo || undefined);
    setShowDetails(false);
    setNote('');
    setPhoto(null);
  };

  return (
    <div
      className={`rounded-3xl p-5 border transition-all duration-300 shadow-soft ${
        meal.isLogged
          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
          : meal.inWindow
          ? 'bg-white dark:bg-stone-800 border-rose-300 dark:border-rose-500/50 ring-2 ring-rose-400/20 shadow-soft-lg'
          : 'bg-white/80 dark:bg-stone-800/80 border-stone-200/80 dark:border-stone-700/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-stone-700 flex items-center justify-center text-3xl shadow-inner">
            {meal.config.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
              {meal.config.name}
              {meal.inWindow && !meal.isLogged && (
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  Now
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {meal.config.start_time} - {meal.config.end_time}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {meal.isLogged ? (
            <div className="flex items-center space-x-1.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs shadow-sm animate-popIn">
                <Check className="w-4 h-4 stroke-[3] text-rose-500" />
                Love you Sonu 💕 💖
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                if (showDetails) {
                  handleSubmit();
                } else {
                  setShowDetails(true);
                }
              }}
              disabled={isLogging}
              className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>I ate</span>
              <span>🍽️</span>
            </button>
          )}
        </div>
      </div>

      {/* Log details if already logged */}
      {meal.isLogged && meal.log && (
        <div className="mt-3 pt-3 border-t border-rose-100 dark:border-stone-800/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div>
            {meal.log.note && (
              <p className="italic text-stone-600 dark:text-stone-300 mb-1">
                "{meal.log.note}"
              </p>
            )}
            <span>Logged at {meal.log.logged_at ? new Date(meal.log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>

          {/* 10-minute undo option */}
          {meal.log.canUndo && (
            <button
              onClick={() => onUndo(meal.log!.id)}
              className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-100/50 dark:hover:bg-stone-700 transition-colors"
              title="Undo within 10 minutes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Expandable note and photo form before logging */}
      {!meal.isLogged && showDetails && (
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-700/60 space-y-3 animate-popIn">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-rose-500">Optional details (never required)</span>
            <button
              onClick={() => setShowDetails(false)}
              className="text-stone-400 hover:text-stone-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="relative">
            <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="What did you have? (e.g. fluffy pancakes)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50 cursor-pointer text-xs text-stone-600 dark:text-stone-300 transition-colors">
              <Camera className="w-4 h-4 text-stone-400" />
              <span>{photo ? photo.name.substring(0, 16) + '...' : 'Add a photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setPhoto(e.target.files[0]);
                }}
              />
            </label>

            <button
              onClick={handleSubmit}
              disabled={isLogging}
              className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-md"
            >
              Confirm 🍽️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
