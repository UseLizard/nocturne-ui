import React from 'react';
import { formatTemp } from '../../utils/weatherUtils';

const CurrentWeatherDisplay = ({ data, isDayMode }) => {
  // Extract current temperature from first hour of hourly data
  const currentHour = data?.hourly_data?.hours?.[0];
  const temp = currentHour?.temp_f ? formatTemp(currentHour.temp_f) : '--';
  const condition = currentHour?.condition || 'Loading...';
  const location = data?.hourly_data?.location?.name || data?.weekly_data?.location?.name || '...';

  return (
    <div className="w-1/3 flex flex-col justify-center items-start px-12">
      <div className="text-left">
        <h1 className={`text-9xl font-thin tracking-tighter ${isDayMode ? 'text-black/80' : 'text-white/80'}`}>{temp}°</h1>
        <p className={`text-2xl mt-2 font-medium ${isDayMode ? 'text-black/60' : 'text-white/60'}`}>{condition}</p>
        <p className={`text-lg mt-1 ${isDayMode ? 'text-black/40' : 'text-white/40'}`}>{location}</p>
      </div>
    </div>
  );
};

export default CurrentWeatherDisplay;
