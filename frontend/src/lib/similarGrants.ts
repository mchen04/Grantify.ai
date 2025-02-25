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
  return {
    id: grant.id,
    title: grant.title,
    agency: grant.agency_name,
    deadline: grant.close_date 
      ? new Date(grant.close_date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'No deadline specified',
  };
}