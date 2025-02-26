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
}

/**
 * Search results component that displays grants, loading state, errors, and pagination
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  grants,
  loading,
  error,
  page,
  totalPages,
  grantsPerPage,
  goToPage
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Search Results</h2>
        {!loading && grants.length > 0 && (
          <div className="text-gray-600">
            Showing {grants.length} of {(totalPages * grantsPerPage) > grantsPerPage ? `${totalPages * grantsPerPage}+` : totalPages * grantsPerPage} grants
          </div>
        )}
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
  );
};

export default SearchResults;