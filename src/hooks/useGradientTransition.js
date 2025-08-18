import { useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Helper function to generate shades of a color
const generateShades = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return [hexColor, '#000000'];

  // Convert hex to RGB
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);

  // Make it darker
  const darkR = Math.max(0, r - 40);
  const darkG = Math.max(0, g - 40);
  const darkB = Math.max(0, b - 40);
  const darkerColor = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;

  // Make it much darker
  const veryDarkR = Math.max(0, r - 80);
  const veryDarkG = Math.max(0, g - 80);
  const veryDarkB = Math.max(0, b - 80);
  const muchDarkerColor = `#${veryDarkR.toString(16).padStart(2, '0')}${veryDarkG.toString(16).padStart(2, '0')}${veryDarkB.toString(16).padStart(2, '0')}`;

  return [hexColor, darkerColor, muchDarkerColor];
};

// Generate a smoother 9-point gradient using conic and radial gradients
const generate9PointGradient = (colors) => {
  if (!colors || colors.length === 0) return null;
  
  // Ensure we have 9 colors, repeat if necessary
  const gridColors = [];
  for (let i = 0; i < 9; i++) {
    gridColors.push(colors[i % colors.length]);
  }
  
  // Create a more unified gradient using conic gradient for smooth blending
  // This creates a single gradient instead of 14 layered ones
  return `conic-gradient(from 0deg at 50% 50%, 
    ${gridColors[0]} 0deg, 
    ${gridColors[1]} 40deg, 
    ${gridColors[2]} 80deg, 
    ${gridColors[5]} 120deg, 
    ${gridColors[8]} 160deg, 
    ${gridColors[7]} 200deg, 
    ${gridColors[6]} 240deg, 
    ${gridColors[3]} 280deg, 
    ${gridColors[0]} 320deg, 
    ${gridColors[1]} 360deg)`;
};

// Create color variations by slightly adjusting RGB values
const createColorVariations = (baseColors, variationCount = 4) => {
  const variations = [];
  
  for (let v = 0; v < variationCount; v++) {
    const variedColors = baseColors.map(color => {
      if (!color || !color.startsWith('#')) return color;
      
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Apply small random variations (±15)
      const variation = 15;
      const newR = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * 2 * variation));
      const newG = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * 2 * variation));
      const newB = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * 2 * variation));
      
      return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    });
    
    variations.push(variedColors);
  }
  
  return variations;
};


export function useGradientTransition() {
  const { resetToDefault, setTheme, startGradientCycling, stopGradientCycling } = useTheme();

  const transitionToColor = useCallback((colors, duration = 1200, easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)') => {
    if (!colors || (Array.isArray(colors) && colors.length === 0)) {
      console.warn("transitionToColor called with no colors, resetting to default.");
      resetToDefault();
      return;
    }

    let gradientColors;
    if (typeof colors === 'string') {
      gradientColors = generateShades(colors);
    } else if (Array.isArray(colors)) {
      gradientColors = colors.length > 1 ? colors : generateShades(colors[0]);
    } else {
       console.warn("transitionToColor received an invalid type, resetting to default.");
       resetToDefault();
       return;
    }

    // For 9-point gradients (album art), use the new system
    if (gradientColors.length >= 9) {
      const baseGradient = generate9PointGradient(gradientColors);
      const variations = createColorVariations(gradientColors, 4);
      const gradientVariations = variations.map(colorSet => generate9PointGradient(colorSet));
      
      console.log(`🎨 GRADIENT TRANSITION: Creating 9-point gradient with ${gradientVariations.length} variations`);
      console.log(`🎨 GRADIENT TRANSITION: Base colors:`, gradientColors);
      
      if (baseGradient && gradientVariations.length > 0) {
        // Start with the base gradient
        setTheme({
          background: baseGradient,
          transition: `background ${duration}ms ${easing}`
        });
        
        // Start the cycling after initial transition
        setTimeout(() => {
          startGradientCycling(gradientVariations);
        }, duration);
      }
    } else {
      // For simple gradients (ColorTransitionTester), use the old system
      const gradient = `linear-gradient(135deg, ${gradientColors.join(', ')})`;
      
      console.log(`🎨 GRADIENT TRANSITION: Creating simple gradient: ${gradient}`);
      
      // Stop any running cycling for simple gradients
      stopGradientCycling();
      
      setTheme({
        background: gradient,
        transition: `background ${duration}ms ${easing}`
      });
    }
  }, [resetToDefault, setTheme, startGradientCycling, stopGradientCycling]);

  return { transitionToColor, resetToDefault };
}
