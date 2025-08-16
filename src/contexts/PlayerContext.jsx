import React, { createContext, useContext, useMemo } from 'react';

const PlayerContext = createContext();

/**
 * Provides a centralized context for all music player-related state and controls.
 * This consolidates data from multiple hooks into a single, easy-to-use source.
 */
export const PlayerProvider = ({ 
  children, 
  currentPlayback, 
  currentlyPlayingAlbum, 
  playerControls, 
  playbackProgress 
}) => {
  // We derive some state here for convenience, e.g., a simple boolean for playback status.
  const isPlaying = currentPlayback?.is_playing || false;
  const currentTrack = currentPlayback?.item;

  // The context value is memoized to prevent unnecessary re-renders for consuming components.
  const value = useMemo(() => ({
    currentPlayback,
    currentlyPlayingAlbum,
    playerControls,
    playbackProgress,
    isPlaying,
    currentTrack,
  }), [
    currentPlayback, 
    currentlyPlayingAlbum, 
    playerControls, 
    playbackProgress, 
    isPlaying,
    currentTrack,
  ]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

/**
 * Custom hook to easily access the PlayerContext.
 */
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
