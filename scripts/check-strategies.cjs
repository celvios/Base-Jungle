const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Checking Strategies...");
    const [deployer] = await hre.ethers.getSigners();

    // Load Deployment
    const networkName = hre.network.name;
    let deploymentPath = `./deployed-addresses-${networkName}.json`;
    if (networkName === "baseSepolia" || networkName === "hardhat") {
        deploymentPath = "./deployed-addresses-sepolia.json";
    }
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const CONTROLLER_ADDR = deploymentData.contracts.strategyController;

    const controller = await hre.ethers.getContractAt("StrategyController", CONTROLLER_ADDR);
    const count = await controller.strategyCount();

    console.log(`Total Strategies: ${count}`);

    const stratTypes = [
        "LENDING", "LEVERAGED_LENDING", "LP_STABLE",
        "LP_VOLATILE", "VAULT_BEEFY", "LEVERAGED_LP", "GAUGE_FARMING"
    ];

    for (let i = 0; i < count; i++) {
        const s = await controller.strategies(i);
        console.log(`[${i}] Type: ${s.strategyType} (${stratTypes[s.strategyType]}) | Active: ${s.isActive}`);
    }
}

main().catch(console.error);
