import Redis from 'ioredis';
import logger from '../utils/logger';
import config from '../config';
import { promisify } from 'util';

/**
 * Service for caching data using Redis
 */
class CacheService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private readonly defaultTTL: number;

  constructor() {
    this.defaultTTL = config.redis.ttl;
  }

  /**
   * Initialize the Redis client
   */
  async initialize(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Connected to Redis server');
      });

      this.client.on('error', (error: Error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      // Wait for connection to be established
      await new Promise<void>((resolve) => {
        if (this.isConnected) {
          resolve();
        } else {
          this.client!.once('connect', () => {
            resolve();
          });
        }
      });
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
      throw error;
    }
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or null if not found
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      await this.initialize();
      if (!this.client) return null;

      const value = await this.client.get(key);
      return value ? JSON.parse(value) as T : null;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional, defaults to config value)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.initialize();
      if (!this.client) return;

      const expiry = ttl || this.defaultTTL;
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.set(key, stringValue, 'EX', expiry);
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Delete a value from the cache
   * @param key - Cache key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      await this.initialize();
      if (!this.client) return;

      await this.client.del(key);
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern - Pattern to match (e.g., "user:*")
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      await this.initialize();
      if (!this.client) return;

      // Use SCAN to find keys matching the pattern
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await this.client.del(...keys);
          logger.debug(`Deleted ${keys.length} keys matching pattern ${pattern}`);
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.error(`Error deleting cache keys matching pattern ${pattern}:`, error);
    }
  }

  /**
   * Get a value from cache or compute it if not found
   * @param key - Cache key
   * @param fn - Function to compute the value if not found in cache
   * @param ttl - Time to live in seconds (optional)
   * @returns The cached or computed value
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      await this.initialize();
      if (!this.client) {
        return await fn();
      }

      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // Value not found in cache, compute it
      const value = await fn();
      
      // Cache the computed value
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      logger.error(`Error in getOrSet for key ${key}:`, error);
      // If there's an error with the cache, compute the value anyway
      return await fn();
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key - Cache key to check
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.client) return false;

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking if cache key ${key} exists:`, error);
      return false;
    }
  }

  /**
   * Get the TTL of a key in seconds
   * @param key - Cache key
   * @returns TTL in seconds, -1 if the key exists but has no TTL, -2 if the key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    try {
      await this.initialize();
      if (!this.client) return -2;

      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Error getting TTL for cache key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

export default new CacheService();