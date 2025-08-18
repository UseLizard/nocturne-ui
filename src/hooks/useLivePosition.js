import { useState, useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:8080/ws/progress';

export const useLivePosition = () => {
  const [position, setPosition] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('Live position WebSocket connected');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'position_update' && data.payload && data.payload.position_ms) {
            setPosition(data.payload.position_ms);
          }
        } catch (error) {
          console.error('Error parsing live position data:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('Live position WebSocket disconnected');
        setIsConnected(false);
        // Optional: implement reconnect logic
        setTimeout(connect, 5000); // Reconnect after 5 seconds
      };

      ws.current.onerror = (error) => {
        console.error('Live position WebSocket error:', error);
        ws.current.close();
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { position, isConnected };
};