import express, { Request, Response } from 'express';
import { GrantFilter } from '../models/grant';
import { authMiddleware } from '../middleware/auth.middleware';
import { grantFilterValidation } from '../middleware/validation.middleware';
import logger from '../utils/logger';

// Import both real and mock services
import grantsService from '../services/grantsService';
import mockGrantsService from '../services/mockGrantsService';

// Flag to control whether to use mock data
const USE_MOCK_DATA = false; // Set to false to use real data

const router = express.Router();

// GET /api/grants - Get all grants with filtering
router.get('/',
  grantFilterValidation,
  async (req: Request, res: Response) => {
    try {
      // Parse and validate all query parameters
      const filters: GrantFilter = {
        search: req.query.search as string,
        category: req.query.category as string,
        agency_name: req.query.agency_name as string,
        funding_min: req.query.funding_min ? parseInt(req.query.funding_min as string) : undefined,
        funding_max: req.query.funding_max ? parseInt(req.query.funding_max as string) : undefined,
        eligible_applicant_types: req.query.eligible_applicant_types ?
          (req.query.eligible_applicant_types as string).split(',') : undefined,
        activity_categories: req.query.activity_categories ?
          (req.query.activity_categories as string).split(',') : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      // Additional parameters that might be passed from the frontend
      if (req.query.close_date_min) {
        (filters as any).close_date_min = req.query.close_date_min as string;
      }
      
      if (req.query.has_award_ceiling) {
        (filters as any).has_award_ceiling = req.query.has_award_ceiling === 'true';
      }
      
      if (req.query.sort_by) {
        (filters as any).sort_by = req.query.sort_by as string;
      }
      
      if (req.query.sort_direction) {
        (filters as any).sort_direction = req.query.sort_direction as string;
      }

      logger.debug('Grants search request', {
        filters,
        userId: req.user?.id || 'unauthenticated',
        query: req.query
      });

      // Determine which service to use
      const service = USE_MOCK_DATA ? mockGrantsService : grantsService;
      logger.info(`Using ${USE_MOCK_DATA ? 'MOCK' : 'REAL'} grants service`);
      
      // Use the selected service to fetch grants with filters
      const grants = await service.getGrants(filters);
      
      // Check if we got any grants back
      if (!grants || grants.length === 0) {
        logger.info('No grants found matching filters', { filters });
        
        // Return empty array but with 200 status
        return res.json({
          message: 'No grants found matching criteria',
          filters,
          grants: [],
          count: 0
        });
      }
      
      // Return successful response with grants
      res.json({
        message: 'Grants fetched successfully',
        filters,
        grants,
        count: grants.length
      });
    } catch (error) {
      logger.error('Error fetching grants:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id || 'unauthenticated',
        query: req.query
      });
      
      // Return a more informative error message
      res.status(500).json({
        message: 'Failed to fetch grants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/grants/recommended - Get recommended grants for a user
// Note: This route must be defined before the /:id route to avoid conflicts
router.get('/recommended',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Use authenticated user ID from middleware
      const userId = req.user.id;
      
      // Get options from query parameters
      const exclude = req.query.exclude ? (req.query.exclude as string).split(',') : [];
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      logger.debug('Recommended grants request', {
        userId,
        exclude: exclude.length,
        limit,
        query: req.query
      });
      
      // Determine which service to use
      const service = USE_MOCK_DATA ? mockGrantsService : grantsService;
      logger.info(`Using ${USE_MOCK_DATA ? 'MOCK' : 'REAL'} grants service for recommendations`);
      
      // Check if user exists in the database (only if using real service)
      if (!USE_MOCK_DATA) {
        const supabase = require('../db/supabaseClient').default;
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (userError) {
          logger.warn('User not found in database when fetching recommended grants', {
            userId,
            error: userError
          });
          // Continue anyway, as the getRecommendedGrants method will handle this case
        } else {
          logger.debug('User found in database', { userId });
        }
      } else {
        logger.debug('Skipping user check in mock mode', { userId });
      }
      
      // Fetch the recommended grants
      const grants = await service.getRecommendedGrants(userId, {
        exclude,
        limit
      });
      
      // Calculate the count for pagination
      const count = grants.length;
      
      if (grants.length === 0) {
        logger.info('No recommended grants found for user', { userId });
        
        // Try to get some fallback grants if no recommendations were found
        const fallbackGrants = await service.getGrants({
          limit: limit,
          page: 1,
          // Sort by newest first as a reasonable default
          sort_by: 'created_at',
          sort_direction: 'desc'
        } as any);
        
        if (fallbackGrants.length > 0) {
          logger.info('Using fallback grants instead of recommendations', {
            userId,
            fallbackCount: fallbackGrants.length
          });
          
          return res.json({
            message: `Fallback grants for user: ${userId} (no personalized recommendations available)`,
            grants: fallbackGrants,
            count: fallbackGrants.length,
            isFallback: true
          });
        }
      }
      
      res.json({
        message: `Recommended grants for user: ${userId}`,
        grants,
        count
      });
    } catch (error) {
      logger.error('Error fetching recommended grants:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        query: req.query
      });
      
      // Return a more informative error message
      res.status(500).json({
        message: 'Failed to fetch recommended grants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/grants/:id - Get a specific grant by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const grantId = req.params.id;
    
    logger.debug('Grant details request', {
      grantId,
      userId: req.user?.id || 'unauthenticated'
    });
    
    let grant;
    
    // Determine which service to use
    if (USE_MOCK_DATA) {
      logger.info('Using MOCK grants service for grant details');
      // For mock data, find the grant in the mock data
      const mockGrants = await mockGrantsService.getGrants();
      grant = mockGrants.find(g => g.id === grantId);
    } else {
      // Use Supabase directly to fetch the specific grant
      logger.info('Using REAL grants service for grant details');
      const supabase = require('../db/supabaseClient').default;
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .eq('id', grantId)
        .single();
        
      if (error) {
        throw error;
      }
      
      grant = data;
    }
    
    if (!grant) {
      return res.status(404).json({ message: 'Grant not found' });
    }
    
    res.json({
      message: 'Grant fetched successfully',
      grant
    });
  } catch (error) {
    logger.error('Error fetching grant:', {
      error: error instanceof Error ? error.message : error,
      grantId: req.params.id,
      userId: req.user?.id || 'unauthenticated'
    });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;