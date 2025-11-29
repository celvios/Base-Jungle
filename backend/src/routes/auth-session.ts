import { SignJWT, jwtVerify } from 'jose';
import { redis } from '../database/connection.js';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
const SESSION_DURATION = process.env.SESSION_DURATION || '7d';

// Convert duration string to seconds
function durationToSeconds(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
        case 'd': return value * 24 * 60 * 60;
        case 'h': return value * 60 * 60;
        case 'm': return value * 60;
        default: return 7 * 24 * 60 * 60; // Default 7 days
    }
}

// Create session and JWT token
export async function createSession(walletAddress: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const address = walletAddress.toLowerCase();
    const expiresInSeconds = durationToSeconds(SESSION_DURATION);

    // Create JWT
    const token = await new SignJWT({ address })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${expiresInSeconds}s`)
        .setSubject(address)
        .sign(JWT_SECRET);

    // Store session in Redis
    const sessionKey = `session:${address}`;
    await redis.setEx(sessionKey, expiresInSeconds, JSON.stringify({
        token,
        address,
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    }));

    return token;
}

// Verify session token
export async function verifySession(token: string): Promise<{ valid: boolean; address?: string; error?: string }> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        const address = payload.address as string;

        // Check if session still exists in Redis
        const sessionKey = `session:${address}`;
        const session = await redis.get(sessionKey);

        if (!session) {
            return { valid: false, error: 'Session expired' };
        }

        // Update last accessed time
        await redis.expire(sessionKey, durationToSeconds(SESSION_DURATION));

        return { valid: true, address };
    } catch (error: any) {
        return { valid: false, error: error.message || 'Invalid token' };
    }
}

// Revoke session (logout)
export async function revokeSession(walletAddress: string): Promise<void> {
    const address = walletAddress.toLowerCase();
    const sessionKey = `session:${address}`;
    await redis.del(sessionKey);
}

// Get session info
export async function getSession(walletAddress: string): Promise<any | null> {
    const address = walletAddress.toLowerCase();
    const sessionKey = `session:${address}`;
    const session = await redis.get(sessionKey);

    return session ? JSON.parse(session) : null;
}
