import React, { createContext, useState, useContext, useMemo, useCallback, useRef } from 'react';

const DEFAULT_BACKGROUND = '#1a1a2e';

const DEFAULT_THEME = {
  background: DEFAULT_BACKGROUND,
  textColor: '#FFFFFF',
  transition: 'background 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const lastBackgroundRef = useRef(DEFAULT_BACKGROUND);

  const handleSetTheme = useCallback((newTheme) => {
    console.log('🖼️ THEME: Theme update requested', {
      newTheme,
      timestamp: new Date().toISOString()
    });
    
    setTheme(prevTheme => {
      const updatedTheme = { ...prevTheme, ...newTheme };
      console.log('🖼️ THEME: Theme updated', {
        from: prevTheme.background?.substring(0, 50) + '...',
        to: updatedTheme.background?.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
      return updatedTheme;
    });
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
  }, [handleSetTheme]);

  const resetToDefault = useCallback(() => {
    console.log('🖼️ THEME: Resetting to default gradient');
    updateGradient(DEFAULT_BACKGROUND);
  }, [updateGradient]);

  const value = useMemo(() => ({
    theme,
    setTheme: handleSetTheme,
    updateGradient,
    resetToDefault
  }), [theme, handleSetTheme, updateGradient, resetToDefault]);

  return (
    <ThemeContext.Provider value={value}>
      <div 
        className="fixed inset-0 z-0 rounded-2xl" 
        style={{ 
          background: theme.background || '#1a1a2e',
          transition: theme.transition || 'background 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          minHeight: '100vh',
          minWidth: '100vw'
        }} 
      />
      {children}
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
