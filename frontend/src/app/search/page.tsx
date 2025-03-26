 "use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import supabase from '@/lib/supabaseClient';
import { Grant, GrantFilter, SelectOption } from '@/types/grant';
import { buildGrantQuery } from '@/utils/grantQueryBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MAX_FUNDING, 
  MIN_DEADLINE_DAYS, 
  MAX_DEADLINE_DAYS,
  GRANTS_PER_PAGE 
} from '@/utils/constants';

// Components
import SearchBar from '@/components/search/SearchBar';
import MultiSelect from '@/components/filters/MultiSelect';
import FundingRangeFilter from '@/components/filters/FundingRangeFilter';
import DeadlineFilter from '@/components/filters/DeadlineFilter';
import CostSharingFilter from '@/components/filters/CostSharingFilter';
import SortAndFilterControls from '@/components/search/SortAndFilterControls';
import ActiveFilters from '@/components/filters/ActiveFilters';
import SearchResults from '@/components/search/SearchResults';

export default function Search() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const [filter, setFilter] = useState<GrantFilter>({
    searchTerm: '',
    agencies: [],
    fundingMin: 0,
    fundingMax: MAX_FUNDING,
    includeFundingNull: true,
    onlyNoFunding: false,
    deadlineMinDays: MIN_DEADLINE_DAYS,
    deadlineMaxDays: MAX_DEADLINE_DAYS,
    includeNoDeadline: true,
    onlyNoDeadline: false,
    costSharing: '',
    sortBy: 'relevance',
    page: 1
  });

  const { user } = useAuth();

  const agencyOptions: SelectOption[] = [
    { value: 'Department of Health and Human Services', label: 'Department of Health and Human Services' },
    { value: 'Department of Education', label: 'Department of Education' },
    { value: 'National Science Foundation', label: 'National Science Foundation' },
    { value: 'Department of Energy', label: 'Department of Energy' },
    { value: 'Department of Agriculture', label: 'Department of Agriculture' },
    { value: 'Department of Defense', label: 'Department of Defense' },
    { value: 'Department of Commerce', label: 'Department of Commerce' },
    { value: 'Small Business Administration', label: 'Small Business Administration' },
    { value: 'Environmental Protection Agency', label: 'Environmental Protection Agency' }
  ];

  const sortOptions: SelectOption[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'deadline', label: 'Deadline (Soonest)' },
    { value: 'deadline_latest', label: 'Deadline (Latest)' },
    { value: 'amount', label: 'Funding Amount (Highest)' },
    { value: 'amount_asc', label: 'Funding Amount (Lowest)' },
    { value: 'title_asc', label: 'Title (A-Z)' },
    { value: 'title_desc', label: 'Title (Z-A)' }
  ];

  const updateFilter = (key: keyof GrantFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleFundingOptionChange = (option: 'include' | 'only', checked: boolean) => {
    if (option === 'only') {
      updateFilter('onlyNoFunding', checked);
      if (checked) {
        updateFilter('includeFundingNull', true);
        updateFilter('fundingMin', 0);
        updateFilter('fundingMax', MAX_FUNDING);
      }
    } else {
      updateFilter('includeFundingNull', checked);
      if (checked && filter.onlyNoFunding) {
        updateFilter('onlyNoFunding', false);
      }
    }
  };

  const handleDeadlineOptionChange = (option: 'include' | 'only', checked: boolean) => {
    if (option === 'only') {
      updateFilter('onlyNoDeadline', checked);
      if (checked) {
        updateFilter('includeNoDeadline', true);
        updateFilter('deadlineMinDays', MIN_DEADLINE_DAYS);
        updateFilter('deadlineMaxDays', MAX_DEADLINE_DAYS);
      }
    } else {
      updateFilter('includeNoDeadline', checked);
      if (checked && filter.onlyNoDeadline) {
        updateFilter('onlyNoDeadline', false);
      }
    }
  };

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        setLoading(true);
        setError(null);
        const query = await buildGrantQuery(filter, GRANTS_PER_PAGE);
        const { data, error: queryError, count } = await query;
        
        if (queryError) throw queryError;
        
        setGrants(data || []);
        setTotalPages(count ? Math.ceil(count / GRANTS_PER_PAGE) : 1);
      } catch (error: any) {
        console.error('Error fetching grants:', error);
        setError('Failed to load grants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGrants();
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('page', 1);
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateFilter('page', newPage);
    }
  };

  const resetFilters = () => {
    setFilter({
      searchTerm: '',
      agencies: [],
      fundingMin: 0,
      fundingMax: MAX_FUNDING,
      includeFundingNull: true,
      onlyNoFunding: false,
      deadlineMinDays: MIN_DEADLINE_DAYS,
      deadlineMaxDays: MAX_DEADLINE_DAYS,
      includeNoDeadline: true,
      onlyNoDeadline: false,
      costSharing: '',
      sortBy: 'relevance',
      page: 1
    });
  };

  const handleInteraction = async (grantId: string, action: 'applied' | 'saved' | 'ignored'): Promise<void> => {
    if (!user) return;

    try {
      // Insert the new interaction
      const { error: insertError } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          grant_id: grantId,
          action: action,
          timestamp: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Remove the grant from the UI
      setGrants(prevGrants => prevGrants.filter(g => g.id !== grantId));

      // Fetch one more grant to replace the one that was removed
      const currentCount = grants.length;
      if (currentCount > 0) {
        const lastGrant = grants[currentCount - 1];
        const { data: newGrants, error } = await supabase
          .from('grants')
          .select(`
            *,
            interactions:user_interactions!left(action, timestamp)
          `)
          .eq('interactions.user_id', user.id)
          .is('interactions', null)
          .gt('id', lastGrant.id)
          .limit(1);

        if (!error && newGrants && newGrants.length > 0) {
          // Add the new grant to the end of the list
          setGrants(prevGrants => [...prevGrants, ...newGrants]);
        }
      }

      // Open grants.gov if applying
      if (action === 'applied') {
        window.open(`https://www.grants.gov/view-grant.html?oppId=${grantId}`, '_blank');
      }
    } catch (error: any) {
      console.error(`Error ${action} grant:`, error.message || error);
      setError(`Failed to ${action} grant: ${error.message || 'Please try again.'}`);
    }
  };

  const handleApply = async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'applied');
  };

  const handleSave = async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'saved');
  };

  const handleShare = async (grantId: string) => {
    const shareUrl = `${window.location.origin}/grants/${grantId}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this grant',
          text: 'I found this interesting grant opportunity',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error: any) {
      // Don't log errors if the user canceled the share
      if (error.name !== 'AbortError') {
        // Only copy to clipboard if it's not a cancel action
        await navigator.clipboard.writeText(shareUrl);
      }
    }
  };

  const handleIgnore = async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'ignored');
  };

  return (
    <Layout>
      <div className="flex">
        {/* Left ad sidebar - pushed to edge */}
        <div className="hidden lg:block w-44 flex-shrink-0 -ml-4">
          <div className="sticky top-8">
            <div className="ad-container h-[400px]">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 text-center">Sponsored</p>
              <div className="bg-gray-50 rounded h-full w-full flex items-center justify-center">
                <span className="text-gray-400">Ad Space</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-4">
          {/* Search and Filter Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div>
              <SearchBar 
                searchTerm={filter.searchTerm}
                setSearchTerm={(value) => updateFilter('searchTerm', value)}
                onSubmit={handleSearch}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <MultiSelect
                  options={agencyOptions}
                  selectedValues={filter.agencies}
                  onChange={(values) => updateFilter('agencies', values)}
                  label="Agencies"
                />
                
                <FundingRangeFilter
                  fundingMin={filter.fundingMin}
                  fundingMax={filter.fundingMax}
                  includeFundingNull={filter.includeFundingNull}
                  onlyNoFunding={filter.onlyNoFunding}
                  setFundingMin={(value) => updateFilter('fundingMin', value)}
                  setFundingMax={(value) => updateFilter('fundingMax', value)}
                  handleFundingOptionChange={handleFundingOptionChange}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <DeadlineFilter
                  deadlineMinDays={filter.deadlineMinDays}
                  deadlineMaxDays={filter.deadlineMaxDays}
                  includeNoDeadline={filter.includeNoDeadline}
                  onlyNoDeadline={filter.onlyNoDeadline}
                  setDeadlineMinDays={(value) => updateFilter('deadlineMinDays', value)}
                  setDeadlineMaxDays={(value) => updateFilter('deadlineMaxDays', value)}
                  handleDeadlineOptionChange={handleDeadlineOptionChange}
                />
                
                <CostSharingFilter
                  costSharing={filter.costSharing}
                  setCostSharing={(value) => updateFilter('costSharing', value)}
                />
              </div>
              
              <SortAndFilterControls
                sortBy={filter.sortBy}
                setSortBy={(value) => updateFilter('sortBy', value)}
                sortOptions={sortOptions}
                resetFilters={resetFilters}
              />
              
              <ActiveFilters filter={filter} />
            </div>
          </div>
          
          {/* Search Results */}
          <SearchResults
            grants={grants}
            loading={loading}
            error={error}
            page={filter.page}
            totalPages={totalPages}
            grantsPerPage={GRANTS_PER_PAGE}
            goToPage={goToPage}
            onApply={handleApply}
            onSave={handleSave}
            onShare={handleShare}
            onIgnore={handleIgnore}
          />
        </div>

        {/* Right ad sidebar - pushed to edge */}
        <div className="hidden lg:block w-44 flex-shrink-0 -mr-4">
          <div className="sticky top-8">
            <div className="ad-container h-[400px]">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 text-center">Sponsored</p>
              <div className="bg-gray-50 rounded h-full w-full flex items-center justify-center">
                <span className="text-gray-400">Ad Space</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
