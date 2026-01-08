export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || '', // Relative path by default to avoid port issues
    wsURL: import.meta.env.VITE_WS_URL || (typeof window !== 'undefined' ? `ws://${window.location.host}` : 'ws://localhost:3000'),
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

    // Vault Operations
    vaultPosition: (vault: string, user: string) => `${API_CONFIG.baseURL}/api/vault/${vault}/user/${user}/position`,
    trackDeposit: `${API_CONFIG.baseURL}/api/vault/track-deposit`,
    trackWithdrawal: `${API_CONFIG.baseURL}/api/vault/track-withdrawal`,

    // GraphQL
    graphql: `${API_CONFIG.baseURL}/api/graphql`,

    // Settings
    settings: `${API_CONFIG.baseURL}/api/settings`,

    // Activities
    activities: `${API_CONFIG.baseURL}/api/activities`, // Note: Endpoint may need implementation

    // Specimen/Referrals
    myReferrals: (address: string) => `${API_CONFIG.baseURL}/api/user/${address}/my-referrals`,
};
