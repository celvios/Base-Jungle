import { Request, Response, NextFunction } from 'express';
import { verifySession } from './auth-session.js';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                address: string;
            };
        }
    }
}

// Middleware to verify authentication
export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        const result = await verifySession(token);

        if (!result.valid || !result.address) {
            return res.status(401).json({ error: result.error || 'Invalid token' });
        }

        // Attach user to request
        req.user = { address: result.address };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const result = await verifySession(token);

            if (result.valid && result.address) {
                req.user = { address: result.address };
            }
        }

        next();
    } catch (error) {
        // Continue without user
        next();
    }
}
