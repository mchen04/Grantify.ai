import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabaseClient'; // Import the db helper
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { UserInteraction } from '../types/interaction';

interface UseFetchUserInteractionsProps {
  userId: string | undefined;
  enabled?: boolean;
}

interface UseFetchUserInteractionsReturn {
  interactions: UserInteraction[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching user interactions using public user identifier
 */
const useFetchUserInteractions = ({
  userId,
  enabled = true
}: UseFetchUserInteractionsProps): UseFetchUserInteractionsReturn => {
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth(); // Get session from useAuth
  const accessToken = session?.access_token; // Extract accessToken from session

  const fetchInteractions = useCallback(async () => {
    if (!userId || !enabled) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    if (!accessToken) {
      console.warn("Access token not available. Please log in.");
      setInteractions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors
      // Use the db helper to fetch interactions for the specified user
      // The supabase client already handles authentication internally
      const { data, error: fetchError } = await db.users.getUserInteractions(userId);

      if (fetchError) {
        console.error('Error fetching user interactions:', fetchError);
        setError(fetchError);
        setInteractions([]); // Set to empty on error
      } else {
        // The data now only contains user_interactions without the grants join
        // We need to extract just the interactions array
        const interactionsArray = data || [];
        setInteractions(interactionsArray); // Set interactions, default to empty array if data is null
      }
    } catch (err) {
      console.error('Unexpected error fetching user interactions:', err);
      setError(err as Error);
      setInteractions([]); // Set to empty on unexpected error
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, accessToken]); // Dependencies include userId and accessToken

  useEffect(() => {
    if (enabled) {
      fetchInteractions();
    }
  }, [fetchInteractions, enabled]); // Rerun effect when dependencies change

  return {
    interactions,
    loading,
    error,
    refetch: fetchInteractions
  };
};

export default useFetchUserInteractions;