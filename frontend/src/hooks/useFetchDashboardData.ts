import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Grant, ScoredGrant } from '@/types/grant';
import { UserInteraction } from '@/types/user';
import { calculateMatchScore, UserPreferences } from '@/lib/grantRecommendations';
import { useAuth } from '@/contexts/AuthContext';
import { useInteractions } from '@/contexts/InteractionContext';
import { InteractionStatus } from '@/types/interaction';
import supabase from '@/lib/supabaseClient';

interface UseFetchDashboardDataProps {
  targetRecommendedCount?: number;
  enabled?: boolean;
  userId?: string; // Add userId parameter
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
  targetRecommendedCount = 10,
  enabled = true,
  userId
}: UseFetchDashboardDataProps): UseFetchDashboardDataReturn {
  const { user } = useAuth();
  const currentUserId = userId || user?.id;
  const {
    interactionsMap,
    isLoading: interactionsLoading,
    lastInteractionTimestamp
  } = useInteractions();
  
  const [recommendedGrants, setRecommendedGrants] = useState<ScoredGrant[]>([]);
  const [savedGrants, setSavedGrants] = useState<Grant[]>([]);
  const [appliedGrants, setAppliedGrants] = useState<Grant[]>([]);
  const [ignoredGrants, setIgnoredGrants] = useState<Grant[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingReplacements, setIsFetchingReplacements] = useState(false);
  const [grantDetailsMap, setGrantDetailsMap] = useState<Record<string, Grant>>({});

  // Function to fetch grant details for a list of grant IDs
  const fetchGrantDetails = useCallback(async (grantIds: string[]) => {
    if (!currentUserId || grantIds.length === 0) return {};
    
    try {
      // Get session for API calls
      const { data, error: sessionError } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (sessionError || !session) {
        console.error('Error fetching session for grant details:', sessionError);
        return {};
      }
      
      const accessToken = session.access_token;
      
      // Filter out grant IDs we already have details for
      const missingGrantIds = grantIds.filter(id => !grantDetailsMap[id]);
      
      if (missingGrantIds.length === 0) {
        return grantDetailsMap; // We already have all the grant details
      }
      
      // Fetch details for grants we don't have yet
      // Fetch each grant individually since there's no batch endpoint
      const grantsPromises = missingGrantIds.map(id =>
        apiClient.grants.getGrantById(id, accessToken)
      );
      
      const grantsResults = await Promise.all(grantsPromises);
      const grantsData = { grants: grantsResults.map(result => result.data?.grant).filter(Boolean) };
      
      // Create a new map with the fetched grants
      const newGrantsMap = { ...grantDetailsMap };
      (grantsData?.grants || []).forEach((grant: Grant) => {
        newGrantsMap[grant.id] = grant;
      });
      
      // Update the state with the new map
      setGrantDetailsMap(newGrantsMap);
      return newGrantsMap;
    } catch (error) {
      console.error('Error in fetchGrantDetails:', error);
      return grantDetailsMap; // Return what we already have
    }
  }, [currentUserId, grantDetailsMap]);

  // Function to update grant lists based on interactions
  const updateGrantLists = useCallback(async () => {
    if (!currentUserId || !enabled) return;
    
    // Get current date for filtering expired grants
    const today = new Date();
    
    // Extract grant IDs for each interaction type
    const savedGrantIds: string[] = [];
    const appliedGrantIds: string[] = [];
    const ignoredGrantIds: string[] = [];
    
    // Filter grants by interaction type
    Object.entries(interactionsMap).forEach(([grantId, status]) => {
      if (status === 'saved') savedGrantIds.push(grantId);
      else if (status === 'applied') appliedGrantIds.push(grantId);
      else if (status === 'ignored') ignoredGrantIds.push(grantId);
    });
    
    // Fetch details for all interacted grants
    const allInteractedIds = [...savedGrantIds, ...appliedGrantIds, ...ignoredGrantIds];
    const grantsMap = await fetchGrantDetails(allInteractedIds);
    
    // Filter function for active grants (not expired)
    const isActiveGrant = (grant: Grant | undefined) => {
      if (!grant) return false;
      if (!grant.close_date) return true; // Keep if no close date
      return new Date(grant.close_date) >= today; // Keep if not expired
    };
    
    // Update saved grants
    const newSavedGrants = savedGrantIds
      .map(id => grantsMap[id])
      .filter(grant => grant && isActiveGrant(grant)) as Grant[];
    setSavedGrants(newSavedGrants);
    
    // Update applied grants (keep all regardless of expiry)
    const newAppliedGrants = appliedGrantIds
      .map(id => grantsMap[id])
      .filter(grant => grant) as Grant[];
    setAppliedGrants(newAppliedGrants);
    
    // Update ignored grants
    const newIgnoredGrants = ignoredGrantIds
      .map(id => grantsMap[id])
      .filter(grant => grant && isActiveGrant(grant)) as Grant[];
    setIgnoredGrants(newIgnoredGrants);
    
  }, [currentUserId, enabled, interactionsMap, fetchGrantDetails]);

  // Function to fetch recommended grants
  const fetchRecommendedGrants = useCallback(async () => {
    if (!currentUserId || !enabled) return;
    
    try {
      // Get session for API calls
      const { data, error: sessionError } = await supabase.auth.getSession();
      const session = data?.session;
      
      if (sessionError || !session) {
        console.error('Error fetching session for recommended grants:', sessionError);
        return;
      }
      
      const accessToken = session.access_token;
      
      // Get all interacted grant IDs to exclude from recommendations
      const interactedGrantIds = Object.keys(interactionsMap);
      
      // Fetch user preferences for scoring
      const { data: preferences, error: preferencesError } = await apiClient.users.getUserPreferences(
        currentUserId,
        accessToken
      );
      
      if (preferencesError) {
        console.error('Error fetching user preferences:', preferencesError);
        // Use default preferences
        setUserPreferences({
          topics: [] as string[],
          funding_min: 0,
          funding_max: 1000000,
          agencies: [] as string[],
          deadline_range: '0',
          show_no_deadline: true,
          show_no_funding: true
        });
      } else {
        setUserPreferences(preferences || null);
      }
      
      // Fetch recommended grants based on user preferences
      const { data: recommendedData, error: recommendedError } = await apiClient.grants.getRecommendedGrants(
        currentUserId,
        {
          exclude: interactedGrantIds,
          limit: targetRecommendedCount
        },
        accessToken
      );
      
      if (recommendedError) {
        console.error('Error fetching recommended grants:', recommendedError);
        return;
      }
      
      // Calculate match scores for recommended grants
      const initialRecommended = recommendedData?.grants || [];
      const scoredRecommendations = initialRecommended.map((grant: Grant) => {
        // Add description field if missing (required by calculateMatchScore)
        const grantWithDescription = {
          ...grant,
          description: grant.description_short || ''
        };
        
        return {
          ...grant,
          matchScore: preferences ? calculateMatchScore(grantWithDescription as any, preferences) : undefined
        } as unknown as ScoredGrant;
      });
      
      // Set recommended grants with scores
      setRecommendedGrants(scoredRecommendations || []);
      
    } catch (error: any) {
      console.error('Error fetching recommended grants:', error);
    }
  }, [currentUserId, enabled, interactionsMap, targetRecommendedCount]);

  // Main function to fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!currentUserId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user preferences and update grant lists based on interactions
      await Promise.all([
        updateGrantLists(),
        fetchRecommendedGrants()
      ]);

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
  }, [currentUserId, enabled, updateGrantLists, fetchRecommendedGrants]);

  // Fetch replacement recommended grants when needed
  const fetchReplacementRecommendations = useCallback(async () => {
    if (!currentUserId || isFetchingReplacements) return;

    const currentRecommendedCount = recommendedGrants.length;
    const neededCount = targetRecommendedCount - currentRecommendedCount;

    if (neededCount <= 0) {
      return; // Already have enough or too many
    }

    setIsFetchingReplacements(true);

    try {
      // **Fetch the latest session and token before making API calls**
      const { data, error: sessionError } = await supabase.auth.getSession();
      const session = data?.session;

      if (sessionError || !session) {
        console.error('Error fetching latest session for replacement:', sessionError);
        // Don't set a global error, just log and stop this fetch
        setIsFetchingReplacements(false);
        return;
      }

      const accessToken = session.access_token;

      // Get IDs of ALL grants currently displayed in any list
      const allCurrentGrantIds = [
        ...recommendedGrants.map(g => g.id),
        ...savedGrants.map(g => g.id),
        ...appliedGrants.map(g => g.id),
        ...ignoredGrants.map(g => g.id)
      ];

      // Fetch more recommended grants with preferences
      const { data: newGrantsData, error: newGrantsError } = await apiClient.grants.getRecommendedGrants(
        currentUserId,
        {
          exclude: allCurrentGrantIds,
          limit: neededCount
        },
        accessToken // Use accessToken
      );

      if (newGrantsError) {
        console.error('Error fetching replacement grants:', newGrantsError);
      }

      const newGrants = newGrantsData?.grants || [];

      if (newGrants.length > 0 && userPreferences) {
        // Add match scores to new grants
        const scoredNewGrants = newGrants.map((grant: Grant) => {
          // Add description field if missing (required by calculateMatchScore)
          const grantWithDescription = {
            ...grant,
            description: grant.description_short || ''
          };
          
          return {
            ...grant,
            matchScore: userPreferences ? calculateMatchScore(grantWithDescription as any, userPreferences as unknown as UserPreferences) : undefined
          } as unknown as ScoredGrant;
        });
        setRecommendedGrants(prev => [...prev, ...scoredNewGrants]);
      }
    } catch (e) {
      console.error('Exception fetching replacement grants:', e);
    } finally {
      setIsFetchingReplacements(false);
    }
  }, [
    currentUserId, // Keep currentUserId in dependency array
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
    if (currentUserId) { // Only fetch if user is logged in
      fetchDashboardData();
    }
  }, [fetchDashboardData, currentUserId]); // Keep currentUserId in dependency array
  
  // React to interaction changes
  useEffect(() => {
    if (currentUserId && !interactionsLoading) {
      // When interactions change, update our grant lists
      updateGrantLists();
      // Also refresh recommended grants to ensure they exclude newly interacted grants
      fetchRecommendedGrants();
    }
  }, [currentUserId, interactionsLoading, lastInteractionTimestamp, updateGrantLists, fetchRecommendedGrants]);
 
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