# Testing Guide - Base Jungle with Test USDC

This guide walks you through testing the entire Base Jungle application with test USDC on Base Sepolia testnet.

## Prerequisites

1. **MetaMask** installed and connected to Base Sepolia
2. **Base Sepolia ETH** for gas fees ([Get from faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
3. **Test USDC** (we'll mint this in Step 1)

## Environment Setup

Make sure your `.env` file has these variables:

```bash
# Base Sepolia Testnet
VITE_CONSERVATIVE_VAULT_ADDRESS=your_conservative_vault_address
VITE_AGGRESSIVE_VAULT_ADDRESS=your_aggressive_vault_address
VITE_LEVERAGE_CONTROLLER_ADDRESS=your_leverage_controller_address
VITE_REFERRAL_REGISTRY_ADDRESS=your_referral_registry_address
VITE_POINTS_TRACKER_ADDRESS=your_points_tracker_address
VITE_USDC_ADDRESS=your_test_usdc_address
```

---

## Step 1: Mint Test USDC

### Option A: Using the Mint Script (Recommended)

```bash
cd c:\Users\toluk\Desktop\Base Jungle\scripts
bash mint-test-usdc.sh
```

This will:
- Connect to your wallet
- Mint 10,000 test USDC
- Display your new balance

### Option B: Manual Minting via Etherscan

1. Go to your Test USDC contract on [Base Sepolia Etherscan](https://sepolia.basescan.org/)
2. Click "Contract" → "Write Contract"
3. Connect your wallet
4. Find the `mint` function
5. Enter:
   - `to`: Your wallet address
   - `amount`: `10000000000` (10,000 USDC with 6 decimals)
6. Click "Write" and confirm transaction

### Verify Your Balance

```bash
# Check USDC balance
cast call $VITE_USDC_ADDRESS "balanceOf(address)(uint256)" YOUR_ADDRESS --rpc-url https://sepolia.base.org
```

Expected output: `10000000000` (10,000 USDC)

---

## Step 2: Start the Frontend

```bash
cd c:\Users\toluk\Desktop\Base Jungle\Base-Jungle-Ui\Base-Jungle
npm run dev
```

The app should open at `http://localhost:5173`

---

## Step 3: Connect Your Wallet

1. Click **"Connect Wallet"** button
2. Select **MetaMask**
3. Approve the connection
4. Ensure you're on **Base Sepolia** network

---

## Step 4: Test Landing Page Deposit

### 4.1 Navigate to Landing Page
- Go to `http://localhost:5173/`
- You should see the tier cards (Novice, Scout, Captain, Whale)

### 4.2 Select a Tier
- Click on **"Novice"** tier (minimum $100)
- The Deposit Modal should open

### 4.3 Verify Real Data
✅ Check that wallet balance shows your actual USDC balance (should be ~10,000 USDC)
✅ The "Max" button should be clickable

### 4.4 Make a Deposit
1. Enter amount: `100` (or click "Max" for full balance)
2. Click **"Confirm Deposit"**
3. **Approve Transaction** (MetaMask popup #1)
   - This approves USDC spending
   - Wait for confirmation (~5 seconds)
4. **Deposit Transaction** (MetaMask popup #2)
   - This deposits USDC into the vault
   - Wait for confirmation (~5 seconds)

### Expected Result
- ✅ Modal shows "Approving..." then "Depositing..."
- ✅ Transaction succeeds
- ✅ Modal closes
- ✅ Your USDC balance decreases

---

## Step 5: Test Dashboard

### 5.1 Navigate to Dashboard
- Click **"Dashboard"** in navigation
- Or go to `http://localhost:5173/dashboard`

### 5.2 Verify Real Data Display

**Status Manifold (Top Section):**
- ✅ Tier: Should show "Novice" (or your current tier)
- ✅ Deposit Amount: Should show your actual deposit
- ✅ Total Balance: Should match your vault balance

**Yield Reactor (Main Chart):**
- ✅ Principal: Your deposited amount
- ✅ Total Yield: Estimated yield (may be 0 initially)
- ✅ Harvestable Yield: Amount ready to harvest
- ✅ Chart: Should show historical data (may be empty initially)

**Pressure Gauge (Leverage):**
- ✅ Current Leverage: Should show 1.0x (no leverage)
- ✅ Health Factor: Should show simulated value
- ✅ Click slider → Opens Leverage Control Modal

**Accumulator (Rewards):**
- ✅ Current Points: Real points from contract
- ✅ Multiplier: Based on your tier (1.0x for Novice)
- ✅ Velocity: Points per hour
- ✅ Global TVL: Sum of all vault TVL
- ✅ Avg APY: Weighted average APY

**Signal List (Referrals):**
- ✅ Shows your direct referrals (empty if none)

---

## Step 6: Test Deposit Modal (Dashboard)

### 6.1 Open Deposit Modal
- Click **"Deposit"** button in Status Manifold

### 6.2 Verify Modal
- ✅ Shows target vault (Conservative or Aggressive)
- ✅ Shows estimated APY
- ✅ Shows your USDC balance
- ✅ "Max" button works

### 6.3 Make Another Deposit
1. Enter amount: `50`
2. Click **"Deposit $50"**
3. Approve + Deposit (2 transactions)
4. Verify balance updates

---

## Step 7: Test Harvest Modal

### 7.1 Open Harvest Modal
- Click **"Harvest"** button in Yield Reactor

### 7.2 Verify Maturity Check
- ✅ If < 60 days: Shows penalty warning (10%)
- ✅ If ≥ 60 days: Shows full harvestable amount
- ✅ Slide to claim mechanism works

### 7.3 Test Harvest (if mature)
1. Slide to claim
2. Confirm transaction
3. Verify yield is harvested

---

## Step 8: Test Leverage Control Modal

### 8.1 Open Leverage Modal
- Click on the **Pressure Gauge** slider
- Or click anywhere on the Pressure Gauge component

### 8.2 Verify Lock State
- ✅ If tier < Captain: Shows "Leverage Locked" message
- ✅ If tier ≥ Captain: Shows multiplier selection

### 8.3 Activate Leverage (if unlocked)
1. Select multiplier (2x, 3x, or 5x)
2. Read risk warnings
3. Click **"Activate Leverage"**
4. Confirm transaction
5. Verify leverage is active

---

## Step 9: Test Referrals Page

### 9.1 Navigate to Referrals
- Go to `http://localhost:5173/referrals`

### 9.2 Verify Real Data
- ✅ Referral Code: Based on your address
- ✅ Referral Link: Correct URL
- ✅ Pending Rewards: Real points from contract
- ✅ Total Rewards: Real points from contract
- ✅ Referrals List: Shows actual referrals (empty if none)

### 9.3 Test Referral System
1. Copy your referral link
2. Open in incognito/private window
3. Connect a different wallet
4. Make a deposit using that wallet
5. Return to your main window
6. Refresh referrals page
7. ✅ New referral should appear in list

---

## Step 10: Test Points System

### 10.1 Verify Points Accumulation
- Points should accumulate based on:
  - Deposits (immediate points)
  - Time in vault (daily points)
  - Referrals (bonus points)

### 10.2 Check Points Display
- Dashboard Accumulator: Shows current points
- Referrals Page: Shows total rewards
- Both should match the contract balance

---

## Common Issues & Solutions

### Issue: "Insufficient USDC Balance"
**Solution:** Mint more test USDC (Step 1)

### Issue: "Transaction Failed"
**Solution:** 
- Check you have enough Base Sepolia ETH for gas
- Verify you're on Base Sepolia network
- Try increasing gas limit

### Issue: "Approval Failed"
**Solution:**
- Revoke previous approval on Etherscan
- Try approving again

### Issue: "No Data Showing"
**Solution:**
- Refresh the page
- Check browser console for errors
- Verify contract addresses in `.env`

### Issue: "Historical Chart Empty"
**Solution:**
- Run the backend snapshot job manually
- Wait for hourly cron job to run
- Data populates after first snapshot

---

## Verification Checklist

After testing, verify:

- [ ] Landing page deposit works with real USDC
- [ ] Dashboard shows real vault balances
- [ ] Dashboard shows real points
- [ ] Accumulator shows real TVL and APY
- [ ] Deposit modal works from dashboard
- [ ] Harvest modal checks maturity correctly
- [ ] Leverage modal shows correct state
- [ ] Referrals page shows real points
- [ ] All transactions complete successfully
- [ ] No console errors

---

## Next Steps

Once testing is complete:

1. **Deploy to Production**
   - Update contract addresses to mainnet
   - Update RPC URLs to mainnet
   - Deploy frontend to Vercel
   - Deploy backend to Render

2. **Set Up Monitoring**
   - Monitor transaction success rates
   - Track user deposits
   - Monitor points accumulation
   - Set up error alerts

3. **Run Backend Jobs**
   - Set up hourly snapshot cron job
   - Verify historical data populates
   - Monitor database growth

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check MetaMask for pending transactions
3. Verify contract addresses in `.env`
4. Check Base Sepolia block explorer for transaction status

Happy testing! 🎉
