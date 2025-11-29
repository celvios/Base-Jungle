const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🚀 Deploying UniswapV3 Adapter to Base Sepolia...\n");

    // Base Sepolia addresses
    const UNISWAP_V3_FACTORY = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
    const UNISWAP_V3_ROUTER = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC

    console.log("Configuration:");
    console.log(`  Factory: ${UNISWAP_V3_FACTORY}`);
    console.log(`  Router: ${UNISWAP_V3_ROUTER}`);
    console.log(`  USDC: ${USDC_ADDRESS}\n`);

    // Deploy adapter
    const UniswapV3Adapter = await hre.ethers.getContractFactory("UniswapV3AdapterSimple");
    const adapter = await UniswapV3Adapter.deploy(
        UNISWAP_V3_FACTORY,
        UNISWAP_V3_ROUTER,
        USDC_ADDRESS
    );

    await adapter.waitForDeployment();
    const adapterAddress = await adapter.getAddress();

    console.log(`✅ UniswapV3Adapter deployed to: ${adapterAddress}\n`);

    // Save deployment info
    const deploymentInfo = {
        network: "baseSepolia",
        timestamp: new Date().toISOString(),
        contracts: {
            UniswapV3Adapter: {
                address: adapterAddress,
                factory: UNISWAP_V3_FACTORY,
                router: UNISWAP_V3_ROUTER,
                asset: USDC_ADDRESS,
            },
        },
    };

    const outputPath = path.join(__dirname, "../deployments/uniswapv3-adapter-sepolia.json");
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`📄 Deployment info saved to: ${outputPath}\n`);

    console.log("\n🔍 To verify on Basescan:");
    console.log(`npx hardhat verify --network baseSepolia ${adapterAddress} "${UNISWAP_V3_FACTORY}" "${UNISWAP_V3_ROUTER}" "${USDC_ADDRESS}"\n`);

    console.log("✅ Deployment complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
