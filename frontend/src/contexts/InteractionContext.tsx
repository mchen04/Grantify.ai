import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../lib/apiClient';
import { UserInteraction, InteractionStatus, UserInteractionsResponse } from '../types/interaction';

// Define the shape of the context state
interface InteractionContextType {
  interactionsMap: Record<string, InteractionStatus>; // Map grantId to action (e.g., 'saved', 'applied', 'ignored')
  isLoading: boolean; // Track loading state for interactions
  fetchUserInteractions: () => Promise<void>;
  updateUserInteraction: (grantId: string, newAction: InteractionStatus | null) => Promise<void>;
  getInteractionStatus: (grantId: string) => InteractionStatus | undefined;
  lastInteractionTimestamp: number; // To trigger reactions in other components
}

// Create the context
const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

// Create the provider component
export const InteractionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get user from AuthContext
  const [interactionsMap, setInteractionsMap] = useState<Record<string, InteractionStatus>>({});
  const [lastInteractionTimestamp, setLastInteractionTimestamp] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to fetch user interactions
  const fetchUserInteractions = async () => {
    if (!user) {
      setInteractionsMap({}); // Clear interactions if no user
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiClient.users.getUserInteractions(user.id);
      const interactions: UserInteraction[] = response.data?.interactions || [];
      
      // Create a map of grantId -> action for efficient lookup
      const map: Record<string, InteractionStatus> = {};
      interactions.forEach(interaction => {
        map[interaction.grant_id] = interaction.action;
      });
      
      setInteractionsMap(map);
      console.log(`Loaded ${interactions.length} user interactions`);
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update user interaction
  const updateUserInteraction = async (grantId: string, newAction: InteractionStatus | null) => {
    if (!user) {
      console.warn('Cannot update interaction: No authenticated user');
      return;
    }
    
    const currentAction = interactionsMap[grantId] as InteractionStatus;
    const optimisticMap = { ...interactionsMap };

    if (newAction === null || (currentAction === newAction)) {
      // Optimistically remove interaction if null or toggling the same action
      delete optimisticMap[grantId];
    } else {
      // Optimistically add/update interaction
      optimisticMap[grantId] = newAction;
    }

    // Update state optimistically
    setInteractionsMap(optimisticMap);
    setLastInteractionTimestamp(Date.now()); // Update timestamp to trigger reactions

    try {
      if (newAction === null || (currentAction === newAction)) {
        // Call delete endpoint to remove the interaction
        await apiClient.users.deleteInteraction(
          user.id,
          grantId,
          currentAction
        );
      } else {
        // Call create/update endpoint
        await apiClient.users.recordInteraction(
          user.id,
          grantId,
          newAction
        );
      }
      // If backend update is successful, state is already updated optimistically
    } catch (error) {
      console.error('Error updating user interaction:', error);
      // Revert optimistic update if backend call fails
      setInteractionsMap({ ...interactionsMap }); // Revert to previous state
      setLastInteractionTimestamp(Date.now()); // Update timestamp again to trigger reactions
      // Handle error appropriately, maybe show a notification
    }
  };

  // Helper function to get interaction status
  const getInteractionStatus = (grantId: string): InteractionStatus | undefined => {
    return interactionsMap[grantId];
  };

  // Fetch interactions when user changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching interactions');
      fetchUserInteractions();
    } else {
      console.log('User not authenticated, clearing interactions');
      setInteractionsMap({});
    }
  }, [user]); // Dependency on user ensures fetch on auth state change

  return (
    <InteractionContext.Provider value={{
      interactionsMap,
      isLoading,
      fetchUserInteractions,
      updateUserInteraction,
      getInteractionStatus,
      lastInteractionTimestamp
    }}>
      {children}
    </InteractionContext.Provider>
  );
};

// Custom hook to use the InteractionContext
export const useInteractions = () => {
  const context = useContext(InteractionContext);
  if (context === undefined) {
    throw new Error('useInteractions must be used within an InteractionProvider');
  }
  return context;
};