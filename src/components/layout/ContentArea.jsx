import React, { useRef } from 'react';
import Settings from '../settings/Settings';
import LocalMediaPlayer from '../media/LocalMediaPlayer';
import WeatherView from '../weather/WeatherView';
import RecentsSection from '../content/RecentsSection';
import LibrarySection from '../content/LibrarySection';
import ArtistsSection from '../content/ArtistsSection';
import RadioSection from '../content/RadioSection';
import PodcastsSection from '../content/PodcastsSection';
import { useNavigation } from '../../hooks/useNavigation';
import { useSpotifyPlayerControls } from '../../hooks/useSpotifyPlayerControls';
import { usePlayer } from '../../contexts/PlayerContext';

const ContentArea = ({
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
  onOpenContent,
  onOpenDonationModal,
  updateGradientColors
}) => {
  const { currentlyPlayingAlbum } = usePlayer();
  const scrollContainerRef = useRef(null);
  const itemWidth = 290;
  const { playDJMix } = useSpotifyPlayerControls(accessToken);

  const { scrollByAmount } = useNavigation({
    containerRef: scrollContainerRef,
    activeSection,
    enableScrollTracking: true,
    enableWheelNavigation: true,
    enableKeyboardNavigation: false,
    enableItemSelection: false,
    itemWidth: itemWidth,
    itemGap: 40,
    currentlyPlayingId: currentlyPlayingAlbum?.id
  });

  // Item selection handlers
  const handleRecentsItemSelect = (index, item) => {
    if (index !== -1 && recentAlbums[index]) {
      const album = recentAlbums[index];
      onOpenContent(album.id, "album");
    }
  };

  const handleLibraryItemSelect = (index, item) => {
    if (index === 0) {
      onOpenContent("liked", "liked-songs");
      return;
    }

    const adjustedIndex = index - 1;
    const playlists = userPlaylists.filter(
      (item) =>
        item?.type === "playlist" && item.id !== "37i9dQZF1EYkqdzj48dyYq"
    );

    if (adjustedIndex >= 0 && adjustedIndex < playlists.length) {
      const playlist = playlists[adjustedIndex];
      onOpenContent(playlist.id, "playlist");
    }
  };

  const handleArtistsItemSelect = (index, item) => {
    if (index !== -1 && topArtists[index]) {
      const artist = topArtists[index];
      onOpenContent(artist.id, "artist");
    }
  };

  const handleRadioItemSelect = (index, item) => {
    if (index === 0) {
      return;
    }

    const adjustedIndex = index - 1;
    if (adjustedIndex >= 0 && adjustedIndex < radioMixes.length) {
      const mix = radioMixes[adjustedIndex];
      onOpenContent(mix.id, "mix");
    }
  };

  const handlePodcastsItemSelect = (index, item) => {
    if (index !== -1 && userShows[index]) {
      const show = userShows[index].show;
      onOpenContent(show.id, "show");
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "recents":
        return (
          <RecentsSection
            accessToken={accessToken}
            activeSection={activeSection}
            recentAlbums={recentAlbums}
            isLoading={isLoading}
            onOpenContent={onOpenContent}
            scrollContainerRef={scrollContainerRef}
            onItemSelect={handleRecentsItemSelect}
          />
        );
      case "library":
        return (
          <LibrarySection
            accessToken={accessToken}
            activeSection={activeSection}
            userPlaylists={userPlaylists}
            likedSongs={likedSongs}
            isLoading={isLoading}
            onOpenContent={onOpenContent}
            scrollContainerRef={scrollContainerRef}
            onItemSelect={handleLibraryItemSelect}
          />
        );
      case "artists":
        return (
          <ArtistsSection
            accessToken={accessToken}
            activeSection={activeSection}
            topArtists={topArtists}
            isLoading={isLoading}
            onOpenContent={onOpenContent}
            scrollContainerRef={scrollContainerRef}
            onItemSelect={handleArtistsItemSelect}
          />
        );
      case "radio":
        return (
          <RadioSection
            accessToken={accessToken}
            activeSection={activeSection}
            radioMixes={radioMixes}
            isLoading={isLoading}
            onOpenContent={onOpenContent}
            scrollContainerRef={scrollContainerRef}
            onItemSelect={handleRadioItemSelect}
            playDJMix={playDJMix}
            refreshPlaybackState={refreshPlaybackState}
            setActiveSection={setActiveSection}
          />
        );
      case "podcasts":
        return (
          <PodcastsSection
            accessToken={accessToken}
            activeSection={activeSection}
            userShows={userShows}
            isLoading={isLoading}
            onOpenContent={onOpenContent}
            scrollContainerRef={scrollContainerRef}
            onItemSelect={handlePodcastsItemSelect}
          />
        );
      case "media":
        return <LocalMediaPlayer onClose={() => setActiveSection("recents")} updateGradientColors={updateGradientColors} />;
      case "settings":
        return (
          <Settings
            accessToken={accessToken}
            onOpenDonationModal={onOpenDonationModal}
            setActiveSection={setActiveSection}
          />
        );
      case "weather":
        return <WeatherView setActiveSection={setActiveSection} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-white/50 text-2xl">
            {activeSection} section will be implemented next
          </div>
        );
    }
  };

  return (
    <div className="transition-smooth">
      {renderContent()}
    </div>
  );
};

export default ContentArea;