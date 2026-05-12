import React, { useEffect, useState } from 'react';
import {
  Search, Loader2, MapPin, Wind, Droplets, Thermometer, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
} from 'lucide-react';
import api from '../lib/api';

const WMO = {
  0: { label: 'Clear sky', Icon: Sun },
  1: { label: 'Mostly clear', Icon: Sun },
  2: { label: 'Partly cloudy', Icon: Cloud },
  3: { label: 'Overcast', Icon: Cloud },
  45: { label: 'Fog', Icon: CloudFog },
  48: { label: 'Rime fog', Icon: CloudFog },
  51: { label: 'Light drizzle', Icon: CloudRain },
  53: { label: 'Drizzle', Icon: CloudRain },
  55: { label: 'Heavy drizzle', Icon: CloudRain },
  61: { label: 'Light rain', Icon: CloudRain },
  63: { label: 'Rain', Icon: CloudRain },
  65: { label: 'Heavy rain', Icon: CloudRain },
  71: { label: 'Light snow', Icon: CloudSnow },
  73: { label: 'Snow', Icon: CloudSnow },
  75: { label: 'Heavy snow', Icon: CloudSnow },
  80: { label: 'Rain showers', Icon: CloudRain },
  81: { label: 'Heavy showers', Icon: CloudRain },
  82: { label: 'Violent showers', Icon: CloudRain },
  95: { label: 'Thunderstorm', Icon: CloudLightning },
  96: { label: 'Thunder + hail', Icon: CloudLightning },
  99: { label: 'Severe thunder', Icon: CloudLightning },
};

const POPULAR = ['London', 'New York', 'Tokyo', 'Dubai', 'Karachi', 'Paris', 'Sydney', 'Lagos', 'São Paulo', 'Berlin'];

function flagOf(cc) {
  if (!cc || cc.length !== 2) return '';
  return cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function dayName(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Weather() {
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchWeather = async (city) => {
    if (!city) return;
    setLoading(true); setErr(''); setSuggestions([]);
    try {
      const r = await api.get('/weather/current', { params: { city } });
      setData(r.data);
      setQ(city);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Failed to load weather');
      setData(null);
    } finally { setLoading(false); }
  };

  // Auto-load London on first visit
  useEffect(() => { fetchWeather('London'); /* eslint-disable-next-line */ }, []);

  // Search-as-you-type for suggestions
  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setSuggestions([]); return; }
      try {
        const r = await api.get('/weather/search', { params: { q } });
        setSuggestions(r.data.results || []);
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e) => { e.preventDefault(); fetchWeather(q.trim()); };

  const current = data?.current;
  const daily = data?.daily;
  const loc = data?.location;
  const Wi = current ? (WMO[current.weather_code]?.Icon || Cloud) : Cloud;
  const wLabel = current ? (WMO[current.weather_code]?.label || '—') : '';

  return (
    <div className="h-full overflow-y-auto" data-testid="weather-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Weather</div>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">Check weather worldwide</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Powered by Open-Meteo · all countries, free, never expires.</p>

        <form onSubmit={submit} className="mt-5 relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                data-testid="weather-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search any city (e.g. Karachi, Sydney, São Paulo)…"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => fetchWeather(s.name)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 dark:hover:bg-sky-500/10 flex items-center gap-2"
                    >
                      <span className="text-base">{flagOf(s.country_code)}</span>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-slate-500 truncate">{s.admin1 ? `${s.admin1}, ` : ''}{s.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              data-testid="weather-search-btn"
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Popular */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {POPULAR.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => fetchWeather(c)}
                className="text-xs rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-600 dark:text-slate-300"
              >
                {c}
              </button>
            ))}
          </div>
        </form>

        {err && <div className="mt-5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-sm px-3 py-2" data-testid="weather-error">{err}</div>}

        {data && current && (
          <>
            {/* Current card */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-sky-300/30 bg-gradient-to-br from-sky-500 via-sky-600 to-sky-800 text-white p-6 sm:p-8 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-sky-100/90">Current weather</div>
                  <div className="mt-1 text-2xl sm:text-3xl font-heading font-semibold tracking-tight flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{loc.name}</span>
                    <span className="text-base font-normal opacity-80">
                      {flagOf(loc.country_code)} {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                    </span>
                  </div>
                </div>
                <Wi className="h-16 w-16 sm:h-20 sm:w-20 opacity-90" />
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-2">
                <div className="text-6xl sm:text-7xl font-heading font-semibold tracking-tighter">
                  {Math.round(current.temperature_2m)}°
                </div>
                <div className="text-sky-50">
                  <div className="text-lg font-medium">{wLabel}</div>
                  <div className="text-sm opacity-90">Feels like {Math.round(current.apparent_temperature)}°C</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat icon={Droplets} label="Humidity" value={`${current.relative_humidity_2m}%`} />
                <Stat icon={Wind} label="Wind" value={`${Math.round(current.wind_speed_10m)} km/h`} />
                <Stat icon={Thermometer} label="Feels like" value={`${Math.round(current.apparent_temperature)}°C`} />
                <Stat icon={CloudRain} label="Precipitation" value={`${current.precipitation} mm`} />
              </div>
            </div>

            {/* 7-day forecast */}
            {daily?.time?.length > 0 && (
              <div className="mt-6">
                <h2 className="font-heading text-xl font-medium">7-day forecast</h2>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {daily.time.map((t, i) => {
                    const Ic = WMO[daily.weather_code[i]]?.Icon || Cloud;
                    return (
                      <div key={t} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{dayName(t)}</div>
                        <Ic className="mx-auto mt-2 h-7 w-7 text-sky-500" />
                        <div className="mt-2 text-sm">
                          <span className="font-semibold">{Math.round(daily.temperature_2m_max[i])}°</span>
                          <span className="text-slate-500"> / {Math.round(daily.temperature_2m_min[i])}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Ic, label, value }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2.5 flex items-center gap-2.5">
      <Ic className="h-4 w-4 opacity-90" />
      <div>
        <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
