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