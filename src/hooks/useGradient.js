import { useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { extractColorsFromImage } from '../utils/colorExtractor';
import { getFirstItemImageUrl, getShowImageUrl } from '../utils/imageUtils';

const SECTION_COLORS = {
  radio: ['#3B518B', '#202F57', '#142045', '#151231'],
  settings: ['#3B518B', '#202F57', '#142045', '#151231'],
  library: ['#7662e9', '#a9c1de', '#8f90e3', '#5b30ef'],
  auth: ['#3B518B', '#202F57', '#142045', '#151231'],
  weather: ['#3B518B', '#202F57', '#142045', '#151231'],
  default: ['#191414', '#191414', '#191414', '#191414']
};

export function useGradient() {
  const { updateGradient } = useTheme();
  const lastProcessedRef = useRef({ url: null, section: null, track: null });
  const pendingUpdateRef = useRef(null);

  const debounce = useCallback((func, delay) => {
    return (...args) => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
      pendingUpdateRef.current = setTimeout(() => func(...args), delay);
    };
  }, []);

  const createGradientBackground = useCallback((colors) => {
    if (!colors || colors.length === 0) return null;
    
    const positions = ["at 0% 25%", "at 25% 0%", "at 100% 75%", "at 75% 100%"];
    const radialGradients = positions.map((position, index) => {
      const color = colors[index % colors.length];
      return `radial-gradient(${position}, ${color} 0%, transparent 80%)`;
    });
    
    return radialGradients.join(", ");
  }, []);

  const updateGradientFromColors = useCallback((colors, source = 'unknown') => {
    console.log('🎨 GRADIENT: Updating from colors', { colors, source });
    const backgroundCSS = createGradientBackground(colors);
    if (backgroundCSS) {
      updateGradient(backgroundCSS);
    }
  }, [createGradientBackground, updateGradient]);

  const updateGradientFromImage = useCallback(async (imageUrl, section = null, trackName = null) => {
    const cacheKey = `${imageUrl || 'none'}-${section || 'none'}-${trackName || 'none'}`;
    
    if (lastProcessedRef.current.url === imageUrl && 
        lastProcessedRef.current.section === section && 
        lastProcessedRef.current.track === trackName) {
      console.log('🎨 GRADIENT: Skipping duplicate update');
      return;
    }

    lastProcessedRef.current = { url: imageUrl, section, track: trackName };

    console.log('🎨 GRADIENT: Updating from image', { imageUrl, section, trackName });

    if (!imageUrl) {
      const colors = SECTION_COLORS[section] || SECTION_COLORS.default;
      updateGradientFromColors(colors, `section-${section}`);
      return;
    }

    try {
      const colors = await extractColorsFromImage(imageUrl);
      updateGradientFromColors(colors, `image-${section || 'unknown'}`);
    } catch (error) {
      console.error('🎨 GRADIENT: Error extracting colors:', error);
      const fallbackColors = SECTION_COLORS[section] || SECTION_COLORS.default;
      updateGradientFromColors(fallbackColors, 'fallback');
    }
  }, [updateGradientFromColors]);

  const debouncedUpdateFromImage = useCallback(
    debounce(updateGradientFromImage, 100),
    [updateGradientFromImage, debounce]
  );

  const updateGradientForSection = useCallback((section, data = {}) => {
    console.log('🎨 GRADIENT: Updating for section', { section, data });

    switch (section) {
      case 'recents':
        if (data.recentAlbums?.length > 0) {
          const imageUrl = getFirstItemImageUrl(data.recentAlbums);
          debouncedUpdateFromImage(imageUrl, section);
        } else {
          updateGradientFromColors(SECTION_COLORS.default, 'recents-empty');
        }
        break;

      case 'library':
        if (data.userPlaylists?.length > 0) {
          const imageUrl = getFirstItemImageUrl(data.userPlaylists);
          debouncedUpdateFromImage(imageUrl, section);
        } else {
          updateGradientFromColors(SECTION_COLORS.library, 'library-default');
        }
        break;

      case 'radio':
        if (data.radioMixes?.length > 0) {
          const imageUrl = data.radioMixes[0]?.images?.[0]?.url;
          debouncedUpdateFromImage(imageUrl, section);
        } else {
          updateGradientFromColors(SECTION_COLORS.radio, 'radio-default');
        }
        break;

      case 'artists':
        if (data.topArtists?.length > 0) {
          const imageUrl = getFirstItemImageUrl(data.topArtists);
          debouncedUpdateFromImage(imageUrl, section);
        } else {
          updateGradientFromColors(SECTION_COLORS.default, 'artists-empty');
        }
        break;

      case 'podcasts':
        if (data.userShows?.length > 0) {
          const imageUrl = getShowImageUrl(data.userShows[0]);
          debouncedUpdateFromImage(imageUrl, section);
        } else {
          updateGradientFromColors(SECTION_COLORS.default, 'podcasts-empty');
        }
        break;

      case 'nowPlaying':
        if (data.currentlyPlayingAlbum?.images?.[1]?.url) {
          debouncedUpdateFromImage(data.currentlyPlayingAlbum.images[1].url, section, data.trackName);
        } else {
          updateGradientFromColors(SECTION_COLORS.default, 'nowPlaying-empty');
        }
        break;

      case 'media':
        if (data.albumArtUrl) {
          debouncedUpdateFromImage(data.albumArtUrl, section, data.trackName);
        }
        break;

      default:
        const colors = SECTION_COLORS[section] || SECTION_COLORS.default;
        updateGradientFromColors(colors, `section-${section}`);
        break;
    }
  }, [debouncedUpdateFromImage, updateGradientFromColors]);

  return {
    updateGradientFromImage: debouncedUpdateFromImage,
    updateGradientFromColors,
    updateGradientForSection
  };
}