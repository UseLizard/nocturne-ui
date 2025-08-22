import React, { useRef, useCallback, useState, useEffect } from 'react';

// Live Progress Bar Component that directly listens to WebSocket for playing_time updates
const LiveProgressBar = ({
  isPlaying,
  durationMs,
  onSeek,
  onScrubbingChange,
}) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubbingProgress, setScrubbingProgress] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [livePositionMs, setLivePositionMs] = useState(0);
  const [liveDurationMs, setLiveDurationMs] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const connectWebSocket = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      console.log('📊 LIVE PROGRESS BAR: Connecting to WebSocket...');
      setConnectionStatus('connecting');
      setLastError(null);
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname === 'localhost' ? 'localhost:5000' : `${window.location.hostname}:5000`;
      wsRef.current = new WebSocket(`${wsProtocol}//${wsHost}/ws`);
      
      wsRef.current.onopen = () => {
        console.log('📊 LIVE PROGRESS BAR: WebSocket connected');
        setConnectionStatus('connected');
        setLastError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage({
            type: data.type,
            timestamp: new Date().toLocaleTimeString(),
            payload: data.payload
          });
          
          if (data.type === 'playing_time') {
            console.log('📊 LIVE PROGRESS BAR: Received playing_time WebSocket message:', data.payload.position_ms);
            setLivePositionMs(data.payload.position_ms || 0);
            setLiveDurationMs(data.payload.duration_ms || 0);
            setMessageCount(prev => prev + 1);
          }
        } catch (error) {
          console.error('📊 LIVE PROGRESS BAR: Error parsing WebSocket message:', error);
          setLastError(`Parse error: ${error.message}`);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('📊 LIVE PROGRESS BAR: WebSocket disconnected, attempting reconnect...');
        setConnectionStatus('disconnected');
        setLastError(`Connection closed: ${event.code} ${event.reason || 'No reason'}`);
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('📊 LIVE PROGRESS BAR: WebSocket error:', error);
        setConnectionStatus('error');
        setLastError(`WebSocket error: ${error.message || 'Unknown error'}`);
      };
    } catch (error) {
      console.error('📊 LIVE PROGRESS BAR: Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      setLastError(`Connection failed: ${error.message}`);
      if (mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  const handleClick = (e) => {
    if (!isDragging && progressBarRef.current) {
      // Check if this is a right-click or long press to toggle info panel
      if (e.type === 'contextmenu' || e.detail === 0) {
        e.preventDefault();
        setShowInfoPanel(prev => !prev);
        return;
      }
      
      // Direct seek on click
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      const seekMs = Math.floor((percentage / 100) * durationMs);
      onSeek(seekMs);
    } else {
      // Old wheel-based scrubbing behavior
      setIsScrubbing(true);
      onScrubbingChange?.(true);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleDrag(e);
  };

  // Handle touch events for mobile devices
  const touchStartTimeRef = useRef(null);
  
  const handleTouchStart = (e) => {
    touchStartTimeRef.current = Date.now();
  };
  
  const handleTouchEnd = (e) => {
    const touchDuration = Date.now() - (touchStartTimeRef.current || 0);
    
    // If touch duration > 500ms, consider it a long press to toggle info panel
    if (touchDuration > 500) {
      e.preventDefault();
      setShowInfoPanel(prev => !prev);
    }
  };

  const handleDrag = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setScrubbingProgress(percentage);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      handleDrag(e);
    };

    const handleMouseUp = () => {
      if (scrubbingProgress !== null) {
        const seekMs = Math.floor((scrubbingProgress / 100) * durationMs);
        onSeek(seekMs);
      }
      setIsDragging(false);
      setScrubbingProgress(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scrubbingProgress, durationMs, onSeek]);

  useEffect(() => {
    if (!isScrubbing) return;

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const delta = event.deltaX;
      const step = 1.5;

      setScrubbingProgress((prev) => {
        const currentProgress = durationMs ? (livePositionMs / durationMs) * 100 : 0;
        const nextValue = (prev ?? currentProgress) + (delta > 0 ? step : -step);
        return Math.max(0, Math.min(100, nextValue));
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isScrubbing, livePositionMs, durationMs]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && isScrubbing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        setIsScrubbing(false);
        onScrubbingChange?.(false);

        if (scrubbingProgress !== null) {
          const seekMs = Math.floor((scrubbingProgress / 100) * durationMs);
          onSeek(seekMs);
        }

        setScrubbingProgress(null);
        return false;
      } else if (event.key === "Escape" && isScrubbing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsScrubbing(false);
        onScrubbingChange?.(false);
        setScrubbingProgress(null);
        return false;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isScrubbing, scrubbingProgress, durationMs, onSeek, onScrubbingChange]);

  // Calculate real-time progress based on live position from WebSocket
  const realTimeProgress = durationMs ? (livePositionMs / durationMs) * 100 : 0;
  const finalProgress = scrubbingProgress ?? realTimeProgress;
  const shouldShowTimestampOutside = finalProgress < 8;
  
  // Force re-render when position updates
  const progressKey = `${livePositionMs}-${durationMs}`;

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-200 ease-in-out ${isScrubbing || isDragging ? "translate-y-8" : ""}`}
    >
      <div
        ref={progressBarRef}
        className={`relative w-full bg-white/20 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${isScrubbing || isDragging ? "h-8" : "h-2 mt-4"}`}
        onClick={handleClick}
        onDoubleClick={() => setShowInfoPanel(prev => !prev)}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowInfoPanel(prev => !prev);
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={progressKey}
          className="absolute left-0 top-0 h-full bg-white flex items-center justify-end transition-all duration-100"
          style={{
            width: `${finalProgress}%`,
          }}
        />
        {(isScrubbing || isDragging) && (
          <div
            className="absolute inset-0 flex items-center"
            style={{
              transform: `translateX(${finalProgress}%)`,
            }}
          >
            <span
              className={`text-lg font-[580] absolute ${shouldShowTimestampOutside
                ? "left-2 text-black/40"
                : "right-full pr-2 text-black/40"
              }`}
            >
              {formatTime(scrubbingProgress !== null ? Math.floor((scrubbingProgress / 100) * durationMs) : livePositionMs)}
            </span>
          </div>
        )}
      </div>
      
      {/* Time display */}
      {durationMs > 0 && (
        <div className="flex justify-between mt-2">
          <span className="text-white/60 text-[20px]">
            {formatTime(livePositionMs)}
          </span>
          <span className="text-white/60 text-[20px]">
            {formatTime(durationMs)}
          </span>
        </div>
      )}
      
      {/* Connection Status Info Panel */}
      {showInfoPanel && (
        <div className="mt-2 p-2 bg-black/40 rounded-lg text-xs text-white/70 font-mono animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-white/50">WebSocket:</span>
            <span className={`ml-1 ${
              connectionStatus === 'connected' ? 'text-green-400' :
              connectionStatus === 'connecting' ? 'text-yellow-400' :
              connectionStatus === 'disconnected' ? 'text-red-400' :
              'text-red-500'
            }`}>
              {connectionStatus}
            </span>
          </div>
          <div>
            <span className="text-white/50">Updates:</span>
            <span className="ml-1 text-blue-400">{messageCount}</span>
          </div>
          {lastMessage && (
            <div>
              <span className="text-white/50">Last:</span>
              <span className="ml-1 text-cyan-400">{lastMessage.timestamp}</span>
            </div>
          )}
        </div>
        
        {lastError && (
          <div className="mt-2 pt-2 border-t border-red-500/30">
            <div className="text-red-400 text-xs">
              <span className="text-red-300">Error:</span>
              <span className="ml-1">{lastError}</span>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
};

LiveProgressBar.displayName = 'LiveProgressBar';

export default LiveProgressBar;