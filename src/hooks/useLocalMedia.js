import { useState, useEffect, useCallback, useRef } from 'react';
import { useNocturned } from './useNocturned';

export const useLocalMedia = () => {
  const { wsConnected, apiRequest, addMessageListener, removeMessageListener } = useNocturned();
  
  const [isConnected, setIsConnected] = useState(false);
  const [mediaState, setMediaState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listenerIdRef = useRef(null);

  // Check media connection status
  const checkMediaStatus = useCallback(async () => {
    try {
      const status = await apiRequest('/media/status');
      setIsConnected(status.connected);
      if (status.state) {
        setMediaState(status.state);
      }
      return status;
    } catch (err) {
      console.error('Error checking media status:', err);
      setError(err.message);
      return null;
    }
  }, [apiRequest]);

  // Send media commands
  const sendCommand = useCallback(async (command, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = `/media/${command}`;
      
      // Handle parameterized commands
      if (command === 'seek' && params.positionMs !== undefined) {
        endpoint = `/media/seek/${params.positionMs}`;
      } else if (command === 'volume' && params.volumePercent !== undefined) {
        endpoint = `/media/volume/${params.volumePercent}`;
      }
      
      const response = await apiRequest(endpoint, 'POST');
      return response;
    } catch (err) {
      console.error(`Error sending ${command} command:`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Media control functions
  const play = useCallback(() => sendCommand('play'), [sendCommand]);
  const pause = useCallback(() => sendCommand('pause'), [sendCommand]);
  const next = useCallback(() => sendCommand('next'), [sendCommand]);
  const previous = useCallback(() => sendCommand('previous'), [sendCommand]);
  const seekTo = useCallback((positionMs) => 
    sendCommand('seek', { positionMs }), [sendCommand]);
  const setVolume = useCallback(async (volumePercent) => {
    // Immediately update local state to prevent stale values
    setMediaState(prev => prev ? { ...prev, volume_percent: volumePercent } : null);
    
    return await sendCommand('volume', { volumePercent });
  }, [sendCommand]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (mediaState?.is_playing) {
      return pause();
    } else {
      return play();
    }
  }, [mediaState?.is_playing, play, pause]);

  // Simulate media state for testing
  const simulateState = useCallback(async (artist, track, isPlaying) => {
    try {
      await apiRequest('/media/simulate', 'POST', {
        artist,
        track,
        is_playing: isPlaying
      });
    } catch (err) {
      console.error('Error simulating media state:', err);
      setError(err.message);
    }
  }, [apiRequest]);

  // Handle WebSocket messages
  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'media/connected':
        setIsConnected(true);
        setError(null);
        checkMediaStatus();
        break;
        
      case 'media/disconnected':
        setIsConnected(false);
        setMediaState(null);
        break;
        
      case 'media/state_update':
        setMediaState(data.payload);
        setIsConnected(true);
        setError(null);
        break;
        
      case 'media/command_sent':
        // Command acknowledged, could show visual feedback
        setError(null);
        break;
        
      default:
        break;
    }
  }, [checkMediaStatus]);

  // Initialize WebSocket listener and check initial status
  useEffect(() => {
    const listenerId = addMessageListener('local-media', handleWsMessage);
    listenerIdRef.current = listenerId;

    // Check initial status
    checkMediaStatus();

    return () => {
      if (listenerIdRef.current) {
        removeMessageListener(listenerIdRef.current);
      }
    };
  }, [addMessageListener, removeMessageListener, handleWsMessage, checkMediaStatus]);

  // Format duration and position
  const formatTime = useCallback((milliseconds) => {
    if (!milliseconds || milliseconds < 0) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const getProgress = useCallback(() => {
    if (!mediaState?.duration_ms || !mediaState?.position_ms) return 0;
    return Math.min(100, (mediaState.position_ms / mediaState.duration_ms) * 100);
  }, [mediaState?.duration_ms, mediaState?.position_ms]);

  return {
    // Connection state
    isConnected,
    wsConnected,
    loading,
    error,
    
    // Media state
    mediaState,
    currentTrack: mediaState?.track,
    currentArtist: mediaState?.artist,
    currentAlbum: mediaState?.album,
    isPlaying: mediaState?.is_playing || false,
    duration: mediaState?.duration_ms,
    position: mediaState?.position_ms,
    volume: mediaState?.volume_percent ?? 50,
    
    // Control functions
    play,
    pause,
    next,
    previous,
    seekTo,
    setVolume,
    togglePlayPause,
    
    // Utility functions
    formatTime,
    getProgress,
    checkMediaStatus,
    simulateState,
    
    // Raw command interface
    sendCommand
  };
};