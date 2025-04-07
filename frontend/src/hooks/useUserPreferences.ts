import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
import { UserPreferences } from '@/types/user';
import { DEFAULT_USER_PREFERENCES } from '@/lib/config';

interface UseUserPreferencesProps {
  userId: string | undefined;
  enabled?: boolean;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and updating user preferences
 */
export function useUserPreferences({
  userId,
  enabled = true
}: UseUserPreferencesProps): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES as UserPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!userId || !enabled) {
      setPreferences(DEFAULT_USER_PREFERENCES as UserPreferences);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error fetching user preferences:', fetchError);
        setError('Failed to load preferences. Using defaults.');
        setPreferences(DEFAULT_USER_PREFERENCES as UserPreferences);
        return;
      }

      if (data) {
        setPreferences({
          topics: data.topics || [],
          funding_min: data.funding_min || 0,
          funding_max: data.funding_max || 1000000,
          agencies: data.agencies || [],
          deadline_range: data.deadline_range || '0',
          show_no_deadline: data.show_no_deadline !== undefined ? data.show_no_deadline : true,
          show_no_funding: data.show_no_funding !== undefined ? data.show_no_funding : true,
        });
      } else {
        // No preferences found, use defaults
        setPreferences(DEFAULT_USER_PREFERENCES as UserPreferences);
      }
    } catch (error: any) {
      console.error('Error in fetchPreferences:', error);
      setError('An unexpected error occurred. Using default preferences.');
      setPreferences(DEFAULT_USER_PREFERENCES as UserPreferences);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!userId) {
      setError('You must be logged in to update preferences');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Merge current preferences with new values
      const updatedPreferences = {
        ...preferences,
        ...newPreferences
      };

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updatedPreferences
        });

      if (updateError) throw updateError;

      // Update local state
      setPreferences(updatedPreferences);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      setError('Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, preferences]);

  // Fetch preferences on mount and when dependencies change
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences
  };
}