# Critical Questions - $10,000 Deposit Failing

Since you were depositing $10,000 (well above the minimum), we need to identify exactly where and how the error is occurring.

## Please Answer These Questions:

### 1. Where are you depositing?
- [ ] Frontend web UI (browser)
- [ ] Hardhat script
- [ ] Hardhat console
- [ ] Other (specify):

### 2. If using the frontend:
- [ ] Deployed on Vercel (production)
- [ ] Running locally (npm run dev)
- Which URL are you using?

### 3. Exact sequence of events:
1. What happens when you click "Approve & Deposit"?
2. Do you see the approval transaction in your wallet?
3. Do you confirm the approval?
4. What happens next?
5. When exactly do you see the "transfer amount exceeds allowance" error?

### 4. Which vault?
- [ ] Conservative Vault
- [ ] Aggressive Vault
- Vault address you're using:

### 5. USDC Contract:
- What USDC address are you using?
- Is it: `0x634c1cf5129fC7bd49736b9684375E112e4000E1` (from deployment)?

### 6. Browser Console (if using frontend):
- Open DevTools (F12)
- Go to Console tab
- Do you see any messages starting with "Allowance check"?
- Share any error messages you see

### 7. Transaction Hashes (if available):
- Approval transaction hash:
- Deposit transaction hash (if it got that far):

## Quick Test

Run this command and share the FULL output:

```bash
node node_modules/hardhat/internal/cli/cli.js run scripts/test-deposit.js --network baseSepolia
```

But first, update line 39 in `scripts/test-deposit.js` to use 10000:

```javascript
const depositAmount = ethers.parseUnits("10000", 6);
```

This will help us see if the issue is specific to the frontend or a general contract issue.
