export const API_URL = typeof window !== 'undefined' && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (typeof window !== 'undefined'
      ? (window.location.hostname.includes('run.app') ? '' : `${window.location.protocol}//${window.location.hostname}:8000`)
      : 'http://127.0.0.1:8000');
