const COLOR_CACHE = new Map();
const MAX_CACHE_SIZE = 50;
const DEFAULT_COLORS = ["#191414", "#1E1B1B", "#222222", "#1A1A1A"];

function rgbToHex(r, g, b) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function calculateBrightness(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function limitBrightness(r, g, b, maxBrightness = 180) {
  const brightness = calculateBrightness(r, g, b);
  if (brightness <= maxBrightness) return [r, g, b];
  
  const factor = maxBrightness / brightness;
  return [
    Math.round(r * factor),
    Math.round(g * factor),
    Math.round(b * factor)
  ];
}

function enhanceDarkImage(colors) {
  let accentColor = null;
  
  for (const color of colors) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    if (r > 40 || g > 40 || b > 40) {
      accentColor = { r, g, b };
      break;
    }
  }
  
  if (!accentColor) {
    accentColor = { r: 60, g: 45, b: 80 };
  }
  
  return [
    rgbToHex(Math.round(accentColor.r * 0.4), Math.round(accentColor.g * 0.4), Math.round(accentColor.b * 0.4)),
    rgbToHex(Math.round(accentColor.r * 0.25), Math.round(accentColor.g * 0.25), Math.round(accentColor.b * 0.25)),
    rgbToHex(accentColor.r, accentColor.g, accentColor.b),
    rgbToHex(Math.round(accentColor.r * 0.15), Math.round(accentColor.g * 0.15), Math.round(accentColor.b * 0.15))
  ];
}

export function extractColorsFromImage(imageUrl) {
  if (COLOR_CACHE.has(imageUrl)) {
    return Promise.resolve(COLOR_CACHE.get(imageUrl));
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const size = 64;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;
        const colorMap = new Map();

        for (let i = 0; i < pixels.length; i += 16) {
          const [r, g, b] = limitBrightness(pixels[i], pixels[i + 1], pixels[i + 2]);
          const hex = rgbToHex(r, g, b);
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }

        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([color]) => color);

        if (sortedColors.length === 0) {
          resolve(DEFAULT_COLORS);
          return;
        }

        const averageBrightness = sortedColors.reduce((sum, color) => {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return sum + calculateBrightness(r, g, b);
        }, 0) / sortedColors.length;

        let finalColors;
        if (averageBrightness < 35) {
          finalColors = enhanceDarkImage(sortedColors);
        } else {
          finalColors = sortedColors.slice(0, 4);
          while (finalColors.length < 4) {
            finalColors.push(sortedColors[0] || "#191414");
          }
        }

        if (COLOR_CACHE.size >= MAX_CACHE_SIZE) {
          const firstKey = COLOR_CACHE.keys().next().value;
          COLOR_CACHE.delete(firstKey);
        }
        COLOR_CACHE.set(imageUrl, finalColors);

        resolve(finalColors);
      } catch (err) {
        console.error("Error extracting colors:", err);
        resolve(DEFAULT_COLORS);
      }
    };

    img.onerror = () => resolve(DEFAULT_COLORS);
    img.src = imageUrl;
  });
}
