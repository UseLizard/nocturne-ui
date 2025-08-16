import React from 'react';
import HorizontalScroll from '../common/navigation/HorizontalScroll';
import ContentItemSkeleton from '../common/skeletons/ContentItemSkeleton';
import NowPlayingIndicator from '../common/NowPlayingIndicator';
import { usePlaybackStatus } from '../../hooks/usePlaybackStatus';
import { usePlayer } from '../../contexts/PlayerContext';
import { formatFollowerCount } from '../../utils/spotifyUtils';

const ArtistsSection = ({
  accessToken,
  activeSection,
  topArtists,
  isLoading,
  onOpenContent,
  scrollContainerRef,
  onItemSelect
}) => {
  const { currentPlayback } = usePlayer();
  const playbackStatus = usePlaybackStatus(currentPlayback);

  return (
    <HorizontalScroll
      containerRef={scrollContainerRef}
      accessToken={accessToken}
      activeSection={activeSection}
      onItemSelect={onItemSelect}
    >
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scroll-container p-2 snap-x snap-mandatory"
        style={{ willChange: "transform" }}
      >
        {isLoading.topArtists ? (
          Array(5)
            .fill()
            .map((_, index) => (
              <ContentItemSkeleton key={`loading-artist-${index}`} shape="circle" />
            ))
        ) : topArtists.length > 0 ? (
          topArtists.map((artist) => (
            <div
              key={artist.id}
              className="min-w-[280px] pl-2 mr-10 snap-start"
              data-id={artist.id}
            >
              <div
                className="mt-10 aspect-square rounded-full drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)]"
                style={{ width: 280, height: 280 }}
                onClick={() => onOpenContent(artist.id, "artist")}
              >
                {artist.images?.[1]?.url ? (
                  <img
                    src={artist.images[1].url}
                    alt={`${artist.name} Profile`}
                    className="w-full h-full rounded-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white/10"></div>
                )}
              </div>
              <h4
                className="mt-2 text-[36px] font-[580] text-white truncate tracking-tight max-w-[280px]"
                onClick={() => onOpenContent(artist.id, "artist")}
              >
                {artist.name}
              </h4>
              <h4 className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px] flex items-center">
                {playbackStatus.isFromCurrentlyPlayingArtist(artist.id) ? (
                  <>
                    <NowPlayingIndicator />
                    Now Playing
                  </>
                ) : (
                  `${formatFollowerCount(artist.followers.total)} Followers`
                )}
              </h4>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-64 text-white/50 text-2xl">
            No artists found
          </div>
        )}
        <div className="min-w-4 flex-shrink-0"></div>
      </div>
    </HorizontalScroll>
  );
};

export default ArtistsSection;