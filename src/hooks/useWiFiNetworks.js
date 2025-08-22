import { useState, useEffect, useRef, useCallback } from "react";
import { useConnector } from "../contexts/ConnectorContext";
import { useWebSocket } from './useWebSocket';

const API_BASE = 'http://172.16.42.1:20574';

// Legacy function - now handled by WebSocketService
// Removed duplicate WebSocket connection setup

export function useWiFiNetworks() {
  const { isConnectorAvailable, isLoading: isConnectorLoading } = useConnector();
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [savedNetworks, setSavedNetworks] = useState([]);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [loadingState, setLoadingState] = useState({
    initial: true,
    scanning: false,
    connecting: false,
    forgetting: false
  });
  const [error, setError] = useState(null);

  // Define stable handlers for WebSocket messages
  const handleNetworkMessage = useCallback(() => {
    fetchNetworkStatus();
    scanNetworks(false);
  }, [fetchNetworkStatus, scanNetworks]);

  // WebSocket message handlers for network updates
  const networkMessageHandlers = {
    'network': handleNetworkMessage
  };

  // Use centralized WebSocket service only if connector is available
  const { isConnected: wsConnected } = useWebSocket(
    isConnectorAvailable ? 'WIFI_CONNECTOR' : null,
    isConnectorAvailable ? networkMessageHandlers : {}
  );

  const scanningRef = useRef(false);
  const statusFetchingRef = useRef(false);
  const savedFetchingRef = useRef(false);
  const pollingIntervalRef = useRef(null);

  const handleFetchError = useCallback((error, operation) => {
    console.error(`Error during ${operation}:`, error);
    setError(`${operation} failed: ${error.message}`);
    return null;
  }, []);

  const processNetworks = useCallback((networks) => {
    return networks.filter(network => {
      return network.ssid &&
        network.ssid.trim() !== '' &&
        !network.flags.includes('[P2P]') &&
        !network.ssid.startsWith('\\x00');
    });
  }, []);

  const combineNetworks = useCallback((networks) => {
    return networks.reduce((acc, network) => {
      const existing = acc.find(n => n.ssid === network.ssid);
      if (!existing || parseInt(network.signal) > parseInt(existing.signal)) {
        if (existing) {
          acc = acc.filter(n => n.ssid !== network.ssid);
        }
        acc.push(network);
      }
      return acc;
    }, []);
  }, []);

  const scanNetworks = useCallback(async (isInitial = false) => {
    if (scanningRef.current) return;
    scanningRef.current = true;

    try {
      setLoadingState(prev => ({
        ...prev,
        initial: isInitial ? true : prev.initial,
        scanning: true
      }));
      setError(null);

      const response = await fetch(`${API_BASE}/network/scan`);
      if (!response.ok) {
        throw new Error(`Scan failed with status: ${response.status}`);
      }

      const networks = await response.json();
      const processedNetworks = processNetworks(networks);
      const combinedNetworks = combineNetworks(processedNetworks);

      setAvailableNetworks(combinedNetworks);

      await fetchSavedNetworks();

      return combinedNetworks;
    } catch (error) {
      handleFetchError(error, 'Network scan');
      try {
        await fetchSavedNetworks();
      } catch (err) {
        console.error('Failed to fetch saved networks after scan error:', err);
      }
      return [];
    } finally {
      scanningRef.current = false;
      setLoadingState(prev => ({
        ...prev,
        initial: false,
        scanning: false
      }));
    }
  }, [processNetworks, combineNetworks, handleFetchError]);

  const fetchNetworkStatus = useCallback(async () => {
    if (statusFetchingRef.current) return null;
    statusFetchingRef.current = true;

    try {
      const response = await fetch(`${API_BASE}/network`);
      if (!response.ok) {
        throw new Error(`Status fetch failed with status: ${response.status}`);
      }

      const status = await response.json();
      setNetworkStatus(status);
      return status;
    } catch (error) {
      handleFetchError(error, 'Network status fetch');
      return null;
    } finally {
      statusFetchingRef.current = false;
    }
  }, [handleFetchError]);

  const fetchSavedNetworks = useCallback(async () => {
    if (savedFetchingRef.current) return;
    savedFetchingRef.current = true;

    try {
      const response = await fetch(`${API_BASE}/network/list`);
      if (!response.ok) {
        throw new Error(`Saved networks fetch failed with status: ${response.status}`);
      }

      const networks = await response.json();

      const current = networks.find(network => network.flags.includes('[CURRENT]'));

      if (current) {
        const availableNetwork = availableNetworks.find(n => n.ssid === current.ssid);
        if (availableNetwork) {
          current.signal = availableNetwork.signal;
        }
        setCurrentNetwork(current);
      } else {
        setCurrentNetwork(null);
      }

      const saved = networks.filter(network => !network.flags.includes('[CURRENT]'));
      setSavedNetworks(saved);

      return networks;
    } catch (error) {
      handleFetchError(error, 'Saved networks fetch');
      return [];
    } finally {
      savedFetchingRef.current = false;
    }
  }, [availableNetworks, handleFetchError]);

  const connectToNetwork = useCallback(async (network, password = null) => {
    setLoadingState(prev => ({ ...prev, connecting: true }));
    setError(null);

    try {
      const savedNetworkResponse = await fetch(`${API_BASE}/network/list`);
      if (!savedNetworkResponse.ok) {
        throw new Error('Failed to check saved networks');
      }

      const savedNetworks = await savedNetworkResponse.json();
      const existingSavedNetwork = savedNetworks.find(n => n.ssid === network.ssid);

      if (existingSavedNetwork) {
        const selectResponse = await fetch(`${API_BASE}/network/select/${existingSavedNetwork.networkId}`, {
          method: 'POST',
        });

        if (!selectResponse.ok) {
          throw new Error(`Failed to select network: ${selectResponse.status}`);
        }
      } else {
        const connectResponse = await fetch(`${API_BASE}/network/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ssid: network.ssid,
            ...(password && { psk: password }),
          }),
        });

        if (!connectResponse.ok) {
          throw new Error(`Failed to connect to network: ${connectResponse.status}`);
        }
      }

      setTimeout(() => {
        scanNetworks();
        fetchNetworkStatus();
      }, 1000);

      return true;
    } catch (error) {
      handleFetchError(error, 'Network connection');
      return false;
    } finally {
      setLoadingState(prev => ({ ...prev, connecting: false }));
    }
  }, [scanNetworks, fetchNetworkStatus, handleFetchError]);

  const connectToSavedNetwork = useCallback(async (networkId) => {
    setLoadingState(prev => ({ ...prev, connecting: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/network/select/${networkId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to select network: ${response.status}`);
      }

      setTimeout(() => {
        scanNetworks();
        fetchNetworkStatus();
      }, 1000);

      return true;
    } catch (error) {
      handleFetchError(error, 'Connect to saved network');
      return false;
    } finally {
      setLoadingState(prev => ({ ...prev, connecting: false }));
    }
  }, [scanNetworks, fetchNetworkStatus, handleFetchError]);

  const forgetNetwork = useCallback(async (networkId) => {
    setLoadingState(prev => ({ ...prev, forgetting: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/network/remove/${networkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove network: ${response.status}`);
      }

      await scanNetworks();

      return true;
    } catch (error) {
      handleFetchError(error, 'Forget network');
      return false;
    } finally {
      setLoadingState(prev => ({ ...prev, forgetting: false }));
    }
  }, [scanNetworks, handleFetchError]);

  const hasPasswordSecurity = useCallback((flags) => {
    const flagStr = flags.toString();
    return flagStr.includes("WPA") || flagStr.includes("WEP");
  }, []);


  // Initialize networks and polling when connector becomes available
  useEffect(() => {
    if (!isConnectorLoading && !isConnectorAvailable) {
      setError("Connector is unavailable");
      return;
    }

    if (isConnectorAvailable) {
      const init = async () => {
        await scanNetworks(true);
        await fetchNetworkStatus();
      };

      init();

      // Set up periodic scanning
      pollingIntervalRef.current = setInterval(() => {
        scanNetworks(false);
      }, 60000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [scanNetworks, fetchNetworkStatus, isConnectorAvailable, isConnectorLoading]);

  return {
    currentNetwork,
    savedNetworks,
    availableNetworks,
    networkStatus,
    error,
    wsConnected,
    isConnectorAvailable,

    isInitialLoading: loadingState.initial || isConnectorLoading,
    isScanning: loadingState.scanning,
    isConnecting: loadingState.connecting,
    isForgetting: loadingState.forgetting,

    scanNetworks: isConnectorAvailable ? scanNetworks : () => { },
    connectToNetwork: isConnectorAvailable ? connectToNetwork : () => { },
    connectToSavedNetwork: isConnectorAvailable ? connectToSavedNetwork : () => { },
    forgetNetwork: isConnectorAvailable ? forgetNetwork : () => { },
    fetchNetworkStatus: isConnectorAvailable ? fetchNetworkStatus : () => { },
    hasPasswordSecurity
  };
} 