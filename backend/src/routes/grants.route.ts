import express from 'express';
import { GrantFilter } from '../models/grant';

const router = express.Router();

// GET /api/grants - Get all grants with filtering
router.get('/', async (req, res) => {
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

    // TODO: Implement grants service to fetch grants with filters
    res.json({
      message: 'Grants endpoint',
      filters,
      // This is a placeholder, will be replaced with actual data
      grants: []
    });
  } catch (error) {
    console.error('Error fetching grants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/grants/recommended - Get recommended grants for a user
// Note: This route must be defined before the /:id route to avoid conflicts
router.get('/recommended', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // TODO: Implement grants service to fetch recommended grants
    res.json({
      message: `Recommended grants for user: ${userId}`,
      // This is a placeholder, will be replaced with actual data
      grants: []
    });
  } catch (error) {
    console.error('Error fetching recommended grants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/grants/:id - Get a specific grant by ID
router.get('/:id', async (req, res) => {
  try {
    const grantId = req.params.id;
    
    // TODO: Implement grants service to fetch a specific grant
    res.json({
      message: `Grant with ID: ${grantId}`,
      // This is a placeholder, will be replaced with actual data
      grant: { id: grantId }
    });
  } catch (error) {
    console.error(`Error fetching grant ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;