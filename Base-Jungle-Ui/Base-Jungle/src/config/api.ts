export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://base-jungle.onrender.com' : 'http://localhost:3001'),
    wsURL: import.meta.env.VITE_WS_URL || (import.meta.env.MODE === 'production' ? 'https://base-jungle.onrender.com' : 'http://localhost:3001'),
    environment: import.meta.env.MODE || 'development',
};

// API endpoints
export const API_ENDPOINTS = {
    // Auth
    getNonce: (address: string) => `${API_CONFIG.baseURL}/api/auth/nonce?address=${address}`,
    verify: `${API_CONFIG.baseURL}/api/auth/verify`,
    logout: `${API_CONFIG.baseURL}/api/auth/logout`,
    session: `${API_CONFIG.baseURL}/api/auth/session`,

    // Vaults
    vaults: `${API_CONFIG.baseURL}/api/vaults`,

    // User
    portfolio: (address: string) => `${API_CONFIG.baseURL}/api/user/${address}/portfolio`,
    points: (address: string) => `${API_CONFIG.baseURL}/api/user/${address}/points`,
    referrals: (address: string) => `${API_CONFIG.baseURL}/api/user/${address}/referrals`,

    // Leaderboard
    leaderboard: `${API_CONFIG.baseURL}/api/leaderboard`,

    // Transactions
    depositPreview: `${API_CONFIG.baseURL}/api/deposit/preview`,
    withdrawPreview: `${API_CONFIG.baseURL}/api/deposit/withdraw/preview`,
};
