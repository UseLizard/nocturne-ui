import React from 'react';
import HorizontalScroll from '../common/navigation/HorizontalScroll';
import ContentItemSkeleton from '../common/skeletons/ContentItemSkeleton';
import { usePlaybackStatus } from '../../hooks/usePlaybackStatus';
import { usePlayer } from '../../contexts/PlayerContext';

const RecentsSection = ({
  accessToken,
  activeSection,
  recentAlbums,
  isLoading,
  onOpenContent,
  scrollContainerRef,
  onItemSelect
}) => {
  const { currentPlayback, currentlyPlayingAlbum } = usePlayer();
  const playbackStatus = usePlaybackStatus(currentPlayback);

  return (
    <HorizontalScroll
      key="recents"
      containerRef={scrollContainerRef}
      currentlyPlayingId={currentlyPlayingAlbum?.id}
      accessToken={accessToken}
      activeSection={activeSection}
      onItemSelect={onItemSelect}
    >
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scroll-container p-2 snap-x snap-mandatory"
        style={{ willChange: "transform" }}
      >
        {isLoading.recentAlbums 
          ? (Array(5)
              .fill()
              .map((_, index) => (
                <ContentItemSkeleton key={`loading-${index}`} shape="square" />
              ))
            ) 
          : recentAlbums.length > 0 
          ? (recentAlbums.map((album) => (
            <div
              key={album.id}
              className="min-w-[280px] pl-2 mr-10 snap-start"
              data-id={album.id}
              data-playing={album.id === currentlyPlayingAlbum?.id ? "true" : "false"}
            >
              <div
                className="mt-10 aspect-square rounded-[12px] drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)]"
                style={{ width: 280, height: 280 }}
                onClick={() => album.type !== 'local-track' && onOpenContent(album.id, album.type === 'show' ? "show" : "album")}
              >
                {album.images?.[1]?.url && album.type !== 'local-track' ? (
                  <img
                    src={album.images[1].url}
                    alt="Album Cover"
                    className="w-full h-full rounded-[12px] aspect-square"
                  />
                ) : album.type === 'local-track' ? (
                  <img
                    src="/images/not-playing.webp"
                    alt="Local File"
                    className="w-full h-full rounded-[12px] aspect-square"
                  />
                ) : (
                  <div className="w-full h-full rounded-[12px] bg-white/10"></div>
                )}
              </div>

              <h4
                className="mt-2 text-[36px] font-[580] text-white truncate tracking-tight max-w-[280px]"
                onClick={() => album.type !== 'local-track' && onOpenContent(album.id, album.type === 'show' ? "show" : "album")}
              >
                {album.name}
              </h4>

              {album.type === 'show' ? (
                album.publisher && (
                  <h4 className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px]">
                    {album.publisher}
                  </h4>
                )
              ) : (
                album.artists?.[0] && (
                  <h4
                    className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px]"
                    onClick={() => onOpenContent(album.artists[0].id, "artist")}
                  >
                    {album.artists.map((artist) => artist.name).join(", ")}
                  </h4>
                )
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-64 text-white/50 text-2xl">
            No recent albums found
          </div>
        )}
        <div className="min-w-4 flex-shrink-0"></div>
      </div>
    </HorizontalScroll>
  );
};

export default RecentsSection;