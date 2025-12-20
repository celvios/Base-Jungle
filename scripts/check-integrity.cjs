const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("INTEGRITY CHECK...");
    const [deployer] = await hre.ethers.getSigners();

    // Load Deployment JSON
    const networkName = hre.network.name;
    let deploymentPath = `./deployed-addresses-${networkName}.json`;
    if (networkName === "baseSepolia" || networkName === "hardhat") {
        deploymentPath = "./deployed-addresses-sepolia.json";
    }
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    const JSON_CONTROLLER = deploymentData.contracts.strategyController;
    const JSON_REF_MANAGER = deploymentData.contracts.referralManager;
    // Assuming we have a vault address in deployment or hardcoded
    // Let's assume AggressiveVault or we find one.
    // If not in json, we might have to scan or guess.
    // The previous prompt context had AggressiveVault.sol open.
    // Let's check `deploymentData.contracts.aggressiveVault`?
    const JSON_VAULT = deploymentData.contracts.aggressiveVault || deploymentData.contracts.vault; // Fallback

    console.log(`JSON Vault: ${JSON_VAULT}`);
    console.log(`JSON Controller: ${JSON_CONTROLLER}`);
    console.log(`JSON RefManager: ${JSON_REF_MANAGER}`);

    if (JSON_VAULT) {
        const vault = await hre.ethers.getContractAt("BaseVault", JSON_VAULT);
        const onChainController = await vault.strategyController();
        const onChainRef = await vault.referralManager();

        console.log(`\n[VAULT ON-CHAIN]`);
        console.log(`-> Controller: ${onChainController}`);
        console.log(`   Match JSON? ${onChainController === JSON_CONTROLLER}`);
        console.log(`-> RefManager: ${onChainRef}`);
        console.log(`   Match JSON? ${onChainRef === JSON_REF_MANAGER}`);

        if (onChainController !== JSON_CONTROLLER) {
            console.log("❌ MISMATCH: Vault is using an OLD Controller!");
        }

        // Check Controller's RefManager
        const controller = await hre.ethers.getContractAt("StrategyController", onChainController);
        const ctrlRef = await controller.referralManager();
        console.log(`\n[CONTROLLER ON-CHAIN]`);
        console.log(`-> RefManager: ${ctrlRef}`);
        console.log(`   Match JSON? ${ctrlRef === JSON_REF_MANAGER}`);

        if (ctrlRef !== JSON_REF_MANAGER) {
            console.log("❌ MISMATCH: Controller is using an OLD RefManager!");
            console.log("   (This explains why it sees NOVICE tier)");
        }
    } else {
        console.log("⚠️ Could not find Vault address in JSON to verify.");
    }
}

main().catch(console.error);
