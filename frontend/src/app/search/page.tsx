"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import supabase from '@/lib/supabaseClient';
import { Grant, GrantFilter, SelectOption } from '@/types/grant';
import { buildGrantQuery } from '@/utils/grantQueryBuilder';
import { MAX_FUNDING, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '@/utils/constants';

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
  // State for grants and loading
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const grantsPerPage = 10;

  // Filter state
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

  // Agency options
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

  // Sort options
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

  // Update filter state
  const updateFilter = (key: keyof GrantFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle funding filter option changes
  const handleFundingOptionChange = (option: 'include' | 'only', checked: boolean) => {
    if (option === 'only') {
      updateFilter('onlyNoFunding', checked);
      if (checked) {
        // If "Only show grants with no funding" is checked, disable the other option
        updateFilter('includeFundingNull', true);
        // Disable the sliders by setting them to their default values
        updateFilter('fundingMin', 0);
        updateFilter('fundingMax', MAX_FUNDING);
      }
    } else {
      updateFilter('includeFundingNull', checked);
      if (checked && filter.onlyNoFunding) {
        // If "Include grants with no funding" is checked and "Only" was previously checked,
        // uncheck the "Only" option
        updateFilter('onlyNoFunding', false);
      }
    }
  };

  // Handle deadline filter option changes
  const handleDeadlineOptionChange = (option: 'include' | 'only', checked: boolean) => {
    if (option === 'only') {
      updateFilter('onlyNoDeadline', checked);
      if (checked) {
        // If "Only show grants with no deadline" is checked, disable the other option
        updateFilter('includeNoDeadline', true);
        // Disable the sliders by setting them to their default values
        updateFilter('deadlineMinDays', MIN_DEADLINE_DAYS);
        updateFilter('deadlineMaxDays', MAX_DEADLINE_DAYS);
      }
    } else {
      updateFilter('includeNoDeadline', checked);
      if (checked && filter.onlyNoDeadline) {
        // If "Include grants with no deadline" is checked and "Only" was previously checked,
        // uncheck the "Only" option
        updateFilter('onlyNoDeadline', false);
      }
    }
  };

  // Fetch grants on initial load and when filters change
  useEffect(() => {
    const fetchGrants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build the query
        console.log('Building query with filters:', filter);
        const query = await buildGrantQuery(filter, grantsPerPage);
        
        // Execute the query
        console.log('Executing query...');
        const { data, error, count } = await query;
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log(`Query successful! Found ${count || 0} grants.`);
        setGrants(data || []);
        setTotalPages(count ? Math.ceil(count / grantsPerPage) : 1);
      } catch (error: any) {
        // More detailed error logging
        console.error('Error fetching grants:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        setError('Failed to load grants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGrants();
  }, [filter]);

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('page', 1); // Reset to first page when searching
  };

  // Handle pagination
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateFilter('page', newPage);
    }
  };

  // Reset all filters
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

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Find Grants</h1>
        
        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSearch}>
            {/* Search Bar */}
            <SearchBar 
              searchTerm={filter.searchTerm}
              setSearchTerm={(value) => updateFilter('searchTerm', value)}
              onSubmit={handleSearch}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Multi-select Agency Filter */}
              <MultiSelect
                options={agencyOptions}
                selectedValues={filter.agencies}
                onChange={(values) => updateFilter('agencies', values)}
                label="Agencies"
              />
              
              {/* Funding Range Filter */}
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
              {/* Deadline Filter */}
              <DeadlineFilter
                deadlineMinDays={filter.deadlineMinDays}
                deadlineMaxDays={filter.deadlineMaxDays}
                includeNoDeadline={filter.includeNoDeadline}
                onlyNoDeadline={filter.onlyNoDeadline}
                setDeadlineMinDays={(value) => updateFilter('deadlineMinDays', value)}
                setDeadlineMaxDays={(value) => updateFilter('deadlineMaxDays', value)}
                handleDeadlineOptionChange={handleDeadlineOptionChange}
              />
              
              {/* Cost Sharing Filter */}
              <CostSharingFilter
                costSharing={filter.costSharing}
                setCostSharing={(value) => updateFilter('costSharing', value)}
              />
            </div>
            
            {/* Sort and Filter Controls */}
            <SortAndFilterControls
              sortBy={filter.sortBy}
              setSortBy={(value) => updateFilter('sortBy', value)}
              sortOptions={sortOptions}
              resetFilters={resetFilters}
            />
            
            {/* Active Filters */}
            <ActiveFilters filter={filter} />
          </form>
        </div>
        
        {/* Search Results */}
        <SearchResults
          grants={grants}
          loading={loading}
          error={error}
          page={filter.page}
          totalPages={totalPages}
          grantsPerPage={grantsPerPage}
          goToPage={goToPage}
        />
      </div>
    </Layout>
  );
}
