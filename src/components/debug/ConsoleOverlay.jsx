import React, { useState, useEffect, useRef } from 'react';
import { useNocturned } from '../../hooks/useNocturned';

const ConsoleOverlay = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState([]);
  const { apiRequest } = useNocturned();
  const logContainerRef = useRef(null);
  const originalMethods = useRef({});

  useEffect(() => {
    if (!originalMethods.current.log) {
      originalMethods.current = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };

      const addLogEntry = (type, args) => {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        setLogs(prev => [...prev, { type, message, timestamp, id: Date.now() + Math.random() }]);
      };

      console.log = (...args) => {
        originalMethods.current.log(...args);
        addLogEntry('log', args);
      };

      console.error = (...args) => {
        originalMethods.current.error(...args);
        addLogEntry('error', args);
      };

      console.warn = (...args) => {
        originalMethods.current.warn(...args);
        addLogEntry('warn', args);
      };

      console.info = (...args) => {
        originalMethods.current.info(...args);
        addLogEntry('info', args);
      };
    }

    return () => {
      if (originalMethods.current.log) {
        console.log = originalMethods.current.log;
        console.error = originalMethods.current.error;
        console.warn = originalMethods.current.warn;
        console.info = originalMethods.current.info;
      }
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  const printToNocturned = async () => {
    try {
      const logText = logs.map(log => 
        `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
      ).join('\n');
      
      await apiRequest('/api/debug/console-print', 'POST', { logs: logText });
      console.log('Console logs sent to nocturned');
    } catch (error) {
      console.error('Failed to send logs to nocturned:', error);
    }
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Console Log</h2>
          <div className="flex space-x-2">
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
            >
              Clear
            </button>
            <button
              onClick={printToNocturned}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
            >
              Print to nocturned
            </button>
            <button
              onClick={onToggle}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center">No console logs yet...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="mb-2 border-b border-gray-800 pb-2">
                <div className="flex items-start space-x-2">
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {log.timestamp}
                  </span>
                  <span className={`text-xs font-semibold uppercase ${getLogTypeColor(log.type)}`}>
                    {log.type}
                  </span>
                </div>
                <pre className="text-gray-300 whitespace-pre-wrap break-words mt-1">
                  {log.message}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsoleOverlay;