// Grant type definitions
export interface Grant {
  id: string;
  title: string;
  agency_name: string;
  agency_code?: string;
  opportunity_id?: string;
  opportunity_number?: string;
  close_date: string | null;
  post_date: string | null;
  total_funding?: number | null;
  award_ceiling: number | null;
  award_floor?: number | null;
  description: string;
  activity_category: string[];
  funding_type?: string | null;
  eligible_applicants?: string[] | null;
  cost_sharing: boolean;
  additional_info_url?: string | null;
  grantor_contact_name?: string | null;
  grantor_contact_email?: string | null;
  grantor_contact_phone?: string | null;
  processing_status?: 'processed' | 'not_processed';
  source?: string;
  interactions?: Array<{
    action: 'saved' | 'applied' | 'ignored';
    timestamp: string;
  }> | null;
  match_score?: number;
}

export interface GrantFilter {
  searchTerm: string;
  sources: string[];
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
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ScoredGrant extends Grant {
  matchScore?: number;
}

export interface SimilarGrant {
  id: string;
  title: string;
  agency: string;
  deadline: string;
}