import React, { useState, useEffect } from 'react';
import { useBluetooth } from '../../hooks/useNocturned';
import DeviceList from './DeviceList';
import PairingModal from './PairingModal';
import BluetoothStatus from './BluetoothStatus';
import { BluetoothIcon, RefreshIcon } from '../common/icons';

const BluetoothMain = ({ setActiveSection }) => {
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

  // Handle back navigation with escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveSection("recents");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveSection]);

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
    <div className="h-full overflow-y-auto overflow-x-hidden" style={{ touchAction: "pan-y", overflowX: "hidden" }}>
      <div className="min-h-full flex flex-col px-12 pt-12">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <BluetoothIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-[46px] font-[580] text-white tracking-tight">
                Bluetooth
              </h2>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-4 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 bg-white/5 border border-white/10"
              aria-label="Refresh devices"
            >
              <RefreshIcon className={`w-6 h-6 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Connection Status */}
          <div className="mb-8">
            <BluetoothStatus 
              wsConnected={wsConnected}
              className="mb-6"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-6 bg-red-500/20 rounded-xl mb-8 border border-red-500/30">
              <div className="text-red-300 text-[32px] font-[560] tracking-tight">{error}</div>
            </div>
          )}

          {/* Discovery Controls */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[36px] font-[580] text-white tracking-tight">
                Device Discovery
              </h3>
              {isDiscoverable ? (
                <button
                  onClick={handleStopDiscovery}
                  className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors text-[32px] font-[580] tracking-tight border border-red-500/30"
                >
                  Stop Discovery
                </button>
              ) : (
                <button
                  onClick={handleStartDiscovery}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-[32px] font-[580] tracking-tight border border-blue-500/30"
                >
                  Make Discoverable
                </button>
              )}
            </div>
            
            {isDiscoverable && (
              <div className="p-6 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-200 text-[32px] font-[580] tracking-tight">
                    Device is discoverable as "Car Thing"
                  </span>
                </div>
                <div className="text-blue-300/80 text-[30px] font-[560] tracking-tight">
                  Other devices can now find and pair with this device
                </div>
              </div>
            )}
          </div>

          {/* Connected Devices */}
          {connectedDevices.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[36px] font-[580] text-white tracking-tight mb-6">
                Connected Devices
              </h3>
              <div className="space-y-4">
                <DeviceList
                  devices={connectedDevices}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onForget={handleForget}
                  loading={loading}
                />
              </div>
            </div>
          )}

          {/* Paired Devices */}
          <div className="mb-8">
            <h3 className="text-[36px] font-[580] text-white tracking-tight mb-6">
              Paired Devices {pairedDevices.length > 0 && `(${pairedDevices.length})`}
            </h3>
            {pairedDevices.length > 0 ? (
              <div className="space-y-4">
                <DeviceList
                  devices={pairedDevices}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onForget={handleForget}
                  loading={loading}
                />
              </div>
            ) : (
              <div className="p-8 bg-white/10 rounded-xl text-center border border-white/10">
                <div className="text-white/60 text-[32px] font-[580] tracking-tight">
                  No paired devices
                </div>
                <div className="text-white/40 text-[30px] font-[560] tracking-tight mt-3">
                  Make this device discoverable to pair with other devices
                </div>
              </div>
            )}
          </div>
        </div>
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

export default BluetoothMain;