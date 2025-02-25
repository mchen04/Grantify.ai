export interface Grant {
  id: string;
  title: string;
  opportunity_id: string;
  opportunity_number: string;
  category: string;
  funding_type: string;
  activity_category: string[];
  eligible_applicants: string[];
  agency_name: string;
  post_date: Date | null;
  close_date: Date | null;
  total_funding: number | null;
  award_ceiling: number | null;
  award_floor: number | null;
  cost_sharing: boolean;
  description: string;
  additional_info_url: string;
  grantor_contact_name: string;
  grantor_contact_email: string;
  grantor_contact_phone: string;
  embeddings?: number[];
  created_at?: Date;
  updated_at?: Date;
}

export interface GrantFilter {
  search?: string;
  category?: string;
  agency_name?: string;
  funding_min?: number;
  funding_max?: number;
  post_date_start?: Date;
  post_date_end?: Date;
  close_date_start?: Date;
  close_date_end?: Date;
  eligible_applicant_types?: string[];
  cost_sharing?: boolean;
  activity_categories?: string[];
  page?: number;
  limit?: number;
}