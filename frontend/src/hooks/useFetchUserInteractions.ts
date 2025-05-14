import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { UserInteraction } from '../types/interaction';

const useFetchUserInteractions = () => {
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual userId from auth context
        const userId = 'placeholder_user_id';
        const response = await apiClient.users.getUserInteractions(userId);
        setInteractions(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, []);

  return { interactions, loading, error };
};

export default useFetchUserInteractions;