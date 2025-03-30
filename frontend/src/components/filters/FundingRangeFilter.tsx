import React, { useRef, useEffect, useState } from 'react';
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
 * Funding range filter component with a dual-handle slider and checkboxes
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
  const rangeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  
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

  // Calculate percentage for positioning handles
  const minPercentage = (fundingMin / MAX_FUNDING) * 100;
  const maxPercentage = (fundingMax / MAX_FUNDING) * 100;

  // Handle mouse/touch events for slider interaction
  useEffect(() => {
    if (!isDragging || !rangeRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!rangeRef.current) return;
      
      const rect = rangeRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const offsetX = clientX - rect.left;
      const percentage = Math.min(Math.max(0, offsetX / rect.width), 1);
      
      // Round to nearest step (50000)
      const value = Math.round((percentage * MAX_FUNDING) / 50000) * 50000;
      
      if (isDragging === 'min') {
        if (value <= fundingMax) {
          setFundingMin(value);
        }
      } else if (isDragging === 'max') {
        if (value >= fundingMin) {
          setFundingMax(value);
        }
      }
    };

    const handleEnd = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, fundingMin, fundingMax, setFundingMin, setFundingMax]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Funding Range: {formatCurrency(fundingMin)} - {formatCurrency(fundingMax)}
      </label>
      <div className="mt-4 px-2">
        <div
          ref={rangeRef}
          className={`relative w-full h-2 bg-gray-200 rounded-lg ${onlyNoFunding ? 'opacity-50' : ''}`}
        >
          {/* Selected range highlight */}
          <div
            className="absolute h-full bg-blue-500 rounded-lg"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
          
          {/* Minimum handle */}
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoFunding ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={() => !onlyNoFunding && setIsDragging('min')}
            onTouchStart={() => !onlyNoFunding && setIsDragging('min')}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={MAX_FUNDING}
            aria-valuenow={fundingMin}
            aria-label="Minimum funding amount"
            tabIndex={0}
          />
          
          {/* Maximum handle */}
          <div
            className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -mt-1 -ml-2 cursor-pointer shadow-md ${onlyNoFunding ? 'cursor-not-allowed' : ''}`}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={() => !onlyNoFunding && setIsDragging('max')}
            onTouchStart={() => !onlyNoFunding && setIsDragging('max')}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={MAX_FUNDING}
            aria-valuenow={fundingMax}
            aria-label="Maximum funding amount"
            tabIndex={0}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span>$0</span>
          <span>$5M+</span>
        </div>
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