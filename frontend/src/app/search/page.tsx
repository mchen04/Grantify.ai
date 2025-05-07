"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout/Layout';
import apiClient from '@/lib/apiClient';
import supabase from '@/lib/supabaseClient'; // Import the supabase client
import { Grant, GrantFilter, SelectOption } from '@/types/grant';
import { useAuth } from '@/contexts/AuthContext';
import {
  MAX_FUNDING,
  MIN_DEADLINE_DAYS,
  MAX_DEADLINE_DAYS,
  SEARCH_GRANTS_PER_PAGE
} from '@/utils/constants';

// Dynamically import ApplyConfirmationPopup component
const DynamicApplyConfirmationPopup = dynamic(
  () => import('@/components/ApplyConfirmationPopup'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 animate-pulse">Loading...</div>
      </div>
    )
  }
);

// Components
import SearchBar from '@/components/search/SearchBar';
import FundingRangeFilter from '@/components/filters/FundingRangeFilter';
import DeadlineFilter from '@/components/filters/DeadlineFilter';
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
    fundingMin: 0,
    fundingMax: MAX_FUNDING,
    includeFundingNull: false, // Changed to false - hide grants with no funding by default
    onlyNoFunding: false,
    deadlineMinDays: MIN_DEADLINE_DAYS,
    deadlineMaxDays: MAX_DEADLINE_DAYS,
    includeNoDeadline: false, // Changed to false - hide grants with no deadline by default
    onlyNoDeadline: false,
    sortBy: 'relevance',
    page: 1
  });

  const { user } = useAuth();


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

  // Memoize the filter update function
  const updateFilter = useCallback((key: keyof GrantFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  }, []);

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

  // Memoize the API call to optimize performance
  const fetchGrantsData = useCallback(async () => {
    // Convert filter to API-compatible format
    const apiFilters: Record<string, any> = {
      search: filter.searchTerm,
      limit: SEARCH_GRANTS_PER_PAGE,
      page: filter.page,
      sort_by: filter.sortBy
    };
    
    // Apply deadline filters
    if (filter.onlyNoDeadline) {
      apiFilters.deadline_null = true;
    } else {
      if (filter.deadlineMinDays > MIN_DEADLINE_DAYS) {
        const minFutureDate = new Date();
        minFutureDate.setDate(minFutureDate.getDate() + filter.deadlineMinDays);
        apiFilters.deadline_min = minFutureDate.toISOString();
      }
      
      if (filter.deadlineMaxDays < MAX_DEADLINE_DAYS) {
        const maxFutureDate = new Date();
        maxFutureDate.setDate(maxFutureDate.getDate() + filter.deadlineMaxDays);
        apiFilters.deadline_max = maxFutureDate.toISOString();
      }
      
      apiFilters.include_no_deadline = filter.includeNoDeadline;
    }
    
    // Apply funding filters
    if (filter.onlyNoFunding) {
      apiFilters.funding_null = true;
    } else {
      if (filter.fundingMin > 0) {
        apiFilters.funding_min = filter.fundingMin;
      }
      
      if (filter.fundingMax < MAX_FUNDING) {
        apiFilters.funding_max = filter.fundingMax;
      }
      
      apiFilters.include_no_funding = filter.includeFundingNull;
    }
    
    return apiClient.grants.getGrants(apiFilters, filter.sortBy);
  }, [filter, SEARCH_GRANTS_PER_PAGE, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS, MAX_FUNDING]);

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchGrantsData();
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (!response.data) {
          throw new Error('No data returned from API');
        }
        
        setGrants(response.data.grants || []);
        setTotalPages(response.data.count ? Math.ceil(response.data.count / SEARCH_GRANTS_PER_PAGE) : 1);
      } catch (error: any) {
        console.error('Error fetching grants:', error);
        setError(`Failed to load grants: ${error.message || 'Please try again later.'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGrants();
  }, [fetchGrantsData, SEARCH_GRANTS_PER_PAGE]);

  // Memoize the search handler to avoid recreating on every render
  const handleSearch = useCallback((e: React.FormEvent) => {
    // Safely call preventDefault if it exists
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    updateFilter('page', 1);
  }, [updateFilter]);

  // Memoize the pagination handler
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateFilter('page', newPage);
    }
  }, [updateFilter, totalPages]);

  // Memoize the filter reset function
  const resetFilters = useCallback(() => {
    setFilter({
      searchTerm: '',
      fundingMin: 0,
      fundingMax: MAX_FUNDING,
      includeFundingNull: true,
      onlyNoFunding: false,
      deadlineMinDays: MIN_DEADLINE_DAYS,
      deadlineMaxDays: MAX_DEADLINE_DAYS,
      includeNoDeadline: true,
      onlyNoDeadline: false,
      sortBy: 'relevance',
      page: 1
    });
  }, [MAX_FUNDING, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS]);

  const handleInteraction = useCallback(async (grantId: string, action: 'applied' | 'saved' | 'ignored', removeFromUI: boolean = true): Promise<void> => {
    // Ensure user is logged in
    if (!user) {
      console.error('User not logged in for interaction.');
      setError('You must be logged in to perform this action.');
      return;
    }
 
    try {
      // Explicitly get the latest session before making the API call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
 
      if (sessionError || !session) {
        console.error('Failed to get session in handleInteraction:', sessionError?.message);
        setError('Authentication session expired or invalid. Please log in again.');
        // Optionally redirect to login page
        // router.push('/login');
        return;
      }
 
      console.log('User object in handleInteraction:', user);
      console.log('Session object in handleInteraction (fetched):', session);
      console.log('Access token in handleInteraction (fetched):', session.access_token);
 
      // Insert the new interaction using apiClient, passing the fetched access token
      const response = await apiClient.users.recordInteraction(user.id, grantId, action, session.access_token);
      
      if (response.error) throw response.error;

      // Only remove the grant from the UI if specified (for "applied" action, this depends on user confirmation)
      if (removeFromUI) {
        // Remove the grant from the UI
        setGrants(prevGrants => prevGrants.filter(g => g.id !== grantId));

        // Fetch one more grant to replace the one that was removed
        const currentCount = grants.length;
        if (currentCount > 0) {
          const lastGrant = grants[currentCount - 1];
          // Fetch one more grant using apiClient
          const response = await apiClient.grants.getGrants({
            limit: 1,
            after_id: lastGrant.id,
            exclude_interactions: true,
            user_id: user.id
          }, user.session?.access_token);
          
          if (response.error) {
            console.error('Error fetching replacement grant:', response.error);
          } else {
            const newGrants = response.data?.grants;
            
            if (newGrants && newGrants.length > 0) {
              // Add the new grant to the end of the list
              setGrants(prevGrants => [...prevGrants, ...newGrants]);
            }
          }
        }
      }
      
      // Note: We no longer open grants.gov here as it's handled in the GrantCard component
    } catch (error: any) {
      console.error(`Error ${action} grant:`, error.message || error);
      setError(`Failed to ${action} grant: ${error.message || 'Please try again.'}`);
    }
  }, [user, setGrants, grants, setError]);

  // Memoize the apply click handler to avoid recreating on every render
  const handleApplyClick = useCallback((grantId: string): Promise<void> => {
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
  }, [grants, setPendingGrantId, setPendingGrantTitle, setShowApplyConfirmation]);
  
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

  // Remove or simplify the function since it's no longer needed
  // after refactoring the confirmation flow
  const handleConfirmApply = useCallback(async (grantId: string): Promise<void> => {
    // This is now just a stub - actual logic is in handleApplyConfirmation
  }, []);
  
  // Memoize handlers for grant interactions
  const handleApply = useCallback(async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'applied', true);
  }, [handleInteraction]);

  const handleSave = useCallback(async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'saved', true);
  }, [handleInteraction]);

  const handleShare = useCallback(async (grantId: string) => {
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
  }, []);

  const handleIgnore = useCallback(async (grantId: string): Promise<void> => {
    await handleInteraction(grantId, 'ignored', true);
  }, [handleInteraction]);

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
                      updateFilter('sortBy', 'available');
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    Available Grants
                  </button>
                  <button
                    onClick={() => {
                      resetFilters();
                      updateFilter('sortBy', 'popular');
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    Popular Grants
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
            grantsPerPage={SEARCH_GRANTS_PER_PAGE}
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
      
      {/* Apply Confirmation Popup - Dynamically loaded */}
      {showApplyConfirmation && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 animate-pulse">Loading...</div>
          </div>
        }>
          <DynamicApplyConfirmationPopup
            isOpen={showApplyConfirmation}
            grantTitle={pendingGrantTitle}
            onConfirm={() => handleApplyConfirmation(true)}
            onCancel={() => handleApplyConfirmation(false)}
          />
        </Suspense>
      )}
    </Layout>
  );
}
