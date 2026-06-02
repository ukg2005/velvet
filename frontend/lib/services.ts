import { api } from './api';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const responseCache = new Map<string, CacheEntry<any>>();
const inflightRequests = new Map<string, Promise<any>>();

async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inflight = inflightRequests.get(key);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const promise = fetcher()
    .then((value) => {
      responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      inflightRequests.delete(key);
      return value;
    })
    .catch((error) => {
      inflightRequests.delete(key);
      throw error;
    });

  inflightRequests.set(key, promise as Promise<any>);
  return promise;
}

function clearCacheByPrefix(prefix: string) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}

// --- Authentication & Users ---
export const AuthService = {
  requestOtp: async (email: string) => {
    const response = await api.post('/auth/login/', { email });
    return response.data;
  },
  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/login/verify/', { email, otp });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
  updateProfile: async (data: { username?: string; bio?: string; display_name?: string; location?: string }) => {
    const response = await api.patch('/auth/me/', data);
    return response.data;
  },
  logout: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await api.post('/auth/logout/', { refresh });
      } catch {
        // Ignore logout endpoint errors — clear tokens regardless
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

// --- Movies ---
export const MovieService = {
  search: async (query: string, page: number = 1, filters?: any) => {
    try {
      const response = await api.get('/movies/search/', {
        params: { query, page, _t: Date.now(), ...filters },
      });
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;

      // Some backend builds return 500 for valid query requests.
      // Try an alternate parameter shape first, then degrade gracefully.
      if (status === 500) {
        try {
          const altResponse = await api.get('/movies/search/', {
            params: { q: query, page, _t: Date.now(), ...filters },
          });
          return altResponse.data;
        } catch {
          const [trending, topRated] = await Promise.all([
            api.get('/movies/trending/').then((res) => res.data).catch(() => []),
            api.get('/movies/top_rated/', { params: { page: 1 } }).then((res) => res.data).catch(() => []),
          ]);

          const trendingList = Array.isArray(trending) ? trending : (trending?.movies || trending?.results || []);
          const topRatedList = Array.isArray(topRated) ? topRated : (topRated?.movies || topRated?.results || []);
          const merged = [...trendingList, ...topRatedList];
          const seen = new Set<string>();

          const movies = merged.filter((movie: any) => {
            const movieId = String(movie?.tmdb_id || movie?.id || "");
            if (!movieId || seen.has(movieId)) {
              return false;
            }
            const title = String(movie?.title || movie?.original_title || "").toLowerCase();
            const match = title.includes(query.toLowerCase());
            if (match) {
              seen.add(movieId);
            }
            return match;
          });

          return { movies, people: [] };
        }
      }

      throw error;
    }
  },
  explore: async (params: any = {}) => {
    const response = await api.get('/movies/discover/', { params });
    return response.data;
  },
  getMovie: async (tmdbId: string | number) => {
    const key = `movie:${tmdbId}`;
    return getCached(
      key,
      async () => {
        const response = await api.get(`/movies/movie/${tmdbId}/`);
        return response.data;
      },
      5 * 60 * 1000
    );
  },
  getPerson: async (tmdbId: string | number) => {
    const response = await api.get(`/movies/person/${tmdbId}/`);
    return response.data;
  },
  getTopRated: async (page: number = 1) => {
    const key = `topRated:${page}`;
    return getCached(
      key,
      async () => {
        const response = await api.get('/movies/top_rated/', { params: { page } });
        return response.data;
      },
      60 * 1000
    );
  },
  getTrending: async () => {
    return getCached(
      'trending',
      async () => {
        const response = await api.get('/movies/trending/');
        return response.data;
      },
      60 * 1000
    );
  },
};

// --- Lists ---
export const ListService = {
  getLists: async () => {
    const response = await api.get('/lists/');
    return response.data;
  },
  createList: async (data: { name?: string; title?: string; description?: string; desc?: string; is_public: boolean }) => {
    // Normalize to backend field names (title, desc)
    const payload = {
      title: data.title || data.name || '',
      desc: data.desc || data.description || '',
      is_public: data.is_public,
    };
    const response = await api.post('/lists/', payload);
    return response.data;
  },
  getList: async (id: string | number) => {
    const response = await api.get(`/lists/${id}/`);
    return response.data;
  },
  updateList: async (id: string | number, data: any) => {
    const response = await api.patch(`/lists/${id}/`, data);
    return response.data;
  },
  deleteList: async (id: string | number) => {
    const response = await api.delete(`/lists/${id}/`);
    return response.data;
  },
  addToList: async (listId: string | number, tmdbId: number) => {
    // Backend URL: /lists/<pk>/add/ — only needs tmdb_id in body
    const response = await api.post(`/lists/${listId}/add/`, { tmdb_id: tmdbId });
    return response.data;
  },
  reorderList: async (listId: string | number, items: { id: number; order: number }[]) => {
    const response = await api.post(`/lists/${listId}/reorder/`, items);
    return response.data;
  },
};

// --- Logs ---
export const LogService = {
  getLogs: async () => {
    const response = await api.get('/logs/');
    return response.data;
  },
  createLog: async (data: { tmdb_id: number; rating?: number; review?: string; liked?: boolean; watchlist?: boolean; logged_at?: string }) => {
    const response = await api.post('/logs/', data);
    return response.data;
  },
  getLog: async (id: string | number) => {
    const response = await api.get(`/logs/${id}/`);
    return response.data;
  },
  updateLog: async (id: string | number, data: any) => {
    const response = await api.patch(`/logs/${id}/`, data);
    return response.data;
  },
  deleteLog: async (id: string | number) => {
    const response = await api.delete(`/logs/${id}/`);
    return response.data;
  },
  getLiked: async () => {
    return getCached(
      'logs:liked',
      async () => {
        const response = await api.get('/logs/liked/');
        return response.data;
      },
      20 * 1000
    );
  },
  getWatchlist: async () => {
    return getCached(
      'logs:watchlist',
      async () => {
        const response = await api.get('/logs/watchlist/');
        return response.data;
      },
      15 * 1000
    );
  },
  toggleStatus: async (tmdbId: number, action: 'liked' | 'watchlist') => {
    const response = await api.post(`/logs/toggle/`, { tmdb_id: tmdbId, action });
    if (action === 'liked') {
      clearCacheByPrefix('logs:liked');
    }
    if (action === 'watchlist') {
      clearCacheByPrefix('logs:watchlist');
    }
    return response.data;
  },
};

// --- Stats ---
export const StatService = {
  getStats: async (year?: string | null) => {
    let url = '/stats/';
    if (year && year !== 'all') {
      url += `?year=${year}`;
    }
    const response = await api.get(url);
    return response.data;
  },
};
