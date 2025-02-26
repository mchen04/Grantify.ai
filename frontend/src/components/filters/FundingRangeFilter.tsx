import React from 'react';
import { MAX_FUNDING } from '@/utils/constants';

interface FundingRangeFilterProps {
  fundingMin: number;
  fundingMax: number;
  includeFundingNull: boolean;
  onlyNoFunding: boolean;
  setFundingMin: (value: number) => void;
  setFundingMax: (value: number) => void;
  handleFundingOptionChange: (option: 'include' | 'only', checked: boolean) => void;
}

/**
 * Funding range filter component with sliders and checkboxes
 */
const FundingRangeFilter: React.FC<FundingRangeFilterProps> = ({
  fundingMin,
  fundingMax,
  includeFundingNull,
  onlyNoFunding,
  setFundingMin,
  setFundingMax,
  handleFundingOptionChange
}) => {
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

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Funding Range: {formatCurrency(fundingMin)} - {formatCurrency(fundingMax)}
      </label>
      <div className="mt-4 px-2">
        <input
          type="range"
          min="0"
          max={MAX_FUNDING}
          step="50000"
          value={fundingMin}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value <= fundingMax) {
              setFundingMin(value);
            }
          }}
          disabled={onlyNoFunding}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${onlyNoFunding ? 'opacity-50' : ''}`}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0</span>
          <span>$5M+</span>
        </div>
      </div>
      <div className="mt-2 px-2">
        <input
          type="range"
          min="0"
          max={MAX_FUNDING}
          step="50000"
          value={fundingMax}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value >= fundingMin) {
              setFundingMax(value);
            }
          }}
          disabled={onlyNoFunding}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${onlyNoFunding ? 'opacity-50' : ''}`}
        />
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="include-no-funding"
            checked={includeFundingNull}
            onChange={(e) => handleFundingOptionChange('include', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="include-no-funding" className="ml-2 block text-sm text-gray-700">
            Include grants with no funding specified
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="only-no-funding"
            checked={onlyNoFunding}
            onChange={(e) => handleFundingOptionChange('only', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="only-no-funding" className="ml-2 block text-sm text-gray-700">
            Only show grants with no funding specified
          </label>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              setFundingMin(0);
              setFundingMax(MAX_FUNDING);
            }}
            disabled={onlyNoFunding}
            className={`text-xs text-blue-600 hover:text-blue-800 ${onlyNoFunding ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Reset Range
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundingRangeFilter;