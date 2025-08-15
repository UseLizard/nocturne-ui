import React, { useState, useEffect, useRef } from 'react';

const FpsMonitor = ({ enabled = false, position = 'top-left' }) => {
  const [fps, setFps] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const [minFps, setMinFps] = useState(60);
  const [maxFps, setMaxFps] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState([]);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef([]);
  const animationFrameRef = useRef();
  const originalConsoleRef = useRef();

  // Console log interceptor
  useEffect(() => {
    if (!enabled) return;

    // Store original console methods
    originalConsoleRef.current = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };

    const addLogEntry = (level, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setConsoleLogs(prev => {
        const newLogs = [...prev, { timestamp, level, message }];
        // Keep only last 10 logs
        return newLogs.slice(-10);
      });
    };

    // Override console methods
    console.log = (...args) => {
      originalConsoleRef.current.log(...args);
      addLogEntry('log', args);
    };

    console.warn = (...args) => {
      originalConsoleRef.current.warn(...args);
      addLogEntry('warn', args);
    };

    console.error = (...args) => {
      originalConsoleRef.current.error(...args);
      addLogEntry('error', args);
    };

    return () => {
      // Restore original console methods
      if (originalConsoleRef.current) {
        console.log = originalConsoleRef.current.log;
        console.warn = originalConsoleRef.current.warn;
        console.error = originalConsoleRef.current.error;
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) { // Update every second
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        
        // Update FPS history for averaging
        fpsHistoryRef.current.push(currentFps);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }

        // Calculate average
        const average = Math.round(
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        );

        setFps(currentFps);
        setAvgFps(average);
        setMinFps(prev => Math.min(prev, currentFps));
        setMaxFps(prev => Math.max(prev, currentFps));

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(updateFps);
    };

    animationFrameRef.current = requestAnimationFrame(updateFps);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled]);

  // Reset stats when enabled changes
  useEffect(() => {
    if (enabled) {
      setFps(0);
      setAvgFps(0);
      setMinFps(60);
      setMaxFps(0);
      frameCountRef.current = 0;
      lastTimeRef.current = performance.now();
      fpsHistoryRef.current = [];
    }
  }, [enabled]);

  if (!enabled) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getFpsColor = (fpsValue) => {
    if (fpsValue >= 50) return 'text-green-400';
    if (fpsValue >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      default: return 'text-white/80';
    }
  };

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-50 pointer-events-none`}
      style={{ fontFamily: 'monospace' }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1 min-w-[120px] max-w-[250px]">
        <div className="text-white/60 text-center border-b border-white/20 pb-1 mb-1">
          FPS Monitor
        </div>
        
        <div className="flex justify-between">
          <span className="text-white/60">Current:</span>
          <span className={`font-bold ${getFpsColor(fps)}`}>{fps}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-white/60">Average:</span>
          <span className={`${getFpsColor(avgFps)}`}>{avgFps}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-white/60">Min:</span>
          <span className={`${getFpsColor(minFps)}`}>{minFps}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-white/60">Max:</span>
          <span className={`${getFpsColor(maxFps)}`}>{maxFps}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Status:</span>
          <span className={`text-xs ${getFpsColor(fps)}`}>
            {fps >= 50 ? 'SMOOTH' : fps >= 30 ? 'OK' : 'POOR'}
          </span>
        </div>

        {/* Console Logs - Only show last 3 logs, very compact */}
        {consoleLogs.length > 0 && (
          <div className="pt-1 mt-1 border-t border-white/20">
            <div className="text-white/60 text-xs mb-1">Console ({consoleLogs.length})</div>
            <div className="max-h-16 overflow-y-auto space-y-0.5">
              {consoleLogs.slice(-3).map((log, index) => (
                <div key={index} className="text-xs">
                  <div className={`${getLogLevelColor(log.level)} truncate`}>
                    {log.level}: {log.message.slice(0, 30)}{log.message.length > 30 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FpsMonitor;