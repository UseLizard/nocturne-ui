
# Guide: Enhancing `LocalMediaPlayer` Gestures

This document provides a step-by-step guide for adding two key gesture-based features to the `LocalMediaPlayer.jsx` component:

1.  **Swipe-to-Skip:** Allowing users to swipe left or right on the album art area to skip tracks.
2.  **Drag-to-Seek:** Allowing users to tap, hold, and drag the progress bar to seek to a specific position in the track.

---

## Part 1: Adding Swipe-to-Skip Functionality

**Goal:** Implement "swipe-to-skip" using the existing `useGestureControls` custom hook.

**File to Modify:** `src/components/media/LocalMediaPlayer.jsx`

### **Step 1.1: Import the `useGestureControls` Hook**

First, import the hook at the top of the file.

```jsx
import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useLocalMedia } from '../../hooks/useLocalMedia';
import { useNavigation } from '../../hooks/useNavigation';
import { useMediaScrollWheel } from '../../hooks/useScrollWheel';
import { useGestureControls } from '../../hooks/useGestureControls'; // <-- ADD THIS LINE
import ScrollingText from '../common/ScrollingText';
// ... other imports
```

### **Step 1.2: Create a Ref for the Gesture Area**

The hook needs a `ref` to attach its event listeners to. We'll use the main content container for this.

```jsx
const LocalMediaPlayer = ({ className = "", onClose }) => {
  const containerRef = useRef(null);
  const contentContainerRef = useRef(null); // <-- ADD THIS LINE
  const [volumeOverlayState, setVolumeOverlayState] = useState({
    visible: false,
    animation: "hidden"
  });
  // ... rest of the state
```

### **Step 1.3: Call the `useGestureControls` Hook**

Call the hook within the component, wiring it up to the `handleSkipNext` and `handleSkipPrevious` functions that are already defined.

```jsx
  // ... after the useNavigation hook ...

  useNavigation({
    containerRef,
    // ... other options
  });

  // ADD THIS ENTIRE BLOCK
  useGestureControls({
    contentRef: contentContainerRef,
    onSwipeLeft: handleSkipNext,
    onSwipeRight: handleSkipPrevious,
    isActive: true,
  });

  // ... rest of the component
```

### **Step 1.4: Attach the Ref to the JSX**

Finally, attach the `contentContainerRef` to the main content `div` so the gesture hook knows where to listen for swipes.

```jsx
  return (
    <div
      className="flex flex-col justify-between h-screen w-full z-10 fadeIn-animation"
      ref={containerRef}
    >
      {/* Attach the ref to this div */}
      <div
        className="md:w-1/3 flex flex-row items-center px-12 pt-10 flex-1"
        ref={contentContainerRef} // <-- ADD THIS LINE
      >
        {/* ... content ... */}
      </div>

      {/* ... rest of the component ... */}
    </div>
  );
};
```

---

## Part 2: Adding Drag-to-Seek Functionality

**Goal:** Implement a "tap, hold, and drag" seeking mechanism for the progress bar.

**File to Modify:** `src/components/media/LocalMediaPlayer.jsx` (specifically the `LocalMediaProgressBar` inner component)

### **Step 2.1: Define the End-Interaction Logic**

First, create a `useCallback` hook to handle the logic for when the user finishes scrubbing. This will be used by mouse, touch, and keyboard events.

```jsx
// Inside the LocalMediaProgressBar component

const LocalMediaProgressBar = ({ /* ...props... */ }) => {
  // ... existing state ...
  const containerRef = useRef(null);

  // ADD THIS ENTIRE BLOCK
  const handleInteractionEnd = useCallback(() => {
    setIsScrubbing(false);
    onScrubbingChange?.(false);

    if (scrubbingProgress !== null) {
      const seekMs = Math.floor((scrubbingProgress / 100) * durationMs);
      onSeek(seekMs);
      updateProgress?.(seekMs);
    }

    setScrubbingProgress(null);
  }, [scrubbingProgress, durationMs, onSeek, onScrubbingChange, updateProgress]);

  // ... rest of the component
```

### **Step 2.2: Update the `handleClick` Function**

Modify the existing `handleClick` function to immediately calculate the progress based on the click/tap position.

```jsx
// Inside the LocalMediaProgressBar component

  const handleClick = (event) => {
    setIsScrubbing(true);
    onScrubbingChange?.(true);

    // Immediately set progress based on click position
    if (containerRef.current) {
      // Use changedTouches for touch events, otherwise use clientX
      const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const newProgress = ((clientX - rect.left) / rect.width) * 100;
      setScrubbingProgress(Math.max(0, Math.min(100, newProgress)));
    }
  };
```

### **Step 2.3: Add Drag and Touch Event Handlers**

Modify the `useEffect` hook that currently handles the `wheel` event. Add listeners for `mousemove` and `touchmove` to handle the dragging action.

```jsx
// Inside the LocalMediaProgressBar component

  useEffect(() => {
    if (!isScrubbing) return;

    const handleScrub = (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newProgress = ((clientX - rect.left) / rect.width) * 100;
      setScrubbingProgress(Math.max(0, Math.min(100, newProgress)));
    };

    const handleMouseMove = (event) => handleScrub(event.clientX);
    const handleTouchMove = (event) => handleScrub(event.touches[0].clientX);

    // Add mouse and touch listeners for dragging
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    // Use the new handleInteractionEnd for mouseup/touchend
    window.addEventListener("mouseup", handleInteractionEnd);
    window.addEventListener("touchend", handleInteractionEnd);

    // Keep the existing wheel event logic
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

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleInteractionEnd);
      window.removeEventListener("touchend", handleInteractionEnd);
    };
    // Add handleInteractionEnd to the dependency array
  }, [isScrubbing, progress, handleInteractionEnd]);
```

### **Step 2.4: Update Keyboard Event Handler**

Modify the `keydown` effect to use the new `handleInteractionEnd` function for consistency.

```jsx
// Inside the LocalMediaProgressBar component

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && isScrubbing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleInteractionEnd(); // <-- Use the new function
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
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isScrubbing, handleInteractionEnd, onScrubbingChange]); // <-- Update dependencies
```

### **Step 2.5: Update the JSX to Handle Mouse and Touch**

Finally, update the progress bar `div` to handle both `onMouseDown` and `onTouchStart` events.

```jsx
// In the return statement of LocalMediaProgressBar

      <div
        className={`relative w-full bg-white/20 rounded-full overflow-hidden transition-all duration-300 ${isScrubbing ? "h-8" : "h-2 mt-4"}`}
        onMouseDown={handleClick} // <-- CHANGE onClick to onMouseDown
        onTouchStart={handleClick} // <-- ADD onTouchStart for mobile
      >
        {/* ... progress bar inner divs ... */}
      </div>
```
