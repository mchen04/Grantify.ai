import { Grant } from '../models/grant';

// Sample grant data for testing
const MOCK_GRANTS: Grant[] = [
  {
    id: '1',
    title: 'Research Grant for Renewable Energy',
    opportunity_id: 'RG-2025-001',
    opportunity_number: 'RG-2025-001',
    category: 'Energy',
    grant_type: 'Research',
    activity_category: ['Research', 'Development', 'Renewable Energy'],
    eligible_applicants: ['Universities', 'Research Institutions', 'Non-profits'],
    agency_name: 'Department of Energy',
    agency_subdivision: 'Office of Energy Efficiency & Renewable Energy',
    agency_code: 'DOE-EERE',
    post_date: new Date('2025-01-15'),
    close_date: new Date('2025-07-15'),
    total_funding: 5000000,
    award_ceiling: 500000,
    award_floor: 100000,
    expected_award_count: 10,
    cost_sharing: true,
    description_short: 'Funding for innovative research in renewable energy technologies.',
    description_full: 'This grant provides funding for innovative research in renewable energy technologies, including solar, wind, and geothermal energy. Projects should focus on improving efficiency, reducing costs, or developing new applications.',
    source_url: 'https://www.energy.gov/grants',
    data_source: 'Mock Data',
    status: 'Open',
    grantor_contact_name: 'John Smith',
    grantor_contact_email: 'john.smith@energy.gov',
    grantor_contact_phone: '(202) 555-1234',
    keywords: ['renewable', 'energy', 'research', 'innovation']
  },
  {
    id: '2',
    title: 'Community Development Block Grant',
    opportunity_id: 'CDBG-2025-002',
    opportunity_number: 'CDBG-2025-002',
    category: 'Community Development',
    grant_type: 'Block Grant',
    activity_category: ['Community Development', 'Infrastructure', 'Housing'],
    eligible_applicants: ['Local Governments', 'Non-profits', 'Community Organizations'],
    agency_name: 'Department of Housing and Urban Development',
    agency_subdivision: 'Office of Community Planning and Development',
    agency_code: 'HUD-CPD',
    post_date: new Date('2025-02-01'),
    close_date: new Date('2025-08-01'),
    total_funding: 10000000,
    award_ceiling: 1000000,
    award_floor: 250000,
    expected_award_count: 15,
    cost_sharing: false,
    description_short: 'Funding for community development projects in low-income areas.',
    description_full: 'The Community Development Block Grant program provides funding for community development projects in low-income areas, including infrastructure improvements, housing rehabilitation, and economic development initiatives.',
    source_url: 'https://www.hud.gov/grants',
    data_source: 'Mock Data',
    status: 'Open',
    grantor_contact_name: 'Jane Doe',
    grantor_contact_email: 'jane.doe@hud.gov',
    grantor_contact_phone: '(202) 555-5678',
    keywords: ['community', 'development', 'housing', 'infrastructure']
  },
  {
    id: '3',
    title: 'Small Business Innovation Research Grant',
    opportunity_id: 'SBIR-2025-003',
    opportunity_number: 'SBIR-2025-003',
    category: 'Small Business',
    grant_type: 'Research',
    activity_category: ['Research', 'Innovation', 'Small Business'],
    eligible_applicants: ['Small Businesses', 'Startups'],
    agency_name: 'Small Business Administration',
    agency_subdivision: 'Office of Innovation and Technology',
    agency_code: 'SBA-OIT',
    post_date: new Date('2025-03-01'),
    close_date: new Date('2025-09-01'),
    total_funding: 7500000,
    award_ceiling: 250000,
    award_floor: 50000,
    expected_award_count: 30,
    cost_sharing: false,
    description_short: 'Funding for innovative research by small businesses.',
    description_full: 'The Small Business Innovation Research Grant program provides funding for innovative research by small businesses in various fields, including technology, healthcare, and energy. Projects should have commercial potential and address significant societal challenges.',
    source_url: 'https://www.sba.gov/grants',
    data_source: 'Mock Data',
    status: 'Open',
    grantor_contact_name: 'Robert Johnson',
    grantor_contact_email: 'robert.johnson@sba.gov',
    grantor_contact_phone: '(202) 555-9012',
    keywords: ['small business', 'innovation', 'research', 'technology']
  },
  {
    id: '4',
    title: 'Arts and Humanities Grant',
    opportunity_id: 'AHG-2025-004',
    opportunity_number: 'AHG-2025-004',
    category: 'Arts and Humanities',
    grant_type: 'Project',
    activity_category: ['Arts', 'Humanities', 'Education'],
    eligible_applicants: ['Non-profits', 'Educational Institutions', 'Individual Artists'],
    agency_name: 'National Endowment for the Arts',
    agency_subdivision: 'Office of Grant Programs',
    agency_code: 'NEA-OGP',
    post_date: new Date('2025-04-01'),
    close_date: new Date('2025-10-01'),
    total_funding: 3000000,
    award_ceiling: 100000,
    award_floor: 10000,
    expected_award_count: 50,
    cost_sharing: true,
    description_short: 'Funding for arts and humanities projects.',
    description_full: 'The Arts and Humanities Grant program provides funding for arts and humanities projects, including exhibitions, performances, and educational programs. Projects should engage the public and promote cultural understanding and appreciation.',
    source_url: 'https://www.arts.gov/grants',
    data_source: 'Mock Data',
    status: 'Open',
    grantor_contact_name: 'Sarah Williams',
    grantor_contact_email: 'sarah.williams@arts.gov',
    grantor_contact_phone: '(202) 555-3456',
    keywords: ['arts', 'humanities', 'culture', 'education']
  },
  {
    id: '5',
    title: 'Environmental Protection Research Grant',
    opportunity_id: 'EPRG-2025-005',
    opportunity_number: 'EPRG-2025-005',
    category: 'Environment',
    grant_type: 'Research',
    activity_category: ['Research', 'Environmental Protection', 'Conservation'],
    eligible_applicants: ['Universities', 'Research Institutions', 'Non-profits'],
    agency_name: 'Environmental Protection Agency',
    agency_subdivision: 'Office of Research and Development',
    agency_code: 'EPA-ORD',
    post_date: new Date('2025-05-01'),
    close_date: new Date('2025-11-01'),
    total_funding: 4000000,
    award_ceiling: 400000,
    award_floor: 100000,
    expected_award_count: 12,
    cost_sharing: true,
    description_short: 'Funding for environmental protection research.',
    description_full: 'The Environmental Protection Research Grant program provides funding for research on environmental protection, including air and water quality, waste management, and ecosystem conservation. Projects should contribute to the development of effective environmental policies and practices.',
    source_url: 'https://www.epa.gov/grants',
    data_source: 'Mock Data',
    status: 'Open',
    grantor_contact_name: 'Michael Brown',
    grantor_contact_email: 'michael.brown@epa.gov',
    grantor_contact_phone: '(202) 555-7890',
    keywords: ['environment', 'protection', 'conservation', 'research']
  }
];

/**
 * Mock service for providing grant data when Supabase is unavailable
 */
class MockGrantsService {
  /**
   * Get grants with filtering
   * @param filters - Filters to apply
   * @returns Array of grants
   */
  async getGrants(filters: any = {}): Promise<Grant[]> {
    console.log('MOCK SERVICE: Fetching grants with filters:', JSON.stringify(filters, null, 2));
    
    // Simulate a delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Apply basic filtering
    let filteredGrants = [...MOCK_GRANTS];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredGrants = filteredGrants.filter(grant => 
        grant.title.toLowerCase().includes(searchTerm) ||
        grant.description_short.toLowerCase().includes(searchTerm) ||
        grant.description_full.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply agency filter
    if (filters.agency_name) {
      filteredGrants = filteredGrants.filter(grant => 
        grant.agency_name.toLowerCase().includes(filters.agency_name.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filters.category) {
      filteredGrants = filteredGrants.filter(grant => 
        grant.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    
    // Apply funding filters
    if (filters.funding_min) {
      filteredGrants = filteredGrants.filter(grant =>
        (grant.award_floor || 0) >= filters.funding_min
      );
    }
    
    if (filters.funding_max) {
      filteredGrants = filteredGrants.filter(grant =>
        (grant.award_ceiling || 0) <= filters.funding_max
      );
    }
    
    // Apply sorting
    if (filters.sort_by) {
      const sortBy = filters.sort_by;
      const sortDirection = filters.sort_direction === 'desc' ? -1 : 1;
      
      filteredGrants.sort((a, b) => {
        if (sortBy === 'amount') {
          return sortDirection * ((a.award_ceiling || 0) - (b.award_ceiling || 0));
        } else if (sortBy === 'deadline') {
          const dateA = a.close_date ? new Date(a.close_date).getTime() : Number.MAX_SAFE_INTEGER;
          const dateB = b.close_date ? new Date(b.close_date).getTime() : Number.MAX_SAFE_INTEGER;
          return sortDirection * (dateA - dateB);
        } else if (sortBy === 'recent') {
          const dateA = a.post_date ? new Date(a.post_date).getTime() : 0;
          const dateB = b.post_date ? new Date(b.post_date).getTime() : 0;
          return sortDirection * (dateB - dateA); // Newest first
        } else if (sortBy === 'title_asc') {
          return sortDirection * a.title.localeCompare(b.title);
        } else if (sortBy === 'title_desc') {
          return sortDirection * b.title.localeCompare(a.title);
        }
        return 0;
      });
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedGrants = filteredGrants.slice(startIndex, endIndex);
    
    console.log(`MOCK SERVICE: Returning ${paginatedGrants.length} grants`);
    
    return paginatedGrants;
  }
  
  /**
   * Get recommended grants for a user
   * @param userId - User ID to get recommendations for
   * @param options - Options for filtering recommendations
   * @returns Array of recommended grants
   */
  async getRecommendedGrants(userId: string, options: { exclude?: string[], limit?: number } = {}): Promise<Grant[]> {
    console.log(`MOCK SERVICE: Fetching recommended grants for user ${userId} with options:`, JSON.stringify(options, null, 2));
    
    // Simulate a delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For mock data, just return all grants as recommendations
    // In a real implementation, this would use user preferences to filter and rank grants
    
    // Apply exclusions
    let recommendedGrants = [...MOCK_GRANTS];
    if (options.exclude && options.exclude.length > 0) {
      recommendedGrants = recommendedGrants.filter(grant => !options.exclude?.includes(grant.id));
    }
    
    // Apply limit
    const limit = options.limit || 10;
    recommendedGrants = recommendedGrants.slice(0, limit);
    
    console.log(`MOCK SERVICE: Returning ${recommendedGrants.length} recommended grants`);
    
    return recommendedGrants;
  }
}

export default new MockGrantsService();