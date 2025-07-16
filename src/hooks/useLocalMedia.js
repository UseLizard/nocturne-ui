import { useState, useEffect, useCallback, useRef } from 'react';
import { useNocturned } from './useNocturned';

/*
 * CRITICAL: Volume Control Position Sync Issue Prevention
 * 
 * Problem: When scrolling to change volume, the progress bar and time display would jump 
 * back/forward to the position from when volume was last changed, causing jarring UX.
 * 
 * Root Cause: WebSocket messages from server include volume updates that were incorrectly 
 * treated as full media state updates, causing lastClientUpdateRef.current to reset and 
 * breaking the smooth position animation calculation.
 * 
 * Solution Logic:
 * 1. SEPARATE volume changes from position changes - they are independent operations
 * 2. DETECT volume-only updates by comparing position_ms, is_playing, and track fields
 * 3. SKIP timestamp updates (lastClientUpdateRef) for volume-only server responses
 * 4. MAINTAIN smooth position animation by only updating timestamp for actual media changes
 * 5. KEEP volume sync independent via clientVolume state and reset timer
 * 
 * Why This Works:
 * - Position animation depends on elapsed time since last known server position
 * - Volume changes shouldn't affect position calculation timing
 * - Server sends separate updates for volume vs media state, we must handle them differently
 * - Client-side volume state overrides server volume temporarily for smooth UX
 */

// Debounce utility to prevent spamming the server with requests
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

export const useLocalMedia = () => {
  const { wsConnected, apiRequest, addMessageListener, removeMessageListener } = useNocturned();

  const [isConnected, setIsConnected] = useState(false);
  const [mediaState, setMediaState] = useState(null);
  const [loading, setLoading] = useState(true); // Start as loading
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // --- State for smooth, client-side UI updates ---
  const [clientPosition, setClientPosition] = useState(0);
  const [clientVolume, setClientVolume] = useState(null); // Use null to indicate no override

  const animationFrameRef = useRef(null);
  const lastServerStateRef = useRef(null);
  const lastClientUpdateRef = useRef(Date.now());
  const isSeekingRef = useRef(false);

  const isPlaying = mediaState?.is_playing || false;
  const duration = mediaState?.duration_ms || 0;
  const volume = clientVolume ?? mediaState?.volume_percent ?? 50;

  // --- Server Communication ---
  const sendCommand = useCallback(async (command, params = {}) => {
    // Don't show loading indicator for commands - it causes the dots to appear
    try {
      let endpoint = `/media/${command}`;
      if (command === 'seek' && params.positionMs !== undefined) {
        endpoint = `/media/seek/${params.positionMs}`;
      } else if (command === 'volume' && params.volumePercent !== undefined) {
        endpoint = `/media/volume/${params.volumePercent}`;
      }
      await apiRequest(endpoint, 'POST');
    } catch (err) {
      console.error(`Error sending ${command} command:`, err);
      setError(err.message);
    }
  }, [apiRequest]);

  const debouncedVolumeCommand = useCallback(debounce((vol) => sendCommand('volume', { volumePercent: vol }), 250), [sendCommand]);

  // --- UI Actions ---
  const togglePlayPause = useCallback(() => sendCommand(isPlaying ? 'pause' : 'play'), [sendCommand, isPlaying]);
  const next = useCallback(() => sendCommand('next'), [sendCommand]);
  const previous = useCallback(() => sendCommand('previous'), [sendCommand]);

  const seekTo = useCallback((positionMs) => {
    isSeekingRef.current = true;
    setClientPosition(positionMs);
    lastClientUpdateRef.current = Date.now();
    lastServerStateRef.current = { ...lastServerStateRef.current, position_ms: positionMs };
    sendCommand('seek', { positionMs });
    setTimeout(() => { isSeekingRef.current = false; }, 500); // Reset seeking flag after a delay
  }, [sendCommand]);

  const setVolume = useCallback((newVolume) => {
    setClientVolume(newVolume);
    debouncedVolumeCommand(newVolume);
    // Don't update lastClientUpdateRef when changing volume to avoid position jumps
  }, [debouncedVolumeCommand]);

  // --- WebSocket Message Handler ---
  const handleWsMessage = useCallback((data) => {
    if (data.type === 'media/connected') {
      setIsConnected(true);
    } else if (data.type === 'media/disconnected') {
      setIsConnected(false);
      setMediaState(null);
    } else if (data.type === 'media/state_update') {
      const serverState = data.payload;
      const isTrackChange = lastServerStateRef.current?.track !== serverState.track;
      const isVolumeOnlyUpdate = lastServerStateRef.current && 
        lastServerStateRef.current.position_ms === serverState.position_ms &&
        lastServerStateRef.current.is_playing === serverState.is_playing &&
        lastServerStateRef.current.track === serverState.track;

      lastServerStateRef.current = serverState;
      
      // Only update the client timestamp if this isn't a volume-only update
      if (!isVolumeOnlyUpdate) {
        lastClientUpdateRef.current = Date.now();
      }
      
      setMediaState(serverState);

      // If the track changed or we aren't seeking, sync the position.
      if (isTrackChange || !isSeekingRef.current) {
        setClientPosition(serverState.position_ms || 0);
      }

      // Volume sync is handled by the clientVolume reset timer
    }
  }, []);

  // --- Effects for Initialization and Animation ---
  useEffect(() => {
    const listenerId = addMessageListener('local-media', handleWsMessage);
    // Initial status check
    apiRequest('/media/status')
      .then(status => {
        if (status) {
          setIsConnected(status.connected);
          if (status.state) {
            setMediaState(status.state);
            setClientPosition(status.state.position_ms || 0);
            lastServerStateRef.current = status.state;
            lastClientUpdateRef.current = Date.now();
          }
        }
        setInitialLoadComplete(true);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to get initial media status:', err);
        setError('Failed to connect to media service');
        setInitialLoadComplete(true);
        setLoading(false);
      });
    
    return () => removeMessageListener(listenerId);
  }, [apiRequest, addMessageListener, removeMessageListener, handleWsMessage]);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        if (!isSeekingRef.current) {
          const elapsed = Date.now() - lastClientUpdateRef.current;
          const newPosition = (lastServerStateRef.current?.position_ms || 0) + elapsed;
          setClientPosition(Math.min(newPosition, duration));
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, duration]);

  // Reset local volume override after a period of inactivity
  useEffect(() => {
    if (clientVolume !== null) {
      const timer = setTimeout(() => setClientVolume(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [clientVolume]);

  const formatTime = useCallback((ms) => {
    if (!ms || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Manual status check function
  const checkMediaStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await apiRequest('/media/status');
      if (status) {
        setIsConnected(status.connected);
        if (status.state) {
          setMediaState(status.state);
          setClientPosition(status.state.position_ms || 0);
          lastServerStateRef.current = status.state;
          lastClientUpdateRef.current = Date.now();
        }
      }
      setError(null);
    } catch (err) {
      console.error('Failed to check media status:', err);
      setError('Failed to connect to media service');
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  return {
    isConnected, wsConnected, loading, error,
    currentTrack: mediaState?.track,
    currentArtist: mediaState?.artist,
    currentAlbum: mediaState?.album,
    isPlaying, duration,
    position: clientPosition,
    volume,
    togglePlayPause, next, previous, seekTo, setVolume,
    formatTime,
    checkMediaStatus,
    initialLoadComplete,
  };
};