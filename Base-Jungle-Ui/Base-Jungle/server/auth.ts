import express from 'express';
import { generateNonce, SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Extend session type
declare module 'express-session' {
    interface SessionData {
        nonce?: string;
    }
}

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

// 1. Generate Nonce
router.get('/nonce', async (req, res) => {
    req.session.nonce = generateNonce();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(req.session.nonce);
});

// 2. Verify Signature & Login
router.post('/verify', async (req, res) => {
    try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);

        const fields = await siweMessage.verify({ signature });

        if (fields.data.nonce !== req.session.nonce) {
            return res.status(422).json({ message: 'Invalid nonce.' });
        }

        // Check if user exists, if not create
        const address = fields.data.address;
        const userResult = await pool.query('SELECT * FROM users WHERE address = $1', [address]);

        if (userResult.rows.length === 0) {
            // Create new user
            await pool.query(
                'INSERT INTO users (address, tier, created_at) VALUES ($1, $2, NOW())',
                [address, 'NOVICE']
            );
        }

        // Generate JWT
        const token = jwt.sign({ address: fields.data.address }, JWT_SECRET, { expiresIn: '1d' });

        req.session.nonce = null;
        req.session.save();

        res.json({ success: true, token, user: { address } });
    } catch (e) {
        req.session.nonce = null;
        req.session.save();
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});

// 3. Get Session
router.get('/session', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const result = await pool.query('SELECT * FROM users WHERE address = $1', [decoded.address]);
        res.json({ user: result.rows[0] });
    } catch (e) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// 4. Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

export default router;
