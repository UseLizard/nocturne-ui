import React, { useState, useEffect, useRef } from 'react';
import { useNocturned } from '../../hooks/useNocturned';
import { SettingsIcon, TrashIcon, PauseIcon, PlayIcon } from '../common/icons';

const BLEConnectionLog = ({ className = "" }) => {
  const { wsConnected } = useNocturned();
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef(null);

  // Format timestamp for log entries
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Add log entry
  const addLogEntry = (type, message, data = null) => {
    if (isPaused) return;

    const entry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      type,
      message,
      data
    };

    setLogs(prev => {
      const newLogs = [entry, ...prev];
      // Keep only last 200 entries
      return newLogs.slice(0, 200);
    });
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current && logs.length > 0) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // Handle WebSocket events for BLE logging
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'media/ble_scan_start':
            addLogEntry('discovery', `🔍 Starting BLE scan for NocturneCompanion devices`);
            break;
            
          case 'media/ble_device_found':
            addLogEntry('discovery', `📱 Found BLE device: ${data.payload?.name || 'Unknown'} (${data.payload?.address})`, data.payload);
            break;
            
          case 'media/ble_service_discovered':
            addLogEntry('discovery', `🔧 Discovered Nocturne GATT service at ${data.payload?.path}`, data.payload);
            break;
            
          case 'media/ble_characteristic_found':
            addLogEntry('discovery', `📊 Found characteristic: ${data.payload?.uuid} - ${data.payload?.type}`, data.payload);
            break;
            
          case 'media/ble_mtu_changed':
            addLogEntry('info', `📏 MTU negotiated: ${data.payload?.mtu} bytes`, data.payload);
            break;
            
          case 'media/ble_connected':
            addLogEntry('success', `✅ BLE connection established to ${data.payload?.address}`, data.payload);
            break;
            
          case 'media/ble_disconnected':
            addLogEntry('error', `❌ BLE connection lost to ${data.payload?.address}: ${data.payload?.reason || 'unknown'}`, data.payload);
            break;
            
          case 'media/ble_data_sent':
            addLogEntry('data', `📤 BLE sent: ${data.payload?.command} (${data.payload?.data?.length || 0} bytes)`, data.payload);
            break;
            
          case 'media/ble_data_received':
            addLogEntry('data', `📥 BLE received: ${data.payload?.data?.substring(0, 100)}${data.payload?.data?.length > 100 ? '...' : ''}`, data.payload);
            break;
            
          case 'media/ble_notification_received':
            addLogEntry('data', `🔔 BLE notification: ${data.payload?.char_type} - ${data.payload?.data?.substring(0, 100)}${data.payload?.data?.length > 100 ? '...' : ''}`, data.payload);
            break;
            
          case 'media/ble_write_error':
            addLogEntry('error', `⚠️ BLE write failed: ${data.payload?.error}`, data.payload);
            break;
            
          case 'media/ble_reconnect_attempt':
            addLogEntry('info', `🔄 BLE reconnection attempt ${data.payload?.attempt}/${data.payload?.max_attempts}`, data.payload);
            break;
            
          case 'media/ble_album_art_start':
            addLogEntry('data', `🖼️ Starting album art transfer: ${data.payload?.hash} (${data.payload?.size} bytes, ${data.payload?.chunks} chunks)`, data.payload);
            break;
            
          case 'media/ble_album_art_chunk':
            addLogEntry('data', `📦 Album art chunk ${data.payload?.chunk + 1}/${data.payload?.total} received`, data.payload);
            break;
            
          case 'media/ble_album_art_complete':
            addLogEntry('success', `✅ Album art transfer complete: ${data.payload?.hash} in ${data.payload?.duration}ms`, data.payload);
            break;

          case 'media/state_update':
            // Only log if it came via BLE (check for protocol in payload)
            if (data.payload?.protocol === 'ble') {
              if (data.payload?.artist && data.payload?.track) {
                addLogEntry('state', `🎵 BLE Media: ${data.payload.artist} - ${data.payload.track} (${data.payload.is_playing ? 'Playing' : 'Paused'})`, data.payload);
              }
            }
            break;
            
          default:
            // Ignore other message types
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message for BLE log:', err);
      }
    };

    // Add WebSocket listener if connected
    if (wsConnected && window.ws) {
      window.ws.addEventListener('message', handleWebSocketMessage);
      
      // Add initial log entry
      addLogEntry('info', '🌐 BLE log started - listening for Bluetooth Low Energy events');
      
      return () => {
        if (window.ws) {
          window.ws.removeEventListener('message', handleWebSocketMessage);
        }
      };
    }
  }, [wsConnected, isPaused]);

  // Get log entry styling based on type
  const getLogEntryStyle = (type) => {
    const baseStyle = "text-[24px] font-[500] tracking-tight";
    
    switch (type) {
      case 'discovery':
        return `${baseStyle} text-blue-300`;
      case 'success':
        return `${baseStyle} text-green-300`;
      case 'error':
        return `${baseStyle} text-red-300`;
      case 'data':
        return `${baseStyle} text-purple-300`;
      case 'state':
        return `${baseStyle} text-yellow-300`;
      case 'info':
      default:
        return `${baseStyle} text-white/70`;
    }
  };

  return (
    <div className={`bg-black/50 rounded-xl border border-white/20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-6 h-6 text-blue-400" />
          <h4 className="text-[30px] font-[580] text-white tracking-tight">
            BLE Connection Log
          </h4>
          {!wsConnected && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-[20px] font-[560] rounded-lg">
              Disconnected
            </span>
          )}
          {isPaused && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[20px] font-[560] rounded-lg">
              Paused
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePause}
            className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
            title={isPaused ? "Resume logging" : "Pause logging"}
          >
            {isPaused ? (
              <PlayIcon className="w-5 h-5" />
            ) : (
              <PauseIcon className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={clearLogs}
            className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 transition-colors"
            title="Clear logs"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={logContainerRef}
        className="h-64 overflow-y-auto p-4 space-y-2"
        style={{ fontFamily: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace' }}
      >
        {logs.length === 0 ? (
          <div className="text-center text-white/40 text-[26px] font-[560] tracking-tight py-8">
            {!wsConnected ? 'WebSocket disconnected - no BLE events available' : 'No BLE connection events yet'}
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-start space-x-3">
              <span className="text-white/40 text-[20px] font-[500] tracking-tight shrink-0 w-20">
                {formatTimestamp(log.timestamp)}
              </span>
              <div className="flex-1 min-w-0">
                <div className={getLogEntryStyle(log.type)}>
                  {log.message}
                </div>
                {log.data && (
                  <div className="text-white/30 text-[20px] font-[500] tracking-tight mt-1 pl-4 border-l border-white/10">
                    {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10">
        <div className="flex items-center justify-between text-white/40 text-[20px] font-[500] tracking-tight">
          <span>{logs.length} entries</span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Auto-scroll</span>
            </label>
            <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
              {wsConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BLEConnectionLog;