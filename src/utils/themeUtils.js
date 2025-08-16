import { extractColorsFromImage } from './colorExtractor';

export async function createAlbumArtBackground(imageUrl) {
  try {
    await extractColorsFromImage(imageUrl);
    
    const overlayColor = 'rgba(0, 0, 0, 0.4)';
    
    return {
      backgroundImage: `
        linear-gradient(${overlayColor}, ${overlayColor}),
        url("${imageUrl}")
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      filter: 'blur(20px)',
      WebkitFilter: 'blur(20px)',
    };
  } catch (error) {
    console.error('Error creating album art background:', error);
    
    return {
      background: 'linear-gradient(135deg, #2d1b69 0%, #1a1a2e 100%)'
    };
  }
}

export function createBlurredImageBackground(imageUrl, _blurAmount = 20, overlayOpacity = 0.4) {
  return `
    linear-gradient(rgba(0, 0, 0, ${overlayOpacity}), rgba(0, 0, 0, ${overlayOpacity})),
    url("${imageUrl}")
  `;
}