import React, { useState, useEffect } from 'react';
import { debounce } from '@/utils/debounce';

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
  // Local state for immediate UI updates
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Create a debounced version of setSearchTerm
  const debouncedSetSearchTerm = React.useMemo(
    () => debounce((value: string) => {
      setSearchTerm(value);
    }, 300), // 300ms delay
    [setSearchTerm]
  );

  // Update localSearchTerm when searchTerm prop changes (e.g. from parent clear action)
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  return (
    <div className="pt-8 pb-4 px-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-2">
          Find Your Perfect Grant
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Search through thousands of grants tailored to your needs
        </p>
      </div>

      <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
        <div className="relative flex items-center">
          {/* Search icon */}
          <div className="absolute left-4 text-gray-400">
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
            className="w-full py-3 pl-12 pr-20 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={localSearchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setLocalSearchTerm(value); // Update local state immediately
              debouncedSetSearchTerm(value); // Debounce the update to parent state
            }}
          />

          {/* Search button */}
          <button
            type="submit"
            className="absolute right-1.5 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-full transition-colors"
          >
            Search
          </button>
        </div>

        {/* Popular searches */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
          <span>Popular:</span>
          {["Research", "Education", "Health", "Arts & Culture", "Environment", "Community Development", "Economic Development", "Infrastructure", "Social Services", "Technology", "International Aid", "Youth Programs", "Animal Welfare", "Human Rights", "Operating Support", "Miscellaneous"].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                const value = term.toLowerCase();
                setLocalSearchTerm(value);
                setSearchTerm(value); // Immediate update for popular search
                // Create a mock event object with preventDefault method
                const mockEvent = {
                  preventDefault: () => {}
                };
                onSubmit(mockEvent as React.FormEvent);
              }}
              className="hover:text-primary-600 hover:underline transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default SearchBar;