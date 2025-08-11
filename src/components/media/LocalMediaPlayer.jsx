import React, { useRef, useCallback, useState, useEffect, useMemo, memo } from 'react';
import { useLocalMedia } from '../../hooks/useLocalMedia';
import { useNavigation } from '../../hooks/useNavigation';
import { useGestureControls } from '../../hooks/useGestureControls';
import { useGradientState } from '../../hooks/useGradientState';
import ScrollingText from '../common/ScrollingText';
import DoubleBufferedImage from '../common/DoubleBufferedImage';
import GradientBackground from '../common/GradientBackground';
import {
  BluetoothIcon,
  SmartphoneIcon,
  PauseIcon,
  PlayIcon,
  SkipForwardIcon,
  SkipBackwardIcon,
  BackIcon,
  ForwardIcon,
  VolumeLoudIcon,
  VolumeLowIcon,
  VolumeOffIcon,
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

const LocalMediaPlayer = ({ className = "", onClose, updateGradientColors }) => {
  const containerRef = useRef(null);
  const contentContainerRef = useRef(null);
  const [volumeOverlayState, setVolumeOverlayState] = useState({
    visible: false,
    animation: "hidden"
  });
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  
  const volumeTimerRef = useRef(null);
  const volumeLastAdjustedRef = useRef(0);
  const prevVolumeRef = useRef(null);
  
  // Use local gradient state
  const [gradientState, setGradientState] = useGradientState('media');
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

  const handleRetry = () => {
    checkMediaStatus();
  };

  const handlePlayPause = useCallback(async () => {
    await togglePlayPause();
  }, [togglePlayPause]);

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
  }, [setVolume]);

  // Calculate progress percentage - updates with position
  const progressPercentage = duration && position ? (position / duration) * 100 : 0;

  // Determine media mode based on track duration (>15 minutes = podcast mode)
  const PODCAST_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
  const mediaMode = duration && duration > PODCAST_THRESHOLD ? 'podcast' : 'song';

  // 30-second skip functions for podcast mode
  const handleSkipBackward30s = useCallback(async () => {
    if (position && position >= 30000) {
      await seekTo(position - 30000);
    } else {
      await seekTo(0);
    }
  }, [position, seekTo]);

  const handleSkipForward30s = useCallback(async () => {
    if (position && duration && position + 30000 <= duration) {
      await seekTo(position + 30000);
    }
  }, [position, duration, seekTo]);

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

  // Track tap timing for tap-to-play/pause and hold-to-seek
  const touchStartTimeRef = useRef(null);
  const touchStartPosRef = useRef(null);
  const [isTapping, setIsTapping] = useState(false);
  const [isHoldSeeking, setIsHoldSeeking] = useState(false);
  const [holdSeekPosition, setHoldSeekPosition] = useState(null);
  const holdTimerRef = useRef(null);
  const initialHoldPositionRef = useRef(null);

  // Enable swipe gestures for track navigation
  useGestureControls({
    contentRef: contentContainerRef,
    onSwipeLeft: handleSkipNext,
    onSwipeRight: handleSkipPrevious,
    isActive: true,
  });

  // Add tap-to-play/pause and hold-to-seek functionality
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
        
        // Set up hold timer for seeking overlay
        holdTimerRef.current = setTimeout(() => {
          console.log('Hold timer triggered, position:', position);
          if (touchStartPosRef.current) {
            initialHoldPositionRef.current = position;
            setHoldSeekPosition(position);
            setIsHoldSeeking(true);
            setIsTapping(false);
          }
        }, 750);
      }
    };

    const handleTouchMove = (e) => {
      if (isHoldSeeking && initialHoldPositionRef.current !== null) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartPosRef.current.x;
        const screenWidth = window.innerWidth;
        
        // Calculate seek amount relative to track duration
        // Full screen width = full track duration
        const seekRatio = deltaX / screenWidth;
        const seekDelta = seekRatio * duration;
        const newPosition = Math.max(0, Math.min(duration, initialHoldPositionRef.current + seekDelta));
        
        setHoldSeekPosition(newPosition);
      }
    };

    const handleTouchEnd = (e) => {
      // Clear hold timer
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      // Handle hold-to-seek release
      if (isHoldSeeking) {
        if (holdSeekPosition !== null) {
          seekTo(holdSeekPosition);
        }
        setIsHoldSeeking(false);
        setHoldSeekPosition(null);
        initialHoldPositionRef.current = null;
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
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      touchStartTimeRef.current = null;
      touchStartPosRef.current = null;
      setIsTapping(false);
      setIsHoldSeeking(false);
      setHoldSeekPosition(null);
      initialHoldPositionRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handlePlayPause, isTapping, isHoldSeeking, position, duration, seekTo, holdSeekPosition]);

  // Update local gradient state when album art changes
  useEffect(() => {
    if (albumArtUrl) {
      // Update local gradient state
      setGradientState(albumArtUrl, 'media', 0, currentTrack);
      
      // Also update global gradient if the callback is provided
      if (updateGradientColors) {
        updateGradientColors(albumArtUrl, 'media');
      }
    }
  }, [albumArtUrl, currentTrack, setGradientState, updateGradientColors]);

  // Handle Enter key (scroll wheel button press) for play/pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handlePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handlePlayPause]);

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
  }, []);

  // Cleanup volume timer
  useEffect(() => {
    return () => {
      if (volumeTimerRef.current) {
        clearTimeout(volumeTimerRef.current);
      }
    };
  }, []);


  // Custom scroll wheel for configurable step volume control
  useEffect(() => {
    if (!isConnected || loading) return;
    
    const container = containerRef?.current;
    if (!container) return;
    
    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Determine scroll direction
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
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isConnected, loading, volume, handleVolumeChange, showVolumeOverlay]);
  
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

  // Volume icon based on current volume level
  const VolumeIcon = useMemo(() => {
    if (volume === 0) {
      return <VolumeOffIcon className="w-7 h-7" />;
    } else if (volume > 0 && volume <= 60) {
      return <VolumeLowIcon className="w-7 h-7 ml-1.5" />;
    } else {
      return <VolumeLoudIcon className="w-7 h-7" />;
    }
  }, [volume]);

  // Play/Pause icon based on current state
  const PlayPauseIcon = () => {
    return isPlaying ? (
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
      <GradientBackground gradientState={gradientState} className="absolute inset-0 -z-10 bg-black" />
      
      {/* Hold-to-seek Overlay */}
      {isHoldSeeking && (
        <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-white text-6xl font-bold mb-8">
            {convertTimeToLength(holdSeekPosition || 0)}
          </div>
          <div className="relative w-full h-2 bg-white/20">
            <div 
              className="absolute left-0 top-0 h-full bg-white transition-all duration-100"
              style={{ width: `${duration ? (holdSeekPosition / duration) * 100 : 0}%` }}
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
            {/* Debug info */}
            {false && albumArtUrl && (
              <div className="absolute top-0 left-0 bg-black/80 text-white text-xs p-2">
                <div>URL: {albumArtUrl}</div>
                <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                <div>Track: {currentTrack || 'None'}</div>
              </div>
            )}
            {isConnected ? (
              <DoubleBufferedImage
                src={albumArtUrl}
                alt={`${currentAlbum || currentTrack} album art`}
                className="w-full h-full object-cover"
                onLoad={() => {
                  // Update local gradient state when image loads
                  if (albumArtUrl) {
                    setGradientState(albumArtUrl, 'media', 0, currentTrack);
                    
                    // Also update global gradient if the callback is provided
                    if (updateGradientColors) {
                      updateGradientColors(albumArtUrl, 'media');
                    }
                  }
                }}
                fallback={
                  <div className="text-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mb-2"></div>
                    <div className="text-green-300 text-xs">Android Connected</div>
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
            positionMs={position || 0}
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
                {convertTimeToLength(position)}
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
            VolumeIcon
          )}
        </div>

        {/* Playback Controls - Enhanced based on mode */}
        <div className="flex justify-center items-center flex-1">
          {/* Skip Backward 30s - Always visible with proper styling */}
          <div 
            onClick={handleSkipBackward30s} 
            className="mx-4 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto'
            }}
          >
            <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <span className="text-white text-sm font-bold">-30</span>
            </div>
          </div>
          
          {/* Play/Pause Button */}
          <div
            onClick={handlePlayPause}
            className="transition-opacity duration-100 mx-12 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto'
            }}
          >
            <PlayPauseIcon />
          </div>

          {/* Skip Forward 30s - Always visible with proper styling */}
          <div 
            onClick={handleSkipForward30s} 
            className="mx-4 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto'
            }}
          >
            <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <span className="text-white text-sm font-bold">+30</span>
            </div>
          </div>
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
                    <span className="text-white">Volume</span>
                    {VolumeIcon}
                  </div>
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
          width: '70%'
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