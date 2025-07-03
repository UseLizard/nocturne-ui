import React from 'react';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackwardIcon } from '../common/icons';

const MediaControls = ({ 
  isPlaying, 
  onTogglePlayPause, 
  onNext, 
  onPrevious, 
  disabled = false,
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={disabled}
        className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous track"
      >
        <SkipBackwardIcon className="w-6 h-6 text-white" />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={onTogglePlayPause}
        disabled={disabled}
        className="p-4 rounded-full bg-white hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <PauseIcon className="w-8 h-8 text-black" />
        ) : (
          <PlayIcon className="w-8 h-8 text-black" />
        )}
      </button>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={disabled}
        className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next track"
      >
        <SkipForwardIcon className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default MediaControls;