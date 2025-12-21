const VITE_API_URL: unknown = import.meta.env.VITE_API_URL;

export const API_BASE_URL = (
  typeof VITE_API_URL === 'string' && VITE_API_URL.length > 0 
    ? VITE_API_URL 
    : 'http://localhost:3001/api'
).replace(/\/$/, '');

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
export const API_HEALTH_URL = `${API_ORIGIN}/health`;
export const API_UPLOAD_URL = `${API_BASE_URL}/upload/bilhete`;
