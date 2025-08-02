import { useState, useCallback } from 'react';
import { ApiResponse, ApiError } from '@/types/api';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onFinally?: () => void;
}

interface UseApiReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (url: string, requestOptions: RequestInit = {}): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...requestOptions.headers,
        },
        ...requestOptions,
      };

      const response = await fetch(url, defaultOptions);
      const responseData: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'API request failed');
      }

      setData(responseData.data);
      options.onSuccess?.(responseData.data);
      return responseData.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
      options.onFinally?.();
    }
  }, [options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}

// Specialized hooks for common operations
export function useGet<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  return useApi<T>(options);
}

export function usePost<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  const api = useApi<T>(options);
  
  const executePost = useCallback(async (url: string, body: any): Promise<T | null> => {
    return api.execute(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [api]);

  return {
    ...api,
    execute: executePost,
  };
}

export function usePut<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  const api = useApi<T>(options);
  
  const executePut = useCallback(async (url: string, body: any): Promise<T | null> => {
    return api.execute(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }, [api]);

  return {
    ...api,
    execute: executePut,
  };
}

export function useDelete<T = any>(options: UseApiOptions = {}): UseApiReturn<T> {
  const api = useApi<T>(options);
  
  const executeDelete = useCallback(async (url: string): Promise<T | null> => {
    return api.execute(url, {
      method: 'DELETE',
    });
  }, [api]);

  return {
    ...api,
    execute: executeDelete,
  };
} 