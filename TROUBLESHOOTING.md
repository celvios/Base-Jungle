# Troubleshooting: "ERC20: transfer amount exceeds allowance" Error

## Quick Diagnosis

### Are you testing via the frontend (web UI)?

**If YES:**
1. **Check if frontend is deployed with latest changes**
   - The fix was pushed to git but needs to be deployed
   - If using Vercel: Check deployment status
   - If local: Restart dev server with `npm run dev`

2. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

3. **Check browser console (F12)**
   - Look for messages starting with "Allowance check"
   - If you see these, the fix is working
   - If not, frontend hasn't updated

**If NO (testing via script/Hardhat):**
- The frontend fix doesn't apply
- Use the test script I created: `scripts/test-deposit.js`
- Or add approval logic to your script (see below)

---

## Solution 1: Use the Test Script

I've created a test script that handles approval correctly:

```bash
npx hardhat run scripts/test-deposit.js --network baseSepolia
```

This script:
- Checks your USDC balance
- Approves the vault to spend USDC
- Waits for approval confirmation
- Verifies allowance is updated
- Attempts the deposit
- Provides detailed debugging output

---

## Solution 2: Manual Approval (if testing via Hardhat console)

```javascript
// 1. Get contracts
const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
const vault = await ethers.getContractAt("BaseVault", VAULT_ADDRESS);

// 2. Approve USDC
const amount = ethers.parseUnits("100", 6); // 100 USDC
const approveTx = await usdc.approve(VAULT_ADDRESS, amount);
await approveTx.wait(); // IMPORTANT: Wait for confirmation

// 3. Verify allowance
const allowance = await usdc.allowance(yourAddress, VAULT_ADDRESS);
console.log("Allowance:", ethers.formatUnits(allowance, 6));

// 4. Wait a bit (optional but recommended)
await new Promise(r => setTimeout(r, 2000));

// 5. Deposit
const depositTx = await vault.deposit(amount, yourAddress);
await depositTx.wait();
```

---

## Solution 3: Check Environment Variables

Make sure your `.env` file has the correct addresses:

```env
VITE_USDC_ADDRESS=0x... # Your USDC contract address
VITE_CONSERVATIVE_VAULT_ADDRESS=0x... # Your vault address
VITE_AGGRESSIVE_VAULT_ADDRESS=0x... # Your vault address
```

**Common mistake**: Using the wrong USDC address
- Make sure you're using YOUR deployed MockUSDC
- Not the real USDC contract
- Check `deployed-addresses-sepolia.json`

---

## Solution 4: Verify Contract Setup

Check if the vault is properly configured:

```javascript
const vault = await ethers.getContractAt("BaseVault", VAULT_ADDRESS);

// Check if vault's asset is the same USDC you're approving
const vaultAsset = await vault.asset();
console.log("Vault's asset:", vaultAsset);
console.log("Your USDC:", USDC_ADDRESS);

// These MUST match!
if (vaultAsset.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
    console.log("ERROR: Vault is configured for a different token!");
}
```

---

## Solution 5: Check USDC Balance

```javascript
const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
const balance = await usdc.balanceOf(yourAddress);
console.log("USDC Balance:", ethers.formatUnits(balance, 6));

// If balance is 0, mint some USDC first
if (balance === 0n) {
    const mockUSDC = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
    await mockUSDC.mint(yourAddress, ethers.parseUnits("1000", 6));
}
```

---

## Common Causes & Fixes

| Cause | Fix |
|-------|-----|
| Frontend not deployed | Redeploy to Vercel or restart local dev server |
| Wrong USDC address | Check `.env` and `deployed-addresses-sepolia.json` |
| Approval not confirmed | Always call `.wait()` after approval transaction |
| Testing via script | Use the test script or add approval logic |
| Vault configured wrong | Verify `vault.asset()` matches your USDC address |
| No USDC balance | Mint USDC using MockERC20 contract |
| Browser cache | Hard refresh or clear cache |

---

## Still Not Working?

Please provide:
1. How you're testing (frontend/script/console)
2. Exact error message
3. Browser console logs (if using frontend)
4. Contract addresses you're using
5. Network (Base Sepolia/other)

Run this command and share the output:
```bash
npx hardhat run scripts/test-deposit.js --network baseSepolia
```
