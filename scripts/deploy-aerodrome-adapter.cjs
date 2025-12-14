const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Aerodrome LP Adapter...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Aerodrome Base Mainnet Addresses
    const ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
    const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const WETH = "0x4200000000000000000000000000000000000006";
    const POOL = "0xb2cc224c1c9feE385f8ad6a55b4d94E92359DC59"; // USDC/WETH vAMM

    // Deploy Adapter
    const AerodromeLPAdapter = await hre.ethers.getContractFactory("AerodromeLPAdapter");
    const adapter = await AerodromeLPAdapter.deploy(
        ROUTER,
        USDC,
        WETH,
        POOL,
        "Aerodrome USDC/WETH LP"
    );

    await adapter.waitForDeployment();
    const address = await adapter.getAddress();

    console.log("✅ AerodromeLPAdapter deployed to:", address);
    console.log("-----------------------------------");
    console.log("Next steps:");
    console.log("1. Verify contract on Basescan");
    console.log("2. Deploy Gauge Adapter");
    console.log("3. Add to StrategyController");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
