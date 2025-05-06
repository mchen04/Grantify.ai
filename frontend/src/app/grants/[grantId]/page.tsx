"use client";

import React, { useEffect, useState, use, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSimilarGrants, formatSimilarGrant } from '@/lib/similarGrants';

// Grant type definition
interface Grant {
  id: string;
  title: string;
  agency_name: string;
  agency_code: string;
  agency_subdivision?: string;
  opportunity_id: string;
  opportunity_number: string;
  close_date: string | null;
  post_date: string | null;
  loi_due_date?: string | null;
  expiration_date?: string | null;
  earliest_start_date?: string | null;
  total_funding: number | null;
  award_ceiling: number | null;
  award_floor: number | null;
  expected_award_count?: number | null;
  project_period_max_years?: number | null;
  cost_sharing: boolean;
  description_short: string;
  description_full: string;
  eligible_applicants: string[] | null;
  eligibility_pi?: string;
  activity_category: string[] | null;
  activity_code?: string;
  source_url: string | null;
  data_source?: string;
  status?: string;
  grantor_contact_name: string | null;
  grantor_contact_role?: string;
  grantor_contact_email: string | null;
  grantor_contact_phone: string | null;
  grantor_contact_affiliation?: string;
  announcement_type?: string;
  clinical_trial_allowed?: boolean;
  additional_notes?: string;
  keywords?: string[];
  grant_type: string | null;
}
// Interaction type
interface Interaction {
  id: string;
  user_id: string;
  grant_id: string;
  action: 'saved' | 'applied' | 'ignored';
  timestamp: string;
}

// Similar grant type
interface SimilarGrant {
  id: string;
  title: string;
  agency: string;
  deadline: string;
}

// Page params type for Next.js 15.1.7+
type PageParams = {
  grantId: string;
};

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

export default function GrantDetail({ params }: { params: Promise<PageParams> | PageParams }) {
  // Properly unwrap the params Promise using React.use()
  const unwrappedParams = use(params as Promise<PageParams>);
  const grantId = unwrappedParams.grantId;
  const { user, session } = useAuth();
  const searchParams = useSearchParams();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interactionState, setInteractionState] = useState<'saved' | 'applied' | 'ignored' | null>(null);
  const [similarGrants, setSimilarGrants] = useState<SimilarGrant[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const [fromSource, setFromSource] = useState<string | null>(null);
  const [tabSource, setTabSource] = useState<string | null>(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  
  // Fetch the grant data
  useEffect(() => {
    const fetchGrant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the grant by ID using apiClient
        const { data, error } = await apiClient.grants.getGrantById(grantId);
        
        if (error) throw new Error(error);
        
        if (!data) {
          setError('Grant not found');
          return;
        }
        
        setGrant(data.grant); // Correctly set the nested grant object
        console.log('Fetched grant data:', JSON.stringify(data, null, 2)); // Keep logging for verification
        
        // If user is logged in, check if they've interacted with this grant
        if (user) {
          // Fetch user interactions for this grant using apiClient
          const { data: interactionsData, error: interactionsError } = await apiClient.users.getUserInteractions(user.id, undefined, grantId, undefined, session?.access_token);
          
          if (interactionsError) throw new Error(interactionsError);
          
          if (interactionsData && interactionsData.length > 0) {
            // Get the most recent interaction
            const latestInteraction = interactionsData[0] as Interaction;
            setInteractionState(latestInteraction.action);
          } else {
            setInteractionState(null);
          }
        }
        
        // Fetch similar grants
        setLoadingSimilar(true);
        const similarGrantsData = await fetchSimilarGrants(grantId, data.activity_category, 3);
        setSimilarGrants(similarGrantsData.map(formatSimilarGrant));
        setLoadingSimilar(false);
      } catch (error: any) {
        console.error('Error fetching grant:', error);
        setError('Failed to load grant details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    // Get referral parameters from URL
    const from = searchParams.get('from');
    const tab = searchParams.get('tab');
    setFromSource(from);
    setTabSource(tab);
    
    fetchGrant();
  }, [grantId, user, searchParams]);
  
  // Handle user interactions (save, apply, ignore)
  const handleInteraction = async (action: 'saved' | 'applied' | 'ignored') => {
    if (!user) {
      // Redirect to login or show login modal
      return;
    }
    
    // Set loading state and update UI immediately
    setInteractionLoading(true);
    
    // Immediately update UI state for better responsiveness
    // Store previous state in case we need to revert due to error
    const previousState = interactionState;
    const isCurrentStatus = interactionState === action;
    
    // Update local state first (before DB operation completes)
    if (isCurrentStatus) {
      setInteractionState(null);
    } else {
      setInteractionState(action);
    }
    
    try {
      if (isCurrentStatus) {
        // --- Undoing an action ---
        // Delete the interaction from the database using apiClient
        const { error: deleteError } = await apiClient.users.deleteInteraction(
          user.id,
          grantId,
          action
        );
        
        if (deleteError) throw new Error(deleteError);
      } else {
        // --- Setting a new action or changing an action ---
        // Use apiClient to record the interaction
        const { error } = await apiClient.users.recordInteraction(
          user.id,
          grantId,
          action
        );
        
        if (error) throw new Error(error);
      }
    } catch (error: any) {
      console.error(`Error ${action} grant:`, error);
      // Revert UI state if database operation failed
      setInteractionState(previousState);
    } finally {
      setInteractionLoading(false);
    }
  };
  
  // Handle share button click
  const handleShare = async () => {
    if (!grant) return;
    
    const shareUrl = `${window.location.origin}/grants/${grantId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: grant.title,
          text: 'Check out this grant opportunity',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // Could add a toast notification here
      }
    } catch (error: any) {
      // Silently handle AbortError when user cancels share dialog
      if (error.name !== 'AbortError') {
        // Only copy to clipboard if it's not a cancel action
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch (clipboardError) {
          console.error('Failed to copy URL to clipboard', clipboardError);
        }
      }
    }
  };
  
  // Handle apply button click
  const handleApplyClick = () => {
    if (!user) {
      // Redirect to login
      // You could add this functionality here
      return;
    }
    
    // Show confirmation popup
    setShowApplyConfirmation(true);
  };
  
  // Handle apply confirmation response
  const handleApplyConfirmation = (didApply: boolean) => {
    // Hide the popup
    setShowApplyConfirmation(false);
    
    // If user confirmed, mark as applied
    if (didApply) {
      // Update UI state immediately before database interaction
      const previousState = interactionState;
      setInteractionState('applied');
      
      // Then handle the database update
      handleInteraction('applied');
    }
  };
  
  // Format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline specified';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate days remaining
  const getDaysRemaining = (closeDate: string | null) => {
    if (!closeDate) return null;
    
    const today = new Date();
    const closeDateObj = new Date(closeDate);
    const daysRemaining = Math.ceil((closeDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysRemaining;
  };
  
  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not specified';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  // Show error state
  if (error || !grant) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-600 p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p>{error || 'Grant not found'}</p>
            <Link href="/search" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Return to Search
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Calculate days remaining
  const daysRemaining = getDaysRemaining(grant.close_date);
  
  return (
    <Layout>
      <div className="container mx-auto">
        {/* Breadcrumbs */}
        <nav className="text-sm mb-6">
          <ol className="list-none p-0 inline-flex items-center">
            {/* Home link - always first */}
            <li className="flex items-center">
              <Link href="/" className="text-gray-500 hover:text-primary-600 transition-colors">
                Home
              </Link>
              <svg className="fill-current w-3 h-3 mx-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
              </svg>
            </li>
            
            {/* Conditional breadcrumb items based on source */}
            {fromSource === 'search' ? (
              <li className="flex items-center">
                <Link href="/search" className="text-gray-500 hover:text-primary-600 transition-colors">
                  Search
                </Link>
                <svg className="fill-current w-3 h-3 mx-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                </svg>
              </li>
            ) : fromSource === 'dashboard' ? (
              <>
                <li className="flex items-center">
                  <Link href="/dashboard" className="text-gray-500 hover:text-primary-600 transition-colors">
                    Dashboard
                  </Link>
                  <svg className="fill-current w-3 h-3 mx-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                    <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                  </svg>
                </li>
                {tabSource && (
                  <li className="flex items-center">
                    <Link
                      href={`/dashboard?tab=${tabSource}`}
                      className="text-gray-500 hover:text-primary-600 transition-colors capitalize"
                    >
                      {tabSource}
                    </Link>
                    <svg className="fill-current w-3 h-3 mx-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                      <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                    </svg>
                  </li>
                )}
              </>
            ) : (
              <li className="flex items-center">
                <Link href="/search" className="text-gray-500 hover:text-primary-600 transition-colors">
                  Grants
                </Link>
                <svg className="fill-current w-3 h-3 mx-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                </svg>
              </li>
            )}
            
            {/* Grant title - always last */}
            <li>
              <span className="text-gray-700 font-medium">{grant.title}</span>
            </li>
          </ol>
        </nav>
        
        {/* Grant Header */}
        <div className="card p-6 mb-8 border-t-4 border-t-primary-600 transition-all duration-300 hover:shadow-lg">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{grant.title}</h1>
            {grant.description_short && (
              <p className="text-gray-700 italic mb-4">{grant.description_short}</p>
            )}
          </div>
          
          <div className="grant-card-tags mb-6">
            {grant.activity_category && grant.activity_category.map((category, index) => (
              <span
                key={index}
                className="grant-tag"
              >
                {category}
              </span>
            ))}
             {grant.keywords && grant.keywords.map((keyword, index) => (
              <span
                key={`keyword-${index}`}
                className="grant-tag bg-blue-100 text-blue-800"
              >
                {keyword}
              </span>
            ))}
             {grant.category && (
              <span
                key="category"
                className="grant-tag bg-purple-100 text-purple-800"
              >
                {grant.category}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 13.197l-4.419 2.617A1 1 0 014 15V4zm2-1a1 1 0 00-1 1v10.566l3.419-2.021a1 1 0 011.162 0L13 14.566V4a1 1 0 00-1-1H6z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium text-gray-800 block">Agency</span>
                <span className="text-gray-600">{grant.agency_name} {grant.agency_code ? `(${grant.agency_code})` : ''}</span>
                {grant.agency_subdivision && (
                  <span className="text-gray-600 block text-xs mt-1">Subdivision: {grant.agency_subdivision}</span>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium text-gray-800 block">Opportunity ID</span>
                <span className="text-gray-600">{grant.opportunity_id}</span>
              </div>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582a1 1 0 00-.646.934v4.286a1 1 0 00.648.937l3.952 1.566V13a1 1 0 002 0v-1.372l3.954-1.566a1 1 0 00.646-.937V6.839a1 1 0 00-.648-.937L11 4.323V3a1 1 0 00-1-1zm0 8.54l-3-1.2V7.66l3 1.2v1.68zm5-3.88l-3 1.2v1.68l3-1.2V6.66z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium text-gray-800 block">Opportunity Number</span>
                <span className="text-gray-600">{grant.opportunity_number}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Grant Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-6 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Description
              </h2>
              <div className="prose max-w-none text-gray-700">
                {(grant.description_full ?? '').split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
            
            <div className="card p-6 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Eligible Applicants
              </h2>
              {grant.eligible_applicants && grant.eligible_applicants.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {grant.eligible_applicants.map((applicant, index) => (
                    <li key={index}>{applicant}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">No eligibility information available.</p>
              )}
              {grant.eligibility_pi && (
                <div className="mt-4 text-gray-700">
                  <span className="font-medium text-gray-800 block">Principal Investigator Eligibility:</span>
                  <span>{grant.eligibility_pi}</span>
                </div>
              )}
            </div>
            
            <div className="card p-6 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-800 block">Name</span>
                    <span>{grant.grantor_contact_name || 'Not specified'}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-800 block">Email</span>
                    <span>{grant.grantor_contact_email || 'Not specified'}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-800 block">Phone</span>
                    <span>{grant.grantor_contact_phone || 'Not specified'}</span>
                  </div>
                </div>
                 {grant.grantor_contact_role && (
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-medium text-gray-800 block">Role</span>
                      <span>{grant.grantor_contact_role}</span>
                    </div>
                  </div>
                )}
                {grant.grantor_contact_affiliation && (
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-medium text-gray-800 block">Affiliation</span>
                      <span>{grant.grantor_contact_affiliation}</span>
                    </div>
                  </div>
                )}
                {grant.source_url && (
                  <div className="col-span-2 mt-2">
                    <a
                      href={grant.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      Visit Agency Website
                    </a>
                  </div>
                )}
              </div>
            </div>
             {grant.additional_notes && (
              <div className="card p-6 transition-all duration-300 hover:shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Additional Notes
                </h2>
                <div className="prose max-w-none text-gray-700">
                  {grant.additional_notes.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <div className="card p-6 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Grant Details
              </h2>
              
              <div className="divide-y divide-gray-200">
                <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Status</div>
                  <div className="w-2/3 font-medium">{grant.status || 'Not specified'}</div>
                </div>
                <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Data Source</div>
                  <div className="w-2/3 font-medium">{grant.data_source || 'Not specified'}</div>
                </div>
                <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Posted Date</div>
                  <div className="w-2/3 font-medium">{formatDate(grant.post_date)}</div>
                </div>
                
                <div className="py-3 flex flex-col">
                  <div className="flex items-start">
                    <div className="w-1/3 text-sm text-gray-600">Close Date</div>
                    <div className="w-2/3 font-medium">{formatDate(grant.close_date)}</div>
                  </div>
                  {daysRemaining !== null && (
                    <div className={`ml-auto text-sm font-medium ${
                      daysRemaining < 14 ? 'text-red-600' :
                      daysRemaining < 30 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {daysRemaining} days remaining
                    </div>
                  )}
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">LOI Due Date</div>
                  <div className="w-2/3 font-medium">{formatDate(grant.loi_due_date)}</div>
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Expiration Date</div>
                  <div className="w-2/3 font-medium">{formatDate(grant.expiration_date)}</div>
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Earliest Start Date</div>
                  <div className="w-2/3 font-medium">{formatDate(grant.earliest_start_date)}</div>
                </div>
                
                <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Grant Type</div>
                  <div className="w-2/3">{grant.grant_type || 'Not specified'}</div>
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Activity Code</div>
                  <div className="w-2/3">{grant.activity_code || 'Not specified'}</div>
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Announcement Type</div>
                  <div className="w-2/3">{grant.announcement_type || 'Not specified'}</div>
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Clinical Trial Allowed</div>
                  <div className="w-2/3">{grant.clinical_trial_allowed !== undefined ? (grant.clinical_trial_allowed ? 'Yes' : 'No') : 'Not specified'}</div>
                </div>
                
                <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Total Funding</div>
                  <div className="w-2/3 font-medium text-primary-600">{formatCurrency(grant.total_funding)}</div>
                </div>
                
                <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Award Range</div>
                  <div className="w-2/3">
                    {formatCurrency(grant.award_floor)} - {formatCurrency(grant.award_ceiling)}
                  </div>
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Expected Award Count</div>
                  <div className="w-2/3">{grant.expected_award_count !== undefined ? grant.expected_award_count : 'Not specified'}</div>
                </div>
                 <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Project Period Max Years</div>
                  <div className="w-2/3">{grant.project_period_max_years !== undefined ? grant.project_period_max_years : 'Not specified'}</div>
                </div>
                
                <div className="py-3 flex items-start">
                  <div className="w-1/3 text-sm text-gray-600">Cost Sharing</div>
                  <div className="w-2/3 flex items-center">
                    {grant.cost_sharing ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Required</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span>Not Required</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card p-6 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                </svg>
                Actions
              </h2>
              <div className="space-y-3">
                {/* Apply Button */}
                <button
                  onClick={() => {
                    window.open(`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.opportunity_id}`, '_blank');
                    handleApplyClick();
                  }}
                  disabled={interactionLoading}
                  className={`${
                    interactionState === 'applied'
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : 'btn-primary'
                  } w-full flex justify-center items-center gap-2 ${interactionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  {interactionState === 'applied' ? 'Applied' : 'Apply on Grants.gov'}
                </button>
                
                {/* Save Button */}
                <button
                  onClick={() => handleInteraction('saved')}
                  disabled={interactionLoading}
                  className={`w-full flex justify-center items-center gap-2 ${
                    interactionState === 'saved'
                      ? 'px-4 py-2 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                      : 'btn-secondary'
                  } ${interactionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {interactionState === 'saved' ? 'Saved' : 'Save Grant'}
                </button>
                
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  disabled={interactionLoading}
                  className={`btn-secondary w-full flex justify-center items-center gap-2 ${interactionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share Grant
                </button>
                
                {/* Ignore Button */}
                <button
                  onClick={() => handleInteraction('ignored')}
                  disabled={interactionLoading}
                  className={`w-full flex justify-center items-center gap-2 ${
                    interactionState === 'ignored'
                      ? 'px-4 py-2 rounded-lg bg-gray-100 text-gray-700 border border-gray-200'
                      : 'px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors'
                  } ${interactionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {interactionState === 'ignored' ? 'Ignored' : 'Ignore Grant'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Similar Grants */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Similar Grants
          </h2>
          {loadingSimilar ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : similarGrants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarGrants.map((similarGrant) => (
                <Link
                  key={similarGrant.id}
                  href={`/grants/${similarGrant.id}`}
                  className="card p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-500 flex flex-col h-full"
                >
                  <h3 className="font-medium text-primary-700 mb-2 line-clamp-2">{similarGrant.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{similarGrant.agency}</p>
                  <div className="mt-auto pt-2 flex items-center text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Deadline: {similarGrant.deadline}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p>No similar grants found at this time.</p>
            </div>
          )}
        </div>
        {/* Apply Confirmation Popup */}
        {showApplyConfirmation && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 animate-pulse">Loading...</div>
            </div>
          }>
            <DynamicApplyConfirmationPopup
              isOpen={showApplyConfirmation}
              grantTitle={grant?.title || ''}
              onConfirm={() => handleApplyConfirmation(true)}
              onCancel={() => handleApplyConfirmation(false)}
            />
          </Suspense>
        )}
      </div>
    </Layout>
  );
}
