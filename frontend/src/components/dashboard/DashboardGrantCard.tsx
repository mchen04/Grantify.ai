"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import GrantCard from '@/components/GrantCard';

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
  onConfirmApply?: () => Promise<void>;
}

// Define the ref type
export interface DashboardGrantCardRef {
  fadeAndRemoveCard: () => Promise<void>;
}

const DashboardGrantCard = forwardRef<DashboardGrantCardRef, DashboardGrantCardProps>((props, ref) => {
  const [fading, setFading] = useState(false);

  // Function to fade out the card
  const fadeAndRemoveCard = async () => {
    setFading(true);
    
    // Wait for fade animation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Call the onConfirmApply callback if provided
    if (props.onConfirmApply) {
      await props.onConfirmApply();
    }
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
    <div className={`transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <GrantCard {...props} />
    </div>
  );
});

// Add display name for debugging
DashboardGrantCard.displayName = 'DashboardGrantCard';

export default DashboardGrantCard;