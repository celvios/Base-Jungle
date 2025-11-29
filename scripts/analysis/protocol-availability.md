# Protocol Availability on Base Sepolia - Research Results

## ✅ AVAILABLE ON BASE SEPOLIA

### UniswapV3
- **Factory**: `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24`
- **SwapRouter02**: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
- **Universal Router**: `0x050E797f3625EC8785265e1d9BDd4799b97528A1`
- **Status**: ✅ READY TO DEPLOY

## ⚠️ UNCLEAR/NOT DOCUMENTED

### Aave V3
- Aave faucet exists for Base Sepolia
- Contracts likely deployed
- **But**: Addresses not in main docs
- **Action**: Check Aave address book repository OR skip for now

### Compound V3
- Documentation mentions "Base Sepolia USDC"
- **But**: Specific Comet address not documented
- **Action**: Check Compound repository OR skip for now

## ❌ MAINNET ONLY

### Aerodrome
- Base's #1 DEX
- **Mainnet factory**: `0x420DD381b31aEf6683db6B902084cB0FFECe40Da`
- **Status**: NOT on Sepolia (mainnet only)

### Beefy
- Auto-compounding vaults
- **Status**: NOT on Sepolia (mainnet only)

---

## 📋 REVISED HYBRID DEPLOYMENT PLAN

### Deploy to Sepolia (1 adapter):
✅ **UniswapV3Adapter** - Addresses confirmed

### Test via Mainnet Fork (6 adapters):
- AaveAdapter (use mainnet)
- CompoundAdapter (use mainnet)
- AerodromeLPAdapter (mainnet only)
- AerodromeGaugeAdapter (mainnet only)
- BeefyVaultAdapter (mainnet only)
- LeveragedLPStrategy (needs mainnet liquidity)

This gives us:
- ✅ 1 real Sepolia deployment (UniswapV3)
- ✅ 6 mainnet fork tests (real Base data)
- ✅ 1 existing deployment (Moonwell)
- = 8 total strategies fully tested!

## Base Mainnet Addresses (for fork testing)

### UniswapV3 (Mainnet)
- Factory: `0x33128a8fC17869897dcE68Ed026d694621f6FDfD`
- Router: TBD (will fetch)

### Aave V3 (Mainnet)
- Pool: `0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b` (Base mainnet)

### Aerodrome (Mainnet)
- Router: `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43`
- Factory: `0x420DD381b31aEf6683db6B902084cB0FFECe40Da`

### Moonwell (Mainnet)
- USDC Market: `0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22`
