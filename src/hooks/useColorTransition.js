import { useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * A hook to transition the background to a solid color with customizable timing and easing.
 * @returns {{transitionToColor: (function(string, number, string): void), resetToDefault: function}}
 */
export function useColorTransition() {
  const { updateGradient, resetToDefault, setTheme } = useTheme();

  const transitionToColor = useCallback((color, duration = 1200, easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)') => {
    if (!color) {
      console.warn("transitionToColor called with no color, resetting to default.");
      resetToDefault();
      return;
    }

    // Use solid color instead of gradient for proper CSS transitions
    console.log(`🎨 TRANSITION: Transitioning to color: ${color} over ${duration}ms with ${easing}`);
    
    // Update theme with custom transition timing - use solid color for animatable transitions
    setTheme({
      background: color,
      transition: `background ${duration}ms ${easing}`
    });
  }, [updateGradient, resetToDefault, setTheme]);

  return { transitionToColor, resetToDefault };
}
