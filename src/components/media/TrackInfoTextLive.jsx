import React, { useState, useEffect, useCallback, useRef } from 'react';
import ScrollingText from '../common/ScrollingText';

// Direct connection to nocturned backend for live track info
const NOCTURNED_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

let globalTrackWs = null;
let globalTrackListeners = [];
let trackWsInitialized = false;

const setupTrackWebSocket = async () => {
  if (globalTrackWs) return;

  try {
    console.log('🎵 TrackInfo: Connecting to nocturned WebSocket...');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:5000' : `${window.location.hostname}:5000`;
    const socket = new WebSocket(`${wsProtocol}//${wsHost}/ws`);
    globalTrackWs = socket;

    socket.onopen = () => {
      console.log('🎵 TrackInfo: Connected to nocturned WebSocket');
      globalTrackListeners.forEach(listener => listener.onOpen && listener.onOpen(socket));
    };

    socket.onclose = () => {
      console.log('🎵 TrackInfo: Disconnected from nocturned WebSocket');
      globalTrackListeners.forEach(listener => listener.onClose && listener.onClose());
      globalTrackWs = null;
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('🎵 TrackInfo: Attempting to reconnect to nocturned WebSocket...');
        if (!globalTrackWs && globalTrackListeners.length > 0) {
          setupTrackWebSocket();
        }
      }, 3000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        globalTrackListeners.forEach(listener => listener.onMessage && listener.onMessage(data));
      } catch (err) {
        console.error('🎵 TrackInfo: WebSocket message error:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('🎵 TrackInfo: WebSocket error:', err);
      globalTrackListeners.forEach(listener => listener.onError && listener.onError(err));
      socket.close();
    };
  } catch (error) {
    console.error('🎵 TrackInfo: Error setting up WebSocket:', error);
  }
};

const TrackInfoTextLive = ({ 
  isConnected: parentIsConnected, 
  className = "",
  onTrackChange,
  onStateChange
}) => {
  const [trackInfo, setTrackInfo] = useState({
    track: null,
    artist: null,
    album: null,
    duration: 0,
    isPlaying: false
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const listenerIdRef = useRef(null);
  const prevTrackRef = useRef(null);

  // Get initial track info from nocturned API
  const getInitialTrackInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${NOCTURNED_BASE}/api/v2/media/current`);
      
      if (!response.ok) {
        throw new Error('Failed to get track info');
      }

      const data = await response.json();
      console.log('🎵 TrackInfo: Initial track data:', data);
      
      if (data.state) {
        const newTrackInfo = {
          track: data.state.track || null,
          artist: data.state.artist || null,
          album: data.state.album || null,
          duration: data.state.duration_ms || 0,
          isPlaying: data.state.is_playing || false
        };
        
        setTrackInfo(newTrackInfo);
        
        // Check if track changed and notify parent
        if (prevTrackRef.current !== newTrackInfo.track) {
          prevTrackRef.current = newTrackInfo.track;
          onTrackChange?.(newTrackInfo);
        }
      }
      setError(null);
    } catch (err) {
      console.error('🎵 TrackInfo: Error getting initial track info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onTrackChange]);

  // WebSocket message handler
  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'media/state_update':
        console.log('🎵 TrackInfo: Media state update received:', data.payload);
        const newState = data.payload;
        
        onStateChange?.(newState);
        
        const newTrackInfo = {
          track: newState.track || null,
          artist: newState.artist || null,
          album: newState.album || null,
          duration: newState.duration_ms || 0,
          isPlaying: newState.is_playing || false
        };
        
        setTrackInfo(newTrackInfo);
        setError(null);
        
        // Check if track changed and notify parent
        if (prevTrackRef.current !== newTrackInfo.track) {
          console.log('🎵 TrackInfo: Track changed from', prevTrackRef.current, 'to', newTrackInfo.track);
          prevTrackRef.current = newTrackInfo.track;
          onTrackChange?.(newTrackInfo);
        }
        break;
        
      case 'bluetooth/connected':
        console.log('🎵 TrackInfo: Bluetooth connected');
        setError(null);
        // Refresh track info when Bluetooth connects
        getInitialTrackInfo();
        break;
        
      case 'bluetooth/disconnected':
        console.log('🎵 TrackInfo: Bluetooth disconnected');
        setTrackInfo({
          track: null,
          artist: null,
          album: null,
          duration: 0,
          isPlaying: false
        });
        break;
        
      default:
        // Ignore other message types
        break;
    }
  }, [onTrackChange, onStateChange, getInitialTrackInfo]);

  // Setup WebSocket connection and listener
  useEffect(() => {
    if (!trackWsInitialized) {
      setupTrackWebSocket();
      trackWsInitialized = true;
    }

    const listenerId = `track-info-${Date.now()}`;
    listenerIdRef.current = listenerId;

    const listener = {
      id: listenerId,
      onOpen: () => {
        console.log('🎵 TrackInfo: WebSocket connected');
        setWsConnected(true);
        setError(null);
        // Get initial state when WebSocket connects
        getInitialTrackInfo();
      },
      onClose: () => {
        console.log('🎵 TrackInfo: WebSocket disconnected');
        setWsConnected(false);
      },
      onError: (err) => {
        console.error('🎵 TrackInfo: WebSocket error:', err);
        setWsConnected(false);
        setError('WebSocket connection error');
      },
      onMessage: handleWsMessage
    };

    globalTrackListeners.push(listener);

    // Check if WebSocket is already connected
    if (globalTrackWs && globalTrackWs.readyState === WebSocket.OPEN) {
      setWsConnected(true);
      getInitialTrackInfo();
    } else {
      // Get initial state even if WebSocket isn't connected yet
      getInitialTrackInfo();
    }

    return () => {
      globalTrackListeners = globalTrackListeners.filter(
        l => l.id !== listenerId
      );
    };
  }, [handleWsMessage, getInitialTrackInfo]);

  // Determine media mode based on track duration (>15 minutes = podcast mode)
  const PODCAST_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
  const mediaMode = trackInfo.duration && trackInfo.duration > PODCAST_THRESHOLD ? 'podcast' : 'song';

  // Format time for display
  const formatTime = useCallback((ms) => {
    if (!ms || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={`text-center md:text-left ${className}`}>
      <div className="max-w-[400px]">
        <ScrollingText
          text={trackInfo.track || (parentIsConnected ? "No media playing" : "No device connected")}
          className="text-4xl font-semibold text-white tracking-tight"
          maxWidth="400px"
          pauseDuration={1000}
          pixelsPerSecond={40}
        />
      </div>
      
      {/* Debug info - can be removed in production */}
      {false && (
        <div className="text-xs text-white/40 mt-2">
          <div>Mode: {mediaMode}</div>
          <div>Track: {trackInfo.track || 'null'}</div>
          <div>Artist: {trackInfo.artist || 'null'}</div>
          <div>Album: {trackInfo.album || 'null'}</div>
          <div>Duration: {trackInfo.duration}ms</div>
          <div>WS: {wsConnected ? 'connected' : 'disconnected'}</div>
        </div>
      )}
      
      {/* Song mode - show album and artist */}
      {mediaMode === 'song' && trackInfo.track && (
        <>
          <h4 className="text-[36px] font-[560] text-white/60 tracking-tight max-w-[380px] truncate">
            {trackInfo.album || 'Unknown Album'}
          </h4>
          <h4 className="text-[28px] font-[500] text-white/50 mt-1 tracking-tight max-w-[380px] truncate">
            {trackInfo.artist || 'Unknown Artist'}
          </h4>
        </>
      )}
      
      {/* Podcast mode or no track - show artist/message only */}
      {(mediaMode === 'podcast' || !trackInfo.track) && (
        <h4 className="text-[28px] font-[500] text-white/50 mt-1 tracking-tight max-w-[380px] truncate">
          {trackInfo.artist || (parentIsConnected ? "Start playing music on your Android device" : "Pair your Android device")}
        </h4>
      )}
      
      {/* Mode indicator */}
      {parentIsConnected && trackInfo.track && (
        <div className="mt-2">
          <span className="text-[20px] font-[500] text-white/40 capitalize">
            {mediaMode} mode • {formatTime(trackInfo.duration)}
          </span>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="text-red-400 text-sm mt-2">
          Error: {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="text-white/60 text-sm mt-2">
          Loading track info...
        </div>
      )}
    </div>
  );
};

export default TrackInfoTextLive;