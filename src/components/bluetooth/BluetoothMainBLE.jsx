import React, { useState, useEffect } from 'react';
import { useBluetooth, useNocturned } from '../../hooks/useNocturned';
import { useGradientState } from '../../hooks/useGradientState';
import DeviceList from './DeviceList';
import BluetoothStatus from './BluetoothStatus';
import BLEConnectionLog from './BLEConnectionLog';
import { BluetoothIcon, RefreshIcon, SmartphoneIcon } from '../common/icons';
import ErrorMessage from '../common/ErrorMessage';

const BluetoothMainBLE = ({ setActiveSection }) => {
  const [gradientState, updateGradientColors] = useGradientState();
  
  const {
    devices,
    loading,
    error,
    fetchDevices,
    wsConnected,
    connectDevice,
    disconnectDevice,
    forgetDevice,
    getBleStatus,
    connectBle,
    disconnectBle,
  } = useBluetooth();

  const { addMessageListener, removeMessageListener } = useNocturned();

  const [bleStatus, setBleStatus] = useState({
    scanning: false,
    connecting: false,
    connected: false,
    deviceName: null,
    deviceAddress: null,
  });

  // Initialize gradient and fetch devices on mount
  useEffect(() => {
    updateGradientColors(null, "bluetooth");
    fetchDevices();
  }, [updateGradientColors, fetchDevices]);

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

  // Listen for BLE-specific WebSocket events
  useEffect(() => {
    const handleBleEvents = (data) => {
      switch (data.type) {
        case 'media/ble_scan_start':
          setBleStatus(prev => ({ ...prev, scanning: true }));
          break;
        case 'media/ble_device_found':
          setBleStatus(prev => ({ 
            ...prev, 
            scanning: false,
            deviceName: data.payload?.name,
            deviceAddress: data.payload?.address 
          }));
          break;
        case 'media/ble_connected':
          setBleStatus(prev => ({ 
            ...prev, 
            connecting: false,
            connected: true,
            deviceAddress: data.payload?.address 
          }));
          fetchDevices(true); // Refresh device list
          break;
        case 'media/ble_disconnected':
          setBleStatus(prev => ({ 
            ...prev, 
            connected: false,
            deviceName: null,
            deviceAddress: null 
          }));
          fetchDevices(true); // Refresh device list
          break;
        case 'media/ble_reconnect_attempt':
          setBleStatus(prev => ({ 
            ...prev, 
            connecting: true,
            connected: false 
          }));
          break;
      }
    };

    const listenerId = addMessageListener('ble-events', handleBleEvents);

    return () => {
      removeMessageListener(listenerId);
    };
  }, [fetchDevices, addMessageListener, removeMessageListener]);

  // Load initial BLE status
  useEffect(() => {
    const loadBleStatus = async () => {
      const status = await getBleStatus();
      setBleStatus(prev => ({
        ...prev,
        connected: status.connected,
        scanning: false,
        connecting: false,
      }));
    };

    loadBleStatus();
  }, [getBleStatus]);

  const handleRefresh = () => {
    fetchDevices(true);
  };

  const handleConnect = async (deviceAddress) => {
    // Check if this is NocturneCompanion - use BLE connection
    const device = devices.find(d => d.address === deviceAddress);
    if (device && (device.name === 'NocturneCompanion' || device.alias === 'NocturneCompanion')) {
      setBleStatus(prev => ({ ...prev, connecting: true }));
      const result = await connectBle();
      if (result.status === 'connecting' || result.status === 'already_connected') {
        // BLE connection initiated successfully
        return true;
      } else {
        setBleStatus(prev => ({ ...prev, connecting: false }));
        return false;
      }
    } else {
      // Regular bluetooth device
      setBleStatus(prev => ({ ...prev, connecting: true }));
      const success = await connectDevice(deviceAddress);
      if (success) {
        await fetchDevices(true);
      } else {
        setBleStatus(prev => ({ ...prev, connecting: false }));
      }
      return success;
    }
  };

  const handleDisconnect = async (deviceAddress) => {
    // Check if this is NocturneCompanion - use BLE disconnection
    const device = devices.find(d => d.address === deviceAddress);
    if (device && (device.name === 'NocturneCompanion' || device.alias === 'NocturneCompanion')) {
      const result = await disconnectBle();
      return result.status === 'disconnected' || result.status === 'already_disconnected';
    } else {
      // Regular bluetooth device
      const success = await disconnectDevice(deviceAddress);
      if (success) {
        await fetchDevices(true);
      }
      return success;
    }
  };

  const handleForget = async (deviceAddress) => {
    const success = await forgetDevice(deviceAddress);
    if (success) {
      await fetchDevices(true);
    }
  };

  // Find NocturneCompanion device
  const nocturneCompanion = devices.find(device => 
    device.name === 'NocturneCompanion' || 
    device.alias === 'NocturneCompanion'
  );

  // Other paired/connected devices (excluding NocturneCompanion)
  const otherConnectedDevices = devices.filter(device => 
    device.connected && device.name !== 'NocturneCompanion'
  );
  const otherPairedDevices = devices.filter(device => 
    device.paired && !device.connected && device.name !== 'NocturneCompanion'
  );

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
            <div className="mb-8">
              <ErrorMessage 
                message={error}
                onRetry={handleRefresh}
                className="bg-red-500/20 rounded-xl p-6 border border-red-500/30"
              />
            </div>
          )}

          {/* Media Control Connection (NocturneCompanion) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[36px] font-[580] text-white tracking-tight">
                Media Control
              </h3>
            </div>
            
            {nocturneCompanion ? (
              <div className="p-6 bg-white/10 rounded-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <SmartphoneIcon className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[34px] font-[580] text-white tracking-tight">
                        Android Phone
                      </div>
                      <div className="text-[30px] font-[560] text-white/60 tracking-tight">
                        {nocturneCompanion.address}
                      </div>
                      <div className="text-[28px] font-[560] tracking-tight">
                        {bleStatus.connected ? (
                          <span className="text-green-400">BLE Connected</span>
                        ) : bleStatus.connecting ? (
                          <span className="text-yellow-400">Connecting...</span>
                        ) : nocturneCompanion.paired ? (
                          <span className="text-blue-400">Paired</span>
                        ) : (
                          <span className="text-white/40">Not Connected</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {bleStatus.connected ? (
                      <button
                        onClick={() => handleDisconnect(nocturneCompanion.address)}
                        className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors text-[32px] font-[580] tracking-tight border border-red-500/30"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(nocturneCompanion.address)}
                        disabled={bleStatus.connecting}
                        className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-[32px] font-[580] tracking-tight border border-blue-500/30"
                      >
                        {bleStatus.connecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : bleStatus.scanning ? (
              <div className="p-6 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-200 text-[32px] font-[580] tracking-tight">
                    Searching for Android phone...
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white/10 rounded-xl text-center border border-white/10">
                <div className="text-white/60 text-[32px] font-[580] tracking-tight">
                  No Android phone found
                </div>
                <div className="text-white/40 text-[30px] font-[560] tracking-tight mt-3">
                  Make sure NocturneCompanion is running on your phone
                </div>
              </div>
            )}
          </div>

          {/* Other Connected Devices */}
          {otherConnectedDevices.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[36px] font-[580] text-white tracking-tight mb-6">
                Other Connected Devices
              </h3>
              <div className="space-y-4">
                <DeviceList
                  devices={otherConnectedDevices}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onForget={handleForget}
                  loading={loading}
                />
              </div>
            </div>
          )}

          {/* Other Paired Devices */}
          {otherPairedDevices.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[36px] font-[580] text-white tracking-tight">
                  Other Paired Devices {`(${otherPairedDevices.length})`}
                </h3>
              </div>
              <div className="space-y-4">
                <DeviceList
                  devices={otherPairedDevices}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onForget={handleForget}
                  loading={loading}
                />
              </div>
            </div>
          )}

          {/* BLE Connection Log */}
          <div className="mb-8">
            <BLEConnectionLog />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BluetoothMainBLE;