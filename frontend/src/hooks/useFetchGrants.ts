import { useState, useEffect, useCallback } from 'react';
import { Grant, GrantFilter } from '@/types/grant';
import apiClient from '@/lib/apiClient';

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
 * Uses apiClient directly for all API communication
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

  const fetchGrants = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Convert filter to API-compatible format
      const apiFilters: Record<string, any> = {};
      
      if (filter) {
        // Basic filters
        apiFilters.search = filter.searchTerm;
        apiFilters.limit = grantsPerPage;
        apiFilters.page = filter.page;
        apiFilters.sources = filter.sources?.join(',');
        apiFilters.sort_by = filter.sortBy;
        
        // Deadline filters
        if (filter.onlyNoDeadline) {
          apiFilters.deadline_null = true;
        } else {
          if (filter.deadlineMinDays > 0) {
            const minFutureDate = new Date();
            minFutureDate.setDate(minFutureDate.getDate() + filter.deadlineMinDays);
            apiFilters.deadline_min = minFutureDate.toISOString();
          }
          
          if (filter.deadlineMaxDays < Number.MAX_SAFE_INTEGER) {
            const maxFutureDate = new Date();
            maxFutureDate.setDate(maxFutureDate.getDate() + filter.deadlineMaxDays);
            apiFilters.deadline_max = maxFutureDate.toISOString();
          }
          
          apiFilters.include_no_deadline = filter.includeNoDeadline;
        }
        
        // Funding filters
        if (filter.onlyNoFunding) {
          apiFilters.funding_null = true;
        } else {
          if (filter.fundingMin > 0) {
            apiFilters.funding_min = filter.fundingMin;
          }
          
          if (filter.fundingMax < Number.MAX_SAFE_INTEGER) {
            apiFilters.funding_max = filter.fundingMax;
          }
          
          apiFilters.include_no_funding = filter.includeFundingNull;
        }
        
        // Cost sharing filter
        if (filter.costSharing) {
          apiFilters.cost_sharing = filter.costSharing;
        }
      }
      
      // Make the API call using apiClient
      const response = await apiClient.grants.getGrants(apiFilters);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setGrants(response.data?.grants || []);
      setTotalPages(response.data?.count ? Math.ceil(response.data.count / grantsPerPage) : 1);
    } catch (error: any) {
      console.error('Error fetching grants:', error);
      setError('Failed to load grants. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filter, grantsPerPage, enabled]);

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