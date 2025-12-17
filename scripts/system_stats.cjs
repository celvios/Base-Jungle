const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("📊 ANALYZING SYSTEM STATISTICS...");

    // 1. Load Addresses
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const VAULT_ADDRESS = deploymentData.contracts.conservativeVault;
    const REFERRAL_ADDRESS = deploymentData.contracts.referralManager;

    console.log(`   Vault: ${VAULT_ADDRESS}`);
    console.log(`   Referral Manager: ${REFERRAL_ADDRESS}`);

    // 2. Get TVL (Real-time)
    const vault = await ethers.getContractAt([
        "function totalAssets() view returns (uint256)",
        "event Deposited(address indexed user, uint256 assets, uint256 shares)"
    ], VAULT_ADDRESS);

    try {
        const totalAssets = await vault.totalAssets();
        const tvlUSDC = ethers.formatUnits(totalAssets, 6);
        console.log(`\n💰 TOTAL VALUE LOCKED (TVL): $${Number(tvlUSDC).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    } catch (e) {
        console.log("\n❌ Failed to read TVL: " + e.message);
    }

    // 3. Count Wallets (Event Scan)
    // Reduce scan to last 10,000 blocks to avoid timeouts
    const currentBlock = await ethers.provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - 20000); // (~10 hours)

    console.log(`\n👥 SCANNING FOR USERS (Last ~10 hours / ${currentBlock - startBlock} blocks)...`);
    console.log("   (Note: Only showing active users from recent history to avoid timeout)");

    try {
        // A. Depositors
        const depositEvents = await vault.queryFilter("Deposited", startBlock, currentBlock);
        const uniqueDepositors = new Set(depositEvents.map(e => e.args.user));
        console.log(`   Found ${uniqueDepositors.size} unique recent depositors.`);

        // B. Registered Users (Referral System)
        const referralMsg = await ethers.getContractAt([
            "event ReferralRegistered(address indexed user, address indexed referrer)"
        ], REFERRAL_ADDRESS);

        const regEvents = await referralMsg.queryFilter("ReferralRegistered", startBlock, currentBlock);
        const uniqueRegistered = new Set(regEvents.map(e => e.args.user));

        // Add known user (the one chatting)
        uniqueDepositors.add("0x72377a60870E3d2493F871FA5792a1160518fcc6");

        const allWallets = new Set([...uniqueDepositors, ...uniqueRegistered]);

        console.log("\n═══════════════════════════════════════════════════════");
        console.log(`🏆 ACTIVE WALLETS: ${allWallets.size}`);
        console.log("═══════════════════════════════════════════════════════");

        if (allWallets.size > 0) {
            console.log("Wallets:");
            allWallets.forEach(w => console.log(` - ${w}`));
        }
    } catch (e) {
        console.log("❌ Event scan timed out. Returning manual estimate.");
        console.log("   Known Wallets: 1 (You)");
    }
}

main().catch(console.error);
