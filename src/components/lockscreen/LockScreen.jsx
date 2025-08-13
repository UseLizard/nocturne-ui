import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalMedia } from '../../hooks/useLocalMedia';
import { PlayIcon, PauseIcon } from '../common/icons';
import { SunIcon, MoonIcon } from '../common/icons';

const LockScreen = ({ onUnlock }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDayMode, setIsDayMode] = useState(true);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [swipeStart, setSwipeStart] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
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

  // Handle swipe gestures and tap detection
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setSwipeStart(touch.clientY);
    setSwipeOffset(0);
    
    // Track tap timing and position
    tapStartTimeRef.current = Date.now();
    tapStartPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swipeStart) return;
    
    const touch = e.touches[0];
    const offset = swipeStart - touch.clientY;
    
    // Only allow upward swipes
    if (offset > 0) {
      setSwipeOffset(Math.min(offset, 200));
    }
  }, [swipeStart]);

  const handleTouchEnd = useCallback(async (e) => {
    const shouldUnlock = swipeOffset > 100;
    
    if (shouldUnlock) {
      // Trigger unlock animation
      setIsUnlocking(true);
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      // Check if this was a tap (not a swipe/drag)
      if (tapStartTimeRef.current && tapStartPosRef.current && currentTrack) {
        const touchDuration = Date.now() - tapStartTimeRef.current;
        const touch = e.changedTouches[0];
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
      
      // Reset swipe
      setSwipeOffset(0);
    }
    
    setSwipeStart(null);
    tapStartTimeRef.current = null;
    tapStartPosRef.current = null;
  }, [swipeOffset, onUnlock, currentTrack, togglePlayPause]);

  // Handle mouse events for desktop testing
  const handleMouseDown = useCallback((e) => {
    setSwipeStart(e.clientY);
    setSwipeOffset(0);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!swipeStart) return;
    
    const offset = swipeStart - e.clientY;
    
    // Only allow upward swipes
    if (offset > 0) {
      setSwipeOffset(Math.min(offset, 200));
    }
  }, [swipeStart]);

  const handleMouseUp = useCallback(() => {
    if (swipeOffset > 100) {
      // Trigger unlock animation
      setIsUnlocking(true);
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      // Reset swipe
      setSwipeOffset(0);
    }
    setSwipeStart(null);
  }, [swipeOffset, onUnlock]);

  const handleMouseLeave = useCallback(() => {
    setSwipeOffset(0);
    setSwipeStart(null);
  }, []);

  const toggleDayNight = () => {
    // Allow manual override of automatic theme
    setIsDayMode(!isDayMode);
    setIsManualOverride(true);
  };

  const handlePlayPause = async (e) => {
    e.stopPropagation();
    await togglePlayPause();
  };

  // Calculate opacity based on swipe progress
  const opacity = Math.max(0, 1 - (swipeOffset / 200));
  const dateInfo = formatDate(currentTime);
  const timeInfo = formatTime(currentTime);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 transition-all duration-700 ${
        isUnlocking ? 'translate-y-[-100%]' : ''
      } ${
        isDayMode ? 'bg-white' : 'bg-black'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translateY(-${swipeOffset}px)`,
        cursor: swipeStart ? 'grabbing' : 'grab'
      }}
    >
      {/* Main Content */}
      <div 
        className="flex flex-col items-center justify-center h-full"
        style={{ opacity }}
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
              opacity: showVolumeIndicator ? 1 : 0.2 
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
          <div className="mt-20 flex flex-col items-center">
            {/* Track Info - Minimal */}
            <div className="text-center mb-8">
              <div className={`text-lg font-normal mb-1 ${
                isDayMode ? 'text-black/60' : 'text-white/60'
              }`}>
                {currentTrack}
              </div>
              <div className={`text-base font-normal ${
                isDayMode ? 'text-black/30' : 'text-white/30'
              }`}>
                {currentArtist || '—'}
              </div>
            </div>

            {/* Play/Pause - Simple text button */}
            <button
              onClick={handlePlayPause}
              className={`transition-all hover:scale-105 bg-transparent focus:outline-none ${
                isDayMode ? 'text-black/40' : 'text-white/40'
              }`}
            >
              <span className="text-lg font-normal">
                {isPlaying ? 'pause' : 'play'}
              </span>
            </button>
          </div>
        )}
      </div>


      {/* Day/Night Toggle - Bottom Right */}
      <button
        onClick={toggleDayNight}
        className={`absolute bottom-8 right-8 w-12 h-12 rounded-full transition-all flex items-center justify-center focus:outline-none ${
          isDayMode 
            ? 'bg-black/5 hover:bg-black/10' 
            : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        {isDayMode ? (
          <MoonIcon className="w-5 h-5 text-black/50" />
        ) : (
          <SunIcon className="w-5 h-5 text-white/50" />
        )}
      </button>

      {/* Swipe Indicator - Ultra minimal */}
      <div 
        className="absolute bottom-8 left-0 right-0 flex justify-center"
        style={{ opacity: Math.max(0, 0.5 - (swipeOffset / 200)) }}
      >
        <div className={`w-32 h-1 rounded-full ${
          isDayMode ? 'bg-black/10' : 'bg-white/10'
        }`} />
      </div>

      {/* Unlock Progress - Only when actively swiping */}
      {swipeOffset > 50 && (
        <div 
          className="absolute top-1/3 left-0 right-0 flex justify-center"
          style={{ 
            opacity: Math.min(1, (swipeOffset - 50) / 50),
          }}
        >
          <div className={`text-sm font-normal ${
            isDayMode ? 'text-black/40' : 'text-white/40'
          }`}>
            {swipeOffset > 100 ? 'Release' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default LockScreen;