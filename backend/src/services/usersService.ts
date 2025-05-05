import supabase from '../db/supabaseClient';
import { User, UserPreferences, UserInteraction } from '../models/user';
import logger, { logSecurityEvent } from '../utils/logger';

/**
 * Service for managing user operations in the database
 */
class UsersService {
  /**
   * Get a user's profile
   * @param userId - User ID
   * @returns User profile or null if not found
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Handle not found gracefully
        throw error;
      }

      // If no profile exists yet, return a default structure or just the user_id
      return data || { user_id: userId };
    } catch (error) {
      logger.error('Error fetching user profile:', {
        error: error instanceof Error ? error.message : error,
        userId
      });
      throw error;
    }
  }

  /**
   * Update a user's profile
   * @param userId - User ID
   * @param profileData - Profile data to update
   * @returns Updated profile
   */
  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User> {
    try {
      // Use upsert to insert or update the profile
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedProfile;
    } catch (error) {
      logger.error('Error updating user profile:', {
        error: error instanceof Error ? error.message : error,
        userId
      });
      throw error;
    }
  }

  /**
   * Get a user's preferences
   * @param userId - User ID
   * @returns User preferences or default preferences if not found
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Ensure default structure if no data
      return data || {
        user_id: userId,
        filter_keywords: [], // Match UserPreferences structure
      };
    } catch (error) {
      logger.error('Error fetching user preferences:', {
        error: error instanceof Error ? error.message : error,
        userId
      });
      throw error;
    }
  }

  /**
   * Update a user's preferences
   * @param userId - User ID
   * @param preferencesUpdate - Preferences data to update
   * @returns Updated preferences
   */
  async updateUserPreferences(userId: string, preferencesUpdate: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      // Upsert the preferences
      const { data: updatedPrefs, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          // Include fields defined in UserPreferences model
          topics: preferencesUpdate.topics || [],
          funding_min: preferencesUpdate.funding_min,
          funding_max: preferencesUpdate.funding_max,
          eligible_applicant_types: preferencesUpdate.eligible_applicant_types || [],
          agencies: preferencesUpdate.agencies || [],
          locations: preferencesUpdate.locations || [],
          notification_settings: preferencesUpdate.notification_settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }) // Ensure constraint name is correct
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedPrefs;
    } catch (error) {
      logger.error('Error updating user preferences:', {
        error: error instanceof Error ? error.message : error,
        userId
      });
      throw error;
    }
  }

  /**
   * Get user interactions
   * @param userId - User ID
   * @param action - Optional action filter
   * @returns User interactions and associated grants
   */
  async getUserInteractions(userId: string, action?: string): Promise<{ interactions: UserInteraction[], grants: any[] }> {
    try {
      let query = supabase
        .from('user_interactions')
        .select('*, grants(*)')
        .eq('user_id', userId);

      if (action && ['saved', 'applied', 'ignored'].includes(action)) {
        query = query.eq('action', action);
      }

      query = query.order('timestamp', { ascending: false });

      const { data: interactions, error } = await query;

      if (error) {
        throw error;
      }

      // Separate interactions and grants for the response structure frontend expects
      const interactionRecords = interactions?.map(i => ({
        id: i.id,
        user_id: i.user_id,
        grant_id: i.grant_id,
        action: i.action,
        notes: i.notes,
        timestamp: i.timestamp,
      })) || [];

      const grantRecords = interactions?.map(i => i.grants).filter(g => g !== null) || [];
      // Deduplicate grants if necessary (though each interaction should have one grant)
      const uniqueGrants = Array.from(new Map(grantRecords.map(item => [item.Grant_ID, item])).values());

      return {
        interactions: interactionRecords,
        grants: uniqueGrants
      };
    } catch (error) {
      logger.error('Error fetching user interactions:', {
        error: error instanceof Error ? error.message : error,
        userId
      });
      throw error;
    }
  }

  /**
   * Record a user interaction
   * @param userId - User ID
   * @param interactionData - Interaction data
   * @returns Recorded interaction
   */
  async recordUserInteraction(userId: string, interactionData: Partial<UserInteraction>): Promise<UserInteraction> {
    try {
      const interaction = {
        user_id: userId,
        grant_id: interactionData.grant_id,
        action: interactionData.action,
        notes: interactionData.notes,
        timestamp: new Date().toISOString()
      };

      // Upsert the interaction based on user_id and grant_id
      const { data: upsertedInteraction, error: upsertError } = await supabase
        .from('user_interactions')
        .upsert({
          ...interaction
        }, {
          onConflict: 'user_id,grant_id', // Assumes UNIQUE constraint on (user_id, grant_id)
        })
        .select()
        .single();

      if (upsertError) {
        // Handle potential constraint violation if UNIQUE constraint includes `action`
        if (upsertError.code === '23505') { // unique_violation
          logger.warn('Attempted duplicate interaction upsert:', { 
            userId, 
            grantId: interactionData.grant_id, 
            action: interactionData.action 
          });
        }
        throw upsertError;
      }

      return upsertedInteraction;
    } catch (error) {
      logger.error('Error recording user interaction:', {
        error: error instanceof Error ? error.message : error,
        userId,
        grantId: interactionData.grant_id,
        action: interactionData.action
      });
      throw error;
    }
  }

  /**
   * Delete a user interaction
   * @param interactionId - Interaction ID
   * @param userId - User ID (for authorization)
   * @returns True if deleted successfully
   */
  async deleteUserInteraction(interactionId: string, userId: string): Promise<boolean> {
    try {
      // Fetch the interaction to verify ownership before deleting
      const { data: interaction, error: fetchError } = await supabase
        .from('user_interactions')
        .select('user_id, grant_id')
        .eq('id', interactionId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // Not found
          throw new Error('Interaction not found');
        }
        throw fetchError;
      }

      // Check if the interaction belongs to the authenticated user
      if (interaction.user_id !== userId) {
        logSecurityEvent(userId, 'unauthorized_access', {
          resource: 'interaction',
          resourceId: interactionId,
          action: 'delete'
        });
        throw new Error('You are not authorized to delete this interaction');
      }

      // Delete the interaction
      const { error: deleteError } = await supabase
        .from('user_interactions')
        .delete()
        .eq('id', interactionId);

      if (deleteError) {
        throw deleteError;
      }

      logSecurityEvent(userId, 'interaction_deleted', {
        interactionId,
        grantId: interaction.grant_id
      });

      return true;
    } catch (error) {
      logger.error('Error deleting user interaction:', {
        error: error instanceof Error ? error.message : error,
        userId,
        interactionId
      });
      throw error;
    }
  }
}

// Export a singleton instance
export default new UsersService();