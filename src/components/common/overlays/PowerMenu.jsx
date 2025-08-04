import React, { useEffect, useState } from "react";

// The MenuItem component is updated with larger text and padding
const MenuItem = ({ text, onClick, disabled = false, status = null, variant = 'default' }) => {
  const baseClasses = "w-full py-5 px-6 rounded-2xl text-white text-2xl font-bold transition-all flex items-center justify-center";
  
  const variantClasses = {
    default: "bg-slate-700 hover:bg-slate-600",
    danger: "bg-red-600 hover:bg-red-700",
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{text}</span>
      {status && <span className="ml-4 text-xl font-medium text-slate-300">({status})</span>}
    </button>
  );
};


function PowerMenu({ isVisible, onClose }) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [successStatus, setSuccessStatus] = useState("");
  const [errorStatus, setErrorStatus] = useState("");

  useEffect(() => {
    if (!isVisible) return;
    
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyPress, { capture: true });
    };
  }, [isVisible, onClose]);

  const handleBluetoothReconnect = async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    setSuccessStatus("Disconnecting...");
    
    try {
      const disconnectResponse = await fetch('http://localhost:5000/api/bluetooth/disconnect', { method: 'POST' });
      
      if (!disconnectResponse.ok) {
        throw new Error('Failed to disconnect');
      }
      
      setSuccessStatus("Waiting...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSuccessStatus("Reconnecting...");
      const connectResponse = await fetch('http://localhost:5000/media/ble/connect', { method: 'POST' });
      
      if (!connectResponse.ok) {
        throw new Error('Failed to reconnect');
      }
      
      setSuccessStatus("Complete!");
      setTimeout(() => {
        setIsReconnecting(false);
        setSuccessStatus("");
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Bluetooth reconnect error:', error);
      setErrorStatus("Reconnect failed: " + error.message);
      setIsReconnecting(false);
      setTimeout(() => {
        setErrorStatus("");
      }, 3000);
    }
  };

  const handleTimeSync = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/time/sync', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Failed to sync time');
      }
      
      setSuccessStatus("Time synced!");
      setTimeout(() => {
        setSuccessStatus("");
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Time sync error:', error);
      setErrorStatus("Time sync failed");
      setTimeout(() => {
        setErrorStatus("");
      }, 3000);
    }
  };
  
  const handleTrackRefresh = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/track/refresh', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Failed to refresh track data');
      }
      
      setSuccessStatus("Track data refreshed!");
      setTimeout(() => {
        setSuccessStatus("");
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Track refresh error:', error);
      setErrorStatus("Track refresh failed");
      setTimeout(() => {
        setErrorStatus("");
      }, 3000);
    }
  };

  const handleReboot = async () => {
    if (window.confirm("Are you sure you want to reboot the device?")) {
      try {
        await fetch('http://localhost:5000/api/device/reboot', { method: 'POST' });
      } catch (error) {
        console.error('Reboot error:', error);
        setErrorStatus("Reboot command failed");
        setTimeout(() => setErrorStatus(""), 3000);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 z-[998]" onClick={onClose} />
      
      {/* Menu Container */}
      <div className="fixed inset-0 flex items-center justify-center flex-col z-[999] pointer-events-none">
        
        {/* Main Menu Form: Increased width, max-width, and padding */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl w-11/12 max-w-xl pointer-events-auto">

          {/* Increased spacing between menu items */}
          <div className="space-y-6">
            <MenuItem 
              text="Reconnect Bluetooth"
              onClick={handleBluetoothReconnect}
              disabled={isReconnecting}
              status={isReconnecting ? successStatus : null}
            />
            <MenuItem 
              text="Sync Time"
              onClick={handleTimeSync}
              disabled={isReconnecting}
            />
            <MenuItem 
              text="Refresh Track Data"
              onClick={handleTrackRefresh}
              disabled={isReconnecting}
            />
            <MenuItem 
              text="Reboot Device"
              onClick={handleReboot}
              variant="danger"
              disabled={isReconnecting}
            />
          </div>
          {successStatus && !isReconnecting && (
            <div className="mt-6 text-center text-green-400 font-medium text-lg">{successStatus}</div>
          )}
        </div>

       {/* Error Message Pop-up */}
        {errorStatus && (
          <div className="mt-4 bg-red-900/70 text-red-300 border border-red-700 rounded-lg px-4 py-2 text-center pointer-events-auto animate-pulse">
            {errorStatus}
          </div>
        )}

      </div>
      
    </>
  );
}

export default PowerMenu;