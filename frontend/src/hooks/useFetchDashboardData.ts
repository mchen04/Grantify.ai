import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Grant, ScoredGrant } from '@/types/grant';
import { UserInteraction, UserPreferences } from '@/types/user';
import { calculateMatchScore } from '@/lib/grantRecommendations';

interface UseFetchDashboardDataProps {
  userId: string | undefined;
  targetRecommendedCount?: number;
  enabled?: boolean;
}

interface UseFetchDashboardDataReturn {
  recommendedGrants: ScoredGrant[];
  savedGrants: Grant[];
  appliedGrants: Grant[];
  ignoredGrants: Grant[];
  userPreferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchReplacementRecommendations: () => Promise<void>;
}

/**
 * Custom hook for fetching all dashboard data including recommended, saved, applied, and ignored grants
 */
export function useFetchDashboardData({
  userId,
  targetRecommendedCount = 10,
  enabled = true
}: UseFetchDashboardDataProps): UseFetchDashboardDataReturn {
  const [recommendedGrants, setRecommendedGrants] = useState<ScoredGrant[]>([]);
  const [savedGrants, setSavedGrants] = useState<Grant[]>([]);
  const [appliedGrants, setAppliedGrants] = useState<Grant[]>([]);
  const [ignoredGrants, setIgnoredGrants] = useState<Grant[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingReplacements, setIsFetchingReplacements] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user preferences for scoring
      const { data: preferences, error: preferencesError } = await apiClient.users.getUserPreferences(userId);
      
      if (preferencesError) {
        console.error('Error fetching user preferences:', preferencesError);
        // Use default preferences
        setUserPreferences({
          topics: [],
          funding_min: 0,
          funding_max: 1000000,
          agencies: [],
          deadline_range: '0',
          show_no_deadline: true,
          show_no_funding: true
        });
      } else {
        setUserPreferences(preferences || null);
      }

      // Get current date for filtering expired grants
      const today = new Date().toISOString();

      // Fetch all user interactions
      const { data: interactionsResponse, error: interactionsError } = await apiClient.users.getUserInteractions(userId);
      
      if (interactionsError) {
        console.error('Error fetching user interactions:', interactionsError);
        // Don't throw, try to continue
      }

      const allInteractions = interactionsResponse?.interactions || [];

      // Process interactions to find the latest action for each grant
      const latestInteractionsMap = new Map<string, UserInteraction>();
      allInteractions.forEach(interaction => {
        const existing = latestInteractionsMap.get(interaction.grant_id);
        if (!existing || new Date(interaction.timestamp) > new Date(existing.timestamp)) {
          latestInteractionsMap.set(interaction.grant_id, interaction);
        }
      });

      const latestInteractions = Array.from(latestInteractionsMap.values());
      const interactedGrantIds = Array.from(latestInteractionsMap.keys());

      // Separate grants into lists based on the latest action
      const initialSaved: Grant[] = [];
      const initialApplied: Grant[] = [];
      const initialIgnored: Grant[] = [];

      const filterActiveGrants = (interaction: UserInteraction) => {
        const grant = interaction.grants;
        if (!grant) return false; // Skip if grant data is missing
        if (!grant.close_date) return true; // Keep if no close date
        return new Date(grant.close_date) >= new Date(); // Keep if not expired
      };

      latestInteractions.forEach(interaction => {
        if (!interaction.grants) return; // Skip if grant data is missing

        if (interaction.action === 'saved' && filterActiveGrants(interaction)) {
          initialSaved.push(interaction.grants);
        } else if (interaction.action === 'applied') { // Keep applied regardless of expiry
          initialApplied.push(interaction.grants);
        } else if (interaction.action === 'ignored' && filterActiveGrants(interaction)) {
          initialIgnored.push(interaction.grants);
        }
      });

      setSavedGrants(initialSaved);
      setAppliedGrants(initialApplied);
      setIgnoredGrants(initialIgnored);

      // Fetch recommended grants based on user preferences
      const { data: recommendedData, error: recommendedError } = await apiClient.grants.getRecommendedGrants(
        userId,
        {
          exclude: interactedGrantIds,
          limit: targetRecommendedCount
        }
      );

      if (recommendedError) {
        console.error('Error fetching recommended grants:', recommendedError);
      }

      // Calculate match scores for recommended grants
      const initialRecommended = recommendedData?.grants || [];
      const scoredRecommendations = initialRecommended.map(grant => {
        return {
          ...grant,
          matchScore: preferences ? calculateMatchScore(grant, preferences) : undefined
        } as unknown as ScoredGrant;
      });

      // Set recommended grants with scores
      setRecommendedGrants(scoredRecommendations || []);

    } catch (error: any) {
      if (error && Object.keys(error).length > 0 && error.code !== 'PGRST116' && error.message !== 'No grants found') {
        console.error('Error fetching initial data:', error);
        setError('Failed to load your grants. Please try again later.');
      } else {
        console.log('No grants found or expected empty result.');
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, targetRecommendedCount, enabled]);

  // Fetch replacement recommended grants when needed
  const fetchReplacementRecommendations = useCallback(async () => {
    if (!userId || isFetchingReplacements) return;

    const currentRecommendedCount = recommendedGrants.length;
    const neededCount = targetRecommendedCount - currentRecommendedCount;

    if (neededCount <= 0) {
      return; // Already have enough or too many
    }

    setIsFetchingReplacements(true);

    try {
      // Get IDs of ALL grants currently displayed in any list
      const allCurrentGrantIds = [
        ...recommendedGrants.map(g => g.id),
        ...savedGrants.map(g => g.id),
        ...appliedGrants.map(g => g.id),
        ...ignoredGrants.map(g => g.id)
      ];

      // Fetch more recommended grants with preferences
      const { data: newGrantsData, error: newGrantsError } = await apiClient.grants.getRecommendedGrants(
        userId,
        {
          exclude: allCurrentGrantIds,
          limit: neededCount
        }
      );

      if (newGrantsError) {
        console.error('Error fetching replacement grants:', newGrantsError);
      }

      const newGrants = newGrantsData?.grants || [];
      
      if (newGrants.length > 0 && userPreferences) {
        // Add match scores to new grants
        const scoredNewGrants = newGrants.map(grant => ({
          ...grant,
          matchScore: calculateMatchScore(grant, userPreferences)
        } as unknown as ScoredGrant));
        setRecommendedGrants(prev => [...prev, ...scoredNewGrants]);
      }
    } catch (e) {
      console.error('Exception fetching replacement grants:', e);
    } finally {
      setIsFetchingReplacements(false);
    }
  }, [
    user, // Add user to dependency array
    isFetchingReplacements,
    recommendedGrants,
    savedGrants,
    appliedGrants,
    ignoredGrants,
    targetRecommendedCount,
    userPreferences
  ]);

  // Fetch dashboard data when user is available and dependencies change
  useEffect(() => {
    if (user) { // Only fetch if user is logged in
      fetchDashboardData();
    }
  }, [fetchDashboardData, user]); // Keep user in dependency array
 
  return {
    recommendedGrants,
    savedGrants,
    appliedGrants,
    ignoredGrants,
    userPreferences,
    loading,
    error,
    refetch: fetchDashboardData,
    fetchReplacementRecommendations
  };
}