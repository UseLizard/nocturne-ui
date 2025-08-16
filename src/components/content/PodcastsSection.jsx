import React from 'react';
import HorizontalScroll from '../common/navigation/HorizontalScroll';
import ContentItemSkeleton from '../common/skeletons/ContentItemSkeleton';

const PodcastsSection = ({
  accessToken,
  activeSection,
  userShows,
  isLoading,
  onOpenContent,
  scrollContainerRef,
  onItemSelect
}) => {
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
        {isLoading.userShows ? (
          Array(5)
            .fill()
            .map((_, index) => (
              <ContentItemSkeleton key={`loading-${index}`} shape="square" />
            ))
        ) : userShows.length > 0 ? (
          userShows.map((item, i) => {
            const show = item.show;
            return (
              <div
                key={`${show.id}-${i}`}
                className="min-w-[280px] pl-2 mr-10 snap-start"
                data-id={show.id}
              >
                <div
                  className="mt-10 aspect-square rounded-[12px] drop-shadow-[0_8px_5px_rgba(0,0,0,0.25)]"
                  style={{ width: 280, height: 280 }}
                  onClick={() => onOpenContent(show.id, "show")}
                >
                  {show.images?.[1]?.url || show.images?.[0]?.url ? (
                    <img
                      src={show.images[1]?.url || show.images[0]?.url}
                      alt={`${show.name} Cover`}
                      className="w-full h-full rounded-[12px] aspect-square"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[12px] bg-white/10"></div>
                  )}
                </div>
                <h4
                  className="mt-2 text-[36px] font-[580] text-white truncate tracking-tight max-w-[280px]"
                  onClick={() => onOpenContent(show.id, "show")}
                >
                  {show.name}
                </h4>
                <h4 className="text-[32px] font-[560] text-white/60 truncate tracking-tight max-w-[280px]">
                  {show.publisher}
                </h4>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center w-full h-64 text-white/50 text-2xl">
            No podcasts found
          </div>
        )}
        <div className="min-w-4 flex-shrink-0"></div>
      </div>
    </HorizontalScroll>
  );
};

export default PodcastsSection;