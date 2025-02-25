import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';

// Mock data for demonstration
const mockGrant = {
  id: '1',
  title: 'Research Grant for Renewable Energy Solutions',
  agency: 'Department of Energy',
  agencyCode: 'DOE',
  opportunity_id: 'DOE-2025-ENERGY-001',
  opportunity_number: 'ENERGY-2025-001',
  closeDate: '2025-06-30',
  postDate: '2025-01-15',
  fundingAmount: 500000,
  awardCeiling: 750000,
  awardFloor: 250000,
  costSharing: true,
  description: `This grant supports research and development of innovative renewable energy solutions that address climate change and promote sustainability.

The Department of Energy (DOE) is seeking proposals for research projects that advance the development of renewable energy technologies with the potential to significantly reduce greenhouse gas emissions and dependence on fossil fuels.

Areas of interest include but are not limited to:
- Solar energy conversion and storage
- Wind energy optimization
- Geothermal energy systems
- Bioenergy and biofuels
- Energy-efficient building technologies
- Grid integration of renewable energy sources

Successful proposals will demonstrate innovative approaches, technical feasibility, and potential for commercialization and scalability.`,
  eligibleApplicants: [
    'Public and State controlled institutions of higher education',
    'Private institutions of higher education',
    'Nonprofit organizations with 501(c)(3) status',
    'Small businesses',
    'For profit organizations other than small businesses'
  ],
  categories: ['Energy', 'Research', 'Climate', 'Technology', 'Sustainability'],
  additionalInfoUrl: 'https://www.energy.gov/grants',
  grantorContactName: 'Dr. Jane Smith',
  grantorContactEmail: 'jane.smith@energy.gov',
  grantorContactPhone: '(202) 555-1234'
};

export default function GrantDetail({ params }: { params: { grantId: string } }) {
  const { grantId } = params;
  
  // In a real application, we would fetch the grant data based on the grantId
  const grant = mockGrant;
  
  // Format dates
  const formattedCloseDate = new Date(grant.closeDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedPostDate = new Date(grant.postDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Calculate days remaining
  const today = new Date();
  const closeDate = new Date(grant.closeDate);
  const daysRemaining = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
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
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Save Grant
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Apply Now
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {grant.categories.map((category, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
              >
                {category}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Agency:</span> {grant.agency} ({grant.agencyCode})
            </div>
            <div>
              <span className="font-medium text-gray-700">Opportunity ID:</span> {grant.opportunity_id}
            </div>
            <div>
              <span className="font-medium text-gray-700">Opportunity Number:</span> {grant.opportunity_number}
            </div>
          </div>
        </div>
        
        {/* Grant Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="prose max-w-none">
                {grant.description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Eligible Applicants</h2>
              <ul className="list-disc pl-5 space-y-1">
                {grant.eligibleApplicants.map((applicant, index) => (
                  <li key={index}>{applicant}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span> {grant.grantorContactName}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span> {grant.grantorContactEmail}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span> {grant.grantorContactPhone}
                </div>
                <div className="pt-2">
                  <a 
                    href={grant.additionalInfoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Visit Agency Website
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Key Information</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Posted Date</div>
                  <div>{formattedPostDate}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Close Date</div>
                  <div className="font-medium">{formattedCloseDate}</div>
                  <div className={`text-sm ${daysRemaining < 30 ? 'text-red-600' : 'text-orange-600'}`}>
                    {daysRemaining} days remaining
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Funding</div>
                  <div>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(grant.fundingAmount)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Award Range</div>
                  <div>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(grant.awardFloor)} - {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(grant.awardCeiling)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Cost Sharing Required</div>
                  <div>{grant.costSharing ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="space-y-3">
                <a 
                  href={`https://www.grants.gov/web/grants/view-opportunity.html?oppId=${grant.opportunity_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply on Grants.gov
                </a>
                
                <button className="block w-full bg-white border border-blue-600 text-blue-600 text-center px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
                  Save Grant
                </button>
                
                <button className="block w-full bg-white border border-gray-300 text-gray-700 text-center px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                  Share Grant
                </button>
                
                <button className="block w-full bg-white border border-red-600 text-red-600 text-center px-4 py-2 rounded-md hover:bg-red-50 transition-colors">
                  Ignore Grant
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Similar Grants */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Similar Grants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-blue-600 mb-2">Sustainable Energy Research Initiative</h3>
              <p className="text-sm text-gray-600 mb-2">Department of Energy</p>
              <p className="text-xs text-gray-500">Deadline: July 15, 2025</p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-blue-600 mb-2">Climate Innovation Research Program</h3>
              <p className="text-sm text-gray-600 mb-2">Environmental Protection Agency</p>
              <p className="text-xs text-gray-500">Deadline: August 30, 2025</p>
            </div>
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-blue-600 mb-2">Advanced Energy Systems Development</h3>
              <p className="text-sm text-gray-600 mb-2">Department of Energy</p>
              <p className="text-xs text-gray-500">Deadline: September 10, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}