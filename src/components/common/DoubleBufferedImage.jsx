import React, { useState, useEffect, useRef } from 'react';

/**
 * DoubleBufferedImage - A component that displays images with smooth crossfade transitions
 * Uses a double-buffer technique to eliminate flicker when changing images
 */
const DoubleBufferedImage = ({ 
  src, 
  alt, 
  className = "", 
  onLoad,
  fallback,
  transitionDuration = 300 
}) => {
  // Track which buffer is currently visible (0 or 1)
  const [activeBuffer, setActiveBuffer] = useState(0);
  // Track the URLs for each buffer
  const [buffer0Src, setBuffer0Src] = useState(src);
  const [buffer1Src, setBuffer1Src] = useState(null);
  // Track loading states
  const [buffer0Loaded, setBuffer0Loaded] = useState(false);
  const [buffer1Loaded, setBuffer1Loaded] = useState(false);
  // Track if we should show fallback
  const [showFallback, setShowFallback] = useState(!src);
  
  const buffer0Ref = useRef(null);
  const buffer1Ref = useRef(null);
  const pendingSrcRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setShowFallback(true);
      return;
    }

    // If src hasn't changed, do nothing
    if (src === buffer0Src && activeBuffer === 0) return;
    if (src === buffer1Src && activeBuffer === 1) return;

    // Determine which buffer to load the new image into
    const inactiveBuffer = activeBuffer === 0 ? 1 : 0;
    
    // Set the pending source
    pendingSrcRef.current = src;

    // Load the new image into the inactive buffer
    if (inactiveBuffer === 0) {
      setBuffer0Src(src);
      setBuffer0Loaded(false);
    } else {
      setBuffer1Src(src);
      setBuffer1Loaded(false);
    }
  }, [src, activeBuffer, buffer0Src, buffer1Src]);

  const handleImageLoad = (bufferIndex, event) => {
    // Mark buffer as loaded
    if (bufferIndex === 0) {
      setBuffer0Loaded(true);
    } else {
      setBuffer1Loaded(true);
    }

    // If this is the buffer we're waiting for, switch to it
    const loadedSrc = event.target.src;
    if (loadedSrc === pendingSrcRef.current || loadedSrc.includes(pendingSrcRef.current)) {
      setActiveBuffer(bufferIndex);
      setShowFallback(false);
      pendingSrcRef.current = null;
      
      // Call the onLoad callback after the transition completes
      if (onLoad) {
        // Capture the src now, before the timeout
        const imageSrc = event.target.src;
        setTimeout(() => {
          // Create a synthetic event with the captured src
          onLoad({
            target: { src: imageSrc }
          });
        }, transitionDuration);
      }
    }
  };

  const handleImageError = (bufferIndex) => {
    // If the active buffer fails to load, show fallback
    if (bufferIndex === activeBuffer) {
      setShowFallback(true);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Buffer 0 */}
      <img
        ref={buffer0Ref}
        src={buffer0Src}
        alt={alt}
        className={`absolute inset-0 ${className} transition-opacity`}
        style={{
          opacity: activeBuffer === 0 && !showFallback ? 1 : 0,
          transitionDuration: `${transitionDuration}ms`,
          pointerEvents: activeBuffer === 0 ? 'auto' : 'none'
        }}
        onLoad={(e) => handleImageLoad(0, e)}
        onError={() => handleImageError(0)}
      />
      
      {/* Buffer 1 */}
      {buffer1Src && (
        <img
          ref={buffer1Ref}
          src={buffer1Src}
          alt={alt}
          className={`absolute inset-0 ${className} transition-opacity`}
          style={{
            opacity: activeBuffer === 1 && !showFallback ? 1 : 0,
            transitionDuration: `${transitionDuration}ms`,
            pointerEvents: activeBuffer === 1 ? 'auto' : 'none'
          }}
          onLoad={(e) => handleImageLoad(1, e)}
          onError={() => handleImageError(1)}
        />
      )}
      
      {/* Fallback content */}
      {showFallback && fallback && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity`}
          style={{
            opacity: showFallback ? 1 : 0,
            transitionDuration: `${transitionDuration}ms`
          }}
        >
          {fallback}
        </div>
      )}
    </div>
  );
};

export default DoubleBufferedImage;