const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🔄 Deploying AggressiveVault with Mock USDC...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    
    // Load existing deployment
    const existing = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));

    console.log("Deploying AggressiveVault...");
    const AggressiveVault = await hre.ethers.getContractFactory("AggressiveVault");
    const vault = await AggressiveVault.deploy(
        MOCK_USDC,
        existing.contracts.referralManager,
        existing.contracts.pointsTracker,
        existing.contracts.strategyController,
        existing.contracts.treasuryManager
    );
    await vault.waitForDeployment();
    const address = await vault.getAddress();
    console.log("✅ AggressiveVault:", address);

    // Update deployment file
    existing.contracts.conservativeVault = "0xf1390Ba2304e0764A92c8bAdbAEFBA2b24e841E9";
    existing.contracts.aggressiveVault = address;
    existing.contracts.masterVault = address;
    existing.usdcAddress = MOCK_USDC;
    existing.deployedAt = new Date().toISOString();

    fs.writeFileSync("./deployed-addresses-sepolia.json", JSON.stringify(existing, null, 2));
    console.log("📄 Saved to deployed-addresses-sepolia.json");

    console.log("\n📝 UPDATE YOUR FRONTEND .env:\n");
    console.log(`VITE_CONSERVATIVE_VAULT_ADDRESS=0xf1390Ba2304e0764A92c8bAdbAEFBA2b24e841E9`);
    console.log(`VITE_AGGRESSIVE_VAULT_ADDRESS=${address}`);
    console.log(`VITE_BASE_VAULT_ADDRESS=${address}`);
    console.log(`VITE_USDC_ADDRESS=${MOCK_USDC}`);
    console.log("\n✅ Done!\n");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

