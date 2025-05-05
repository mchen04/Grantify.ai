import express, { Request, Response } from 'express';
import { GrantFilter } from '../models/grant';
import { authMiddleware } from '../middleware/auth.middleware';
import { grantFilterValidation } from '../middleware/validation.middleware';
import logger from '../utils/logger';

const router = express.Router();

// GET /api/grants - Get all grants with filtering
router.get('/',
  grantFilterValidation,
  async (req: Request, res: Response) => {
    try {
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

      logger.debug('Grants search request', {
        filters,
        userId: req.user?.id || 'unauthenticated'
      });

      // Use the grants service to fetch grants with filters
      const grantsService = require('../services/grantsService').default;
      const grants = await grantsService.getGrants(filters);
      
      res.json({
        message: 'Grants fetched successfully',
        filters,
        grants
      });
    } catch (error) {
      logger.error('Error fetching grants:', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id || 'unauthenticated'
      });
      res.status(500).json({ message: 'Internal server error' });
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
      
      logger.debug('Recommended grants request', { userId });
      
      // TODO: Implement grants service to fetch recommended grants
      res.json({
        message: `Recommended grants for user: ${userId}`,
        // This is a placeholder, will be replaced with actual data
        grants: []
      });
    } catch (error) {
      logger.error('Error fetching recommended grants:', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id
      });
      res.status(500).json({ message: 'Internal server error' });
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
    
    // Use Supabase directly to fetch the specific grant
    const supabase = require('../db/supabaseClient').default;
    const { data: grant, error } = await supabase
      .from('grants')
      .select('*')
      .eq('id', grantId)
      .single();
    
    if (error) {
      throw error;
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