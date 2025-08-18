import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, RefreshIcon } from '../common/icons';

const GradientViewer = ({ setActiveSection }) => {
  const [gradientImage, setGradientImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLatestGradient = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get the list of gradient files to find the most recent one
      const response = await fetch('http://localhost:5000/api/gradients/latest');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch gradient: ${response.status}`);
      }
      
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      setGradientImage(imageUrl);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Error fetching gradient:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestGradient();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLatestGradient, 30000);
    
    return () => {
      clearInterval(interval);
      if (gradientImage) {
        URL.revokeObjectURL(gradientImage);
      }
    };
  }, []);

  const handleRefresh = () => {
    fetchLatestGradient();
  };

  const handleBack = () => {
    setActiveSection('recents');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
        <p className="text-xl text-white/80">Loading gradient...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-white p-8">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Error loading gradient</p>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshIcon className="h-5 w-5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black/20 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-black/10">
        <button
          onClick={handleBack}
          className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
          <span className="text-xl font-medium">Back</span>
        </button>
        
        <h1 className="text-3xl font-bold">Gradient Viewer</h1>
        
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {gradientImage ? (
          <div className="w-full max-w-4xl">
            <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
              <img
                src={gradientImage}
                alt="Latest gradient"
                className="w-full h-auto rounded-lg shadow-2xl border border-white/20"
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
              />
              
              {lastUpdated && (
                <div className="mt-4 text-center">
                  <p className="text-white/60 text-sm">
                    Last updated: {lastUpdated}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl text-white/60">No gradient available</p>
            <p className="text-white/40 mt-2">The gradient will appear here when generated</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-6 bg-black/10 border-t border-white/10">
        <p className="text-center text-white/50 text-sm">
          This view shows the most recent gradient generated from album artwork
        </p>
      </div>
    </div>
  );
};

export default GradientViewer;