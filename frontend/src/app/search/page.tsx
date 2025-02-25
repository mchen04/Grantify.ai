import React from 'react';
import Layout from '@/components/Layout/Layout';
import GrantCard from '@/components/GrantCard';

// Mock data for demonstration
const mockGrants = [
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
  },
  {
    id: '3',
    title: 'Small Business Innovation Research Grant',
    agency: 'Small Business Administration',
    closeDate: '2025-07-10',
    fundingAmount: 150000,
    description: 'This grant supports small businesses engaged in research and development with potential for commercialization and economic impact.',
    categories: ['Business', 'Innovation', 'Research']
  },
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

export default function Search() {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Find Grants</h1>
        
        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search grants by keyword..."
                className="w-full p-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-3 top-3 text-gray-500">
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
              <select className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Categories</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
                <option value="energy">Energy</option>
                <option value="technology">Technology</option>
                <option value="research">Research</option>
              </select>
            </div>
            
            {/* Filter by Agency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
              <select className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Agencies</option>
                <option value="doe">Department of Energy</option>
                <option value="doh">Department of Health</option>
                <option value="doe">Department of Education</option>
                <option value="sba">Small Business Administration</option>
              </select>
            </div>
            
            {/* Filter by Funding Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Range</label>
              <select className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Any Amount</option>
                <option value="0-50000">Up to $50,000</option>
                <option value="50000-100000">$50,000 - $100,000</option>
                <option value="100000-500000">$100,000 - $500,000</option>
                <option value="500000+">$500,000+</option>
              </select>
            </div>
            
            {/* Filter by Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <select className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Any Deadline</option>
                <option value="30">Next 30 Days</option>
                <option value="60">Next 60 Days</option>
                <option value="90">Next 90 Days</option>
                <option value="180">Next 6 Months</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Results Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Sort by:</span>
              <select className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="relevance">Relevance</option>
                <option value="deadline">Deadline (Soonest)</option>
                <option value="amount">Funding Amount (Highest)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockGrants.map((grant) => (
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
          
          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-2 rounded-md border text-gray-500 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 rounded-md bg-blue-600 text-white">
                1
              </button>
              <button className="px-3 py-2 rounded-md border text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 rounded-md border text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 rounded-md border text-gray-500 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </Layout>
  );
}