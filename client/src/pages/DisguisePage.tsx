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

  const handleSecretRedirect = async () => {
    try {
      // Instant login directly into her space with zero passwords or typing required!
      await instantLogin('her');
      navigate('/app');
    } catch (err) {
      // Fallback
      navigate('/app');
    }
  };

  return (
    <main
      className="min-h-screen bg-white text-[#5f6368] font-sans flex flex-col justify-between p-8 sm:p-20 select-none relative"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="max-w-[560px] mx-auto w-full pt-10 sm:pt-16">
        {/* Pixel Dinosaur on Ground Line */}
        <div className="mb-12 text-left">
          <DragonPixelArt />
        </div>

        {/* Error Title */}
        <h1 className="text-[24px] font-medium text-[#202124] mb-4 tracking-normal">
          No internet
        </h1>

        <div className="text-[13px] leading-relaxed space-y-4 text-[#5f6368]">
          {/* Secret Trigger: Clicking "Try:" redirects to the app / login */}
          <p
            onClick={handleSecretRedirect}
            className="cursor-default hover:text-[#5f6368] inline-block"
            title=""
            role="button"
            tabIndex={0}
            aria-label="Try"
          >
            Try:
          </p>

          <ul className="list-disc list-inside space-y-1.5 pl-0.5 text-[#5f6368]">
            <li>Checking the network cables, modem, and router</li>
            <li>Reconnecting to Wi-Fi</li>
            <li>Running network diagnostics</li>
          </ul>

          <p className="text-[11px] text-[#80868b] pt-5 font-mono tracking-wider">
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
