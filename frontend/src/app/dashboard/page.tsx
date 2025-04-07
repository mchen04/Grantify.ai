"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ApplyConfirmationPopup from '@/components/ApplyConfirmationPopup';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import GrantCard from '@/components/GrantCard';
import DashboardGrantCard from '@/components/dashboard/DashboardGrantCard';
import supabase from '@/lib/supabaseClient';
import { DASHBOARD_GRANTS_PER_PAGE } from '@/utils/constants';
import Pagination from '@/components/dashboard/Pagination';
import CollapsibleFilterPanel from '@/components/dashboard/CollapsibleFilterPanel';
import { SelectOption } from '@/types/grant';

// Grant type definition
interface Grant {
  id: string;
  title: string;
  agency_name: string;
  close_date: string | null;
  award_ceiling: number | null;
  description: string;
  activity_category: string[];
}

// User interaction type
interface UserInteraction {
  id: string;
  user_id: string;
  grant_id: string;
  action: 'saved' | 'applied' | 'ignored';
  timestamp: string;
  grants: Grant;
}

const TARGET_RECOMMENDED_COUNT = 10; // Target number of recommended grants

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('recommended');
  const [loading, setLoading] = useState(false);
  const [recommendedGrants, setRecommendedGrants] = useState<Grant[]>([]);
  const [savedGrants, setSavedGrants] = useState<Grant[]>([]);
  const [appliedGrants, setAppliedGrants] = useState<Grant[]>([]);
  const [ignoredGrants, setIgnoredGrants] = useState<Grant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const [pendingGrantId, setPendingGrantId] = useState<string | null>(null);
  const [pendingGrantTitle, setPendingGrantTitle] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('deadline');
  const [filterOnlyNoDeadline, setFilterOnlyNoDeadline] = useState(false);
  const [filterOnlyNoFunding, setFilterOnlyNoFunding] = useState(false);
  const [isFetchingReplacements, setIsFetchingReplacements] = useState(false); // Prevent concurrent fetches

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
  const filterAndSortGrants = (grants: Grant[]) => {
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
      // NOTE: This behavior is different from the search page, where turning off the filter
      // simply means "don't apply this filter". In the dashboard context, we actively filter out
      // open-ended deadlines when the filter is off to provide a cleaner view of grants with
      // specific deadlines by default.
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
        grant.description.toLowerCase().includes(term) ||
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
  };

  // Get paginated grants for the current tab
  const getPaginatedGrants = (grants: Grant[], tabName: string) => {
    const filtered = filteredAndSortedGrants[tabName as keyof typeof filteredAndSortedGrants];
    const startIndex = (currentPage[tabName as keyof typeof currentPage] - 1) * GRANTS_PER_PAGE;
    const endIndex = startIndex + GRANTS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  // Get total number of pages for a tab
  const getTotalPages = (grants: Grant[], tabName: string) => {
    const filtered = filteredAndSortedGrants[tabName as keyof typeof filteredAndSortedGrants];
    return Math.ceil(filtered.length / GRANTS_PER_PAGE);
  };

  // Handle page change
  const handlePageChange = (tabName: string, newPage: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [tabName]: newPage
    }));
  };

  // Memoize filtered and sorted grants to prevent unnecessary recalculations
  const filteredAndSortedGrants = useMemo(() => {
    return {
      recommended: filterAndSortGrants(recommendedGrants),
      saved: filterAndSortGrants(savedGrants),
      applied: filterAndSortGrants(appliedGrants),
      ignored: filterAndSortGrants(ignoredGrants)
    };
  }, [recommendedGrants, savedGrants, appliedGrants, ignoredGrants,
      sortBy, filterOnlyNoDeadline, filterOnlyNoFunding, searchTerm]);

  const displayedGrants = {
    recommended: getPaginatedGrants(recommendedGrants, 'recommended'),
    saved: getPaginatedGrants(savedGrants, 'saved'),
    applied: getPaginatedGrants(appliedGrants, 'applied'),
    ignored: getPaginatedGrants(ignoredGrants, 'ignored')
  };

  const totalPages = {
    recommended: getTotalPages(recommendedGrants, 'recommended'),
    saved: getTotalPages(savedGrants, 'saved'),
    applied: getTotalPages(appliedGrants, 'applied'),
    ignored: getTotalPages(ignoredGrants, 'ignored')
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch initial user grants and recommended grants
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Get current date for filtering expired grants
        const today = new Date().toISOString();

        // Fetch all user interactions
        const { data: allInteractionsData, error: interactionsError } = await supabase
          .from('user_interactions')
          .select('*, grants(*)')
          .eq('user_id', user.id);

        if (interactionsError && Object.keys(interactionsError).length > 0) {
          console.error('Error fetching user interactions:', interactionsError);
          // Don't throw, try to continue
        }

        const allInteractions = allInteractionsData || [];

        // Process interactions to find the latest action for each grant
        const latestInteractionsMap = new Map<string, UserInteraction>();
        allInteractions.forEach(interaction => {
          const existing = latestInteractionsMap.get(interaction.grant_id);
          if (!existing || new Date(interaction.timestamp) > new Date(existing.timestamp)) {
            latestInteractionsMap.set(interaction.grant_id, interaction);
          }
        });

        const latestInteractions = Array.from(latestInteractionsMap.values());
        const interactedGrantIds = Array.from(latestInteractionsMap.keys());

        // Separate grants into lists based on the latest action
        const initialSaved: Grant[] = [];
        const initialApplied: Grant[] = [];
        const initialIgnored: Grant[] = [];

        const filterActiveGrants = (interaction: UserInteraction) => {
          const grant = interaction.grants;
          if (!grant) return false; // Skip if grant data is missing
          if (!grant.close_date) return true; // Keep if no close date
          return new Date(grant.close_date) >= new Date(); // Keep if not expired
        };

        latestInteractions.forEach(interaction => {
          if (!interaction.grants) return; // Skip if grant data is missing

          if (interaction.action === 'saved' && filterActiveGrants(interaction)) {
            initialSaved.push(interaction.grants);
          } else if (interaction.action === 'applied') { // Keep applied regardless of expiry
            initialApplied.push(interaction.grants);
          } else if (interaction.action === 'ignored' && filterActiveGrants(interaction)) {
            initialIgnored.push(interaction.grants);
          }
        });

        setSavedGrants(initialSaved);
        setAppliedGrants(initialApplied);
        setIgnoredGrants(initialIgnored);

        // Fetch initial recommended grants
        let recommendedQuery = supabase
          .from('grants')
          .select('*')
          .or(`close_date.gt.${today},close_date.is.null`); // Only active grants

        if (interactedGrantIds.length > 0) {
          recommendedQuery = recommendedQuery.not('id', 'in', `(${interactedGrantIds.join(',')})`);
        }

        // --- Add preference filtering here if needed ---
        // Example:
        // const { data: userPreferences } = await supabase...
        // if (userPreferences?.topics) { recommendedQuery = recommendedQuery.overlaps(...) }
        // ---

        recommendedQuery = recommendedQuery.limit(TARGET_RECOMMENDED_COUNT); // Fetch up to the target count

        const { data: initialRecommended, error: recommendedError } = await recommendedQuery;

        if (recommendedError) {
          console.error('Error fetching initial recommended grants:', recommendedError);
          setRecommendedGrants([]);
        } else {
          setRecommendedGrants(initialRecommended || []);
        }

      } catch (error: any) {
         if (error && Object.keys(error).length > 0 && error.code !== 'PGRST116' && error.message !== 'No grants found') {
           console.error('Error fetching initial data:', error);
           setError('Failed to load your grants. Please try again later.');
         } else {
           console.log('No grants found or expected empty result.');
           setError(null);
         }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]); // Only run on user change

  // Effect to fetch replacement recommended grants when needed
  useEffect(() => {
    const fetchReplacementGrantsIfNeeded = async () => {
      if (!user || isFetchingReplacements) return; // Exit if no user or already fetching

      const currentRecommendedCount = recommendedGrants.length;
      const neededCount = TARGET_RECOMMENDED_COUNT - currentRecommendedCount;

      if (neededCount <= 0) {
        return; // Already have enough or too many
      }

      setIsFetchingReplacements(true); // Set flag to prevent concurrent fetches

      try {
        // Get IDs of ALL grants currently displayed in any list
        const allCurrentGrantIds = [
          ...recommendedGrants.map(g => g.id),
          ...savedGrants.map(g => g.id),
          ...appliedGrants.map(g => g.id),
          ...ignoredGrants.map(g => g.id)
        ];

        const today = new Date().toISOString();

        let query = supabase
          .from('grants')
          .select('*')
          .or(`close_date.gt.${today},close_date.is.null`); // Active grants only

        if (allCurrentGrantIds.length > 0) {
          query = query.not('id', 'in', `(${allCurrentGrantIds.join(',')})`); // Exclude current grants
        }

        // --- Add preference filtering here if needed ---

        query = query.limit(neededCount); // Fetch exactly the number needed

        const { data: newGrants, error } = await query;

        if (error) {
          console.error('Error fetching replacement grants:', error);
        } else if (newGrants && newGrants.length > 0) {
          setRecommendedGrants(prev => [...prev, ...newGrants]); // Add new grants
        }
      } catch (e) {
        console.error('Exception fetching replacement grants:', e);
      } finally {
         setIsFetchingReplacements(false); // Reset flag
      }
    };

    // Debounce or delay the fetch slightly to avoid rapid firing during initial load or quick actions
    const timerId = setTimeout(() => {
        fetchReplacementGrantsIfNeeded();
    }, 500); // Adjust delay as needed

    return () => clearTimeout(timerId); // Cleanup timer on unmount or dependency change

  }, [user, recommendedGrants, savedGrants, appliedGrants, ignoredGrants, isFetchingReplacements]); // Dependencies


  // Handle grant sharing
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

  // Reference to the card component's fadeAndRemoveCard function
  const cardRef = useRef<{
    fadeAndRemoveCard: () => Promise<void>;
  } | null>(null);

  // Function to handle apply button click and show confirmation popup
  const handleApplyClick = (grantId: string): Promise<void> => {
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
  };

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

  // Function to be called after the card has faded out (now redundant as update happens in handleApplyConfirmation)
  const handleConfirmApply = async (grantId: string): Promise<void> => {
      // This function is no longer strictly necessary as the state update
      // is handled immediately in handleApplyConfirmation after the fade attempt.
  };


  // Handle grant interaction (save, apply, ignore) - Refactored
  const handleGrantInteraction = async (grantId: string, action: 'saved' | 'applied' | 'ignored') => {
    if (!user) return;

    try {
      // Find the grant in any of the lists to get its data
      // Use useCallback or memoization if performance becomes an issue here
      const findGrant = () =>
          recommendedGrants.find(g => g.id === grantId) ||
          savedGrants.find(g => g.id === grantId) ||
          appliedGrants.find(g => g.id === grantId) ||
          ignoredGrants.find(g => g.id === grantId);

      const grant = findGrant();
      if (!grant) {
          console.warn(`Grant ${grantId} not found in local state for interaction.`);
          return; // Grant not found locally, maybe already processed?
      }

      // Determine if the grant was in the recommended list *before* this interaction
      const wasRecommended = recommendedGrants.some(g => g.id === grantId);

      // Check if the user is trying to set the *same* status the grant already has
      // (e.g., clicking 'Save' on an already saved grant)
      const isCurrentStatus =
        (action === 'saved' && savedGrants.some(g => g.id === grantId)) ||
        (action === 'applied' && appliedGrants.some(g => g.id === grantId)) ||
        (action === 'ignored' && ignoredGrants.some(g => g.id === grantId));

      if (isCurrentStatus) {
        // --- Undoing an action ---
        // Delete the interaction from the database
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('grant_id', grantId)
          .eq('action', action); // Delete the specific action row

        // Update local state: Remove the grant from its current list
        if (action === 'saved') {
          setSavedGrants(prev => prev.filter(g => g.id !== grantId));
        } else if (action === 'applied') {
          setAppliedGrants(prev => prev.filter(g => g.id !== grantId));
        } else if (action === 'ignored') {
          setIgnoredGrants(prev => prev.filter(g => g.id !== grantId));
        }
        // NOTE: We DO NOT add it back to recommended here.
        // The useEffect hook will handle fetching replacements if needed.

      } else {
        // --- Setting a new action or changing an action ---
        // First, delete any *other* interactions for this grant to ensure only one state exists
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('grant_id', grantId)
          .not('action', 'eq', action); // Delete rows where action is NOT the target action

        // Then, upsert the target interaction.
        const { error: upsertError } = await supabase
          .from('user_interactions')
          .upsert({
            user_id: user.id,
            grant_id: grantId,
            action: action,
            timestamp: new Date().toISOString()
          }, {
            onConflict: 'user_id, grant_id, action' // Specify the constraint columns
          });

        if (upsertError) throw upsertError;

        // Update local state:
        // 1. Remove from *all* lists first to handle changes and ensure no duplicates
        setRecommendedGrants(prev => prev.filter(g => g.id !== grantId));
        setSavedGrants(prev => prev.filter(g => g.id !== grantId));
        setAppliedGrants(prev => prev.filter(g => g.id !== grantId));
        setIgnoredGrants(prev => prev.filter(g => g.id !== grantId));

        // 2. Add to the *new* appropriate list
        if (action === 'saved') {
          setSavedGrants(prev => [...prev, grant]);
        } else if (action === 'applied') {
          setAppliedGrants(prev => [...prev, grant]);
        } else if (action === 'ignored') {
          setIgnoredGrants(prev => [...prev, grant]);
        }
        // NOTE: The useEffect hook will handle fetching replacements if the grant was removed from recommended.
      }

    } catch (error: any) {
      console.error(`Error ${action} grant:`, error.message || error);
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
              {filterAndSortGrants(recommendedGrants).length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {displayedGrants.recommended.map((grant) => (
                      <DashboardGrantCard
                        ref={grant.id === pendingGrantId ? cardRef : undefined}
                        key={grant.id}
                        id={grant.id}
                        title={grant.title}
                        agency={grant.agency_name}
                        closeDate={grant.close_date}
                        fundingAmount={grant.award_ceiling}
                        description={grant.description}
                        categories={grant.activity_category || []}
                        onSave={() => handleGrantInteraction(grant.id, 'saved')}
                        onApply={() => handleApplyClick(grant.id)} // Shows confirmation first
                        onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                        onShare={() => handleShare(grant.id)}
                        onConfirmApply={() => handleConfirmApply(grant.id)} // Likely redundant now
                      />
                    ))}
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
              {filterAndSortGrants(savedGrants).length > 0 ? (
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
                        description={grant.description}
                        categories={grant.activity_category || []}
                        onSave={() => handleGrantInteraction(grant.id, 'saved')} // Allows unsaving
                        onApply={() => handleApplyClick(grant.id)}
                        onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                        onShare={() => handleShare(grant.id)}
                        isSaved={true}
                        onConfirmApply={() => handleConfirmApply(grant.id)}
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
              {filterAndSortGrants(appliedGrants).length > 0 ? (
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
                        description={grant.description}
                        categories={grant.activity_category || []}
                        onApply={() => handleGrantInteraction(grant.id, 'applied')} // Allows un-applying
                        onIgnore={() => handleGrantInteraction(grant.id, 'ignored')} // Allows ignoring
                        onSave={() => handleGrantInteraction(grant.id, 'saved')} // Allows saving
                        onShare={() => handleShare(grant.id)}
                        isApplied={true}
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
              {filterAndSortGrants(ignoredGrants).length > 0 ? (
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
                        description={grant.description}
                        categories={grant.activity_category || []}
                        onSave={() => handleGrantInteraction(grant.id, 'saved')}
                        onApply={() => handleApplyClick(grant.id)}
                        onIgnore={() => handleGrantInteraction(grant.id, 'ignored')} // Allows un-ignoring
                        onShare={() => handleShare(grant.id)}
                        isIgnored={true}
                        onConfirmApply={() => handleConfirmApply(grant.id)}
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

      {/* Apply Confirmation Popup */}
      <ApplyConfirmationPopup
        isOpen={showApplyConfirmation}
        grantTitle={pendingGrantTitle}
        onConfirm={() => handleApplyConfirmation(true)}
        onCancel={() => handleApplyConfirmation(false)}
      />
    </div>
  </Layout>
  );
}
