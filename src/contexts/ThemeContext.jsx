import React, { createContext, useState, useContext, useMemo, useCallback, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #1a1a2e, #16213e, #0f172a)';

// Helper function to calculate color brightness (perceived luminance)
const getColorBrightness = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return 0;
  
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Use the relative luminance formula (sRGB)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

// Helper function to darken a color if it's too bright
const ensureReadableColor = (hexColor, maxBrightness = 0.6) => {
  if (!hexColor || !hexColor.startsWith('#')) return hexColor;
  
  const brightness = getColorBrightness(hexColor);
  
  // If the color is too bright, darken it
  if (brightness > maxBrightness) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate the darkening factor needed
    const darkeningFactor = maxBrightness / brightness;
    
    const newR = Math.floor(r * darkeningFactor);
    const newG = Math.floor(g * darkeningFactor);
    const newB = Math.floor(b * darkeningFactor);
    
    const darkenedColor = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    
    console.log(`🎨 COLOR ADJUSTMENT: Darkened ${hexColor} (brightness: ${brightness.toFixed(2)}) to ${darkenedColor} (brightness: ${getColorBrightness(darkenedColor).toFixed(2)})`);
    
    return darkenedColor;
  }
  
  return hexColor;
};

// Extract 2 dominant colors from the image (simplified)
const extractDominantColors = (imageElement) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      
      // Draw the image on canvas
      ctx.drawImage(imageElement, 0, 0);
      
      // Extract colors from center and corner regions for good contrast
      const regions = [
        { x: 0, y: 0, width: canvas.width / 2, height: canvas.height / 2 }, // Top-left
        { x: canvas.width / 2, y: canvas.height / 2, width: canvas.width / 2, height: canvas.height / 2 } // Bottom-right
      ];
      
      const colors = [];
      
      regions.forEach((region, index) => {
        const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
        const data = imageData.data;
        
        let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;
        
        // Calculate average color for this region
        for (let i = 0; i < data.length; i += 4) {
          totalR += data[i];     // Red
          totalG += data[i + 1]; // Green
          totalB += data[i + 2]; // Blue
          pixelCount++;
        }
        
        if (pixelCount > 0) {
          const avgR = Math.round(totalR / pixelCount);
          const avgG = Math.round(totalG / pixelCount);
          const avgB = Math.round(totalB / pixelCount);
          
          // Apply consistent 50% darkening for subtle background
          const darkenedR = Math.floor(avgR * 0.5);
          const darkenedG = Math.floor(avgG * 0.5);
          const darkenedB = Math.floor(avgB * 0.5);
          
          const hexColor = `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
          colors.push(hexColor);
        }
      });
      
      console.log(`🎨 COLOR EXTRACTION: Extracted ${colors.length} dominant colors`, colors);
      resolve(colors);
      
    } catch (error) {
      console.error('🎨 COLOR EXTRACTION: Error extracting dominant colors:', error);
      reject(error);
    }
  });
};


const DEFAULT_THEME = {
  background: DEFAULT_BACKGROUND,
  textColor: '#FFFFFF',
  transition: 'background 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [currentGradient, setCurrentGradient] = useState(DEFAULT_BACKGROUND);
  const [targetGradient, setTargetGradient] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastBackgroundRef = useRef(DEFAULT_BACKGROUND);
  const transitionTimeoutRef = useRef(null);
  const cyclingIntervalRef = useRef(null);
  const gradientVariationsRef = useRef([]);
  const currentVariationIndexRef = useRef(0);
  const mountedRef = useRef(true);

  const handleSetTheme = useCallback((update) => {
    console.log('🖼️ THEME: Theme update requested', {
      update,
      timestamp: new Date().toISOString()
    });

    // If this is a background change with transition, handle it specially
    if (update.background && update.transition) {
      const duration = parseInt(update.transition.match(/(\d+)ms/)?.[1] || '1200');
      
      console.log('🖼️ THEME: Starting gradient transition', {
        from: currentGradient.substring(0, 50) + '...',
        to: update.background.substring(0, 50) + '...',
        duration,
        isCurrentlyTransitioning: isTransitioning
      });

      // If we're already transitioning, immediately complete the current transition
      if (isTransitioning && transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        // Set the current gradient to the target that was being transitioned to
        if (targetGradient) {
          setCurrentGradient(targetGradient);
        }
        console.log('🖼️ THEME: Interrupted previous transition, completing immediately');
      }

      // Set up the new transition
      setTargetGradient(update.background);
      setIsTransitioning(true);

      // Complete the transition after the duration
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentGradient(update.background);
        setTargetGradient(null);
        setIsTransitioning(false);
        console.log('🖼️ THEME: Gradient transition completed');
      }, duration);

      return;
    }

    setTheme(prevTheme => {
      const newTheme = typeof update === 'function' ? update(prevTheme) : { ...prevTheme, ...update };
      
      console.log('🖼️ THEME: Theme updated', {
        from: prevTheme.background?.substring(0, 50) + '...',
        to: newTheme.background?.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });

      return newTheme;
    });
  }, [currentGradient, isTransitioning, targetGradient]);

  const generateGradient = useCallback((color) => {
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(color);
    if (!rgb) return color;

    const lighterRgb = {
      r: Math.min(255, Math.floor(rgb.r * 1.3)),
      g: Math.min(255, Math.floor(rgb.g * 1.3)),
      b: Math.min(255, Math.floor(rgb.b * 1.3))
    };

    const darkerRgb = {
      r: Math.floor(rgb.r * 0.6),
      g: Math.floor(rgb.g * 0.6),
      b: Math.floor(rgb.b * 0.6)
    };

    return `linear-gradient(135deg, rgb(${lighterRgb.r}, ${lighterRgb.g}, ${lighterRgb.b}), rgb(${rgb.r}, ${rgb.g}, ${rgb.b}), rgb(${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b}))`;
  }, []);

  const updateGradient = useCallback((backgroundCSS) => {
    console.log('🖼️ THEME: updateGradient called with:', backgroundCSS?.substring(0, 50) + '...');
    console.log('🖼️ THEME: Current background:', lastBackgroundRef.current?.substring(0, 50) + '...');
    
    if (!backgroundCSS || backgroundCSS === lastBackgroundRef.current) {
      console.log('🖼️ THEME: Gradient update skipped - same background or no CSS');
      return;
    }

    console.log('🖼️ THEME: Updating gradient background');
    lastBackgroundRef.current = backgroundCSS;
    
    setTheme(prevTheme => ({
      ...prevTheme,
      background: backgroundCSS,
      transition: prevTheme.transition || DEFAULT_THEME.transition
    }));
  }, []);

  const startGradientCycling = useCallback((variations) => {
    // Clear any existing cycling
    if (cyclingIntervalRef.current) {
      clearInterval(cyclingIntervalRef.current);
    }

    gradientVariationsRef.current = variations;
    currentVariationIndexRef.current = 0;

    if (variations.length > 1) {
      cyclingIntervalRef.current = setInterval(() => {
        currentVariationIndexRef.current = (currentVariationIndexRef.current + 1) % variations.length;
        const nextGradient = variations[currentVariationIndexRef.current];
        
        console.log(`🖼️ THEME: Cycling to gradient variation ${currentVariationIndexRef.current + 1}/${variations.length}`);
        
        handleSetTheme({
          background: nextGradient,
          transition: 'background 2000ms ease-in-out'
        });
      }, 4000);
    }
  }, [handleSetTheme]);

  const stopGradientCycling = useCallback(() => {
    if (cyclingIntervalRef.current) {
      clearInterval(cyclingIntervalRef.current);
      cyclingIntervalRef.current = null;
    }
    gradientVariationsRef.current = [];
  }, []);

  const resetToDefault = useCallback(() => {
    console.log('🖼️ THEME: Resetting to default gradient');
    stopGradientCycling();
    handleSetTheme({
      background: DEFAULT_BACKGROUND,
      transition: 'background 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
  }, [handleSetTheme, stopGradientCycling]);

  // Helper function to generate shades of a color
  const generateShades = useCallback((hexColor) => {
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
  }, []);

  // Generate a smoother 9-point gradient using conic and radial gradients
  const generate9PointGradient = useCallback((colors) => {
    if (!colors || colors.length === 0) return null;
    
    // Ensure we have 9 colors, repeat if necessary
    const gridColors = [];
    for (let i = 0; i < 9; i++) {
      gridColors.push(colors[i % colors.length]);
    }
    
    // Create a more unified gradient using conic gradient for smooth blending
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
  }, []);

  // Create color variations by slightly adjusting RGB values
  const createColorVariations = useCallback((baseColors, variationCount = 4) => {
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
  }, []);

  const handleAlbumArtGradientUpdate = useCallback(async () => {
    try {
      console.log('🎨 THEME: Processing album art for gradient update...');
      const albumArtUrl = `http://localhost:5000/api/albumart?t=${Date.now()}`;
      
      const response = await fetch(albumArtUrl);
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);

      const imageForExtraction = new Image();
      imageForExtraction.crossOrigin = "Anonymous";
      imageForExtraction.src = objectURL;

      imageForExtraction.onload = async () => {
        try {
          const colors = await extractDominantColors(imageForExtraction);
          console.log('🎨 THEME: Extracted dominant colors from album art', colors);
          
          if (colors && colors.length >= 2) {
            // Create simple 2-color linear gradient
            const dominantColor = colors[0] || '#1a1a2e';
            const accentColor = colors[1] || '#16213e';
            
            const simpleGradient = `linear-gradient(135deg, ${dominantColor}, ${accentColor})`;
            
            console.log(`🎨 THEME: Creating simple 2-color gradient`, {
              dominant: dominantColor,
              accent: accentColor
            });
            
            // Stop any complex cycling and use a simple transition
            stopGradientCycling();
            
            handleSetTheme({
              background: simpleGradient,
              transition: 'background 800ms ease-in-out'
            });
          } else {
            console.log('🎨 THEME: Not enough colors extracted, resetting to default');
            resetToDefault();
          }
        } catch (error) {
          console.error('🎨 THEME: Error processing album art for gradient:', error);
          resetToDefault();
        }
        URL.revokeObjectURL(objectURL);
      };
      
      imageForExtraction.onerror = () => {
        console.error('🎨 THEME: Could not load album art image for gradient');
        resetToDefault();
        URL.revokeObjectURL(objectURL);
      };
      
    } catch (error) {
      console.error('🎨 THEME: Error fetching album art for gradient update:', error);
      resetToDefault();
    }
  }, [handleSetTheme, stopGradientCycling, resetToDefault]);

  const value = useMemo(() => ({
    theme,
    setTheme: handleSetTheme,
    updateGradient,
    generateGradient,
    resetToDefault,
    startGradientCycling,
    stopGradientCycling
  }), [theme, handleSetTheme, updateGradient, generateGradient, resetToDefault, startGradientCycling, stopGradientCycling]);

  // WebSocket message handlers for album art updates
  const albumArtMessageHandlers = {
    'new_album_art_set': (data) => {
      console.log('🎨 THEME: Received new_album_art_set WebSocket message:', data);
      handleAlbumArtGradientUpdate();
    },
    'media/album_art_received': (data) => {
      console.log('🎨 THEME: Received album_art_received WebSocket message:', data);
      handleAlbumArtGradientUpdate();
    }
  };

  // Don't create another WebSocket connection - let useNocturnedMedia handle it
  // const { isConnected: wsConnected } = useWebSocket('NOCTURNED', albumArtMessageHandlers);
  const wsConnected = true; // Assume connected for now

  // Track WebSocket connection status
  React.useEffect(() => {
    if (wsConnected) {
      console.log('🎨 THEME: WebSocket connected for album art updates');
    } else {
      console.log('🎨 THEME: WebSocket disconnected for album art updates');
    }
  }, [wsConnected]);

  // Initialize component
  React.useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cleanup effect for transition timeout and cycling interval
  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (cyclingIntervalRef.current) {
        clearInterval(cyclingIntervalRef.current);
      }
    };
  }, []);

  return (
    <ThemeContext.Provider value={value}>
      <div 
        className="fixed inset-0 z-0 rounded-2xl" 
        style={{ 
          background: currentGradient,
          minHeight: '100vh',
          minWidth: '100vw'
        }} 
      />
      {isTransitioning && targetGradient && (
        <div 
          className="fixed inset-0 z-0 rounded-2xl" 
          style={{ 
            background: targetGradient,
            minHeight: '100vh',
            minWidth: '100vw',
            opacity: 0,
            animation: `fadeIn ${parseInt(theme.transition?.match(/(\d+)ms/)?.[1] || '1200')}ms ${theme.transition?.match(/cubic-bezier\([^)]+\)|ease-in|ease-out|ease-in-out|linear/)?.[0] || 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'} forwards`
          }} 
        />
      )}
      {children}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </ThemeContext.Provider>
  );
};

// Custom hook for easy access to the theme context.
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
