const hre = require("hardhat");

async function main() {
    console.log(`🚀 Deploying DEXAggregator to ${hre.network.name}...\n`);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Base Sepolia DEX addresses
    const AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
    const UNISWAP_V3_ROUTER = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";
    const UNIV3_QUOTER = "0xC5290058841028F1614F3A6F0F5816cAd0df5E27";

    console.log("📝 Deploying DEXAggregator...");
    const DEXAggregator = await hre.ethers.getContractFactory("DEXAggregator");
    const dexAggregator = await DEXAggregator.deploy(
        AERODROME_ROUTER,
        UNISWAP_V3_ROUTER,
        UNIV3_QUOTER
    );

    await dexAggregator.waitForDeployment();
    const dexAggregatorAddress = await dexAggregator.getAddress();

    console.log("✅ DEXAggregator deployed to:", dexAggregatorAddress, "\n");

    // Summary
    console.log("════════════════════════════════════════════");
    console.log("📊 Deployment Summary");
    console.log("════════════════════════════════════════════");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("DEXAggregator:", dexAggregatorAddress);
    console.log("════════════════════════════════════════════\n");

    // Save deployment info
    const fs = require("fs");

    const deploymentPath = "./deployed-addresses-sepolia.json";
    let deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    deploymentInfo.contracts.dexAggregator = dexAggregatorAddress;
    deploymentInfo.dexRouters = {
        aerodrome: AERODROME_ROUTER,
        uniswapV3: UNISWAP_V3_ROUTER,
        uniswapV3Quoter: UNIV3_QUOTER
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Updated deployment info\n");

    console.log("📋 Verify with:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${dexAggregatorAddress} "${AERODROME_ROUTER}" "${UNISWAP_V3_ROUTER}" "${UNIV3_QUOTER}"\n`);

    return dexAggregatorAddress;
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
