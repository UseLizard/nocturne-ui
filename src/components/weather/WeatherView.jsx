import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNocturned } from '../../hooks/useNocturned';
import { useNavigationScrollWheel } from '../../hooks/useScrollWheel';
import { RefreshIcon, ChevronLeftIcon } from '../common/icons';
import TabbedView from '../common/TabbedView';
import WeatherIcon from './WeatherIcon';

// --- Helper Functions & Constants ---

const API_URL = 'http://172.16.42.2:5000/api/weather/current';

const formatTemp = (temp) => Math.round(temp);

const isNightTime = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 18 || hour < 6;
};

const getGradient = (isDay) => {
  const hour = new Date().getHours();
  if (isDay) {
    if (hour >= 6 && hour < 12) return 'linear-gradient(135deg, #fefefe 0%, #f0f8ff 30%, #e6f3ff 70%, #d1e9ff 100%)';
    if (hour >= 12 && hour < 18) return 'linear-gradient(135deg, #fefefe 0%, #faf7f0 30%, #f5f0e8 70%, #ede4d3 100%)';
    return 'linear-gradient(135deg, #fefefe 0%, #f0f4f8 30%, #dbe7f0 70%, #c7d2e7 100%)';
  } else {
    if (hour >= 22 || hour < 4) return 'linear-gradient(135deg, #050505 0%, #0f0f23 30%, #1a1a3a 70%, #2d2d55 100%)';
    if (hour >= 4 && hour < 6) return 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #2d1b69 70%, #4c1d95 100%)';
    return 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #16213e 70%, #0f4c75 100%)';
  }
};

// --- Sub-components ---

const Skeleton = ({ className }) => <div className={`bg-black/5 dark:bg-white/5 animate-pulse rounded-lg ${className}`} />;

const HourlyForecastSkeleton = ({ scrollRef }) => (
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

const WeeklyForecastSkeleton = ({ scrollRef }) => (
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

const HourlyForecast = ({ hours, isDayMode, scrollRef }) => {
  const now = new Date();
  const currentHour = now.getHours();
  const isDayTime = useCallback((timeString) => !isNightTime(new Date(timeString)), []);
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
              <WeatherIcon weatherCode={hour.weather_code} isDaytime={isDayTime(hour.time)} className={`w-8 h-8 ${isCurrentHour ? (isDayMode ? 'text-black/70' : 'text-white/70') : (isDayMode ? 'text-black/40' : 'text-white/40')}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const WeeklyForecast = ({ days, isDayMode, scrollRef }) => {
  return (
    <div ref={scrollRef} className="flex space-x-8 overflow-x-auto scrollbar-hide pb-4">
      {days.map((day, index) => {
        let dayLabel = 'Today', dateLabel = '', isWeekend = false;
        try {
          const date = new Date(day.date);
          const dayOfWeek = date.getDay();
          isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const dayOfMonth = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          dateLabel = `${month}/${dayOfMonth}`;
          if (index !== 0) dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
        } catch (e) { 
          dayLabel = `Day ${index + 1}`; 
        }

        return (
          <div key={index} className={`flex-shrink-0 text-center w-24 transition-all duration-300 p-4 ${isWeekend ? (isDayMode ? 'bg-black/5' : 'bg-white/5') + ' rounded-xl' : ''}`}>
            <div className={`text-base font-medium mb-1 ${isWeekend ? (isDayMode ? 'text-black/80' : 'text-white/80') : (isDayMode ? 'text-black/70' : 'text-white/70')}`}>{dayLabel}</div>
            <div className={`text-sm mb-3 ${isWeekend ? (isDayMode ? 'text-black/50' : 'text-white/50') : (isDayMode ? 'text-black/40' : 'text-white/40')}`}>{dateLabel}</div>
            <div className={`text-xl font-medium mb-1 ${isWeekend ? (isDayMode ? 'text-black/90' : 'text-white/90') : (isDayMode ? 'text-black/80' : 'text-white/80')}`}>{formatTemp(day.high_f)}°</div>
            <div className={`text-lg font-medium mb-3 ${isWeekend ? (isDayMode ? 'text-black/60' : 'text-white/60') : (isDayMode ? 'text-black/50' : 'text-white/50')}`}>{formatTemp(day.low_f)}°</div>
            <div className="flex justify-center">
              <WeatherIcon weatherCode={day.weather_code} isDaytime={true} className={`w-10 h-10 ${isWeekend ? (isDayMode ? 'text-black/50' : 'text-white/50') : (isDayMode ? 'text-black/40' : 'text-white/40')}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};



// --- Main WeatherView Component ---

const WeatherView = ({ setActiveSection }) => {
  const { wsConnected, apiRequest } = useNocturned();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('hourly');
  const [isDayMode, setIsDayMode] = useState(() => !isNightTime());
  
  const hourlyScrollRef = useRef(null);
  const weeklyScrollRef = useRef(null);

  const fetchWeatherData = useCallback(async () => {
    if (!wsConnected) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('/api/weather/current', 'GET');
      if (response && (response.hourly_data || response.weekly_data)) {
        setWeatherData(response);
        setLoading(false);
      } else {
        await apiRequest('/api/weather/refresh', 'POST');
      }
    } catch (err) {
      setError('Failed to load weather data');
      setLoading(false);
    }
  }, [wsConnected, apiRequest]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  useEffect(() => {
    setIsDayMode(!isNightTime());
    const interval = setInterval(() => setIsDayMode(!isNightTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentGradient = useMemo(() => getGradient(isDayMode), [isDayMode]);

  const handleForecastScroll = useCallback((direction) => {
    const scrollContainer = viewMode === 'hourly' ? hourlyScrollRef.current : weeklyScrollRef.current;
    if (scrollContainer) {
      const itemWidth = scrollContainer.children.length > 1
        ? scrollContainer.children[1].offsetLeft - scrollContainer.children[0].offsetLeft
        : 128;
      scrollContainer.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
    }
  }, [viewMode]);

  const activeScrollRef = viewMode === 'hourly' ? hourlyScrollRef : weeklyScrollRef;
  useNavigationScrollWheel({
    containerRef: activeScrollRef,
    onNavigate: handleForecastScroll,
    enabled: !loading && !error,
    throttleMs: 100,
  });

  // Define tab configuration
  const weatherTabs = useMemo(() => {
    const hourlyHours = weatherData?.hourly_data?.hours;
    const weeklyDays = weatherData?.weekly_data?.days;

    return [
      {
        key: 'hourly',
        label: 'Hourly',
        content: loading ? (
          <HourlyForecastSkeleton scrollRef={hourlyScrollRef} />
        ) : hourlyHours ? (
          <HourlyForecast hours={hourlyHours} isDayMode={isDayMode} scrollRef={hourlyScrollRef} />
        ) : null
      },
      {
        key: 'weekly',
        label: '7-Day',
        content: loading ? (
          <WeeklyForecastSkeleton scrollRef={weeklyScrollRef} />
        ) : weeklyDays ? (
          <WeeklyForecast days={weeklyDays} isDayMode={isDayMode} scrollRef={weeklyScrollRef} />
        ) : null
      }
    ];
  }, [weatherData, loading, isDayMode]);

  return (
    <div className="fixed inset-0 z-40 transition-all duration-700" style={{ background: currentGradient, transition: 'background 1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
      <div className="relative z-10 h-full">
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className={`mb-4 ${isDayMode ? 'text-black/60' : 'text-white/60'}`}>{error}</p>
            <button onClick={fetchWeatherData} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none ${isDayMode ? 'bg-black/5 hover:bg-black/10 text-black/70' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}>
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <div className="flex h-full">
            <CurrentWeatherDisplay data={weatherData} isDayMode={isDayMode} />
            <div className="w-2/3 flex flex-col justify-center pr-12">
              <TabbedView
                tabs={weatherTabs}
                activeTab={viewMode}
                onTabChange={setViewMode}
                isDarkMode={!isDayMode}
                className="h-full"
                contentClassName="overflow-hidden"
              />
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setActiveSection('recents')} className={`absolute top-6 left-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors focus:outline-none ${isDayMode ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}>
        <ChevronLeftIcon className={`w-7 h-7 ${isDayMode ? 'text-black/50' : 'text-white/50'}`} />
      </button>
      <button onClick={fetchWeatherData} disabled={loading} className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors focus:outline-none disabled:opacity-50 ${isDayMode ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}>
        <RefreshIcon className={`w-6 h-6 ${isDayMode ? 'text-black/50' : 'text-white/50'} ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

export default WeatherView;