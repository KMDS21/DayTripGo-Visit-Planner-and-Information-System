// UserLocationInput — lets the visitor set their starting location for
// route calculation (SRS FR-12 extension: route-aware day plan).
// Two modes:
//   1) Auto-detect via browser geolocation API (one click)
//   2) Type an address — geocoded via Nominatim (free, no API key)
// The resolved { lat, lng, label } is passed up through onLocationChange.

import { useState, useRef } from 'react';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';

export default function UserLocationInput({ location, onLocationChange }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const debounce = useRef(null);

  // ── Auto-detect via Geolocation API ──────────────────────────────────
  const handleDetect = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse-geocode for a human-readable label
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=0`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const label = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onLocationChange({ lat, lng, label });
        } catch {
          onLocationChange({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
        setQuery('');
        setSuggestions([]);
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Please allow location or type an address.'
            : 'Could not detect your location. Try typing an address instead.'
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Address search via Nominatim ─────────────────────────────────────
  const searchAddress = async (q) => {
    if (q.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=lk`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSuggestions(
        data.map((r) => ({
          lat: Number(r.lat),
          lng: Number(r.lon),
          label: r.display_name,
        }))
      );
    } catch {
      setSuggestions([]);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setError(null);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => searchAddress(val), 400);
  };

  const pickSuggestion = (s) => {
    onLocationChange(s);
    setQuery('');
    setSuggestions([]);
  };

  const clearLocation = () => {
    onLocationChange(null);
    setQuery('');
    setSuggestions([]);
    setError(null);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MapPin className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="font-heading text-sm font-bold sm:text-base">Your starting point</h3>
          <p className="text-xs text-muted-foreground">
            Set your location to see road routes and travel times.
          </p>
        </div>
      </div>

      {/* Already set — show it with a clear button */}
      {location ? (
        <div className="flex items-start gap-2 rounded-xl bg-brand-light/60 px-3 py-2.5">
          <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="min-w-0 flex-1 text-sm leading-snug text-brand-dark line-clamp-2">
            {location.label}
          </p>
          <button
            type="button"
            onClick={clearLocation}
            className="shrink-0 rounded-full p-1 text-brand-dark/60 transition-colors hover:bg-brand/10 hover:text-brand-dark"
            aria-label="Clear starting location"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Auto-detect button */}
          <button
            type="button"
            onClick={handleDetect}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {loading ? 'Detecting…' : 'Use my current location'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">or type an address</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Manual search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="e.g. Wadduwa, Colombo Fort…"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => pickSuggestion(s)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      <span className="line-clamp-2">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
