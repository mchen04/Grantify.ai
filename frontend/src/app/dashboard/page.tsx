import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
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
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <Link
            href="/dashboard/preferences"
            className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Preferences
          </Link>
        </div>
        
        {/* Dashboard Navigation */}
        <div className="mb-8 border-b">
          <nav className="flex flex-wrap -mb-px">
            <Link
              href="/dashboard"
              className="inline-block p-4 text-blue-600 border-b-2 border-blue-600 font-medium"
            >
              Recommended
            </Link>
            <Link
              href="/dashboard/saved"
              className="inline-block p-4 text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 font-medium"
            >
              Saved Grants
            </Link>
            <Link
              href="/dashboard/applied"
              className="inline-block p-4 text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 font-medium"
            >
              Applied Grants
            </Link>
            <Link
              href="/dashboard/ignored"
              className="inline-block p-4 text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 font-medium"
            >
              Ignored Grants
            </Link>
          </nav>
        </div>
        
        {/* Recommended Grants Section */}
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
        </section>
        
        {/* Saved Grants Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Saved Grants</h2>
            <Link
              href="/dashboard/saved"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </Link>
          </div>
          
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
        </section>
        
        {/* Applied Grants Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Applied Grants</h2>
            <Link
              href="/dashboard/applied"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </Link>
          </div>
          
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
        </section>
        
        {/* Upcoming Deadlines */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Upcoming Deadlines</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">Digital Literacy Education Program</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Department of Education</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Apr 20, 2025</div>
                    <div className="text-xs text-red-500">25 days left</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Applied
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">Community Health Initiative Grant</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Department of Health</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">May 15, 2025</div>
                    <div className="text-xs text-orange-500">50 days left</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Saved
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}