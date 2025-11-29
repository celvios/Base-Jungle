# Base Jungle Keeper Bots

Autonomous keeper bots for Base Jungle protocol operations.

## Bots

### HarvestKeeper
Automatically harvests DeFi rewards when profitable.

**Features:**
- Checks pending AERO rewards every 6 hours
- Calculates profitability (reward value vs gas cost)
- Only executes if ROI > 1.5x
- Gas price monitoring (skips if > 50 gwei)

**Run:**
```bash
npm run harvest
```

### RebalanceKeeper
Monitors leveraged positions and rebalances when health factor drifts.

### ActivityScanner
Checks referral activity and marks inactive users (30-day window).

### HealthMonitor
System-wide health checks and alerting.

## Setup

1. Install dependencies:
```bash
cd scripts/keepers
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Update contract addresses in `config/keepers.json`

4. Run individual keeper:
```bash
npm run harvest    # HarvestKeeper
npm run rebalance  # RebalanceKeeper
npm run monitor    # HealthMonitor
```

5. Run all keepers (production):
```bash
npm start
```

## Configuration

Edit `config/keepers.json`:

```json
{
  "keeper": {
    "maxGasPriceGwei": 50,           // Skip if gas > this
    "profitabilityThreshold": 1.5,   // Min ROI (1.5x = 50% profit)
    "harvestIntervalHours": 6,       // Harvest every 6 hours
    "minHarvestValueUSD": 5          // Min $5 reward to harvest
  }
}
```

## Profitability Logic

```
Reward Value = AERO tokens * AERO price
Gas Cost = Gas units * Gas price * ETH price
ROI = Reward Value / Gas Cost

Execute if:
  - ROI >= 1.5x
  - Reward Value >= $5
  - Gas Price <= 50 gwei
```

## Production Deployment

Use Docker + cron for 24/7 operation:

```yaml
# docker-compose.yml
services:
  keeper-bots:
    build: ./scripts/keepers
    environment:
      - BASE_RPC_URL=${BASE_RPC_URL}
      - KEEPER_PRIVATE_KEY=${KEEPER_PRIVATE_KEY}
    restart: unless-stopped
```

## Monitoring

Keepers log all operations to console. Integrate with:
- Winston (structured logging)
- Telegram alerts (failures)
- Sentry (error tracking)
- Datadog/Grafana (metrics)
