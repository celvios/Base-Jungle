import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
    // Users table - matches PostgreSQL schema
    User: p.createTable({
        id: p.string(), // wallet_address
        referralCode: p.string(),
        referredBy: p.string().optional(),
        tier: p.int(), // 0=Novice, 1=Scout, 2=Captain, 3=Whale
        autoCompound: p.boolean(),
        riskLevel: p.int(),
        leverageActive: p.boolean(),
        leverageMultiplier: p.int(),
        createdAt: p.int(), // timestamp
        lastActiveAt: p.int(),
    }),

    // Vault positions table
    VaultPosition: p.createTable({
        id: p.string(), // UUID
        userAddress: p.string(),
        vaultAddress: p.string(),
        vaultType: p.string(), // 'conservative' | 'aggressive'
        principal: p.bigint(),
        shares: p.bigint(),
        depositedAt: p.int(),
        lastHarvestAt: p.int().optional(),
        isActive: p.boolean(),
        depositTxHash: p.string(),
    }),

    // Points table
    PointsEvent: p.createTable({
        id: p.string(), // txHash + logIndex
        walletAddress: p.string(),
        amount: p.int(),
        source: p.string(), // 'deposit' | 'harvest' | 'referral' | 'bonus'
        txHash: p.string(),
        createdAt: p.int(),
    }),

    // Referrals table
    Referral: p.createTable({
        id: p.string(), // referrer + referee combo
        referrer: p.string(),
        referee: p.string(),
        level: p.int(), // 1=direct, 2=indirect
        isActive: p.boolean(),
        totalDeposited: p.bigint(),
        createdAt: p.int(),
    }),

    // Market health snapshots
    MarketHealthSnapshot: p.createTable({
        id: p.string(), // block number
        currentApy: p.float(),
        status: p.string(), // 'STABLE' | 'VOLATILE' | 'CRISIS'
        totalTvl: p.bigint(),
        conservativeTvl: p.bigint(),
        aggressiveTvl: p.bigint(),
        utilizationRate: p.float(),
        totalUsers: p.int(),
        activePositions: p.int(),
        timestamp: p.int(),
    }),
}));
