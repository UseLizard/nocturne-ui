import React from 'react';
import WeatherIcon from './WeatherIcon';
import Skeleton from '../common/Skeleton';
import { formatTemp } from '../../utils/weatherUtils';

export const WeeklyForecastSkeleton = ({ scrollRef }) => (
  <div ref={scrollRef} className="flex space-x-8 overflow-x-auto scrollbar-hide pb-4">
    {[...Array(7)].map((_, index) => (
      <div key={index} className="flex-shrink-0 text-center w-24 p-4">
        <Skeleton className="h-6 w-16 mx-auto mb-1" />
        <Skeleton className="h-5 w-12 mx-auto mb-3" />
        <Skeleton className="h-6 w-10 mx-auto mb-1" />
        <Skeleton className="h-5 w-10 mx-auto mb-3" />
        <Skeleton className="h-10 w-10 mx-auto" />
      </div>
    ))}
  </div>
);

const WeeklyForecast = ({ days, isDayMode, scrollRef }) => {
  return (
    <div ref={scrollRef} className="flex space-x-8 overflow-x-auto scrollbar-hide pb-4">
      {days.map((day, index) => {
        let dayLabel = 'Today', dateLabel = '';
        try {
          const date = new Date(day.date);
          const dayOfWeek = date.getDay();
          const dayOfMonth = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          dateLabel = `${month}/${dayOfMonth}`;
          if (index !== 0) dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
        } catch (e) { 
          dayLabel = `Day ${index + 1}`; 
        }

        return (
          <div key={index} className="flex-shrink-0 text-center w-24 transition-all duration-300 p-4">
            <div className={`text-base font-medium mb-1 ${isDayMode ? 'text-black/70' : 'text-white/70'}`}>{dayLabel}</div>
            <div className={`text-sm mb-3 ${isDayMode ? 'text-black/40' : 'text-white/40'}`}>{dateLabel}</div>
            <div className={`text-xl font-medium mb-1 ${isDayMode ? 'text-black/80' : 'text-white/80'}`}>{formatTemp(day.high_f)}°</div>
            <div className={`text-lg font-medium mb-3 ${isDayMode ? 'text-black/50' : 'text-white/50'}`}>{formatTemp(day.low_f)}°</div>
            <div className="flex justify-center">
              <WeatherIcon weatherCode={day.weather_code} isDaytime={true} className={`w-10 h-10 ${isDayMode ? 'text-black/40' : 'text-white/40'}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyForecast;
