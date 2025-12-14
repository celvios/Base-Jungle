const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Updated ConservativeVault with Performance Fee...\n");

    // Load existing deployment addresses
    const deployedAddressesPath = path.join(__dirname, "../deployed-addresses-sepolia.json");
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
        console.error("❌ No ETH for deployment!");
        console.log("Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
        return;
    }

    // Deployment parameters
    const USDC_ADDRESS = deployedAddresses.usdcAddress;
    const REFERRAL_MANAGER = deployedAddresses.contracts.referralManager;
    const POINTS_TRACKER = deployedAddresses.contracts.pointsTracker;
    const STRATEGY_CONTROLLER = deployedAddresses.contracts.strategyController;
    const FEE_COLLECTOR = deployer.address; // Deployer wallet receives fees

    console.log("📋 Deployment Parameters:");
    console.log(`  USDC: ${USDC_ADDRESS}`);
    console.log(`  ReferralManager: ${REFERRAL_MANAGER}`);
    console.log(`  PointsTracker: ${POINTS_TRACKER}`);
    console.log(`  StrategyController: ${STRATEGY_CONTROLLER}`);
    console.log(`  FeeCollector: ${FEE_COLLECTOR}\n`);

    // Deploy ConservativeVault
    console.log("📦 Deploying ConservativeVault...");
    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const conservativeVault = await ConservativeVault.deploy(
        USDC_ADDRESS,
        REFERRAL_MANAGER,
        POINTS_TRACKER,
        STRATEGY_CONTROLLER,
        FEE_COLLECTOR
    );

    await conservativeVault.waitForDeployment();
    const conservativeVaultAddress = await conservativeVault.getAddress();

    console.log(`✅ ConservativeVault deployed to: ${conservativeVaultAddress}\n`);

    // Verify performance fee is set
    const performanceFee = await conservativeVault.performanceFee();
    console.log(`✅ Performance Fee: ${performanceFee} basis points (${performanceFee / 100}%)`);

    const withdrawalLockPeriod = await conservativeVault.withdrawalLockPeriod();
    console.log(`✅ Withdrawal Lock Period: ${withdrawalLockPeriod} seconds (${withdrawalLockPeriod / 86400} days)\n`);

    // Grant KEEPER_ROLE to deployer
    console.log("🔑 Granting KEEPER_ROLE to deployer...");
    const KEEPER_ROLE = await conservativeVault.KEEPER_ROLE();
    const tx = await conservativeVault.grantRole(KEEPER_ROLE, deployer.address);
    await tx.wait();
    console.log("✅ KEEPER_ROLE granted\n");

    // Update deployment file
    deployedAddresses.contracts.conservativeVault = conservativeVaultAddress;
    deployedAddresses.deployedAt = new Date().toISOString();

    fs.writeFileSync(
        deployedAddressesPath,
        JSON.stringify(deployedAddresses, null, 2)
    );
    console.log("✅ Updated deployed-addresses-sepolia.json\n");

    // Summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════════\n");
    console.log(`ConservativeVault: ${conservativeVaultAddress}`);
    console.log(`Performance Fee: 20%`);
    console.log(`Early Withdrawal Penalty: 10% (if < 60 days)`);
    console.log(`Fee Collector: ${FEE_COLLECTOR}\n`);

    console.log("NEXT STEPS:");
    console.log("1. Update Vercel environment variable:");
    console.log(`   VITE_CONSERVATIVE_VAULT_ADDRESS=${conservativeVaultAddress}`);
    console.log("\n2. Redeploy frontend on Vercel");
    console.log("\n3. (Optional) Verify contract on BaseScan:");
    console.log(`   npx hardhat verify --network baseSepolia ${conservativeVaultAddress} "${USDC_ADDRESS}" "${REFERRAL_MANAGER}" "${POINTS_TRACKER}" "${STRATEGY_CONTROLLER}" "${FEE_COLLECTOR}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
