import React, { useRef, useCallback, useState, useEffect, useMemo, memo } from 'react';
import { useLocalMedia } from '../../hooks/useLocalMedia';
import { useNavigation } from '../../hooks/useNavigation';
import { useGestureControls } from '../../hooks/useGestureControls';
import { useGradientState } from '../../hooks/useGradientState';
import { useLivePosition } from '../../hooks/useLivePosition';

import ScrollingText from '../common/ScrollingText';
import DoubleBufferedImage from '../common/DoubleBufferedImage';
import LiveAlbumArt from '../common/LiveAlbumArt';
import {
  BluetoothIcon,
  SmartphoneIcon,
  PauseIcon,
  PlayIcon,
  SkipForwardIcon,
  SkipBackwardIcon,
  BackIcon,
  ForwardIcon,
  MenuIcon,
  HeartIcon,
  ShuffleIcon,
  RepeatIcon
} from '../common/icons';

// Progress Bar Component for Local Media - Simplified without animations
const LocalMediaProgressBar = memo(({
  progress,
  isPlaying,
  durationMs,
  positionMs,
  onSeek,
  onScrubbingChange,
  updateProgress,
}) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubbingProgress, setScrubbingProgress] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);

  const handleClick = (e) => {
    if (!isDragging && progressBarRef.current) {
      // Direct seek on click
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      const seekMs = Math.floor((percentage / 100) * durationMs);
      onSeek(seekMs);
      updateProgress?.(seekMs);
    } else {
      // Old wheel-based scrubbing behavior
      setIsScrubbing(true);
      onScrubbingChange?.(true);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleDrag(e);
  };

  const handleDrag = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setScrubbingProgress(percentage);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      handleDrag(e);
    };

    const handleMouseUp = () => {
      if (scrubbingProgress !== null) {
        const seekMs = Math.floor((scrubbingProgress / 100) * durationMs);
        onSeek(seekMs);
        updateProgress?.(seekMs);
      }
      setIsDragging(false);
      setScrubbingProgress(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrubbingProgress, durationMs, onSeek, updateProgress]);

  useEffect(() => {
    if (!isScrubbing) return;

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const delta = event.deltaX;
      const step = 1.5;

      setScrubbingProgress((prev) => {
        const nextValue = (prev ?? progress) + (delta > 0 ? step : -step);
        return Math.max(0, Math.min(100, nextValue));
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isScrubbing, progress]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && isScrubbing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        setIsScrubbing(false);
        onScrubbingChange?.(false);

        if (scrubbingProgress !== null) {
          const seekMs = Math.floor((scrubbingProgress / 100) * durationMs);
          onSeek(seekMs);
          updateProgress?.(seekMs);
        }

        setScrubbingProgress(null);
        return false;
      } else if (event.key === "Escape" && isScrubbing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsScrubbing(false);
        onScrubbingChange?.(false);
        setScrubbingProgress(null);
        return false;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isScrubbing, scrubbingProgress, durationMs, onSeek, onScrubbingChange, updateProgress]);

  const finalProgress = scrubbingProgress ?? progress;
  const shouldShowTimestampOutside = finalProgress < 8;

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-200 ease-in-out ${isScrubbing || isDragging ? "translate-y-8" : ""}`}
    >
      <div
        ref={progressBarRef}
        className={`relative w-full bg-white/20 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${isScrubbing || isDragging ? "h-8" : "h-2 mt-4"}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute left-0 top-0 h-full bg-white flex items-center justify-end"
          style={{
            width: `${finalProgress}%`,
          }}
        />
        {(isScrubbing || isDragging) && (
          <div
            className="absolute inset-0 flex items-center"
            style={{
              transform: `translateX(${finalProgress}%)`,
            }}
          >
            <span
              className={`text-lg font-[580] absolute ${shouldShowTimestampOutside
                ? "left-2 text-black/40"
                : "right-full pr-2 text-black/40"
              }`}
            >
              {formatTime(Math.floor((finalProgress / 100) * durationMs))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

LocalMediaProgressBar.displayName = 'LocalMediaProgressBar';

// Volume control configuration
const VOLUME_MIN = 0;
const VOLUME_MAX = 100;
const VOLUME_STEP = Math.round(100 / 13); // ~7.69, rounded to 8 for 13 steps
const VOLUME_STEPS = 13; // Number of discrete volume levels

// Removed: getImageFileSize function - no longer needed with LiveAlbumArt component

const LocalMediaPlayer = ({ className = "", onClose }) => {
  
  console.log('🎵 LOCAL MEDIA PLAYER: Component mounting/updating', {
    timestamp: new Date().toISOString()
  });

  // Force browser repaint - fixes UI delay after physical button presses
  const forceRepaint = useCallback(() => {
    // Gentle repaint using transform on container only
    const container = containerRef.current;
    if (container) {
      // Trigger repaint without hiding elements
      const currentTransform = container.style.transform;
      container.style.transform = currentTransform ? `${currentTransform} translateZ(0.1px)` : 'translateZ(0.1px)';
      requestAnimationFrame(() => {
        container.style.transform = currentTransform || '';
      });
    }
    
    // Alternative method: trigger reflow on body
    document.body.offsetHeight;
  }, []);
  const containerRef = useRef(null);
  const contentContainerRef = useRef(null);
  // Removed: Complex album art state management - now handled by LiveAlbumArt component
  const [volumeOverlayState, setVolumeOverlayState] = useState({
    visible: false,
    animation: "hidden"
  });
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  const [scrubbingMode, setScrubbingMode] = useState(false);
  const [scrubbingPosition, setScrubbingPosition] = useState(null);
  const scrubbingTimeoutRef = useRef(null);
  const scrubbingStartPositionRef = useRef(null);
  const lastSeekTimeRef = useRef(0);
  const [debouncedIsPlaying, setDebouncedIsPlaying] = useState(false);
  const lastVolumeChangeTimeRef = useRef(0);
  const [debouncedVolume, setDebouncedVolume] = useState(50);
  
  const volumeTimerRef = useRef(null);
  const volumeLastAdjustedRef = useRef(0);
  const prevVolumeRef = useRef(null);
  
  // Use local gradient state
  const [gradientState, setGradientState] = useGradientState('media');
  
  // Get live position updates via WebSocket
  const { position: livePosition, isConnected: livePositionConnected } = useLivePosition();
  
  const {
    isConnected,
    wsConnected,
    loading,
    error,
    currentTrack,
    currentArtist,
    currentAlbum,
    isPlaying,
    duration,
    position,
    volume,
    albumArtUrl,
    togglePlayPause,
    next,
    previous,
    seekTo,
    setVolume,
    formatTime,
    checkMediaStatus,
    initialLoadComplete
  } = useLocalMedia();
  
  // Use live position when available, fallback to regular position
  const currentPosition = livePositionConnected ? livePosition : position;

  const handleRetry = () => {
    checkMediaStatus();
  };

  const handlePlayPause = useCallback(async () => {
    await togglePlayPause();
    // Force repaint to ensure UI updates are immediately visible
    forceRepaint();
  }, [togglePlayPause, forceRepaint]);

  const handleSkipNext = useCallback(async () => {
    await next();
  }, [next]);

  const handleSkipPrevious = useCallback(async () => {
    await previous();
  }, [previous]);

  const handleSeek = useCallback(async (positionMs) => {
    await seekTo(positionMs);
  }, [seekTo]);

  const handleVolumeChange = useCallback(async (volumePercent) => {
    // Round to nearest step for discrete volume control
    const step = Math.round(volumePercent / VOLUME_STEP);
    const roundedVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, step * VOLUME_STEP));
    await setVolume(roundedVolume);
    lastVolumeChangeTimeRef.current = Date.now(); // Mark volume change time
    // Force repaint to ensure volume changes are immediately visible
    forceRepaint();
  }, [setVolume, forceRepaint]);

  const handleAlbumArtLoad = useCallback((event) => {
    // Update gradient colors when new album art loads
    console.log('🎵 LOCAL MEDIA PLAYER: Live album art loaded, updating gradient');
    setGradientState(event.target.src, 'media', 0, currentTrack);
  }, [setGradientState, currentTrack]);

  // Calculate progress percentage - updates with live position
  const progressPercentage = duration && currentPosition ? (currentPosition / duration) * 100 : 0;

  // Determine media mode based on track duration (>15 minutes = podcast mode)
  const PODCAST_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
  const mediaMode = duration && duration > PODCAST_THRESHOLD ? 'podcast' : 'song';

  // 30-second skip functions for podcast mode
  const handleSkipBackward30s = useCallback(async () => {
    if (currentPosition && currentPosition >= 30000) {
      await seekTo(currentPosition - 30000);
    } else {
      await seekTo(0);
    }
  }, [currentPosition, seekTo]);

  const handleSkipForward30s = useCallback(async () => {
    if (currentPosition && duration && currentPosition + 30000 <= duration) {
      await seekTo(currentPosition + 30000);
    }
  }, [currentPosition, duration, seekTo]);

  // Convert time to display format
  const convertTimeToLength = (ms) => {
    if (!ms || ms < 0) return '0:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useNavigation({
    containerRef,
    enableEscapeKey: true,
    enableWheelNavigation: false,
    enableKeyboardNavigation: true,
    onEscape: onClose,
    onEnterKey: handlePlayPause,
    activeSection: "media",
  });

  // Track tap timing for tap-to-play/pause
  const touchStartTimeRef = useRef(null);
  const touchStartPosRef = useRef(null);
  const [isTapping, setIsTapping] = useState(false);

  // Enable swipe gestures for track navigation
  useGestureControls({
    contentRef: contentContainerRef,
    onSwipeLeft: handleSkipNext,
    onSwipeRight: handleSkipPrevious,
    isActive: true,
  });

  // Add tap-to-play/pause functionality and handle scrubbing mode exit on tap
  useEffect(() => {
    const element = contentContainerRef?.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      // Check if tap is on an interactive element
      const target = e.target;
      const isInteractive = target.closest('button') || 
                           target.closest('[role="button"]');
      
      if (!isInteractive) {
        e.preventDefault(); // Prevent default touch behavior
        touchStartTimeRef.current = Date.now();
        touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setIsTapping(true);
      }
    };

    const handleTouchEnd = (e) => {
      // Exit scrubbing mode if in scrubbing mode
      if (scrubbingMode) {
        setScrubbingPosition(currentPos => {
          if (currentPos !== null) {
            seekTo(currentPos);
            lastSeekTimeRef.current = Date.now(); // Mark seek time
          }
          return null;
        });
        setScrubbingMode(false);
        scrubbingStartPositionRef.current = null;
        if (scrubbingTimeoutRef.current) {
          clearTimeout(scrubbingTimeoutRef.current);
          scrubbingTimeoutRef.current = null;
        }
        touchStartTimeRef.current = null;
        touchStartPosRef.current = null;
        setIsTapping(false);
        return;
      }

      // Handle tap-to-play/pause
      if (!touchStartTimeRef.current || !touchStartPosRef.current || !isTapping) return;

      const touchDuration = Date.now() - touchStartTimeRef.current;
      const touchEndPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      const distance = Math.sqrt(
        Math.pow(touchEndPos.x - touchStartPosRef.current.x, 2) +
        Math.pow(touchEndPos.y - touchStartPosRef.current.y, 2)
      );

      // If touch duration < 200ms and movement < 10px, treat as tap
      if (touchDuration < 200 && distance < 10) {
        handlePlayPause();
      }

      touchStartTimeRef.current = null;
      touchStartPosRef.current = null;
      setIsTapping(false);
    };

    const handleTouchCancel = () => {
      touchStartTimeRef.current = null;
      touchStartPosRef.current = null;
      setIsTapping(false);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handlePlayPause, isTapping, scrubbingMode, seekTo]);

  // Removed: Complex album art checking logic - now handled by LiveAlbumArt component

  // Component cleanup
  useEffect(() => {
    console.log('🎵 LOCAL MEDIA PLAYER: Component mounted');
    return () => {
      console.log('🎵 LOCAL MEDIA PLAYER: Component unmounting');
    };
  }, []);

  // Debounce isPlaying state to prevent flicker after seeking
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastSeek = now - lastSeekTimeRef.current;
    
    // If no seek has happened yet (initialization), or enough time has passed, update immediately
    if (lastSeekTimeRef.current === 0 || timeSinceLastSeek >= 333) {
      setDebouncedIsPlaying(isPlaying);
    }
  }, [isPlaying]);

  // Debounce volume state to prevent flicker after volume changes
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastVolumeChange = now - lastVolumeChangeTimeRef.current;
    
    // If no volume change has happened yet (initialization), or enough time has passed, update immediately
    if (lastVolumeChangeTimeRef.current === 0 || timeSinceLastVolumeChange >= 200) {
      setDebouncedVolume(volume ?? 50);
    }
  }, [volume]);

  // Handle Enter key (scroll wheel button press) for play/pause or hold for scrubbing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '1') {
        e.preventDefault();
        e.stopPropagation();
        
        if (!scrubbingMode) {
          // Enter scrubbing mode immediately when pressing "1"
          setScrubbingMode(true);
          setScrubbingPosition(currentPosition);
          scrubbingStartPositionRef.current = currentPosition;
          // Force repaint to show scrubbing mode immediately
          forceRepaint();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        
        if (scrubbingMode) {
          // Already in scrubbing mode, don't do anything on keydown
          return;
        }
        
        // Just play/pause on Enter press when not scrubbing
        handlePlayPause();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'Enter' && scrubbingMode) {
        e.preventDefault();
        e.stopPropagation();
        
        // Exit scrubbing mode and apply seek
        setScrubbingPosition(currentPos => {
          if (currentPos !== null) {
            seekTo(currentPos);
            lastSeekTimeRef.current = Date.now(); // Mark seek time
          }
          return null;
        });
        setScrubbingMode(false);
        scrubbingStartPositionRef.current = null;
        if (scrubbingTimeoutRef.current) {
          clearTimeout(scrubbingTimeoutRef.current);
          scrubbingTimeoutRef.current = null;
        }
        // Force repaint to hide scrubbing mode immediately
        forceRepaint();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [scrubbingMode, position, seekTo, handlePlayPause, forceRepaint]);

  // Show volume overlay with animation
  const showVolumeOverlay = useCallback(() => {
    volumeLastAdjustedRef.current = Date.now();
    
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
    }
    
    setVolumeOverlayState({
      visible: true,
      animation: "showing"
    });
    
    // Force repaint to ensure volume overlay is immediately visible
    forceRepaint();
    
    volumeTimerRef.current = setTimeout(() => {
      setVolumeOverlayState(prev => ({
        ...prev,
        animation: "hiding"
      }));
      
      setTimeout(() => {
        setVolumeOverlayState({
          visible: false,
          animation: "hidden"
        });
      }, 300);
    }, 1000); // 1 second timeout
  }, [forceRepaint]);

  // Cleanup volume timer
  useEffect(() => {
    return () => {
      if (volumeTimerRef.current) {
        clearTimeout(volumeTimerRef.current);
      }
    };
  }, []);


  // Custom scroll wheel for volume control or scrubbing based on mode
  useEffect(() => {
    if (!isConnected || loading) return;
    
    const container = containerRef?.current;
    if (!container) return;
    
    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (scrubbingMode) {
        // Scrubbing with dynamic steps and natural direction
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const direction = Math.sign(delta); // Natural direction: positive delta (down/right) seeks forward

        // Dynamic step size based on scroll intensity for more intuitive scrubbing.
        const scrollIntensity = Math.abs(delta);
        let stepMs;

        if (duration && duration > 900000) { // For tracks over 15 mins (podcasts)
          if (scrollIntensity < 20) {
            stepMs = 15000; // 15s for fine control
          } else if (scrollIntensity < 50) {
            stepMs = 30000; // 30s for medium scroll
          } else {
            stepMs = 60000; // 60s for fast scroll
          }
        } else { // For tracks under 15 mins (songs)
          if (scrollIntensity < 20) {
            stepMs = 1000; // 1s for fine control
          } else if (scrollIntensity < 50) {
            stepMs = 5000; // 5s for medium scroll
          } else {
            stepMs = 10000; // 10s for fast scroll
          }
        }
        
        const seekStep = stepMs * direction;
        
        // Use functional setState to ensure accumulation works with rapid scrolling
        setScrubbingPosition(currentScrubbingPos => {
          const currentPos = currentScrubbingPos ?? currentPosition;
          return Math.max(0, Math.min(duration || 0, currentPos + seekStep));
        });
        
        // Reset timeout for auto-exit
        if (scrubbingTimeoutRef.current) {
          clearTimeout(scrubbingTimeoutRef.current);
        }
        scrubbingTimeoutRef.current = setTimeout(() => {
          setScrubbingPosition(currentPos => {
            if (currentPos !== null) {
              seekTo(currentPos);
              lastSeekTimeRef.current = Date.now(); // Mark seek time
            }
            return null;
          });
          setScrubbingMode(false);
          scrubbingStartPositionRef.current = null;
          if (scrubbingTimeoutRef.current) {
            clearTimeout(scrubbingTimeoutRef.current);
            scrubbingTimeoutRef.current = null;
          }
        }, 2000);
      } else {
        // Volume mode - existing volume control logic
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const direction = delta > 0 ? 1 : -1; // Natural scrolling: down = decrease, up = increase
        
        // Calculate new volume based on steps
        const currentStep = Math.round((volume ?? 50) / VOLUME_STEP);
        const newStep = Math.max(0, Math.min(VOLUME_STEPS - 1, currentStep + direction));
        const newVolume = newStep * VOLUME_STEP;
        
        if (newVolume !== volume) {
          handleVolumeChange(newVolume);
          showVolumeOverlay();
        }
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isConnected, loading, volume, handleVolumeChange, showVolumeOverlay, scrubbingMode, currentPosition, duration, seekTo]);
  
  // For compatibility with removed hook
  const manualVolumeChangeRef = useRef(false);
  
  // Show volume overlay when volume changes manually
  useEffect(() => {
    if (prevVolumeRef.current === null) {
      prevVolumeRef.current = volume;
      return;
    }
    
    if (prevVolumeRef.current !== volume && manualVolumeChangeRef.current) {
      showVolumeOverlay();
      manualVolumeChangeRef.current = false;
    }
    
    prevVolumeRef.current = volume;
  }, [volume, showVolumeOverlay, manualVolumeChangeRef]);


  // Play/Pause icon based on debounced state to prevent flicker after seeking
  const PlayPauseIcon = () => {
    return debouncedIsPlaying ? (
      <PauseIcon className="w-14 h-14" />
    ) : (
      <PlayIcon className="w-14 h-14" />
    );
  };


  return (
    <div 
      className="flex flex-col justify-between h-screen w-full z-10 fadeIn-animation relative"
      ref={containerRef}
    >
      {/* Global Gradient Background */}
      
      {/* Scrubbing Mode Overlay */}
      {scrubbingMode && (
        <div 
          className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center pointer-events-none"
          style={{
            willChange: 'opacity, transform',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        >
          {/* Delta indicator */}
          {scrubbingStartPositionRef.current !== null && scrubbingPosition !== null && (
            <div className="text-white/70 text-2xl font-medium mb-4">
              {(() => {
                const delta = scrubbingPosition - scrubbingStartPositionRef.current;
                const sign = delta >= 0 ? '+' : '';
                return `${sign}${convertTimeToLength(Math.abs(delta))}`;
              })()}
            </div>
          )}
          <div className="text-white text-6xl font-bold mb-8">
            {convertTimeToLength(scrubbingPosition || 0)}
          </div>
          <div className="relative w-full h-2 bg-white/20">
            <div 
              className="absolute left-0 top-0 h-full bg-white transition-all duration-100"
              style={{ width: `${duration ? (scrubbingPosition / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Connection Status - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        {isConnected ? (
          <div className="flex items-center space-x-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">Android connected</span>
          </div>
        ) : wsConnected ? (
          <div className="flex items-center space-x-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-300 text-sm font-medium">Waiting for Android</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-red-300 text-sm font-medium">Service disconnected</span>
          </div>
        )}
      </div>
      
      {/* Content wrapper for gesture controls */}
      <div ref={contentContainerRef} className="flex flex-col justify-between h-full w-full">
        {/* Main Content Area */}
        <div 
          className="md:w-1/3 flex flex-row items-center px-12 pt-10 flex-1"
        >
        {/* Album Art - With pre-baked shadow */}
        <div className="min-w-[280px] mr-8 relative">
          {/* Pre-baked shadow layer - always present */}
          <div
            className="absolute opacity-25 pointer-events-none"
            style={{
              width: 320,
              height: 320,
              top: '-20px',
              left: '-20px',
              backgroundImage: 'url(/images/album-shadow.webp)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          />
          <div
            className="aspect-square rounded-[12px] bg-white/10 flex items-center justify-center overflow-hidden relative"
            style={{ width: 280, height: 280 }}
          >
            {/* Live Album Art - Automatically updates via WebSocket */}
            {(currentTrack || currentAlbum || currentArtist) ? (
              <LiveAlbumArt
                className="w-full h-full object-cover"
                onLoad={handleAlbumArtLoad}
                fallback={
                  <div className="text-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mb-2"></div>
                    <div className="text-green-300 text-xs">Loading Album Art...</div>
                  </div>
                }
                transitionDuration={500}
              />
            ) : !wsConnected ? (
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">WebSocket Disconnected</div>
                <button 
                  onClick={handleRetry}
                  className="text-red-300 text-xs underline hover:text-red-200"
                >
                  Retry Connection
                </button>
              </div>
            ) : !initialLoadComplete ? (
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="animate-pulse">
                    <BluetoothIcon className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <div className="text-gray-400 text-sm">Checking connection...</div>
              </div>
            ) : !isConnected ? (
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <BluetoothIcon className="w-12 h-12 text-blue-400" />
                    <SmartphoneIcon className="w-6 h-6 text-blue-300 absolute -bottom-1 -right-1" />
                  </div>
                </div>
                <div className="text-blue-300 text-sm mb-2">Connect Android Device</div>
                <div className="text-blue-400/80 text-xs">
                  Install NocturneCompanion app
                </div>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">Error</div>
                <div className="text-red-300 text-xs mb-2">{error}</div>
                <button 
                  onClick={handleRetry}
                  className="text-red-300 text-xs underline hover:text-red-200"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mb-2"></div>
                <div className="text-green-300 text-xs">Android Connected</div>
              </div>
            )}
          </div>
        </div>

        {/* Track and Artist Info - Adapted for Song/Podcast Mode */}
        <div className="flex-1 text-center md:text-left">
          <div className="max-w-[400px]">
            <ScrollingText
              text={currentTrack || (isConnected ? "No media playing" : "No device connected")}
              className="text-4xl font-semibold text-white tracking-tight"
              maxWidth="400px"
              pauseDuration={1000}
              pixelsPerSecond={40}
            />
          </div>
          {/* Debug info */}
          {false && (
            <div className="text-xs text-white/40 mt-2">
              <div>Mode: {mediaMode}</div>
              <div>Track: {currentTrack || 'null'}</div>
              <div>Artist: {currentArtist || 'null'}</div>
              <div>Album: {currentAlbum || 'null'}</div>
              <div>Duration: {duration}ms</div>
            </div>
          )}
          {/* Song mode - show album and artist */}
          {mediaMode === 'song' && currentTrack && (
            <>
              <h4 className="text-[36px] font-[560] text-white/60 tracking-tight max-w-[380px] truncate">
                {currentAlbum || 'Unknown Album'}
              </h4>
              <h4 className="text-[28px] font-[500] text-white/50 mt-1 tracking-tight max-w-[380px] truncate">
                {currentArtist || 'Unknown Artist'}
              </h4>
            </>
          )}
          
          {/* Podcast mode or no track - show artist/message only */}
          {(mediaMode === 'podcast' || !currentTrack) && (
            <h4 className="text-[28px] font-[500] text-white/50 mt-1 tracking-tight max-w-[380px] truncate">
              {currentArtist || (isConnected ? "Start playing music on your Android device" : "Pair your Android device")}
            </h4>
          )}
          
          {/* Mode indicator */}
          {isConnected && currentTrack && (
            <div className="mt-2">
              <span className="text-[20px] font-[500] text-white/40 capitalize">
                {mediaMode} mode • {convertTimeToLength(duration)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Progress Bar and Controls */}
      <div className="flex-shrink-0">
        {/* Progress Bar */}
        <div className="px-12 pb-4">
          <LocalMediaProgressBar
            progress={progressPercentage}
            isPlaying={isPlaying}
            durationMs={duration || 0}
            positionMs={currentPosition || 0}
            onSeek={handleSeek}
            onScrubbingChange={(scrubbing) => {
              // Handle scrubbing state if needed for disabling other controls
            }}
            updateProgress={(newPosition) => {
              // Could update position state for immediate feedback
            }}
          />
          
          {/* Time display */}
          {isConnected && duration && (
            <div className="flex justify-between mt-2">
              <span className="text-white/60 text-[20px]">
                {convertTimeToLength(currentPosition)}
              </span>
              <span className="text-white/60 text-[20px]">
                {convertTimeToLength(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Media Controls - Enhanced for Song/Podcast Mode */}
        <div className="flex justify-between items-center w-full px-12 pb-8">
        {/* Left Side - Like Button (Song Mode) or Volume (Podcast Mode) */}
        <div className="flex-shrink-0">
          {mediaMode === 'song' ? (
            <div className="focus:outline-none outline-none border-none bg-transparent appearance-none">
              <HeartIcon className="w-14 h-14" />
            </div>
          ) : (
            <div className="w-14 h-14"></div>
          )}
        </div>

        {/* Playback Controls - Enhanced based on mode */}
        <div className="flex justify-center items-center flex-1">
          {/* Skip Backward 30s - Always visible with proper styling */}
          <button 
            onClick={handleSkipBackward30s} 
            className="mx-4 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto'
            }}
            role="button"
            aria-label="Skip backward 30 seconds"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <span className="text-white text-sm font-bold">-30</span>
            </div>
          </button>
          
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="transition-opacity duration-100 mx-12 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto',
              willChange: 'opacity, transform',
              transform: 'translateZ(0)' // Force GPU acceleration
            }}
            role="button"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <PlayPauseIcon />
          </button>

          {/* Skip Forward 30s - Always visible with proper styling */}
          <button 
            onClick={handleSkipForward30s} 
            className="mx-4 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto'
            }}
            role="button"
            aria-label="Skip forward 30 seconds"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <span className="text-white text-sm font-bold">+30</span>
            </div>
          </button>
        </div>

        {/* Right Side - Options Menu */}
        <div className="flex-shrink-0">
          <div 
            onClick={() => setShowOptionsOverlay(true)}
            className="focus:outline-none outline-none border-none bg-transparent appearance-none"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <MenuIcon className="w-14 h-14 fill-white/60" />
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Loading Indicator - Moved to top-left */}
      {loading && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center space-x-1 bg-black/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* Options Overlay */}
      {showOptionsOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#161616] rounded-[13px] p-6 m-4 max-w-sm w-full">
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-semibold">Media Options</h3>
            </div>
            
            <div className="space-y-4">
              {mediaMode === 'song' && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white">Like Track</span>
                    <HeartIcon className="w-6 h-6 text-white/60" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white">Shuffle</span>
                    <ShuffleIcon className="w-6 h-6 text-white/60" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white">Repeat</span>
                    <RepeatIcon className="w-6 h-6 text-white/60" />
                  </div>
                </>
              )}
              
              {mediaMode === 'podcast' && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white">Playback Speed</span>
                    <span className="text-white text-sm">1.0x</span>
                  </div>
                </>
              )}
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white">Current Mode</span>
                <span className="text-white/60 capitalize">{mediaMode}</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowOptionsOverlay(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Horizontal Volume Bar Overlay */}
      <div
        className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-200 ${
          !volumeOverlayState.visible
            ? "opacity-0 pointer-events-none"
            : volumeOverlayState.animation === "showing"
            ? "opacity-100"
            : volumeOverlayState.animation === "hiding"
            ? "opacity-0"
            : "opacity-0 pointer-events-none"
        }`}
        style={{
          zIndex: 50,
          width: '70%',
          willChange: 'opacity, transform',
          transform: 'translateX(-50%) translateZ(0)' // Force GPU acceleration
        }}
      >
        <div className="bg-black/80 rounded-lg px-4 py-2">
          {/* Volume Bar */}
          <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-200"
              style={{ width: `${volume ?? 50}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalMediaPlayer;