import React from 'react';
import { Sparkles } from 'lucide-react';

export interface TileData {
  id: number;
  puzzle_id: number;
  row_idx: number;
  col_idx: number;
  is_unlocked: number;
  unlocked_at?: string;
  hidden_note?: string;
  imageUrl?: string;
}

interface TileGridProps {
  gridSize: number;
  tiles: TileData[];
  onTileClick: (tile: TileData) => void;
  justUnlockedTileId?: number | null;
}

export const TileGrid: React.FC<TileGridProps> = ({
  gridSize,
  tiles,
  onTileClick,
  justUnlockedTileId
}) => {
  // Sort tiles by row and column
  const sortedTiles = [...tiles].sort((a, b) => {
    if (a.row_idx !== b.row_idx) return a.row_idx - b.row_idx;
    return a.col_idx - b.col_idx;
  });

  const getGridTemplateClass = () => {
    if (gridSize === 4) return 'grid-cols-4';
    if (gridSize === 5) return 'grid-cols-5';
    return 'grid-cols-3';
  };

  return (
    <div className="w-full aspect-square max-w-[420px] mx-auto p-2 bg-white dark:bg-stone-800 rounded-3xl shadow-soft-lg border border-rose-100 dark:border-stone-700">
      <div className={`grid ${getGridTemplateClass()} gap-2 w-full h-full`}>
        {sortedTiles.map((tile) => {
          const isUnlocked = tile.is_unlocked === 1;
          const isJustUnlocked = justUnlockedTileId === tile.id;

          return (
            <div
              key={tile.id}
              onClick={() => {
                if (isUnlocked) onTileClick(tile);
              }}
              className={`relative rounded-2xl overflow-hidden aspect-square transition-all duration-500 perspective-1000 ${
                isUnlocked
                  ? 'cursor-pointer hover:scale-[1.03] active:scale-95 shadow-sm'
                  : 'cursor-default select-none'
              }`}
            >
              <div
                className={`w-full h-full transform-style-preserve-3d transition-transform duration-700 ${
                  isJustUnlocked ? 'rotate-y-180 animate-hop' : ''
                }`}
              >
                {isUnlocked && tile.imageUrl ? (
                  /* Unlocked tile with sliced image */
                  <div className="w-full h-full relative group">
                    <img
                      src={tile.imageUrl}
                      alt={`Tile ${tile.row_idx}-${tile.col_idx}`}
                      className="w-full h-full object-cover rounded-2xl"
                      loading="lazy"
                    />
                    {tile.hidden_note && (
                      <div className="absolute bottom-1 right-1 bg-white/90 dark:bg-stone-900/90 rounded-full p-1 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] leading-none">💌</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Soft pastel placeholder pattern for locked tile */
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-rose-100/90 via-peach-50/70 to-pink-100/90 dark:from-stone-700/60 dark:via-stone-750 dark:to-stone-800 flex flex-col items-center justify-center p-1 border border-dashed border-rose-200/70 dark:border-stone-600/60">
                    <Sparkles className="w-4 h-4 text-rose-300 dark:text-stone-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-rose-300 dark:text-stone-500 mt-0.5">
                      ?
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
