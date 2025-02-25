"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import GrantCard from '@/components/GrantCard';

// Mock data for demonstration
const recommendedGrants = [
  {
    id: '1',
    title: 'Research Grant for Renewable Energy Solutions',
    agency: 'Department of Energy',
    closeDate: '2025-06-30',
    fundingAmount: 500000,
    description: 'This grant supports research and development of innovative renewable energy solutions that address climate change and promote sustainability.',
    categories: ['Energy', 'Research', 'Climate']
  },
  {
    id: '2',
    title: 'Community Health Initiative Grant',
    agency: 'Department of Health',
    closeDate: '2025-05-15',
    fundingAmount: 250000,
    description: 'Funding for community-based organizations to implement health programs that address local health disparities and improve access to care.',
    categories: ['Health', 'Community', 'Social Services']
  }
];

const savedGrants = [
  {
    id: '3',
    title: 'Small Business Innovation Research Grant',
    agency: 'Small Business Administration',
    closeDate: '2025-07-10',
    fundingAmount: 150000,
    description: 'This grant supports small businesses engaged in research and development with potential for commercialization and economic impact.',
    categories: ['Business', 'Innovation', 'Research']
  }
];

const appliedGrants = [
  {
    id: '4',
    title: 'Digital Literacy Education Program',
    agency: 'Department of Education',
    closeDate: '2025-04-20',
    fundingAmount: 300000,
    description: 'Funding to develop and implement programs that enhance digital literacy skills among underserved populations and bridge the digital divide.',
    categories: ['Education', 'Technology', 'Equity']
  }
];

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('recommended');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
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

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome, {user.email}</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link
              href="/dashboard/preferences"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Preferences
            </Link>
            <button
              onClick={handleSignOut}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
        
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Recommended for You</h2>
              <Link
                href="/search"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
            
            {recommendedGrants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedGrants.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    id={grant.id}
                    title={grant.title}
                    agency={grant.agency}
                    closeDate={grant.closeDate}
                    fundingAmount={grant.fundingAmount}
                    description={grant.description}
                    categories={grant.categories}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No recommended grants yet. Update your preferences to get personalized recommendations.</p>
                <Link
                  href="/dashboard/preferences"
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Saved Grants</h2>
            </div>
            
            {savedGrants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedGrants.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    id={grant.id}
                    title={grant.title}
                    agency={grant.agency}
                    closeDate={grant.closeDate}
                    fundingAmount={grant.fundingAmount}
                    description={grant.description}
                    categories={grant.categories}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Applied Grants</h2>
            </div>
            
            {appliedGrants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appliedGrants.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    id={grant.id}
                    title={grant.title}
                    agency={grant.agency}
                    closeDate={grant.closeDate}
                    fundingAmount={grant.fundingAmount}
                    description={grant.description}
                    categories={grant.categories}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Ignored Grants</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">You haven't ignored any grants yet.</p>
              <Link
                href="/search"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                Search Grants
              </Link>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}