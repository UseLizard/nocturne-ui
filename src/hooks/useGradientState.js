import { useMemo, useCallback, useState } from 'react';

export function useGradientState(activeSection = null) {
  const [imageURL, setImageURL] = useState(null);
  const [imageSize, setImageSize] = useState(0);
  const [section, setSection] = useState(activeSection);
  const [trackName, setTrackName] = useState(null);

  const gradientState = useMemo(
    () => ({
      imageURL,
      imageSize,
      section,
      trackName,
    }),
    [imageURL, imageSize, section, trackName],
  );

  const setGradientState = useCallback(
    (newImageURL = null, newSection = null, newImageSize = 0, newTrackName = null) => {
      setImageURL(newImageURL);
      setSection(newSection);
      setImageSize(newImageSize);
      setTrackName(newTrackName);
    },
    [],
  );

  return [gradientState, setGradientState];
}
