import React, { useState, useEffect } from 'react';
import { useProfiles } from '../../hooks/useProfiles';
import ProfileCategorySection from './ProfileCategorySection';
import ProfileLogs from './ProfileLogs';
import { 
  SettingsIcon, 
  RefreshIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  PlayIcon,
  PauseIcon 
} from '../common/icons';

const BluetoothProfiles = ({ deviceAddress, deviceName, className = "" }) => {
  const {
    profiles,
    logs,
    loading,
    error,
    fetchProfiles,
    updateProfile,
    connectProfile,
    disconnectProfile,
    detectProfiles,
    wsConnected
  } = useProfiles(deviceAddress);

  const [expandedCategories, setExpandedCategories] = useState({
    audio: true,
    data: true,
    phone: false,
    device: false
  });
  const [showLogs, setShowLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh profiles every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh || !deviceAddress) return;

    const interval = setInterval(() => {
      fetchProfiles();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, deviceAddress, fetchProfiles]);

  // Fetch profiles on mount and device change
  useEffect(() => {
    if (deviceAddress) {
      fetchProfiles();
    }
  }, [deviceAddress, fetchProfiles]);

  const handleRefresh = () => {
    fetchProfiles();
  };

  const handleDetectProfiles = () => {
    detectProfiles();
  };

  const handleProfileToggle = async (profileUUID, enabled) => {
    await updateProfile({
      device_address: deviceAddress,
      profile_uuid: profileUUID,
      enabled: enabled
    });
  };

  const handleAutoConnectToggle = async (profileUUID, autoConnect) => {
    await updateProfile({
      device_address: deviceAddress,
      profile_uuid: profileUUID,
      auto_connect: autoConnect
    });
  };

  const handlePriorityChange = async (profileUUID, priority) => {
    await updateProfile({
      device_address: deviceAddress,
      profile_uuid: profileUUID,
      priority: priority
    });
  };

  const handleConnectProfile = async (profileUUID) => {
    await connectProfile({
      device_address: deviceAddress,
      profile_uuid: profileUUID,
      force_reconnect: false
    });
  };

  const handleForceReconnect = async (profileUUID) => {
    await connectProfile({
      device_address: deviceAddress,
      profile_uuid: profileUUID,
      force_reconnect: true
    });
  };

  const handleDisconnectProfile = async (profileUUID) => {
    await disconnectProfile(deviceAddress, profileUUID);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Group profiles by category
  const groupedProfiles = {
    audio: {},
    data: {},
    phone: {},
    device: {}
  };

  Object.entries(profiles || {}).forEach(([uuid, profile]) => {
    if (groupedProfiles[profile.category]) {
      groupedProfiles[profile.category][uuid] = profile;
    }
  });

  const categoryInfo = {
    audio: {
      title: 'Audio Profiles',
      description: 'High-quality audio streaming and media control',
      icon: '🎵'
    },
    data: {
      title: 'Data & Network',
      description: 'Serial communication and internet tethering',
      icon: '📡'
    },
    phone: {
      title: 'Phone Integration',
      description: 'Contact sync and messaging access',
      icon: '📱'
    },
    device: {
      title: 'Device Services',
      description: 'File transfer and input device support',
      icon: '⚙️'
    }
  };

  const getConnectionStats = () => {
    const totalProfiles = Object.keys(profiles || {}).length;
    const enabledProfiles = Object.values(profiles || {}).filter(p => p.enabled).length;
    const connectedProfiles = Object.values(profiles || {}).filter(p => p.state === 'connected').length;
    
    return { totalProfiles, enabledProfiles, connectedProfiles };
  };

  const stats = getConnectionStats();

  if (!deviceAddress) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-white/60 text-[32px] font-[580] tracking-tight">
          Select a device to manage profiles
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[36px] font-[580] text-white tracking-tight">
            Profile Management
          </h3>
          <div className="text-[30px] font-[560] text-white/70 tracking-tight mt-2">
            {deviceName || deviceAddress}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-xl text-[28px] font-[580] tracking-tight border transition-colors ${
              autoRefresh 
                ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
            }`}
          >
            {autoRefresh ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleDetectProfiles}
            disabled={loading}
            className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-[28px] font-[580] tracking-tight border border-blue-500/30"
          >
            Detect Profiles
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-3 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 bg-white/5 border border-white/10"
            aria-label="Refresh profiles"
          >
            <RefreshIcon className={`w-6 h-6 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-blue-500/20 rounded-xl border border-blue-500/30">
          <div className="text-blue-300 text-[28px] font-[580] tracking-tight">Total Profiles</div>
          <div className="text-blue-100 text-[36px] font-[600] tracking-tight mt-1">{stats.totalProfiles}</div>
        </div>
        <div className="p-6 bg-green-500/20 rounded-xl border border-green-500/30">
          <div className="text-green-300 text-[28px] font-[580] tracking-tight">Enabled</div>
          <div className="text-green-100 text-[36px] font-[600] tracking-tight mt-1">{stats.enabledProfiles}</div>
        </div>
        <div className="p-6 bg-purple-500/20 rounded-xl border border-purple-500/30">
          <div className="text-purple-300 text-[28px] font-[580] tracking-tight">Connected</div>
          <div className="text-purple-100 text-[36px] font-[600] tracking-tight mt-1">{stats.connectedProfiles}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 bg-red-500/20 rounded-xl mb-8 border border-red-500/30">
          <div className="text-red-300 text-[32px] font-[560] tracking-tight">{error}</div>
        </div>
      )}

      {/* Profile Categories */}
      <div className="space-y-6 mb-8">
        {Object.entries(categoryInfo).map(([category, info]) => {
          const categoryProfiles = groupedProfiles[category];
          const profileCount = Object.keys(categoryProfiles).length;
          
          if (profileCount === 0) return null;
          
          return (
            <div key={category} className="bg-white/5 rounded-xl border border-white/10">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-[32px]">{info.icon}</span>
                  <div className="text-left">
                    <div className="text-[34px] font-[580] text-white tracking-tight">
                      {info.title}
                    </div>
                    <div className="text-[30px] font-[560] text-white/60 tracking-tight">
                      {info.description} • {profileCount} profiles
                    </div>
                  </div>
                </div>
                {expandedCategories[category] ? (
                  <ChevronDownIcon className="w-8 h-8 text-white/60" />
                ) : (
                  <ChevronRightIcon className="w-8 h-8 text-white/60" />
                )}
              </button>
              
              {expandedCategories[category] && (
                <div className="px-6 pb-6">
                  <ProfileCategorySection
                    profiles={categoryProfiles}
                    onProfileToggle={handleProfileToggle}
                    onAutoConnectToggle={handleAutoConnectToggle}
                    onPriorityChange={handlePriorityChange}
                    onConnect={handleConnectProfile}
                    onForceReconnect={handleForceReconnect}
                    onDisconnect={handleDisconnectProfile}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Logs Section */}
      <div className="bg-white/5 rounded-xl border border-white/10">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
        >
          <div className="flex items-center space-x-4">
            <span className="text-[32px]">📋</span>
            <div className="text-left">
              <div className="text-[34px] font-[580] text-white tracking-tight">
                Profile Activity Logs
              </div>
              <div className="text-[30px] font-[560] text-white/60 tracking-tight">
                Real-time profile connection and configuration events
              </div>
            </div>
          </div>
          {showLogs ? (
            <ChevronDownIcon className="w-8 h-8 text-white/60" />
          ) : (
            <ChevronRightIcon className="w-8 h-8 text-white/60" />
          )}
        </button>
        
        {showLogs && (
          <div className="px-6 pb-6">
            <ProfileLogs 
              logs={logs} 
              deviceAddress={deviceAddress}
              wsConnected={wsConnected}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BluetoothProfiles;