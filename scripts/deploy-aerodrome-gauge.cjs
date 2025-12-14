const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Aerodrome Gauge Adapter...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Aerodrome Base Mainnet Addresses
    const GAUGE = "0x519BBD1Dd8C6A94C46080E24f316c14Ee758C025"; // USDC/WETH Gauge
    const AERO = "0x940181a94a35a4569e4529a3cdfb74e38fd98631";
    const ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";

    // Deploy Gauge Adapter
    const AerodromeGaugeAdapter = await hre.ethers.getContractFactory("AerodromeGaugeAdapter");
    const adapter = await AerodromeGaugeAdapter.deploy(
        GAUGE,
        AERO,
        ROUTER,
        "Aerodrome USDC/WETH Gauge"
    );

    await adapter.waitForDeployment();
    const address = await adapter.getAddress();

    console.log("✅ AerodromeGaugeAdapter deployed to:", address);
    console.log("-----------------------------------");
    console.log("Next steps:");
    console.log("1. Verify contract on Basescan");
    console.log("2. Add to StrategyController");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
