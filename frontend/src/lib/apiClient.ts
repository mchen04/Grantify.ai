/**
 * API client for communicating with the backend
 */

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Generic fetch function with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.message || 'An error occurred',
      };
    }
    
    return { data: data as T };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: 'Failed to connect to the server',
    };
  }
}

// Grants API
export const grantsApi = {
  // Get all grants with optional filters and sorting
  getGrants: async (filters?: Record<string, any>, sortBy?: string, accessToken?: string | null) => {
    const params = new URLSearchParams(filters as Record<string, string>);
    if (sortBy) {
      params.append('sortBy', sortBy);
    }
    const queryParams = params.toString()
      ? `?${new URLSearchParams(filters as Record<string, string>).toString()}`
      : '';
    
    return fetchApi<any>(`/grants${queryParams}`, {}, accessToken);
  },
  
  // Get a specific grant by ID
  getGrantById: async (id: string, accessToken?: string | null) => {
    return fetchApi<any>(`/grants/${id}`, {}, accessToken);
  },
  
  // Get similar grants
  getSimilarGrants: async (params: Record<string, any>, accessToken?: string | null) => {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<any>(`/grants/similar?${queryParams}`, {}, accessToken);
  },
  
  // Get recommended grants for a user
  getRecommendedGrants: async (userId: string, options?: { exclude?: string[], limit?: number }, accessToken?: string | null) => {
    let queryParams = `?userId=${userId}`;
    
    if (options?.exclude && options.exclude.length > 0) {
      queryParams += `&exclude=${options.exclude.join(',')}`;
    }
    
    if (options?.limit) {
      queryParams += `&limit=${options.limit}`;
    }
    
    return fetchApi<any>(`/grants/recommended${queryParams}`, {}, accessToken);
  },
};

// Users API
export const usersApi = {
  // Get user preferences
  getUserPreferences: async (userId: string, accessToken?: string | null) => {
    // Ensure userId is passed as a query parameter as per backend expectation
    return fetchApi<any>(`/users/preferences?userId=${userId}`, {}, accessToken);
  },

  // Update user preferences
  updateUserPreferences: async (userId: string, preferences: any, accessToken?: string | null) => {
    return fetchApi<any>(`/users/preferences`, { // Removed userId from path, will be in body or query
      method: 'PUT', // Changed from POST to PUT
      body: JSON.stringify({ userId, preferences }), // Assuming userId might still be needed in body by backend
    }, accessToken);
  },

  // Delete user preferences
  deleteUserPreferences: async (userId: string, preferenceIds: string[], accessToken?: string | null) => {
    // Assuming backend expects preferenceIds in the body for deletion
    // And userId might be in query or body depending on backend implementation
    return fetchApi<any>(`/users/preferences`, {
      method: 'DELETE',
      body: JSON.stringify({ userId, preferenceIds }),
    }, accessToken);
  },
  
  // Record user interaction with a grant
  recordInteraction: async (userId: string, grantId: string, action: 'saved' | 'applied' | 'ignored', accessToken?: string | null) => {
    return fetchApi<any>('/users/interactions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        grant_id: grantId,
        action,
        timestamp: new Date().toISOString(),
      }),
    }, accessToken);
  },

  // Get user interactions
  getUserInteractions: async (
    userId: string,
    action?: 'saved' | 'applied' | 'ignored',
    grantId?: string,
    additionalParams?: Record<string, any>,
    accessToken?: string | null
  ) => {
    let queryParams = `?userId=${userId}`;
    
    if (action) {
      queryParams += `&action=${action}`;
    }
    
    if (grantId) {
      queryParams += `&grant_id=${grantId}`;
    }
    
    // Add any additional parameters
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }
    
    return fetchApi<any>(`/users/interactions${queryParams}`, {}, accessToken);
  },
  
  // Delete user interaction
  deleteInteraction: async (userId: string, grantId: string, action: 'saved' | 'applied' | 'ignored', accessToken?: string | null) => {
    return fetchApi<any>('/users/interactions/delete', {
      method: 'DELETE',
      body: JSON.stringify({
        user_id: userId,
        grant_id: grantId,
        action: action
      }),
    }, accessToken);
  },
};

// Auth API (to be implemented with Supabase)
export const authApi = {
  // Get current user
  getCurrentUser: async () => {
    // This will be implemented with Supabase Auth
    return null;
  },
};

export default {
  grants: grantsApi,
  users: usersApi,
  auth: authApi,
};