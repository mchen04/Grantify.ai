"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import GrantCard from '@/components/GrantCard';
import supabase, { db } from '@/lib/supabaseClient';

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

export default function Search() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [agency, setAgency] = useState('');
  const [fundingRange, setFundingRange] = useState('');
  const [deadline, setDeadline] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const grantsPerPage = 10;

  // Fetch grants on initial load and when filters change
  useEffect(() => {
    const fetchGrants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Start building the query
        let query = supabase.from('grants').select('*', { count: 'exact' });
        
        // Only show active grants (close_date is in the future or null)
        const today = new Date().toISOString();
        query = query.or(`close_date.gt.${today},close_date.is.null`);
        
        // Apply filters
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        
        if (category) {
          query = query.contains('activity_category', [category]);
        }
        
        if (agency) {
          query = query.eq('agency_name', agency);
        }
        
        // Apply funding range filter
        if (fundingRange) {
          const [min, max] = fundingRange.split('-').map(Number);
          if (min && !max) {
            // For "500000+" case
            query = query.gte('award_ceiling', min);
          } else if (min && max) {
            query = query.gte('award_floor', min).lte('award_ceiling', max);
          }
        }
        
        // Apply deadline filter
        if (deadline) {
          const days = parseInt(deadline);
          if (!isNaN(days)) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            query = query.lte('close_date', futureDate.toISOString());
          }
        }
        
        // Apply sorting
        if (sortBy === 'deadline') {
          query = query.order('close_date', { ascending: true });
        } else if (sortBy === 'amount') {
          query = query.order('award_ceiling', { ascending: false });
        } else if (sortBy === 'recent') {
          query = query.order('post_date', { ascending: false });
        }
        
        // Apply pagination
        const from = (page - 1) * grantsPerPage;
        const to = from + grantsPerPage - 1;
        query = query.range(from, to);
        
        // Execute the query
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        setGrants(data || []);
        setTotalPages(count ? Math.ceil(count / grantsPerPage) : 1);
      } catch (error: any) {
        console.error('Error fetching grants:', error);
        setError('Failed to load grants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGrants();
  }, [searchTerm, category, agency, fundingRange, deadline, sortBy, page]);

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  // Handle pagination
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Find Grants</h1>
        
        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSearch}>
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search grants by keyword..."
                  className="w-full p-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-3 text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filter by Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Energy">Energy</option>
                  <option value="Technology">Technology</option>
                  <option value="Research">Research</option>
                </select>
              </div>
              
              {/* Filter by Agency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
                <select 
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                >
                  <option value="">All Agencies</option>
                  <option value="Department of Energy">Department of Energy</option>
                  <option value="Department of Health and Human Services">Department of Health</option>
                  <option value="Department of Education">Department of Education</option>
                  <option value="Small Business Administration">Small Business Administration</option>
                </select>
              </div>
              
              {/* Filter by Funding Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funding Range</label>
                <select 
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={fundingRange}
                  onChange={(e) => setFundingRange(e.target.value)}
                >
                  <option value="">Any Amount</option>
                  <option value="0-50000">Up to $50,000</option>
                  <option value="50000-100000">$50,000 - $100,000</option>
                  <option value="100000-500000">$100,000 - $500,000</option>
                  <option value="500000-">$500,000+</option>
                </select>
              </div>
              
              {/* Filter by Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <select 
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                >
                  <option value="">Any Deadline</option>
                  <option value="30">Next 30 Days</option>
                  <option value="60">Next 60 Days</option>
                  <option value="90">Next 90 Days</option>
                  <option value="180">Next 6 Months</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
        
        {/* Results Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Sort by:</span>
              <select 
                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="deadline">Deadline (Soonest)</option>
                <option value="amount">Funding Amount (Highest)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          ) : grants.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">No grants found matching your criteria. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grants.map((grant) => (
                <GrantCard
                  key={grant.id}
                  id={grant.id}
                  title={grant.title}
                  agency={grant.agency_name}
                  closeDate={grant.close_date}
                  fundingAmount={grant.award_ceiling}
                  description={grant.description}
                  categories={grant.activity_category || []}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {!loading && grants.length > 0 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button 
                  className={`px-3 py-2 rounded-md border ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around the current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`px-3 py-2 rounded-md ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  className={`px-3 py-2 rounded-md border ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}