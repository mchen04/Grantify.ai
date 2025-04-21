import { Grant } from '../models/grant';
import supabase from '../db/supabaseClient';
import logger from '../utils/logger';
import config from '../config';
import cacheService from './cacheService';

// Interface for a grant with a match score
interface ScoredGrant extends Grant {
  match_score: number;
}

// Interface for user preferences
interface UserPreferences {
  agencies: string[];
  categories: string[];
  fundingMin: number;
  fundingMax: number;
  eligibleApplicantTypes: string[];
}

/**
 * Service for generating grant recommendations
 */
class RecommendationService {
  private readonly RECOMMENDATION_TTL = config.redis.ttlValues.recommendation; // 24 hours
  private readonly BATCH_SIZE = 100; // Number of users to process in each batch

  /**
   * Get recommended grants for a user
   * @param userId - User ID
   * @param limit - Maximum number of recommendations to return
   * @returns Array of recommended grants with match scores
   */
  async getRecommendationsForUser(userId: string, limit: number = 20): Promise<ScoredGrant[]> {
    try {
      // Check cache first
      const cacheKey = `recommendations:${userId}`;
      const cachedRecommendations = await cacheService.get<ScoredGrant[]>(cacheKey);
      
      if (cachedRecommendations) {
        logger.debug(`Cache hit for recommendations for user ${userId}`);
        return cachedRecommendations.slice(0, limit);
      }
      
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        logger.warn(`No preferences found for user ${userId}`);
        return [];
      }
      
      // Get grants the user has already interacted with
      const { data: interactedGrants, error: interactedError } = await supabase
        .from('user_interactions')
        .select('grant_id')
        .eq('user_id', userId);
      
      if (interactedError) {
        throw interactedError;
      }
      
      const interactedGrantIds = interactedGrants.map(interaction => interaction.grant_id);
      
      // Get all grants that match the user's preferences
      const { data: grants, error: grantsError } = await supabase
        .from('grants')
        .select('*')
        .not('id', 'in', interactedGrantIds.length > 0 ? `(${interactedGrantIds.join(',')})` : '()');
      
      if (grantsError) {
        throw grantsError;
      }
      
      if (!grants || grants.length === 0) {
        logger.info(`No grants found for recommendations for user ${userId}`);
        return [];
      }
      
      // Score grants based on user preferences
      const scoredGrants = this.scoreGrants(grants, preferences);
      
      // Sort by score (descending) and limit
      const recommendations = scoredGrants
        .sort((a, b) => b.match_score - a.match_score)
        .filter(grant => grant.match_score >= config.recommendations.minScore)
        .slice(0, limit);
      
      // Cache recommendations
      await cacheService.set(cacheKey, recommendations, this.RECOMMENDATION_TTL);
      
      return recommendations;
    } catch (error) {
      logger.error(`Error getting recommendations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Pre-compute recommendations for all active users
   */
  async preComputeAllUserRecommendations(): Promise<void> {
    try {
      logger.info('Starting pre-computation of recommendations for all users');
      
      // Get all users with preferences
      const { data: users, error: usersError } = await supabase
        .from('user_preferences')
        .select('user_id')
        .order('user_id');
      
      if (usersError) {
        throw usersError;
      }
      
      if (!users || users.length === 0) {
        logger.info('No users found for pre-computing recommendations');
        return;
      }
      
      logger.info(`Found ${users.length} users for pre-computing recommendations`);
      
      // Process users in batches to avoid memory issues
      const totalUsers = users.length;
      let processedUsers = 0;
      
      for (let i = 0; i < totalUsers; i += this.BATCH_SIZE) {
        const batch = users.slice(i, i + this.BATCH_SIZE);
        
        // Process each user in the batch
        await Promise.all(
          batch.map(async (user) => {
            try {
              await this.getRecommendationsForUser(user.user_id);
              processedUsers++;
              
              if (processedUsers % 10 === 0 || processedUsers === totalUsers) {
                logger.info(`Pre-computed recommendations for ${processedUsers}/${totalUsers} users`);
              }
            } catch (error) {
              logger.error(`Error pre-computing recommendations for user ${user.user_id}:`, error);
            }
          })
        );
      }
      
      logger.info(`Completed pre-computation of recommendations for ${processedUsers}/${totalUsers} users`);
    } catch (error) {
      logger.error('Error pre-computing recommendations for all users:', error);
      throw error;
    }
  }

  /**
   * Trigger recommendation update for a specific user
   * @param userId - User ID
   */
  async triggerRecommendationUpdate(userId: string): Promise<void> {
    try {
      // Clear cache for this user
      const cacheKey = `recommendations:${userId}`;
      await cacheService.delete(cacheKey);
      
      // Generate new recommendations
      await this.getRecommendationsForUser(userId);
      
      logger.info(`Recommendations updated for user ${userId}`);
    } catch (error) {
      logger.error(`Error updating recommendations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user preferences from the database
   * @param userId - User ID
   * @returns User preferences or null if not found
   */
  private async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found
          return null;
        }
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      // Transform the data into the expected format
      return {
        agencies: data.preferred_agencies || [],
        categories: data.preferred_categories || [],
        fundingMin: data.funding_min || 0,
        fundingMax: data.funding_max || Number.MAX_SAFE_INTEGER,
        eligibleApplicantTypes: data.eligible_applicant_types || []
      };
    } catch (error) {
      logger.error(`Error getting preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Score grants based on user preferences
   * @param grants - Array of grants to score
   * @param preferences - User preferences
   * @returns Array of grants with match scores
   */
  private scoreGrants(grants: Grant[], preferences: UserPreferences): ScoredGrant[] {
    return grants.map(grant => {
      let score = 0;
      const weights = config.recommendations.weights;
      
      // Score based on agency match
      if (preferences.agencies.length > 0 && grant.agency_name) {
        const agencyMatch = preferences.agencies.some(
          agency => grant.agency_name.toLowerCase().includes(agency.toLowerCase())
        );
        if (agencyMatch) {
          score += weights.agencyMatch;
        }
      }
      
      // Score based on category match
      if (preferences.categories.length > 0 && grant.activity_category) {
        const categoryMatches = preferences.categories.filter(category => 
          grant.activity_category.some(
            grantCategory => grantCategory.toLowerCase().includes(category.toLowerCase())
          )
        );
        
        if (categoryMatches.length > 0) {
          score += weights.categoryMatch * (categoryMatches.length / preferences.categories.length);
        }
      }
      
      // Score based on funding match
      if (grant.award_ceiling !== null) {
        if (
          grant.award_ceiling >= preferences.fundingMin &&
          grant.award_ceiling <= preferences.fundingMax
        ) {
          score += weights.fundingMatch;
        } else if (
          grant.award_ceiling >= preferences.fundingMin * 0.8 &&
          grant.award_ceiling <= preferences.fundingMax * 1.2
        ) {
          // Partial match if within 20% of range
          score += weights.fundingMatch * 0.5;
        }
      }
      
      // Score based on eligibility match
      if (preferences.eligibleApplicantTypes.length > 0 && grant.eligible_applicants) {
        const eligibilityMatches = preferences.eligibleApplicantTypes.filter(type => 
          grant.eligible_applicants!.some(
            grantType => grantType.toLowerCase().includes(type.toLowerCase())
          )
        );
        
        if (eligibilityMatches.length > 0) {
          score += weights.eligibilityMatch * (eligibilityMatches.length / preferences.eligibleApplicantTypes.length);
        }
      }
      
      return {
        ...grant,
        match_score: score
      };
    });
  }
}

export default new RecommendationService();