"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import GrantCard from '@/components/GrantCard';
import { Grant } from '@/types/grant';

interface SearchResultsProps {
  grants: Grant[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  grantsPerPage: number;
  goToPage: (page: number) => void;
  onApply: (grantId: string) => Promise<void>;
  onSave: (grantId: string) => Promise<void>;
  onShare: (grantId: string) => Promise<void>;
  onIgnore: (grantId: string) => Promise<void>;
  onConfirmApply?: (grantId: string) => Promise<void>;
}

// Define the ref type
export interface SearchResultsRef {
  fadeAndRemoveCard: (grantId: string) => Promise<void>;
}

/**
 * Component to display search results with pagination
 */
const SearchResults = forwardRef<SearchResultsRef, SearchResultsProps>(({
  grants,
  loading,
  error,
  page,
  totalPages,
  grantsPerPage,
  goToPage,
  onApply,
  onSave,
  onShare,
  onIgnore,
  onConfirmApply
}, ref) => {
  const [fadingGrants, setFadingGrants] = useState<Set<string>>(new Set());

  /**
   * Handle interactions that should immediately fade the card (save, ignore)
   */
  const handleInteraction = async (grantId: string, action: () => Promise<void>) => {
    setFadingGrants(prev => new Set([...prev, grantId]));
    
    try {
      await action();
      // Wait for fade animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      // If there's an error, remove the fading state
      setFadingGrants(prev => {
        const newSet = new Set(prev);
        newSet.delete(grantId);
        return newSet;
      });
    }
  };

  /**
   * Special handler for apply button that doesn't fade the card immediately
   */
  const handleApplyClick = (grantId: string) => {
    // Just call the onApply callback without fading the card
    onApply(grantId);
  };

  /**
   * Function to fade and remove a card after user confirmation
   */
  const fadeAndRemoveCard = async (grantId: string) => {
    setFadingGrants(prev => new Set([...prev, grantId]));
    
    // Wait for fade animation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Call the onConfirmApply callback if provided
    if (onConfirmApply) {
      await onConfirmApply(grantId);
    }
  };

  // Expose the fadeAndRemoveCard function to parent components
  useImperativeHandle(
    ref,
    () => ({
      fadeAndRemoveCard
    }),
    [fadeAndRemoveCard]
  );

  /**
   * Render pagination controls
   */
  const renderPagination = () => {
    if (loading || grants.length === 0) return null;

    return (
      <div className="mt-8 flex justify-center">
        <nav className="flex items-center space-x-1">
          <button 
            className={`p-2 rounded-md ${
              page === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-primary-600'
            }`}
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {renderPageNumbers()}
          
          <button 
            className={`p-2 rounded-md ${
              page === totalPages 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-primary-600'
            }`}
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    );
  };

  /**
   * Calculate and render page number buttons
   */
  const renderPageNumbers = () => {
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
          className={`px-3 py-1.5 text-sm rounded-md ${
            page === pageNum
              ? 'bg-primary-50 text-primary-600 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => goToPage(pageNum)}
          aria-label={`Page ${pageNum}`}
          aria-current={page === pageNum ? 'page' : undefined}
        >
          {pageNum}
        </button>
      );
    });
  };

  /**
   * Render the appropriate content based on loading/error/empty states
   */
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      );
    }
    
    if (grants.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-2">No grants found matching your criteria.</p>
          <p className="text-sm text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
        {grants.map((grant) => (
          <div
            key={grant.id}
            className={`transition-opacity duration-300 h-full ${
              fadingGrants.has(grant.id) ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <GrantCard
              id={grant.id}
              title={grant.title}
              agency={grant.agency_name}
              closeDate={grant.close_date}
              fundingAmount={grant.award_ceiling}
              description={grant.description}
              categories={grant.activity_category || []}
              onApply={() => handleApplyClick(grant.id)}
              onSave={() => handleInteraction(grant.id, () => onSave(grant.id))}
              onShare={() => onShare(grant.id)}
              onIgnore={() => handleInteraction(grant.id, () => onIgnore(grant.id))}
              isApplied={grant.interactions?.[0]?.action === 'applied'}
              isIgnored={grant.interactions?.[0]?.action === 'ignored'}
              isSaved={grant.interactions?.[0]?.action === 'saved'}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Results header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Available Grants</h2>
          {!loading && grants.length > 0 && (
            <span className="text-sm text-gray-500">
              Showing {grants.length} of {(totalPages * grantsPerPage) > grantsPerPage ? `${totalPages * grantsPerPage}+` : totalPages * grantsPerPage} grants
            </span>
          )}
        </div>
      </div>
      
      {/* Main content */}
      {renderContent()}
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
});

// Add display name for debugging
SearchResults.displayName = 'SearchResults';

export default SearchResults;