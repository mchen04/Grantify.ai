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
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
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
  // Get all grants with optional filters
  getGrants: async (filters?: Record<string, any>) => {
    const queryParams = filters
      ? `?${new URLSearchParams(filters as Record<string, string>).toString()}`
      : '';
    
    return fetchApi<any>(`/grants${queryParams}`);
  },
  
  // Get a specific grant by ID
  getGrantById: async (id: string) => {
    return fetchApi<any>(`/grants/${id}`);
  },
  
  // Get recommended grants for a user
  getRecommendedGrants: async (userId: string) => {
    return fetchApi<any>(`/grants/recommended?userId=${userId}`);
  },
};

// Users API
export const usersApi = {
  // Get user preferences
  getUserPreferences: async (userId: string) => {
    return fetchApi<any>(`/users/preferences?userId=${userId}`);
  },
  
  // Update user preferences
  updateUserPreferences: async (userId: string, preferences: any) => {
    return fetchApi<any>('/users/preferences', {
      method: 'POST',
      body: JSON.stringify({ userId, preferences }),
    });
  },
  
  // Record user interaction with a grant
  recordInteraction: async (userId: string, grantId: string, action: 'saved' | 'applied' | 'ignored') => {
    return fetchApi<any>('/users/interactions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        grant_id: grantId,
        action,
        timestamp: new Date().toISOString(),
      }),
    });
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