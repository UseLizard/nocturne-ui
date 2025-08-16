import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../common/navigation/Sidebar';
import ContentArea from './ContentArea';
import { usePlayer } from '../../contexts/PlayerContext';
import DonationQRModal from '../common/modals/DonationQRModal';

const HomeLayout = ({
  accessToken,
  activeSection,
  setActiveSection,
  recentAlbums,
  userPlaylists,
  likedSongs,
  topArtists,
  radioMixes,
  userShows,
  isLoading,
  refreshData,
  refreshPlaybackState,
  onOpenContent
}) => {
  console.log('🏠 HOME LAYOUT: Component rendering', {
    activeSection,
    timestamp: new Date().toISOString()
  });
  
  const { currentPlayback, currentlyPlayingAlbum } = usePlayer();
  const [newAlbumAdded, setNewAlbumAdded] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const handleOpenDonationModal = () => {
    setShowDonationModal(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeSection === "recents") {
          setActiveSection("nowPlaying");
        } else if (activeSection !== "nowPlaying" && activeSection !== "settings") {
          setActiveSection("recents");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, setActiveSection]);

  // Refresh playback state when needed
  useEffect(() => {
    if (activeSection === "nowPlaying") {
      refreshPlaybackState();
    }
  }, [activeSection, refreshPlaybackState]);

  // Handle new album scroll
  useEffect(() => {
    if (recentAlbums.length > 0 && activeSection === "recents") {
      setNewAlbumAdded(true);
    }
  }, [recentAlbums, activeSection]);

  // Section logging
  useEffect(() => {
    console.log('🏠 HOME LAYOUT: Active section changed to:', activeSection);
  }, [activeSection]);

  // Render full-screen sections
  if (activeSection === "media" || activeSection === "weather") {
    console.log('🏠 HOME LAYOUT: Rendering full-screen section:', activeSection);
    return (
      <div className="relative min-h-screen rounded-2xl overflow-hidden">
        <div className="slideIn-animation">
          <ContentArea
            accessToken={accessToken}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            recentAlbums={recentAlbums}
            userPlaylists={userPlaylists}
            likedSongs={likedSongs}
            topArtists={topArtists}
            radioMixes={radioMixes}
            userShows={userShows}
            isLoading={isLoading}
            refreshData={refreshData}
            refreshPlaybackState={refreshPlaybackState}
            onOpenContent={onOpenContent}
            onOpenDonationModal={handleOpenDonationModal}
          />
        </div>
        {showDonationModal && (
          <DonationQRModal onClose={() => setShowDonationModal(false)} />
        )}
      </div>
    );
  }

  // Render main layout with sidebar
  return (
    <div className="relative min-h-screen rounded-2xl overflow-hidden bg-transparent">
      <div className="relative z-10 grid grid-cols-[2.2fr_3fr] fadeIn-animation text-white">
        <div
          className="h-screen overflow-y-auto pb-12 pl-8 relative scroll-container scroll-smooth"
          style={{ willChange: "transform" }}
        >
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </div>

        <div className="h-screen overflow-y-auto">
          <ContentArea
            accessToken={accessToken}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            recentAlbums={recentAlbums}
            userPlaylists={userPlaylists}
            likedSongs={likedSongs}
            topArtists={topArtists}
            radioMixes={radioMixes}
            userShows={userShows}
            isLoading={isLoading}
            refreshData={refreshData}
            refreshPlaybackState={refreshPlaybackState}
            onOpenContent={onOpenContent}
            onOpenDonationModal={handleOpenDonationModal}
          />
        </div>
      </div>

      {showDonationModal && (
        <DonationQRModal onClose={() => setShowDonationModal(false)} />
      )}
    </div>
  );
};

export default HomeLayout;