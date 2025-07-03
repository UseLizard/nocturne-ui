import React, { useState, useCallback } from 'react';
import { VolumeLowIcon, VolumeLoudIcon, VolumeOffIcon } from '../common/icons';

const VolumeControl = ({ 
  volume = 50, 
  onVolumeChange, 
  disabled = false,
  className = "" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [tempVolume, setTempVolume] = useState(volume);

  const displayVolume = isDragging ? tempVolume : volume;

  const getVolumeIcon = () => {
    if (displayVolume === 0) return VolumeOffIcon;
    if (displayVolume < 50) return VolumeLowIcon;
    return VolumeLoudIcon;
  };

  const VolumeIcon = getVolumeIcon();

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    setIsDragging(true);
    setTempVolume(volume);
  }, [disabled, volume]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setTempVolume(Math.round(percent));
  }, [isDragging, disabled]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging || disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newVolume = Math.round(percent);
    
    setIsDragging(false);
    setTempVolume(volume);
    
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  }, [isDragging, disabled, volume, onVolumeChange]);

  const handleClick = useCallback((e) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newVolume = Math.round(percent);
    
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  }, [disabled, onVolumeChange]);

  const toggleMute = useCallback(() => {
    if (disabled) return;
    
    if (onVolumeChange) {
      onVolumeChange(displayVolume > 0 ? 0 : 50);
    }
  }, [disabled, displayVolume, onVolumeChange]);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Volume Icon */}
      <button
        onClick={toggleMute}
        disabled={disabled}
        className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={displayVolume > 0 ? "Mute" : "Unmute"}
      >
        <VolumeIcon className="w-5 h-5 text-white" />
      </button>

      {/* Volume Slider */}
      <div className="flex-1 min-w-[100px]">
        <div
          className={`relative w-full h-2 bg-white/20 rounded-full overflow-hidden ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setTempVolume(volume);
          }}
          onClick={handleClick}
        >
          {/* Volume Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-200"
            style={{ width: `${Math.max(0, Math.min(100, displayVolume))}%` }}
          />
          
          {/* Hover/Drag Indicator */}
          {!disabled && (
            <div
              className={`absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 transition-opacity ${
                isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'
              }`}
              style={{ left: `calc(${Math.max(0, Math.min(100, displayVolume))}% - 8px)` }}
            />
          )}
        </div>
      </div>

      {/* Volume Percentage */}
      <div className="text-white/60 text-sm font-mono min-w-[3ch]">
        {Math.round(displayVolume)}%
      </div>
    </div>
  );
};

export default VolumeControl;