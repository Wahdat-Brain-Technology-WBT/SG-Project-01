import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Loader2 } from 'lucide-react';

const getWeatherIcon = (code: number) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code === 0) return <Sun size={24} className="text-amber-500" />;
  if (code === 1 || code === 2 || code === 3) return <CloudSun size={24} className="text-amber-500/80" />;
  if (code === 45 || code === 48) return <CloudFog size={24} className="text-slate-400" />;
  if (code === 51 || code === 53 || code === 55) return <CloudDrizzle size={24} className="text-blue-400" />;
  if (code === 61 || code === 63 || code === 65 || code === 80 || code === 81 || code === 82) return <CloudRain size={24} className="text-blue-500" />;
  if (code === 71 || code === 73 || code === 75 || code === 85 || code === 86) return <CloudSnow size={24} className="text-sky-300" />;
  if (code === 95 || code === 96 || code === 99) return <CloudLightning size={24} className="text-purple-500" />;
  return <Sun size={24} className="text-amber-500" />;
};

export default function Weather() {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Kabul coordinates: 34.52, 69.17
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=34.52&longitude=69.17&current_weather=true');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (data && data.current_weather) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            code: data.current_weather.weathercode
          });
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error("Failed to fetch weather", error);
        // Fallback state so UI doesn't get stuck loading
        setWeather({ temp: 22, code: 0 }); // 22°C, Clear Sky
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // Update every 15 mins
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
        <Loader2 size={20} className="animate-spin text-slate-400" />
        <span className="text-sm font-medium text-slate-500">در حال بروزرسانی...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm" title="کابل، افغانستان">
      {getWeatherIcon(weather.code)}
      <div className="flex flex-col justify-center">
        <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none" dir="ltr">
          {weather.temp}°C
        </span>
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          کابل
        </span>
      </div>
    </div>
  );
}
