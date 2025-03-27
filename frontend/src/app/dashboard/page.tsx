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

  // Filter grants based on search term
  const filterGrants = (grants: Grant[]) => {
    if (!searchTerm) return grants;
    const term = searchTerm.toLowerCase();
    return grants.filter(grant =>
      grant.title.toLowerCase().includes(term) ||
      grant.description.toLowerCase().includes(term) ||
      grant.agency_name.toLowerCase().includes(term)
    );
  };

  const displayedGrants = {
    recommended: filterGrants(recommendedGrants),
    saved: filterGrants(savedGrants),
    applied: filterGrants(appliedGrants),
    ignored: filterGrants(ignoredGrants)
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
        
        // Fetch saved grants
        const { data: savedInteractions, error: savedError } = await supabase
          .from('user_interactions')
          .select('*, grants(*)')
          .eq('user_id', user.id)
          .eq('action', 'saved');
        
        if (savedError) throw savedError;
        
        // Fetch applied grants
        const { data: appliedInteractions, error: appliedError } = await supabase
          .from('user_interactions')
          .select('*, grants(*)')
          .eq('user_id', user.id)
          .eq('action', 'applied');
        
        if (appliedError) throw appliedError;
        
        // Fetch ignored grants
        const { data: ignoredInteractions, error: ignoredError } = await supabase
          .from('user_interactions')
          .select('*, grants(*)')
          .eq('user_id', user.id)
          .eq('action', 'ignored');
        
        if (ignoredError) throw ignoredError;
        
        // Fetch recommended grants (active grants that the user hasn't interacted with)
        const { data: recommendedData, error: recommendedError } = await supabase
          .from('grants')
          .select(`
            *,
            interactions:user_interactions!left(action, timestamp)
          `)
          .eq('interactions.user_id', user.id)
          .is('interactions', null)
          .or(`close_date.gt.${today},close_date.is.null`) // Only active grants
          .limit(10);
        
        if (recommendedError) throw recommendedError;
        
        // Filter out expired grants from interactions
        const filterActiveGrants = (interaction: UserInteraction) => {
          const grant = interaction.grants;
          if (!grant.close_date) return true;
          return new Date(grant.close_date) >= new Date();
        };
        
        // Process the data
        const filteredSavedInteractions = savedInteractions?.filter(filterActiveGrants) || [];
        const filteredAppliedInteractions = appliedInteractions || []; // Keep all applied grants regardless of expiry
        const filteredIgnoredInteractions = ignoredInteractions?.filter(filterActiveGrants) || [];
        
        setSavedGrants(filteredSavedInteractions.map((interaction: UserInteraction) => interaction.grants));
        setAppliedGrants(filteredAppliedInteractions.map((interaction: UserInteraction) => interaction.grants));
        setIgnoredGrants(filteredIgnoredInteractions.map((interaction: UserInteraction) => interaction.grants));
        setRecommendedGrants(recommendedData || []);
      } catch (error: any) {
        console.error('Error fetching user grants:', error);
        setError('Failed to load your grants. Please try again later.');
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
        if (!recommendedGrants.some(g => g.id === grantId)) {
          setRecommendedGrants([...recommendedGrants, grant]);
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

        // Remove from recommended list only if specified
        if (removeFromRecommended && recommendedGrants.some(g => g.id === grantId)) {
          setRecommendedGrants(recommendedGrants.filter(g => g.id !== grantId));
          
          // Fetch one more grant to replace the one that was removed from recommended
          const currentCount = recommendedGrants.length;
          if (currentCount > 0) {
            // Get current date for filtering expired grants
            const today = new Date().toISOString();
            
            // Fetch a new grant that isn't in the current list
            const { data: newGrants, error: fetchError } = await supabase
              .from('grants')
              .select(`
                *,
                interactions:user_interactions!left(action, timestamp)
              `)
              .eq('interactions.user_id', user.id)
              .is('interactions', null)
              .or(`close_date.gt.${today},close_date.is.null`) // Only active grants
              .not('id', 'in', `(${recommendedGrants.map(g => g.id).join(',')})`)
              .limit(1);
            
            if (!fetchError && newGrants && newGrants.length > 0) {
              // Add the new grant to the recommended list
              setRecommendedGrants(prevGrants => [...prevGrants, ...newGrants]);
            }
          }
        }
        
        // Remove from other lists
        setSavedGrants(savedGrants.filter(g => g.id !== grantId));
        setAppliedGrants(appliedGrants.filter(g => g.id !== grantId));
        setIgnoredGrants(ignoredGrants.filter(g => g.id !== grantId));

        // Add to new list
        if (action === 'saved') {
          setSavedGrants([...savedGrants, grant]);
        } else if (action === 'applied') {
          setAppliedGrants([...appliedGrants, grant]);
        } else if (action === 'ignored') {
          setIgnoredGrants([...ignoredGrants, grant]);
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
      
      {/* Dashboard Navigation */}
      <div className="mb-8 border-b">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`inline-block p-4 font-medium ${
              activeTab === 'recommended'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`inline-block p-4 font-medium ${
              activeTab === 'saved'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            Saved Grants
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`inline-block p-4 font-medium ${
              activeTab === 'applied'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            Applied Grants
          </button>
          <button
            onClick={() => setActiveTab('ignored')}
            className={`inline-block p-4 font-medium ${
              activeTab === 'ignored'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            Ignored Grants
          </button>
        </nav>
      </div>
      
      {/* Recommended Grants Section */}
      {activeTab === 'recommended' && (
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recommended for You</h2>
              <Link
                href="/search"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
            <DashboardSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search recommended grants..."
            />
          </div>
          
          {displayedGrants.recommended.length > 0 ? (
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
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">No recommended grants yet. Update your preferences to get personalized recommendations.</p>
              <Link
                href="/preferences"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Saved Grants</h2>
            </div>
            <DashboardSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search saved grants..."
            />
          </div>
          
          {displayedGrants.saved.length > 0 ? (
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
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">You haven't saved any grants yet.</p>
              <Link
                href="/search"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                Search Grants
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Applied Grants Section */}
      {activeTab === 'applied' && (
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Applied Grants</h2>
            </div>
            <DashboardSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search applied grants..."
            />
          </div>
          
          {displayedGrants.applied.length > 0 ? (
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
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">You haven't marked any grants as applied yet.</p>
              <Link
                href="/search"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                Search Grants
              </Link>
            </div>
          )}
        </section>
      )}
      
      {/* Ignored Grants Section */}
      {activeTab === 'ignored' && (
        <section className="mb-12">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ignored Grants</h2>
            </div>
            <DashboardSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="Search ignored grants..."
            />
          </div>
          
          {displayedGrants.ignored.length > 0 ? (
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
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">You haven't ignored any grants yet.</p>
              <Link
                href="/search"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                Search Grants
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
