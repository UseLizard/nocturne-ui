import { useMemo } from 'react';

export function usePlaybackStatus(currentPlayback, radioMixes = []) {
  return useMemo(() => ({
    isPlayingLikedSongs: () => {
      return (
        currentPlayback?.context?.uri?.includes("collection") ||
        (currentPlayback?.context === null &&
          localStorage.getItem("playingLikedSongs") === "true")
      );
    },

    isPlayingFromPlaylist: (playlistId) => {
      return currentPlayback?.context?.uri === `spotify:playlist:${playlistId}`;
    },

    isFromCurrentlyPlayingArtist: (artistId) => {
      return currentPlayback?.item?.artists?.some((a) => a.id === artistId);
    },

    isPlayingFromMix: (mixId) => {
      if (mixId.startsWith('spotify-')) {
        const spotifyMix = radioMixes.find(mix => mix.id === mixId && mix.type === "spotify-radio");
        if (spotifyMix) {
          return currentPlayback?.context?.uri === spotifyMix.uri;
        }
      }
      
      const playingMixId = localStorage.getItem(`playingMix-${mixId}`);
      return currentPlayback?.context?.uri === playingMixId;
    },

    isPlayingDJ: () => {
      return currentPlayback?.context?.uri === "spotify:playlist:37i9dQZF1EYkqdzj48dyYq";
    }
  }), [currentPlayback, radioMixes]);
}