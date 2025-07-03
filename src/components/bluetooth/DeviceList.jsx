import React, { useState } from 'react';
import { 
  SmartphoneIcon, 
  LaptopIcon, 
  TabletIcon, 
  TvIcon, 
  SpeakerIcon,
  BatteryIcon,
  CheckCircleIcon,
  CircleOffIcon,
  XIcon
} from '../common/icons';

const DeviceList = ({ 
  devices = [], 
  onConnect, 
  onDisconnect, 
  onForget, 
  loading = false,
  className = "" 
}) => {
  const [actionLoading, setActionLoading] = useState({});

  const getDeviceIcon = (device) => {
    const deviceClass = device.class;
    const name = device.name?.toLowerCase() || '';
    
    // Determine icon based on device class or name
    if (name.includes('phone') || name.includes('android') || name.includes('iphone')) {
      return SmartphoneIcon;
    }
    if (name.includes('laptop') || name.includes('macbook') || name.includes('pc')) {
      return LaptopIcon;
    }
    if (name.includes('tablet') || name.includes('ipad')) {
      return TabletIcon;
    }
    if (name.includes('tv') || name.includes('display')) {
      return TvIcon;
    }
    if (name.includes('speaker') || name.includes('headphone') || name.includes('audio')) {
      return SpeakerIcon;
    }
    
    // Default to smartphone for most devices
    return SmartphoneIcon;
  };

  const handleAction = async (action, deviceAddress) => {
    setActionLoading(prev => ({ ...prev, [deviceAddress]: action }));
    try {
      await action(deviceAddress);
    } finally {
      setActionLoading(prev => ({ ...prev, [deviceAddress]: null }));
    }
  };

  const formatDeviceClass = (deviceClass) => {
    if (!deviceClass) return 'Unknown Device';
    
    // Convert device class to readable format
    const classMap = {
      '1048580': 'Smartphone',
      '2360324': 'Computer',
      '524292': 'Audio Device',
      '5898764': 'Tablet',
      '2883588': 'TV/Display'
    };
    
    return classMap[deviceClass] || 'Bluetooth Device';
  };

  if (devices.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-white/40 text-sm">No devices found</div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {devices.map((device) => {
        const DeviceIcon = getDeviceIcon(device);
        const isLoading = actionLoading[device.address];
        const isNocturneCompanion = device.name === 'NocturneCompanion' || 
                                   device.alias === 'NocturneCompanion';

        return (
          <div
            key={device.address}
            className={`p-4 rounded-lg border transition-all ${
              device.connected 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Device Info */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative">
                  <DeviceIcon className={`w-8 h-8 ${
                    device.connected ? 'text-green-400' : 'text-white/60'
                  }`} />
                  {device.connected && (
                    <CheckCircleIcon className="w-4 h-4 text-green-400 absolute -bottom-1 -right-1" />
                  )}
                  {isNocturneCompanion && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-white truncate">
                      {device.alias || device.name || 'Unknown Device'}
                    </h4>
                    {isNocturneCompanion && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        Media
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">
                    {formatDeviceClass(device.class)}
                  </p>
                  <p className="text-white/40 text-xs font-mono">
                    {device.address}
                  </p>
                  
                  {/* Battery Level */}
                  {device.batteryPercentage !== undefined && device.batteryPercentage > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <BatteryIcon className="w-3 h-3 text-white/40" />
                      <span className="text-white/40 text-xs">
                        {device.batteryPercentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                {device.connected ? (
                  <button
                    onClick={() => handleAction(onDisconnect, device.address)}
                    disabled={loading || isLoading}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {isLoading === onDisconnect ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(onConnect, device.address)}
                    disabled={loading || isLoading}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    {isLoading === onConnect ? 'Connecting...' : 'Connect'}
                  </button>
                )}
                
                <button
                  onClick={() => handleAction(onForget, device.address)}
                  disabled={loading || isLoading}
                  className="p-1 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                  aria-label="Forget device"
                  title="Forget device"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Device Status */}
            <div className="mt-2 flex items-center space-x-4 text-xs">
              <span className={`flex items-center space-x-1 ${
                device.connected ? 'text-green-400' : 'text-white/40'
              }`}>
                {device.connected ? (
                  <CheckCircleIcon className="w-3 h-3" />
                ) : (
                  <CircleOffIcon className="w-3 h-3" />
                )}
                <span>{device.connected ? 'Connected' : 'Not Connected'}</span>
              </span>
              
              <span className="text-white/40">
                {device.trusted ? 'Trusted' : 'Not Trusted'}
              </span>
              
              {device.legacyPairing && (
                <span className="text-yellow-400">Legacy Pairing</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DeviceList;