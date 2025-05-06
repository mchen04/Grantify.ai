"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import GrantCard from '@/components/GrantCard';
import DashboardGrantCard from '@/components/dashboard/DashboardGrantCard';
import apiClient from '@/lib/apiClient';
import { calculateMatchScore, UserPreferences } from '@/lib/grantRecommendations';
import { DEFAULT_USER_PREFERENCES } from '@/lib/config';
import { DASHBOARD_GRANTS_PER_PAGE } from '@/utils/constants';
import Pagination from '@/components/dashboard/Pagination';
import CollapsibleFilterPanel from '@/components/dashboard/CollapsibleFilterPanel';
import { SelectOption } from '@/types/grant';

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

import { useFetchDashboardData } from '@/hooks/useFetchDashboardData';
import { useGrantInteractions } from '@/hooks/useGrantInteractions';
import { Grant, ScoredGrant } from '@/types/grant';
import { UserInteraction } from '@/types/user';

const TARGET_RECOMMENDED_COUNT = 10; // Target number of recommended grants

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize activeTab from URL query parameter if available
    const tabParam = searchParams.get('tab');
    return tabParam && ['recommended', 'saved', 'applied', 'ignored'].includes(tabParam)
      ? tabParam
      : 'recommended';
  });
  
  const [error, setError] = useState<string | null>(null);
  
  // Use the custom hooks for data fetching and interactions
  const {
    recommendedGrants,
    savedGrants,
    appliedGrants,
    ignoredGrants,
    userPreferences,
    loading,
    error: dashboardError,
    refetch,
    fetchReplacementRecommendations
  } = useFetchDashboardData({
    userId: user?.id,
    targetRecommendedCount: TARGET_RECOMMENDED_COUNT,
    enabled: !!user
  });
  
  // Set error from dashboard hook
  useEffect(() => {
    if (dashboardError) {
      setError(dashboardError);
    }
  }, [dashboardError]);
  
  const {
    interactionLoading,
    handleSaveGrant,
    handleApplyGrant,
    handleIgnoreGrant,
    handleShareGrant,
    handleUndoInteraction
  } = useGrantInteractions({
    userId: user?.id,
    onError: (message) => setError(message)
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const [pendingGrantId, setPendingGrantId] = useState<string | null>(null);
  const [pendingGrantTitle, setPendingGrantTitle] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('deadline');
  const [filterOnlyNoDeadline, setFilterOnlyNoDeadline] = useState(false);
  const [filterOnlyNoFunding, setFilterOnlyNoFunding] = useState(false);

  // Pagination state for each tab
  const [currentPage, setCurrentPage] = useState({
    recommended: 1,
    saved: 1,
    applied: 1,
    ignored: 1
  });

  // Number of grants to display per page
  const GRANTS_PER_PAGE = DASHBOARD_GRANTS_PER_PAGE;

  // Sort options for the dashboard
  const sortOptions: SelectOption[] = [
    { value: 'deadline', label: 'Deadline (Soonest)' },
    { value: 'deadline_latest', label: 'Deadline (Latest)' },
    { value: 'amount', label: 'Funding Amount (Highest)' },
    { value: 'amount_asc', label: 'Funding Amount (Lowest)' },
    { value: 'title_asc', label: 'Title (A-Z)' },
    { value: 'title_desc', label: 'Title (Z-A)' }
  ];

  // Filter and sort grants based on search term, filter options, and sort option
  const filterAndSortGrants = useCallback((grants: Grant[]) => {
    // Apply filters in sequence
    let filteredGrants = grants;

    // Apply no deadline filter if enabled
    if (filterOnlyNoDeadline) {
      filteredGrants = filteredGrants.filter(grant =>
        grant.close_date === null ||
        (typeof grant.close_date === 'string' &&
          (grant.close_date.toLowerCase().includes('open') ||
           grant.close_date.toLowerCase().includes('continuous') ||
           grant.close_date.toLowerCase().includes('ongoing')))
      );
    } else {
      // When the filter is off, exclude grants with open-ended deadlines
      filteredGrants = filteredGrants.filter(grant =>
        !(typeof grant.close_date === 'string' &&
          (grant.close_date.toLowerCase().includes('open') ||
           grant.close_date.toLowerCase().includes('continuous') ||
           grant.close_date.toLowerCase().includes('ongoing')))
      );
    }

    // Apply no funding filter if enabled
    if (filterOnlyNoFunding) {
      filteredGrants = filteredGrants.filter(grant => grant.award_ceiling === null);
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredGrants = filteredGrants.filter(grant =>
        grant.title.toLowerCase().includes(term) ||
        grant.description_short.toLowerCase().includes(term) ||
        grant.agency_name.toLowerCase().includes(term)
      );
    }

    // Finally sort based on sortBy option
    return [...filteredGrants].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          // Sort by deadline (soonest first)
          if (!a.close_date) return 1;
          if (!b.close_date) return -1;
          return new Date(a.close_date).getTime() - new Date(b.close_date).getTime();

        case 'deadline_latest':
          // Sort by deadline (latest first)
          if (!a.close_date) return 1;
          if (!b.close_date) return -1;
          return new Date(b.close_date).getTime() - new Date(a.close_date).getTime();

        case 'amount':
          // Sort by funding amount (highest first)
          if (a.award_ceiling === null) return 1;
          if (b.award_ceiling === null) return -1;
          return b.award_ceiling - a.award_ceiling;

        case 'amount_asc':
          // Sort by funding amount (lowest first)
          if (a.award_ceiling === null) return 1;
          if (b.award_ceiling === null) return -1;
          return a.award_ceiling - b.award_ceiling;

        case 'title_asc':
          // Sort by title (A-Z)
          return a.title.localeCompare(b.title);

        case 'title_desc':
          // Sort by title (Z-A)
          return b.title.localeCompare(a.title);

        default:
          return 0;
      }
    });
  }, [sortBy, filterOnlyNoDeadline, filterOnlyNoFunding, searchTerm]);

  // Memoize filtered and sorted grants to prevent unnecessary recalculations
  const filteredAndSortedGrants = useMemo(() => {
    return {
      recommended: filterAndSortGrants(recommendedGrants) as ScoredGrant[],
      saved: filterAndSortGrants(savedGrants),
      applied: filterAndSortGrants(appliedGrants),
      ignored: filterAndSortGrants(ignoredGrants)
    };
  }, [filterAndSortGrants, recommendedGrants, savedGrants, appliedGrants, ignoredGrants]);

  // Handle page change
  const handlePageChange = (tabName: string, newPage: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [tabName]: newPage
    }));
  };

  // Get paginated grants for the current tab
  const getPaginatedGrants = useCallback((grants: Grant[], tabName: string) => {
    const filtered = filteredAndSortedGrants[tabName as keyof typeof filteredAndSortedGrants];
    const startIndex = (currentPage[tabName as keyof typeof currentPage] - 1) * GRANTS_PER_PAGE;
    const endIndex = startIndex + GRANTS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filteredAndSortedGrants, currentPage, GRANTS_PER_PAGE]);

  // Get total number of pages for a tab
  const getTotalPages = useCallback((grants: Grant[], tabName: string) => {
    const filtered = filteredAndSortedGrants[tabName as keyof typeof filteredAndSortedGrants];
    return Math.ceil(filtered.length / GRANTS_PER_PAGE);
  }, [filteredAndSortedGrants, GRANTS_PER_PAGE]);

  // Memoize displayed grants to prevent unnecessary recalculations
  const displayedGrants = useMemo(() => ({
    recommended: getPaginatedGrants(recommendedGrants, 'recommended') as ScoredGrant[],
    saved: getPaginatedGrants(savedGrants, 'saved'),
    applied: getPaginatedGrants(appliedGrants, 'applied'),
    ignored: getPaginatedGrants(ignoredGrants, 'ignored')
  }), [getPaginatedGrants, recommendedGrants, savedGrants, appliedGrants, ignoredGrants]);

  // Memoize total pages calculation to prevent unnecessary recalculations
  const totalPages = useMemo(() => ({
    recommended: getTotalPages(recommendedGrants, 'recommended'),
    saved: getTotalPages(savedGrants, 'saved'),
    applied: getTotalPages(appliedGrants, 'applied'),
    ignored: getTotalPages(ignoredGrants, 'ignored')
  }), [getTotalPages, recommendedGrants, savedGrants, appliedGrants, ignoredGrants]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  // Update URL when active tab changes
  useEffect(() => {
    // Only update URL if user is authenticated to avoid unnecessary navigation
    if (user) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab, user]);


  // Use the share function from the hook

  // Reference to the card component's fadeAndRemoveCard function
  const cardRef = useRef<{
    fadeAndRemoveCard: () => Promise<void>;
  } | null>(null);

  // Function to handle apply button click and show confirmation popup
  const handleApplyClick = useCallback((grantId: string): Promise<void> => {
    return new Promise<void>(resolve => {
      // Find the grant in any of the lists
      const grant = recommendedGrants.find(g => g.id === grantId) ||
                   savedGrants.find(g => g.id === grantId) ||
                   appliedGrants.find(g => g.id === grantId) ||
                   ignoredGrants.find(g => g.id === grantId);

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
  }, [recommendedGrants, savedGrants, appliedGrants, ignoredGrants]);

  // Function to handle confirmation response
  const handleApplyConfirmation = async (didApply: boolean) => {
    // Hide the confirmation popup
    setShowApplyConfirmation(false);

    // If the user clicked "Yes" and we have a pending grant ID
    if (didApply && pendingGrantId) {
      // First fade out the card if we have a reference to it
      if (cardRef.current) {
        try {
          await cardRef.current.fadeAndRemoveCard();
        } catch (error) {
          console.error('Error fading card:', error);
        }
      }

      // Then update the database and local state
      await handleGrantInteraction(pendingGrantId, 'applied');
    }
    // If the user clicked "No", we don't need to do anything - the card stays in place

    // Reset the pending grant ID and title
    setPendingGrantId(null);
    setPendingGrantTitle('');
  };

  // Function is maintained but simplified for compatibility
  const handleConfirmApply = async (grantId: string): Promise<void> => {
    // This function is now just a placeholder for compatibility
    // The actual functionality is handled in handleApplyConfirmation
  };

  // Use the handleGrantInteraction function from the hook
  const handleGrantInteraction = async (grantId: string, action: 'saved' | 'applied' | 'ignored') => {
    // Find the grant in any of the lists to get its data
    const grant = recommendedGrants.find(g => g.id === grantId) ||
        savedGrants.find(g => g.id === grantId) ||
        appliedGrants.find(g => g.id === grantId) ||
        ignoredGrants.find(g => g.id === grantId);
    
    if (!grant) {
      console.warn(`Grant ${grantId} not found in local state for interaction.`);
      return; // Grant not found locally
    }

    try {
      if (action === 'saved') {
        await handleSaveGrant(grantId);
      } else if (action === 'applied') {
        await handleApplyGrant(grantId);
      } else if (action === 'ignored') {
        await handleIgnoreGrant(grantId);
      }
      
      // After successful interaction, refresh the dashboard data
      await refetch();
    } catch (error: any) {
      console.error(`Error handling ${action} interaction:`, error);
      setError(`Failed to ${action.replace('ed', '')} grant: ${error.message || 'Please try again.'}`);
    }
  };


  // Show loading state while checking authentication or loading data
  if (isLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="md:w-64 md:pr-8 mb-6 md:mb-0">
          <h1 className="text-2xl font-bold mb-4">Your Dashboard</h1>
          <p className="text-gray-600 mb-6">Welcome, {user.email}</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="space-y-1 p-2">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'recommended'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {/* Display target count or actual count? Using actual for now */}
                <span>Recommended ({recommendedGrants.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'saved'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Saved ({savedGrants.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('applied')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'applied'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Applied ({appliedGrants.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('ignored')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'ignored'
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Ignored ({ignoredGrants.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1">
          {/* Consolidated Filter Panel */}
          <CollapsibleFilterPanel
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOptions={sortOptions}
            filterOnlyNoDeadline={filterOnlyNoDeadline}
            setFilterOnlyNoDeadline={setFilterOnlyNoDeadline}
            filterOnlyNoFunding={filterOnlyNoFunding}
            setFilterOnlyNoFunding={setFilterOnlyNoFunding}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {/* Tab Content */}
          {activeTab === 'recommended' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-bold mb-4">Recommended Grants</h2>
              {filteredAndSortedGrants.recommended.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {displayedGrants.recommended.map((grant) => {
                      // Cast the grant to ScoredGrant to fix TypeScript error
                      const scoredGrant = grant as ScoredGrant;
                      return (
                        <DashboardGrantCard
                          ref={scoredGrant.id === pendingGrantId ? cardRef : undefined}
                          key={scoredGrant.id}
                          id={scoredGrant.id}
                          title={scoredGrant.title}
                          agency={scoredGrant.agency_name}
                          closeDate={scoredGrant.close_date}
                          fundingAmount={scoredGrant.award_ceiling}
                          description={scoredGrant.description_short}
                          categories={scoredGrant.activity_category || []}
                          onSave={() => handleGrantInteraction(scoredGrant.id, 'saved')}
                          onApply={() => handleApplyClick(scoredGrant.id)} // Shows confirmation first
                          onIgnore={() => handleGrantInteraction(scoredGrant.id, 'ignored')}
                          onShare={() => handleShareGrant(scoredGrant.id)}
                          matchScore={scoredGrant.matchScore}
                          showMatchScore={true}
                          linkParams={`?from=dashboard&tab=recommended`}
                        />
                      );
                    }
                    )}
                  </div>

                  {/* Pagination */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage.recommended}
                      totalPages={totalPages.recommended}
                      onPageChange={(page) => handlePageChange('recommended', page)}
                    />
                  </div>
                </>
              ) : searchTerm ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matching grants</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-primary-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recommended grants yet</h3>
                  <p className="text-gray-600 mb-4">Check back later for personalized recommendations</p>
                  <Link
                    href="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Browse Grants
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-bold mb-4">Saved Grants</h2>
              {filteredAndSortedGrants.saved.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {displayedGrants.saved.map((grant) => (
                      <DashboardGrantCard
                        ref={grant.id === pendingGrantId ? cardRef : undefined}
                        key={grant.id}
                        id={grant.id}
                        title={grant.title}
                        agency={grant.agency_name}
                        closeDate={grant.close_date}
                        fundingAmount={grant.award_ceiling}
                        description={grant.description_short}
                        categories={grant.activity_category || []}
                        onSave={() => handleGrantInteraction(grant.id, 'saved')} // Allows unsaving
                        onApply={() => handleApplyClick(grant.id)}
                        onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                        onShare={() => handleShareGrant(grant.id)}
                        isSaved={true}
                        linkParams={`?from=dashboard&tab=saved`}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage.saved}
                      totalPages={totalPages.saved}
                      onPageChange={(page) => handlePageChange('saved', page)}
                    />
                  </div>
                </>
              ) : searchTerm ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matching saved grants</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-primary-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved grants yet</h3>
                  <p className="text-gray-600 mb-4">Grants you save will appear here</p>
                  <Link
                    href="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Browse Grants
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'applied' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-bold mb-4">Applied Grants</h2>
              {filteredAndSortedGrants.applied.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {displayedGrants.applied.map((grant) => (
                      <DashboardGrantCard
                        key={grant.id}
                        id={grant.id}
                        title={grant.title}
                        agency={grant.agency_name}
                        closeDate={grant.close_date}
                        fundingAmount={grant.award_ceiling}
                        description={grant.description_short}
                        categories={grant.activity_category || []}
                        onApply={() => handleGrantInteraction(grant.id, 'applied')} // Allows un-applying
                        onIgnore={() => handleGrantInteraction(grant.id, 'ignored')} // Allows ignoring
                        onSave={() => handleGrantInteraction(grant.id, 'saved')} // Allows saving
                        onShare={() => handleShareGrant(grant.id)}
                        isApplied={true}
                        linkParams={`?from=dashboard&tab=applied`}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage.applied}
                      totalPages={totalPages.applied}
                      onPageChange={(page) => handlePageChange('applied', page)}
                    />
                  </div>
                </>
              ) : searchTerm ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matching applied grants</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-primary-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applied grants yet</h3>
                  <p className="text-gray-600 mb-4">Grants you've applied for will appear here</p>
                  <Link
                    href="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Browse Grants
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ignored' && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-bold mb-4">Ignored Grants</h2>
              {filteredAndSortedGrants.ignored.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {displayedGrants.ignored.map((grant) => (
                      <DashboardGrantCard
                        ref={grant.id === pendingGrantId ? cardRef : undefined}
                        key={grant.id}
                        id={grant.id}
                        title={grant.title}
                        agency={grant.agency_name}
                        closeDate={grant.close_date}
                        fundingAmount={grant.award_ceiling}
                        description={grant.description_short}
                        categories={grant.activity_category || []}
                        onSave={() => handleGrantInteraction(grant.id, 'saved')}
                        onApply={() => handleApplyClick(grant.id)}
                        onIgnore={() => handleGrantInteraction(grant.id, 'ignored')} // Allows un-ignoring
                        onShare={() => handleShareGrant(grant.id)}
                        isIgnored={true}
                        linkParams={`?from=dashboard&tab=ignored`}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage.ignored}
                      totalPages={totalPages.ignored}
                      onPageChange={(page) => handlePageChange('ignored', page)}
                    />
                  </div>
                </>
              ) : searchTerm ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matching ignored grants</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <svg className="w-16 h-16 text-primary-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No ignored grants yet</h3>
                  <p className="text-gray-600 mb-4">Grants you choose to ignore will appear here</p>
                  <Link
                    href="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Browse Grants
                  </Link>
                </div>
              )}
            </div>
          )}
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
    </div>
  </Layout>
  );
}
