# Fee Structure & Collection

## Deposit Fees

### Fee Rate
- **Conservative Vault**: 0.1% (10 basis points)
- **Aggressive Vault**: 0% (no deposit fee for high-tier users)

### How It Works
1. When a user deposits, a fee is calculated: `fee = (depositAmount * depositFee) / 10000`
2. The fee is deducted from the deposit amount
3. Fee is sent to `feeCollector` (TreasuryManager) immediately
4. Remaining amount is allocated to strategies

### Example
- Deposit: $1,000 USDC
- Fee (0.1%): $1 USDC → Sent to TreasuryManager
- Amount allocated: $999 USDC → Goes to strategies

## Fee Collection

Fees are collected in the **TreasuryManager** contract:
- **Address**: `0x87D8EEFfD2529982BE74ac6eDD851BcFcacCFC44` (Base Sepolia)

### Fee Distribution (when distributed)
- 40% → Liquidity Reserve
- 30% → Development Fund
- 20% → Marketing Fund
- 10% → Team Fund

## Check Total Fees Collected

### Command to Run:
```bash
cd "C:\Users\toluk\Desktop\Base Jungle"
npx hardhat run scripts/check-fees.cjs --network baseSepolia
```

### What It Shows:
- Current deposit fee rates for both vaults
- Fee collector addresses
- Total USDC balance in TreasuryManager
- Fund breakdown (liquidity, dev, marketing, team)
- Vault balances

### Alternative: Direct Contract Call
```bash
# Check TreasuryManager balance
cast call 0x87D8EEFfD2529982BE74ac6eDD851BcFcacCFC44 "getFundBreakdown(address)(uint256,uint256,uint256,uint256,uint256)" 0x634c1cf5129fC7bd49736b9684375E112e4000E1 --rpc-url https://sepolia.base.org

# Check deposit fee rate
cast call 0x986ca22e9f0A6104AAdea7C2698317A690045D13 "depositFee()(uint256)" --rpc-url https://sepolia.base.org
```

## Implementation Status

✅ **Implemented**:
- Deposit fee calculation (0.1% for Conservative Vault)
- Fee transfer to TreasuryManager
- Fee tracking in TreasuryManager
- Events emitted for fee collection

⚠️ **Note**: 
- Fees accumulate in TreasuryManager but are not automatically distributed
- Distribution requires manual call to `distributeFees()` function
- TreasuryManager uses `receiveFunds()` which requires TREASURER_ROLE

## Troubleshooting Deposit Issues

If deposit is stuck after approval:

1. **Check Browser Console** for errors
2. **Check Transaction Hash** - Click "View Approval TX" or "View Deposit TX" links
3. **Common Issues**:
   - Insufficient allowance (approval didn't complete)
   - StrategyController allocation failing
   - Vault paused
   - Below minimum deposit for tier

4. **Check Transaction on BaseScan**:
   - Look for revert reason
   - Check gas used vs gas limit
   - Verify contract state

## Fee Configuration

To change deposit fee (admin only):
```solidity
// Call on vault contract
setDepositFee(uint256 _fee) // in basis points (max 1000 = 10%)
```

To update fee collector:
```solidity
// Call on vault contract  
setFeeCollector(address _feeCollector)
```

