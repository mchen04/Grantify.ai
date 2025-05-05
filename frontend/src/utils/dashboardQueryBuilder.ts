import { GrantFilter } from '@/types/grant';
import supabase from '@/lib/supabaseClient';

/**
 * Builds a Supabase query for dashboard grants based on the provided filters
 * Similar to grantQueryBuilder but optimized for dashboard use cases
 * @param userId - The user ID to fetch interactions for
 * @param action - The interaction action to filter by ('saved', 'applied', 'ignored', or null for recommended)
 * @param filter - Filter parameters (search, sort, etc.)
 * @param grantsPerPage - Number of grants to return per page
 * @returns Supabase query object
 */
export const buildDashboardQuery = async (
  userId: string,
  action: 'saved' | 'applied' | 'ignored' | null,
  filter: {
    searchTerm: string;
    sortBy: string;
    filterOnlyNoDeadline: boolean;
    filterOnlyNoFunding: boolean;
    page: number;
  },
  grantsPerPage: number = 10
) => {
  // Start building the base query
  let query;
  
  if (action === null) {
    // For recommended grants, we need to find grants without interactions
    const today = new Date().toISOString();
    
    // Get all grants the user has interacted with
    const { data: interactedGrants } = await supabase
      .from('user_interactions')
      .select('grant_id')
      .eq('user_id', userId);
    
    const interactedGrantIds = interactedGrants?.map(i => i.grant_id) || [];
    
    // Query for grants without interactions
    query = supabase
      .from('grants')
      .select('*', { count: 'exact' });
    
    // Only active grants
    query = query.or(`close_date.gt.${today},close_date.is.null`);
    
    // Exclude grants the user has already interacted with
    if (interactedGrantIds.length > 0) {
      query = query.not('id', 'in', `(${interactedGrantIds.join(',')})`);
    }
  } else {
    // For saved, applied, or ignored grants, we fetch via interactions
    query = supabase
      .from('user_interactions')
      .select('*, grants(*)', { count: 'exact' })
      .eq('user_id', userId)
      .eq('action', action);
  }
  
  // Apply search filter if provided
  if (filter.searchTerm) {
    if (action === null) {
      // Direct search on grants table
      query = query.or(`title.ilike.%${filter.searchTerm}%,description_short.ilike.%${filter.searchTerm}%,description_full.ilike.%${filter.searchTerm}%,agency_name.ilike.%${filter.searchTerm}%`);
    } else {
      // Search on nested grants object
      query = query.or(`grants.title.ilike.%${filter.searchTerm}%,grants.description_short.ilike.%${filter.searchTerm}%,grants.description_full.ilike.%${filter.searchTerm}%,grants.agency_name.ilike.%${filter.searchTerm}%`);
    }
  }
  
  // Apply deadline filter
  if (filter.filterOnlyNoDeadline) {
    // Show only grants with no deadline
    if (action === null) {
      query = query.is('close_date', null);
    } else {
      query = query.is('grants.close_date', null);
    }
  } else {
    // For recommended grants only, filter to active grants
    if (action === null) {
      // For recommended grants, we need to ensure we have valid future dates
      // or explicitly null dates (rather than trying to filter text values)
      const today = new Date().toISOString();
      query = query.or(`close_date.gt.${today},close_date.is.null`);
    }
    // For saved/applied/ignored tabs, we don't filter by deadline
    // Users should see all grants they've interacted with regardless of deadline
  }
  
  // Apply funding filter
  if (filter.filterOnlyNoFunding) {
    // Show only grants with no funding
    if (action === null) {
      query = query.is('award_ceiling', null);
    } else {
      query = query.is('grants.award_ceiling', null);
    }
  }
  
  // Apply sorting
  if (action === null) {
    // Direct sorting on grants table
    switch (filter.sortBy) {
      case 'deadline':
        query = query.order('close_date', { ascending: true, nullsFirst: false });
        break;
      case 'deadline_latest':
        query = query.order('close_date', { ascending: false, nullsFirst: false });
        break;
      case 'amount':
        query = query.order('award_ceiling', { ascending: false, nullsFirst: false });
        break;
      case 'amount_asc':
        query = query.order('award_ceiling', { ascending: true, nullsFirst: false });
        break;
      case 'title_asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title_desc':
        query = query.order('title', { ascending: false });
        break;
      default:
        // Default sort by deadline
        query = query.order('close_date', { ascending: true, nullsFirst: false });
    }
  } else {
    // Sorting on nested grants object
    // For interaction-based tabs, use simpler ordering without nulls parameters
    // since those cause issues with nested fields
    switch (filter.sortBy) {
      case 'deadline':
        query = query.order('grants.close_date', { ascending: true });
        break;
      case 'deadline_latest':
        query = query.order('grants.close_date', { ascending: false });
        break;
      case 'amount':
        query = query.order('grants.award_ceiling', { ascending: false });
        break;
      case 'amount_asc':
        query = query.order('grants.award_ceiling', { ascending: true });
        break;
      case 'title_asc':
        query = query.order('grants.title', { ascending: true });
        break;
      case 'title_desc':
        query = query.order('grants.title', { ascending: false });
        break;
      default:
        // Default sort by interaction timestamp
        query = query.order('timestamp', { ascending: false });
    }
  }
  
  // Apply pagination
  const from = (filter.page - 1) * grantsPerPage;
  const to = from + grantsPerPage - 1;
  query = query.range(from, to);
  
  return query;
};