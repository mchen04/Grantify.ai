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

// Represents an individual, manageable preference item
export interface PreferenceItem {
  id: string; // Unique identifier for the preference (e.g., "topic_ai", "funding_range_1")
  userId: string; // Belongs to this user
  type: string; // Category of preference (e.g., "topic", "agency", "funding_min", "funding_max")
  value: any; // The actual value (e.g., "Artificial Intelligence", "NSF", 50000)
  label?: string; // Optional display label
  // Add other relevant fields as per the new schema, e.g., is_active, created_at
}

// UserPreferences will now be a collection of these items
export type UserPreferences = PreferenceItem[];