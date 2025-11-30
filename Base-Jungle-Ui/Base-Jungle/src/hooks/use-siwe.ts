import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    isAuthenticating: boolean;
    error: string | null;
}

export function useSIWE() {
    const { address, chainId } = useAccount();
    const { signMessageAsync } = useSignMessage();

    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: !!localStorage.getItem('auth_token'),
        token: localStorage.getItem('auth_token'),
        isAuthenticating: false,
        error: null,
    });

    const authenticate = useCallback(async () => {
        if (!address || !chainId) {
            setAuthState(prev => ({ ...prev, error: 'No wallet connected' }));
            return false;
        }

        setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

        try {
            // 1. Get nonce from backend
            const nonceRes = await fetch(`${API_URL}/api/auth/nonce?address=${address}`, {
                credentials: 'include',
            });
            const nonce = await nonceRes.text();

            // 2. Create SIWE message
            const message = new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in to Base Jungle',
                uri: window.location.origin,
                version: '1',
                chainId,
                nonce,
            });

            const preparedMessage = message.prepareMessage();

            // 3. Sign message
            const signature = await signMessageAsync({ message: preparedMessage });

            // 4. Verify signature with backend
            const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: preparedMessage, signature, address }),
                credentials: 'include',
            });

            if (!verifyRes.ok) {
                throw new Error('Authentication failed');
            }

            const { token } = await verifyRes.json();

            // 5. Store token
            localStorage.setItem('auth_token', token);
            setAuthState({
                isAuthenticated: true,
                token,
                isAuthenticating: false,
                error: null,
            });

            return true;
        } catch (error: any) {
            console.error('SIWE authentication error:', error);
            setAuthState(prev => ({
                ...prev,
                isAuthenticating: false,
                error: error.message || 'Authentication failed',
            }));
            return false;
        }
    }, [address, chainId, signMessageAsync]);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setAuthState({
            isAuthenticated: false,
            token: null,
            isAuthenticating: false,
            error: null,
        });

        // Call backend logout
        fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        }).catch(console.error);
    }, []);

    return {
        ...authState,
        authenticate,
        logout,
    };
}
