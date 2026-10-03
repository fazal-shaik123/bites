import React from 'react';
import { Mail, Sparkles } from 'lucide-react';

interface LoveNoteProps {
  note: {
    id: number;
    title: string;
    content: string;
  } | null;
}

export const LoveNoteCard: React.FC<LoveNoteProps> = ({ note }) => {
  if (!note) return null;

  return (
    <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 dark:from-stone-800 dark:via-stone-800 dark:to-stone-850 p-5 rounded-3xl border border-rose-200/80 dark:border-stone-700 shadow-soft relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2 text-rose-500 dark:text-rose-400">
        <Mail className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">
          A note for you 💕
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-auto" />
      </div>

      <h4 className="font-bold text-base text-stone-800 dark:text-stone-100 mb-1">
        {note.title}
      </h4>

      <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed">
        {note.content}
      </p>
    </div>
  );
};
