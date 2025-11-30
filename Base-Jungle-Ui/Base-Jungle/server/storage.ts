import { type User, type InsertUser, type VaultStat, type ReferralTier, type Strategy, type TokenSaleData, type StakingMultiplier } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vault Stats
  getVaultStats(): Promise<VaultStat[]>;
  
  // Referral Tiers
  getReferralTiers(): Promise<ReferralTier[]>;
  
  // Strategies
  getStrategies(): Promise<Strategy[]>;
  
  // Token Sale
  getTokenSaleData(): Promise<TokenSaleData>;
  
  // Staking Multipliers
  getStakingMultipliers(): Promise<StakingMultiplier[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vaultStats: VaultStat[];
  private referralTiers: ReferralTier[];
  private strategies: Strategy[];
  private tokenSaleData: TokenSaleData;
  private stakingMultipliers: StakingMultiplier[];

  constructor() {
    this.users = new Map();
    
    // Initialize vault stats
    this.vaultStats = [
      {
        id: "tvl",
        label: "Total Value Locked",
        value: "$45.2M",
        change: "+12.5%",
        icon: "dollar-sign",
      },
      {
        id: "apy",
        label: "Average APY",
        value: "18.4%",
        change: "+2.1%",
        icon: "trending-up",
      },
      {
        id: "users",
        label: "Active Users",
        value: "12,847",
        change: "+8.3%",
        icon: "users",
      },
      {
        id: "volume",
        label: "24h Volume",
        value: "$2.8M",
        change: "+15.7%",
        icon: "zap",
      },
    ];

    // Initialize referral tiers
    this.referralTiers = [
      {
        id: "novice",
        name: "Novice",
        requirement: "0 Referrals",
        pointMultiplier: "1.0x",
        maxLeverage: "1.5x",
        benefits: [
          "Conservative strategies",
          "Stablecoin LP only",
          "Basic lending",
        ],
        minReferrals: 0,
      },
      {
        id: "scout",
        name: "Scout",
        requirement: "5 Active Refs",
        pointMultiplier: "1.1x",
        maxLeverage: "2.0x",
        benefits: [
          "Moderate strategies",
          "Volatile LP access",
          "10% referral bonus",
        ],
        minReferrals: 5,
      },
      {
        id: "captain",
        name: "Captain",
        requirement: "20 Active Refs",
        pointMultiplier: "1.25x",
        maxLeverage: "3.0x",
        benefits: [
          "Aggressive strategies",
          "Leveraged LP",
          "Second-tier rewards",
        ],
        minReferrals: 20,
      },
      {
        id: "whale",
        name: "Whale",
        requirement: "50+ Active Refs",
        pointMultiplier: "1.5x",
        maxLeverage: "5.0x",
        benefits: [
          "All strategies unlocked",
          "Delta-neutral farming",
          "Maximum leverage",
        ],
        minReferrals: 50,
      },
    ];

    // Initialize strategies
    this.strategies = [
      {
        id: "lending",
        name: "Lending & Borrowing",
        description: "Automated recursive lending on Aave and Moonwell for amplified yields with continuous health monitoring.",
        apyRange: "5-12%",
        features: [
          "Supply & borrow loops",
          "Auto health factor management",
          "Protocol reward farming",
        ],
        icon: "dollar-sign",
        riskLevel: "low",
      },
      {
        id: "liquidity",
        name: "Liquidity Provision",
        description: "Provide liquidity on Aerodrome and Uniswap V3, earning trading fees plus token emissions.",
        apyRange: "8-25%",
        features: [
          "Concentrated liquidity",
          "AERO emissions",
          "Auto fee collection",
        ],
        icon: "layers",
        riskLevel: "medium",
      },
      {
        id: "farming",
        name: "Yield Farming",
        description: "Stake LP tokens in farms like Beefy Finance with automated reward harvesting and compounding.",
        apyRange: "10-35%",
        features: [
          "Auto-compound rewards",
          "Multi-protocol access",
          "Optimized rebalancing",
        ],
        icon: "sprout",
        riskLevel: "medium",
      },
      {
        id: "arbitrage",
        name: "Automated Trading",
        description: "Execute arbitrage opportunities across DEXs using flash loans to capture price inefficiencies.",
        apyRange: "15-50%",
        features: [
          "Flash loan integration",
          "Cross-DEX arbitrage",
          "Real-time execution",
        ],
        icon: "arrow-right-left",
        riskLevel: "high",
      },
    ];

    // Initialize token sale data
    const now = new Date();
    const endsAt = new Date(now.getTime() + (17 * 24 + 2 * 1 + 45 * 60 + 56) * 60 * 1000); // 17 days, 2 hours, 45 minutes, 56 seconds from now
    
    this.tokenSaleData = {
      totalCap: "100M USDC",
      raised: "42.6M USDC",
      softCap: "10M USDC",
      hardCap: "65.7M USDC",
      progress: 42.6,
      endsAt,
    };

    // Initialize staking multipliers
    this.stakingMultipliers = [
      {
        duration: "Flexible",
        multiplier: "1.0x",
        withdrawalPolicy: "Anytime",
      },
      {
        duration: "30 Days",
        multiplier: "1.25x",
        withdrawalPolicy: "Locked",
      },
      {
        duration: "90 Days",
        multiplier: "1.50x",
        withdrawalPolicy: "Locked",
      },
      {
        duration: "180 Days",
        multiplier: "2.00x",
        withdrawalPolicy: "Locked",
      },
    ];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getVaultStats(): Promise<VaultStat[]> {
    return this.vaultStats;
  }

  async getReferralTiers(): Promise<ReferralTier[]> {
    return this.referralTiers;
  }

  async getStrategies(): Promise<Strategy[]> {
    return this.strategies;
  }

  async getTokenSaleData(): Promise<TokenSaleData> {
    return this.tokenSaleData;
  }

  async getStakingMultipliers(): Promise<StakingMultiplier[]> {
    return this.stakingMultipliers;
  }
}

export const storage = new MemStorage();
