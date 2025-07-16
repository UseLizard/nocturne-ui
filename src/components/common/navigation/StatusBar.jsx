import { useState, useEffect } from "react";
import { BatteryIcon, BluetoothIcon, SmartphoneIcon, PlayIcon, PauseIcon } from "../../common/icons";
import { useSettings } from "../../../contexts/SettingsContext";
import { useBluetooth, useNocturned } from "../../../hooks/useNocturned";
import { useLocalMedia } from "../../../hooks/useLocalMedia";

let cachedTimezone = null;

export const getCachedTimezone = () => cachedTimezone;

export default function StatusBar() {
  const [currentTime, setCurrentTime] = useState("");
  const [isFourDigits, setIsFourDigits] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(true);
  const [batteryPercentage, setBatteryPercentage] = useState(80);
  const [timezone, setTimezone] = useState(cachedTimezone);
  const [lastTimeSync, setLastTimeSync] = useState(null);
  const { settings } = useSettings();
  const { devices, wsConnected } = useBluetooth();
  const { isConnected: isMediaConnected, isPlaying, currentTrack } = useLocalMedia();
  const { addMessageListener, removeMessageListener } = useNocturned();

  useEffect(() => {
    const fetchTimezone = async () => {
      if (cachedTimezone) {
        setTimezone(cachedTimezone);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/device/date/settimezone", {
          method: "POST"
        });
        
        if (!response.ok) {
          console.error("Failed to fetch timezone from API, status:", response.status);
          return;
        }

        const data = await response.json();
        if (data.status === "success" && data.timezone) {
          cachedTimezone = data.timezone;
          setTimezone(data.timezone);
          console.log("Timezone set to:", data.timezone);
        }
      } catch (error) {
        console.error("Error fetching timezone:", error);
      }
    };

    fetchTimezone();
  }, []);

  // Listen for time sync updates from BLE connection
  useEffect(() => {
    const handleTimeUpdate = (data) => {
      if (data.type === 'system/time_updated') {
        console.log('Time sync received:', data.payload);
        setLastTimeSync(data.payload.timestamp_ms);
        
        // Update timezone if provided
        if (data.payload.timezone) {
          cachedTimezone = data.payload.timezone;
          setTimezone(data.payload.timezone);
        }
        
        // Force immediate time update
        const event = new Event('timeFormatChanged');
        window.dispatchEvent(event);
      }
    };

    const listenerId = addMessageListener('status-bar', handleTimeUpdate);
    
    return () => {
      removeMessageListener(listenerId);
    };
  }, [addMessageListener, removeMessageListener]);

  // Get connected Bluetooth devices
  const connectedDevices = devices.filter(device => device.connected);
  const hasBluetoothDevices = connectedDevices.length > 0;
  
  // Check for NocturneCompanion specifically
  const nocturneCompanionConnected = connectedDevices.some(device => 
    device.name === 'NocturneCompanion' || device.alias === 'NocturneCompanion'
  );

  useEffect(() => {
    const updateTime = async () => {
      try {
        const response = await fetch("http://localhost:5000/device/date");
        if (response.ok) {
          const data = await response.json();
          const timeString = data.time;
          const [hours24, minutes] = timeString.split(':');

          let displayHours;
          if (settings.use24HourTime) {
            displayHours = hours24;
            setIsFourDigits(true);
          } else {
            const hour24 = parseInt(hours24);
            displayHours = (hour24 % 12 || 12).toString();
            setIsFourDigits(parseInt(displayHours) >= 10);
          }

          setCurrentTime(`${displayHours}:${minutes}`);
          return;
        }
      } catch (error) {
        console.error("Error fetching time from server:", error);
      }


      const now = new Date();

      if (timezone && typeof Intl !== 'undefined') {
        try {
          const options = { timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: !settings.use24HourTime };
          const formatter = new Intl.DateTimeFormat('en-US', options);
          const timeString = formatter.format(now);

          let parts = timeString.split(':');
          let hours = parts[0];
          let minutes = parts[1];

          if (!settings.use24HourTime) {
            minutes = minutes.split(' ')[0];
          }

          setCurrentTime(`${hours}:${minutes}`);
          setIsFourDigits(hours.length >= 2);
          return;
        } catch (error) {
          console.error("Error formatting time with timezone:", error);
        }
      }

      let hours;
      if (settings.use24HourTime) {
        hours = now.getHours().toString().padStart(2, "0");
        setIsFourDigits(true);
      } else {
        hours = now.getHours() % 12 || 12;
        setIsFourDigits(hours >= 10);
      }

      const minutes = now.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 15000);

    const handleTimeFormatChange = () => {
      updateTime();
    };

    window.addEventListener("timeFormatChanged", handleTimeFormatChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("timeFormatChanged", handleTimeFormatChange);
    };
  }, [settings.use24HourTime, timezone]);

  // Always render status bar
  const shouldRenderStatusBar = true;

  return (
    <div
      className={`flex justify-between w-full mb-6 pr-10 ${isFourDigits ? "pl-0.5" : "pl-2"
        } items-start`}
    >
      <div
        className="text-[26px] font-[580] text-white tracking-tight leading-none"
        style={{ margin: 0, padding: 0, marginTop: "-1px" }}
      >
        {currentTime}
      </div>
      <div className="flex gap-2.5 h-10" style={{ marginTop: "-10px" }}>
        {/* Media Status Indicator */}
        {isMediaConnected && currentTrack && (
          <div className="flex items-center" style={{ transform: "translateY(-10px)" }}>
            {isPlaying ? (
              <PlayIcon className="w-8 h-10 text-green-400" />
            ) : (
              <PauseIcon className="w-8 h-10 text-white/60" />
            )}
          </div>
        )}
        
        {/* NocturneCompanion Connection Status */}
        {nocturneCompanionConnected && (
          <div className="flex items-center" style={{ transform: "translateY(-10px)" }}>
            <SmartphoneIcon className="w-8 h-10 text-blue-400" />
          </div>
        )}
        
        {/* General Bluetooth Status */}
        {hasBluetoothDevices && !nocturneCompanionConnected && (
          <BluetoothIcon
            className="w-8 h-10 text-white"
            style={{
              margin: 0,
              padding: 0,
              display: "block",
              transform: "translateY(-10px)",
            }}
          />
        )}
        
        {/* WebSocket Connection Status */}
        {!wsConnected && (
          <div 
            className="w-3 h-3 bg-red-500 rounded-full animate-pulse" 
            style={{ transform: "translateY(-10px)", marginTop: "15px" }}
            title="Service disconnected"
          />
        )}
      </div>
    </div>
  );
}
