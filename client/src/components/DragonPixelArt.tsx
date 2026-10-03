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
      className={`cursor-pointer select-none inline-block transition-transform duration-300 ease-out ${
        isHopping ? '-translate-y-6' : 'translate-y-0'
      }`}
      title="Press Space or tap to jump"
      role="button"
      tabIndex={0}
      aria-label="Offline Dinosaur"
    >
      <svg
        width="44"
        height="47"
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
  );
};
