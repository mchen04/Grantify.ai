import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  onSubmit
}) => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-2">
          Find Your Perfect Grant
        </h1>
        <p className="text-lg text-gray-600">
          Search through thousands of grants tailored to your needs
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative">
        {/* Search icon */}
        <div className="search-icon">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search by keyword, category, or funding amount..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Search button */}
        <button
          type="submit"
          className="absolute right-2 top-2 btn-primary py-2"
        >
          Search
        </button>
      </form>

      {/* Search tips */}
      <div className="mt-3 flex items-center justify-center space-x-4 text-sm text-gray-500">
        <span>Popular searches:</span>
        <button 
          onClick={() => setSearchTerm("research")}
          className="hover:text-primary-600 transition-colors"
        >
          Research
        </button>
        <button 
          onClick={() => setSearchTerm("technology")}
          className="hover:text-primary-600 transition-colors"
        >
          Technology
        </button>
        <button 
          onClick={() => setSearchTerm("education")}
          className="hover:text-primary-600 transition-colors"
        >
          Education
        </button>
      </div>
    </div>
  );
};

export default SearchBar;