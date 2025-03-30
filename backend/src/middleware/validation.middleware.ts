import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validation rules for user preferences
 */
export const userPreferencesValidation = [
  body('preferences').isObject().withMessage('Preferences must be an object'),
  body('preferences.topics').optional().isArray().withMessage('Topics must be an array'),
  body('preferences.funding_min').optional().isInt({ min: 0 }).withMessage('Funding minimum must be a positive integer'),
  body('preferences.funding_max').optional().isInt({ min: 0 }).withMessage('Funding maximum must be a positive integer'),
  body('preferences.eligible_applicant_types').optional().isArray().withMessage('Eligible applicant types must be an array'),
  body('preferences.agencies').optional().isArray().withMessage('Agencies must be an array'),
  body('preferences.locations').optional().isArray().withMessage('Locations must be an array'),
  body('preferences.notification_settings').optional().isObject().withMessage('Notification settings must be an object'),
  body('preferences.notification_settings.email_frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'never'])
    .withMessage('Email frequency must be one of: daily, weekly, monthly, never'),
  body('preferences.notification_settings.notify_new_matches')
    .optional()
    .isBoolean()
    .withMessage('Notify new matches must be a boolean'),
  body('preferences.notification_settings.notify_deadlines')
    .optional()
    .isBoolean()
    .withMessage('Notify deadlines must be a boolean'),
  validateRequest
];

/**
 * Validation rules for user interactions
 */
export const userInteractionValidation = [
  body('grant_id').isUUID().withMessage('Grant ID must be a valid UUID'),
  body('action').isIn(['saved', 'applied', 'ignored']).withMessage('Action must be one of: saved, applied, ignored'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  validateRequest
];

/**
 * Validation rules for grant filters
 */
export const grantFilterValidation = [
  query('search').optional().isString().withMessage('Search must be a string'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('agency_name').optional().isString().withMessage('Agency name must be a string'),
  query('funding_min').optional().isInt({ min: 0 }).withMessage('Funding minimum must be a positive integer'),
  query('funding_max').optional().isInt({ min: 0 }).withMessage('Funding maximum must be a positive integer'),
  query('eligible_applicant_types').optional().isString().withMessage('Eligible applicant types must be a comma-separated string'),
  query('activity_categories').optional().isString().withMessage('Activity categories must be a comma-separated string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest
];

/**
 * Validation rules for user ID
 */
export const userIdValidation = [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
  validateRequest
];