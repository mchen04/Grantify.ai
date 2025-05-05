import { GrantFilter } from '@/types/grant';
import apiClient from '@/lib/apiClient';
import { MAX_FUNDING, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '@/utils/constants';

/**
 * Builds an API query for grants based on the provided filters
 * @param filter - Grant filter parameters
 * @returns API query object with promise-like interface
 */
export const buildGrantQuery = async (
  filter: GrantFilter,
  grantsPerPage: number = 10
) => {
  // Convert filter to API-compatible format
  const apiFilters: Record<string, any> = {
    search: filter.searchTerm,
    limit: grantsPerPage,
    page: filter.page,
    sources: filter.sources?.join(','),
    sort_by: filter.sortBy
  };
  
  // --- APPLY DEADLINE FILTER ---
  if (filter.onlyNoDeadline) {
    apiFilters.deadline_null = true;
  } else {
    if (filter.deadlineMinDays > MIN_DEADLINE_DAYS) {
      const minFutureDate = new Date();
      minFutureDate.setDate(minFutureDate.getDate() + filter.deadlineMinDays);
      apiFilters.deadline_min = minFutureDate.toISOString();
    }
    
    if (filter.deadlineMaxDays < MAX_DEADLINE_DAYS) {
      const maxFutureDate = new Date();
      maxFutureDate.setDate(maxFutureDate.getDate() + filter.deadlineMaxDays);
      apiFilters.deadline_max = maxFutureDate.toISOString();
    }
    
    apiFilters.include_no_deadline = filter.includeNoDeadline;
  }
  
  // --- APPLY FUNDING FILTER ---
  if (filter.onlyNoFunding) {
    apiFilters.funding_null = true;
  } else {
    if (filter.fundingMin > 0) {
      apiFilters.funding_min = filter.fundingMin;
    }
    
    if (filter.fundingMax < MAX_FUNDING) {
      apiFilters.funding_max = filter.fundingMax;
    }
    
    apiFilters.include_no_funding = filter.includeFundingNull;
  }
  
  // --- APPLY COST SHARING FILTER ---
  if (filter.costSharing) {
    apiFilters.cost_sharing = filter.costSharing;
  }
  
  // Create a promise-like object that mimics Supabase's query interface
  return {
    async then(callback: any) {
      try {
        const response = await apiClient.grants.getGrants(apiFilters);
        
        if (response.error) {
          throw response.error;
        }
        
        // Format the response to match the Supabase response
        const result = {
          data: response.data?.grants || [],
          error: null,
          count: response.data?.count || 0
        };
        
        return callback(result);
      } catch (error) {
        return callback({
          data: null,
          error,
          count: 0
        });
      }
    }
  };
};