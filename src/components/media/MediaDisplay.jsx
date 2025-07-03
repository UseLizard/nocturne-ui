import React from 'react';
import ScrollingText from '../common/ScrollingText';

const MediaDisplay = ({ 
  artist, 
  track, 
  album, 
  isConnected = false,
  className = "" 
}) => {
  if (!isConnected) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-white/60 text-sm mb-2">No Android device connected</div>
        <div className="text-white/40 text-xs">
          Pair your Android device running NocturneCompanion
        </div>
      </div>
    );
  }

  if (!track && !artist) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-white/60 text-sm mb-2">No media playing</div>
        <div className="text-white/40 text-xs">
          Start playing music on your Android device
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {/* Track Title */}
      <div className="mb-2">
        <ScrollingText 
          text={track || 'Unknown Track'} 
          className="text-white text-lg font-semibold"
          speed={30}
        />
      </div>

      {/* Artist */}
      <div className="mb-1">
        <ScrollingText 
          text={artist || 'Unknown Artist'} 
          className="text-white/80 text-sm"
          speed={25}
        />
      </div>

      {/* Album (if available) */}
      {album && (
        <div>
          <ScrollingText 
            text={album} 
            className="text-white/60 text-xs"
            speed={20}
          />
        </div>
      )}
    </div>
  );
};

export default MediaDisplay;