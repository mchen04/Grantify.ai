"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import GrantCard from '@/components/GrantCard';
import { useInteractions } from '@/contexts/InteractionContext';

interface DashboardGrantCardProps {
  id: string;
  title: string;
  agency: string;
  closeDate: string | null;
  fundingAmount: number | null;
  description: string;
  categories: string[];
  onSave: () => void;
  onApply: () => void;
  onShare: () => void;
  onIgnore: () => void;
  isApplied?: boolean;
  isIgnored?: boolean;
  isSaved?: boolean;
  matchScore?: number; // Added match score property
  showMatchScore?: boolean; // Flag to determine if match score should be displayed
  linkParams?: string; // Query parameters for the grant detail link
}

// Define the ref type
export interface DashboardGrantCardRef {
  fadeAndRemoveCard: () => Promise<void>;
}

/**
 * Enhanced GrantCard component for dashboard with fade-out animation capability
 */
const DashboardGrantCard = forwardRef<DashboardGrantCardRef, DashboardGrantCardProps>((props, ref) => {
  const [fading, setFading] = useState(false);
  const { getInteractionStatus } = useInteractions();
  
  // Get the current interaction status from context
  const interactionStatus = getInteractionStatus(props.id);
  
  // Determine interaction states based on context
  const isSaved = interactionStatus === 'saved' || props.isSaved;
  const isApplied = interactionStatus === 'applied' || props.isApplied;
  const isIgnored = interactionStatus === 'ignored' || props.isIgnored;

  // Function to fade out the card
  const fadeAndRemoveCard = async () => {
    setFading(true);
    
    // Wait for fade animation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // No need to call onConfirmApply anymore as parent component handles the state update
  };

  // Expose the fadeAndRemoveCard function to parent components
  useImperativeHandle(
    ref,
    () => ({
      fadeAndRemoveCard
    }),
    [fadeAndRemoveCard]
  );

  return (
    <div className={`transition-opacity duration-300 h-full relative ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <GrantCard
        {...props}
        isSaved={isSaved}
        isApplied={isApplied}
        isIgnored={isIgnored}
        linkParams={props.linkParams}
      />
      {props.showMatchScore && typeof props.matchScore === 'number' && (
        <div className="absolute bottom-2 right-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm z-10">
          {Math.round(props.matchScore)}% match
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
DashboardGrantCard.displayName = 'DashboardGrantCard';

export default DashboardGrantCard;