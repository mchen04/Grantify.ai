// Grant type definitions
export interface Grant {
  id: string;
  title: string;
  agency_name: string;
  agency_code?: string;
  agency_subdivision?: string;
  opportunity_id: string;
  opportunity_number?: string;
  close_date: string | null;
  post_date: string | null;
  loi_due_date?: string | null;
  expiration_date?: string | null;
  earliest_start_date?: string | null;
  total_funding?: number | null;
  award_ceiling: number | null;
  award_floor?: number | null;
  expected_award_count?: number | null;
  project_period_max_years?: number | null;
  description_short: string;
  description_full: string;
  activity_category: string[];
  activity_code?: string;
  grant_type?: string | null;
  eligible_applicants: string[];
  eligibility_pi?: string;
  cost_sharing: boolean;
  source_url: string | null;
  data_source?: string;
  status?: string;
  grantor_contact_name?: string | null;
  grantor_contact_role?: string;
  grantor_contact_email?: string | null;
  grantor_contact_phone?: string | null;
  grantor_contact_affiliation?: string;
  announcement_type?: string;
  clinical_trial_allowed?: boolean;
  additional_notes?: string;
  keywords?: string[];
  category?: string;
  interactions?: Array<{
    action: 'saved' | 'applied' | 'ignored';
    timestamp: string;
  }> | null;
  match_score?: number;
}

export interface GrantFilter {
  searchTerm: string;
  fundingMin: number;
  fundingMax: number;
  includeFundingNull: boolean;
  onlyNoFunding: boolean;
  deadlineMinDays: number;
  deadlineMaxDays: number;
  includeNoDeadline: boolean;
  onlyNoDeadline: boolean;
  sortBy: string;
  page: number;
  agency_name?: string;
  agency_subdivision?: string;
  eligible_applicant_types?: string[];
  activity_categories?: string[];
  grant_type?: string;
  status?: string;
  keywords?: string[];
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