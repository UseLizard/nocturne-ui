import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckIcon, 
  XIcon, 
  RefreshIcon, 
  ClockIcon,
  FilterIcon,
  TrashIcon 
} from '../common/icons';

const ProfileLogs = ({ logs, deviceAddress, wsConnected, className = "" }) => {
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all', // all, success, error, connecting
    action: 'all', // all, connect, disconnect, config_update, detection
    profile: 'all' // all, specific profile names
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  // Filter logs based on current filters
  useEffect(() => {
    let filtered = logs || [];

    // Filter by device address if specified
    if (deviceAddress) {
      filtered = filtered.filter(log => log.device_address === deviceAddress);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status);
    }

    // Filter by action
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Filter by profile
    if (filters.profile !== 'all') {
      filtered = filtered.filter(log => 
        log.profile_name.toLowerCase().includes(filters.profile.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    setFilteredLogs(filtered);
  }, [logs, filters, deviceAddress]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'connected':
        return <CheckIcon className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XIcon className="w-4 h-4 text-red-400" />;
      case 'connecting':
        return <RefreshIcon className="w-4 h-4 text-yellow-400 animate-spin" />;
      default:
        return <ClockIcon className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'connected':
        return 'text-green-400 bg-green-500/10';
      case 'error':
        return 'text-red-400 bg-red-500/10';
      case 'connecting':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-blue-400 bg-blue-500/10';
    }
  };

  const getUniqueValues = (key) => {
    const values = new Set((logs || []).map(log => log[key]).filter(Boolean));
    return Array.from(values).sort();
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      action: 'all',
      profile: 'all'
    });
  };

  return (
    <div className={`${className}`}>
      {/* Logs Header & Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-[30px] font-[580] text-white tracking-tight">
            Activity Logs ({filteredLogs.length})
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[26px] font-[580] tracking-tight ${
            wsConnected 
              ? 'text-green-400 bg-green-500/20 border border-green-500/30' 
              : 'text-red-400 bg-red-500/20 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'} ${wsConnected ? 'animate-pulse' : ''}`}></div>
            <span>{wsConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-4 py-2 rounded-xl text-[26px] font-[580] tracking-tight border transition-colors ${
              autoScroll 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
            }`}
          >
            Auto-scroll
          </button>
          
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-white/10 text-white/60 rounded-xl hover:bg-white/20 transition-colors text-[26px] font-[580] tracking-tight border border-white/20"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-[28px] font-[560] text-white/80 tracking-tight mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-[26px] font-[560] tracking-tight focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="connecting">Connecting</option>
            <option value="connected">Connected</option>
          </select>
        </div>

        <div>
          <label className="block text-[28px] font-[560] text-white/80 tracking-tight mb-2">Action</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-[26px] font-[560] tracking-tight focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Actions</option>
            {getUniqueValues('action').map(action => (
              <option key={action} value={action} className="capitalize">
                {action.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[28px] font-[560] text-white/80 tracking-tight mb-2">Profile</label>
          <select
            value={filters.profile}
            onChange={(e) => setFilters(prev => ({ ...prev, profile: e.target.value }))}
            className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-[26px] font-[560] tracking-tight focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Profiles</option>
            {getUniqueValues('profile_name').map(profile => (
              <option key={profile} value={profile}>
                {profile}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-black/30 rounded-xl border border-white/10 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-white/60 text-[28px] font-[580] tracking-tight">
              {logs?.length === 0 ? 'No profile activity yet' : 'No logs match current filters'}
            </div>
            <div className="text-white/40 text-[26px] font-[560] tracking-tight mt-2">
              {logs?.length === 0 ? 'Profile operations will appear here' : 'Try adjusting your filter settings'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredLogs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(log.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-[28px] font-[580] text-white tracking-tight">
                          {log.profile_name || 'System'}
                        </span>
                        <span className={`px-2 py-1 rounded-md text-[24px] font-[580] tracking-tight ${getStatusColor(log.status)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[24px] font-[560] text-white/60 tracking-tight">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      
                      {log.message && (
                        <div className="text-[26px] font-[560] text-white/80 tracking-tight mb-1">
                          {log.message}
                        </div>
                      )}
                      
                      {log.error && (
                        <div className="text-[26px] font-[560] text-red-400 tracking-tight">
                          Error: {log.error}
                        </div>
                      )}
                      
                      <div className="text-[24px] font-[560] text-white/40 tracking-tight">
                        {log.device_address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileLogs;