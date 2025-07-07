import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useLocalMedia } from '../../hooks/useLocalMedia';
import { useNavigation } from '../../hooks/useNavigation';
import { useMediaScrollWheel } from '../../hooks/useScrollWheel';
import ScrollingText from '../common/ScrollingText';
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

// Progress Bar Component for Local Media (adapted from NowPlaying)
const LocalMediaProgressBar = ({
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
  const containerRef = useRef(null);

  const handleClick = () => {
    setIsScrubbing(true);
    onScrubbingChange?.(true);
  };

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
      className={`relative transition-all duration-200 ease-in-out ${isScrubbing ? "translate-y-8" : ""}`}
    >
      <div
        className={`relative w-full bg-white/20 rounded-full overflow-hidden transition-all duration-300 ${isScrubbing ? "h-8" : "h-2 mt-4"}`}
        onClick={handleClick}
      >
        <div
          className="absolute inset-0 bg-white flex items-center justify-end transition-transform duration-0 ease-linear"
          style={{
            transform: `translateX(${finalProgress - 100}%)`,
          }}
        />
        {isScrubbing && (
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
};

const LocalMediaPlayer = ({ className = "", onClose }) => {
  const containerRef = useRef(null);
  const [volumeOverlayState, setVolumeOverlayState] = useState({
    visible: false,
    animation: "hidden"
  });
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);
  
  const volumeTimerRef = useRef(null);
  const volumeLastAdjustedRef = useRef(0);
  const prevVolumeRef = useRef(null);
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
    togglePlayPause,
    next,
    previous,
    seekTo,
    setVolume,
    formatTime,
    checkMediaStatus
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
    await setVolume(volumePercent);
  }, [setVolume]);

  // Calculate progress percentage
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
    }, 1500);
  }, []);

  // Cleanup volume timer
  useEffect(() => {
    return () => {
      if (volumeTimerRef.current) {
        clearTimeout(volumeTimerRef.current);
      }
    };
  }, []);

  // Unified scroll wheel for volume control (SPP mode)
  const { manualVolumeChangeRef } = useMediaScrollWheel({
    containerRef,
    onVolumeChange: handleVolumeChange,
    currentVolume: volume ?? 50,
    showVolumeOverlay,
    enabled: !loading && isConnected,
  });
  
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
      className="flex flex-col justify-between h-screen w-full z-10 fadeIn-animation"
      ref={containerRef}
    >
      {/* Main Content Area */}
      <div className="md:w-1/3 flex flex-row items-center px-12 pt-10 flex-1">
        {/* Album Art - Blank Square */}
        <div className="min-w-[280px] mr-8">
          <div
            className="aspect-square rounded-[12px] drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)] bg-white/10 flex items-center justify-center"
            style={{ width: 280, height: 280 }}
          >
            {!wsConnected ? (
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">WebSocket Disconnected</div>
                <button 
                  onClick={handleRetry}
                  className="text-red-300 text-xs underline hover:text-red-200"
                >
                  Retry Connection
                </button>
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
              className="text-[40px] font-[580] text-white tracking-tight"
              maxWidth="400px"
              pauseDuration={1000}
              pixelsPerSecond={40}
            />
          </div>
          <h4 className="text-[36px] font-[560] text-white/60 truncate tracking-tight max-w-[380px]">
            {mediaMode === 'podcast' && currentTrack ? (
              <>
                <div>Episode: {currentAlbum || 'Unknown Episode'}</div>
                <div className="text-[28px] font-[500] text-white/50 mt-1">
                  Podcast: {currentArtist || 'Unknown Podcast'}
                </div>
              </>
            ) : (
              currentArtist || (isConnected ? "Start playing music on your Android device" : "Pair your Android device")
            )}
          </h4>
          
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
          {/* Previous Track Button - Always visible */}
          <div 
            onClick={handleSkipPrevious} 
            className="mx-6 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto'
            }}
          >
            <BackIcon className="w-14 h-14" />
          </div>

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
            className="transition-opacity duration-100 mx-6 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
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
          
          {/* Next Track Button - Always visible */}
          <div 
            onClick={handleSkipNext} 
            className="mx-6 focus:outline-none outline-none border-none bg-transparent appearance-none disabled:opacity-50"
            style={{ 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              WebkitTapHighlightColor: 'transparent',
              opacity: loading || !isConnected ? 0.5 : 1,
              pointerEvents: loading || !isConnected ? 'none' : 'auto'
            }}
          >
            <ForwardIcon className="w-14 h-14" />
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

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
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
      
      {/* Volume Overlay */}
      <div
        className={`fixed top-[4.5rem] transform transition-opacity duration-300 ${
          !volumeOverlayState.visible
            ? "hidden"
            : volumeOverlayState.animation === "showing"
            ? "opacity-100 volumeInScale"
            : volumeOverlayState.animation === "hiding"
            ? "opacity-0 volumeOutScale"
            : "hidden"
        }`}
        style={{
          right: '-6px',
          zIndex: 50
        }}
      >
        <div className="w-14 h-44 bg-slate-700/60 rounded-[17px] flex flex-col-reverse drop-shadow-xl overflow-hidden">
          <div
            className="bg-white w-full transition-height duration-300 rounded-b-[13px]"
            style={{ height: `${volume || 50}%` }}
          >
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center h-6 pb-7">
              {VolumeIcon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalMediaPlayer;