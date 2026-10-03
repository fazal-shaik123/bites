import React, { useState, useEffect } from 'react';

export const DragonPixelArt: React.FC = () => {
  const [isHopping, setIsHopping] = useState(false);

  const triggerHop = () => {
    if (isHopping) return;
    setIsHopping(true);

    setTimeout(() => {
      setIsHopping(false);
    }, 450);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerHop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHopping]);

  return (
    <div
      onClick={triggerHop}
      className="cursor-pointer select-none relative inline-block w-full max-w-[500px]"
      title="Press Space or tap to jump"
      role="button"
      tabIndex={0}
      aria-label="Offline Dinosaur Game"
    >
      <div className="relative h-[110px] w-full flex items-end">
        {/* T-Rex Dinosaur (matching user's uploaded reference) */}
        <div
          className={`absolute left-4 bottom-[10px] transition-transform duration-300 ease-out z-10 ${
            isHopping ? '-translate-y-16' : 'translate-y-0'
          }`}
        >
          <svg
            width="50"
            height="54"
            viewBox="0 0 44 47"
            shapeRendering="crispEdges"
            className="fill-[#202124]"
          >
            {/* Crown / Top of head */}
            <rect x="22" y="0" width="18" height="2" />
            <rect x="20" y="2" width="22" height="2" />
            <rect x="20" y="4" width="24" height="8" />

            {/* Eye (white square cutout) */}
            <rect x="24" y="4" width="2" height="2" fill="#FFFFFF" />

            {/* Snout & Mouth */}
            <rect x="20" y="12" width="24" height="2" />
            <rect x="20" y="14" width="14" height="2" />
            <rect x="30" y="14" width="14" height="2" />
            <rect x="20" y="16" width="18" height="2" />

            {/* Neck & Body */}
            <rect x="18" y="16" width="6" height="4" />
            <rect x="16" y="18" width="8" height="4" />
            <rect x="12" y="20" width="14" height="12" />
            <rect x="10" y="22" width="18" height="8" />

            {/* T-Rex Tiny Arms */}
            <rect x="28" y="22" width="4" height="2" />
            <rect x="28" y="24" width="2" height="4" />

            {/* Tail */}
            <rect x="8" y="22" width="4" height="4" />
            <rect x="6" y="20" width="4" height="4" />
            <rect x="4" y="18" width="4" height="4" />
            <rect x="2" y="16" width="2" height="4" />
            <rect x="0" y="14" width="2" height="4" />

            {/* Left Leg */}
            <rect x="14" y="32" width="4" height="6" />
            <rect x="16" y="38" width="2" height="6" />
            <rect x="16" y="44" width="4" height="2" />

            {/* Right Leg */}
            <rect x="20" y="32" width="4" height="4" />
            <rect x="20" y="36" width="2" height="8" />
            <rect x="20" y="44" width="4" height="2" />
          </svg>
        </div>

        {/* Cactus (matching reference position on right) */}
        <div className="absolute right-20 bottom-[10px] z-10">
          <svg
            width="24"
            height="44"
            viewBox="0 0 17 35"
            shapeRendering="crispEdges"
            className="fill-[#202124]"
          >
            {/* Main Trunk */}
            <rect x="6" y="0" width="5" height="35" />

            {/* Left Branch */}
            <rect x="0" y="8" width="4" height="14" />
            <rect x="3" y="18" width="4" height="4" />

            {/* Right Branch */}
            <rect x="13" y="12" width="4" height="12" />
            <rect x="10" y="20" width="4" height="4" />
          </svg>
        </div>

        {/* Authentic Ground Line */}
        <div className="w-full relative h-[10px] border-b-2 border-[#202124]">
          {/* Ground bumps & dashes matching image */}
          <div className="absolute -bottom-2 left-16 w-3 h-[2px] bg-[#202124]" />
          <div className="absolute -bottom-4 left-32 w-4 h-[2px] bg-[#202124]" />
          <div className="absolute -bottom-2 left-48 w-4 h-[2px] bg-[#202124]" />
          <div className="absolute -bottom-4 left-64 w-3 h-[2px] bg-[#202124]" />
          <div className="absolute -bottom-3 right-36 w-3 h-[2px] bg-[#202124]" />
          <div className="absolute -bottom-2 right-12 w-4 h-[2px] bg-[#202124]" />
        </div>
      </div>
    </div>
  );
};
