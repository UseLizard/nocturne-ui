import { useState, useEffect, useRef, useCallback } from 'react';

const sharedState = {
  refreshTimeoutId: null,
  lastRefreshTime: 0
};

export const usePlaybackProgress = (currentPlayback, refreshPlaybackState, accessToken) => {
  const [progressMs, setProgressMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [trackId, setTrackId] = useState(null);

  const animationFrameRef = useRef(null);
  const lastServerProgressRef = useRef(0);
  const lastClientTimeRef = useRef(Date.now());
  const isSeekingRef = useRef(false);

  const scheduleNextRefresh = useCallback(() => {
    const REFRESH_INTERVAL = 15000;
    
    if (sharedState.refreshTimeoutId) {
      clearTimeout(sharedState.refreshTimeoutId);
    }
    
    sharedState.refreshTimeoutId = setTimeout(() => {
      refreshPlaybackState();
      sharedState.lastRefreshTime = Date.now();
      scheduleNextRefresh();
    }, REFRESH_INTERVAL);
  }, [refreshPlaybackState]);

  const triggerRefresh = useCallback(() => {
    if (sharedState.refreshTimeoutId) {
      clearTimeout(sharedState.refreshTimeoutId);
    }
    
    refreshPlaybackState();
    sharedState.lastRefreshTime = Date.now();
    scheduleNextRefresh();
  }, [refreshPlaybackState, scheduleNextRefresh]);

  useEffect(() => {
    if (accessToken) {
      const now = Date.now();
      if (!sharedState.refreshTimeoutId || (now - sharedState.lastRefreshTime > 10000)) {
        triggerRefresh();
      }
    }
    
    return () => {};
  }, [accessToken, triggerRefresh]);

  useEffect(() => {
    if (currentPlayback) {
      const currentTrackId = currentPlayback.item?.id || null;
      const currentDuration = currentPlayback.item?.duration_ms || 0;
      const serverProgress = currentPlayback.progress_ms || 0;

      if (trackId !== currentTrackId) {
        setTrackId(currentTrackId);
        setDuration(currentDuration);
        setProgressMs(serverProgress);
        lastServerProgressRef.current = serverProgress;
        lastClientTimeRef.current = Date.now();
      }

      if (!isSeekingRef.current) {
        lastServerProgressRef.current = serverProgress;
        lastClientTimeRef.current = Date.now();
        if (!currentPlayback.is_playing) {
          setProgressMs(serverProgress);
        }
      }

      setIsPlaying(currentPlayback.is_playing || false);
      setDuration(currentDuration);
    }
  }, [currentPlayback, trackId]);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        const now = Date.now();
        const elapsed = now - lastClientTimeRef.current;
        const newProgress = lastServerProgressRef.current + elapsed;
        
        if (!isSeekingRef.current) {
          setProgressMs(Math.min(newProgress, duration));
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, duration]);

  const updateProgress = useCallback((newProgressMs) => {
    isSeekingRef.current = true;
    setProgressMs(newProgressMs);
    
    // After seeking, allow a moment before resuming server updates
    setTimeout(() => {
      isSeekingRef.current = false;
      lastServerProgressRef.current = newProgressMs;
      lastClientTimeRef.current = Date.now();
    }, 500);
  }, []);

  return {
    progressMs,
    isPlaying,
    duration,
    trackId,
    progressPercentage: duration > 0 ? (progressMs / duration) * 100 : 0,
    updateProgress,
    triggerRefresh
  };
}; 