import supabase from './supabaseClient';

/**
 * Fetch similar grants based on a given grant
 * @param grantId - The ID of the current grant
 * @param categories - The categories of the current grant
 * @param limit - The maximum number of similar grants to return
 * @returns Promise<Array> - Array of similar grants
 */
export async function fetchSimilarGrants(
  grantId: string,
  categories: string[] | null,
  limit: number = 3
) {
  try {
    // Start with a base query
    let query = supabase
      .from('grants')
      .select('*')
      .neq('id', grantId) // Exclude the current grant
      .limit(limit);
    
    // Only show active grants (close_date is in the future or null)
    const today = new Date().toISOString();
    query = query.or(`close_date.gt.${today},close_date.is.null`);
    
    // If we have categories, use them to find similar grants
    if (categories && categories.length > 0) {
      // Find grants that share at least one category
      query = query.overlaps('activity_category', categories);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching similar grants:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchSimilarGrants:', error);
    return [];
  }
}

/**
 * Format a grant for display in the similar grants section
 * @param grant - The grant to format
 * @returns Object - Formatted grant data
 */
export function formatSimilarGrant(grant: any) {
  // Format the deadline
  let deadline = 'No deadline specified';
  if (grant.close_date) {
    deadline = new Date(grant.close_date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    
    // Add days remaining if there's a deadline
    const daysRemaining = Math.ceil(
      (new Date(grant.close_date).getTime() - new Date().getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    if (daysRemaining > 0) {
      deadline += ` (${daysRemaining} days left)`;
    }
  } else {
    deadline = 'Open-ended opportunity';
  }
  
  return {
    id: grant.id,
    title: grant.title,
    agency: grant.agency_name,
    deadline,
  };
}