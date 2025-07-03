import React from 'react';
import { 
  BluetoothIcon, 
  WifiMaxIcon, 
  CheckCircleIcon, 
  CircleOffIcon, 
  XIcon 
} from '../common/icons';

const BluetoothStatus = ({ wsConnected, className = "" }) => {
  // WebSocket connection status
  const ConnectionIndicator = () => {
    if (wsConnected) {
      return (
        <div className="flex items-center space-x-2 text-green-400">
          <CheckCircleIcon className="w-4 h-4" />
          <span className="text-sm">Service Connected</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-red-400">
        <CircleOffIcon className="w-4 h-4" />
        <span className="text-sm">Service Disconnected</span>
      </div>
    );
  };

  // Bluetooth adapter status
  const BluetoothIndicator = () => {
    // For now, assume Bluetooth is available since we're in Bluetooth settings
    // In a real implementation, this would check actual adapter status
    return (
      <div className="flex items-center space-x-2 text-blue-400">
        <BluetoothIcon className="w-4 h-4" />
        <span className="text-sm">Bluetooth Ready</span>
      </div>
    );
  };

  // System status summary
  const getStatusColor = () => {
    if (!wsConnected) return 'border-red-500/30 bg-red-500/10';
    return 'border-green-500/30 bg-green-500/10';
  };

  const getStatusMessage = () => {
    if (!wsConnected) {
      return {
        icon: XIcon,
        message: 'Cannot connect to nocturned service',
        description: 'Bluetooth operations may not work properly',
        color: 'text-red-400'
      };
    }

    return {
      icon: CheckCircleIcon,
      message: 'System ready for Bluetooth operations',
      description: 'All services are running normally',
      color: 'text-green-400'
    };
  };

  const status = getStatusMessage();
  const StatusIcon = status.icon;

  return (
    <div className={`${className}`}>
      {/* Main Status Card */}
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-start space-x-3">
          <StatusIcon className={`w-5 h-5 ${status.color} mt-0.5`} />
          <div className="flex-1">
            <div className={`font-medium ${status.color}`}>
              {status.message}
            </div>
            <div className="text-white/60 text-sm mt-1">
              {status.description}
            </div>
          </div>
        </div>

        {/* Status Details */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <ConnectionIndicator />
            <BluetoothIndicator />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {!wsConnected && (
        <div className="mt-3 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
          <div className="flex items-start space-x-2">
            <XIcon className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div className="text-yellow-300 text-sm">
              <div className="font-medium mb-1">Service Connection Issues</div>
              <div className="text-yellow-400/80 text-xs">
                • Check that nocturned service is running<br/>
                • Verify WebSocket connection on port 8080<br/>
                • Restart the service if needed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Networking Mode Info */}
      <div className="mt-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
        <div className="flex items-start space-x-2">
          <BluetoothIcon className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="text-blue-300 text-sm">
            <div className="font-medium mb-1">Bluetooth-Only Mode</div>
            <div className="text-blue-400/80 text-xs">
              This device is configured for Bluetooth-only networking.
              WiFi features have been disabled for simplified operation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BluetoothStatus;