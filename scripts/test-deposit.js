// Test script to verify USDC approval and deposit flow
// Run with: npx hardhat run scripts/test-deposit.js --network baseSepolia

import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("🔍 Testing Deposit Flow with Approval...\\n");

    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Contract addresses from deployment
    const USDC_ADDRESS = "0x634c1cf5129fC7bd49736b9684375E112e4000E1"; // MockUSDC
    const VAULT_ADDRESS = "0x986ca22e9f0A6104AAdea7C2698317A690045D13"; // ConservativeVault

    console.log("USDC Address:", USDC_ADDRESS);
    console.log("Vault Address:", VAULT_ADDRESS);
    console.log("");

    // Get contract instances
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const vault = await ethers.getContractAt("BaseVault", VAULT_ADDRESS);

    // Check USDC balance
    const balance = await usdc.balanceOf(signer.address);
    console.log("💰 USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

    if (balance === 0n) {
        console.log("❌ No USDC balance. Minting 1000 USDC...");
        const mockUSDC = await ethers.getContractAt("MockERC20", USDC_ADDRESS);
        const mintTx = await mockUSDC.mint(signer.address, ethers.parseUnits("1000", 6));
        await mintTx.wait();
        const newBalance = await usdc.balanceOf(signer.address);
        console.log("✅ Minted! New balance:", ethers.formatUnits(newBalance, 6), "USDC");
    }

    // Deposit amount - must meet minimum tier requirement ($500 for Novice)
    const depositAmount = ethers.parseUnits("500", 6);
    console.log("📊 Deposit Amount:", ethers.formatUnits(depositAmount, 6), "USDC\\n");

    // Step 1: Check current allowance
    console.log("Step 1: Checking current allowance...");
    let allowance = await usdc.allowance(signer.address, VAULT_ADDRESS);
    console.log("Current allowance:", ethers.formatUnits(allowance, 6), "USDC");

    // Step 2: Approve if needed
    if (allowance < depositAmount) {
        console.log("\\n⏳ Step 2: Approving USDC...");
        const approveTx = await usdc.approve(VAULT_ADDRESS, depositAmount);
        console.log("Approval tx sent:", approveTx.hash);

        console.log("Waiting for confirmation...");
        const approvalReceipt = await approveTx.wait();
        console.log("✅ Approval confirmed in block:", approvalReceipt.blockNumber);

        // Verify allowance was updated
        allowance = await usdc.allowance(signer.address, VAULT_ADDRESS);
        console.log("New allowance:", ethers.formatUnits(allowance, 6), "USDC");

        if (allowance < depositAmount) {
            console.log("❌ ERROR: Allowance not updated correctly!");
            return;
        }
    } else {
        console.log("✅ Already approved");
    }

    // Step 3: Wait a bit to ensure state is synced
    console.log("\\n⏳ Waiting 2 seconds for blockchain state to sync...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Verify allowance one more time
    console.log("\\nStep 3: Final allowance check before deposit...");
    allowance = await usdc.allowance(signer.address, VAULT_ADDRESS);
    console.log("Allowance:", ethers.formatUnits(allowance, 6), "USDC");

    if (allowance < depositAmount) {
        console.log("❌ ERROR: Insufficient allowance!");
        console.log("Required:", ethers.formatUnits(depositAmount, 6));
        console.log("Actual:", ethers.formatUnits(allowance, 6));
        return;
    }

    // Step 5: Attempt deposit
    console.log("\\n⏳ Step 4: Attempting deposit...");
    try {
        const depositTx = await vault.deposit(depositAmount, signer.address);
        console.log("Deposit tx sent:", depositTx.hash);

        console.log("Waiting for confirmation...");
        const depositReceipt = await depositTx.wait();
        console.log("✅ Deposit confirmed in block:", depositReceipt.blockNumber);

        // Check vault shares
        const shares = await vault.balanceOf(signer.address);
        console.log("\\n🎉 Success! Vault shares received:", ethers.formatUnits(shares, 18));

    } catch (error) {
        console.log("\\n❌ Deposit failed!");
        console.log("Error:", error.message);

        // Additional debugging
        console.log("\\n🔍 Debugging info:");
        const currentAllowance = await usdc.allowance(signer.address, VAULT_ADDRESS);
        const currentBalance = await usdc.balanceOf(signer.address);
        console.log("Current allowance:", ethers.formatUnits(currentAllowance, 6));
        console.log("Current balance:", ethers.formatUnits(currentBalance, 6));
        console.log("Required amount:", ethers.formatUnits(depositAmount, 6));

        if (error.message.includes("allowance")) {
            console.log("\\n💡 This is an allowance error. Possible causes:");
            console.log("1. Approval transaction not fully propagated");
            console.log("2. Wrong USDC contract address");
            console.log("3. Approval was for a different spender");
            console.log("4. Approval amount was too low");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
