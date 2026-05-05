import { API_URL } from '../config';

export const fetchApi = async (endpoint: string, options: RequestInit = {}, customTimeout = 15000) => {
  const token = localStorage.getItem('admin_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), customTimeout);
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  try {
    console.log(`[API] Fetching: ${fullUrl}`);
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `HTTP Error ${response.status}`;

      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) =>
            `'${err.loc?.[err.loc.length - 1] || 'Field'}' ${err.msg}`
          ).join(' | ');
        } else {
          errorMessage = errorData.detail;
        }
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }

      throw new Error(errorMessage);
    }

    // Handles 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(id);
    console.error(`[API] Error on ${fullUrl}:`, error);

    if (error.name === 'AbortError' || error.message.includes('aborted') || error.message.includes('Failed to fetch')) {
      throw new Error('سیستم نتوانست با سرور بک‌اند ارتباط برقرار کند. لطفاً مطمئن شوید سرور (پای چارم) بدون مشکل در پورت 8000 روشن است و خطایی در ترمینال آن وجود ندارد.');
    }

    throw error;
  }
};
