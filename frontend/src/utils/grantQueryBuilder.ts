import { GrantFilter } from '@/types/grant';
import supabase from '@/lib/supabaseClient';
import { MAX_FUNDING, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '@/utils/constants';

/**
 * Builds a Supabase query for grants based on the provided filters
 * @param filter - Grant filter parameters
 * @returns Supabase query object
 */
export const buildGrantQuery = async (
  filter: GrantFilter,
  grantsPerPage: number = 10
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Start building the base query with grant data and interaction status
  let query = supabase
    .from('grants')
    .select(`
      *,
      interactions:user_interactions!left(action, timestamp)
    `, { count: 'exact' });

  // Add user interaction filters if user is logged in
  if (user) {
    // Filter to only show interactions for the current user
    query = query.eq('interactions.user_id', user.id);
    
    // Exclude grants that have any interactions (saved, applied, or ignored)
    query = query.is('interactions', null);
  }
  
  // --- APPLY DEADLINE FILTER ---
  if (filter.onlyNoDeadline) {
    // Only show grants with no deadline
    query = query.is('close_date', null);
  } else {
    const today = new Date().toISOString();
    
    // Calculate future dates based on min and max days
    const minFutureDate = new Date();
    minFutureDate.setDate(minFutureDate.getDate() + filter.deadlineMinDays);
    
    const maxFutureDate = new Date();
    if (filter.deadlineMaxDays < MAX_DEADLINE_DAYS) {
      maxFutureDate.setDate(maxFutureDate.getDate() + filter.deadlineMaxDays);
    } else {
      // If max days is at the maximum, set a very far future date
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);
    }
    
    // Build deadline condition
    if (filter.deadlineMinDays > MIN_DEADLINE_DAYS || filter.deadlineMaxDays < MAX_DEADLINE_DAYS) {
      // If including null deadlines, use a more complex filter
      if (filter.includeNoDeadline) {
        // Combine deadline range with null deadlines
        query = query.or(
          `close_date.is.null,close_date.gte.${minFutureDate.toISOString()},close_date.lte.${maxFutureDate.toISOString()}`
        );
      } else {
        // Only deadlines within the specified range
        query = query
          .gte('close_date', minFutureDate.toISOString())
          .lte('close_date', maxFutureDate.toISOString());
      }
    } else {
      // All future deadlines
      if (filter.includeNoDeadline) {
        query = query.or(`close_date.is.null,close_date.gt.${today}`);
      } else {
        query = query.gt('close_date', today);
      }
    }
  }
  
  // --- APPLY AGENCY FILTER ---
  if (filter.agencies.length > 0) {
    // Create a filter for any selected agency (OR logic)
    const agencyFilter = filter.agencies.map(agency => 
      `agency_name.eq.${agency}`
    ).join(',');
    
    query = query.or(agencyFilter);
  }
  
  // --- APPLY FUNDING FILTER ---
  if (filter.onlyNoFunding) {
    // Only show grants with no funding specified
    query = query.is('award_ceiling', null);
  } else {
    // Apply funding range if specified
    if (filter.fundingMin > 0) {
      query = query.gte('award_floor', filter.fundingMin);
    }
    
    if (filter.fundingMax < MAX_FUNDING) {
      query = query.lte('award_ceiling', filter.fundingMax);
    }
    
    // Handle null funding inclusion/exclusion
    if (filter.includeFundingNull) {
      // No additional filter needed, we'll include null funding
    } else {
      // Exclude grants with null funding
      query = query.not('award_ceiling', 'is', null);
    }
  }
  
  // --- APPLY SEARCH TERM FILTER ---
  if (filter.searchTerm) {
    const searchFilter = `title.ilike.%${filter.searchTerm}%,description.ilike.%${filter.searchTerm}%`;
    query = query.or(searchFilter);
  }
  
  // --- APPLY COST SHARING FILTER ---
  if (filter.costSharing === 'required') {
    query = query.eq('cost_sharing', true);
  } else if (filter.costSharing === 'not-required') {
    query = query.eq('cost_sharing', false);
  }
  
  // --- APPLY SORTING ---
  if (filter.sortBy === 'deadline') {
    query = query.order('close_date', { ascending: true, nullsFirst: false });
  } else if (filter.sortBy === 'deadline_latest') {
    query = query.order('close_date', { ascending: false, nullsFirst: false });
  } else if (filter.sortBy === 'amount') {
    query = query.order('award_ceiling', { ascending: false, nullsFirst: false });
  } else if (filter.sortBy === 'amount_asc') {
    query = query.order('award_ceiling', { ascending: true, nullsFirst: false });
  } else if (filter.sortBy === 'recent') {
    query = query.order('post_date', { ascending: false, nullsFirst: false });
  } else if (filter.sortBy === 'title_asc') {
    query = query.order('title', { ascending: true });
  } else if (filter.sortBy === 'title_desc') {
    query = query.order('title', { ascending: false });
  }
  
  // --- APPLY PAGINATION ---
  const from = (filter.page - 1) * grantsPerPage;
  const to = from + grantsPerPage - 1;
  query = query.range(from, to);
  
  return query;
};