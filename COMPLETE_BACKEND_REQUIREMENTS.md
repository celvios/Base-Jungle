# Base Jungle - Complete Backend & Smart Contract Requirements

This document provides an exhaustive analysis of ALL backend and smart contract requirements needed to make the Base Jungle protocol fully functional. Nothing is omitted.

---

## TABLE OF CONTENTS

1. [Data Models & Schema](#1-data-models--schema)
2. [Authentication & Wallet](#2-authentication--wallet)
3. [Dashboard Widgets](#3-dashboard-widgets)
4. [Modal Systems](#4-modal-systems)
5. [Page-Specific APIs](#5-page-specific-apis)
6. [Smart Contracts](#6-smart-contracts)
7. [Real-Time Systems](#7-real-time-systems)
8. [External Integrations](#8-external-integrations)
9. [Infrastructure](#9-infrastructure)
10. [Security](#10-security)

---

## 1. DATA MODELS & SCHEMA

### 1.1 User Model
```typescript
interface User {
  id: string;                    // UUID
  walletAddress: string;         // 0x... Ethereum address (PRIMARY KEY)
  username?: string;             // Optional display name
  referralCode: string;          // Unique referral code (e.g., "ABC123XYZ")
  referredBy?: string;           // Wallet address of referrer
  tier: "Novice" | "Scout" | "Captain" | "Whale";
  createdAt: Date;
  lastActiveAt: Date;
  
  // Settings
  autoCompound: boolean;
  riskLevel: "low" | "medium" | "high";
  leverageActive: boolean;
  leverageMultiplier: number;    // 1, 2, 3, 5
}
```

### 1.2 Vault Position Model
```typescript
interface VaultPosition {
  id: string;
  userAddress: string;
  vaultId: string;
  vaultAddress: string;          // On-chain vault contract address
  
  // Amounts (in wei, convert to USD via oracle)
  principal: bigint;             // Original deposit
  currentValue: bigint;          // Current value including yield
  pendingRewards: bigint;        // Unharvested yield
  
  // Timestamps
  depositedAt: Date;
  maturityDate: Date;
  lastHarvestAt?: Date;
  
  // Metadata
  isMature: boolean;
  daysStaked: number;
  roi: number;                   // Percentage
}
```

### 1.3 Referral Node Model
```typescript
interface ReferralNode {
  userAddress: string;
  referrerAddress: string;
  level: 1 | 2;                  // Direct (1) or indirect (2)
  joinedAt: Date;
  isActive: boolean;             // Has deposits in last 30 days
  totalDeposited: bigint;
  bonusPointsGenerated: number;
}
```

### 1.4 Points Model
```typescript
interface PointsRecord {
  userAddress: string;
  totalPoints: number;
  dailyPointRate: number;        // Points accrued per day
  lastAccruedAt: Date;
  
  // History
  history: {
    date: Date;
    points: number;
    source: "deposit" | "harvest" | "referral" | "bonus" | "daily";
  }[];
}
```

### 1.5 Bot Activity Model
```typescript
interface BotActivity {
  id: string;
  type: "HARVESTER" | "REBALANCER" | "LIQUIDATOR";
  action: string;                // "Executed", "Rebalanced", etc.
  gasUsed: bigint;
  gasUsd: number;
  txHash: string;
  timestamp: Date;
  
  // Optional - user-specific context
  userAddress?: string;
  vaultId?: string;
  amountProcessed?: bigint;
}
```

### 1.6 Market Health Model
```typescript
interface MarketHealth {
  timestamp: Date;
  currentAPY: number;            // e.g., 18.5
  status: "STABLE" | "VOLATILE" | "CRISIS";
  totalTVL: bigint;
  utilizationRate: number;       // 0-100 percentage
  historicalAPY: number[];       // Last 100 data points
}
```

### 1.7 Vault Model
```typescript
interface Vault {
  id: string;
  name: string;                  // "Master Vault #1"
  address: string;               // On-chain address
  currentAPY: number;
  totalDeposits: bigint;
  maxCapacity: bigint;
  riskLevel: "low" | "medium" | "high";
  strategies: string[];          // ["lending", "liquidity"]
  isActive: boolean;
}
```

### 1.8 Leaderboard Entry Model
```typescript
interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  tier: string;
  referrals: number;
}
```

---

## 2. AUTHENTICATION & WALLET

### 2.1 SIWE (Sign-In With Ethereum) Flow

**Purpose:** Verify wallet ownership without exposing private keys.

#### API Endpoints

```
GET /api/auth/nonce
  Response: { nonce: string, expiresAt: timestamp }
  
  - Generates cryptographic nonce for signing
  - Store nonce in Redis with 5-minute TTL
```

```
POST /api/auth/verify
  Body: {
    message: string,        // SIWE formatted message
    signature: string,      // Wallet signature
    address: string         // Claimed wallet address
  }
  Response: {
    success: boolean,
    token: string,          // JWT session token
    user: User
  }
  
  - Verify signature matches address
  - Check nonce hasn't been used
  - Create session, return JWT
```

```
POST /api/auth/logout
  Headers: { Authorization: "Bearer <token>" }
  Response: { success: true }
  
  - Invalidate session token
```

```
GET /api/auth/session
  Headers: { Authorization: "Bearer <token>" }
  Response: { user: User, expiresAt: timestamp }
  
  - Validate token, return current user
```

### 2.2 User Registration

```
POST /api/user/register
  Body: {
    walletAddress: string,
    referralCode?: string    // Optional referrer code
  }
  Response: {
    success: boolean,
    user: User,
    referralCode: string     // User's own referral code
  }
  
  - Generate unique referral code
  - Link to referrer if code provided
  - Initialize default settings
```

```
GET /api/user/:walletAddress
  Response: {
    address: string,
    isRegistered: boolean,
    referralCode: string,
    referredBy?: string,
    tier: string,
    createdAt: timestamp
  }
```

---

## 3. DASHBOARD WIDGETS

### 3.1 Rain Catcher (Total Value Locked / Net Worth)

**Frontend Props:**
```typescript
interface RainCatcherProps {
  netWorth: number;        // Total deposited value in USD
  recentHarvest: number;   // Last harvest amount (triggers animation)
  isBooting: boolean;
}
```

**Required API:**
```
GET /api/user/:walletAddress/portfolio
  Response: {
    netWorth: number,           // Total value in USD
    totalDeposited: number,     // Principal amount
    totalYield: number,         // Accumulated yield
    recentHarvest: number,      // Last harvest for rain animation
    lastHarvestTime: timestamp,
    positions: VaultPosition[]
  }
```

**Required Smart Contract:**
```solidity
function getUserTotalDeposits(address user) external view returns (uint256);
function getPendingRewards(address user) external view returns (uint256);
function getPositions(address user) external view returns (Position[] memory);
```

---

### 3.2 Sonar (Bot Activity Feed)

**Frontend Props:**
```typescript
interface SonarProps {
  isBooting: boolean;
}
// Generates mock activities internally - needs real WebSocket feed
```

**Required API:**
```
GET /api/bot-activity
  Query: { limit: 10, userAddress?: string }
  Response: [{
    id: string,
    type: "HARVESTER" | "REBALANCER" | "LIQUIDATOR",
    action: string,
    gasUsd: number,
    txHash: string,
    timestamp: number
  }]
```

**Required WebSocket:**
```
WS /ws/bot-activity
  Push events in real-time:
  {
    type: "bot-executed",
    data: BotActivity
  }
```

**Required Smart Contract Events:**
```solidity
event BotExecuted(
  string indexed botType,
  string action,
  uint256 gasUsed,
  bytes32 txHash,
  uint256 timestamp
);
```

---

### 3.3 Atmosphere (Market Health / APY)

**Frontend Props:**
```typescript
interface AtmosphereProps {
  marketHealth: number;    // Current APY percentage (e.g., 18.5)
  isBooting: boolean;
}
```

**Required API:**
```
GET /api/market/health
  Response: {
    currentAPY: number,
    status: "STABLE" | "VOLATILE" | "CRISIS",
    totalTVL: number,
    utilizationRate: number,
    historicalAPY: number[]    // Last 100 data points for seismograph
  }

GET /api/market/apy-history
  Query: { period: "1h" | "24h" | "7d" | "30d" }
  Response: [{ timestamp: number, apy: number }]
```

**Required WebSocket:**
```
WS /ws/market
  Push events:
  {
    type: "apy-update",
    data: { apy: number, status: string }
  }
```

**Required Smart Contract:**
```solidity
function getCurrentAPY(address vault) external view returns (uint256);
function getProtocolHealth() external view returns (
  uint256 totalTVL,
  uint256 averageAPY,
  uint256 utilizationRate
);
```

---

### 3.4 Biomass Capacitor (Points System)

**Frontend Props:**
```typescript
interface BiomassCapacitorProps {
  totalPoints: number;
  rank: string;            // "Novice", "Scout", "Captain", "Whale"
  dailyPointRate: number;  // Points per day
  isBooting: boolean;
}
```

**Required API:**
```
GET /api/user/:walletAddress/points
  Response: {
    totalPoints: number,
    rank: string,
    dailyPointRate: number,
    pointsHistory: [{
      date: timestamp,
      points: number,
      source: string
    }],
    nextRankPoints: number,
    nextRankName: string
  }
```

**Points Accrual Logic (Backend):**
```typescript
// Daily points = (TVL_deposited / 1000) * tier_multiplier
// Tier multipliers: Novice=1.0, Scout=1.1, Captain=1.25, Whale=1.5
// Additional points from: harvests, referrals, special events
```

---

### 3.5 Vine (Referral Tree)

**Frontend Props:**
```typescript
interface VineProps {
  directRefs: number;         // Level 1 referrals
  indirectRefs: number;       // Level 2 referrals
  nextTierRequired: number;   // Refs needed for next tier
  isBooting: boolean;
}
```

**Required API:**
```
GET /api/user/:walletAddress/referrals
  Response: {
    referralCode: string,
    referralLink: string,
    directReferrals: number,
    indirectReferrals: number,
    activeReferrals: number,
    currentTier: string,
    nextTier: string,
    nextTierRequirement: number,
    totalBonusPoints: number,
    referralTree: [{
      address: string,
      level: 1 | 2,
      joinDate: timestamp,
      isActive: boolean,
      totalDeposited: number
    }]
  }

POST /api/referrals/apply
  Body: { walletAddress: string, referralCode: string }
  Response: { success: boolean, referrerAddress: string }
```

**Required Smart Contract:**
```solidity
function getReferrer(address user) external view returns (address);
function getDirectReferrals(address user) external view returns (address[] memory);
function getReferralCount(address user) external view returns (uint256 direct, uint256 indirect);
function registerReferrer(address referrer) external;
function claimReferralBonus() external returns (uint256);
```

---

### 3.6 Strategy Breakers (User Controls)

**Frontend Props:**
```typescript
interface StrategyBreakersProps {
  autoCompound: boolean;
  riskLevel: "low" | "medium" | "high";
  leverageUnlocked: boolean;
  tier: string;
  isBooting: boolean;
}
```

**Required API:**
```
GET /api/user/:walletAddress/settings
  Response: {
    autoCompound: boolean,
    riskLevel: "low" | "medium" | "high",
    leverageUnlocked: boolean,
    leverageActive: boolean,
    leverageMultiplier: number,
    tier: string
  }

PUT /api/user/:walletAddress/settings
  Body: {
    autoCompound?: boolean,
    riskLevel?: "low" | "medium" | "high",
    leverageActive?: boolean,
    leverageMultiplier?: number
  }
  Response: { success: boolean, txHash?: string }
```

**Required Smart Contract:**
```solidity
function setAutoCompound(bool enabled) external;
function getAutoCompound(address user) external view returns (bool);

function setRiskLevel(uint8 level) external; // 0=low, 1=medium, 2=high
function getRiskLevel(address user) external view returns (uint8);

function isLeverageUnlocked(address user) external view returns (bool);
function activateLeverage(uint8 multiplier) external; // 2, 3, or 5
function deactivateLeverage() external;
function getCurrentLeverage(address user) external view returns (uint8);
```

---

## 4. MODAL SYSTEMS

### 4.1 Harvest Modal (Withdraw/Claim)

**Mock Data Currently Used:**
```typescript
const principal = 1000;
const yieldGenerated = 234.56;
const bonusPoints = 500;
const daysStaked = 45;
const estimatedGas = 0.08;
const estimatedAPY = 18.5;
const isMature = true;        // If false, shows penalty state
```

**Required API:**
```
GET /api/user/:walletAddress/deposits/:vaultId
  Response: {
    principal: number,
    yieldGenerated: number,
    bonusPoints: number,
    roi: number,
    daysStaked: number,
    isMature: boolean,
    maturityDate: timestamp,
    earlyWithdrawalFee: number,  // Percentage (e.g., 2)
    estimatedGas: number
  }

POST /api/withdraw/preview
  Body: {
    walletAddress: string,
    vaultId: string,
    amount: number,
    reinvest: boolean
  }
  Response: {
    amountToReceive: number,
    penalty: number,
    pointsForfeited: number,
    gasEstimate: number,
    needsApproval: boolean
  }

POST /api/withdraw/execute
  Body: {
    walletAddress: string,
    vaultId: string,
    amount: number,
    reinvest: boolean,
    signedTx: string           // Signed transaction data
  }
  Response: {
    success: boolean,
    txHash: string,
    amountReceived: number
  }
```

**Required Smart Contract:**
```solidity
function withdraw(address vault, uint256 amount) external returns (uint256);
function withdrawAll(address vault) external returns (uint256);
function harvestYield(address vault) external returns (uint256);
function compoundYield(address vault) external;

function getDepositInfo(address user, address vault) external view returns (
  uint256 principal,
  uint256 yieldEarned,
  uint256 depositTime,
  uint256 maturityTime,
  bool isMature
);

function getEarlyWithdrawalPenalty(address user, address vault) external view returns (uint256);
```

**Smart Contract Events:**
```solidity
event Withdrawn(address indexed user, address indexed vault, uint256 amount, uint256 penalty);
event YieldHarvested(address indexed user, address indexed vault, uint256 amount);
event Compounded(address indexed user, address indexed vault, uint256 amount);
```

---

### 4.2 Seeding Modal (Deposit)

**Mock Data Currently Used:**
```typescript
const userBalance = 5000;
const vaultAPY = 18.5;
const estimatedGas = 0.12;
const maxAmount = 100000;
const vaults = [
  { id: "master-vault-1", name: "Master Vault #1", apy: 18.5 },
  { id: "master-vault-2", name: "Master Vault #2", apy: 15.2 },
  { id: "master-vault-3", name: "Master Vault #3", apy: 22.8 },
];
```

**Required API:**
```
GET /api/vaults
  Response: [{
    id: string,
    name: string,
    address: string,
    apy: number,
    totalDeposits: number,
    maxCapacity: number,
    riskLevel: string,
    strategies: string[],
    isActive: boolean
  }]

GET /api/user/:walletAddress/balance/:tokenAddress
  Response: {
    balance: number,
    symbol: string,
    decimals: number
  }

POST /api/deposit/preview
  Body: {
    walletAddress: string,
    vaultId: string,
    amount: number
  }
  Response: {
    estimatedAPY: number,
    dailyYield: number,
    dailyPoints: number,
    gasEstimate: number,
    needsApproval: boolean,
    allowance: number
  }

POST /api/deposit/execute
  Body: {
    walletAddress: string,
    vaultId: string,
    amount: number,
    referralCode?: string
  }
  Response: {
    success: boolean,
    txHash: string,
    positionId: string
  }
```

**Required Smart Contract:**
```solidity
function deposit(address vault, uint256 amount) external;
function depositWithReferral(address vault, uint256 amount, address referrer) external;

// ERC20 approval check
function allowance(address owner, address spender) external view returns (uint256);

function getVaultInfo(address vault) external view returns (
  string memory name,
  uint256 totalDeposits,
  uint256 currentAPY,
  uint256 maxCapacity,
  bool isActive
);

function getAllVaults() external view returns (address[] memory);
```

**Smart Contract Events:**
```solidity
event Deposited(address indexed user, address indexed vault, uint256 amount);
event DepositedWithReferral(address indexed user, address indexed vault, uint256 amount, address referrer);
```

---

## 5. PAGE-SPECIFIC APIs

### 5.1 Home Page (Landing)

**Components using APIs:**
- `StatsDisplay` - `/api/stats`
- `Strategies` - `/api/strategies`
- `ReferralTiers` - `/api/referral-tiers`
- `TokenSale` - `/api/token-sale`

```
GET /api/stats
  Response: [{
    id: "tvl" | "apy" | "users" | "volume",
    label: string,
    value: string,
    change: string,        // "+12.5%"
    icon: string
  }]

GET /api/strategies
  Response: [{
    id: string,
    name: string,
    description: string,
    apyRange: string,      // "5-12%"
    features: string[],
    icon: string,
    riskLevel: "low" | "medium" | "high"
  }]

GET /api/referral-tiers
  Response: [{
    id: string,
    name: string,
    requirement: string,   // "5 Active Refs"
    pointMultiplier: string,
    maxLeverage: string,
    benefits: string[],
    minReferrals: number
  }]

GET /api/token-sale
  Response: {
    totalCap: string,
    raised: string,
    softCap: string,
    hardCap: string,
    progress: number,      // 0-100
    endsAt: timestamp,
    status: "active" | "ended" | "upcoming"
  }

GET /api/staking-multipliers
  Response: [{
    duration: string,
    multiplier: string,
    withdrawalPolicy: string
  }]
```

---

### 5.2 Dashboard Page

**Data currently mocked in `dashboard.tsx`:**
```typescript
const userData = {
  netWorth: 12450.0,
  totalPoints: 15420,
  rank: "Scout",
  dailyPointRate: 150,
  referrals: {
    direct: 3,
    indirect: 8,
    total: 11,
    nextTierRequired: 5,
  },
  autoCompound: true,
  riskLevel: "medium",
  leverageUnlocked: false,
  tier: "Novice",
  marketHealth: 18.5,
  recentHarvest: 234.56,
  leaderboardRank: 42,
  totalParticipants: 1250,
};
```

**Required Consolidated API:**
```
GET /api/user/:walletAddress/dashboard
  Response: {
    portfolio: {
      netWorth: number,
      recentHarvest: number
    },
    points: {
      totalPoints: number,
      rank: string,
      dailyPointRate: number
    },
    referrals: {
      direct: number,
      indirect: number,
      nextTierRequired: number
    },
    settings: {
      autoCompound: boolean,
      riskLevel: string,
      leverageUnlocked: boolean,
      tier: string
    },
    market: {
      currentAPY: number
    },
    leaderboard: {
      rank: number,
      totalParticipants: number
    }
  }
```

---

### 5.3 Referrals Page

**Data currently mocked in `referrals.tsx`:**
```typescript
const referralData = {
  totalReferrals: 12,
  activeReferrals: 8,
  currentTier: "Scout",
  pointsEarned: 2450,
  nextTier: "Captain",
  nextTierRequirement: 20,
  referralLink: "https://basejungle.xyz/ref/ABC123XYZ",
  referralCode: "ABC123XYZ",
};
```

**Uses:** `/api/user/:walletAddress/referrals` (see section 3.5)

---

### 5.4 Leaderboard Page

**Data currently mocked in `leaderboard.tsx`:**
```typescript
// Generates 50 random entries
```

**Required API:**
```
GET /api/leaderboard
  Query: { limit: 50, offset: 0 }
  Response: {
    rankings: [{
      rank: number,
      address: string,
      points: number,
      tier: string,
      referrals: number
    }],
    total: number
  }

GET /api/user/:walletAddress/rank
  Response: {
    rank: number,
    totalParticipants: number,
    percentile: number
  }
```

---

## 6. SMART CONTRACTS

### 6.1 Contract Architecture

```
BaseJungle Protocol
├── MasterVault.sol           # Main deposit/withdraw/yield logic
├── StrategyManager.sol       # Risk levels, strategy allocation
├── ReferralRegistry.sol      # Referral tracking & bonuses
├── PointsBank.sol            # Points accrual & redemption (optional on-chain)
├── LeverageController.sol    # Leverage activation & management
├── BotCoordinator.sol        # Automated harvesting/rebalancing
├── TokenSale.sol             # $JUNGLE token sale
└── AccessControl.sol         # Admin roles, emergency stops
```

### 6.2 MasterVault.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMasterVault {
    // Deposits
    function deposit(uint256 amount) external;
    function depositWithReferral(uint256 amount, address referrer) external;
    
    // Withdrawals
    function withdraw(uint256 amount) external returns (uint256);
    function withdrawAll() external returns (uint256);
    function harvestYield() external returns (uint256);
    function compoundYield() external;
    
    // View functions
    function getUserTotalDeposits(address user) external view returns (uint256);
    function getPendingRewards(address user) external view returns (uint256);
    function getDepositInfo(address user) external view returns (
        uint256 principal,
        uint256 yieldEarned,
        uint256 depositTime,
        uint256 maturityTime,
        bool isMature
    );
    function getEarlyWithdrawalPenalty(address user) external view returns (uint256);
    function getCurrentAPY() external view returns (uint256);
    function getTotalTVL() external view returns (uint256);
    
    // Events
    event Deposited(address indexed user, uint256 amount, address indexed referrer);
    event Withdrawn(address indexed user, uint256 amount, uint256 penalty);
    event YieldHarvested(address indexed user, uint256 amount);
    event Compounded(address indexed user, uint256 amount);
}
```

### 6.3 StrategyManager.sol

```solidity
interface IStrategyManager {
    // User settings
    function setAutoCompound(bool enabled) external;
    function getAutoCompound(address user) external view returns (bool);
    
    function setRiskLevel(uint8 level) external; // 0=low, 1=medium, 2=high
    function getRiskLevel(address user) external view returns (uint8);
    
    // Strategy allocation
    function getAllocations(address user) external view returns (
        uint256 lendingPercent,
        uint256 liquidityPercent,
        uint256 farmingPercent,
        uint256 arbitragePercent
    );
    
    // Events
    event SettingsUpdated(address indexed user, bool autoCompound, uint8 riskLevel);
    event AllocationChanged(address indexed user, uint256[] percentages);
}
```

### 6.4 ReferralRegistry.sol

```solidity
interface IReferralRegistry {
    function registerReferrer(address referrer) external;
    function getReferrer(address user) external view returns (address);
    function getDirectReferrals(address user) external view returns (address[] memory);
    function getReferralCount(address user) external view returns (uint256 direct, uint256 indirect);
    function claimReferralBonus() external returns (uint256);
    function getPendingBonus(address user) external view returns (uint256);
    
    // Tier system
    function getUserTier(address user) external view returns (uint8); // 0=Novice, 1=Scout, 2=Captain, 3=Whale
    function getTierMultiplier(address user) external view returns (uint256); // 100=1x, 110=1.1x, etc.
    
    // Events
    event ReferralRegistered(address indexed user, address indexed referrer);
    event ReferralBonusClaimed(address indexed user, uint256 amount);
    event TierUpgraded(address indexed user, uint8 newTier);
}
```

### 6.5 LeverageController.sol

```solidity
interface ILeverageController {
    function isLeverageUnlocked(address user) external view returns (bool);
    function activateLeverage(uint8 multiplier) external; // 2, 3, or 5
    function deactivateLeverage() external;
    function getCurrentLeverage(address user) external view returns (uint8);
    function getMaxLeverage(address user) external view returns (uint8); // Based on tier
    
    // Events
    event LeverageActivated(address indexed user, uint8 multiplier);
    event LeverageDeactivated(address indexed user);
}
```

### 6.6 BotCoordinator.sol

```solidity
interface IBotCoordinator {
    // Called by keeper bots
    function executeHarvest(address[] calldata users) external;
    function executeRebalance(address[] calldata vaults) external;
    function executeLiquidation(address user) external;
    
    // View functions
    function getPendingHarvests() external view returns (address[] memory);
    function getRebalanceNeeded() external view returns (address[] memory);
    function getLiquidatablePositions() external view returns (address[] memory);
    
    // Events
    event BotExecuted(
        string indexed botType,
        string action,
        uint256 gasUsed,
        uint256 timestamp
    );
    event HarvestExecuted(address[] users, uint256 totalAmount);
    event RebalanceExecuted(address[] vaults);
    event LiquidationExecuted(address user, uint256 amount);
}
```

### 6.7 TokenSale.sol

```solidity
interface ITokenSale {
    function purchase(uint256 usdcAmount) external;
    function claim() external returns (uint256);
    function getVestingSchedule(address user) external view returns (
        uint256 totalPurchased,
        uint256 claimed,
        uint256 available,
        uint256[] vestingDates,
        uint256[] vestingAmounts
    );
    function getSaleStatus() external view returns (
        uint256 raised,
        uint256 softCap,
        uint256 hardCap,
        uint256 endsAt,
        bool isActive
    );
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed user, uint256 amount);
}
```

---

## 7. REAL-TIME SYSTEMS

### 7.1 WebSocket Channels

```typescript
// Server setup
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

// Channels
const channels = {
  "bot-activity": [],      // All bot execution events
  "market-health": [],     // APY updates, status changes
  "vault-metrics": [],     // TVL changes, deposit/withdraw events
  "referral-growth": [],   // New referrals, tier upgrades
  "user:{address}": [],    // User-specific portfolio updates
};
```

### 7.2 Event Types

```typescript
// Bot Activity
interface BotActivityEvent {
  type: "bot-executed";
  data: {
    botType: string;
    action: string;
    gasUsd: number;
    txHash: string;
    timestamp: number;
  };
}

// Market Health
interface MarketHealthEvent {
  type: "apy-update" | "status-change" | "tvl-update";
  data: {
    currentAPY?: number;
    status?: string;
    totalTVL?: number;
  };
}

// Portfolio Update (user-specific)
interface PortfolioUpdateEvent {
  type: "deposit-confirmed" | "withdraw-confirmed" | "yield-harvested" | "points-accrued";
  data: {
    amount: number;
    newBalance: number;
    txHash?: string;
  };
}
```

### 7.3 Event Indexer

**Purpose:** Listen to blockchain events and push to WebSocket clients.

```typescript
// Backend indexer service
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
});

// Watch for vault deposits
client.watchContractEvent({
  address: MASTER_VAULT_ADDRESS,
  abi: vaultAbi,
  eventName: 'Deposited',
  onLogs: (logs) => {
    logs.forEach(log => {
      broadcastToChannel('vault-metrics', {
        type: 'deposit-confirmed',
        data: {
          user: log.args.user,
          amount: log.args.amount,
          txHash: log.transactionHash,
        }
      });
    });
  },
});

// Watch for bot executions
client.watchContractEvent({
  address: BOT_COORDINATOR_ADDRESS,
  abi: botAbi,
  eventName: 'BotExecuted',
  onLogs: (logs) => {
    logs.forEach(log => {
      broadcastToChannel('bot-activity', {
        type: 'bot-executed',
        data: {
          botType: log.args.botType,
          action: log.args.action,
          gasUsed: log.args.gasUsed,
          timestamp: Date.now(),
        }
      });
    });
  },
});
```

---

## 8. EXTERNAL INTEGRATIONS

### 8.1 DeFi Protocols

| Protocol | Purpose | Integration |
|----------|---------|-------------|
| **Aave** | Lending/Borrowing | Supply/borrow loops for yield |
| **Moonwell** | Lending on Base | Alternative lending protocol |
| **Aerodrome** | DEX/AMM | Liquidity provision, AERO rewards |
| **Uniswap V3** | DEX/AMM | Concentrated liquidity |
| **Beefy Finance** | Yield Aggregator | Auto-compound vaults |

### 8.2 Oracles

| Oracle | Purpose | Data |
|--------|---------|------|
| **Chainlink** | Price feeds | ETH/USD, USDC/USD, token prices |
| **Pyth** | Low-latency prices | Real-time market data |
| **RedStone** | Backup oracle | Fallback price feeds |

### 8.3 Indexing

| Service | Purpose |
|---------|---------|
| **The Graph** | Index contract events, query historical data |
| **Ponder** | Alternative indexer for Base |
| **Goldsky** | Managed subgraph hosting |

### 8.4 RPC Providers

| Provider | Purpose |
|----------|---------|
| **Alchemy** | Primary RPC for Base mainnet |
| **QuickNode** | Backup RPC |
| **Infura** | Additional redundancy |

---

## 9. INFRASTRUCTURE

### 9.1 Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  wallet_address VARCHAR(42) PRIMARY KEY,
  username VARCHAR(50),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by VARCHAR(42) REFERENCES users(wallet_address),
  tier SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
  wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users(wallet_address),
  auto_compound BOOLEAN DEFAULT true,
  risk_level SMALLINT DEFAULT 1,
  leverage_active BOOLEAN DEFAULT false,
  leverage_multiplier SMALLINT DEFAULT 1
);

-- Points ledger
CREATE TABLE points (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) REFERENCES users(wallet_address),
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_points_wallet ON points(wallet_address);
CREATE INDEX idx_points_created ON points(created_at);

-- Referrals
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer VARCHAR(42) REFERENCES users(wallet_address),
  referee VARCHAR(42) REFERENCES users(wallet_address),
  level SMALLINT NOT NULL, -- 1=direct, 2=indirect
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer);

-- Bot activity log
CREATE TABLE bot_activity (
  id SERIAL PRIMARY KEY,
  bot_type VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  gas_used BIGINT,
  gas_usd DECIMAL(10, 4),
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bot_activity_created ON bot_activity(created_at DESC);

-- Market health snapshots
CREATE TABLE market_health (
  id SERIAL PRIMARY KEY,
  current_apy DECIMAL(5, 2),
  status VARCHAR(20),
  total_tvl DECIMAL(20, 8),
  utilization_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_market_health_created ON market_health(created_at DESC);

-- Leaderboard cache (updated periodically)
CREATE TABLE leaderboard_cache (
  rank INTEGER PRIMARY KEY,
  wallet_address VARCHAR(42),
  points INTEGER,
  tier SMALLINT,
  referrals INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 9.2 Redis Cache

```typescript
// Cache keys
const CACHE_KEYS = {
  LEADERBOARD: 'leaderboard:top50',           // TTL: 5 minutes
  MARKET_HEALTH: 'market:health',              // TTL: 30 seconds
  USER_POINTS: (addr: string) => `user:${addr}:points`, // TTL: 1 minute
  BOT_ACTIVITY: 'bot:activity:recent',         // TTL: 30 seconds
  VAULT_APY: (vault: string) => `vault:${vault}:apy`, // TTL: 1 minute
};
```

### 9.3 Job Queue (Bull/BullMQ)

```typescript
// Scheduled jobs
const jobs = {
  'compute-leaderboard': { cron: '*/5 * * * *' },    // Every 5 minutes
  'accrue-daily-points': { cron: '0 0 * * *' },       // Daily at midnight
  'update-tier-status': { cron: '*/30 * * * *' },     // Every 30 minutes
  'sync-on-chain-data': { cron: '*/1 * * * *' },      // Every minute
  'cleanup-old-sessions': { cron: '0 */6 * * *' },    // Every 6 hours
};
```

---

## 10. SECURITY

### 10.1 Authentication

- **SIWE (Sign-In With Ethereum):** Cryptographic wallet verification
- **Nonce replay protection:** One-time-use nonces stored in Redis
- **JWT tokens:** Short-lived session tokens (15 minutes)
- **Refresh tokens:** Longer-lived tokens for session renewal (7 days)

### 10.2 API Security

- **Rate limiting:** 100 requests/minute per IP, 1000/minute per wallet
- **Request signing:** Critical mutations require wallet signature
- **Input validation:** Zod schemas on all endpoints
- **SQL injection protection:** Parameterized queries via Drizzle ORM

### 10.3 Smart Contract Security

- **Timelock:** 48-hour delay on critical parameter changes
- **Multi-sig:** Admin functions require 3/5 signatures
- **Circuit breakers:** Emergency pause on high volatility
- **Reentrancy guards:** All external calls protected
- **Slippage protection:** Maximum 1% slippage on swaps
- **Flash loan protection:** Deposit/withdraw in same block prevented

### 10.4 Infrastructure Security

- **Secrets management:** All API keys in environment variables
- **HTTPS only:** TLS 1.3 for all connections
- **CORS:** Strict origin whitelist
- **CSP headers:** Content Security Policy enforced
- **Audit logs:** All admin actions logged

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Backend (Week 1-2)
1. User registration & SIWE authentication
2. Basic portfolio API (deposits, balances)
3. Points system (off-chain calculation)
4. Leaderboard API

### Phase 2: Smart Contracts (Week 3-4)
1. MasterVault (deposit/withdraw)
2. ReferralRegistry
3. StrategyManager
4. Event indexer

### Phase 3: Advanced Features (Week 5-6)
1. LeverageController
2. BotCoordinator
3. WebSocket real-time updates
4. TokenSale contract

### Phase 4: Production (Week 7-8)
1. Security audit
2. Load testing
3. Mainnet deployment
4. Monitoring & alerting

---

## SUMMARY

### Total API Endpoints: 25+

| Category | Endpoints |
|----------|-----------|
| Auth | 4 |
| User | 6 |
| Portfolio | 4 |
| Vaults | 3 |
| Referrals | 3 |
| Points/Leaderboard | 3 |
| Market | 2 |
| Bot Activity | 1 |

### Total Smart Contracts: 7
- MasterVault, StrategyManager, ReferralRegistry, PointsBank, LeverageController, BotCoordinator, TokenSale

### WebSocket Channels: 5
- bot-activity, market-health, vault-metrics, referral-growth, user:{address}

### Database Tables: 7
- users, user_settings, points, referrals, bot_activity, market_health, leaderboard_cache

### External Integrations: 10+
- DeFi: Aave, Moonwell, Aerodrome, Uniswap V3, Beefy
- Oracles: Chainlink, Pyth, RedStone
- Indexers: The Graph, Ponder
- RPC: Alchemy, QuickNode
