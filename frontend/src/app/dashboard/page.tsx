"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import GrantCard from '@/components/GrantCard';
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
        
        // Fetch recommended grants (active grants only)
        // In a real implementation, this would use AI recommendations
        const { data: allGrants, error: grantsError } = await supabase
          .from('grants')
          .select('*')
          .or(`close_date.gt.${today},close_date.is.null`) // Only active grants
          .limit(5);
        
        if (grantsError) throw grantsError;
        
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
        setRecommendedGrants(allGrants || []);
      } catch (error: any) {
        console.error('Error fetching user grants:', error);
        setError('Failed to load your grants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserGrants();
  }, [user]);

  // Handle grant interaction (save, apply, ignore)
  const handleGrantInteraction = async (grantId: string, action: 'saved' | 'applied' | 'ignored') => {
    if (!user) return;
    
    try {
      // Record the interaction in Supabase
      const { error } = await supabase
        .from('user_interactions')
        .upsert({
          user_id: user.id,
          grant_id: grantId,
          action,
          timestamp: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update the local state based on the action
      // This is a simplified approach - in a real app, you'd refetch the data
      if (action === 'saved') {
        const grantToSave = recommendedGrants.find(g => g.id === grantId);
        if (grantToSave && !savedGrants.some(g => g.id === grantId)) {
          setSavedGrants([...savedGrants, grantToSave]);
        }
      } else if (action === 'applied') {
        const grantToApply = recommendedGrants.find(g => g.id === grantId) || 
                            savedGrants.find(g => g.id === grantId);
        if (grantToApply && !appliedGrants.some(g => g.id === grantId)) {
          setAppliedGrants([...appliedGrants, grantToApply]);
        }
      } else if (action === 'ignored') {
        const grantToIgnore = recommendedGrants.find(g => g.id === grantId);
        if (grantToIgnore && !ignoredGrants.some(g => g.id === grantId)) {
          setIgnoredGrants([...ignoredGrants, grantToIgnore]);
          setRecommendedGrants(recommendedGrants.filter(g => g.id !== grantId));
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedGrants.recommended.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    id={grant.id}
                    title={grant.title}
                    agency={grant.agency_name}
                    closeDate={grant.close_date}
                    fundingAmount={grant.award_ceiling}
                    description={grant.description}
                    categories={grant.activity_category || []}
                    onSave={() => handleGrantInteraction(grant.id, 'saved')}
                    onApply={() => handleGrantInteraction(grant.id, 'applied')}
                    onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedGrants.saved.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    id={grant.id}
                    title={grant.title}
                    agency={grant.agency_name}
                    closeDate={grant.close_date}
                    fundingAmount={grant.award_ceiling}
                    description={grant.description}
                    categories={grant.activity_category || []}
                    onApply={() => handleGrantInteraction(grant.id, 'applied')}
                    onIgnore={() => handleGrantInteraction(grant.id, 'ignored')}
                    isSaved={true}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedGrants.applied.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    id={grant.id}
                    title={grant.title}
                    agency={grant.agency_name}
                    closeDate={grant.close_date}
                    fundingAmount={grant.award_ceiling}
                    description={grant.description}
                    categories={grant.activity_category || []}
                    isApplied={true}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedGrants.ignored.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    id={grant.id}
                    title={grant.title}
                    agency={grant.agency_name}
                    closeDate={grant.close_date}
                    fundingAmount={grant.award_ceiling}
                    description={grant.description}
                    categories={grant.activity_category || []}
                    isIgnored={true}
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
    </Layout>
  );
}
