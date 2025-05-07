import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger'; // Import the logger
 
 // Extend Express Request type to include user
 declare global {
   namespace Express {
     interface Request {
       user?: any;
       session?: any; // Add session object
       accessToken?: string; // Add access token string
       supabase?: any; // Add user-authenticated supabase client to request
     }
   }
 }
 
 const supabaseUrl = process.env.SUPABASE_URL!;
 const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
 // We no longer need the service_role client initialized here
 // const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
 /**
  * Middleware to verify Supabase JWT tokens, extract user information,
  * and create a user-authenticated Supabase client instance
  * This ensures that all protected routes have access to the authenticated user
  */
 export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
   try {
     const authHeader = req.headers.authorization;
     
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
     }
     
     const token = authHeader.split(' ')[1];
 
     logger.debug('Received token in authMiddleware', { token }); // Log the received token
 
     // Create a temporary client with the service key to verify the token
     const tempSupabase = createClient(supabaseUrl, supabaseServiceKey);
     const { data, error } = await tempSupabase.auth.getUser(token);
 
     logger.debug('Supabase auth.getUser result', { data, error: error?.message }); // Log the result
 
     if (error || !data.user) {
       logger.error('Token validation failed in authMiddleware', { error: error?.message }); // Log the specific error
       return res.status(401).json({ message: 'Unauthorized: Invalid token' });
     }


     // Add user and access token to request object
     req.user = data.user;
     req.accessToken = token; // Attach the access token directly

     // Create a new Supabase client instance with the user's access token
     // IMPORTANT: Do NOT use the service key here. The client should operate with the user's privileges.
     // Create a new Supabase client instance with the user's access token
     // IMPORTANT: Do NOT use the service key here. The client should operate with the user's privileges.
     logger.debug('Supabase Anon Key in authMiddleware', {
       anonKey: process.env.SUPABASE_ANON_KEY
     });
     req.supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
       auth: {
         persistSession: false,
       },
       global: {
         headers: {
           Authorization: `Bearer ${token}`,
         },
       },
     });

     next();
   } catch (error) {
     console.error('Auth middleware error:', error instanceof Error ? error.message : error);
     res.status(500).json({ message: 'Internal server error' });
   }
 };
 
 /**
  * Middleware to verify that the authenticated user matches the requested user ID
  * This prevents users from accessing or modifying other users' data
  */
 export const authorizeUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
   const requestedUserId = req.params.userId || req.query.userId || req.body.userId;
   
   if (!req.user) {
     return res.status(401).json({ message: 'Unauthorized: Authentication required' });
   }
   
   if (requestedUserId && req.user.id !== requestedUserId) {
     return res.status(403).json({ message: 'Forbidden: You can only access your own data' });
   }
   
   next();
 };