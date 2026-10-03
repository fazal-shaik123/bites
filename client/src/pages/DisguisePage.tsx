import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragonPixelArt } from '../components/DragonPixelArt.js';
import { apiRequest } from '../utils/api.js';

import { useAuth } from '../context/AuthContext.js';

export const DisguisePage: React.FC = () => {
  const navigate = useNavigate();
  const { instantLogin } = useAuth();

  useEffect(() => {
    document.title = 'No internet';
  }, []);

  const handleSecretRedirect = () => {
    // Navigate immediately so the screen changes the split second it is clicked!
    instantLogin('her').catch(() => {});
    navigate('/app');
  };

  return (
    <main
      className="min-h-screen bg-white text-[#5f6368] font-sans flex flex-col justify-between p-8 sm:p-20 select-none relative"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="max-w-[560px] mx-auto w-full pt-10 sm:pt-16">
        {/* Pixel Dinosaur on Ground Line - Also clickable as secret shortcut */}
        <div 
          onClick={handleSecretRedirect}
          className="mb-12 text-left cursor-pointer inline-block"
          title=""
          role="button"
          tabIndex={0}
        >
          <DragonPixelArt />
        </div>

        {/* Error Title */}
        <h1 className="text-[24px] font-medium text-[#202124] mb-4 tracking-normal">
          No internet
        </h1>

        <div className="text-[13px] leading-relaxed space-y-4 text-[#5f6368]">
          {/* Secret Trigger: Generous tap target for "Try:" */}
          <div className="inline-block py-1 pr-4 -my-1 -mr-4">
            <span
              onClick={handleSecretRedirect}
              className="cursor-pointer hover:text-[#202124] transition-colors py-2 pr-4 font-normal"
              title=""
              role="button"
              tabIndex={0}
              aria-label="Try"
            >
              Try:
            </span>
          </div>

          <ul className="list-disc list-inside space-y-1.5 pl-0.5 text-[#5f6368]">
            <li>Checking the network cables, modem, and router</li>
            <li>Reconnecting to Wi-Fi</li>
            <li>Running network diagnostics</li>
          </ul>

          {/* Error code also clickable */}
          <p
            onClick={handleSecretRedirect}
            className="text-[11px] text-[#80868b] pt-5 font-mono tracking-wider cursor-pointer inline-block"
          >
            ERR_INTERNET_DISCONNECTED
          </p>
        </div>
      </div>

      {/* Backup Secret Dot in bottom-right corner */}
      <button
        onClick={handleSecretRedirect}
        title=""
        aria-label="Status check"
        className="fixed bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-stone-300 opacity-20 hover:opacity-80 cursor-pointer transition-opacity focus:outline-none"
      />
    </main>
  );
};
