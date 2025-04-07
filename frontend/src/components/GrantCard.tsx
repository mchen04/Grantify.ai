"use client";

import React from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate, truncateText } from '@/utils/formatters';
import ActionButton from '@/components/grant/ActionButton';
import GrantCardIcons from '@/components/grant/GrantCardIcons';
import GrantCardFooter from '@/components/grant/GrantCardFooter';

interface GrantCardProps {
  id: string;
  title: string;
  agency: string;
  closeDate: string | null;
  fundingAmount: number | null;
  description: string;
  categories: string[];
  onSave?: () => void;
  onApply?: () => void;
  onShare?: () => void;
  onIgnore?: () => void;
  isApplied?: boolean;
  isIgnored?: boolean;
  isSaved?: boolean;
  linkParams?: string; // Query parameters for the grant detail link
}

/**
 * Card component for displaying grant information
 */
const GrantCard: React.FC<GrantCardProps> = ({
  id,
  title,
  agency,
  closeDate,
  fundingAmount,
  description,
  categories,
  onSave,
  onApply,
  onShare,
  onIgnore,
  isApplied = false,
  isIgnored = false,
  isSaved = false,
  linkParams
}) => {
  const formattedAmount = formatCurrency(fundingAmount);
  const truncatedDescription = truncateText(description, 150);

  const handleApplyClick = () => {
    // If already applied, just call the original handler
    if (isApplied) {
      onApply?.();
      return;
    }
    
    // Open the application link in a new tab
    window.open(`https://www.grants.gov/view-grant.html?oppId=${id}`, '_blank');
    
    // Call the onApply handler which will show the confirmation popup
    onApply?.();
  };

  return (
    <div className="grant-card p-4 transition-opacity duration-300 ease-in-out h-full">
      <div className="flex flex-col h-full">
        {/* Header with action buttons */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/grants/${id.split('?')[0]}${linkParams || '?from=search'}`}
              className="grant-card-title text-lg mb-1 block hover:text-primary-600 transition-colors line-clamp-2 h-[3.5rem]"
              title={title}
            >
              {title}
            </Link>
            <div className="flex items-center text-sm text-gray-600 h-5">
              <span className="truncate">{agency}</span>
              <span className="mx-2">•</span>
              <span className="font-medium text-primary-600 whitespace-nowrap">{formattedAmount}</span>
            </div>
          </div>

          {/* Action buttons in top right */}
          <div className="flex items-start gap-1 flex-shrink-0">
            {/* Save Grant */}
            <ActionButton
              onClick={onSave}
              isActive={isSaved}
              activeColor="text-primary-600"
              inactiveColor="text-gray-400"
              hoverColor="text-primary-600"
              title={isSaved ? "Unsave Grant" : "Save Grant"}
              icon={<GrantCardIcons.Save fill={isSaved} />}
            />

            {/* Ignore Grant */}
            <ActionButton
              onClick={onIgnore}
              isActive={isIgnored}
              activeColor="text-red-600"
              inactiveColor="text-gray-400"
              hoverColor="text-red-600"
              title={isIgnored ? "Unignore Grant" : "Ignore Grant"}
              icon={<GrantCardIcons.Ignore fill={isIgnored} />}
            />

            {/* Apply on Grants.gov */}
            <ActionButton
              onClick={handleApplyClick}
              isActive={isApplied}
              activeColor="text-green-600"
              inactiveColor="text-gray-400"
              hoverColor="text-green-600"
              title={isApplied ? "Unapply Grant" : "Apply on Grants.gov"}
              icon={<GrantCardIcons.Apply fill={isApplied} />}
            />

            {/* Share Grant */}
            <ActionButton
              onClick={onShare}
              isActive={false}
              activeColor="text-blue-600"
              inactiveColor="text-gray-400"
              hoverColor="text-blue-600"
              title="Share Grant"
              icon={<GrantCardIcons.Share />}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-[2.5rem]">
          {truncatedDescription}
        </p>

        {/* Footer */}
        <GrantCardFooter 
          categories={categories} 
          closeDate={closeDate} 
        />
      </div>
    </div>
  );
};

export default GrantCard;