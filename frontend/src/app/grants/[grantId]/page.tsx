"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSimilarGrants, formatSimilarGrant } from '@/lib/similarGrants';

// Grant type definition
interface Grant {
  id: string;
  title: string;
  agency_name: string;
  agency_code: string;
  opportunity_id: string;
  opportunity_number: string;
  close_date: string | null;
  post_date: string | null;
  total_funding: number | null;
  award_ceiling: number | null;
  award_floor: number | null;
  cost_sharing: boolean;
  description: string;
  eligible_applicants: string[] | null;
  activity_category: string[] | null;
  additional_info_url: string | null;
  grantor_contact_name: string | null;
  grantor_contact_email: string | null;
  grantor_contact_phone: string | null;
  funding_type: string | null;
}

// Interaction type
interface Interaction {
  action: string;
}

// Similar grant type
interface SimilarGrant {
  id: string;
  title: string;
  agency: string;
  deadline: string;
}

export default function GrantDetail({ params }: { params: { grantId: string } }) {
  const { grantId } = React.use(params);
  const { user } = useAuth();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isIgnored, setIsIgnored] = useState(false);
  const [similarGrants, setSimilarGrants] = useState<SimilarGrant[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  
  // Fetch the grant data
  useEffect(() => {
    const fetchGrant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the grant by ID
        const { data, error } = await supabase
          .from('grants')
          .select('*')
          .eq('id', grantId)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          setError('Grant not found');
          return;
        }
        
        setGrant(data);
        
        // If user is logged in, check if they've interacted with this grant
        if (user) {
          const { data: interactions, error: interactionsError } = await supabase
            .from('user_interactions')
            .select('action')
            .eq('user_id', user.id)
            .eq('grant_id', grantId);
          
          if (interactionsError) throw interactionsError;
          
          if (interactions && interactions.length > 0) {
            setIsSaved(interactions.some((i: Interaction) => i.action === 'saved'));
            setIsApplied(interactions.some((i: Interaction) => i.action === 'applied'));
            setIsIgnored(interactions.some((i: Interaction) => i.action === 'ignored'));
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
    
    fetchGrant();
  }, [grantId, user]);
  
  // Handle user interactions (save, apply, ignore)
  const handleInteraction = async (action: 'saved' | 'applied' | 'ignored') => {
    if (!user) {
      // Redirect to login or show login modal
      return;
    }
    
    try {
      // Record the interaction
      const { error } = await supabase
        .from('user_interactions')
        .upsert({
          user_id: user.id,
          grant_id: grantId,
          action,
          timestamp: new Date().toISOString(),
        }, { onConflict: 'user_id,grant_id,action' });
      
      if (error) throw error;
      
      // Update the UI
      if (action === 'saved') setIsSaved(true);
      if (action === 'applied') setIsApplied(true);
      if (action === 'ignored') setIsIgnored(true);
    } catch (error: any) {
      console.error(`Error ${action} grant:`, error);
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
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="text-sm mb-6">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <Link href="/" className="text-gray-500 hover:text-blue-600">
                Home
              </Link>
              <svg className="fill-current w-3 h-3 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
              </svg>
            </li>
            <li className="flex items-center">
              <Link href="/search" className="text-gray-500 hover:text-blue-600">
                Grants
              </Link>
              <svg className="fill-current w-3 h-3 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
              </svg>
            </li>
            <li>
              <span className="text-gray-700">{grant.title}</span>
            </li>
          </ol>
        </nav>
        
        {/* Grant Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-0">{grant.title}</h1>
            <div className="flex space-x-2">
              {!isSaved && !isApplied && !isIgnored && (
                <button 
                  onClick={() => handleInteraction('saved')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Grant
                </button>
              )}
              {!isApplied && (
                <a 
                  href={`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.opportunity_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  onClick={() => handleInteraction('applied')}
                >
                  Apply Now
                </a>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {grant.activity_category && grant.activity_category.map((category, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
              >
                {category}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-800">
            <div>
              <span className="font-medium text-gray-800">Agency:</span> {grant.agency_name} {grant.agency_code ? `(${grant.agency_code})` : ''}
            </div>
            <div>
              <span className="font-medium text-gray-800">Opportunity ID:</span> {grant.opportunity_id}
            </div>
            <div>
              <span className="font-medium text-gray-800">Opportunity Number:</span> {grant.opportunity_number}
            </div>
          </div>
        </div>
        
        {/* Grant Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none text-gray-800">
                {grant.description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Eligible Applicants</h2>
              {grant.eligible_applicants && grant.eligible_applicants.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-gray-800">
                  {grant.eligible_applicants.map((applicant, index) => (
                    <li key={index}>{applicant}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-800">No eligibility information available.</p>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3 text-gray-800">
                <div>
                  <span className="font-medium text-gray-800">Name:</span> {grant.grantor_contact_name || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Email:</span> {grant.grantor_contact_email || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Phone:</span> {grant.grantor_contact_phone || 'Not specified'}
                </div>
                {grant.additional_info_url && (
                  <div className="pt-2">
                    <a 
                      href={grant.additional_info_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Visit Agency Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Grant Details</h2>
              
              <div className="space-y-4 text-gray-800">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Posted Date</div>
                  <div>{formatDate(grant.post_date)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Close Date</div>
                  <div className="font-medium">{formatDate(grant.close_date)}</div>
                  {daysRemaining !== null ? (
                    <div className={`text-sm ${daysRemaining < 30 ? 'text-red-600' : 'text-orange-600'}`}>
                      {daysRemaining} days remaining
                    </div>
                  ) : (
                    <div className="text-sm text-green-600">
                      Open-ended opportunity
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Funding Type</div>
                  <div>{grant.funding_type || 'Not specified'}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Funding</div>
                  <div>{formatCurrency(grant.total_funding)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Award Range</div>
                  <div>
                    {formatCurrency(grant.award_floor)} - {formatCurrency(grant.award_ceiling)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Cost Sharing Required</div>
                  <div>{grant.cost_sharing ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <a 
                  href={`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.opportunity_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => !isApplied && handleInteraction('applied')}
                >
                  Apply on Grants.gov
                </a>
                
                {!isSaved && !isApplied && !isIgnored ? (
                  <button 
                    onClick={() => handleInteraction('saved')}
                    className="block w-full bg-white border border-blue-600 text-blue-600 text-center px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Save Grant
                  </button>
                ) : isSaved ? (
                  <div className="block w-full bg-blue-50 border border-blue-600 text-blue-600 text-center px-4 py-2 rounded-md">
                    ✓ Saved
                  </div>
                ) : null}
                
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/grants/${grantId}`;
                    try {
                      if (navigator.share) {
                        navigator.share({
                          title: grant.title,
                          text: 'Check out this grant opportunity',
                          url: shareUrl
                        });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        // Could add a toast notification here
                      }
                    } catch (error: any) {
                      // Don't log errors if the user canceled the share
                      if (error.name !== 'AbortError') {
                        // Only copy to clipboard if it's not a cancel action
                        navigator.clipboard.writeText(shareUrl);
                      }
                    }
                  }}
                  className="block w-full bg-white border border-gray-300 text-gray-700 text-center px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Share Grant
                </button>
                
                {!isIgnored && !isApplied ? (
                  <button 
                    onClick={() => handleInteraction('ignored')}
                    className="block w-full bg-white border border-red-600 text-red-600 text-center px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Ignore Grant
                  </button>
                ) : isIgnored ? (
                  <div className="block w-full bg-red-50 border border-red-600 text-red-600 text-center px-4 py-2 rounded-md">
                    ✓ Ignored
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        
        {/* Similar Grants */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Similar Grants</h2>
          {loadingSimilar ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : similarGrants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarGrants.map((similarGrant) => (
                <Link 
                  key={similarGrant.id}
                  href={`/grants/${similarGrant.id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-blue-600 mb-2">{similarGrant.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{similarGrant.agency}</p>
                  <p className="text-xs text-gray-500">Deadline: {similarGrant.deadline}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No similar grants found.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
