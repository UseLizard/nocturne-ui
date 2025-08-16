import React from 'react';
import HorizontalScroll from '../common/navigation/HorizontalScroll';
import ContentItemSkeleton from '../common/skeletons/ContentItemSkeleton';
import NowPlayingIndicator from '../common/NowPlayingIndicator';
import { usePlaybackStatus } from '../../hooks/usePlaybackStatus';
import { usePlayer } from '../../contexts/PlayerContext';

const LibrarySection = ({
  accessToken,
  activeSection,
  userPlaylists,
  likedSongs,
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
        <div
          key="liked-songs"
          className="min-w-[280px] pl-2 mr-10 snap-start"
        >
          <div
            className="mt-10 aspect-square rounded-[12px] drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)]"
            style={{ width: 280, height: 280 }}
            onClick={() => onOpenContent("liked", "liked-songs")}
          >
            <img
              src={likedSongs.images[0].url}
              alt="Liked Songs"
              className="w-full h-full rounded-[12px] aspect-square"
            />
          </div>
          <h4
            className="mt-2 text-[36px] font-[580] text-white truncate tracking-tight max-w-[280px]"
            onClick={() => onOpenContent("liked", "liked-songs")}
          >
            {likedSongs.name}
          </h4>
          <h4 className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px] flex items-center">
            {playbackStatus.isPlayingLikedSongs() ? (
              <>
                <NowPlayingIndicator />
                Now Playing
              </>
            ) : (
              `${likedSongs.tracks.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} Songs`
            )}
          </h4>
        </div>

        {isLoading.userPlaylists ? (
          Array(3)
            .fill()
            .map((_, index) => (
              <ContentItemSkeleton key={`loading-playlist-${index}`} shape="square" />
            ))
        ) : userPlaylists.length > 0 ? (
          userPlaylists
            .filter(
              (item) =>
                item?.type === "playlist" &&
                item.id !== "37i9dQZF1EYkqdzj48dyYq" &&
                (item.tracks?.total > 0)
            )
            .map((playlist) => (
              <div
                key={`playlist-${playlist.id}`}
                className="min-w-[280px] pl-2 mr-10 snap-start"
              >
                <div
                  className="mt-10 aspect-square rounded-[12px] drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)]"
                  style={{ width: 280, height: 280 }}
                  onClick={() => onOpenContent(playlist.id, "playlist")}
                >
                  {playlist?.images?.length > 0 ? (
                    <img
                      src={playlist.images[1]?.url || playlist.images[0].url}
                      alt={`${playlist.name} Cover`}
                      className="w-full h-full rounded-[12px] aspect-square"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[12px] bg-white/10"></div>
                  )}
                </div>
                <h4 className="mt-2 text-[36px] font-[580] text-white truncate tracking-tight max-w-[280px]">
                  {playlist.name}
                </h4>
                <h4 className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px] flex items-center">
                  {playbackStatus.isPlayingFromPlaylist(playlist.id) ? (
                    <>
                      <NowPlayingIndicator />
                      Now Playing
                    </>
                  ) : (
                    `${(playlist.tracks?.total || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} Songs`
                  )}
                </h4>
              </div>
            ))
        ) : (
          <div className="flex items-center justify-center w-full h-64 text-white/50 text-2xl">
            No playlists found
          </div>
        )}
        <div className="min-w-4 flex-shrink-0"></div>
      </div>
    </HorizontalScroll>
  );
};

export default LibrarySection;