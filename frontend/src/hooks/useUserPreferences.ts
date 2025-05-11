import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/lib/apiClient'; // Import usersApi
import { UserPreferences, PreferenceItem } from '@/types/user'; // Assuming PreferenceItem for individual items
import { DEFAULT_USER_PREFERENCES } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext'; // Assuming AuthContext provides accessToken

interface UseUserPreferencesProps {
  userId: string | undefined;
  enabled?: boolean;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | PreferenceItem[]; // Can be a single object or an array of items
  loading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  addPreference: (newPreference: PreferenceItem) => Promise<void>; // For adding a new preference item
  updatePreference: (updatedPreference: PreferenceItem) => Promise<void>; // For updating an existing item
  deletePreference: (preferenceId: string) => Promise<void>; // For deleting a preference item
  // Keep a general update function if the schema is a single object
  updateAllPreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing user preferences using API client
 */
export function useUserPreferences({
  userId,
  enabled = true
}: UseUserPreferencesProps): UseUserPreferencesReturn {
  // UserPreferences is now PreferenceItem[], so initialize with an empty array.
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth(); // Get session from useAuth
  const accessToken = session?.access_token; // Extract accessToken from session

  const fetchPreferences = useCallback(async () => {
    if (!userId || !enabled) {
      setPreferences([]); // Default to empty array
      setLoading(false);
      return;
    }
    if (!accessToken) {
      setError("Access token not available. Please log in.");
      setPreferences([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getUserPreferences(userId, accessToken);

      if (response.error) {
        console.error('Error fetching user preferences:', response.error);
        setError(`Failed to load preferences: ${response.error}.`);
        setPreferences([]); // Default to empty array on error
      } else if (response.data) {
        // Ensure data is treated as PreferenceItem[]
        setPreferences(Array.isArray(response.data) ? response.data : []);
      } else {
        setPreferences([]); // No data, set to empty array
      }
    } catch (err: any) {
      console.error('Error in fetchPreferences:', err);
      setError('An unexpected error occurred while fetching preferences.');
      setPreferences([]); // Default to empty array on unexpected error
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, accessToken]);

  // This function assumes the API can take an array of PreferenceItem to replace all existing ones.
  const updateAllPreferences = useCallback(async (newPrefsArray: PreferenceItem[]) => {
    if (!userId || !accessToken) {
      setError('You must be logged in to update preferences.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.updateUserPreferences(userId, newPrefsArray, accessToken);

      if (response.error) {
        throw new Error(response.error);
      }
      await fetchPreferences(); // Refetch to get the updated list
    } catch (err: any) {
      console.error('Error updating all preferences:', err);
      setError(`Failed to update preferences: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, fetchPreferences]);

  // Add a new preference item
  const addPreference = useCallback(async (newPreference: PreferenceItem) => {
    if (!userId || !accessToken) {
      setError('You must be logged in to add preferences.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // The PUT endpoint should ideally handle adding this new item.
      // This might involve sending the single newPreference or the entire updated list.
      // For now, assuming the API can handle a single item for creation/update.
      const response = await usersApi.updateUserPreferences(userId, newPreference, accessToken);

      if (response.error) {
        throw new Error(response.error);
      }
      await fetchPreferences(); // Refetch to get the updated list
    } catch (err: any) {
      console.error('Error adding preference:', err);
      setError(`Failed to add preference: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, fetchPreferences]);

  // Update an existing preference item
  const updatePreference = useCallback(async (updatedPreference: PreferenceItem) => {
    if (!userId || !accessToken) {
      setError('You must be logged in to update preferences.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Assumes PUT /api/users/preferences updates the item with matching ID
      const response = await usersApi.updateUserPreferences(userId, updatedPreference, accessToken);

      if (response.error) {
        throw new Error(response.error);
      }
      await fetchPreferences(); // Refetch to see changes
    } catch (err: any) {
      console.error('Error updating preference:', err);
      setError(`Failed to update preference: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, fetchPreferences]);

  // Delete a preference item
  const deletePreference = useCallback(async (preferenceId: string) => {
    if (!userId || !accessToken) {
      setError('You must be logged in to delete preferences.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.deleteUserPreferences(userId, [preferenceId], accessToken);

      if (response.error) {
        throw new Error(response.error);
      }
      await fetchPreferences(); // Refetch to reflect deletion
    } catch (err: any) {
      console.error('Error deleting preference:', err);
      setError(`Failed to delete preference: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, fetchPreferences]);


  useEffect(() => {
    if (enabled) {
      fetchPreferences();
    }
  }, [fetchPreferences, enabled]); // Rerun if enabled changes

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    addPreference,
    updatePreference,
    deletePreference,
    updateAllPreferences, // Keep if still relevant
    refetch: fetchPreferences
  };
}