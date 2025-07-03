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
  VolumeLoudIcon,
  VolumeLowIcon,
  VolumeOffIcon
} from '../common/icons';

const LocalMediaPlayer = ({ className = "", onClose }) => {
  const containerRef = useRef(null);
  const [volumeOverlayState, setVolumeOverlayState] = useState({
    visible: false,
    animation: "hidden"
  });
  
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
      className="flex flex-col gap-1 h-screen w-full z-10 fadeIn-animation"
      ref={containerRef}
    >
      {/* Main Content Area */}
      <div className="md:w-1/3 flex flex-row items-center px-12 pt-10">
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

        {/* Track and Artist Info */}
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
            {currentArtist || (isConnected ? "Start playing music on your Android device" : "Pair your Android device")}
          </h4>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-12 pt-4 pb-7">
        <div className="relative">
          {/* Progress bar track */}
          <div className="w-full h-2 bg-white/20 rounded-full">
            {/* Progress bar fill */}
            <div 
              className="h-full bg-white rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Progress bar scrubber */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={position || 0}
            onChange={(e) => handleSeek(parseInt(e.target.value))}
            disabled={loading || !isConnected || !duration}
            className="absolute inset-0 w-full h-2 bg-transparent appearance-none cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: 'transparent',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
            }}
          />
        </div>
        
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

      {/* Media Controls */}
      <div className="flex justify-between items-center w-full px-12 mt-1">
        {/* Volume Control */}
        <div className="flex-shrink-0">
          {VolumeIcon}
        </div>

        {/* Playback Controls */}
        <div className="flex justify-center items-center flex-1">
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
            <SkipBackwardIcon className="w-14 h-14" />
          </div>
          
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
            <SkipForwardIcon className="w-14 h-14" />
          </div>
        </div>

        {/* Spacer for layout balance */}
        <div className="flex-shrink-0 w-14">
          {/* Empty space to balance layout */}
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