import { useEffect } from 'react';
import { useGradient } from '../../hooks/useGradient';
import { useTheme } from '../../contexts/ThemeContext';

const GradientInitializer = () => {
  const { updateGradientFromColors } = useGradient();
  const { theme } = useTheme();

  useEffect(() => {
    // Initialize with default gradient colors on app startup (now playing theme)
    console.log('🎨 GRADIENT INITIALIZER: Component mounted');
    console.log('🎨 GRADIENT INITIALIZER: Current theme background:', theme.background?.substring(0, 50) + '...');
    
    // Use a more visible gradient for debugging
    const defaultColors = ['#1a1a2e', '#16213e', '#0f3460', '#533483'];
    console.log('🎨 GRADIENT INITIALIZER: Setting default gradient with colors:', defaultColors);
    updateGradientFromColors(defaultColors, 'app-startup');
  }, [updateGradientFromColors, theme.background]);

  // Log theme changes
  useEffect(() => {
    console.log('🎨 GRADIENT INITIALIZER: Theme background changed to:', theme.background?.substring(0, 50) + '...');
  }, [theme.background]);

  return null; // This component doesn't render anything
};

export default GradientInitializer;