import { localStorage } from './localStorage';

const API_BASE_URL = 'https://api.awaazmanki.com';

const getMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

// Helper for fetch requests with auth token
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {}

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const cleanMusicParams = (params = {}) => {
  const queryStr = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
    .join('&');
  return queryStr ? `?${queryStr}` : '';
};

const mapMusicTrack = (track) => track ? ({
  ...track,
  audioUrl: track.audioUrl ? getMediaUrl(track.audioUrl) : null,
  coverUrl: track.coverUrl ? getMediaUrl(track.coverUrl) : null,
  privateAudioUrl: track.privateAudioUrl ? getMediaUrl(track.privateAudioUrl) : null,
  privateCoverUrl: track.privateCoverUrl ? getMediaUrl(track.privateCoverUrl) : null,
  publicAudioUrl: track.publicAudioUrl ? getMediaUrl(track.publicAudioUrl) : null,
  publicCoverUrl: track.publicCoverUrl ? getMediaUrl(track.publicCoverUrl) : null,
}) : track;

const mapMyTrack = (track) => track ? ({
  ...track,
  privateAudioUrl: getMediaUrl(track.privateAudioUrl),
  privateCoverUrl: track.privateCoverUrl ? getMediaUrl(track.privateCoverUrl) : null,
  publicAudioUrl: track.publicAudioUrl ? getMediaUrl(track.publicAudioUrl) : null,
  publicCoverUrl: track.publicCoverUrl ? getMediaUrl(track.publicCoverUrl) : null,
}) : track;

const mapPage = (page = {}) => ({
  ...page,
  content: (page.content || []).map(mapMusicTrack),
  number: page.number ?? 0,
  size: page.size ?? 20,
  totalElements: page.totalElements ?? 0,
  totalPages: page.totalPages ?? 0,
});

const mapMyPage = (page = {}) => ({
  ...page,
  content: (page.content || []).map(mapMyTrack),
  number: page.number ?? 0,
  size: page.size ?? 20,
  totalElements: page.totalElements ?? 0,
  totalPages: page.totalPages ?? 0,
});

export const unwrap = (res) => res?.data ?? res;

export const apiMusicService = {
  async getPublicTracks(params) {
    const data = await request(`/api/music/tracks${cleanMusicParams(params)}`);
    return mapPage(unwrap(data));
  },

  async getPublicTrack(id) {
    const data = await request(`/api/music/tracks/${id}`);
    return mapMusicTrack(unwrap(data));
  },

  async getAdminTracks(params) {
    const data = await request(`/api/admin/music/tracks${cleanMusicParams(params)}`);
    return mapPage(unwrap(data));
  },

  async getAdminTrack(id) {
    const data = await request(`/api/admin/music/tracks/${id}`);
    return mapMusicTrack(unwrap(data));
  },

  async uploadTrack(formData) {
    const data = await request('/api/admin/music/tracks', {
      method: 'POST',
      body: formData,
    });
    return unwrap(data);
  },

  async updateTrack(id, metadata) {
    const data = await request(`/api/admin/music/tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    });
    return unwrap(data);
  },

  async publishTrack(id) {
    const data = await request(`/api/admin/music/tracks/${id}/publish`, {
      method: 'POST',
    });
    return unwrap(data);
  },

  async unpublishTrack(id) {
    const data = await request(`/api/admin/music/tracks/${id}/unpublish`, {
      method: 'POST',
    });
    return unwrap(data);
  },

  async approveTrack(id) {
    const data = await request(`/api/admin/music/tracks/${id}/approve`, {
      method: 'POST',
    });
    return unwrap(data);
  },

  async rejectTrack(id, reason) {
    const data = await request(`/api/admin/music/tracks/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return unwrap(data);
  },

  async deleteTrack(id) {
    await request(`/api/admin/music/tracks/${id}`, {
      method: 'DELETE',
    });
  },

  async getMyTracks(params) {
    const data = await request(`/api/music/my-tracks${cleanMusicParams(params)}`);
    return mapMyPage(unwrap(data));
  },

  async getMyTrack(id) {
    const data = await request(`/api/music/my-tracks/${id}`);
    return mapMyTrack(unwrap(data));
  },

  async uploadMyTrack(formData) {
    const data = await request('/api/music/my-tracks', {
      method: 'POST',
      body: formData,
    });
    return mapMyTrack(unwrap(data));
  },

  async updateMyTrack(id, metadata) {
    const data = await request(`/api/music/my-tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    });
    return mapMyTrack(unwrap(data));
  },

  async deleteMyTrack(id) {
    await request(`/api/music/my-tracks/${id}`, {
      method: 'DELETE',
    });
  },
};
