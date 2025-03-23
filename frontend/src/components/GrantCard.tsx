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
  onSave?: () => void;
  onApply?: () => void;
  onShare?: () => void;
  onIgnore?: () => void;
  isApplied?: boolean;
  isIgnored?: boolean;
}

const GrantCard: React.FC<GrantCardProps> = ({
  id,
  title,
  agency,
  closeDate,
  fundingAmount,
  description,
  categories,
  onSave,
  onApply,
  onShare,
  onIgnore,
  isApplied,
  isIgnored
}) => {
  const formattedDate = closeDate 
    ? new Date(closeDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'No deadline specified';
  
  const daysRemaining = closeDate 
    ? Math.ceil((new Date(closeDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const formattedAmount = fundingAmount 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(fundingAmount)
    : 'Not specified';
  
  const truncatedDescription = description?.length > 150
    ? `${description.substring(0, 150)}...`
    : description || 'No description available';

  return (
    <div className={`grant-card p-4 ${isIgnored ? 'opacity-70' : ''}`}>
      <div className="flex flex-col h-full">
        {/* Header with action buttons */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/grants/${id}`}
              className="grant-card-title text-lg mb-1 block hover:text-primary-600 transition-colors line-clamp-2 max-h-[3.5rem]"
              title={title}
            >
              {title}
            </Link>
            <div className="flex items-center text-sm text-gray-600">
              <span className="truncate">{agency}</span>
              <span className="mx-2">•</span>
              <span className="font-medium text-primary-600 whitespace-nowrap">{formattedAmount}</span>
            </div>
          </div>

          {/* Action buttons in top right */}
          <div className="flex items-start gap-1 flex-shrink-0">
            {/* Apply on Grants.gov */}
            {onApply && !isApplied && !isIgnored && (
              <button 
                className="p-1.5 text-gray-400 hover:text-green-600 transition-colors group relative"
                title="Apply on Grants.gov"
                onClick={onApply}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="absolute top-full right-0 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Apply on Grants.gov
                </span>
              </button>
            )}
            
            {/* Save Grant */}
            {onSave && !isApplied && !isIgnored && (
              <button 
                className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors group relative"
                title="Save Grant"
                onClick={onSave}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="absolute top-full right-0 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Save Grant
                </span>
              </button>
            )}
            
            {/* Share Grant */}
            {onShare && !isIgnored && (
              <button 
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors group relative"
                title="Share Grant"
                onClick={onShare}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="absolute top-full right-0 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Share Grant
                </span>
              </button>
            )}
            
            {/* Ignore Grant */}
            {onIgnore && !isApplied && !isIgnored && (
              <button 
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors group relative"
                title="Ignore Grant"
                onClick={onIgnore}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="absolute top-full right-0 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Ignore Grant
                </span>
              </button>
            )}
            
            {(isApplied || isIgnored) && (
              <span className={`text-sm font-medium ${
                isApplied ? 'text-green-600' : 'text-red-600'
              }`}>
                {isApplied ? 'Applied' : 'Ignored'}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {truncatedDescription}
        </p>

        {/* Footer */}
        <div className="mt-auto">
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {categories?.slice(0, 3).map((category, index) => (
              <span key={index} className="grant-tag text-xs px-2 py-0.5">
                {category}
              </span>
            ))}
            {categories?.length > 3 && (
              <span className="text-xs text-gray-500">
                +{categories.length - 3} more
              </span>
            )}
          </div>

          {/* Deadline */}
          <div className="flex items-center text-sm">
            <span className="text-gray-500">Deadline:</span>
            <span className={`ml-1.5 ${
              daysRemaining !== null && daysRemaining < 30 ? 'text-red-600' : 
              daysRemaining !== null && daysRemaining < 60 ? 'text-orange-600' : 
              'text-green-600'
            }`}>
              {daysRemaining !== null ? `${daysRemaining} days left` : 'Open-ended'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrantCard;