import { GrantFilter } from '@/types/grant';
import apiClient from '@/lib/apiClient';
import enhancedClient from '@/lib/enhancedApiClient';

/**
 * Builds a query for dashboard grants based on the provided filters
 * Similar to grantQueryBuilder but optimized for dashboard use cases
 * @param userId - The user ID to fetch interactions for
 * @param action - The interaction action to filter by ('saved', 'applied', 'ignored', or null for recommended)
 * @param filter - Filter parameters (search, sort, etc.)
 * @param grantsPerPage - Number of grants to return per page
 * @returns Promise-like query object
 */
export const buildDashboardQuery = async (
  userId: string,
  action: 'saved' | 'applied' | 'ignored' | null,
  filter: {
    searchTerm: string;
    sortBy: string;
    filterOnlyNoDeadline: boolean;
    filterOnlyNoFunding: boolean;
    page: number;
  },
  grantsPerPage: number = 10
) => {
  // Create a promise-like object that mimics Supabase's query interface
  return {
    async then(callback: any) {
      try {
        if (action === null) {
          // For recommended grants, we need to find grants without interactions
          
          // Get all grants the user has interacted with
          const interactionsResponse = await apiClient.users.getUserInteractions(userId);
          const interactedGrants = interactionsResponse.data?.interactions || [];
          const interactedGrantIds = interactedGrants.map(i => i.grant_id) || [];
          
          // Build API filters for recommended grants
          const apiFilters: Record<string, any> = {
            search: filter.searchTerm,
            limit: grantsPerPage,
            page: filter.page,
            exclude_ids: interactedGrantIds.join(',')
          };
          
          // Apply deadline filter
          if (filter.filterOnlyNoDeadline) {
            apiFilters.deadline_null = true;
          } else {
            // Only active grants for recommended tab
            apiFilters.active_only = true;
          }
          
          // Apply funding filter
          if (filter.filterOnlyNoFunding) {
            apiFilters.funding_null = true;
          }
          
          // Apply sorting
          apiFilters.sort_by = filter.sortBy;
          
          // Get grants using the API client
          const response = await apiClient.grants.getGrants(apiFilters);
          
          return callback({
            data: response.data?.grants || [],
            error: response.error || null,
            count: response.data?.count || 0
          });
        } else {
          // For saved, applied, or ignored grants, we fetch via interactions
          const apiFilters: Record<string, any> = {
            userId: userId,
            action: action,
            search: filter.searchTerm,
            page: filter.page,
            limit: grantsPerPage
          };
          
          // Apply deadline filter
          if (filter.filterOnlyNoDeadline) {
            apiFilters.deadline_null = true;
          }
          
          // Apply funding filter
          if (filter.filterOnlyNoFunding) {
            apiFilters.funding_null = true;
          }
          
          // Apply sorting
          apiFilters.sort_by = filter.sortBy;
          
          // Get user interactions with grants using the API client
          const response = await fetch(`/api/users/interactions?${new URLSearchParams(apiFilters as Record<string, string>).toString()}`);
          const data = await response.json();
          
          // Format the response to match the expected structure
          const interactions = data?.interactions || [];
          const grants = interactions.map((interaction: any) => interaction.grants);
          
          return callback({
            data: grants,
            error: null,
            count: data?.count || interactions.length
          });
        }
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