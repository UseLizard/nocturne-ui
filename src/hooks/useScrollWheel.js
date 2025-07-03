import { useRef, useCallback, useEffect } from 'react';

/**
 * Unified scroll wheel hook that provides two modes:
 * - 'media': Volume control for media players (Spotify + SPP)
 * - 'navigation': Item navigation for lists and carousels
 */
export const useScrollWheel = ({
  containerRef,
  mode = 'navigation', // 'media' | 'navigation'
  
  // Media mode options
  onVolumeChange = null,
  currentVolume = 50,
  volumeStep = 5,
  showVolumeOverlay = null,
  
  // Navigation mode options
  onNavigate = null,
  enableNavigation = true,
  
  // Common options
  throttleMs = 50,
  enabled = true,
}) => {
  const lastWheelEventRef = useRef(0);
  const wheelDeltaAccumulatorRef = useRef(0);
  const manualVolumeChangeRef = useRef(false);


  const handleWheel = useCallback((e) => {
    if (!enabled) return;
    
    const now = Date.now();
    if (now - lastWheelEventRef.current < throttleMs) {
      e.preventDefault();
      return;
    }
    lastWheelEventRef.current = now;

    e.preventDefault();
    e.stopPropagation();

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelDeltaAccumulatorRef.current += delta;

    if (Math.abs(wheelDeltaAccumulatorRef.current) >= 2) {
      if (mode === 'media') {
        // Media mode: Simple volume control - increment by 5 each scroll
        if (onVolumeChange) {
          // Intuitive volume scrolling: positive = up/louder, negative = down/quieter
          const direction = wheelDeltaAccumulatorRef.current > 0 ? 1 : -1;
          const newVolume = Math.max(0, Math.min(100, currentVolume + direction * 5));


          wheelDeltaAccumulatorRef.current = 0;

          if (newVolume !== currentVolume) {
            manualVolumeChangeRef.current = true;
            onVolumeChange(newVolume);
            
            // Show volume overlay if provided
            if (showVolumeOverlay) {
              showVolumeOverlay();
            }
          }
        }
      } else if (mode === 'navigation') {
        // Navigation mode: Item navigation
        if (onNavigate && enableNavigation) {
          const direction = wheelDeltaAccumulatorRef.current > 0 ? 1 : -1;
          wheelDeltaAccumulatorRef.current = 0;
          onNavigate(direction);
        }
      }
    }
  }, [
    enabled,
    throttleMs,
    mode,
    onVolumeChange,
    currentVolume,
    volumeStep,
    showVolumeOverlay,
    onNavigate,
    enableNavigation
  ]);

  // Add wheel event listener
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef?.current;
    let options = { passive: false, capture: true };
    
    const handleWheelWithOptions = (e) => {
      handleWheel(e);
    };
    
    if (container) {
      container.addEventListener("wheel", handleWheelWithOptions, options);
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheelWithOptions, options);
      }
    };
  }, [handleWheel, enabled, containerRef]);

  return {
    // For media mode compatibility
    manualVolumeChangeRef,
    
    // Reset function for external use
    resetAccumulator: () => {
      wheelDeltaAccumulatorRef.current = 0;
    }
  };
};

/**
 * Media-specific scroll wheel hook for volume control
 * Used by both NowPlaying (Spotify) and LocalMediaPlayer (SPP)
 */
export const useMediaScrollWheel = ({
  containerRef,
  onVolumeChange,
  currentVolume,
  showVolumeOverlay,
  enabled = true,
  volumeStep = 5,
}) => {
  return useScrollWheel({
    containerRef,
    mode: 'media',
    onVolumeChange,
    currentVolume,
    volumeStep,
    showVolumeOverlay,
    enabled,
    throttleMs: 50,
  });
};

/**
 * Navigation-specific scroll wheel hook for item navigation
 * Used by Home, ContentView, Tutorial, etc.
 */
export const useNavigationScrollWheel = ({
  containerRef,
  onNavigate,
  enabled = true,
  throttleMs = 60,
}) => {
  return useScrollWheel({
    containerRef,
    mode: 'navigation',
    onNavigate,
    enableNavigation: enabled,
    enabled,
    throttleMs,
  });
};