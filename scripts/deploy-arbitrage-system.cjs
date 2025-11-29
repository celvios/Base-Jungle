const hre = require("hardhat");

async function main() {
    console.log(`🚀 Deploying Arbitrage System to ${hre.network.name}...\n`);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Get DEXAggregator from deployment file
    const fs = require("fs");
    const deploymentPath = "./deployed-addresses-sepolia.json";
    let deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
    const DEX_AGGREGATOR = deploymentInfo.contracts.dexAggregator;

    if (!DEX_AGGREGATOR || DEX_AGGREGATOR === "0x0") {
        console.error("❌ DEXAggregator not found in deployment file!");
        console.log("Please deploy DEXAggregator first:");
        console.log("   node scripts/deploy-dex-aggregator.cjs --network baseSepolia\n");
        process.exit(1);
    }

    console.log("Using DEXAggregator:", DEX_AGGREGATOR, "\n");

    // 1. Deploy BalancerFlashLoanReceiver
    console.log("📝 Deploying BalancerFlashLoanReceiver...");
    const BalancerFlashLoanReceiver = await hre.ethers.getContractFactory("BalancerFlashLoanReceiver");
    const flashLoanReceiver = await BalancerFlashLoanReceiver.deploy(BALANCER_VAULT);
    await flashLoanReceiver.waitForDeployment();
    const flashLoanReceiverAddress = await flashLoanReceiver.getAddress();
    console.log("✅ BalancerFlashLoanReceiver deployed to:", flashLoanReceiverAddress, "\n");

    // 2. Deploy ArbitrageStrategy
    console.log("📝 Deploying ArbitrageStrategy...");
    const ArbitrageStrategy = await hre.ethers.getContractFactory("ArbitrageStrategy");
    const strategy = await ArbitrageStrategy.deploy(
        flashLoanReceiverAddress,
        DEX_AGGREGATOR
    );
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log("✅ ArbitrageStrategy deployed to:", strategyAddress, "\n");

    // 3. Link contracts
    console.log("🔗 Linking contracts...");
    const tx1 = await flashLoanReceiver.setArbitrageStrategy(strategyAddress);
    await tx1.wait();
    console.log("✅ FlashLoanReceiver linked to Strategy\n");

    // 4. Grant KEEPER_ROLE to deployer
    console.log("🔑 Granting KEEPER_ROLE...");
    const KEEPER_ROLE = await strategy.KEEPER_ROLE();
    const tx2 = await strategy.grantRole(KEEPER_ROLE, deployer.address);
    await tx2.wait();
    console.log("✅ KEEPER_ROLE granted to:", deployer.address, "\n");

    // Summary
    console.log("════════════════════════════════════════════");
    console.log("📊 Deployment Summary");
    console.log("════════════════════════════════════════════");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("BalancerFlashLoanReceiver:", flashLoanReceiverAddress);
    console.log("ArbitrageStrategy:", strategyAddress);
    console.log("DEXAggregator:", DEX_AGGREGATOR);
    console.log("Balancer Vault:", BALANCER_VAULT);
    console.log("════════════════════════════════════════════\n");

    // Save deployment info
    if (!fs.existsSync("./deployments")) {
        fs.mkdirSync("./deployments");
    }

    const arbDeploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        flashLoanReceiver: flashLoanReceiverAddress,
        arbitrageStrategy: strategyAddress,
        dexAggregator: DEX_AGGREGATOR,
        balancerVault: BALANCER_VAULT,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
        "./deployments/arbitrage-system.json",
        JSON.stringify(arbDeploymentInfo, null, 2)
    );
    console.log("💾 Deployment info saved\n");

    // Update main deployment file
    deploymentInfo.contracts.flashLoanReceiver = flashLoanReceiverAddress;
    deploymentInfo.contracts.arbitrageStrategy = strategyAddress;
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    // Verification commands
    console.log("📋 Verify contracts:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${flashLoanReceiverAddress} "${BALANCER_VAULT}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${strategyAddress} "${flashLoanReceiverAddress}" "${DEX_AGGREGATOR}"`);
    console.log("\n✅ Deployment complete! Update .env.arbitrage and start keeper bot.\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
