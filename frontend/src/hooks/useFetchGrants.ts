import { useState, useEffect, useCallback } from 'react';
import { Grant, GrantFilter } from '@/types/grant';
import { buildGrantQuery } from '@/utils/grantQueryBuilder';
import enhancedApiClient from '@/lib/enhancedApiClient';

interface UseFetchGrantsProps {
  filter?: GrantFilter;
  grantsPerPage?: number;
  enabled?: boolean;
}

interface UseFetchGrantsReturn {
  grants: Grant[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching grants with filtering, sorting, and pagination
 * Uses the enhanced API client instead of direct Supabase access
 */
export function useFetchGrants({
  filter,
  grantsPerPage = 10,
  enabled = true
}: UseFetchGrantsProps): UseFetchGrantsReturn {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  // Memoize the buildGrantQuery call to optimize performance
  const buildMemoizedQuery = useCallback(async () => {
    if (!filter) {
      // If no filter is provided, use the enhanced API client
      return enhancedApiClient.from('grants').select('*');
    }
    return await buildGrantQuery(filter, grantsPerPage);
  }, [filter, grantsPerPage]);

  const fetchGrants = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const query = await buildMemoizedQuery();
      const { data, error: queryError, count } = await query;
      
      if (queryError) throw queryError;
      
      setGrants(data || []);
      setTotalPages(count ? Math.ceil(count / grantsPerPage) : 1);
    } catch (error: any) {
      console.error('Error fetching grants:', error);
      setError('Failed to load grants. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [buildMemoizedQuery, grantsPerPage, enabled]);

  // Fetch grants when dependencies change
  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  return {
    grants,
    loading,
    error,
    totalPages,
    refetch: fetchGrants
  };
}