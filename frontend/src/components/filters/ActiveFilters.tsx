import React from 'react';
import { GrantFilter } from '@/types/grant';
import { MAX_FUNDING, MIN_DEADLINE_DAYS, MAX_DEADLINE_DAYS } from '@/utils/constants';

interface ActiveFiltersProps {
  filter: GrantFilter;
}

/**
 * Component to display active filters as badges
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
      !filter.includeFundingNull || 
      filter.onlyNoFunding || 
      filter.deadlineMinDays > MIN_DEADLINE_DAYS || 
      filter.deadlineMaxDays < MAX_DEADLINE_DAYS || 
      !filter.includeNoDeadline || 
      filter.onlyNoDeadline || 
      filter.costSharing !== ''
    );
  };

  if (!hasActiveFilters()) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-md">
      <div className="text-sm font-medium text-gray-700 mb-2">Active Filters:</div>
      <div className="flex flex-wrap gap-2">
        {filter.agencies.length > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {filter.agencies.length} Agencies
          </span>
        )}
        {filter.onlyNoFunding ? (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Only No Funding Specified
          </span>
        ) : (
          <>
            {(filter.fundingMin > 0 || filter.fundingMax < MAX_FUNDING) && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Funding: {formatCurrency(filter.fundingMin)} - {formatCurrency(filter.fundingMax)}
              </span>
            )}
            {!filter.includeFundingNull && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Exclude No Funding
              </span>
            )}
          </>
        )}
        {filter.onlyNoDeadline ? (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Only No Deadline
          </span>
        ) : (
          <>
            {(filter.deadlineMinDays > MIN_DEADLINE_DAYS || filter.deadlineMaxDays < MAX_DEADLINE_DAYS) && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Deadline: {formatDeadlineText(filter.deadlineMinDays)} - {formatDeadlineText(filter.deadlineMaxDays)}
              </span>
            )}
            {!filter.includeNoDeadline && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Exclude No Deadline
              </span>
            )}
          </>
        )}
        {filter.costSharing && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Cost Sharing: {filter.costSharing === 'required' ? 'Required' : 'Not Required'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;