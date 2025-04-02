"use client";

import React, { useEffect, useState, useRef } from 'react';
import ApplyConfirmationPopup from '@/components/ApplyConfirmationPopup';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import GrantCard from '@/components/GrantCard';
import DashboardGrantCard from '@/components/dashboard/DashboardGrantCard';
import supabase from '@/lib/supabaseClient';
import DashboardSearchBar from '@/components/dashboard/DashboardSearchBar';
import DashboardSortAndFilterControls from '@/components/dashboard/DashboardSortAndFilterControls';
import Pagination from '@/components/dashboard/Pagination';
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
  
  // Pagination state for each tab
  const [currentPage, setCurrentPage] = useState({
    recommended: 1,
    saved: 1,
    applied: 1,
    ignored: 1
  });
  
  // Number of grants to display per page
  const GRANTS_PER_PAGE = 10;
  
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
    const filteredAndSortedGrants = filterAndSortGrants(grants);
    const startIndex = (currentPage[tabName as keyof typeof currentPage] - 1) * GRANTS_PER_PAGE;
    const endIndex = startIndex + GRANTS_PER_PAGE;
    return filteredAndSortedGrants.slice(startIndex, endIndex);
  };
  
  // Get total number of pages for a tab
  const getTotalPages = (grants: Grant[]) => {
    return Math.ceil(filterAndSortGrants(grants).length / GRANTS_PER_PAGE);
  };
  
  // Handle page change
  const handlePageChange = (tabName: string, newPage: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [tabName]: newPage
    }));
  };
  
  const displayedGrants = {
    recommended: getPaginatedGrants(recommendedGrants, 'recommended'),
    saved: getPaginatedGrants(savedGrants, 'saved'),
    applied: getPaginatedGrants(appliedGrants, 'applied'),
    ignored: getPaginatedGrants(ignoredGrants, 'ignored')
  };
  
  const totalPages = {
    recommended: getTotalPages(recommendedGrants),
    saved: getTotalPages(savedGrants),
    applied: getTotalPages(appliedGrants),
    ignored: getTotalPages(ignoredGrants)
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch user's grants based on interactions
  useEffect(() => {
    const fetchUserGrants = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get current date for filtering expired grants
        const today = new Date().toISOString();
        
        // Fetch all user interactions with grants
        // We'll use separate queries for each action type to ensure we get the correct data
        // This is more reliable than trying to process everything in memory
        
        // Fetch saved grants
        const { data: savedInteractions, error: savedError } = await supabase
          .from('user_interactions')
          .select('*, grants(*)')
          .eq('user_id', user.id)
          .eq('action', 'saved');
        
        // Only log real errors, not empty objects which often occur when no grants are found
        if (savedError) {
          if (Object.keys(savedError).length > 0) {
            console.error('Error fetching saved grants:', savedError);
            // Don't throw the error, just log it
            console.log('Continuing despite saved grants error');
          } else {
            // Just log a debug message for empty error objects
            console.log('No saved grants found or empty error object');
          }
        }
        
        // Fetch applied grants
        const { data: appliedInteractions, error: appliedError } = await supabase
          .from('user_interactions')
          .select('*, grants(*)')
          .eq('user_id', user.id)
          .eq('action', 'applied');
        
        // Only log real errors, not empty objects which often occur when no grants are found
        if (appliedError) {
          if (Object.keys(appliedError).length > 0) {
            console.error('Error fetching applied grants:', appliedError);
            // Don't throw the error, just log it
            console.log('Continuing despite applied grants error');
          } else {
            // Just log a debug message for empty error objects
            console.log('No applied grants found or empty error object');
          }
        }
        
        // Fetch ignored grants
        const { data: ignoredInteractions, error: ignoredError } = await supabase
          .from('user_interactions')
          .select('*, grants(*)')
          .eq('user_id', user.id)
          .eq('action', 'ignored');
        
        // Only log real errors, not empty objects which often occur when no grants are found
        if (ignoredError) {
          if (Object.keys(ignoredError).length > 0) {
            console.error('Error fetching ignored grants:', ignoredError);
            // Don't throw the error, just log it
            console.log('Continuing despite ignored grants error');
          } else {
            // Just log a debug message for empty error objects
            console.log('No ignored grants found or empty error object');
          }
        }
        
        // Get all unique grant IDs that the user has interacted with
        const interactedGrantIds: string[] = [];
        const processedGrantIds = new Set<string>();
        
        // Process interactions to ensure each grant only appears in its most recent category
        // We'll use a timestamp-based approach to determine the most recent action
        
        // First, get all interactions and sort them by timestamp (newest first)
        const allInteractions = [
          ...(savedInteractions || []),
          ...(appliedInteractions || []),
          ...(ignoredInteractions || [])
        ].sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        
        // Then filter to keep only the most recent interaction for each grant
        const uniqueInteractions = allInteractions.filter(interaction => {
          if (!processedGrantIds.has(interaction.grant_id)) {
            processedGrantIds.add(interaction.grant_id);
            interactedGrantIds.push(interaction.grant_id);
            return true;
          }
          return false;
        });
        
        // Now separate by action type
        const filteredSavedInteractions: UserInteraction[] = uniqueInteractions.filter(
          interaction => interaction.action === 'saved'
        );
        
        const filteredAppliedInteractions: UserInteraction[] = uniqueInteractions.filter(
          interaction => interaction.action === 'applied'
        );
        
        const filteredIgnoredInteractions: UserInteraction[] = uniqueInteractions.filter(
          interaction => interaction.action === 'ignored'
        );
        
        // We've already separated interactions by action type above
        
        // Fetch recommended grants based on user preferences
        let recommendedData = [];
        
        try {
          // First, fetch user preferences
          const { data: userPreferences, error: preferencesError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (preferencesError && preferencesError.code !== 'PGRST116') {
            console.log('Error fetching user preferences:', preferencesError);
          }
          
          // Build query based on preferences
          let query = supabase
            .from('grants')
            .select('*')
            .or(`close_date.gt.${today},close_date.is.null`); // Only active grants
          
          // Always exclude grants the user has already interacted with
          if (interactedGrantIds.length > 0) {
            query = query.not('id', 'in', `(${interactedGrantIds.join(',')})`);
          }
          
          // Apply topic preferences if available
          if (userPreferences?.topics && userPreferences.topics.length > 0) {
            // Use overlap operator to find grants with matching topics
            query = query.overlaps('activity_category', userPreferences.topics);
          }
          
          // Apply funding range preferences if available
          if (userPreferences?.funding_min !== undefined && userPreferences.funding_min > 0) {
            query = query.gte('award_ceiling', userPreferences.funding_min);
          }
          
          if (userPreferences?.funding_max !== undefined && userPreferences.funding_max < 1000000000) {
            query = query.lte('award_ceiling', userPreferences.funding_max);
          }
          
          // Apply agency preferences if available
          if (userPreferences?.agencies && userPreferences.agencies.length > 0) {
            query = query.in('agency_name', userPreferences.agencies);
          }
          
          // Apply eligible applicant types if available
          if (userPreferences?.eligible_applicant_types && userPreferences.eligible_applicant_types.length > 0) {
            // This would require a more complex query depending on how eligible_applicant_types is stored
            // For now, we'll assume it's a simple match
            // query = query.overlaps('eligible_applicant_types', userPreferences.eligible_applicant_types);
          }
          
          // Limit results
          query = query.limit(10);
          
          const { data, error } = await query;
          
          if (error) {
            console.log('Note: Could not fetch recommended grants, using empty array', error);
          } else {
            recommendedData = data || [];
            
            // If we don't have enough grants based on preferences, fetch more without preference filters
            if (recommendedData.length < 5) {
              console.log('Not enough grants based on preferences, fetching more');
              
              let backupQuery = supabase
                .from('grants')
                .select('*')
                .or(`close_date.gt.${today},close_date.is.null`); // Only active grants
              
              if (interactedGrantIds.length > 0) {
                backupQuery = backupQuery.not('id', 'in', `(${interactedGrantIds.join(',')})`);
              }
              
              // Exclude grants we already have
              if (recommendedData.length > 0) {
                const existingIds = recommendedData.map(g => g.id);
                backupQuery = backupQuery.not('id', 'in', `(${existingIds.join(',')})`);
              }
              
              backupQuery = backupQuery.limit(10 - recommendedData.length);
              
              const { data: backupData, error: backupError } = await backupQuery;
              
              if (!backupError && backupData) {
                recommendedData = [...recommendedData, ...backupData];
              }
            }
          }
        } catch (e) {
          console.log('Exception fetching recommended grants, using empty array', e);
        }
        
        // Filter out expired grants from interactions
        const filterActiveGrants = (interaction: UserInteraction) => {
          const grant = interaction.grants;
          if (!grant.close_date) return true;
          return new Date(grant.close_date) >= new Date();
        };
        
        // Apply active grants filter to saved and ignored interactions
        // We don't filter applied grants (keep all regardless of expiry)
        const activeSavedInteractions = filteredSavedInteractions.filter(filterActiveGrants);
        const activeIgnoredInteractions = filteredIgnoredInteractions.filter(filterActiveGrants);
        
        // Set the grants in state
        setSavedGrants(activeSavedInteractions.map(interaction => interaction.grants));
        setAppliedGrants(filteredAppliedInteractions.map(interaction => interaction.grants));
        setIgnoredGrants(activeIgnoredInteractions.map(interaction => interaction.grants));
        setRecommendedGrants(recommendedData);
      } catch (error: any) {
        // Check if this is a real error that should be displayed to the user
        // For new users with no grants, we don't want to show an error
        if (error &&
            Object.keys(error).length > 0 &&
            error.code !== 'PGRST116' && // This is the Postgrest error for "no rows returned"
            error.message !== 'No grants found') {
          console.error('Error fetching user grants:', error);
          setError('Failed to load your grants. Please try again later.');
        } else {
          // If it's an empty error object or a "no data" error, it's likely just that the user has no grants
          // Don't show an error message in this case
          console.log('No grants found or empty error object');
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserGrants();
  }, [user]);

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
      
      // Then update the database
      await handleGrantInteraction(pendingGrantId, 'applied', true); // true = remove from recommended
    }
    // If the user clicked "No", we don't need to do anything - the card stays in place
    
    // Reset the pending grant ID and title
    setPendingGrantId(null);
    setPendingGrantTitle('');
  };
  
  // Function to be called after the card has faded out
  const handleConfirmApply = async (grantId: string): Promise<void> => {
    // This function will be called after the card has faded out
    // The database update is already handled in handleApplyConfirmation
  };

  // Handle grant interaction (save, apply, ignore)
  const handleGrantInteraction = async (grantId: string, action: 'saved' | 'applied' | 'ignored', removeFromRecommended: boolean = true) => {
    if (!user) return;
    
    try {
      // Find the grant in any of the lists
      const grant = recommendedGrants.find(g => g.id === grantId) ||
                   savedGrants.find(g => g.id === grantId) ||
                   appliedGrants.find(g => g.id === grantId) ||
                   ignoredGrants.find(g => g.id === grantId);

      if (!grant) return;

      // Check if the grant already has this status
      const isCurrentStatus = (
        (action === 'saved' && savedGrants.some(g => g.id === grantId)) ||
        (action === 'applied' && appliedGrants.some(g => g.id === grantId)) ||
        (action === 'ignored' && ignoredGrants.some(g => g.id === grantId))
      );

      if (isCurrentStatus) {
        // Remove the interaction if clicking the same status
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('grant_id', grantId)
          .eq('action', action);

        // Update local state to remove the grant from its current list
        if (action === 'saved') {
          setSavedGrants(savedGrants.filter(g => g.id !== grantId));
        } else if (action === 'applied') {
          setAppliedGrants(appliedGrants.filter(g => g.id !== grantId));
        } else if (action === 'ignored') {
          setIgnoredGrants(ignoredGrants.filter(g => g.id !== grantId));
        }

        // Add the grant back to recommended if it was removed
        // First check if it's already in any other list to avoid duplicates
        const isInAnyList =
          savedGrants.some(g => g.id === grantId) ||
          appliedGrants.some(g => g.id === grantId) ||
          ignoredGrants.some(g => g.id === grantId) ||
          recommendedGrants.some(g => g.id === grantId);
          
        if (!isInAnyList) {
          setRecommendedGrants(prev => [...prev, grant]);
        }
      } else {
        // First delete any existing interactions
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('grant_id', grantId);

        // Then insert the new interaction
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            grant_id: grantId,
            action,
            timestamp: new Date().toISOString()
          });
        
        if (error) throw error;

        // First, remove from all lists to avoid duplicates
        setRecommendedGrants(prev => prev.filter(g => g.id !== grantId));
        setSavedGrants(prev => prev.filter(g => g.id !== grantId));
        setAppliedGrants(prev => prev.filter(g => g.id !== grantId));
        setIgnoredGrants(prev => prev.filter(g => g.id !== grantId));

        // Then add to the appropriate list
        if (action === 'saved') {
          setSavedGrants(prev => [...prev, grant]);
        } else if (action === 'applied') {
          setAppliedGrants(prev => [...prev, grant]);
        } else if (action === 'ignored') {
          setIgnoredGrants(prev => [...prev, grant]);
        }

        // If we removed from recommended, try to fetch a new one
        if (removeFromRecommended) {
          // Fetch one more grant to replace the one that was removed from recommended
          try {
            // Get current date for filtering expired grants
            const today = new Date().toISOString();
            
            // Get all current grant IDs to exclude
            const allCurrentGrantIds = [
              ...recommendedGrants.map(g => g.id),
              ...savedGrants.map(g => g.id),
              ...appliedGrants.map(g => g.id),
              ...ignoredGrants.map(g => g.id)
            ];
            
            // Only fetch if we have grants to exclude
            if (allCurrentGrantIds.length > 0) {
              // Fetch a new grant that isn't in any current list
              const { data: newGrants } = await supabase
                .from('grants')
                .select('*')
                .not('id', 'in', `(${allCurrentGrantIds.join(',')})`)
                .or(`close_date.gt.${today},close_date.is.null`) // Only active grants
                .limit(1);
              
              if (newGrants && newGrants.length > 0) {
                // Add the new grant to the recommended list
                setRecommendedGrants(prev => [...prev, ...newGrants]);
              }
            }
          } catch (e) {
            console.log('Error fetching replacement grant:', e);
          }
        }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user.email}</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {/* Dashboard Navigation - Enhanced with counts and icons */}
      <div className="mb-8">
        <nav className="flex flex-wrap gap-2 sm:gap-0 bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex items-center px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'recommended'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Recommended</span>
            <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {recommendedGrants.length}
            </span>
            {activeTab === 'recommended' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'saved'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Saved</span>
            <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {savedGrants.length}
            </span>
            {activeTab === 'saved' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('applied')}
            className={`flex items-center px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'applied'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Applied</span>
            <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {appliedGrants.length}
            </span>
            {activeTab === 'applied' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('ignored')}
            className={`flex items-center px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'ignored'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Ignored</span>
            <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {ignoredGrants.length}
            </span>
            {activeTab === 'ignored' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>
            )}
          </button>
        </nav>
      </div>
      
      {/* Recommended Grants Section */}
      {activeTab === 'recommended' && (
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                <p className="text-gray-600 mt-1">Personalized grant recommendations based on your preferences</p>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                <span>Browse All Grants</span>
                <svg className="ml-1 w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <DashboardSearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Search recommended grants..."
              />
              <DashboardSortAndFilterControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOptions={sortOptions}
                filterOnlyNoDeadline={filterOnlyNoDeadline}
                setFilterOnlyNoDeadline={setFilterOnlyNoDeadline}
                filterOnlyNoFunding={filterOnlyNoFunding}
                setFilterOnlyNoFunding={setFilterOnlyNoFunding}
              />
            </div>
          </div>
          
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
                    onApply={() => handleApplyClick(grant.id)}
                    onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                    onShare={() => handleShare(grant.id)}
                    isSaved={false}
                    isApplied={false}
                    isIgnored={false}
                    onConfirmApply={() => handleConfirmApply(grant.id)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage.recommended}
                totalPages={totalPages.recommended}
                onPageChange={(page) => handlePageChange('recommended', page)}
              />
            </>
          ) : searchTerm ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching grants found</h3>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommended grants yet</h3>
              <p className="text-gray-600 mb-4">Update your preferences to get personalized recommendations</p>
              <Link
                href="/preferences"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Update Preferences
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Saved Grants Section */}
      {activeTab === 'saved' && (
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Saved Grants</h2>
                <p className="text-gray-600 mt-1">Grants you've saved for later review</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <DashboardSearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Search saved grants..."
              />
              <DashboardSortAndFilterControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOptions={sortOptions}
                filterOnlyNoDeadline={filterOnlyNoDeadline}
                setFilterOnlyNoDeadline={setFilterOnlyNoDeadline}
                filterOnlyNoFunding={filterOnlyNoFunding}
                setFilterOnlyNoFunding={setFilterOnlyNoFunding}
              />
            </div>
          </div>
          
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
                    onSave={() => handleGrantInteraction(grant.id, 'saved')}
                    onApply={() => handleApplyClick(grant.id)}
                    onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                    onShare={() => handleShare(grant.id)}
                    isSaved={true}
                    onConfirmApply={() => handleConfirmApply(grant.id)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage.saved}
                totalPages={totalPages.saved}
                onPageChange={(page) => handlePageChange('saved', page)}
              />
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
              <p className="text-gray-600 mb-4">Save grants you're interested in to review later</p>
              <Link
                href="/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Browse Grants
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Applied Grants Section */}
      {activeTab === 'applied' && (
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Applied Grants</h2>
                <p className="text-gray-600 mt-1">Grants you've applied for</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <DashboardSearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Search applied grants..."
              />
              <DashboardSortAndFilterControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOptions={sortOptions}
                filterOnlyNoDeadline={filterOnlyNoDeadline}
                setFilterOnlyNoDeadline={setFilterOnlyNoDeadline}
                filterOnlyNoFunding={filterOnlyNoFunding}
                setFilterOnlyNoFunding={setFilterOnlyNoFunding}
              />
            </div>
          </div>
          
          {filterAndSortGrants(appliedGrants).length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                {displayedGrants.applied.map((grant) => (
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
                    onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                    onShare={() => handleShare(grant.id)}
                    isApplied={true}
                    onConfirmApply={() => handleConfirmApply(grant.id)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage.applied}
                totalPages={totalPages.applied}
                onPageChange={(page) => handlePageChange('applied', page)}
              />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applied grants yet</h3>
              <p className="text-gray-600 mb-4">When you apply for grants, they'll appear here</p>
              <Link
                href="/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Find Grants to Apply For
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Ignored Grants Section */}
      {activeTab === 'ignored' && (
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ignored Grants</h2>
                <p className="text-gray-600 mt-1">Grants you've chosen to ignore</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <DashboardSearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Search ignored grants..."
              />
              <DashboardSortAndFilterControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOptions={sortOptions}
                filterOnlyNoDeadline={filterOnlyNoDeadline}
                setFilterOnlyNoDeadline={setFilterOnlyNoDeadline}
                filterOnlyNoFunding={filterOnlyNoFunding}
                setFilterOnlyNoFunding={setFilterOnlyNoFunding}
              />
            </div>
          </div>
          
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
                    onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                    onShare={() => handleShare(grant.id)}
                    isIgnored={true}
                    onConfirmApply={() => handleConfirmApply(grant.id)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage.ignored}
                totalPages={totalPages.ignored}
                onPageChange={(page) => handlePageChange('ignored', page)}
              />
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
        </section>
      )}
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
