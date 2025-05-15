import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../lib/apiClient';
import { UserInteraction, InteractionStatus } from '../types/interaction';
import { isDevelopment } from '../utils/constants';

// Define the shape of the context state
interface UserInteractionsContextType {
  interactions: UserInteraction[];
  interactionsMap: Record<string, InteractionStatus>; // Map grantId to action
  interactedGrantIds: string[]; // List of all grant IDs the user has interacted with
  interactionsByType: {
    saved: UserInteraction[];
    applied: UserInteraction[];
    ignored: UserInteraction[];
  };
  isLoading: boolean;
  error: string | null;
  fetchUserInteractions: () => Promise<void>;
  recordInteraction: (grantId: string, action: InteractionStatus) => Promise<void>;
  deleteInteraction: (grantId: string, action: InteractionStatus) => Promise<void>;
  getInteractionStatus: (grantId: string) => InteractionStatus | undefined;
  hasInteracted: (grantId: string) => boolean;
  lastInteractionTimestamp: number; // To trigger reactions in other components
  clearError: () => void;
}

// Define the state type
interface UserInteractionsState {
  interactions: UserInteraction[];
  interactionsMap: Record<string, InteractionStatus>;
  interactionsByType: {
    saved: UserInteraction[];
    applied: UserInteraction[];
    ignored: UserInteraction[];
  };
  isLoading: boolean;
  error: string | null;
  lastInteractionTimestamp: number;
  pendingOperations: Map<string, { type: string; timestamp: number }>;
}

// Define action types
type UserInteractionsAction =
  | { type: 'FETCH_INTERACTIONS_START' }
  | { type: 'FETCH_INTERACTIONS_SUCCESS'; payload: UserInteraction[] }
  | { type: 'FETCH_INTERACTIONS_ERROR'; payload: string }
  | { type: 'RECORD_INTERACTION_START'; payload: { grantId: string; action: InteractionStatus } }
  | { type: 'RECORD_INTERACTION_SUCCESS'; payload: UserInteraction }
  | { type: 'RECORD_INTERACTION_ERROR'; payload: string }
  | { type: 'DELETE_INTERACTION_START'; payload: { grantId: string; action: InteractionStatus } }
  | { type: 'DELETE_INTERACTION_SUCCESS'; payload: { grantId: string; action: InteractionStatus } }
  | { type: 'DELETE_INTERACTION_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Create the context
const UserInteractionsContext = createContext<UserInteractionsContextType | undefined>(undefined);

// Initial state
const initialState: UserInteractionsState = {
  interactions: [],
  interactionsMap: {},
  interactionsByType: {
    saved: [],
    applied: [],
    ignored: []
  },
  isLoading: false,
  error: null,
  lastInteractionTimestamp: Date.now(),
  pendingOperations: new Map()
};

// Reducer function
const userInteractionsReducer = (state: UserInteractionsState, action: UserInteractionsAction): UserInteractionsState => {
  switch (action.type) {
    case 'FETCH_INTERACTIONS_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'FETCH_INTERACTIONS_SUCCESS': {
      const userInteractions = action.payload;
      
      // Create a map of grantId -> action for efficient lookup
      const map: Record<string, InteractionStatus> = {};
      userInteractions.forEach(interaction => {
        map[interaction.grant_id] = interaction.action;
      });
      
      // Group interactions by type
      const saved = userInteractions.filter(i => i.action === 'saved');
      const applied = userInteractions.filter(i => i.action === 'applied');
      const ignored = userInteractions.filter(i => i.action === 'ignored');
      
      return {
        ...state,
        interactions: userInteractions,
        interactionsMap: map,
        interactionsByType: { saved, applied, ignored },
        isLoading: false,
        error: null
      };
    }
    
    case 'FETCH_INTERACTIONS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'RECORD_INTERACTION_START': {
      const { grantId, action: interactionAction } = action.payload;
      const timestamp = Date.now();
      
      // Create a new pending operation
      const newPendingOperations = new Map(state.pendingOperations);
      newPendingOperations.set(grantId, { type: 'record', timestamp });
      
      // Create optimistic update
      const updatedInteractions = [...state.interactions];
      const existingIndex = updatedInteractions.findIndex(i => i.grant_id === grantId);
      
      if (existingIndex >= 0) {
        // Update existing interaction
        updatedInteractions[existingIndex] = {
          ...updatedInteractions[existingIndex],
          action: interactionAction,
          timestamp: new Date().toISOString()
        };
      } else {
        // Add new interaction with temporary ID
        updatedInteractions.push({
          id: `temp-${timestamp}`,
          user_id: '', // Will be filled by backend
          grant_id: grantId,
          action: interactionAction,
          timestamp: new Date().toISOString()
        });
      }
      
      // Update the map
      const updatedMap = { ...state.interactionsMap, [grantId]: interactionAction };
      
      // Update interactions by type
      const updatedByType = {
        saved: interactionAction === 'saved'
          ? [...state.interactionsByType.saved.filter(i => i.grant_id !== grantId),
             updatedInteractions.find(i => i.grant_id === grantId) as UserInteraction]
          : state.interactionsByType.saved.filter(i => i.grant_id !== grantId),
        applied: interactionAction === 'applied'
          ? [...state.interactionsByType.applied.filter(i => i.grant_id !== grantId),
             updatedInteractions.find(i => i.grant_id === grantId) as UserInteraction]
          : state.interactionsByType.applied.filter(i => i.grant_id !== grantId),
        ignored: interactionAction === 'ignored'
          ? [...state.interactionsByType.ignored.filter(i => i.grant_id !== grantId),
             updatedInteractions.find(i => i.grant_id === grantId) as UserInteraction]
          : state.interactionsByType.ignored.filter(i => i.grant_id !== grantId)
      };
      
      return {
        ...state,
        interactions: updatedInteractions,
        interactionsMap: updatedMap,
        interactionsByType: updatedByType,
        lastInteractionTimestamp: timestamp,
        pendingOperations: newPendingOperations,
        isLoading: true
      };
    }
    
    case 'RECORD_INTERACTION_SUCCESS': {
      // Remove the pending operation
      const newPendingOperations = new Map(state.pendingOperations);
      newPendingOperations.delete(action.payload.grant_id);
      
      return {
        ...state,
        isLoading: newPendingOperations.size > 0,
        pendingOperations: newPendingOperations
      };
    }
    
    case 'RECORD_INTERACTION_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'DELETE_INTERACTION_START': {
      const { grantId, action: interactionAction } = action.payload;
      const timestamp = Date.now();
      
      // Create a new pending operation
      const newPendingOperations = new Map(state.pendingOperations);
      newPendingOperations.set(grantId, { type: 'delete', timestamp });
      
      // Optimistically update the UI
      const updatedInteractions = state.interactions.filter(
        i => !(i.grant_id === grantId && i.action === interactionAction)
      );
      
      // Update the map
      const updatedMap = { ...state.interactionsMap };
      delete updatedMap[grantId];
      
      // Update interactions by type
      const updatedByType = {
        saved: state.interactionsByType.saved.filter(i => !(i.grant_id === grantId && i.action === interactionAction)),
        applied: state.interactionsByType.applied.filter(i => !(i.grant_id === grantId && i.action === interactionAction)),
        ignored: state.interactionsByType.ignored.filter(i => !(i.grant_id === grantId && i.action === interactionAction))
      };
      
      return {
        ...state,
        interactions: updatedInteractions,
        interactionsMap: updatedMap,
        interactionsByType: updatedByType,
        lastInteractionTimestamp: timestamp,
        pendingOperations: newPendingOperations,
        isLoading: true
      };
    }
    
    case 'DELETE_INTERACTION_SUCCESS': {
      // Remove the pending operation
      const newPendingOperations = new Map(state.pendingOperations);
      newPendingOperations.delete(action.payload.grantId);
      
      return {
        ...state,
        isLoading: newPendingOperations.size > 0,
        pendingOperations: newPendingOperations
      };
    }
    
    case 'DELETE_INTERACTION_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create the provider component
export const UserInteractionsProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const [state, dispatch] = useReducer(userInteractionsReducer, initialState);
  
  // Compute list of all interacted grant IDs
  const interactedGrantIds = Object.keys(state.interactionsMap);

  // Function to fetch user interactions
  const fetchUserInteractions = useCallback(async () => {
    if (!user || !session?.access_token) {
      dispatch({ type: 'FETCH_INTERACTIONS_SUCCESS', payload: [] });
      return;
    }
    
    dispatch({ type: 'FETCH_INTERACTIONS_START' });
    
    try {
      const response = await apiClient.users.getUserInteractions(
        user.id,
        undefined,
        undefined,
        undefined,
        session.access_token
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const userInteractions: UserInteraction[] = response.data?.interactions || [];
      dispatch({ type: 'FETCH_INTERACTIONS_SUCCESS', payload: userInteractions });
      
      if (isDevelopment) {
        console.log(`Loaded ${userInteractions.length} user interactions`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user interactions';
      if (isDevelopment) {
        console.error('Error fetching user interactions:', errorMessage);
      }
      dispatch({ type: 'FETCH_INTERACTIONS_ERROR', payload: errorMessage });
    }
  }, [user, session]);

  // Function to record a new interaction
  const recordInteraction = useCallback(async (grantId: string, action: InteractionStatus) => {
    if (!user || !session?.access_token) {
      dispatch({ type: 'RECORD_INTERACTION_ERROR', payload: 'You must be logged in to perform this action' });
      return;
    }
    
    // Optimistically update the UI
    dispatch({
      type: 'RECORD_INTERACTION_START',
      payload: { grantId, action }
    });
    
    try {
      // Call the API
      const response = await apiClient.users.recordInteraction(
        user.id,
        grantId,
        action,
        session.access_token
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update state with the server response
      dispatch({
        type: 'RECORD_INTERACTION_SUCCESS',
        payload: response.data?.interaction || { grant_id: grantId, action }
      });
      
      // Refresh interactions to get the server-generated ID and any other updates
      await fetchUserInteractions();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record interaction';
      if (isDevelopment) {
        console.error('Error recording interaction:', errorMessage);
      }
      dispatch({ type: 'RECORD_INTERACTION_ERROR', payload: errorMessage });
      
      // Revert optimistic update
      await fetchUserInteractions();
    }
  }, [user, session, fetchUserInteractions]);

  // Function to delete an interaction
  const deleteInteraction = useCallback(async (grantId: string, action: InteractionStatus) => {
    if (!user || !session?.access_token) {
      dispatch({ type: 'DELETE_INTERACTION_ERROR', payload: 'You must be logged in to perform this action' });
      return;
    }
    
    // Optimistically update the UI
    dispatch({
      type: 'DELETE_INTERACTION_START',
      payload: { grantId, action }
    });
    
    try {
      // Call the API
      const response = await apiClient.users.deleteInteraction(
        user.id,
        grantId,
        action,
        session.access_token
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      dispatch({
        type: 'DELETE_INTERACTION_SUCCESS',
        payload: { grantId, action }
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete interaction';
      if (isDevelopment) {
        console.error('Error deleting interaction:', errorMessage);
      }
      dispatch({ type: 'DELETE_INTERACTION_ERROR', payload: errorMessage });
      
      // Revert optimistic update
      await fetchUserInteractions();
    }
  }, [user, session, fetchUserInteractions]);

  // Helper function to get interaction status for a grant
  const getInteractionStatus = useCallback((grantId: string): InteractionStatus | undefined => {
    return state.interactionsMap[grantId];
  }, [state.interactionsMap]);

  // Helper function to check if user has interacted with a grant
  const hasInteracted = useCallback((grantId: string): boolean => {
    return grantId in state.interactionsMap;
  }, [state.interactionsMap]);
  
  // Function to clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Fetch interactions when user changes
  useEffect(() => {
    if (user && session?.access_token) {
      if (isDevelopment) {
        console.log('User authenticated, fetching interactions');
      }
      fetchUserInteractions();
    } else {
      if (isDevelopment) {
        console.log('User not authenticated, clearing interactions');
      }
      dispatch({ type: 'FETCH_INTERACTIONS_SUCCESS', payload: [] });
    }
  }, [user, session, fetchUserInteractions]);

  return (
    <UserInteractionsContext.Provider value={{
      interactions: state.interactions,
      interactionsMap: state.interactionsMap,
      interactedGrantIds,
      interactionsByType: state.interactionsByType,
      isLoading: state.isLoading,
      error: state.error,
      fetchUserInteractions,
      recordInteraction,
      deleteInteraction,
      getInteractionStatus,
      hasInteracted,
      lastInteractionTimestamp: state.lastInteractionTimestamp,
      clearError
    }}>
      {children}
    </UserInteractionsContext.Provider>
  );
};

// Custom hook to use the UserInteractionsContext
export const useUserInteractions = () => {
  const context = useContext(UserInteractionsContext);
  if (context === undefined) {
    throw new Error('useUserInteractions must be used within a UserInteractionsProvider');
  }
  return context;
};