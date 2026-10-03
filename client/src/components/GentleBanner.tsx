import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';

interface GentleBannerProps {
  message: string;
}

export const GentleBanner: React.FC<GentleBannerProps> = ({ message }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !message) return null;

  return (
    <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 p-4 rounded-3xl shadow-soft flex items-start gap-3 relative animate-popIn">
      <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-500 text-lg">
        <Heart className="w-5 h-5 fill-amber-400 stroke-amber-500" />
      </div>
      <div className="flex-1 pr-6">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
          Gentle reminder 💛
        </span>
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-snug">
          {message}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
        title="Dismiss reminder"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
