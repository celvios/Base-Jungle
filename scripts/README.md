# Testing Scripts

This directory contains helper scripts for testing the Base Jungle platform on Base Sepolia testnet.

## Mint Test USDC

Mint test USDC tokens to any address for testing vault deposits.

### Prerequisites

1. **Foundry installed** - Install from https://getfoundry.sh
2. **Environment variables** - Create `contracts/.env` with:
   ```env
   PRIVATE_KEY=your_private_key_here
   USDC_ADDRESS=0xYourDeployedMockUSDCAddress
   BASE_SEPOLIA_RPC=https://sepolia.base.org
   ```

### Usage

**Windows (PowerShell):**
```powershell
# Mint 1000 USDC (default)
.\scripts\mint-test-usdc.ps1 -Recipient 0xYourAddress

# Mint custom amount
.\scripts\mint-test-usdc.ps1 -Recipient 0xYourAddress -Amount 5000
```

**Linux/Mac (Bash):**
```bash
# Make script executable
chmod +x scripts/mint-test-usdc.sh

# Mint 1000 USDC (default)
./scripts/mint-test-usdc.sh 0xYourAddress

# Mint custom amount
./scripts/mint-test-usdc.sh 0xYourAddress 5000
```

### What it does

1. Validates the recipient address
2. Converts the amount to USDC's 6 decimal format
3. Calls the `mint(address,uint256)` function on the MockERC20 contract
4. Displays the new balance

### Example Output

```
========================================
  Base Jungle - Test USDC Minter
========================================

Configuration:
  USDC Contract: 0x1234...5678
  Recipient: 0xabcd...ef01
  Amount: 1000 USDC (1000000000 with 6 decimals)
  RPC URL: https://sepolia.base.org

Proceed with minting? (y/n)
y

Minting test USDC...
✅ Successfully minted 1000 USDC to 0xabcd...ef01

Checking balance...
Current balance: 1000.00 USDC

Done!
```

## Troubleshooting

**Error: "cast: command not found"**
- Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`

**Error: "USDC_ADDRESS not set"**
- Make sure you've created `contracts/.env` with the required variables
- Deploy the MockERC20 contract first if you haven't already

**Error: "Invalid Ethereum address"**
- Ensure the recipient address starts with `0x` and is 42 characters long

**Transaction fails**
- Check you have Base Sepolia ETH for gas fees
- Verify the USDC contract address is correct
- Ensure your private key has permission to mint (is the contract owner)
