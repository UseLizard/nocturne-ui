import { useState, useEffect, useCallback } from 'react';
import { useNocturned } from './useNocturned';

const useProfiles = (deviceAddress) => {
  const { apiRequest, wsConnected } = useNocturned();
  const [profiles, setProfiles] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch profile configuration for a device
  const fetchProfiles = useCallback(async () => {
    if (!deviceAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(`/bluetooth/profiles/${deviceAddress}`, 'GET');
      
      if (response.profiles) {
        setProfiles(response.profiles);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
      setError(`Failed to fetch profiles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [deviceAddress, apiRequest]);

  // Fetch profile logs
  const fetchLogs = useCallback(async (limit = 100) => {
    try {
      const response = await apiRequest(`/bluetooth/profiles/logs?limit=${limit}`, 'GET');
      
      if (response.logs) {
        setLogs(response.logs);
      }
    } catch (err) {
      console.error('Failed to fetch profile logs:', err);
    }
  }, [apiRequest]);

  // Update profile configuration
  const updateProfile = useCallback(async (updateRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiRequest('/bluetooth/profiles/update', 'POST', JSON.stringify(updateRequest));
      
      // Refresh profiles after update
      await fetchProfiles();
      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(`Failed to update profile: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, fetchProfiles]);

  // Connect a specific profile
  const connectProfile = useCallback(async (connectionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiRequest('/bluetooth/profiles/connect', 'POST', JSON.stringify(connectionRequest));
      
      // Refresh profiles after connection attempt
      setTimeout(() => fetchProfiles(), 1000);
      return true;
    } catch (err) {
      console.error('Failed to connect profile:', err);
      setError(`Failed to connect profile: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, fetchProfiles]);

  // Disconnect a specific profile
  const disconnectProfile = useCallback(async (deviceAddress, profileUUID) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiRequest(`/bluetooth/profiles/disconnect/${deviceAddress}/${profileUUID}`, 'POST');
      
      // Refresh profiles after disconnection
      setTimeout(() => fetchProfiles(), 1000);
      return true;
    } catch (err) {
      console.error('Failed to disconnect profile:', err);
      setError(`Failed to disconnect profile: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiRequest, fetchProfiles]);

  // Detect device profiles
  const detectProfiles = useCallback(async () => {
    if (!deviceAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(`/bluetooth/profiles/detect/${deviceAddress}`, 'GET');
      
      console.log('Detected profiles:', response);
      
      // Refresh profiles after detection
      await fetchProfiles();
      return response.supported_profiles || [];
    } catch (err) {
      console.error('Failed to detect profiles:', err);
      setError(`Failed to detect profiles: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [deviceAddress, apiRequest, fetchProfiles]);

  // Handle WebSocket events for real-time updates
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'bluetooth/profile/state_changed':
          if (data.payload?.device_address === deviceAddress) {
            setProfiles(prev => ({
              ...prev,
              [data.payload.profile.uuid]: data.payload.profile
            }));
          }
          break;
          
        case 'bluetooth/profile/log':
          if (data.payload?.entry) {
            setLogs(prev => {
              const newLogs = [data.payload.entry, ...prev];
              // Keep only last 1000 entries
              return newLogs.slice(0, 1000);
            });
          }
          break;
          
        default:
          break;
      }
    };

    // Add WebSocket listener if connected
    if (wsConnected && window.ws) {
      window.ws.addEventListener('message', handleWebSocketMessage);
      
      return () => {
        if (window.ws) {
          window.ws.removeEventListener('message', handleWebSocketMessage);
        }
      };
    }
  }, [wsConnected, deviceAddress]);

  // Initial data fetch
  useEffect(() => {
    if (deviceAddress) {
      fetchProfiles();
      fetchLogs();
    }
  }, [deviceAddress, fetchProfiles, fetchLogs]);

  return {
    profiles,
    logs,
    loading,
    error,
    fetchProfiles,
    fetchLogs,
    updateProfile,
    connectProfile,
    disconnectProfile,
    detectProfiles,
    wsConnected
  };
};

export { useProfiles };
export default useProfiles;