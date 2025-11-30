# Base Jungle - Backend & Smart Contract Requirements

This document outlines all the data, API endpoints, and smart contract functions required to make the Base Jungle protocol fully functional.

---

## 1. WALLET & AUTHENTICATION

### Smart Contract Functions
```solidity
// No specific auth contract needed - uses wallet signature
```

### Backend API Endpoints
```
GET /api/user/:walletAddress
  Response: { address, isRegistered, referralCode, referredBy, createdAt }

POST /api/user/register
  Body: { walletAddress, referralCode? }
  Response: { success, referralCode }
```

---

## 2. RAIN CATCHER (Total Value Locked / Net Worth)

### Data Required
- `netWorth`: User's total deposited value across all vaults (USD)
- `recentHarvest`: Amount from last yield harvest (triggers rain animation)

### Smart Contract Functions
```solidity
// Read user's total deposits across all vaults
function getUserTotalDeposits(address user) external view returns (uint256);

// Get pending yield/rewards
function getPendingRewards(address user) external view returns (uint256);
```

### Backend API Endpoints
```
GET /api/user/:walletAddress/portfolio
  Response: {
    netWorth: number,           // Total value in USD
    totalDeposited: number,     // Principal amount
    totalYield: number,         // Accumulated yield
    recentHarvest: number,      // Last harvest amount (for animation)
    lastHarvestTime: timestamp
  }
```

---

## 3. SONAR (Bot Activity Feed)

### Data Required
- Real-time bot execution events (harvester, rebalancer, liquidator)
- Transaction hashes, gas costs, action types

### Smart Contract Events
```solidity
event BotExecuted(
  string botType,        // "HARVESTER", "REBALANCER", "LIQUIDATOR"
  string action,         // "Executed", "Rebalanced", "Liquidated"
  uint256 gasUsed,
  bytes32 txHash,
  uint256 timestamp
);
```

### Backend API Endpoints
```
GET /api/bot-activity
  Query: { limit: 10, walletAddress? }
  Response: [{
    id: string,
    type: "HARVESTER" | "REBALANCER" | "LIQUIDATOR",
    action: string,
    gasUsd: number,
    txHash: string,
    timestamp: number
  }]

WebSocket: /ws/bot-activity
  Pushes real-time bot events
```

---

## 4. ATMOSPHERE (Market Health / APY)

### Data Required
- `marketHealth`: Current base APY percentage
- Historical APY data for seismograph visualization
- Market state (STABLE/VOLATILE/CRISIS)

### Smart Contract Functions
```solidity
// Get current vault APY
function getCurrentAPY(address vault) external view returns (uint256);

// Get protocol health metrics
function getProtocolHealth() external view returns (
  uint256 totalTVL,
  uint256 averageAPY,
  uint256 utilizationRate
);
```

### Backend API Endpoints
```
GET /api/market/health
  Response: {
    currentAPY: number,
    status: "STABLE" | "VOLATILE" | "CRISIS",
    totalTVL: number,
    utilizationRate: number,
    historicalAPY: number[]  // Last 100 data points for chart
  }

GET /api/market/apy-history
  Query: { period: "1h" | "24h" | "7d" | "30d" }
  Response: [{ timestamp, apy }]
```

---

## 5. BIOMASS CAPACITOR (Points System)

### Data Required
- `totalPoints`: User's accumulated points
- `rank`: User's tier name (Novice, Scout, Captain, Whale)
- `dailyPointRate`: Points earned per day based on deposits

### Smart Contract Functions
```solidity
// Points are likely off-chain, but tier affects on-chain multipliers
function getUserTier(address user) external view returns (string memory);
function getTierMultiplier(address user) external view returns (uint256);
```

### Backend API Endpoints
```
GET /api/user/:walletAddress/points
  Response: {
    totalPoints: number,
    rank: string,
    dailyPointRate: number,
    pointsHistory: [{ date, points, source }],
    nextRankPoints: number,
    nextRankName: string
  }

GET /api/points/leaderboard
  Query: { limit: 50 }
  Response: [{
    rank: number,
    address: string,
    points: number,
    tier: string
  }]
```

---

## 6. VINE (Referral Tree)

### Data Required
- `directRefs`: Number of direct referrals
- `indirectRefs`: Number of indirect (2nd level) referrals
- `nextTierRequired`: Referrals needed for next tier
- Referral tree structure for visualization

### Smart Contract Functions
```solidity
// Referral tracking
function getReferrer(address user) external view returns (address);
function getDirectReferrals(address user) external view returns (address[] memory);
function getReferralCount(address user) external view returns (uint256 direct, uint256 indirect);

// Referral bonus distribution
function claimReferralBonus(address user) external returns (uint256);
```

### Backend API Endpoints
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
  Body: { walletAddress, referralCode }
  Response: { success, referrerAddress }
```

---

## 7. STRATEGY BREAKERS (User Controls)

### Data Required
- `autoCompound`: Whether auto-compound is enabled
- `riskLevel`: "low" | "medium" | "high"
- `leverageUnlocked`: Whether user can access leverage
- `leverageActive`: Current leverage state
- `tier`: User's current tier

### Smart Contract Functions
```solidity
// User settings
function setAutoCompound(bool enabled) external;
function getAutoCompound(address user) external view returns (bool);

function setRiskLevel(uint8 level) external; // 0=low, 1=medium, 2=high
function getRiskLevel(address user) external view returns (uint8);

// Leverage (requires tier unlock)
function isLeverageUnlocked(address user) external view returns (bool);
function activateLeverage(uint8 multiplier) external; // 2x or 3x
function deactivateLeverage() external;
function getCurrentLeverage(address user) external view returns (uint8);
```

### Backend API Endpoints
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
  Body: { autoCompound?, riskLevel?, leverageActive? }
  Response: { success, txHash? }
```

---

## 8. HARVEST MODAL (Withdraw)

### Data Required
- `principal`: Original deposit amount
- `yieldGenerated`: Total yield earned
- `bonusPoints`: Points earned from this deposit
- `isMature`: Whether deposit has reached maturity
- `daysStaked`: Duration of stake
- `earlyWithdrawalFee`: Penalty percentage if immature
- `estimatedGas`: Gas cost estimate

### Smart Contract Functions
```solidity
// Withdrawal functions
function withdraw(address vault, uint256 amount) external returns (uint256);
function withdrawAll(address vault) external returns (uint256);

// Harvest yield only (keep principal)
function harvestYield(address vault) external returns (uint256);

// Compound yield back into vault
function compoundYield(address vault) external;

// View functions
function getDepositInfo(address user, address vault) external view returns (
  uint256 principal,
  uint256 yieldEarned,
  uint256 depositTime,
  uint256 maturityTime,
  bool isMature
);

function getEarlyWithdrawalPenalty(address user, address vault) external view returns (uint256);
```

### Backend API Endpoints
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
    earlyWithdrawalFee: number,  // percentage
    estimatedGas: number
  }

POST /api/withdraw/preview
  Body: { walletAddress, vaultId, amount, reinvest: boolean }
  Response: {
    amountToReceive: number,
    penalty: number,
    pointsForfeited: number,
    gasEstimate: number
  }
```

---

## 9. SEEDING MODAL (Deposit)

### Data Required
- `userBalance`: User's wallet token balance
- `vaultList`: Available vaults with APY
- `estimatedDailyYield`: Projected daily returns
- `estimatedPoints`: Points to be earned
- `gasEstimate`: Transaction gas cost

### Smart Contract Functions
```solidity
// Deposit functions
function deposit(address vault, uint256 amount) external;
function depositWithReferral(address vault, uint256 amount, address referrer) external;

// Approval (ERC20)
function approve(address spender, uint256 amount) external returns (bool);
function allowance(address owner, address spender) external view returns (uint256);

// View functions
function getVaultInfo(address vault) external view returns (
  string memory name,
  uint256 totalDeposits,
  uint256 currentAPY,
  uint256 maxCapacity,
  bool isActive
);

function getAllVaults() external view returns (address[] memory);
```

### Backend API Endpoints
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
    strategies: string[]
  }]

GET /api/user/:walletAddress/balance/:tokenAddress
  Response: { balance: number, symbol: string }

POST /api/deposit/preview
  Body: { walletAddress, vaultId, amount }
  Response: {
    estimatedAPY: number,
    dailyYield: number,
    dailyPoints: number,
    gasEstimate: number,
    needsApproval: boolean
  }
```

---

## 10. LEADERBOARD

### Data Required
- Top 50 users ranked by points
- User's own rank position

### Backend API Endpoints
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

## 11. LANDING PAGE STATS

### Backend API Endpoints
```
GET /api/stats
  Response: [{
    id: "tvl",
    label: "Total Value Locked",
    value: "$X.XXM"
  }, {
    id: "users",
    label: "Active Users",
    value: "X,XXX"
  }, {
    id: "apy",
    label: "Average APY",
    value: "XX.X%"
  }, {
    id: "harvested",
    label: "Total Harvested",
    value: "$X.XXM"
  }]

GET /api/strategies
  Response: [{
    id: string,
    name: string,
    description: string,
    protocols: string[],
    riskLevel: string,
    apy: string
  }]

GET /api/token-sale
  Response: {
    totalCap: string,
    raised: string,
    price: string,
    status: "active" | "ended" | "upcoming"
  }
```

---

## 12. REAL-TIME UPDATES (WebSocket)

### WebSocket Endpoints
```
/ws/portfolio/:walletAddress
  Events: portfolio_update, yield_harvested, deposit_confirmed

/ws/bot-activity
  Events: bot_executed, rebalance_complete

/ws/market
  Events: apy_update, health_change
```

---

## 13. SMART CONTRACT SUMMARY

### Core Contracts Needed

1. **MasterVault.sol** - Main deposit/withdraw logic
2. **StrategyManager.sol** - Risk level & strategy allocation
3. **PointsTracker.sol** (optional, can be off-chain)
4. **ReferralRegistry.sol** - Referral tracking & bonuses
5. **LeverageController.sol** - Leverage activation/management
6. **BotExecutor.sol** - Automated harvesting/rebalancing

### Key Events to Emit
```solidity
event Deposited(address indexed user, address indexed vault, uint256 amount);
event Withdrawn(address indexed user, address indexed vault, uint256 amount, uint256 penalty);
event YieldHarvested(address indexed user, address indexed vault, uint256 amount);
event Compounded(address indexed user, address indexed vault, uint256 amount);
event ReferralRegistered(address indexed user, address indexed referrer);
event TierUpgraded(address indexed user, string newTier);
event LeverageActivated(address indexed user, uint8 multiplier);
event SettingsUpdated(address indexed user, bool autoCompound, uint8 riskLevel);
```

---

## 14. INDEXING & CACHING RECOMMENDATIONS

1. **The Graph / Ponder** - Index all smart contract events
2. **Redis** - Cache leaderboard, APY data, bot activity
3. **PostgreSQL** - Store points, referral trees, user preferences
4. **Chainlink / Pyth** - Price oracles for USD conversion

---

## 15. SECURITY CONSIDERATIONS

1. Rate limiting on all API endpoints
2. Signature verification for wallet actions
3. Slippage protection on swaps
4. Timelock on critical parameter changes
5. Multi-sig for admin functions
6. Circuit breakers for market volatility
