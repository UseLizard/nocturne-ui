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
  const [albumArtUrl, setAlbumArtUrl] = useState(null);

  // --- State for smooth, client-side UI updates ---
  const [clientPosition, setClientPosition] = useState(0);
  const [clientVolume, setClientVolume] = useState(null); // Optimistic volume updates
  const [timestampSynced, setTimestampSynced] = useState(false); // Track if we've synced position after track change
  const clientVolumeTimerRef = useRef(null);

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
    // Optimistic update for instant UI feedback
    setClientVolume(newVolume);
    
    // Clear any existing timer
    if (clientVolumeTimerRef.current) {
      clearTimeout(clientVolumeTimerRef.current);
    }
    
    // Reset client volume after 2 seconds (allows for network delays)
    clientVolumeTimerRef.current = setTimeout(() => {
      setClientVolume(null);
    }, 2000);
    
    // Send to server (debounced)
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
      setAlbumArtUrl(null);
    } else if (data.type === 'media/timestamp_sync') {
      // Handle timestamp sync for track changes
      const { position_ms, new_timestamp_available } = data.payload;
      
      if (new_timestamp_available && !timestampSynced) {
        console.log('Syncing timestamp after track change:', position_ms);
        setClientPosition(position_ms || 0);
        setTimestampSynced(true);
        lastClientUpdateRef.current = Date.now();
        
        // Update server state position if we have it
        if (lastServerStateRef.current) {
          lastServerStateRef.current.position_ms = position_ms || 0;
        }
      }
    } else if (data.type === 'media/state_update') {
      const serverState = data.payload;
      const isTrackChange = lastServerStateRef.current?.track !== serverState.track;
      
      // Reset timestamp sync flag on track change
      if (isTrackChange) {
        setTimestampSynced(false);
      }
      
      // Clear client volume override when server confirms
      setClientVolume(null);
      if (clientVolumeTimerRef.current) {
        clearTimeout(clientVolumeTimerRef.current);
      }
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
      // Skip position sync if we're waiting for timestamp_sync after track change
      if (!isTrackChange && !isSeekingRef.current) {
        setClientPosition(serverState.position_ms || 0);
      }
      
      // Clear album art on track change to show loading state
      if (isTrackChange) {
        setAlbumArtUrl(null);
      }

      // Volume sync is handled by the clientVolume reset timer
    } else if (data.type === 'media/album_art_updated') {
      // Album art has been received and saved
      const { filename, track_id, artist, album } = data.payload;
      console.log('Album art updated:', filename, track_id);
      
      // Always use the current album art endpoint with cache busting
      setAlbumArtUrl(`http://localhost:5000/api/albumart?t=${Date.now()}`);
    } else if (data.type === 'media/album_art_cached') {
      // Album art is already cached - always set URL for track changes
      const { artist, album } = data.payload;
      console.log('Album art already cached for:', artist, album);
      
      // Always set URL to ensure album art shows up, especially after track changes
      setAlbumArtUrl(`http://localhost:5000/api/albumart?t=${Date.now()}`);
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
          // If connected and we have media info, set album art URL
          if (status.connected && status.state && (status.state.artist || status.state.album || status.state.track)) {
            setAlbumArtUrl(`http://localhost:5000/api/albumart?t=${Date.now()}`);
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
      let lastUpdateTime = 0;
      const animate = () => {
        const now = Date.now();
        // Only update position every 500ms to prevent excessive re-renders
        if (now - lastUpdateTime >= 500) {
          if (!isSeekingRef.current) {
            const elapsed = now - lastClientUpdateRef.current;
            const newPosition = (lastServerStateRef.current?.position_ms || 0) + elapsed;
            setClientPosition(Math.min(newPosition, duration));
          }
          lastUpdateTime = now;
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, duration]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (clientVolumeTimerRef.current) {
        clearTimeout(clientVolumeTimerRef.current);
      }
    };
  }, []);

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
    albumArtUrl,
    togglePlayPause, next, previous, seekTo, setVolume,
    formatTime,
    checkMediaStatus,
    initialLoadComplete,
  };
};