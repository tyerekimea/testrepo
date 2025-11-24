'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (soundUrl: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const playSound = useCallback((soundUrl: string) => {
    if (!isMuted && soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.play().catch(error => console.error("Audio play failed", error));
      } catch (error) {
        console.error("Failed to create audio object", error);
      }
    }
  }, [isMuted]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
