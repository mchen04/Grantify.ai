import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create an axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or other storage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token (implementation depends on your auth system)
        // const newToken = await refreshToken();
        // localStorage.setItem('authToken', newToken);
        
        // Retry the original request with the new token
        // if (originalRequest.headers) {
        //   originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // }
        // return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          // Clear auth data
          localStorage.removeItem('authToken');
          
          // Redirect to login page
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 429 Too Many Requests (rate limiting)
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Grants API
export const grantsApi = {
  // Get all grants with optional filters
  getGrants: async (filters?: Record<string, any>) => {
    try {
      const response = await apiClient.get('/grants', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching grants:', error);
      throw error;
    }
  },
  
  // Get a specific grant by ID
  getGrantById: async (id: string) => {
    try {
      const response = await apiClient.get(`/grants/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching grant ${id}:`, error);
      throw error;
    }
  },
  
  // Get recommended grants for a user
  getRecommendedGrants: async (limit?: number) => {
    try {
      const response = await apiClient.get('/grants/recommended', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recommended grants:', error);
      throw error;
    }
  },
  
  // Trigger recommendation update for current user
  triggerRecommendationUpdate: async () => {
    try {
      const response = await apiClient.post('/grants/trigger-recommendations');
      return response.data;
    } catch (error) {
      console.error('Error triggering recommendation update:', error);
      throw error;
    }
  }
};

// Users API
export const usersApi = {
  // Get user preferences
  getUserPreferences: async () => {
    try {
      const response = await apiClient.get('/users/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },
  
  // Update user preferences
  updateUserPreferences: async (preferences: any) => {
    try {
      const response = await apiClient.post('/users/preferences', { preferences });
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },
  
  // Record user interaction with a grant
  recordInteraction: async (grantId: string, action: 'saved' | 'applied' | 'ignored') => {
    try {
      const response = await apiClient.post('/users/interactions', {
        grant_id: grantId,
        action,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error recording interaction:', error);
      throw error;
    }
  },
  
  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateUserProfile: async (profileData: any) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};

export default {
  grants: grantsApi,
  users: usersApi
};