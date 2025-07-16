import React, { useState } from 'react';
import { 
  CheckIcon, 
  XIcon, 
  RefreshIcon, 
  PlayIcon, 
  StopIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronRightIcon 
} from '../common/icons';

const ProfileCategorySection = ({
  profiles,
  onProfileToggle,
  onAutoConnectToggle,
  onPriorityChange,
  onConnect,
  onForceReconnect,
  onDisconnect,
  loading
}) => {
  const [expandedProfiles, setExpandedProfiles] = useState({});

  const toggleProfileExpansion = (profileUUID) => {
    setExpandedProfiles(prev => ({
      ...prev,
      [profileUUID]: !prev[profileUUID]
    }));
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'connected': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'connecting': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'enabled': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'connected': return <CheckIcon className="w-5 h-5" />;
      case 'connecting': return <RefreshIcon className="w-5 h-5 animate-spin" />;
      case 'error': return <XIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 90) return 'Critical';
    if (priority >= 70) return 'High';
    if (priority >= 50) return 'Medium';
    if (priority >= 30) return 'Low';
    return 'Minimal';
  };

  return (
    <div className="space-y-4">
      {Object.entries(profiles).map(([uuid, profile]) => (
        <div key={uuid} className="bg-white/5 rounded-xl border border-white/10">
          {/* Profile Header */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-[32px] font-[580] text-white tracking-tight">
                      {profile.name}
                    </h4>
                    <div className={`px-3 py-1 rounded-full text-[26px] font-[580] tracking-tight border ${getStateColor(profile.state)}`}>
                      <div className="flex items-center space-x-2">
                        {getStateIcon(profile.state)}
                        <span className="capitalize">{profile.state}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[28px] font-[560] text-white/70 tracking-tight">
                    {profile.description}
                  </div>
                </div>

                {/* Profile Controls */}
                <div className="flex items-center space-x-3">
                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => onProfileToggle(uuid, !profile.enabled)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl text-[28px] font-[580] tracking-tight border transition-colors disabled:opacity-50 ${
                      profile.enabled
                        ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {profile.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  {/* Connection Controls */}
                  {profile.enabled && (
                    <div className="flex items-center space-x-2">
                      {profile.state === 'connected' ? (
                        <button
                          onClick={() => onDisconnect(uuid)}
                          disabled={loading}
                          className="p-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50 border border-red-500/30"
                          title="Disconnect"
                        >
                          <StopIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onConnect(uuid)}
                          disabled={loading}
                          className="p-3 bg-green-500/20 text-green-300 rounded-xl hover:bg-green-500/30 transition-colors disabled:opacity-50 border border-green-500/30"
                          title="Connect"
                        >
                          <PlayIcon className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onForceReconnect(uuid)}
                        disabled={loading}
                        className="p-3 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50 border border-blue-500/30"
                        title="Force Reconnect"
                      >
                        <RefreshIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Expand Settings */}
                  <button
                    onClick={() => toggleProfileExpansion(uuid)}
                    className="p-3 rounded-xl hover:bg-white/10 transition-colors bg-white/5 border border-white/10"
                    title="Profile Settings"
                  >
                    {expandedProfiles[uuid] ? (
                      <ChevronDownIcon className="w-5 h-5 text-white/60" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-white/60" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Status */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center space-x-6">
                <div className="text-[28px] font-[560] text-white/60 tracking-tight">
                  Auto-Connect: 
                  <span className={`ml-2 font-[580] ${profile.auto_connect ? 'text-green-400' : 'text-red-400'}`}>
                    {profile.auto_connect ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="text-[28px] font-[560] text-white/60 tracking-tight">
                  Priority: 
                  <span className="ml-2 font-[580] text-blue-400">
                    {profile.priority} ({getPriorityLabel(profile.priority)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Settings */}
          {expandedProfiles[uuid] && (
            <div className="px-6 pb-6 border-t border-white/10">
              <div className="pt-6 space-y-6">
                {/* Auto-Connect Setting */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[30px] font-[580] text-white tracking-tight">
                      Auto-Connect
                    </div>
                    <div className="text-[28px] font-[560] text-white/60 tracking-tight">
                      Automatically connect this profile when device pairs
                    </div>
                  </div>
                  <button
                    onClick={() => onAutoConnectToggle(uuid, !profile.auto_connect)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl text-[28px] font-[580] tracking-tight border transition-colors disabled:opacity-50 ${
                      profile.auto_connect
                        ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30'
                        : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {profile.auto_connect ? 'On' : 'Off'}
                  </button>
                </div>

                {/* Priority Setting */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[30px] font-[580] text-white tracking-tight">
                      Connection Priority
                    </div>
                    <div className="text-[28px] font-[560] text-white/60 tracking-tight">
                      Higher priority profiles connect first (0-100)
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.priority}
                      onChange={(e) => onPriorityChange(uuid, parseInt(e.target.value))}
                      disabled={loading}
                      className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${profile.priority}%, rgba(255,255,255,0.2) ${profile.priority}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                    <span className="text-[28px] font-[580] text-blue-400 tracking-tight w-12">
                      {profile.priority}
                    </span>
                  </div>
                </div>

                {/* Profile-Specific Settings */}
                {profile.settings && Object.keys(profile.settings).length > 0 && (
                  <div>
                    <div className="text-[30px] font-[580] text-white tracking-tight mb-4">
                      Profile Settings
                    </div>
                    <div className="space-y-3">
                      {Object.entries(profile.settings).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-[28px] font-[560] text-white/80 tracking-tight capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-[28px] font-[580] text-blue-400 tracking-tight">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile UUID for debugging */}
                <div className="text-[24px] font-[560] text-white/40 tracking-tight">
                  UUID: {uuid}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfileCategorySection;