"use client";

import React, { useState } from 'react';

interface DashboardSearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  placeholder?: string;
}

const DashboardSearchBar: React.FC<DashboardSearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  placeholder = 'Search grants...'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Common search terms for quick filtering
  const quickSearchTerms = [
    'Research', 'Education', 'Health', 'Arts & Culture', 'Environment', 'Community Development', 'Economic Development', 'Infrastructure', 'Social Services', 'Technology', 'International Aid', 'Youth Programs', 'Animal Welfare', 'Human Rights', 'Operating Support', 'Miscellaneous'
  ];

  // Clear search term
  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className="mb-4">
      <div className={`relative transition-all duration-200 ${isFocused ? 'ring-2 ring-primary-500 rounded-lg' : ''}`}>
        <input
          type="text"
          className="w-full p-3 pl-10 pr-10 border rounded-lg focus:outline-none focus:border-primary-500 shadow-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      
      {/* Quick search terms */}
      <div className="flex flex-wrap gap-2 mt-2">
        {quickSearchTerms.map(term => (
          <button
            key={term}
            onClick={() => setSearchTerm(term)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              searchTerm === term
                ? 'bg-primary-100 text-primary-800 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardSearchBar;