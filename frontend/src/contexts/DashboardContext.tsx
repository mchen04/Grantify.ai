import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Grant, ScoredGrant } from '@/types/grant';
import { UserPreferences } from '@/types/user';
import { useFetchDashboardData } from '@/hooks/useFetchDashboardData';
import { useGrantInteractions } from '@/hooks/useGrantInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { DASHBOARD_GRANTS_PER_PAGE } from '@/utils/constants';

// Define the shape of our dashboard state
interface DashboardState {
  activeTab: 'recommended' | 'saved' | 'applied' | 'ignored';
  searchTerm: string;
  sortBy: string;
  filterOnlyNoDeadline: boolean;
  filterOnlyNoFunding: boolean;
  currentPage: {
    recommended: number;
    saved: number;
    applied: number;
    ignored: number;
  };
}

// Define the shape of our context
interface DashboardContextType {
  // State
  state: DashboardState;
  recommendedGrants: ScoredGrant[];
  savedGrants: Grant[];
  appliedGrants: Grant[];
  ignoredGrants: Grant[];
  userPreferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  interactionLoading: boolean;
  showApplyConfirmation: boolean;
  pendingGrantId: string | null;
  pendingGrantTitle: string;
  
  // Filtered and paginated data
  filteredAndSortedGrants: {
    recommended: ScoredGrant[];
    saved: Grant[];
    applied: Grant[];
    ignored: Grant[];
  };
  displayedGrants: {
    recommended: ScoredGrant[];
    saved: Grant[];
    applied: Grant[];
    ignored: Grant[];
  };
  totalPages: {
    recommended: number;
    saved: number;
    applied: number;
    ignored: number;
  };
  
  // Actions
  setActiveTab: (tab: 'recommended' | 'saved' | 'applied' | 'ignored') => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: string) => void;
  setFilterOnlyNoDeadline: (value: boolean) => void;
  setFilterOnlyNoFunding: (value: boolean) => void;
  handlePageChange: (tabName: string, newPage: number) => void;
  handleSaveGrant: (grantId: string) => Promise<void>;
  handleApplyGrant: (grantId: string) => Promise<void>;
  handleIgnoreGrant: (grantId: string) => Promise<void>;
  handleShareGrant: (grantId: string) => Promise<void>;
  handleApplyClick: (grantId: string) => Promise<void>;
  handleApplyConfirmation: (didApply: boolean) => Promise<void>;
  refetchDashboardData: () => Promise<void>;
}

// Create the context with a default value
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider component
export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Dashboard state
  const [state, setState] = useState<DashboardState>({
    activeTab: 'recommended',
    searchTerm: '',
    sortBy: 'deadline',
    filterOnlyNoDeadline: false,
    filterOnlyNoFunding: false,
    currentPage: {
      recommended: 1,
      saved: 1,
      applied: 1,
      ignored: 1
    }
  });
  
  // Apply confirmation state
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const [pendingGrantId, setPendingGrantId] = useState<string | null>(null);
  const [pendingGrantTitle, setPendingGrantTitle] = useState<string>('');
  
  // Fetch dashboard data
  const {
    recommendedGrants,
    savedGrants,
    appliedGrants,
    ignoredGrants,
    userPreferences,
    loading,
    error,
    refetch: refetchDashboardData,
    fetchReplacementRecommendations
  } = useFetchDashboardData({
    userId: user?.id,
    targetRecommendedCount: 10,
    enabled: !!user
  });
  
  // Grant interactions
  const {
    interactionLoading,
    handleSaveGrant,
    handleApplyGrant,
    handleIgnoreGrant,
    handleShareGrant
  } = useGrantInteractions({
    userId: user?.id,
    onError: (message) => console.error(message)
  });
  
  // State update handlers
  const setActiveTab = useCallback((tab: 'recommended' | 'saved' | 'applied' | 'ignored') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);
  
  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);
  
  const setSortBy = useCallback((sortBy: string) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);
  
  const setFilterOnlyNoDeadline = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, filterOnlyNoDeadline: value }));
  }, []);
  
  const setFilterOnlyNoFunding = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, filterOnlyNoFunding: value }));
  }, []);
  
  const handlePageChange = useCallback((tabName: string, newPage: number) => {
    setState(prev => ({
      ...prev,
      currentPage: {
        ...prev.currentPage,
        [tabName]: newPage
      }
    }));
  }, []);
  
  // Filter and sort grants based on search term, filter options, and sort option
  const filterAndSortGrants = useCallback((grants: Grant[]) => {
    // Apply filters in sequence
    let filteredGrants = grants;
    
    // Apply no deadline filter if enabled
    if (state.filterOnlyNoDeadline) {
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
    if (state.filterOnlyNoFunding) {
      filteredGrants = filteredGrants.filter(grant => grant.award_ceiling === null);
    }
    
    // Apply search term filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filteredGrants = filteredGrants.filter(grant =>
        grant.title.toLowerCase().includes(term) ||
        grant.description.toLowerCase().includes(term) ||
        grant.agency_name.toLowerCase().includes(term)
      );
    }
    
    // Finally sort based on sortBy option
    return [...filteredGrants].sort((a, b) => {
      switch (state.sortBy) {
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
  }, [state.sortBy, state.filterOnlyNoDeadline, state.filterOnlyNoFunding, state.searchTerm]);
  
  // Memoize filtered and sorted grants to prevent unnecessary recalculations
  const filteredAndSortedGrants = useMemo(() => {
    return {
      recommended: filterAndSortGrants(recommendedGrants) as ScoredGrant[],
      saved: filterAndSortGrants(savedGrants),
      applied: filterAndSortGrants(appliedGrants),
      ignored: filterAndSortGrants(ignoredGrants)
    };
  }, [filterAndSortGrants, recommendedGrants, savedGrants, appliedGrants, ignoredGrants]);
  
  // Get paginated grants for the current tab
  const getPaginatedGrants = useCallback((grants: Grant[], tabName: string) => {
    const filtered = filteredAndSortedGrants[tabName as keyof typeof filteredAndSortedGrants];
    const startIndex = (state.currentPage[tabName as keyof typeof state.currentPage] - 1) * DASHBOARD_GRANTS_PER_PAGE;
    const endIndex = startIndex + DASHBOARD_GRANTS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filteredAndSortedGrants, state.currentPage]);
  
  // Get total number of pages for a tab
  const getTotalPages = useCallback((grants: Grant[], tabName: string) => {
    const filtered = filteredAndSortedGrants[tabName as keyof typeof filteredAndSortedGrants];
    return Math.ceil(filtered.length / DASHBOARD_GRANTS_PER_PAGE);
  }, [filteredAndSortedGrants]);
  
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
  const handleApplyConfirmation = useCallback(async (didApply: boolean) => {
    // Hide the confirmation popup
    setShowApplyConfirmation(false);
    
    // If the user clicked "Yes" and we have a pending grant ID
    if (didApply && pendingGrantId) {
      // Update the database and local state
      await handleApplyGrant(pendingGrantId);
      
      // Fetch replacement grants if needed
      await fetchReplacementRecommendations();
    }
    
    // Reset the pending grant ID and title
    setPendingGrantId(null);
    setPendingGrantTitle('');
  }, [pendingGrantId, handleApplyGrant, fetchReplacementRecommendations]);
  
  // Combine all values and functions into the context value
  const contextValue = {
    state,
    recommendedGrants,
    savedGrants,
    appliedGrants,
    ignoredGrants,
    userPreferences,
    loading,
    error,
    interactionLoading,
    showApplyConfirmation,
    pendingGrantId,
    pendingGrantTitle,
    filteredAndSortedGrants,
    displayedGrants,
    totalPages,
    setActiveTab,
    setSearchTerm,
    setSortBy,
    setFilterOnlyNoDeadline,
    setFilterOnlyNoFunding,
    handlePageChange,
    handleSaveGrant,
    handleApplyGrant,
    handleIgnoreGrant,
    handleShareGrant,
    handleApplyClick,
    handleApplyConfirmation,
    refetchDashboardData
  };
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}