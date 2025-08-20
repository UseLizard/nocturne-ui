import { useState, useEffect, useCallback, useRef } from 'react';

// Direct connection to nocturned backend for live media updates
const NOCTURNED_BASE = 'http://localhost:5000';

let globalNocturnedWs = null;
let globalNocturnedListeners = [];
let nocturnedWsInitialized = false;

const setupNocturnedWebSocket = async () => {
  if (globalNocturnedWs) return;

  try {
    console.log('🎵 Connecting to nocturned WebSocket...');
    const socket = new WebSocket(`ws://localhost:5000/ws`);
    globalNocturnedWs = socket;

    socket.onopen = () => {
      console.log('🎵 Connected to nocturned WebSocket');
      globalNocturnedListeners.forEach(listener => listener.onOpen && listener.onOpen(socket));
    };

    socket.onclose = () => {
      console.log('🎵 Disconnected from nocturned WebSocket');
      globalNocturnedListeners.forEach(listener => listener.onClose && listener.onClose());
      globalNocturnedWs = null;
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('🎵 Attempting to reconnect to nocturned WebSocket...');
        if (!globalNocturnedWs && globalNocturnedListeners.length > 0) {
          setupNocturnedWebSocket();
        }
      }, 3000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🎵 Received nocturned WebSocket message:', data);
        globalNocturnedListeners.forEach(listener => listener.onMessage && listener.onMessage(data));
      } catch (err) {
        console.error('🎵 Nocturned WebSocket message error:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('🎵 Nocturned WebSocket error:', err);
      globalNocturnedListeners.forEach(listener => listener.onError && listener.onError(err));
      socket.close();
    };
  } catch (error) {
    console.error('🎵 Error setting up nocturned WebSocket:', error);
  }
};

export const useNocturnedMedia = () => {
  const [wsConnected, setWsConnected] = useState(false);
  const [mediaState, setMediaState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientPosition, setClientPosition] = useState(0);
  const listenerIdRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastServerStateRef = useRef(null);
  const lastClientUpdateRef = useRef(Date.now());

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

  // WebSocket message handler
  const handleWsMessage = useCallback((data) => {
    console.log('🎵 Processing WebSocket message:', data.type, data);
    
    switch (data.type) {
      case 'media/state_update':
        console.log('🎵 Media state update received:', data.payload);
        const newState = data.payload;
        setMediaState(newState);
        setIsConnected(true);
        setError(null);
        
        // Update position tracking
        setClientPosition(newState.position_ms || 0);
        lastServerStateRef.current = newState;
        lastClientUpdateRef.current = Date.now();
        break;
        
      case 'bluetooth/connected':
        console.log('🎵 Bluetooth connected');
        setIsConnected(true);
        setError(null);
        break;
        
      case 'bluetooth/disconnected':
        console.log('🎵 Bluetooth disconnected');
        setIsConnected(false);
        setMediaState(null);
        break;
        
      case 'media/album_art_received':
        console.log('🎵 Album art received');
        // Album art updates are handled by LiveAlbumArt component
        break;
        
      default:
        // Ignore other message types
        break;
    }
  }, []);

  // Setup WebSocket connection and listener
  useEffect(() => {
    if (!nocturnedWsInitialized) {
      setupNocturnedWebSocket();
      nocturnedWsInitialized = true;
    }

    const listenerId = `nocturned-media-${Date.now()}`;
    listenerIdRef.current = listenerId;

    const listener = {
      id: listenerId,
      onOpen: () => {
        console.log('🎵 Nocturned WebSocket connected');
        setWsConnected(true);
        setError(null);
        // Get initial state when WebSocket connects
        getInitialMediaState();
      },
      onClose: () => {
        console.log('🎵 Nocturned WebSocket disconnected');
        setWsConnected(false);
      },
      onError: (err) => {
        console.error('🎵 Nocturned WebSocket error:', err);
        setWsConnected(false);
        setError('WebSocket connection error');
      },
      onMessage: handleWsMessage
    };

    globalNocturnedListeners.push(listener);

    // Check if WebSocket is already connected
    if (globalNocturnedWs && globalNocturnedWs.readyState === WebSocket.OPEN) {
      setWsConnected(true);
      getInitialMediaState();
    } else {
      // Get initial state even if WebSocket isn't connected yet
      getInitialMediaState();
    }

    return () => {
      globalNocturnedListeners = globalNocturnedListeners.filter(
        l => l.id !== listenerId
      );
    };
  }, [handleWsMessage, getInitialMediaState]);

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