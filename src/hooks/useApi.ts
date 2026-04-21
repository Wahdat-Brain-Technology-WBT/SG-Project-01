import { useState, useEffect } from 'react';

// Use relative path by default for AI Studio preview (which uses server.ts on port 3000)
// If running locally with FastAPI, set VITE_API_URL=http://127.0.0.1:8000 in .env
const API_URL = import.meta.env.VITE_API_URL || '';

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const fullUrl = `${API_URL}${endpoint}`;

      console.log("Fetching from:", fullUrl);

      const res = await fetch(fullUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errorMessage = 'Failed to fetch';

        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // FastAPI 422 Validation Error Array
            errorMessage = "Validation Error: " + errorData.detail.map((err: any) =>
              `'${err.loc[err.loc.length - 1]}' ${err.msg}`
            ).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.error) {
            errorMessage = errorData.error;
        }

        throw new Error(errorMessage);
      }

      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error("API Error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { mutate(); }, [endpoint]);

  return { data, isLoading, error, mutate };
}
