import React, { useState, useEffect, useRef } from 'react';
import DoubleBufferedImage from './DoubleBufferedImage';

/**
 * LiveAlbumArt - A component that displays album art that automatically updates
 * when nocturned service receives new album art via WebSocket notifications
 */


const LiveAlbumArt = ({ 
  className, 
  fallback, 
  transitionDuration = 750,
  onLoad 
}) => {
  const [albumArtUrl, setAlbumArtUrl] = useState('');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const updateAlbumArt = () => {
    const timestamp = Date.now();
    const finalUrl = `http://localhost:5000/api/v2/album-art/current?t=${timestamp}`;
    console.log('🎨 LIVE ALBUM ART: Updating album art URL for media/album_art_available message', { finalUrl, timestamp });
    setAlbumArtUrl(finalUrl);
  };

  const connectWebSocket = () => {
    if (!mountedRef.current) return;

    try {
      console.log('🎨 LIVE ALBUM ART: Connecting to WebSocket...');
      wsRef.current = new WebSocket('ws://localhost:5000/ws');
      
      wsRef.current.onopen = () => {
        console.log('🎨 LIVE ALBUM ART: WebSocket connected');
        updateAlbumArt();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'media/album_art_available') {
            console.log('🎨 LIVE ALBUM ART: Received media/album_art_available WebSocket message:', data);
            updateAlbumArt();
          }
        } catch (error) {
          console.error('🎨 LIVE ALBUM ART: Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectWebSocket();
            }
          }, 2000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('🎨 LIVE ALBUM ART: WebSocket error:', error);
      };
    } catch (error) {
      console.error('🎨 LIVE ALBUM ART: Failed to create WebSocket connection:', error);
      if (mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectWebSocket();
          }
        }, 2000);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    connectWebSocket();

    return () => {
      mountedRef.current = false;
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  const handleImageLoad = async (event) => {
    if (onLoad) {
      onLoad(event);
    }
  };


  return (
    <div className="relative w-full h-full">
      <DoubleBufferedImage
        src={albumArtUrl}
        alt="Live Album Art"
        className={className}
        onLoad={handleImageLoad}
        fallback={fallback}
        transitionDuration={transitionDuration}
      />
    </div>
  );
};

export default LiveAlbumArt;