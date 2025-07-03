import React, { useState, useCallback } from 'react';

const MediaProgressBar = ({ 
  position = 0, 
  duration = 0, 
  formatTime, 
  onSeek, 
  disabled = false,
  className = "" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [tempPosition, setTempPosition] = useState(position);

  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const displayProgress = isDragging ? (tempPosition / duration) * 100 : progress;

  const handleMouseDown = useCallback((e) => {
    if (disabled || duration === 0) return;
    setIsDragging(true);
    setTempPosition(position);
  }, [disabled, duration, position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || disabled || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newPosition = (percent / 100) * duration;
    setTempPosition(newPosition);
  }, [isDragging, disabled, duration]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging || disabled || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newPosition = Math.floor((percent / 100) * duration);
    
    setIsDragging(false);
    setTempPosition(position);
    
    if (onSeek) {
      onSeek(newPosition);
    }
  }, [isDragging, disabled, duration, position, onSeek]);

  const handleClick = useCallback((e) => {
    if (disabled || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newPosition = Math.floor((percent / 100) * duration);
    
    if (onSeek) {
      onSeek(newPosition);
    }
  }, [disabled, duration, onSeek]);

  return (
    <div className={`w-full ${className}`}>
      {/* Time Display */}
      <div className="flex justify-between text-white/60 text-xs mb-2">
        <span>{formatTime(isDragging ? tempPosition : position)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Progress Bar */}
      <div
        className={`relative w-full h-2 bg-white/20 rounded-full overflow-hidden ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setTempPosition(position);
        }}
        onClick={handleClick}
      >
        {/* Progress Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-white transition-all duration-200"
          style={{ width: `${Math.max(0, Math.min(100, displayProgress))}%` }}
        />
        
        {/* Hover/Drag Indicator */}
        {!disabled && duration > 0 && (
          <div
            className={`absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 transition-opacity ${
              isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
            style={{ left: `calc(${Math.max(0, Math.min(100, displayProgress))}% - 8px)` }}
          />
        )}
      </div>
    </div>
  );
};

export default MediaProgressBar;