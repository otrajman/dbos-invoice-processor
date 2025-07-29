// Custom hook for API data fetching with loading states and error handling
import { useState, useEffect, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiOptions {
  immediate?: boolean; // Whether to fetch immediately on mount
  dependencies?: any[]; // Dependencies to trigger refetch
}

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { immediate = true, dependencies = [] } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState({
        data: result,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [apiCall]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData, ...dependencies]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// Hook for mutations (POST, PUT, DELETE operations)
export function useMutation<T, P = void>(
  mutationFn: (params: P) => Promise<T>
): {
  mutate: (params: P) => Promise<T>;
  loading: boolean;
  error: string | null;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (params: P): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(params);
      setLoading(false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset,
  };
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<{ data: T[]; pagination: any }>,
  initialPage = 1,
  initialLimit = 20
): UseApiState<T[]> & {
  pagination: any;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => Promise<void>;
} {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [pagination, setPagination] = useState<any>(null);

  const [state, setState] = useState<UseApiState<T[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall(page, limit);
      setState({
        data: result.data,
        loading: false,
        error: null,
      });
      setPagination(result.pagination);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      setPagination(null);
    }
  }, [apiCall, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    pagination,
    page,
    limit,
    setPage,
    setLimit,
    refetch: fetchData,
  };
}

// Hook for filtered/searched data
export function useFilteredApi<T, F>(
  apiCall: (filters: F) => Promise<T>,
  initialFilters: F
): UseApiState<T> & {
  filters: F;
  setFilters: (filters: Partial<F>) => void;
  refetch: () => Promise<void>;
} {
  const [filters, setFiltersState] = useState<F>(initialFilters);

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall(filters);
      setState({
        data: result,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [apiCall, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setFilters = useCallback((newFilters: Partial<F>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    ...state,
    filters,
    setFilters,
    refetch: fetchData,
  };
}

// Hook for real-time data that auto-refreshes
export function usePollingApi<T>(
  apiCall: () => Promise<T>,
  intervalMs = 30000, // 30 seconds default
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void>; startPolling: () => void; stopPolling: () => void } {
  const [isPolling, setIsPolling] = useState(false);
  const apiState = useApi(apiCall, options);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPolling) {
      interval = setInterval(() => {
        apiState.refetch();
      }, intervalMs);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPolling, intervalMs, apiState.refetch]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    ...apiState,
    startPolling,
    stopPolling,
  };
}
