export function createSpotifyUri(type, id) {
  return `spotify:${type}:${id}`;
}

export function getSpotifyUriTypes() {
  return {
    ALBUM: 'album',
    PLAYLIST: 'playlist', 
    ARTIST: 'artist',
    SHOW: 'show',
    EPISODE: 'episode',
    TRACK: 'track'
  };
}

export function formatFollowerCount(count) {
  if (count >= 1000000) {
    const millions = count / 1000000;
    return millions % 1 === 0
      ? `${Math.floor(millions)}M`
      : `${millions.toFixed(1)}M`;
  }
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}