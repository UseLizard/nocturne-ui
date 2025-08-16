import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNocturned } from '../../hooks/useNocturned';
import { useNavigationScrollWheel } from '../../hooks/useScrollWheel';
import { useTheme } from '../../contexts/ThemeContext';
import { isNightTime } from '../../utils/weatherUtils';

import CurrentWeatherDisplay from './CurrentWeatherDisplay';
import HourlyForecast, { HourlyForecastSkeleton } from './HourlyForecast';
import WeeklyForecast, { WeeklyForecastSkeleton } from './WeeklyForecast';
import { RefreshIcon, ChevronLeftIcon } from '../common/icons';
import TabbedView from '../common/TabbedView';
import ErrorMessage from '../common/ErrorMessage';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const WeatherView = ({ setActiveSection }) => {
  const { wsConnected, apiRequest } = useNocturned();
  const { setTheme } = useTheme();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('hourly');
  const [isDayMode, setIsDayMode] = useState(() => !isNightTime());

  const hourlyScrollRef = useRef(null);
  const weeklyScrollRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  const fetchWeatherData = useCallback(async () => {
    if (!wsConnected) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('/api/weather/current', 'GET');
      if (response && (response.hourly_data || response.weekly_data)) {
        setWeatherData(response);
        setLoading(false);
        retryCountRef.current = 0;
      } else {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          await apiRequest('/api/weather/refresh', 'POST');
          retryTimeoutRef.current = setTimeout(fetchWeatherData, RETRY_DELAY);
        } else {
          setError("Failed to refresh weather data. Please try again later.");
          setLoading(false);
        }
      }
    } catch (err) {
      setError('Failed to load weather data');
      setLoading(false);
    }
  }, [wsConnected, apiRequest]);

  useEffect(() => {
    fetchWeatherData();
    // Cleanup timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchWeatherData]);

  useEffect(() => {
    setIsDayMode(!isNightTime());
    const interval = setInterval(() => setIsDayMode(!isNightTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  // This effect updates the global theme when the day/night mode changes.
  useEffect(() => {
    const getGradientForTheme = (isDay) => {
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

    setTheme({ background: getGradientForTheme(isDayMode) });
  }, [isDayMode, setTheme]);

  const handleManualRefresh = () => {
    retryCountRef.current = 0;
    fetchWeatherData();
  };

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

  const weatherTabs = useMemo(() => {
    const hourlyHours = weatherData?.hourly_data?.hours;
    const weeklyDays = weatherData?.weekly_data?.days;

    return [
      {
        key: 'hourly',
        label: 'Hourly',
        content: loading && !weatherData ? (
          <HourlyForecastSkeleton scrollRef={hourlyScrollRef} />
        ) : hourlyHours ? (
          <HourlyForecast hours={hourlyHours} isDayMode={isDayMode} scrollRef={hourlyScrollRef} />
        ) : null
      },
      {
        key: 'weekly',
        label: '7-Day',
        content: loading && !weatherData ? (
          <WeeklyForecastSkeleton scrollRef={weeklyScrollRef} />
        ) : weeklyDays ? (
          <WeeklyForecast days={weeklyDays} isDayMode={isDayMode} scrollRef={weeklyScrollRef} />
        ) : null
      }
    ];
  }, [weatherData, loading, isDayMode]);

  return (
    <div className="fixed inset-0 z-40">
      <div className="relative z-10 h-full">
        {error && (
          <div className="flex items-center justify-center h-full">
            <ErrorMessage 
              message={error} 
              onRetry={handleManualRefresh}
              className={isDayMode ? 'text-black/60' : 'text-white/60'}
            />
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
      <button onClick={handleManualRefresh} disabled={loading} className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors focus:outline-none disabled:opacity-50 ${isDayMode ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}>
        <RefreshIcon className={`w-6 h-6 ${isDayMode ? 'text-black/50' : 'text-white/50'} ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

export default WeatherView;
