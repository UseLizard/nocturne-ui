import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

// Direct connection to nocturned backend for live media updates
// Use current host to work both in development and on Car Thing
const NOCTURNED_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

// Legacy function - now handled by WebSocketService
// Removed duplicate WebSocket connection setup

export const useNocturnedMedia = () => {
  const [mediaState, setMediaState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientPosition, setClientPosition] = useState(0);
  const animationFrameRef = useRef(null);
  const lastServerStateRef = useRef(null);
  const lastClientUpdateRef = useRef(Date.now());

  // WebSocket message handlers for media updates
  const mediaMessageHandlers = {
    'media/state_update': (data) => {
      console.log('🎵 Full media state update received:', data.payload);
      const newState = data.payload;
      
      // This is a full state update - update everything
      setMediaState(newState);
      setIsConnected(true);
      setError(null);
      
      // Update position tracking
      setClientPosition(newState.position_ms || 0);
      lastServerStateRef.current = newState;
      lastClientUpdateRef.current = Date.now();
    },
    'media/position_update': (data) => {
      console.log('🎵 Live position update received:', data.payload);
      const newState = data.payload;
      
      // This is a live position update - only update position
      if (mediaState) {
        setMediaState(prev => ({
          ...prev,
          position_ms: newState.position_ms
        }));
      }
      setClientPosition(newState.position_ms || 0);
    },
    'playing_time': (data) => {
      console.log('🎵 Playing time update received:', data.payload.position_ms);
      const positionMs = data.payload.position_ms;
      
      // Update position in media state and client position
      if (mediaState) {
        setMediaState(prev => ({
          ...prev,
          position_ms: positionMs
        }));
      }
      setClientPosition(positionMs || 0);
    },
    'bluetooth/connected': () => {
      console.log('🎵 Bluetooth connected');
      setIsConnected(true);
      setError(null);
    },
    'bluetooth/disconnected': () => {
      console.log('🎵 Bluetooth disconnected');
      setIsConnected(false);
      setMediaState(null);
    },
    'media/album_art_received': () => {
      console.log('🎵 Album art received');
      // Album art updates are handled by LiveAlbumArt component
    },
    // Weather updates (for useWeatherData hook)
    'weather_update': (data) => {
      console.log('🌤️ Weather update received');
      // Weather updates will be handled by components that need them
    },
    // Album art updates (for ThemeContext)
    'album_art_update': (data) => {
      console.log('🎨 Album art update received');
      // Album art updates for theming
    },
    'new_album_art_set': (data) => {
      console.log('🎨 New album art set received');
      // New album art set for gradient colors
    },
    'gradient_colors': (data) => {
      console.log('🌈 Gradient colors received');
      // Gradient color updates
    },
  };

  // Use centralized WebSocket service
  const { isConnected: wsConnected } = useWebSocket('NOCTURNED', mediaMessageHandlers);

  // Media command functions using v1 compatibility endpoints
  const sendMediaCommand = useCallback(async (command, params = {}) => {
    try {
      let endpoint = `/media/${command}`;
      if (command === 'seek' && params.positionMs !== undefined) {
        endpoint = `/media/seek/${Math.floor(params.positionMs / 1000)}`; // Convert to seconds
      } else if (command === 'volume' && params.volumePercent !== undefined) {
        endpoint = `/media/volume/${params.volumePercent}`;
      }

      const response = await fetch(`${NOCTURNED_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Command ${command} failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`🎵 Command ${command} sent successfully:`, result);
      return result;
    } catch (err) {
      console.error(`🎵 Error sending ${command} command:`, err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Media control functions
  const togglePlayPause = useCallback(() => {
    const command = mediaState?.is_playing ? 'pause' : 'play';
    return sendMediaCommand(command);
  }, [sendMediaCommand, mediaState?.is_playing]);

  const next = useCallback(() => sendMediaCommand('next'), [sendMediaCommand]);
  const previous = useCallback(() => sendMediaCommand('previous'), [sendMediaCommand]);
  const seekTo = useCallback((positionMs) => {
    // Optimistically update position for immediate UI feedback
    setClientPosition(positionMs);
    lastClientUpdateRef.current = Date.now();
    if (lastServerStateRef.current) {
      lastServerStateRef.current.position_ms = positionMs;
    }
    return sendMediaCommand('seek', { positionMs });
  }, [sendMediaCommand]);
  const setVolume = useCallback((volumePercent) => sendMediaCommand('volume', { volumePercent }), [sendMediaCommand]);

  // Get initial media state
  const getInitialMediaState = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${NOCTURNED_BASE}/api/v2/media/current`);
      
      if (!response.ok) {
        throw new Error('Failed to get media state');
      }

      const data = await response.json();
      console.log('🎵 Initial media state:', data);
      
      setIsConnected(data.connected || false);
      if (data.state) {
        setMediaState(data.state);
        setClientPosition(data.state.position_ms || 0);
        lastServerStateRef.current = data.state;
        lastClientUpdateRef.current = Date.now();
      }
      setError(null);
    } catch (err) {
      console.error('🎵 Error getting initial media state:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);


  // Get initial state when WebSocket connects
  useEffect(() => {
    if (wsConnected) {
      console.log('🎵 Nocturned WebSocket connected');
      setError(null);
      getInitialMediaState();
    } else {
      console.log('🎵 Nocturned WebSocket disconnected');
    }
  }, [wsConnected, getInitialMediaState]);

  // Get initial state on component mount
  useEffect(() => {
    getInitialMediaState();
  }, [getInitialMediaState]);

  const formatTime = useCallback((ms) => {
    if (!ms || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Manual refresh function
  const refreshMediaState = useCallback(() => {
    getInitialMediaState();
  }, [getInitialMediaState]);

  return {
    // Connection status
    isConnected,
    wsConnected,
    loading,
    error,
    
    // Media state
    currentTrack: mediaState?.track || null,
    currentArtist: mediaState?.artist || null,
    currentAlbum: mediaState?.album || null,
    isPlaying: mediaState?.is_playing || false,
    duration: mediaState?.duration_ms || 0,
    position: mediaState?.position_ms || 0,
    volume: mediaState?.volume_percent || 50,
    
    
    // Control functions
    togglePlayPause,
    next,
    previous,
    seekTo,
    setVolume,
    
    // Utility functions
    formatTime,
    refreshMediaState,
    
    // For compatibility
    initialLoadComplete: !loading,
    checkMediaStatus: refreshMediaState,
  };
};