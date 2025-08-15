import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalMedia } from '../../hooks/useLocalMedia';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackwardIcon, LockIcon } from '../common/icons';
import { SunIcon, MoonIcon } from '../common/icons';

const LockScreen = ({ onUnlock }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDayMode, setIsDayMode] = useState(true);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [trackSwipeStart, setTrackSwipeStart] = useState(null);
  const [currentGradient, setCurrentGradient] = useState('');
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const containerRef = useRef(null);
  const volumeTimeoutRef = useRef(null);
  const tapStartTimeRef = useRef(null);
  const tapStartPosRef = useRef(null);
  
  // Determine if it's nighttime (6 PM to 6 AM)
  const isNightTime = (date) => {
    const hour = date.getHours();
    return hour >= 18 || hour < 6;
  };
  
  // Get media state from local media hook
  const {
    currentTrack,
    currentArtist,
    isPlaying,
    togglePlayPause,
    volume,
    setVolume,
    next,
    previous,
    position: positionMs,
    duration: durationMs,
  } = useLocalMedia();

  // Update time every second and set theme based on time (unless manually overridden)
  useEffect(() => {
    const updateTimeAndTheme = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Only auto-update theme if not manually overridden
      if (!isManualOverride) {
        setIsDayMode(!isNightTime(now));
      }
    };
    
    // Set initial time and theme
    updateTimeAndTheme();
    
    const timer = setInterval(updateTimeAndTheme, 1000);

    return () => clearInterval(timer);
  }, [isManualOverride]);

  // Initialize gradient on mount
  useEffect(() => {
    const hour = currentTime.getHours();
    let initialGradient;
    
    if (isDayMode) {
      if (hour >= 6 && hour < 12) {
        initialGradient = 'linear-gradient(135deg, #fefefe 0%, #f0f8ff 30%, #e6f3ff 70%, #d1e9ff 100%)';
      } else if (hour >= 12 && hour < 18) {
        initialGradient = 'linear-gradient(135deg, #fefefe 0%, #faf7f0 30%, #f5f0e8 70%, #ede4d3 100%)';
      } else {
        initialGradient = 'linear-gradient(135deg, #fefefe 0%, #f0f4f8 30%, #dbe7f0 70%, #c7d2e7 100%)';
      }
    } else {
      if (hour >= 22 || hour < 4) {
        initialGradient = 'linear-gradient(135deg, #050505 0%, #0f0f23 30%, #1a1a3a 70%, #2d2d55 100%)';
      } else if (hour >= 4 && hour < 6) {
        initialGradient = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #2d1b69 70%, #4c1d95 100%)';
      } else {
        initialGradient = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #16213e 70%, #0f4c75 100%)';
      }
    }
    
    setCurrentGradient(initialGradient);
  }, []);

  // Update gradient when day/night mode changes
  useEffect(() => {
    const hour = currentTime.getHours();
    let newGradient;
    
    if (isDayMode) {
      if (hour >= 6 && hour < 12) {
        newGradient = 'linear-gradient(135deg, #fefefe 0%, #f0f8ff 30%, #e6f3ff 70%, #d1e9ff 100%)';
      } else if (hour >= 12 && hour < 18) {
        newGradient = 'linear-gradient(135deg, #fefefe 0%, #faf7f0 30%, #f5f0e8 70%, #ede4d3 100%)';
      } else {
        newGradient = 'linear-gradient(135deg, #fefefe 0%, #f0f4f8 30%, #dbe7f0 70%, #c7d2e7 100%)';
      }
    } else {
      if (hour >= 22 || hour < 4) {
        newGradient = 'linear-gradient(135deg, #050505 0%, #0f0f23 30%, #1a1a3a 70%, #2d2d55 100%)';
      } else if (hour >= 4 && hour < 6) {
        newGradient = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #2d1b69 70%, #4c1d95 100%)';
      } else {
        newGradient = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #16213e 70%, #0f4c75 100%)';
      }
    }
    
    setCurrentGradient(newGradient);
  }, [isDayMode, currentTime]);
  
  // Reset manual override after 30 minutes to resume automatic theme detection
  useEffect(() => {
    if (isManualOverride) {
      const resetTimer = setTimeout(() => {
        setIsManualOverride(false);
        setIsDayMode(!isNightTime(new Date()));
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearTimeout(resetTimer);
    }
  }, [isManualOverride]);

  // Volume control via scroll wheel
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Determine scroll direction
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      
      // Calculate new volume (5% steps)
      const currentVolume = volume ?? 50;
      const newVolume = Math.max(0, Math.min(100, currentVolume + (direction * 5)));
      
      if (newVolume !== currentVolume) {
        setVolume(newVolume);
        
        // Show volume indicator
        setShowVolumeIndicator(true);
        
        // Clear existing timeout
        if (volumeTimeoutRef.current) {
          clearTimeout(volumeTimeoutRef.current);
        }
        
        // Hide indicator after 2 seconds
        volumeTimeoutRef.current = setTimeout(() => {
          setShowVolumeIndicator(false);
        }, 2000);
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, [volume, setVolume]);

  // Handle Enter key for play/pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && currentTrack) {
        e.preventDefault();
        e.stopPropagation();
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, togglePlayPause]);

  // Format time and date
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return {
      time: `${hours}:${minutes}`,
      period: ampm
    };
  };

  const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNumber = date.getDate();
    
    return {
      dayName,
      fullDate: `${monthName} ${dayNumber}`
    };
  };

  // Handle track swipe gestures
  const handleTrackSwipeStart = useCallback((e) => {
    if (!currentTrack) return;
    const touch = e.touches[0];
    setTrackSwipeStart(touch.clientX);
    
    // Track tap timing and position for play/pause
    tapStartTimeRef.current = Date.now();
    tapStartPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, [currentTrack]);

  const handleTrackSwipeEnd = useCallback(async (e) => {
    if (!trackSwipeStart || !currentTrack) return;
    
    const touch = e.changedTouches[0];
    const swipeDistance = touch.clientX - trackSwipeStart;
    const swipeThreshold = 80;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      // Swipe detected
      if (swipeDistance > 0 && previous) {
        // Swipe right = previous track
        await previous();
      } else if (swipeDistance < 0 && next) {
        // Swipe left = next track
        await next();
      }
    } else {
      // Check if this was a tap (not a swipe)
      if (tapStartTimeRef.current && tapStartPosRef.current) {
        const touchDuration = Date.now() - tapStartTimeRef.current;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - tapStartPosRef.current.x, 2) +
          Math.pow(touch.clientY - tapStartPosRef.current.y, 2)
        );
        
        // If touch duration < 300ms and movement < 15px, treat as tap to play/pause
        if (touchDuration < 300 && distance < 15) {
          const target = e.target;
          // Only trigger if not tapping on interactive elements
          if (!target.closest('button') && !target.closest('[role="button"]')) {
            await togglePlayPause();
          }
        }
      }
    }
    
    setTrackSwipeStart(null);
    tapStartTimeRef.current = null;
    tapStartPosRef.current = null;
  }, [trackSwipeStart, currentTrack, next, previous, togglePlayPause]);

  const toggleDayNight = () => {
    // Allow manual override of automatic theme
    setIsDayMode(!isDayMode);
    setIsManualOverride(true);
  };

  const handlePlayPause = async (e) => {
    e.stopPropagation();
    await togglePlayPause();
  };

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
    }, 300);
  };

  // Format time duration for playback
  const formatDuration = (ms) => {
    if (!ms || ms <= 0) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const dateInfo = formatDate(currentTime);
  const timeInfo = formatTime(currentTime);


  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 transition-all duration-700 ${
        isUnlocking ? 'translate-y-[-100%]' : ''
      }`}
      style={{
        background: currentGradient,
        transition: 'background 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {/* Main Content */}
      <div 
        className="flex flex-col items-center justify-center h-full pt-16"
        onTouchStart={handleTrackSwipeStart}
        onTouchEnd={handleTrackSwipeEnd}
      >
        {/* Time Display - Ultra minimal with AM/PM */}
        <div className="flex items-baseline justify-center">
          <div className={`text-[140px] font-normal leading-none ${
            isDayMode ? 'text-black/70' : 'text-white/70'
          }`}
          style={{
            letterSpacing: '-0.02em'
          }}>
            {timeInfo.time}
          </div>
          <div className={`text-2xl font-normal ml-4 ${
            isDayMode ? 'text-black/50' : 'text-white/50'
          }`}>
            {timeInfo.period}
          </div>
        </div>

        {/* Date Display - Single line, minimal */}
        <div className={`text-lg font-normal mt-4 ${
          isDayMode ? 'text-black/40' : 'text-white/40'
        }`}>
          {dateInfo.dayName}, {dateInfo.fullDate}
        </div>

        {/* Volume Bar - Between date and media content */}
        <div className="mt-6 flex justify-center">
          <div className={`relative w-48 transition-all duration-300 ${
            showVolumeIndicator ? 'h-1' : 'h-0.5'
          }`}>
            <div className={`w-full h-full rounded-full transition-all duration-300 ${
              isDayMode ? 'bg-black/10' : 'bg-white/10'
            }`} 
            style={{ 
              opacity: showVolumeIndicator ? 1 : 0.3
            }}>
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isDayMode ? 'bg-black/40' : 'bg-white/60'
                }`}
                style={{ 
                  width: `${volume ?? 50}%`,
                  opacity: showVolumeIndicator ? 1 : 0.4
                }}
              />
            </div>
          </div>
        </div>

        {/* Media Section - Only if playing */}
        {currentTrack && (
          <div 
            className="mt-16 flex flex-col items-center w-full max-w-md px-8 fadeIn-animation"
          >
            {/* Track Info - Bigger */}
            <div className="text-center mb-6">
              <div className={`text-2xl font-normal mb-2 ${
                isDayMode ? 'text-black/70' : 'text-white/70'
              }`}>
                {currentTrack}
              </div>
              <div className={`text-lg font-normal ${
                isDayMode ? 'text-black/50' : 'text-white/50'
              }`}>
                {currentArtist || '—'}
              </div>
            </div>

            {/* Playback Time */}
            {durationMs && (
              <div className={`text-lg font-normal mb-6 ${
                isDayMode ? 'text-black/40' : 'text-white/40'
              }`}>
                {formatDuration(positionMs || 0)} / {formatDuration(durationMs)}
              </div>
            )}

            {/* Play/Pause - Same size as track title */}
            <button
              onClick={handlePlayPause}
              className={`transition-gentle hover:scale-105 bg-transparent focus:outline-none mb-4 ${
                isDayMode ? 'text-black/70' : 'text-white/70'
              }`}
            >
              <span className="text-2xl font-normal transition-gentle">
                {isPlaying ? 'pause' : 'play'}
              </span>
            </button>

            {/* Swipe hint */}
            <div className={`text-xs font-normal mt-4 ${
              isDayMode ? 'text-black/30' : 'text-white/30'
            }`}>
              swipe to skip tracks
            </div>
          </div>
        )}
      </div>


      {/* Day/Night Toggle - Bottom Right */}
      <button
        onClick={toggleDayNight}
        className={`absolute bottom-8 right-8 w-24 h-24 rounded-full transition-gentle flex items-center justify-center focus:outline-none ${
          isDayMode 
            ? 'bg-black/5 hover:bg-black/10' 
            : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        {isDayMode ? (
          <MoonIcon className="w-10 h-10 text-black/50 transition-gentle" />
        ) : (
          <SunIcon className="w-10 h-10 text-white/50 transition-gentle" />
        )}
      </button>

      {/* Unlock Button - Bottom left */}
      <button
        onClick={handleUnlock}
        className={`absolute bottom-8 left-8 w-24 h-24 rounded-full transition-gentle flex items-center justify-center focus:outline-none ${
          isDayMode 
            ? 'bg-black/5 hover:bg-black/10' 
            : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        <LockIcon className={`w-10 h-10 transition-gentle ${
          isDayMode ? 'text-black/50' : 'text-white/50'
        }`} />
      </button>
    </div>
  );
};

export default LockScreen;