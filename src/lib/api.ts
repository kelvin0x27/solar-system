const NASA_API_KEY = 'DEMO_KEY';
const NASA_BASE = 'https://api.nasa.gov';
const SPACEFLIGHT_NEWS_BASE = 'https://api.spaceflightnewsapi.net/v4';

export async function fetchApod(date?: string) {
  const params = new URLSearchParams({ api_key: NASA_API_KEY });
  if (date) params.set('date', date);
  const res = await fetch(`${NASA_BASE}/planetary/apod?${params}`);
  if (!res.ok) throw new Error('Failed to fetch APOD');
  return res.json();
}

export async function fetchApodRange(startDate: string, endDate: string) {
  const params = new URLSearchParams({
    api_key: NASA_API_KEY,
    start_date: startDate,
    end_date: endDate,
  });
  const res = await fetch(`${NASA_BASE}/planetary/apod?${params}`);
  if (!res.ok) throw new Error('Failed to fetch APOD range');
  return res.json();
}

export async function fetchNeoFeed(startDate: string, endDate: string) {
  const params = new URLSearchParams({
    api_key: NASA_API_KEY,
    start_date: startDate,
    end_date: endDate,
  });
  const res = await fetch(`${NASA_BASE}/neo/rest/v1/feed?${params}`);
  if (!res.ok) throw new Error('Failed to fetch NEO feed');
  return res.json();
}

export async function fetchMarsPhotos(earthDate: string, camera?: string) {
  const params = new URLSearchParams({
    api_key: NASA_API_KEY,
    earth_date: earthDate,
  });
  if (camera && camera !== 'all') params.set('camera', camera);
  const res = await fetch(
    `${NASA_BASE}/mars-photos/api/v1/rovers/curiosity/photos?${params}`,
  );
  if (!res.ok) throw new Error('Failed to fetch Mars photos');
  return res.json();
}

export async function fetchSpaceNews(limit = 12, offset = 0) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`${SPACEFLIGHT_NEWS_BASE}/articles/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch space news');
  return res.json();
}

export async function fetchISSPosition() {
  const res = await fetch('/api/iss/iss-now.json');
  if (!res.ok) throw new Error('Failed to fetch ISS position');
  return res.json();
}

export async function fetchAstronauts() {
  const res = await fetch('/api/iss/astros.json');
  if (!res.ok) throw new Error('Failed to fetch astronauts');
  return res.json();
}

// Static ISS TLE fallback (updated periodically - this ensures the page always works)
const ISS_FALLBACK_TLE = `ISS (ZARYA)
1 25544U 98067A   24100.50000000  .00016717  00000-0  10270-3 0  9025
2 25544  51.6400 200.0000 0005000  90.0000 270.0000 15.49000000400000`;

const TLE_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export async function fetchTles(group: string = 'stations') {
  const cacheKey = `tle_cache_${group}`;
  const cacheTimeKey = `tle_cache_time_${group}`;

  // Check localStorage cache first
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(cacheTimeKey);

  if (cachedData && cachedTime) {
    const age = Date.now() - parseInt(cachedTime, 10);
    if (age < TLE_CACHE_TTL) {
      return cachedData; // Fresh cache, use it
    }
  }

  // Try fetching fresh data
  try {
    const res = await fetch(
      `/api/celestrak/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`,
    );
    if (!res.ok) throw new Error(`CelesTrak returned ${res.status}`);
    const text = await res.text();
    // Cache the successful response
    localStorage.setItem(cacheKey, text);
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    return text;
  } catch (err) {
    // If we have stale cache, use it (better than nothing)
    if (cachedData) {
      console.warn(`CelesTrak fetch failed, using stale cache for ${group}`);
      return cachedData;
    }
    // Ultimate fallback: return ISS TLE for stations group
    if (group === 'stations') {
      console.warn('Using static ISS fallback TLE data');
      return ISS_FALLBACK_TLE;
    }
    // For other groups, return empty string (no data)
    console.warn(`No cached data available for ${group}`);
    return '';
  }
}
