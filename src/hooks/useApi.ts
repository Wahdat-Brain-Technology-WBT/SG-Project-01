import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export function useApi<T>(endpoint: string, options?: { pollInterval?: number }) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutate = async () => {
    // Keep loading state true only on first load if we don't hold previous data, or generally avoiding flashing.
    // If it's a background poll, we might not want to set isLoading(true) to avoid UI flashes.
    if (!data) setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const fullUrl = `${API_URL}${endpoint}`;

      const res = await fetch(fullUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error("Server returned HTML. Ensure you run 'npm run build' so the frontend hits the API correctly.");
      }

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

  useEffect(() => {
    mutate();
    if (options?.pollInterval) {
      const interval = setInterval(mutate, options.pollInterval);
      return () => clearInterval(interval);
    }
  }, [endpoint, options?.pollInterval]);

  return { data, isLoading, error, mutate };
}
