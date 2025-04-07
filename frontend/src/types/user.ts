// User-related type definitions

export interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  job_title?: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserInteraction {
  id: string;
  user_id: string;
  grant_id: string;
  action: 'saved' | 'applied' | 'ignored';
  timestamp: string;
  grants?: any; // Reference to the related grant
}

export interface UserPreferences {
  topics: string[];
  funding_min: number;
  funding_max: number;
  agencies: string[];
  deadline_range: string;
  show_no_deadline: boolean;
  show_no_funding: boolean;
}