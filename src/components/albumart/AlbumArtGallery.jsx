import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import { ChevronLeftIcon } from '../common/icons';

const AlbumArtGallery = ({ setActiveSection }) => {
  const [albumArtList, setAlbumArtList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = React.useRef(null);

  useNavigation({
    containerRef,
    enableEscapeKey: true,
    onEscape: () => setActiveSection("recents"),
    activeSection: "albumart",
  });

  useEffect(() => {
    fetchAlbumArtList();
  }, []);

  const fetchAlbumArtList = async () => {
    try {
      setLoading(true);
      // Fetch the list of available album art from the API
      const response = await fetch('http://172.16.42.2:5000/api/albumart', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch album art list');
      }
      
      const data = await response.json();
      setAlbumArtList(data.files || []);
    } catch (err) {
      console.error('Error fetching album art:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveSection("recents");
  };

  return (
    <div ref={containerRef} className="min-h-screen w-full fadeIn-animation">
      {/* Header */}
      <div className="flex items-center px-12 pt-10 pb-6">
        <button
          onClick={handleBack}
          className="mr-6 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronLeftIcon className="w-8 h-8 text-white" />
        </button>
        <h1 className="text-[48px] font-[580] text-white tracking-tight">
          Album Art Gallery
        </h1>
      </div>

      {/* Content */}
      <div className="px-12 pb-12">
        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            {Array(9).fill().map((_, i) => (
              <div
                key={`loading-${i}`}
                className="aspect-square rounded-[12px] bg-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-red-400 text-xl mb-4">Error loading album art</div>
            <div className="text-white/60 text-sm mb-4">{error}</div>
            <button
              onClick={fetchAlbumArtList}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : albumArtList.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white/50 text-xl">No album art found on device</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {albumArtList.map((item, index) => (
              <div
                key={item.filename || index}
                className="group"
              >
                <div className="aspect-square rounded-[12px] overflow-hidden drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform relative">
                  <img
                    src={`http://172.16.42.2:5000/api/albumart/${item.filename || item}`}
                    alt={`${item.album || 'Album art'} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/not-playing.webp';
                    }}
                  />
                  {/* Hover overlay with album/artist info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.album && (
                      <div className="text-white text-sm font-semibold truncate">{item.album}</div>
                    )}
                    {item.artist && (
                      <div className="text-white/80 text-xs truncate">{item.artist}</div>
                    )}
                  </div>
                </div>
                {/* Always visible info below image */}
                <div className="mt-2">
                  {item.album && (
                    <div className="text-white text-sm font-medium truncate">{item.album}</div>
                  )}
                  {item.artist && (
                    <div className="text-white/60 text-xs truncate">{item.artist}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumArtGallery;