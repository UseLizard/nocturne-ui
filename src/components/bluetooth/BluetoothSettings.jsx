import React, { useState, useEffect } from 'react';
import { useBluetooth } from '../../hooks/useNocturned';
import DeviceList from './DeviceList';
import PairingModal from './PairingModal';
import BluetoothStatus from './BluetoothStatus';
import { BluetoothIcon, RefreshIcon } from '../common/icons';

const BluetoothSettings = ({ className = "" }) => {
  const {
    devices,
    loading,
    error,
    fetchDevices,
    pairingRequest,
    isConnecting,
    acceptPairing,
    denyPairing,
    setDiscoverable,
    connectDevice,
    disconnectDevice,
    forgetDevice,
    wsConnected
  } = useBluetooth();

  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [discoveryTimeout, setDiscoveryTimeout] = useState(null);

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Handle discovery timeout
  useEffect(() => {
    if (isDiscoverable && !discoveryTimeout) {
      const timeout = setTimeout(() => {
        handleStopDiscovery();
      }, 120000); // 2 minutes discovery timeout
      setDiscoveryTimeout(timeout);
    }

    return () => {
      if (discoveryTimeout) {
        clearTimeout(discoveryTimeout);
      }
    };
  }, [isDiscoverable, discoveryTimeout]);

  const handleStartDiscovery = async () => {
    const success = await setDiscoverable(true);
    if (success) {
      setIsDiscoverable(true);
    }
  };

  const handleStopDiscovery = async () => {
    await setDiscoverable(false);
    setIsDiscoverable(false);
    if (discoveryTimeout) {
      clearTimeout(discoveryTimeout);
      setDiscoveryTimeout(null);
    }
  };

  const handleRefresh = () => {
    fetchDevices(true);
  };

  const handleConnect = async (deviceAddress) => {
    const success = await connectDevice(deviceAddress);
    if (success) {
      await fetchDevices(true);
    }
  };

  const handleDisconnect = async (deviceAddress) => {
    const success = await disconnectDevice(deviceAddress);
    if (success) {
      await fetchDevices(true);
    }
  };

  const handleForget = async (deviceAddress) => {
    const success = await forgetDevice(deviceAddress);
    if (success) {
      await fetchDevices(true);
    }
  };

  const connectedDevices = devices.filter(device => device.connected);
  const pairedDevices = devices.filter(device => device.paired && !device.connected);

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BluetoothIcon className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Bluetooth</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Refresh devices"
        >
          <RefreshIcon className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Connection Status */}
      <BluetoothStatus 
        wsConnected={wsConnected}
        className="mb-6"
      />

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/20 rounded-lg mb-6">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      {/* Discovery Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">Device Discovery</h3>
          {isDiscoverable ? (
            <button
              onClick={handleStopDiscovery}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Stop Discovery
            </button>
          ) : (
            <button
              onClick={handleStartDiscovery}
              disabled={loading}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              Make Discoverable
            </button>
          )}
        </div>
        
        {isDiscoverable && (
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-sm">
                Device is discoverable as "Car Thing"
              </span>
            </div>
            <div className="text-blue-400/80 text-xs mt-1">
              Other devices can now find and pair with this device
            </div>
          </div>
        )}
      </div>

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">Connected Devices</h3>
          <DeviceList
            devices={connectedDevices}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onForget={handleForget}
            loading={loading}
          />
        </div>
      )}

      {/* Paired Devices */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-3">
          Paired Devices {pairedDevices.length > 0 && `(${pairedDevices.length})`}
        </h3>
        {pairedDevices.length > 0 ? (
          <DeviceList
            devices={pairedDevices}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onForget={handleForget}
            loading={loading}
          />
        ) : (
          <div className="p-4 bg-white/5 rounded-lg text-center">
            <div className="text-white/60 text-sm">No paired devices</div>
            <div className="text-white/40 text-xs mt-1">
              Make this device discoverable to pair with other devices
            </div>
          </div>
        )}
      </div>

      {/* Pairing Modal */}
      {pairingRequest && (
        <PairingModal
          pairingRequest={pairingRequest}
          isConnecting={isConnecting}
          onAccept={acceptPairing}
          onDeny={denyPairing}
        />
      )}
    </div>
  );
};

export default BluetoothSettings;