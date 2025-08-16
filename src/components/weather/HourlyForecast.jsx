import React, { useCallback } from 'react';
import WeatherIcon from './WeatherIcon';
import Skeleton from '../common/Skeleton';
import { formatTemp, isNightTime } from '../../utils/weatherUtils';

export const HourlyForecastSkeleton = ({ scrollRef }) => (
  <div ref={scrollRef} className="flex space-x-8 overflow-x-auto scrollbar-hide pb-4">
    {[...Array(24)].map((_, index) => (
      <div key={index} className="flex-shrink-0 text-center w-24 p-4">
        <Skeleton className="h-6 w-16 mx-auto mb-2" />
        <Skeleton className="h-9 w-12 mx-auto mb-2" />
        <Skeleton className="h-8 w-8 mx-auto" />
      </div>
    ))}
  </div>
);

const HourlyForecast = ({ hours, isDayMode, scrollRef }) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isDay = useCallback((timeString) => !isNightTime(new Date(timeString)), []);
  const formatHourTime = useCallback((timeString) => {
    const date = new Date(timeString);
    const hour = date.getHours();
    if (hour === currentHour) return 'Now';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${displayHour}${ampm}`;
  }, [currentHour]);

  return (
    <div ref={scrollRef} className="flex space-x-8 overflow-x-auto scrollbar-hide pb-4">
      {hours.map((hour, index) => {
        const isCurrentHour = new Date(hour.time).getHours() === currentHour;
        return (
          <div key={index} className={`flex-shrink-0 text-center w-24 transition-all duration-300 p-4 ${isCurrentHour ? (isDayMode ? 'bg-black/10' : 'bg-white/10') + ' rounded-xl' : ''}`}>
            <div className={`text-base font-medium mb-2 ${isCurrentHour ? (isDayMode ? 'text-black' : 'text-white') : (isDayMode ? 'text-black/50' : 'text-white/50')}`}>
              {formatHourTime(hour.time)}
            </div>
            <div className={`text-3xl font-medium mb-2 ${isCurrentHour ? (isDayMode ? 'text-black' : 'text-white') : (isDayMode ? 'text-black/80' : 'text-white/80')}`}>
              {formatTemp(hour.temp_f)}°
            </div>
            <div className="flex justify-center">
              <WeatherIcon weatherCode={hour.weather_code} isDaytime={isDay(hour.time)} className={`w-8 h-8 ${isCurrentHour ? (isDayMode ? 'text-black/70' : 'text-white/70') : (isDayMode ? 'text-black/40' : 'text-white/40')}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HourlyForecast;
