 "use client";

import React, { useState, useEffect, useRef } from 'react';
import ApplyConfirmationPopup from '@/components/ApplyConfirmationPopup';
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
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const [pendingGrantId, setPendingGrantId] = useState<string | null>(null);
  const [pendingGrantTitle, setPendingGrantTitle] = useState<string>('');

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

  const handleInteraction = async (grantId: string, action: 'applied' | 'saved' | 'ignored', removeFromUI: boolean = true): Promise<void> => {
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

      // Only remove the grant from the UI if specified (for "applied" action, this depends on user confirmation)
      if (removeFromUI) {
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
      }
      
      // Note: We no longer open grants.gov here as it's handled in the GrantCard component
    } catch (error: any) {
      console.error(`Error ${action} grant:`, error.message || error);
      setError(`Failed to ${action} grant: ${error.message || 'Please try again.'}`);
    }
  };

  // Function to handle apply button click and show confirmation popup
  const handleApplyClick = (grantId: string): Promise<void> => {
    return new Promise<void>(resolve => {
      // Find the grant in the list
      const grant = grants.find(g => g.id === grantId);
      
      if (!grant) {
        resolve();
        return;
      }
      
      // Set the pending grant ID and title
      setPendingGrantId(grantId);
      setPendingGrantTitle(grant.title);
      
      // Show the confirmation popup
      setShowApplyConfirmation(true);
      resolve();
    });
  };
  
  // Reference to the SearchResults component's fadeAndRemoveCard function
  const searchResultsRef = React.useRef<{
    fadeAndRemoveCard: (grantId: string) => Promise<void>;
  } | null>(null);

  // Function to handle confirmation response
  const handleApplyConfirmation = async (didApply: boolean) => {
    // Hide the confirmation popup
    setShowApplyConfirmation(false);
    
    // If the user clicked "Yes" and we have a pending grant ID
    if (didApply && pendingGrantId) {
      // First fade out the card using the SearchResults component's function
      if (searchResultsRef.current) {
        await searchResultsRef.current.fadeAndRemoveCard(pendingGrantId);
      }
      
      // Then update the database
      await handleInteraction(pendingGrantId, 'applied', true); // true = remove from UI
    }
    // If "No", do nothing and the card remains visible
    
    // Reset the pending grant ID and title
    setPendingGrantId(null);
    setPendingGrantTitle('');
  };

  // Function to be passed to SearchResults for handling confirmation
  const handleConfirmApply = async (grantId: string): Promise<void> => {
    // This function will be called after the card has faded out
    // The database update is already handled in handleApplyConfirmation
  };
  
  const handleApply = async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'applied', true);
  };

  const handleSave = async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'saved', true);
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
    await handleInteraction(grantId, 'ignored', true);
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
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div>
              <SearchBar
                searchTerm={filter.searchTerm}
                setSearchTerm={(value) => updateFilter('searchTerm', value)}
                onSubmit={handleSearch}
              />
              
              {/* Quick Filters */}
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={() => {
                      resetFilters();
                      updateFilter('sortBy', 'deadline');
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    Closing Soon
                  </button>
                  <button
                    onClick={() => {
                      resetFilters();
                      updateFilter('sortBy', 'amount');
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    Highest Funding
                  </button>
                  <button
                    onClick={() => {
                      resetFilters();
                      updateFilter('sortBy', 'recent');
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    Recently Added
                  </button>
                  <button
                    onClick={() => {
                      resetFilters();
                      updateFilter('agencies', ['National Science Foundation']);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    NSF Grants
                  </button>
                  <button
                    onClick={() => {
                      resetFilters();
                      updateFilter('agencies', ['Department of Health and Human Services']);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    HHS Grants
                  </button>
                </div>
              </div>
              
              {/* Collapsible Advanced Filters */}
              <details className="group border-t">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4">
                  <h2 className="text-lg font-medium text-gray-900">Advanced Filters</h2>
                  <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </summary>
                
                <div className="px-6 pb-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <MultiSelect
                      options={agencyOptions}
                      selectedValues={filter.agencies}
                      onChange={(values) => updateFilter('agencies', values)}
                      label="Agencies"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Sort by</label>
                      <select
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                        value={filter.sortBy}
                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                      >
                        {sortOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FundingRangeFilter
                      fundingMin={filter.fundingMin}
                      fundingMax={filter.fundingMax}
                      includeFundingNull={filter.includeFundingNull}
                      onlyNoFunding={filter.onlyNoFunding}
                      setFundingMin={(value) => updateFilter('fundingMin', value)}
                      setFundingMax={(value) => updateFilter('fundingMax', value)}
                      handleFundingOptionChange={handleFundingOptionChange}
                    />
                    
                    <DeadlineFilter
                      deadlineMinDays={filter.deadlineMinDays}
                      deadlineMaxDays={filter.deadlineMaxDays}
                      includeNoDeadline={filter.includeNoDeadline}
                      onlyNoDeadline={filter.onlyNoDeadline}
                      setDeadlineMinDays={(value) => updateFilter('deadlineMinDays', value)}
                      setDeadlineMaxDays={(value) => updateFilter('deadlineMaxDays', value)}
                      handleDeadlineOptionChange={handleDeadlineOptionChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <CostSharingFilter
                      costSharing={filter.costSharing}
                      setCostSharing={(value) => updateFilter('costSharing', value)}
                    />
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                  
                  <ActiveFilters filter={filter} />
                </div>
              </details>
            </div>
          </div>
          
          {/* Search Results */}
          <SearchResults
            ref={searchResultsRef}
            grants={grants}
            loading={loading}
            error={error}
            page={filter.page}
            totalPages={totalPages}
            grantsPerPage={GRANTS_PER_PAGE}
            goToPage={goToPage}
            onApply={handleApplyClick}
            onSave={handleSave}
            onShare={handleShare}
            onIgnore={handleIgnore}
            onConfirmApply={handleConfirmApply}
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
      
      {/* Apply Confirmation Popup */}
      <ApplyConfirmationPopup
        isOpen={showApplyConfirmation}
        grantTitle={pendingGrantTitle}
        onConfirm={() => handleApplyConfirmation(true)}
        onCancel={() => handleApplyConfirmation(false)}
      />
    </Layout>
  );
}
