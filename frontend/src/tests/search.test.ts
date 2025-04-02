import { buildGrantQuery } from '../utils/grantQueryBuilder';
import { GrantFilter } from '../types/grant';
import { MAX_FUNDING, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '../utils/constants';

// Mock the Supabase client
jest.mock('../lib/supabaseClient', () => {
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockIs = jest.fn().mockReturnThis();
  const mockNot = jest.fn().mockReturnThis();
  const mockGte = jest.fn().mockReturnThis();
  const mockLte = jest.fn().mockReturnThis();
  const mockGt = jest.fn().mockReturnThis();
  const mockOr = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockReturnThis();
  const mockRange = jest.fn().mockReturnThis();
  
  return {
    from: jest.fn().mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      not: mockNot,
      gte: mockGte,
      lte: mockLte,
      gt: mockGt,
      or: mockOr,
      order: mockOrder,
      range: mockRange
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } })
    }
  };
});

// Import the mocked Supabase client
import supabase from '../lib/supabaseClient';

describe('Grant Search Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Default filter for testing
  const defaultFilter: GrantFilter = {
    searchTerm: '',
    agencies: [],
    fundingMin: 0,
    fundingMax: MAX_FUNDING,
    includeFundingNull: false, // Default is now false
    onlyNoFunding: false,
    deadlineMinDays: MIN_DEADLINE_DAYS,
    deadlineMaxDays: MAX_DEADLINE_DAYS,
    includeNoDeadline: false, // Default is now false
    onlyNoDeadline: false,
    costSharing: '',
    sortBy: 'relevance',
    page: 1
  };

  test('Basic query construction with default filters', async () => {
    await buildGrantQuery(defaultFilter);
    
    // Verify Supabase client was called correctly
    expect(supabase.from).toHaveBeenCalledWith('grants');
    expect(supabase.from().select).toHaveBeenCalled();
    
    // By default, should exclude null deadlines and null funding
    expect(supabase.from().not).toHaveBeenCalledWith('award_ceiling', 'is', null);
    expect(supabase.from().gt).toHaveBeenCalled(); // For deadline > today
  });

  test('Search term filter', async () => {
    const filter = { ...defaultFilter, searchTerm: 'research technology' };
    await buildGrantQuery(filter);
    
    // Should use OR with ilike for title and description
    expect(supabase.from().or).toHaveBeenCalledWith(
      expect.stringContaining('title.ilike.%research%') &&
      expect.stringContaining('description.ilike.%research%') &&
      expect.stringContaining('title.ilike.%technology%') &&
      expect.stringContaining('description.ilike.%technology%')
    );
  });

  test('Agency filter', async () => {
    const filter = { 
      ...defaultFilter, 
      agencies: ['National Science Foundation', 'Department of Health and Human Services'] 
    };
    await buildGrantQuery(filter);
    
    // Should use OR with eq for each agency
    expect(supabase.from().or).toHaveBeenCalledWith(
      expect.stringContaining('agency_name.eq.National Science Foundation') &&
      expect.stringContaining('agency_name.eq.Department of Health and Human Services')
    );
  });

  test('Funding range filter - min only', async () => {
    const filter = { ...defaultFilter, fundingMin: 100000 };
    await buildGrantQuery(filter);
    
    // Should use gte for minimum funding
    expect(supabase.from().gte).toHaveBeenCalledWith('award_floor', 100000);
    // Should exclude null funding by default
    expect(supabase.from().not).toHaveBeenCalledWith('award_ceiling', 'is', null);
  });

  test('Funding range filter - max only', async () => {
    const filter = { ...defaultFilter, fundingMax: 500000 };
    await buildGrantQuery(filter);
    
    // Should use lte for maximum funding
    expect(supabase.from().lte).toHaveBeenCalledWith('award_ceiling', 500000);
    // Should exclude null funding by default
    expect(supabase.from().not).toHaveBeenCalledWith('award_ceiling', 'is', null);
  });

  test('Funding range filter - min and max', async () => {
    const filter = { ...defaultFilter, fundingMin: 100000, fundingMax: 500000 };
    await buildGrantQuery(filter);
    
    // Should use both gte and lte for funding range
    expect(supabase.from().gte).toHaveBeenCalledWith('award_floor', 100000);
    expect(supabase.from().lte).toHaveBeenCalledWith('award_ceiling', 500000);
    // Should exclude null funding by default
    expect(supabase.from().not).toHaveBeenCalledWith('award_ceiling', 'is', null);
  });

  test('Include null funding filter', async () => {
    const filter = { ...defaultFilter, includeFundingNull: true };
    await buildGrantQuery(filter);
    
    // Should not exclude null funding
    expect(supabase.from().not).not.toHaveBeenCalledWith('award_ceiling', 'is', null);
  });

  test('Only no funding filter', async () => {
    const filter = { ...defaultFilter, onlyNoFunding: true };
    await buildGrantQuery(filter);
    
    // Should only include grants with null funding
    expect(supabase.from().is).toHaveBeenCalledWith('award_ceiling', null);
  });

  test('Deadline range filter - min days only', async () => {
    const filter = { ...defaultFilter, deadlineMinDays: 7 };
    await buildGrantQuery(filter);
    
    // Should use gte for minimum deadline
    expect(supabase.from().gte).toHaveBeenCalled();
    // Should exclude null deadlines by default
    expect(supabase.from().or).not.toHaveBeenCalledWith(expect.stringContaining('close_date.is.null'));
  });

  test('Deadline range filter - max days only', async () => {
    const filter = { ...defaultFilter, deadlineMaxDays: 30 };
    await buildGrantQuery(filter);
    
    // Should use lte for maximum deadline
    expect(supabase.from().lte).toHaveBeenCalled();
    // Should exclude null deadlines by default
    expect(supabase.from().or).not.toHaveBeenCalledWith(expect.stringContaining('close_date.is.null'));
  });

  test('Deadline range filter - min and max days', async () => {
    const filter = { ...defaultFilter, deadlineMinDays: 7, deadlineMaxDays: 30 };
    await buildGrantQuery(filter);
    
    // Should use both gte and lte for deadline range
    expect(supabase.from().gte).toHaveBeenCalled();
    expect(supabase.from().lte).toHaveBeenCalled();
    // Should exclude null deadlines by default
    expect(supabase.from().or).not.toHaveBeenCalledWith(expect.stringContaining('close_date.is.null'));
  });

  test('Include null deadline filter', async () => {
    const filter = { ...defaultFilter, includeNoDeadline: true };
    await buildGrantQuery(filter);
    
    // Should include null deadlines
    expect(supabase.from().or).toHaveBeenCalledWith(expect.stringContaining('close_date.is.null'));
  });

  test('Only no deadline filter', async () => {
    const filter = { ...defaultFilter, onlyNoDeadline: true };
    await buildGrantQuery(filter);
    
    // Should only include grants with null deadline
    expect(supabase.from().is).toHaveBeenCalledWith('close_date', null);
  });

  test('Cost sharing filter - required', async () => {
    const filter = { ...defaultFilter, costSharing: 'required' };
    await buildGrantQuery(filter);
    
    // Should filter for grants requiring cost sharing
    expect(supabase.from().eq).toHaveBeenCalledWith('cost_sharing', true);
  });

  test('Cost sharing filter - not required', async () => {
    const filter = { ...defaultFilter, costSharing: 'not-required' };
    await buildGrantQuery(filter);
    
    // Should filter for grants not requiring cost sharing
    expect(supabase.from().eq).toHaveBeenCalledWith('cost_sharing', false);
  });

  test('Sort by deadline (soonest first)', async () => {
    const filter = { ...defaultFilter, sortBy: 'deadline' };
    await buildGrantQuery(filter);
    
    // Should sort by close_date ascending
    expect(supabase.from().order).toHaveBeenCalledWith('close_date', { ascending: true, nullsFirst: false });
  });

  test('Sort by deadline (latest first)', async () => {
    const filter = { ...defaultFilter, sortBy: 'deadline_latest' };
    await buildGrantQuery(filter);
    
    // Should sort by close_date descending
    expect(supabase.from().order).toHaveBeenCalledWith('close_date', { ascending: false, nullsFirst: false });
  });

  test('Sort by funding amount (highest first)', async () => {
    const filter = { ...defaultFilter, sortBy: 'amount' };
    await buildGrantQuery(filter);
    
    // Should sort by award_ceiling descending
    expect(supabase.from().order).toHaveBeenCalledWith('award_ceiling', { ascending: false, nullsFirst: false });
  });

  test('Sort by funding amount (lowest first)', async () => {
    const filter = { ...defaultFilter, sortBy: 'amount_asc' };
    await buildGrantQuery(filter);
    
    // Should sort by award_ceiling ascending
    expect(supabase.from().order).toHaveBeenCalledWith('award_ceiling', { ascending: true, nullsFirst: false });
  });

  test('Sort by recently added', async () => {
    const filter = { ...defaultFilter, sortBy: 'recent' };
    await buildGrantQuery(filter);
    
    // Should sort by post_date descending
    expect(supabase.from().order).toHaveBeenCalledWith('post_date', { ascending: false, nullsFirst: false });
  });

  test('Sort by title (A-Z)', async () => {
    const filter = { ...defaultFilter, sortBy: 'title_asc' };
    await buildGrantQuery(filter);
    
    // Should sort by title ascending
    expect(supabase.from().order).toHaveBeenCalledWith('title', { ascending: true });
  });

  test('Sort by title (Z-A)', async () => {
    const filter = { ...defaultFilter, sortBy: 'title_desc' };
    await buildGrantQuery(filter);
    
    // Should sort by title descending
    expect(supabase.from().order).toHaveBeenCalledWith('title', { ascending: false });
  });

  test('Pagination', async () => {
    const filter = { ...defaultFilter, page: 2 };
    await buildGrantQuery(filter, 20);
    
    // Should use range for pagination
    expect(supabase.from().range).toHaveBeenCalledWith(20, 39);
  });

  test('Complex query with multiple filters', async () => {
    const filter: GrantFilter = {
      searchTerm: 'research',
      agencies: ['National Science Foundation'],
      fundingMin: 100000,
      fundingMax: 1000000,
      includeFundingNull: false,
      onlyNoFunding: false,
      deadlineMinDays: 30,
      deadlineMaxDays: 180,
      includeNoDeadline: false,
      onlyNoDeadline: false,
      costSharing: 'not-required',
      sortBy: 'deadline',
      page: 1
    };
    
    await buildGrantQuery(filter);
    
    // Verify all the expected query methods were called
    expect(supabase.from).toHaveBeenCalledWith('grants');
    expect(supabase.from().select).toHaveBeenCalled();
    expect(supabase.from().or).toHaveBeenCalled(); // For search term and agency
    expect(supabase.from().gte).toHaveBeenCalled(); // For funding min and deadline min
    expect(supabase.from().lte).toHaveBeenCalled(); // For funding max and deadline max
    expect(supabase.from().not).toHaveBeenCalled(); // For excluding null funding
    expect(supabase.from().eq).toHaveBeenCalledWith('cost_sharing', false);
    expect(supabase.from().order).toHaveBeenCalledWith('close_date', { ascending: true, nullsFirst: false });
    expect(supabase.from().range).toHaveBeenCalled();
  });

  test('Edge case: Only show grants with no deadline and no funding', async () => {
    const filter: GrantFilter = {
      ...defaultFilter,
      onlyNoDeadline: true,
      onlyNoFunding: true
    };
    
    await buildGrantQuery(filter);
    
    // Should only include grants with null deadline and null funding
    expect(supabase.from().is).toHaveBeenCalledWith('close_date', null);
    expect(supabase.from().is).toHaveBeenCalledWith('award_ceiling', null);
  });

  test('Edge case: Empty search term should not filter', async () => {
    const filter = { ...defaultFilter, searchTerm: '' };
    await buildGrantQuery(filter);
    
    // Should not call or() for search term
    expect(supabase.from().or).not.toHaveBeenCalledWith(
      expect.stringContaining('title.ilike') || 
      expect.stringContaining('description.ilike')
    );
  });

  test('Edge case: Empty agencies array should not filter', async () => {
    const filter = { ...defaultFilter, agencies: [] };
    await buildGrantQuery(filter);
    
    // Should not call or() for agencies
    expect(supabase.from().or).not.toHaveBeenCalledWith(
      expect.stringContaining('agency_name.eq')
    );
  });
});

// Dashboard filter tests
describe('Dashboard Grant Filtering', () => {
  // These tests would simulate the client-side filtering that happens in the dashboard
  // You would need to implement these based on your actual dashboard filtering logic
  
  test('Dashboard filter: Only show grants with no deadline or open-ended deadlines', () => {
    // Sample grants data
    const grants = [
      { id: '1', title: 'Grant 1', close_date: '2023-12-31', award_ceiling: 100000 },
      { id: '2', title: 'Grant 2', close_date: null, award_ceiling: 200000 },
      { id: '3', title: 'Grant 3', close_date: 'Open-ended', award_ceiling: 300000 },
      { id: '4', title: 'Grant 4', close_date: 'Continuous', award_ceiling: 400000 },
      { id: '5', title: 'Grant 5', close_date: '2024-06-30', award_ceiling: 500000 }
    ];
    
    // Filter function (simplified version of what's in the dashboard)
    const filterOnlyNoDeadline = true;
    const filtered = grants.filter(grant => 
      grant.close_date === null || 
      (typeof grant.close_date === 'string' && 
        (grant.close_date.toLowerCase().includes('open') || 
         grant.close_date.toLowerCase().includes('continuous') ||
         grant.close_date.toLowerCase().includes('ongoing')))
    );
    
    // Should only include grants with null, "Open-ended", or "Continuous" deadlines
    expect(filtered).toHaveLength(3);
    expect(filtered.map(g => g.id)).toEqual(['2', '3', '4']);
  });
  
  test('Dashboard filter: Only show grants with no funding specified', () => {
    // Sample grants data
    const grants = [
      { id: '1', title: 'Grant 1', close_date: '2023-12-31', award_ceiling: 100000 },
      { id: '2', title: 'Grant 2', close_date: null, award_ceiling: null },
      { id: '3', title: 'Grant 3', close_date: 'Open-ended', award_ceiling: 300000 },
      { id: '4', title: 'Grant 4', close_date: 'Continuous', award_ceiling: null },
      { id: '5', title: 'Grant 5', close_date: '2024-06-30', award_ceiling: 500000 }
    ];
    
    // Filter function (simplified version of what's in the dashboard)
    const filterOnlyNoFunding = true;
    const filtered = grants.filter(grant => grant.award_ceiling === null);
    
    // Should only include grants with null award_ceiling
    expect(filtered).toHaveLength(2);
    expect(filtered.map(g => g.id)).toEqual(['2', '4']);
  });
  
  test('Dashboard filter: Search term with no deadline filter', () => {
    // Sample grants data
    const grants = [
      { id: '1', title: 'Research Grant', close_date: '2023-12-31', award_ceiling: 100000 },
      { id: '2', title: 'Technology Grant', close_date: null, award_ceiling: 200000 },
      { id: '3', title: 'Research Technology', close_date: 'Open-ended', award_ceiling: 300000 },
      { id: '4', title: 'Education Grant', close_date: 'Continuous', award_ceiling: 400000 },
      { id: '5', title: 'Healthcare Research', close_date: '2024-06-30', award_ceiling: 500000 }
    ];
    
    // Filter function (simplified version of what's in the dashboard)
    const searchTerm = 'research';
    const filterOnlyNoDeadline = true;
    
    // First apply no deadline filter
    let filtered = grants.filter(grant => 
      grant.close_date === null || 
      (typeof grant.close_date === 'string' && 
        (grant.close_date.toLowerCase().includes('open') || 
         grant.close_date.toLowerCase().includes('continuous') ||
         grant.close_date.toLowerCase().includes('ongoing')))
    );
    
    // Then apply search term filter
    filtered = filtered.filter(grant => 
      grant.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Should only include grants with null, "Open-ended", or "Continuous" deadlines AND "research" in the title
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('3');
  });
});