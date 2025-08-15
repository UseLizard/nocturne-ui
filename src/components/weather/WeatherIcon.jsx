import React from 'react';

const WeatherIcon = ({ weatherCode, className = "", isDaytime = true }) => {
  const getIconPath = (code, isDay = true) => {
    switch (code) {
      case 0: // Clear
        return isDay ? '/icons/weather/clear-day.svg' : '/icons/weather/clear-night.svg';
      case 1: // Partly cloudy
        return isDay ? '/icons/weather/partly-cloudy-day.svg' : '/icons/weather/partly-cloudy-night.svg';
      case 2: 
      case 3: // Cloudy
        return '/icons/weather/cloudy.svg';
      case 45: 
      case 48: // Fog
        return '/icons/weather/fog.svg';
      case 51: 
      case 53: 
      case 55: // Drizzle
        return '/icons/weather/drizzle.svg';
      case 61: 
      case 63: 
      case 65: // Rain
        return '/icons/weather/rain.svg';
      case 71: 
      case 73: 
      case 75: 
      case 77: // Snow
        return '/icons/weather/snow.svg';
      case 80: 
      case 81: 
      case 82: // Showers
        return '/icons/weather/showers.svg';
      case 85: 
      case 86: // Snow showers
        return '/icons/weather/snow-showers.svg';
      case 95: 
      case 96: 
      case 99: // Thunderstorm
        return '/icons/weather/thunderstorm.svg';
      default:
        return '/icons/weather/not-available.svg';
    }
  };

  const iconPath = getIconPath(weatherCode, isDaytime);

  return (
    <img
      src={iconPath}
      alt={`Weather condition ${weatherCode}`}
      className={className}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
    />
  );
};

export default WeatherIcon;