"use client";

import React from 'react';
import Link from 'next/link';

interface GrantCardProps {
  id: string;
  title: string;
  agency: string;
  closeDate: string | null;
  fundingAmount: number | null;
  description: string;
  categories: string[];
}

const GrantCard: React.FC<GrantCardProps> = ({
  id,
  title,
  agency,
  closeDate,
  fundingAmount,
  description,
  categories
}) => {
  // Format date
  const formattedDate = closeDate 
    ? new Date(closeDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'No deadline specified';

  // Format funding amount
  const formattedAmount = fundingAmount 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(fundingAmount)
    : 'Not specified';

  // Truncate description
  const truncatedDescription = description.length > 150
    ? `${description.substring(0, 150)}...`
    : description;

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 bg-white">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold text-blue-700 mb-2">{title}</h3>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {agency}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{truncatedDescription}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category, index) => (
          <span 
            key={index} 
            className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded"
          >
            {category}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <div>
          <span className="font-medium">Deadline:</span> {formattedDate}
        </div>
        <div>
          <span className="font-medium">Funding:</span> {formattedAmount}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <Link 
          href={`/grants/${id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details
        </Link>
        
        <div className="flex space-x-2">
          <button 
            className="text-gray-500 hover:text-blue-600 transition-colors"
            title="Save Grant"
            onClick={() => console.log('Save grant:', id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          
          <button 
            className="text-gray-500 hover:text-green-600 transition-colors"
            title="Mark as Applied"
            onClick={() => console.log('Apply for grant:', id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <button 
            className="text-gray-500 hover:text-red-600 transition-colors"
            title="Ignore Grant"
            onClick={() => console.log('Ignore grant:', id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrantCard;