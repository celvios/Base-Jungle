import { SiweMessage } from 'siwe';
import { verifyNonce } from './auth-nonce.js';

export interface SiweVerificationResult {
    success: boolean;
    address?: string;
    error?: string;
}

// Verify SIWE message and signature
export async function verifySiweMessage(
    message: string,
    signature: string
): Promise<SiweVerificationResult> {
    try {
        // Parse SIWE message
        const siweMessage = new SiweMessage(message);

        // Verify signature
        const fields = await siweMessage.verify({ signature });

        if (!fields.success) {
            return {
                success: false,
                error: 'Invalid signature',
            };
        }

        // Verify nonce
        const nonceValid = await verifyNonce(siweMessage.address, siweMessage.nonce);
        if (!nonceValid) {
            return {
                success: false,
                error: 'Invalid or expired nonce',
            };
        }

        // Verify domain matches
        const expectedDomain = process.env.CORS_ORIGIN?.replace('http://', '').replace('https://', '') || 'localhost:5173';
        if (siweMessage.domain !== expectedDomain) {
            return {
                success: false,
                error: 'Domain mismatch',
            };
        }

        // Verify not expired
        if (siweMessage.expirationTime && new Date(siweMessage.expirationTime) < new Date()) {
            return {
                success: false,
                error: 'Message expired',
            };
        }

        return {
            success: true,
            address: siweMessage.address.toLowerCase(),
        };
    } catch (error: any) {
        console.error('SIWE verification error:', error);
        return {
            success: false,
            error: error.message || 'Verification failed',
        };
    }
}

// Generate SIWE message template
export function createSiweMessageTemplate(
    address: string,
    nonce: string,
    chainId: number = 84532 // Base Sepolia
): string {
    const domain = process.env.CORS_ORIGIN?.replace('http://', '').replace('https://', '') || 'localhost:5173';
    const uri = process.env.CORS_ORIGIN || 'http://localhost:5173';

    return new SiweMessage({
        domain,
        address,
        statement: 'Sign in to Base Jungle',
        uri,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    }).prepareMessage();
}
