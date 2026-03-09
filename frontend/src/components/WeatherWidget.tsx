import { useState, useEffect } from 'react';
import { RefreshCw, Droplets, Wind } from 'lucide-react';
import { Card, CardHeader, Button, Spinner, Alert } from './ui';

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
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);
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
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code === 51 || code === 53 || code === 55) return '🌧️';
    if (code === 61 || code === 63 || code === 65) return '🌧️';
    if (code === 71 || code === 73 || code === 75) return '❄️';
    if (code === 77) return '❄️';
    if (code === 80 || code === 81 || code === 82) return '⛈️';
    if (code === 85 || code === 86) return '❄️';
    if (code === 95 || code === 96 || code === 99) return '⛈️';
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
    <Card variant="gradient">
      <CardHeader
        title="Weather"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={loadWeather}
            disabled={loading}
            aria-label="Refresh weather"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" className="mb-2">
          {error}
        </Alert>
      )}

      {loading && !weather ? (
        <div className="flex items-center justify-center py-5">
          <Spinner size="lg" />
        </div>
      ) : weather ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-display mb-1">
                {getWeatherIcon(weather.weatherCode)}
              </div>
              <p className="text-h1 text-white">
                {weather.temperature}°C
              </p>
              <p className="text-body text-surface-400">{weather.description}</p>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-1 justify-end">
                <Droplets size={16} className="text-info-400" />
                <div>
                  <p className="text-small text-surface-500">Humidity</p>
                  <p className="text-body font-semibold text-surface-200">{weather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Wind size={16} className="text-info-400" />
                <div>
                  <p className="text-small text-surface-500">Wind</p>
                  <p className="text-body font-semibold text-surface-200">{weather.windSpeed} km/h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
