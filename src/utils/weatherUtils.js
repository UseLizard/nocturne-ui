export const formatTemp = (temp) => Math.round(temp);

export const isNightTime = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 18 || hour < 6;
};

export const getGradient = (isDay) => {
  const hour = new Date().getHours();
  if (isDay) {
    if (hour >= 6 && hour < 12) return 'linear-gradient(135deg, #fefefe 0%, #f0f8ff 30%, #e6f3ff 70%, #d1e9ff 100%)';
    if (hour >= 12 && hour < 18) return 'linear-gradient(135deg, #fefefe 0%, #faf7f0 30%, #f5f0e8 70%, #ede4d3 100%)';
    return 'linear-gradient(135deg, #fefefe 0%, #f0f4f8 30%, #dbe7f0 70%, #c7d2e7 100%)';
  } else {
    if (hour >= 22 || hour < 4) return 'linear-gradient(135deg, #1a1a2e 0%, #2d2d55 30%, #3a3a6a 70%, #4a4a7a 100%)';
    if (hour >= 4 && hour < 6) return 'linear-gradient(135deg, #2d1b69 0%, #4c1d95 30%, #6b2fb5 70%, #8a41d5 100%)';
    return 'linear-gradient(135deg, #16213e 0%, #0f4c75 30%, #1e5a8a 70%, #2d6b9f 100%)';
  }
};
