import React from 'react';
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
  onApply: (grantId: string) => void;
  onSave: (grantId: string) => Promise<void>;
  onShare: (grantId: string) => Promise<void>;
  onIgnore: (grantId: string) => Promise<void>;
}

const SearchResults: React.FC<SearchResultsProps> = ({
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
  onIgnore
}) => {
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
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      ) : grants.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-2">No grants found matching your criteria.</p>
          <p className="text-sm text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        /* Grant cards grid - 2x3 layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              onApply={() => onApply(grant.id)}
              onSave={() => onSave(grant.id)}
              onShare={() => onShare(grant.id)}
              onIgnore={() => onIgnore(grant.id)}
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && grants.length > 0 && (
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
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className={`p-2 rounded-md ${
                page === totalPages 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-primary-600'
              }`}
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default SearchResults;