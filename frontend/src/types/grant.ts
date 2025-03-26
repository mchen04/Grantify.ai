// Grant type definitions
export interface Grant {
  id: string;
  title: string;
  agency_name: string;
  close_date: string | null;
  post_date: string | null;
  award_ceiling: number | null;
  description: string;
  activity_category: string[];
  funding_type: string;
  eligible_applicants: string[];
  cost_sharing: boolean;
  match_score?: number;
  interactions?: Array<{
    action: 'saved' | 'applied' | 'ignored';
    timestamp: string;
  }> | null;
}

export interface GrantFilter {
  searchTerm: string;
  agencies: string[];
  fundingMin: number;
  fundingMax: number;
  includeFundingNull: boolean;
  onlyNoFunding: boolean;
  deadlineMinDays: number;
  deadlineMaxDays: number;
  includeNoDeadline: boolean;
  onlyNoDeadline: boolean;
  costSharing: string;
  sortBy: string;
  page: number;
  showSaved: boolean;
  showApplied: boolean;
  showIgnored: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}