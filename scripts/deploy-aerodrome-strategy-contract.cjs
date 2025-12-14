const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying AerodromeStrategy Contract...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Load addresses
    const deploymentsPath = path.join(__dirname, "../deployed-addresses-sepolia.json");
    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

    const usdc = deployments.usdcAddress; // MockUSDC usually
    const weth = deployments.mockWETH;
    const lpToken = deployments.mockAerodromePool;
    const gauge = deployments.mockAerodromeGauge;
    const lpAdapter = deployments.aerodromeLPAdapter;
    const gaugeAdapter = deployments.aerodromeGaugeAdapter;
    const dexAggregator = deployments.dexAggregator;

    if (!usdc || !weth || !lpToken || !gauge || !lpAdapter || !gaugeAdapter || !dexAggregator) {
        console.error("Missing dependencies in deployed-addresses-sepolia.json");
        process.exit(1);
    }

    const AerodromeStrategy = await hre.ethers.getContractFactory("AerodromeStrategy");
    const strategy = await AerodromeStrategy.deploy(
        usdc,
        weth,
        lpToken,
        gauge,
        lpAdapter,
        gaugeAdapter,
        dexAggregator
    );

    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log("✅ AerodromeStrategy deployed to:", strategyAddress);

    // Add to Strategy Controller
    const strategyControllerAddress = deployments.contracts.strategyController;
    if (strategyControllerAddress) {
        console.log("Adding Strategy to Controller:", strategyControllerAddress);
        const controller = await hre.ethers.getContractAt("StrategyController", strategyControllerAddress);

        // Tier 1 (Novice), 70% allocation, Target APY 100% (10000 bps)
        // enum GAUGE_FARMING = 6
        try {
            // StrategyType (6=GAUGE_FARMING), adapter, asset, targetAPY, riskScore, minTier
            // Note: StrategyController.addStrategy params: (type, adapter, asset, targetAPY, riskScore, minTier)
            await controller.addStrategy(
                6, // GAUGE_FARMING
                strategyAddress,
                usdc,
                15000, // 150% Target
                5,     // Risk Score
                1      // Min Tier (Scout? Or Novice=0?) Let's use 1 (Scout) or 0. 
                // BaseVault usually needs Novice strategies. 
                // Let's use 0 (Novice) to make it accessible to everyone.
            );
            console.log("Strategy Added to Controller");

            // Also grant VAULT_ROLE to the Vault so it can call deposit?
            // StrategyController calls deposit. 
            // AerodromeStrategy has `onlyRole(VAULT_ROLE)`.
            // The Vault calls StrategyController.
            // StrategyController calls Strategy.
            // So StrategyController needs VAULT_ROLE on the Strategy Contract.

            // Grant VAULT_ROLE to StrategyController
            const VAULT_ROLE = await strategy.VAULT_ROLE();
            await strategy.grantRole(VAULT_ROLE, strategyControllerAddress);
            console.log("Granted VAULT_ROLE to StrategyController");

        } catch (e) {
            console.error("Error adding strategy:", e.message);
        }
    }

    // Update deployments
    deployments.strategies.AERODROME_STRATEGY = strategyAddress;
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log("Deployments updated.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
