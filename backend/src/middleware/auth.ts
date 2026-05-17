import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { UnauthorizedError } from '../utils/errors';

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next();
    }

    req.user = { id: user.id, email: user.email! };
    next();
  } catch (error) {
    next();
  }
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new UnauthorizedError('Invalid token');
    }

    req.user = { id: user.id, email: user.email! };
    next();
  } catch (error) {
    next(error);
  }
};
