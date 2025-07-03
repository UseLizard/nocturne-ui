import React, { useState, useEffect } from 'react';
import { BluetoothIcon, CheckIcon, XIcon, SmartphoneIcon } from '../common/icons';

const PairingModal = ({ 
  pairingRequest, 
  isConnecting = false,
  onAccept, 
  onDeny 
}) => {
  const [timeLeft, setTimeLeft] = useState(30);

  // Auto-deny after 30 seconds
  useEffect(() => {
    if (!pairingRequest) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDeny();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pairingRequest, onDeny]);

  // Reset timer when new pairing request comes in
  useEffect(() => {
    if (pairingRequest) {
      setTimeLeft(30);
    }
  }, [pairingRequest]);

  if (!pairingRequest) return null;

  const handleAccept = () => {
    onAccept(pairingRequest.deviceAddress, pairingRequest.passkey);
  };

  const handleDeny = () => {
    onDeny(pairingRequest.deviceAddress);
  };

  const getDeviceIcon = () => {
    const name = pairingRequest.deviceName?.toLowerCase() || '';
    if (name.includes('phone') || name.includes('android') || name.includes('iphone')) {
      return SmartphoneIcon;
    }
    return BluetoothIcon;
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <DeviceIcon className="w-8 h-8 text-blue-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pairing Request</h3>
            <p className="text-white/60 text-sm">
              {pairingRequest.deviceName || 'Unknown Device'}
            </p>
          </div>
        </div>

        {/* Device Info */}
        <div className="mb-6">
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-white/80 text-sm mb-2">Device Address:</div>
            <div className="text-white font-mono text-sm">
              {pairingRequest.deviceAddress}
            </div>
          </div>
        </div>

        {/* Passkey Display */}
        {pairingRequest.passkey && (
          <div className="mb-6">
            <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <div className="text-blue-300 text-sm mb-1">Confirm this passkey matches:</div>
              <div className="text-blue-100 text-2xl font-mono font-bold tracking-widest">
                {pairingRequest.passkey.toString().padStart(6, '0')}
              </div>
            </div>
          </div>
        )}

        {/* Warning for NocturneCompanion */}
        {(pairingRequest.deviceName === 'NocturneCompanion' || 
          pairingRequest.deviceName?.includes('Nocturne')) && (
          <div className="mb-6 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
            <div className="text-green-300 text-sm">
              This appears to be a NocturneCompanion device for media control.
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 text-white/60 text-sm">
            <span>Auto-deny in</span>
            <span className="font-mono text-orange-400">{timeLeft}s</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1 mt-2">
            <div 
              className="bg-orange-400 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleDeny}
            disabled={isConnecting}
            className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <XIcon className="w-4 h-4" />
            <span>Deny</span>
          </button>
          <button
            onClick={handleAccept}
            disabled={isConnecting}
            className="flex-1 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                <span>Pairing...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Accept</span>
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <div className="text-white/40 text-xs">
            Make sure the passkey matches on both devices before accepting
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairingModal;