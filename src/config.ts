const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000';

  const { hostname, protocol, port } = window.location;

  // If we are running on port 3000 (serve) or 5173 (vite),
  // and the backend is likely on 8000
  if (port === '3000' || port === '5173') {
    return `${protocol}//${hostname}:8000`;
  }

  // Otherwise assume backend is on the same port (Full Stack mode)
  return '';
};

export const API_URL = getApiUrl();
