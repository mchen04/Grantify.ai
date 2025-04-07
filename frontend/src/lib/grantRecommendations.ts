import supabase from './supabaseClient';
import { DEFAULT_USER_PREFERENCES } from './config';

/**
 * Interface for user preferences
 */
export interface UserPreferences {
  topics: string[];
  funding_min: number;
  funding_max: number;
  agencies: string[];
  deadline_range: string;
  show_no_deadline: boolean;
  show_no_funding: boolean;
}

/**
 * Interface for grant data
 */
export interface Grant {
  id: string;
  title: string;
  agency_name: string;
  close_date: string | null;
  award_ceiling: number | null;
  description: string;
  activity_category: string[];
}

/**
 * Calculate a match score between a grant and user preferences
 * Higher score means better match (0-100)
 * 
 * @param grant - The grant to evaluate
 * @param preferences - The user's preferences
 * @returns number - Score from 0-100
 */
export function calculateMatchScore(grant: Grant, preferences: UserPreferences): number {
  let score = 0;
  let totalFactors = 0;
  
  // Topic matching (highest weight - 40%)
  if (preferences.topics.length > 0 && grant.activity_category?.length > 0) {
    totalFactors += 40;
    
    // Calculate percentage of matching topics
    const matchingTopics = grant.activity_category.filter(
      category => preferences.topics.includes(category)
    );
    
    if (matchingTopics.length > 0) {
      // If any topics match, give a score based on percentage of matches
      // (Higher percentage = higher score)
      score += 40 * (matchingTopics.length / Math.min(preferences.topics.length, grant.activity_category.length));
    }
  }
  
  // Funding range matching (20%)
  if (grant.award_ceiling !== null) {
    totalFactors += 20;
    
    if (
      grant.award_ceiling >= preferences.funding_min && 
      grant.award_ceiling <= preferences.funding_max
    ) {
      score += 20; // Full points if within range
    } else if (grant.award_ceiling > preferences.funding_max) {
      // Partial points if it exceeds max but not by too much
      const exceededRatio = preferences.funding_max / grant.award_ceiling;
      if (exceededRatio >= 0.5) { // Within 2x of max
        score += 20 * exceededRatio;
      }
    } else if (grant.award_ceiling < preferences.funding_min) {
      // Partial points if below min but still significant
      const belowRatio = grant.award_ceiling / preferences.funding_min;
      if (belowRatio >= 0.5) { // At least 50% of min
        score += 20 * belowRatio;
      }
    }
  } else if (preferences.show_no_funding) {
    // If user is ok with no funding info and grant has no funding
    totalFactors += 20;
    score += 10; // Half points as it's not ideal but acceptable
  }
  
  // Agency matching (20%)
  if (preferences.agencies.length > 0) {
    totalFactors += 20;
    if (preferences.agencies.includes(grant.agency_name)) {
      score += 20;
    }
  }
  
  // Deadline matching (20%)
  if (grant.close_date) {
    totalFactors += 20;
    const deadlineDays = parseInt(preferences.deadline_range);
    
    if (deadlineDays === 0) {
      // "Any deadline" selected
      score += 20;
    } else {
      // Check if deadline is within the preferred range
      const today = new Date();
      const deadline = new Date(grant.close_date);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline <= deadlineDays) {
        score += 20;
      } else if (daysUntilDeadline <= deadlineDays * 1.5) {
        // Partial score if close to the range
        score += 10;
      }
    }
  } else if (preferences.show_no_deadline) {
    // If user is ok with no deadline and grant has no deadline
    totalFactors += 20;
    score += 10; // Half points as it's not ideal but acceptable
  }
  
  // If we couldn't calculate any factors, return a baseline score
  if (totalFactors === 0) return 50;
  
  // Normalize score based on applicable factors
  const finalScore = (score / totalFactors) * 100;
  return Math.min(100, Math.max(0, finalScore)); // Ensure score is between 0-100
}

/**
 * Fetch user preferences from Supabase
 * 
 * @param userId - The user's ID
 * @returns Promise<UserPreferences> - The user's preferences or defaults
 */
export async function fetchUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    if (!userId) {
      console.warn('No user ID provided for fetchUserPreferences');
      return DEFAULT_USER_PREFERENCES as UserPreferences;
    }
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching user preferences:', error);
      return DEFAULT_USER_PREFERENCES as UserPreferences;
    }
    
    if (data) {
      return {
        topics: data.topics || [],
        funding_min: data.funding_min || 0,
        funding_max: data.funding_max || 1000000,
        agencies: data.agencies || [],
        deadline_range: data.deadline_range || '0',
        show_no_deadline: data.show_no_deadline !== undefined ? data.show_no_deadline : true,
        show_no_funding: data.show_no_funding !== undefined ? data.show_no_funding : true,
      };
    }
    
    return DEFAULT_USER_PREFERENCES as UserPreferences;
  } catch (error) {
    console.error('Error in fetchUserPreferences:', error);
    return DEFAULT_USER_PREFERENCES as UserPreferences;
  }
}

/**
 * Fetch recommended grants for a user
 * 
 * @param userId - The user's ID 
 * @param excludedGrantIds - Array of grant IDs to exclude
 * @param limit - Maximum number of grants to fetch
 * @returns Promise<Array<Grant>> - Array of recommended grants
 */
export async function fetchRecommendedGrants(
  userId: string,
  excludedGrantIds: string[] = [],
  limit: number = 10
): Promise<Grant[]> {
  try {
    // Get user preferences
    const preferences = await fetchUserPreferences(userId);
    
    // Get current date for filtering expired grants
    const today = new Date().toISOString();
    
    // Base query for active grants
    let query = supabase
      .from('grants')
      .select('*')
      .or(`close_date.gt.${today},close_date.is.null`); // Only active grants
    
    // Exclude grants the user has already interacted with
    if (excludedGrantIds.length > 0) {
      query = query.not('id', 'in', `(${excludedGrantIds.join(',')})`);
    }
    
    // Apply preference filters if they exist
    
    // Topic filtering
    if (preferences.topics.length > 0) {
      query = query.overlaps('activity_category', preferences.topics);
    }
    
    // Agency filtering
    if (preferences.agencies.length > 0) {
      query = query.in('agency_name', preferences.agencies);
    }
    
    // Funding range filtering (complex due to null values)
    if (preferences.funding_min > 0) {
      if (preferences.show_no_funding) {
        // Include grants with null award_ceiling OR grants with award_ceiling >= min
        query = query.or(`award_ceiling.is.null,award_ceiling.gte.${preferences.funding_min}`);
      } else {
        // Only grants with award_ceiling >= min
        query = query.gte('award_ceiling', preferences.funding_min);
      }
    }
    
    if (preferences.funding_max < 1000000) {
      if (preferences.show_no_funding) {
        // Include grants with null award_ceiling OR grants with award_ceiling <= max
        query = query.or(`award_ceiling.is.null,award_ceiling.lte.${preferences.funding_max}`);
      } else {
        // Only grants with award_ceiling <= max
        query = query.lte('award_ceiling', preferences.funding_max);
      }
    }
    
    // Deadline filtering
    const deadlineDays = parseInt(preferences.deadline_range);
    if (deadlineDays > 0) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + deadlineDays);
      const futureDateString = futureDate.toISOString();
      
      if (preferences.show_no_deadline) {
        // Include grants with null close_date OR grants with close_date <= future date
        query = query.or(`close_date.is.null,close_date.lte.${futureDateString}`);
      } else {
        // Only grants with close_date <= future date (and not null)
        query = query.lte('close_date', futureDateString).not('close_date', 'is', null);
      }
    } else if (!preferences.show_no_deadline) {
      // If "Any Deadline" is selected but don't show no-deadline grants
      query = query.not('close_date', 'is', null);
    }
    
    // Get double the limit first, so we can sort by score
    const { data: initialGrants, error } = await query.limit(limit * 2);
    
    if (error) {
      console.error('Error fetching recommended grants:', error);
      return [];
    }
    
    if (!initialGrants || initialGrants.length === 0) {
      // If no grants match the specific preferences, try a more relaxed query
      return fetchFallbackGrants(userId, excludedGrantIds, limit, preferences);
    }
    
    // Calculate scores and sort by score
    const scoredGrants = initialGrants.map(grant => {
      try {
        return {
          grant,
          score: calculateMatchScore(grant, preferences)
        };
      } catch (err) {
        console.error('Error calculating match score:', err);
        return { grant, score: 0 };
      }
    });
    
    // Sort by score (descending)
    scoredGrants.sort((a, b) => b.score - a.score);
    
    // Take the top 'limit' grants
    return scoredGrants.slice(0, limit).map(sg => sg.grant);
    
  } catch (error) {
    console.error('Error in fetchRecommendedGrants:', error);
    return [];
  }
}

/**
 * Fetch fallback grants when no exact matches are found
 * This uses more relaxed criteria to find grants that might still be of interest
 * 
 * @param userId - The user's ID
 * @param excludedGrantIds - Array of grant IDs to exclude
 * @param limit - Maximum number of grants to fetch
 * @param preferences - User preferences (already fetched)
 * @returns Promise<Array<Grant>> - Array of fallback grant recommendations
 */
async function fetchFallbackGrants(
  userId: string,
  excludedGrantIds: string[] = [],
  limit: number = 10,
  preferences: UserPreferences
): Promise<Grant[]> {
  try {
    // Get current date for filtering expired grants
    const today = new Date().toISOString();
    
    // Base query for active grants
    let query = supabase
      .from('grants')
      .select('*')
      .or(`close_date.gt.${today},close_date.is.null`); // Only active grants
    
    // Exclude grants the user has already interacted with
    if (excludedGrantIds.length > 0) {
      query = query.not('id', 'in', `(${excludedGrantIds.join(',')})`);
    }
    
    // Get grants with more relaxed criteria
    const { data: allGrants, error } = await query.limit(limit * 3);
    
    if (error) {
      console.error('Error fetching fallback grants:', error);
      return [];
    }
    
    if (!allGrants || allGrants.length === 0) {
      return []; // No grants found even with relaxed criteria
    }
    
    // Calculate scores and sort by score
    const scoredGrants = allGrants.map(grant => {
      try {
        return {
          grant,
          score: calculateMatchScore(grant, preferences)
        };
      } catch (err) {
        console.error('Error calculating match score for fallback grant:', err);
        return { grant, score: 0 };
      }
    });
    
    // Sort by score (descending)
    scoredGrants.sort((a, b) => b.score - a.score);
    
    // Take the top 'limit' grants
    return scoredGrants.slice(0, limit).map(sg => sg.grant);
    
  } catch (error) {
    console.error('Error in fetchFallbackGrants:', error);
    return [];
  }
}