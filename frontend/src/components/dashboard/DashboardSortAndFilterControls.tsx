"use client";

import React, { useState } from 'react';
import { SelectOption } from '@/types/grant';

interface DashboardSortAndFilterControlsProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOptions: SelectOption[];
  resetFilters?: () => void;
  filterOnlyNoDeadline?: boolean;
  setFilterOnlyNoDeadline?: (value: boolean) => void;
  filterOnlyNoFunding?: boolean;
  setFilterOnlyNoFunding?: (value: boolean) => void;
}

/**
 * Enhanced component for sort controls in dashboard tabs
 */
const DashboardSortAndFilterControls: React.FC<DashboardSortAndFilterControlsProps> = ({
  sortBy,
  setSortBy,
  sortOptions,
  resetFilters,
  filterOnlyNoDeadline = false,
  setFilterOnlyNoDeadline,
  filterOnlyNoFunding = false,
  setFilterOnlyNoFunding
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group sort options by type
  const deadlineOptions = sortOptions.filter(option =>
    option.value.includes('deadline') || option.label.includes('Deadline')
  );
  
  const fundingOptions = sortOptions.filter(option =>
    option.value.includes('amount') || option.label.includes('Funding') || option.label.includes('Amount')
  );
  
  const titleOptions = sortOptions.filter(option =>
    option.value.includes('title') || option.label.includes('Title')
  );
  
  const otherOptions = sortOptions.filter(option =>
    !option.value.includes('deadline') &&
    !option.value.includes('amount') &&
    !option.value.includes('title') &&
    !option.label.includes('Deadline') &&
    !option.label.includes('Funding') &&
    !option.label.includes('Amount') &&
    !option.label.includes('Title')
  );

  // Get current sort option label
  const currentSortLabel = sortOptions.find(option => option.value === sortBy)?.label || 'Sort';

  return (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      <div className="relative">
        {/* Sort dropdown button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
          </svg>
          <span>Sort: {currentSortLabel}</span>
          <svg className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-2">
              {otherOptions.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    General
                  </div>
                  {otherOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                        sortBy === option.value
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              
              {deadlineOptions.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    By Deadline
                  </div>
                  {deadlineOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                        sortBy === option.value
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              
              {fundingOptions.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    By Funding
                  </div>
                  {fundingOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                        sortBy === option.value
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              
              {titleOptions.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    By Title
                  </div>
                  {titleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                        sortBy === option.value
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-3 w-full">
        {/* Quick sort buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSortBy('deadline')}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              sortBy === 'deadline'
                ? 'bg-primary-100 text-primary-800 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Closing Soon
          </button>
          <button
            type="button"
            onClick={() => setSortBy('amount')}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              sortBy === 'amount'
                ? 'bg-primary-100 text-primary-800 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Highest Funding
          </button>
          <button
            type="button"
            onClick={() => setSortBy('title_asc')}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              sortBy === 'title_asc'
                ? 'bg-primary-100 text-primary-800 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            A-Z
          </button>
        </div>
        
        {/* Special filters for null values */}
        {setFilterOnlyNoDeadline && setFilterOnlyNoFunding && (
          <div className="flex flex-wrap gap-4 mt-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlyNoDeadline}
                onChange={(e) => setFilterOnlyNoDeadline(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span>Only show grants with no deadline or open-ended deadlines</span>
            </label>
            
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlyNoFunding}
                onChange={(e) => setFilterOnlyNoFunding(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span>Only show grants with no funding specified</span>
            </label>
          </div>
        )}
      </div>
      
      {resetFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};

export default DashboardSortAndFilterControls;