import { Router } from 'express';
import { generateNonce } from './auth-nonce.js';
import { verifySiweMessage, createSiweMessageTemplate } from './auth-siwe.js';
import { createSession, revokeSession, getSession } from './auth-session.js';
import { authenticate } from './auth-middleware.js';

const router = Router();

// GET /api/auth/nonce - Get nonce for signing
router.get('/nonce', async (req, res) => {
    try {
        const { address } = req.query;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const nonce = await generateNonce(address);

        // Optionally return pre-formatted SIWE message
        const message = createSiweMessageTemplate(address, nonce);

        res.json({
            nonce,
            message,
            expiresIn: 300, // 5 minutes
        });
    } catch (error: any) {
        console.error('Nonce generation error:', error);
        res.status(500).json({ error: 'Failed to generate nonce' });
    }
});

// POST /api/auth/verify - Verify signature and create session
router.post('/verify', async (req, res) => {
    try {
        const { message, signature, address } = req.body;

        if (!message || !signature || !address) {
            return res.status(400).json({
                error: 'Missing required fields: message, signature, address',
            });
        }

        // Verify SIWE message
        const result = await verifySiweMessage(message, signature);

        if (!result.success || !result.address) {
            return res.status(401).json({
                error: result.error || 'Verification failed',
            });
        }

        // Verify address matches
        if (result.address.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ error: 'Address mismatch' });
        }

        // Create session
        const token = await createSession(
            result.address,
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            success: true,
            token,
            address: result.address,
            expiresIn: process.env.SESSION_DURATION || '7d',
        });
    } catch (error: any) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// POST /api/auth/logout - Revoke session
router.post('/logout', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        await revokeSession(req.user.address);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// GET /api/auth/session - Get current session
router.get('/session', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const session = await getSession(req.user.address);

        res.json({
            address: req.user.address,
            session: session || null,
        });
    } catch (error: any) {
        console.error('Session check error:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
});

export default router;
