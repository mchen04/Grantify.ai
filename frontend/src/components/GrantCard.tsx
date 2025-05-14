"use client";

import React from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate, truncateText } from '@/utils/formatters';
import ActionButton from '@/components/grant/ActionButton';
import GrantCardIcons from '@/components/grant/GrantCardIcons';
import GrantCardFooter from '@/components/grant/GrantCardFooter';
import { useInteractions } from '@/contexts/InteractionContext';
import { InteractionStatus } from '@/types/interaction';

interface GrantCardProps {
  id: string;
  title: string;
  agency: string;
  closeDate: string | null;
  fundingAmount: number | null;
  description: string; // This will use description_short from the Grant interface
  categories: string[];
  onSave?: (status: InteractionStatus | null) => void;
  onApply?: (status: InteractionStatus | null) => void;
  onShare?: () => void;
  onIgnore?: (status: InteractionStatus | null) => void;
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
  const { getInteractionStatus, updateUserInteraction } = useInteractions();
  
  // Use the InteractionContext to get the current status
  const interactionStatus = getInteractionStatus(id);
  
  // Use the context status if provided, otherwise fall back to props
  const isAppliedCurrent = interactionStatus === 'applied' || isApplied;
  const isIgnoredCurrent = interactionStatus === 'ignored' || isIgnored;
  const isSavedCurrent = interactionStatus === 'saved' || isSaved;

  const handleApplyClick = () => {
    // If already applied, toggle the status
    if (isAppliedCurrent) {
      updateUserInteraction(id, null);
      onApply?.(null);
      return;
    }
    
    // Open the application link in a new tab
    window.open(`https://www.grants.gov/view-grant.html?oppId=${id}`, '_blank');
    
    // Update the interaction status and call the onApply handler
    updateUserInteraction(id, 'applied');
    onApply?.('applied');
  };

  const handleSaveClick = () => {
    // Toggle the saved status
    const newStatus = isSavedCurrent ? null : 'saved';
    updateUserInteraction(id, newStatus);
    onSave?.(newStatus);
  };

  const handleIgnoreClick = () => {
    // Toggle the ignored status
    const newStatus = isIgnoredCurrent ? null : 'ignored';
    updateUserInteraction(id, newStatus);
    onIgnore?.(newStatus);
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
              onClick={handleSaveClick}
              isActive={isSavedCurrent}
              activeColor="text-primary-600"
              inactiveColor="text-gray-400"
              hoverColor="text-primary-600"
              title={isSavedCurrent ? "Unsave Grant" : "Save Grant"}
              icon={<GrantCardIcons.Save fill={isSavedCurrent} />}
            />

            {/* Ignore Grant */}
            <ActionButton
              onClick={handleIgnoreClick}
              isActive={isIgnoredCurrent}
              activeColor="text-red-600"
              inactiveColor="text-gray-400"
              hoverColor="text-red-600"
              title={isIgnoredCurrent ? "Unignore Grant" : "Ignore Grant"}
              icon={<GrantCardIcons.Ignore fill={isIgnoredCurrent} />}
            />

            {/* Apply on Grants.gov */}
            <ActionButton
              onClick={handleApplyClick}
              isActive={isAppliedCurrent}
              activeColor="text-green-600"
              inactiveColor="text-gray-400"
              hoverColor="text-green-600"
              title={isAppliedCurrent ? "Unapply Grant" : "Apply on Grants.gov"}
              icon={<GrantCardIcons.Apply fill={isAppliedCurrent} />}
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