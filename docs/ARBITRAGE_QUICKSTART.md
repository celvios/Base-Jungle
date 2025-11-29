# Arbitrage System Quick Start Guide

## Prerequisites

✅ Node.js v18+ installed  
✅ Hardhat configured  
✅ Base Sepolia ETH in deployer wallet  
✅ DEXAggregator already deployed

## 1. Deploy Contracts

```bash
# Set environment variables
export DEX_AGGREGATOR_ADDRESS=0x...  # Your deployed DEXAggregator

# Deploy arbitrage system
npx hardhat run scripts/deploy-arbitrage-system.cjs --network base-sepolia
```

Expected output:
```
✅ BalancerFlashLoanReceiver deployed to: 0x...
✅ ArbitrageStrategy deployed to: 0x...
```

## 2. Verify Contracts

```bash
# Verify on Basescan
npx hardhat verify --network base-sepolia <FLASH_LOAN_RECEIVER_ADDRESS> "0xBA12222222228d8Ba445958a75a0704d566BF2C8"

npx hardhat verify --network base-sepolia <STRATEGY_ADDRESS> "<FLASH_LOAN_RECEIVER_ADDRESS>" "<DEX_AGGREGATOR_ADDRESS>"
```

## 3. Configure Keeper Bot

```bash
cd scripts/keepers

# Copy environment template
cp .env.arbitrage.example .env.arbitrage

# Edit .env.arbitrage with your values:
# - KEEPER_PRIVATE_KEY (wallet with KEEPER_ROLE)
# - ARBITRAGE_STRATEGY_ADDRESS (from deployment)
# - DEX_AGGREGATOR_ADDRESS
# - Token addresses
```

## 4. Run Keeper Bot

```bash
# Install dependencies
npm install

# Start keeper
ts-node ArbitrageKeeper.ts
```

Expected output:
```
🤖 Starting Arbitrage Keeper...
   Wallet: 0x...
   Strategy: 0x...
   Check interval: 5000ms

🎯 Arbitrage Opportunity Found!
   Pair: USDC/WETH
   Flash Loan: $10000
   Est. Profit: $52
   Route: Aerodrome -> UniswapV3
   ✅ Simulation passed, executing...
   📝 TX submitted: 0x...
   ✅ Success! Profit: $52.34
```

## 5. Monitor Performance

Check stats every minute:
```
📊 Arbitrage Keeper Statistics
   Opportunities found: 15
   Executions: 8
   Failed: 2
   Total profit: $423.50
   Average profit: $52.94
```

## Configuration Tips

### Adjust Profitability Threshold

```javascript
// In .env.arbitrage
MIN_PROFIT_USD=20  // Require $20 minimum profit
```

Or via contract:
```bash
# Set 1% minimum profit (100 basis points)
cast send $STRATEGY_ADDRESS "setMinProfitBasisPoints(uint256)" 100 \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY
```

### Adjust Gas Limits

```javascript
// In .env.arbitrage
MAX_GAS_PRICE_GWEI=50  // Skip if gas > 50 gwei
```

Or via contract:
```bash
# Set max 50 gwei
cast send $STRATEGY_ADDRESS "setMaxGasPrice(uint256)" 50000000000 \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY
```

### Pause Strategy

```bash
# Emergency pause
cast send $STRATEGY_ADDRESS "setPaused(bool)" true \
  --rpc-url $RPC_URL \
  --private-key $ADMIN_KEY
```

## Troubleshooting

### "No opportunities found"

Possible causes:
- Markets are efficient (small price differences)
- Gas prices too high
- Minimum profit threshold too high

**Solution**: Lower MIN_PROFIT_USD or wait for volatile markets

### "Gas price too high, skipping"

**Solution**: Increase MAX_GAS_PRICE_GWEI in config

### "Not profitable enough"

**Solution**: Lower minProfitBasisPoints:
```bash
cast send $STRATEGY_ADDRESS "setMinProfitBasisPoints(uint256)" 25
```

### "Transaction failed"

Possible causes:
- Price moved during execution
- Slippage too high
- Insufficient liquidity

**Solution**: Keeper will retry next opportunity automatically

## Advanced: Add More Trading Pairs

Edit `ArbitrageKeeper.ts`:
```typescript
private readonly PAIRS = [
  { tokenA: USDC, tokenB: WETH, symbol: 'USDC/WETH' },
  { tokenA: USDC, tokenB: DAI, symbol: 'USDC/DAI' },
  // Add more pairs:
  { tokenA: WETH, tokenB: WBTC, symbol: 'WETH/WBTC' },
  { tokenA: DAI, tokenB: USDT, symbol: 'DAI/USDT' },
];
```

## Performance Benchmarks

**Expected Performance** (Base mainnet):
- Opportunities: 5-20 per day
- Success rate: 60-80%
- Average profit: $30-100 per trade
- Daily profit: $150-800
- Annual APY contribution: 10-40%

**Gas Costs**:
- Flash loan + 2 swaps: ~300k gas
- At 2 gwei: ~$1.50 per trade
- At 10 gwei: ~$7.50 per trade

**Break-even**: Need >$10 profit at typical gas prices

## Next Steps

1. ✅ Deploy contracts
2. ✅ Verify on Basescan
3. ✅ Start keeper bot
4. 📊 Monitor for 24 hours
5. 🔧 Tune parameters based on results
6. 📈 Scale up flash loan amounts if profitable
7. 🌍 Add more trading pairs
8. 🔔 Set up Telegram alerts (optional)

Happy arbitraging! 🚀
