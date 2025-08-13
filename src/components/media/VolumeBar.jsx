import React, { memo } from 'react';

// Memoized volume bar component to prevent unnecessary re-renders
const VolumeBar = memo(({ volumeOverlayState, volume }) => {
  return (
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
  );
});

VolumeBar.displayName = 'VolumeBar';

export default VolumeBar;