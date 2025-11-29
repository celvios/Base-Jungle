import { redis } from '../database/connection.js';
import { randomBytes } from 'crypto';

const NONCE_TTL = 300; // 5 minutes

// Generate cryptographic nonce
export async function generateNonce(walletAddress: string): Promise<string> {
    const nonce = randomBytes(32).toString('hex');
    const key = `nonce:${walletAddress.toLowerCase()}`;

    // Store in Redis with TTL
    await redis.setEx(key, NONCE_TTL, nonce);

    return nonce;
}

// Verify and consume nonce (one-time use)
export async function verifyNonce(walletAddress: string, nonce: string): Promise<boolean> {
    const key = `nonce:${walletAddress.toLowerCase()}`;
    const storedNonce = await redis.get(key);

    if (!storedNonce || storedNonce !== nonce) {
        return false;
    }

    // Delete nonce after use (prevent replay attacks)
    await redis.del(key);

    return true;
}

// Clean up expired nonces (called periodically)
export async function cleanupExpiredNonces(): Promise<void> {
    // Redis TTL handles this automatically
    console.log('✅ Nonce cleanup (handled by Redis TTL)');
}
