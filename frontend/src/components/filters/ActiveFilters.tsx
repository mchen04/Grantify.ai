import React from 'react';
import { GrantFilter } from '@/types/grant';
import { MAX_FUNDING, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '@/utils/constants';

interface ActiveFiltersProps {
  filter: GrantFilter;
}

/**
 * Component to display active filters as badges with clear functionality
 */
const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filter }) => {
  // Format currency for display
  const formatCurrency = (amount: number) => {
    if (amount === MAX_FUNDING) {
      return "$5M+";
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format deadline display
  const formatDeadlineText = (days: number) => {
    if (days === MAX_DEADLINE_DAYS) {
      return "1 year+";
    } else if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "1 day";
    } else if (days === 7) {
      return "1 week";
    } else if (days === 30) {
      return "1 month";
    } else if (days === 90) {
      return "3 months";
    } else if (days === 180) {
      return "6 months";
    } else {
      return `${days} days`;
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filter.agencies.length > 0 ||
      filter.fundingMin > 0 ||
      filter.fundingMax < MAX_FUNDING ||
      filter.onlyNoFunding ||
      filter.deadlineMinDays > MIN_DEADLINE_DAYS ||
      filter.deadlineMaxDays < MAX_DEADLINE_DAYS ||
      filter.onlyNoDeadline ||
      filter.costSharing !== '' ||
      filter.sortBy !== 'relevance'
    );
  };

  if (!hasActiveFilters()) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {filter.agencies.length > 0 && (
          <span className="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
            {filter.agencies.length === 1
              ? filter.agencies[0].split(' ').pop() // Show just the last word of the agency name
              : `${filter.agencies.length} Agencies`}
          </span>
        )}
        
        {filter.onlyNoFunding ? (
          <span className="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
            No Funding Specified
          </span>
        ) : (
          <>
            {(filter.fundingMin > 0 || filter.fundingMax < MAX_FUNDING) && (
              <span className="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                {formatCurrency(filter.fundingMin)} - {formatCurrency(filter.fundingMax)}
              </span>
            )}
          </>
        )}
        
        {filter.onlyNoDeadline ? (
          <span className="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
            No Deadline
          </span>
        ) : (
          <>
            {(filter.deadlineMinDays > MIN_DEADLINE_DAYS || filter.deadlineMaxDays < MAX_DEADLINE_DAYS) && (
              <span className="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                Due: {formatDeadlineText(filter.deadlineMinDays)} - {formatDeadlineText(filter.deadlineMaxDays)}
              </span>
            )}
          </>
        )}
        
        {filter.costSharing && (
          <span className="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
            Cost Sharing: {filter.costSharing === 'required' ? 'Required' : 'Not Required'}
          </span>
        )}
        
        {filter.sortBy !== 'relevance' && (
          <span className="bg-primary-100 text-primary-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
            Sort: {filter.sortBy === 'recent' ? 'Recently Added' :
                  filter.sortBy === 'deadline' ? 'Deadline (Soonest)' :
                  filter.sortBy === 'deadline_latest' ? 'Deadline (Latest)' :
                  filter.sortBy === 'amount' ? 'Funding (Highest)' :
                  filter.sortBy === 'amount_asc' ? 'Funding (Lowest)' :
                  filter.sortBy === 'title_asc' ? 'Title (A-Z)' :
                  filter.sortBy === 'title_desc' ? 'Title (Z-A)' :
                  'Custom'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;