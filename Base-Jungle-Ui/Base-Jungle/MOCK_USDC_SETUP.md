# Mock USDC Configuration

image.png## Overview
The application now uses **Mock USDC** for all payments and yields until mainnet deployment. This allows for testing without real funds.

## Configuration

### Token Address
- **Mock USDC Address**: `0x634c1cf5129fC7bd49736b9684375E112e4000E1` (Base Sepolia)
- **Network**: Base Sepolia Testnet
- **Decimals**: 6 (same as real USDC)

### Environment Variables
Set in your `.env` file:
```bash
VITE_USDC_ADDRESS=0x634c1cf5129fC7bd49736b9684375E112e4000E1
```

If not set, the app defaults to the deployed mock USDC address above.

## Implementation Details

### Token Configuration (`src/constants/tokens.ts`)
- Centralized token configuration
- `TOKEN_CONFIG.USDC` contains all token metadata
- `isMock: true` flag indicates this is a test token
- Helper functions: `getTokenDisplayName()` and `getTokenSymbol()`

### Updated Components
The following components now display "Mock USDC" instead of "USDC":
- `src/components/modals/deposit-modal.tsx` - Deposit interface
- `src/components/modals/harvest-modal.tsx` - Withdrawal interface  
- `src/components/rewards/ReferralEarnings.tsx` - Referral earnings display
- `src/components/dashboard/terminal/YieldReactor.tsx` - Yield harvesting

### Hooks Updated
- `src/hooks/use-vault.ts` - Now imports USDC address from token config
- All vault operations use Mock USDC automatically

## Minting Mock USDC

To mint Mock USDC for testing:

### Option 1: Using the Mint Script
```bash
cd scripts
node mint-usdc.js <your-address> <amount>
# Example: node mint-usdc.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 10000
```

### Option 2: Direct Contract Call
1. Go to [Base Sepolia Explorer](https://sepolia.basescan.org/)
2. Navigate to contract: `0x634c1cf5129fC7bd49736b9684375E112e4000E1`
3. Click "Contract" → "Write Contract"
4. Connect wallet
5. Call `mint(address to, uint256 amount)`
   - `to`: Your wallet address
   - `amount`: Amount in 6 decimals (e.g., `10000000000` for 10,000 USDC)

## Switching to Mainnet USDC

When ready for mainnet:

1. Update `src/constants/tokens.ts`:
   ```typescript
   export const USDC_ADDRESS: Address = MAINNET_USDC_ADDRESS;
   export const TOKEN_CONFIG = {
     USDC: {
       // ... update config
       isMock: false,
       network: 'base',
     },
   };
   ```

2. Update environment variable:
   ```bash
   VITE_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```

3. Redeploy contracts with mainnet USDC address

## Notes
- All payments are in Mock USDC
- All yields are in Mock USDC
- UI displays "Mock USDC" to clearly indicate test tokens
- Mock USDC can be minted unlimited for testing purposes

