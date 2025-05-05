import express, { Request, Response } from 'express';
import { UserPreferences, UserInteraction } from '../models/user';
import { authMiddleware, authorizeUserMiddleware } from '../middleware/auth.middleware';
import { userPreferencesValidation, userInteractionValidation } from '../middleware/validation.middleware';
import { userPreferencesLimiter } from '../middleware/rate-limit.middleware';
import logger, { logSecurityEvent } from '../utils/logger';
import usersService from '../services/usersService';

const router = express.Router();

// GET /api/users/preferences - Get user preferences
router.get('/preferences',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Use authenticated user ID from middleware
      const userId = req.user.id;
      
      logSecurityEvent(userId, 'preferences_access', { method: 'GET' });
      
      // Use users service to fetch user preferences
      const preferences = await usersService.getUserPreferences(userId);
      
      res.json({
        message: `Preferences for user: ${userId}`,
        preferences
      });
    } catch (error) {
      logger.error('Error fetching user preferences:', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /api/users/preferences - Update user preferences
router.post('/preferences',
  authMiddleware,
  userPreferencesLimiter,
  userPreferencesValidation,
  async (req: Request, res: Response) => {
    try {
      // Use authenticated user ID from middleware
      const userId = req.user.id;
      const preferences = req.body.preferences as UserPreferences;
      
      logSecurityEvent(userId, 'preferences_update', {
        method: 'POST',
        preferencesUpdated: Object.keys(preferences)
      });
      
      // Use users service to update user preferences
      const updatedPreferences = await usersService.updateUserPreferences(userId, preferences);
      
      res.json({
        message: `Updated preferences for user: ${userId}`,
        preferences: updatedPreferences
      });
    } catch (error) {
      logger.error('Error updating user preferences:', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /api/users/interactions - Record user interaction with a grant
router.post('/interactions',
  authMiddleware,
  userInteractionValidation,
  async (req: Request, res: Response) => {
    try {
      // Create interaction with authenticated user ID
      const interaction: UserInteraction = {
        ...req.body,
        user_id: req.user.id
      };
      
      logSecurityEvent(req.user.id, 'grant_interaction', {
        action: interaction.action,
        grantId: interaction.grant_id
      });
      
      // Use users service to record user interaction
      const recordedInteraction = await usersService.recordUserInteraction(req.user.id, interaction);
      
      res.json({
        message: `Recorded interaction for user: ${interaction.user_id}`,
        interaction: recordedInteraction
      });
    } catch (error) {
      logger.error('Error recording user interaction:', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        grantId: req.body.grant_id,
        action: req.body.action
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /api/users/interactions - Get user interactions with grants
router.get('/interactions',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Use authenticated user ID from middleware
      const userId = req.user.id;
      const action = req.query.action as string | undefined;
      
      // Use users service to fetch interactions
      const result = await usersService.getUserInteractions(userId, action);
      
      res.json({
        message: `User interactions for user: ${userId}`,
        interactions: result.interactions || []
      });
    } catch (error) {
      logger.error('Error fetching user interactions:', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;