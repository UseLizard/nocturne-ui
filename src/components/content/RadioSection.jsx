import React from 'react';
import HorizontalScroll from '../common/navigation/HorizontalScroll';
import ContentItemSkeleton from '../common/skeletons/ContentItemSkeleton';
import NowPlayingIndicator from '../common/NowPlayingIndicator';
import { usePlaybackStatus } from '../../hooks/usePlaybackStatus';
import { usePlayer } from '../../contexts/PlayerContext';

const RadioSection = ({
  accessToken,
  activeSection,
  radioMixes,
  isLoading,
  onOpenContent,
  scrollContainerRef,
  onItemSelect,
  playDJMix,
  refreshPlaybackState,
  setActiveSection
}) => {
  const { currentPlayback } = usePlayer();
  const playbackStatus = usePlaybackStatus(currentPlayback, radioMixes);

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
          key="dj-playlist"
          className="min-w-[280px] pl-2 mr-10 snap-start"
        >
          <div
            className="mt-10 aspect-square rounded-[12px] drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)] bg-white/10"
            style={{ width: 280, height: 280 }}
            onClick={() =>
              playDJMix().then((success) => {
                if (success) {
                  setTimeout(() => {
                    refreshPlaybackState();
                    setActiveSection("nowPlaying");
                  }, 500);
                }
              })
            }
          >
            <img
              src="/images/radio-cover/dj.webp"
              alt="DJ Playlist"
              className="w-full h-full rounded-[12px]"
            />
          </div>
          <h4 className="mt-2 text-[36px] font-[580] text-white truncate tracking-tight max-w-[280px]">
            DJ
          </h4>
          <h4 className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px] flex items-center">
            {playbackStatus.isPlayingDJ() ? (
              <>
                <NowPlayingIndicator />
                Now Playing
              </>
            ) : (
              "Made for You"
            )}
          </h4>
        </div>

        {isLoading.radioMixes ? (
          Array(5)
            .fill()
            .map((_, index) => (
              <ContentItemSkeleton key={`loading-${index}`} shape="square" />
            ))
        ) : radioMixes.length > 0 ? (
          radioMixes.map((mix, i) => (
            <div
              key={`${mix.id}-${i}`}
              className="min-w-[280px] pl-2 mr-10 snap-start"
              data-id={mix.id}
            >
              <div
                className="mt-10 aspect-square rounded-[12px] drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)]"
                style={{ width: 280, height: 280 }}
                onClick={() => onOpenContent(mix.id, "mix")}
              >
                {mix.images?.[0]?.url ? (
                  <img
                    src={mix.images[0].url}
                    alt={`${mix.name} Cover`}
                    className="w-full h-full rounded-[12px] aspect-square"
                  />
                ) : (
                  <div className="w-full h-full rounded-[12px] bg-white/10"></div>
                )}
              </div>
              <h4
                className="mt-2 text-[36px] font-[580] text-white truncate tracking-tight max-w-[280px]"
                onClick={() => onOpenContent(mix.id, "mix")}
              >
                {mix.name}
              </h4>
              <h4 className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px] flex items-center">
                {playbackStatus.isPlayingFromMix(mix.id) ? (
                  <>
                    <NowPlayingIndicator />
                    Now Playing
                  </>
                ) : (
                  `${mix.tracks ? mix.tracks.length : 0} Tracks`
                )}
              </h4>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-64 text-white/50 text-2xl">
            No mixes found
          </div>
        )}
        <div className="min-w-4 flex-shrink-0"></div>
      </div>
    </HorizontalScroll>
  );
};

export default RadioSection;