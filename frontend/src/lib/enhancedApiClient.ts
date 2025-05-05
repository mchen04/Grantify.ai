/**
 * Enhanced API client that provides the same functionality as direct Supabase queries
 * but uses the backend API instead.
 */

import apiClient from './apiClient';

// Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Enhanced grants API
export const grantsApi = {
  // Get all grants with filtering
  getGrants: async (filters?: Record<string, any>) => {
    return apiClient.grants.getGrants(filters);
  },
  
  // Get a specific grant by ID
  getGrantById: async (id: string) => {
    return apiClient.grants.getGrantById(id);
  },
  
  // Get recommended grants for a user
  getRecommendedGrants: async (userId: string) => {
    return apiClient.grants.getRecommendedGrants(userId);
  },
  
  // Build a query for grants (replacement for buildGrantQuery)
  buildQuery: (filter: any, grantsPerPage: number = 10) => {
    // Convert the filter to API-compatible format
    const apiFilters = {
      search: filter.searchTerm,
      funding_min: filter.fundingMin,
      funding_max: filter.fundingMax,
      eligible_applicant_types: filter.eligible_applicant_types,
      activity_categories: filter.activity_categories,
      grant_type: filter.grant_type,
      status: filter.status,
      keywords: filter.keywords,
      page: filter.page,
      limit: grantsPerPage
    };
    
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
  },
  
  // Mimic Supabase's from() method
  from: (table: string) => {
    if (table !== 'grants') {
      console.warn(`Table ${table} not supported in enhanced API client`);
    }
    
    return {
      select: (columns: string) => {
        return {
          eq: (column: string, value: any) => {
            return {
              single: async () => {
                try {
                  if (column === 'id') {
                    const response = await apiClient.grants.getGrantById(value);
                    return {
                      data: response.data?.grant || null,
                      error: response.error
                    };
                  } else {
                    throw new Error(`Column ${column} not supported for eq operation`);
                  }
                } catch (error) {
                  return {
                    data: null,
                    error
                  };
                }
              }
            };
          }
        };
      }
    };
  }
};

// Enhanced users API
export const usersApi = {
  // Get user preferences
  getUserPreferences: async (userId: string) => {
    try {
      const response = await apiClient.users.getUserPreferences(userId);
      return {
        data: response.data?.preferences || null,
        error: response.error
      };
    } catch (error) {
      return {
        data: null,
        error
      };
    }
  },
  
  // Update user preferences
  updateUserPreferences: async (userId: string, preferences: any) => {
    try {
      const response = await apiClient.users.updateUserPreferences(userId, preferences);
      return {
        data: response.data?.preferences || null,
        error: response.error
      };
    } catch (error) {
      return {
        data: null,
        error
      };
    }
  },
  
  // Record user interaction with a grant
  recordInteraction: async (userId: string, grantId: string, action: 'saved' | 'applied' | 'ignored') => {
    try {
      const response = await apiClient.users.recordInteraction(userId, grantId, action);
      return {
        data: response.data?.interaction || null,
        error: response.error
      };
    } catch (error) {
      return {
        data: null,
        error
      };
    }
  },
  
  // Get user interactions
  getUserInteractions: async (userId: string, action?: 'saved' | 'applied' | 'ignored') => {
    try {
      // Use a custom endpoint for user interactions
      const endpoint = action 
        ? `/users/interactions?userId=${userId}&action=${action}`
        : `/users/interactions?userId=${userId}`;
      
      // Make a direct fetch request since this endpoint isn't in the apiClient
      const response = await fetch(`/api${endpoint}`);
      const data = await response.json();
      
      return {
        data: data?.interactions || [],
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error
      };
    }
  },
  
  // Mimic Supabase's from() method
  from: (table: string) => {
    return {
      select: (columns: string) => {
        return {
          eq: (column: string, value: any) => {
            return {
              async then(callback: any) {
                try {
                  if (table === 'user_interactions' && column === 'user_id') {
                    const response = await fetch(`/api/users/interactions?userId=${value}`);
                    const data = await response.json();
                    return callback({
                      data: data?.interactions || [],
                      error: null
                    });
                  } else if (table === 'user_preferences' && column === 'user_id') {
                    const response = await fetch(`/api/users/preferences?userId=${value}`);
                    const data = await response.json();
                    return callback({
                      data: data?.preferences || null,
                      error: null
                    });
                  } else {
                    throw new Error(`Table ${table} or column ${column} not supported`);
                  }
                } catch (error) {
                  return callback({
                    data: null,
                    error
                  });
                }
              }
            };
          }
        };
      },
      insert: (data: any) => {
        return {
          async then(callback: any) {
            try {
              if (table === 'user_interactions') {
                const response = await fetch('/api/users/interactions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(data)
                });
                const responseData = await response.json();
                return callback({
                  data: responseData?.interaction || null,
                  error: null
                });
              } else {
                throw new Error(`Table ${table} not supported for insert operation`);
              }
            } catch (error) {
              return callback({
                data: null,
                error
              });
            }
          }
        };
      },
      upsert: (data: any, options?: any) => {
        return {
          async then(callback: any) {
            try {
              if (table === 'user_preferences') {
                const response = await fetch('/api/users/preferences', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ preferences: data })
                });
                const responseData = await response.json();
                return callback({
                  data: responseData?.preferences || null,
                  error: null
                });
              } else {
                throw new Error(`Table ${table} not supported for upsert operation`);
              }
            } catch (error) {
              return callback({
                data: null,
                error
              });
            }
          }
        };
      }
    };
  }
};

// Create a Supabase-like client
const enhancedClient = {
  from: (table: string) => {
    if (table === 'grants') {
      return grantsApi.from(table);
    } else if (table === 'user_interactions' || table === 'user_preferences') {
      return usersApi.from(table);
    } else {
      console.warn(`Table ${table} not supported in enhanced API client`);
      return {
        select: () => ({
          eq: () => ({
            then: (callback: any) => callback({ data: null, error: new Error(`Table ${table} not supported`) })
          })
        })
      };
    }
  },
  auth: {
    getUser: async () => {
      try {
        // This would need to be implemented with your auth system
        return { data: { user: null }, error: null };
      } catch (error) {
        return { data: { user: null }, error };
      }
    }
  }
};

export default enhancedClient;