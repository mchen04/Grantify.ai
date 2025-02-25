export interface User {
  id: string;
  email: string;
  preferences: UserPreferences;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserPreferences {
  topics?: string[];
  funding_min?: number;
  funding_max?: number;
  eligible_applicant_types?: string[];
  agencies?: string[];
  locations?: string[];
  preference_vector?: number[];
  notification_settings?: NotificationSettings;
}

export interface NotificationSettings {
  email_frequency: 'daily' | 'weekly' | 'never';
  notify_new_matches: boolean;
  notify_deadlines: boolean;
}

export interface UserInteraction {
  user_id: string;
  grant_id: string;
  action: 'saved' | 'applied' | 'ignored';
  timestamp: Date;
  notes?: string;
}