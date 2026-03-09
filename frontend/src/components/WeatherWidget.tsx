import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      // Default to Toronto, Canada (43.6629, -79.3957)
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=43.6629&longitude=-79.3957&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto'
      );
      const data = await response.json();
      const current = data.current;
      setWeather({
        temperature: Math.round(current.temperature_2m),
        weatherCode: current.weather_code,
        description: getWeatherDescription(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
      });
    } catch (err) {
      setError('Failed to load weather');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (code: number): string => {
    // WMO weather code interpretation
    if (code === 0) return '☀️'; // Clear
    if (code === 1 || code === 2) return '🌤️'; // Partly cloudy
    if (code === 3) return '☁️'; // Overcast
    if (code === 45 || code === 48) return '🌫️'; // Foggy
    if (code === 51 || code === 53 || code === 55) return '🌧️'; // Drizzle
    if (code === 61 || code === 63 || code === 65) return '🌧️'; // Rain
    if (code === 71 || code === 73 || code === 75) return '❄️'; // Snow
    if (code === 77) return '❄️'; // Snow grains
    if (code === 80 || code === 81 || code === 82) return '⛈️'; // Showers
    if (code === 85 || code === 86) return '❄️'; // Snow showers
    if (code === 95 || code === 96 || code === 99) return '⛈️'; // Thunderstorm
    return '🌤️';
  };

  const getWeatherDescription = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45) return 'Foggy';
    if (code === 48) return 'Depositing rime fog';
    if (code === 51 || code === 53 || code === 55) return 'Drizzle';
    if (code === 61) return 'Slight rain';
    if (code === 63) return 'Moderate rain';
    if (code === 65) return 'Heavy rain';
    if (code === 71) return 'Slight snow';
    if (code === 73) return 'Moderate snow';
    if (code === 75) return 'Heavy snow';
    if (code === 77) return 'Snow grains';
    if (code === 80) return 'Slight rain showers';
    if (code === 81) return 'Moderate rain showers';
    if (code === 82) return 'Violent rain showers';
    if (code === 85) return 'Slight snow showers';
    if (code === 86) return 'Heavy snow showers';
    if (code === 95) return 'Thunderstorm';
    if (code === 96) return 'Thunderstorm with hail';
    if (code === 99) return 'Thunderstorm with heavy hail';
    return 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Weather</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && !weather ? (
        <div className="text-center text-gray-400">Loading weather...</div>
      ) : weather ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-5xl mb-2">
                {getWeatherIcon(weather.weatherCode)}
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {weather.temperature}°C
              </p>
              <p className="text-lg text-gray-600">{weather.description}</p>
            </div>
            <div className="text-right text-gray-600 space-y-2">
              <div>
                <p className="text-sm">Humidity</p>
                <p className="text-xl font-semibold">{weather.humidity}%</p>
              </div>
              <div>
                <p className="text-sm">Wind Speed</p>
                <p className="text-xl font-semibold">{weather.windSpeed} km/h</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadWeather}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>
      ) : null}
    </div>
  );
}
