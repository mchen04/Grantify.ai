/**
 * Application-wide constants
 */

// Maximum funding amount for grant filters
export const MAX_FUNDING = 5000000; // $5,000,000+

// Deadline days range for grant filters
export const MIN_DEADLINE_DAYS = 0; // Today
export const MAX_DEADLINE_DAYS = 365; // 1 year

// Number of grants to show per page
export const SEARCH_GRANTS_PER_PAGE = 6;
export const DASHBOARD_GRANTS_PER_PAGE = 10;

// Legacy constant for backward compatibility
export const GRANTS_PER_PAGE = SEARCH_GRANTS_PER_PAGE;
