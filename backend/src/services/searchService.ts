import { Grant } from '../models/grant';
import supabase from '../db/supabaseClient';
import logger from '../utils/logger';
import cacheService from './cacheService';
import config from '../config';

/**
 * Service for handling search functionality with MeiliSearch integration
 */
class SearchService {
  private client: any;
  private indexName: string;
  private isInitialized: boolean = false;

  constructor() {
    this.indexName = 'grants';
  }

  /**
   * Initialize the MeiliSearch client and index
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Dynamically import MeiliSearch to avoid issues in environments where it's not available
      const { MeiliSearch } = await import('meilisearch');
      
      this.client = new MeiliSearch({
        host: config.meilisearch.host,
        apiKey: config.meilisearch.apiKey
      });

      // Check if the index exists, create it if it doesn't
      const indexes = await this.client.getIndexes();
      const indexExists = indexes.results.some((index: any) => index.uid === this.indexName);
      
      if (!indexExists) {
        await this.client.createIndex(this.indexName, { primaryKey: 'id' });
        logger.info(`Created MeiliSearch index: ${this.indexName}`);
      }

      // Configure searchable attributes and filterable attributes
      await this.client.index(this.indexName).updateSettings({
        searchableAttributes: [
          'title',
          'description',
          'agency_name',
          'opportunity_id',
          'activity_category'
        ],
        filterableAttributes: [
          'agency_name',
          'activity_category',
          'eligible_applicants',
          'cost_sharing',
          'award_ceiling',
          'award_floor',
          'close_date',
          'post_date'
        ],
        sortableAttributes: [
          'award_ceiling',
          'close_date',
          'post_date',
          'title'
        ]
      });

      this.isInitialized = true;
      logger.info('MeiliSearch service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MeiliSearch:', error);
      throw error;
    }
  }

  /**
   * Index a batch of grants in MeiliSearch
   * @param grants - Array of grants to index
   */
  async indexGrants(grants: Grant[]): Promise<void> {
    try {
      await this.initialize();
      
      // Prepare grants for indexing (transform any fields if needed)
      const preparedGrants = grants.map(grant => ({
        ...grant,
        // Convert arrays to strings for better searching if needed
        activity_category_text: Array.isArray(grant.activity_category) 
          ? grant.activity_category.join(' ') 
          : grant.activity_category,
        eligible_applicants_text: Array.isArray(grant.eligible_applicants) 
          ? grant.eligible_applicants.join(' ') 
          : grant.eligible_applicants
      }));
      
      // Index the grants
      await this.client.index(this.indexName).addDocuments(preparedGrants);
      logger.info(`Indexed ${grants.length} grants in MeiliSearch`);
    } catch (error) {
      logger.error('Failed to index grants in MeiliSearch:', error);
      throw error;
    }
  }

  /**
   * Search for grants in MeiliSearch
   * @param query - Search query string
   * @param filters - Object containing filter parameters
   * @param page - Page number (1-based)
   * @param limit - Number of results per page
   */
  async searchGrants(
    queryOrOptions: string | {
      searchTerm: string;
      filters?: string;
      sort?: string[];
      limit?: number;
      offset?: number;
    },
    filters: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ grants: Grant[], totalHits: number }> {
    try {
      await this.initialize();
      
      // Handle different parameter formats
      let query: string;
      let filterStr: string | undefined;
      let sortArray: string[] | undefined;
      let limitVal: number = limit;
      let offsetVal: number = (page - 1) * limit;
      
      if (typeof queryOrOptions === 'string') {
        query = queryOrOptions;
        filterStr = filters && Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;
      } else {
        query = queryOrOptions.searchTerm;
        filterStr = queryOrOptions.filters;
        sortArray = queryOrOptions.sort;
        limitVal = queryOrOptions.limit || limit;
        offsetVal = queryOrOptions.offset !== undefined ? queryOrOptions.offset : (page - 1) * limit;
      }
      
      // Generate cache key based on query parameters
      const cacheKey = `search:${query}:${filterStr || ''}:${sortArray ? sortArray.join(',') : ''}:${limitVal}:${offsetVal}`;
      
      // Try to get results from cache first
      const cachedResults = await cacheService.get<{ grants: Grant[], totalHits: number }>(cacheKey);
      if (cachedResults) {
        logger.debug(`Cache hit for search query: ${query}`);
        return cachedResults;
      }
      
      // Build filter string for MeiliSearch if not already provided
      let filterConditions: string | string[] = filterStr || [];
      
      if (!filterStr && typeof filters === 'object' && Object.keys(filters).length > 0) {
        const filterArray: string[] = [];
        
        if (filters.agency_name) {
          filterArray.push(`agency_name = "${filters.agency_name}"`);
        }
        
        if (filters.activity_categories) {
          const categories = Array.isArray(filters.activity_categories)
            ? filters.activity_categories
            : filters.activity_categories.split(',');
        
          const categoryConditions = categories.map((cat: string) => `activity_category = "${cat}"`);
          filterArray.push(`(${categoryConditions.join(' OR ')})`);
      }
      
        if (filters.eligible_applicant_types) {
          const types = Array.isArray(filters.eligible_applicant_types)
            ? filters.eligible_applicant_types
            : filters.eligible_applicant_types.split(',');
          
          const typeConditions = types.map((type: string) => `eligible_applicants = "${type}"`);
          filterArray.push(`(${typeConditions.join(' OR ')})`);
        }
        
        if (filters.cost_sharing !== undefined) {
          filterArray.push(`cost_sharing = ${filters.cost_sharing}`);
        }
      
        if (filters.funding_min !== undefined || filters.funding_max !== undefined) {
          if (filters.funding_min && filters.funding_max) {
            filterArray.push(`award_ceiling >= ${filters.funding_min} AND award_ceiling <= ${filters.funding_max}`);
          } else if (filters.funding_min) {
            filterArray.push(`award_ceiling >= ${filters.funding_min}`);
          } else if (filters.funding_max) {
            filterArray.push(`award_ceiling <= ${filters.funding_max}`);
          }
        }
        
        filterConditions = filterArray;
      }
      
      // Determine sort order if not already provided
      let sort = sortArray || [];
      
      if (!sortArray && filters.sort) {
        switch (filters.sort) {
          case 'deadline':
            sort = ['close_date:asc'];
            break;
          case 'deadline_latest':
            sort = ['close_date:desc'];
            break;
          case 'amount':
            sort = ['award_ceiling:desc'];
            break;
          case 'amount_asc':
            sort = ['award_ceiling:asc'];
            break;
          case 'recent':
            sort = ['post_date:desc'];
            break;
          case 'title_asc':
            sort = ['title:asc'];
            break;
          case 'title_desc':
            sort = ['title:desc'];
            break;
          default:
            // Default is relevance, which is handled by MeiliSearch
            break;
        }
      }
      
      // Execute search
      // Prepare search options
      const searchOptions: any = {
        limit: limitVal,
        offset: offsetVal,
        filter: Array.isArray(filterConditions) && filterConditions.length > 0
          ? filterConditions.join(' AND ')
          : filterConditions,
        sort: sort.length > 0 ? sort : undefined
      };
      
      const searchResults = await this.client.index(this.indexName).search(query, searchOptions);
      
      // Cache the results
      const results = {
        grants: searchResults.hits,
        totalHits: searchResults.estimatedTotalHits || searchResults.nbHits
      };
      
      await cacheService.set(cacheKey, results, config.redis.ttlValues.search); // Cache using configured TTL
      
      return results;
    } catch (error) {
      logger.error('Failed to search grants in MeiliSearch:', error);
      throw error;
    }
  }

  /**
   * Delete a grant from the search index
   * @param grantId - ID of the grant to delete
   */
  async deleteGrant(grantId: string): Promise<void> {
    try {
      await this.initialize();
      await this.client.index(this.indexName).deleteDocument(grantId);
      logger.info(`Deleted grant ${grantId} from MeiliSearch index`);
    } catch (error) {
      logger.error(`Failed to delete grant ${grantId} from MeiliSearch:`, error);
      throw error;
    }
  }

  /**
   * Rebuild the entire search index from scratch
   * @param grants - Array of all grants to index
   */
  async rebuildIndex(grants: Grant[]): Promise<void> {
    try {
      await this.initialize();
      
      // Delete the existing index
      await this.client.deleteIndex(this.indexName);
      logger.info(`Deleted MeiliSearch index: ${this.indexName}`);
      
      // Create a new index
      await this.client.createIndex(this.indexName, { primaryKey: 'id' });
      logger.info(`Created new MeiliSearch index: ${this.indexName}`);
      
      // Configure the new index
      await this.client.index(this.indexName).updateSettings({
        searchableAttributes: [
          'title',
          'description',
          'agency_name',
          'opportunity_id',
          'activity_category'
        ],
        filterableAttributes: [
          'agency_name',
          'activity_category',
          'eligible_applicants',
          'cost_sharing',
          'award_ceiling',
          'award_floor',
          'close_date',
          'post_date'
        ],
        sortableAttributes: [
          'award_ceiling',
          'close_date',
          'post_date',
          'title'
        ]
      });
      
      // Index all grants
      // Process in batches to avoid overwhelming the server
      const batchSize = 1000;
      for (let i = 0; i < grants.length; i += batchSize) {
        const batch = grants.slice(i, i + batchSize);
        await this.indexGrants(batch);
        logger.info(`Indexed batch ${i / batchSize + 1} of ${Math.ceil(grants.length / batchSize)}`);
      }
      
      logger.info(`Rebuilt MeiliSearch index with ${grants.length} grants`);
    } catch (error) {
      logger.error('Failed to rebuild MeiliSearch index:', error);
      throw error;
    }
  }
}

export default new SearchService();