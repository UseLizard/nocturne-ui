const getRgbFromData = (data, index) => [data[index], data[index + 1], data[index + 2]];

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');

const getSimplePalette = (imageData, quality = 10) => {
  const { data, width, height } = imageData;
  const colors = new Set();
  
  // Sample pixels from a grid
  for (let y = 0; y < height; y += quality) {
    for (let x = 0; x < width; x += quality) {
      const index = (y * width + x) * 4;
      const rgb = getRgbFromData(data, index);
      // Primitive check to avoid pure black/white if possible
      if (rgb[0] > 10 && rgb[0] < 245 && rgb[1] > 10 && rgb[1] < 245 && rgb[2] > 10 && rgb[2] < 245) {
        colors.add(rgbToHex(rgb[0], rgb[1], rgb[2]));
      }
    }
  }
  
  // If we didn't get any colors, do a less picky pass
  if (colors.size < 2) {
     for (let y = 0; y < height; y += quality) {
        for (let x = 0; x < width; x += quality) {
            const index = (y * width + x) * 4;
            const rgb = getRgbFromData(data, index);
            colors.add(rgbToHex(rgb[0], rgb[1], rgb[2]));
        }
    }
  }

  return Array.from(colors);
};

export const extractColorsFromImage = (imageElement, numColors = 5) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      
      const { width, height } = imageElement;
      canvas.width = width;
      canvas.height = height;

      context.drawImage(imageElement, 0, 0, width, height);
      
      const imageData = context.getImageData(0, 0, width, height);
      const palette = getSimplePalette(imageData, 20); // quality = 20

      // Basic sorting by brightness (crude but effective)
      const sortedPalette = palette.sort((a, b) => {
        const brightnessA = (parseInt(a.slice(1, 3), 16) + parseInt(a.slice(3, 5), 16) + parseInt(a.slice(5, 7), 16));
        const brightnessB = (parseInt(b.slice(1, 3), 16) + parseInt(b.slice(3, 5), 16) + parseInt(b.slice(5, 7), 16));
        return brightnessB - brightnessA;
      });
      
      resolve(sortedPalette.slice(0, numColors));
    } catch (error) {
      console.error("Error extracting colors:", error);
      reject(error);
    }
  });
};