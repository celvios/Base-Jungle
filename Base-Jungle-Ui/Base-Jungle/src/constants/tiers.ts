export interface TierConfig {
    name: string;
    id: string;
    minDeposit: number;
    minReferrals: number;
    maxLeverage: number;
    pointMultiplier: number;
}

export const TIER_LEVELS: TierConfig[] = [
    {
        name: 'Novice',
        id: 'novice',
        minDeposit: 0,
        minReferrals: 0,
        maxLeverage: 2.0,
        pointMultiplier: 1.0,
    },
    {
        name: 'Scout',
        id: 'scout',
        minDeposit: 1000,
        minReferrals: 5,
        maxLeverage: 3.0,
        pointMultiplier: 1.1,
    },
    {
        name: 'Captain',
        id: 'captain',
        minDeposit: 10000,
        minReferrals: 20,
        maxLeverage: 5.0,
        pointMultiplier: 1.25,
    },
    {
        name: 'Whale',
        id: 'whale',
        minDeposit: 50000,
        minReferrals: 50,
        maxLeverage: 10.0,
        pointMultiplier: 1.5,
    },
];

export const getTierByName = (name: string): TierConfig => {
    return TIER_LEVELS.find(t => t.name.toLowerCase() === name.toLowerCase()) || TIER_LEVELS[0];
};

export const getNextTier = (currentTierName: string): TierConfig | null => {
    const currentIndex = TIER_LEVELS.findIndex(t => t.name.toLowerCase() === currentTierName.toLowerCase());
    if (currentIndex === -1 || currentIndex === TIER_LEVELS.length - 1) return null;
    return TIER_LEVELS[currentIndex + 1];
};
