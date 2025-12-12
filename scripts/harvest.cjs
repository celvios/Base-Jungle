const hre = require("hardhat");

async function main() {
    const vaultAddress = "0x0fFc833fBaa8f567695a0cd640BD4009FF3dC841";
    console.log(`🌾 Harvesting Vault: ${vaultAddress}`);

    // 1. Get Vault and StrategyController
    const Vault = await hre.ethers.getContractAt("BaseVault", vaultAddress);
    const controllerAddress = await Vault.strategyController();
    const Controller = await hre.ethers.getContractAt("StrategyController", controllerAddress);

    // 2. Output Status Before
    const totalAssetsBefore = await Vault.totalAssets();
    const totalSupplyBefore = await Vault.totalSupply();
    console.log(`📉 Before Harvest:`);
    console.log(`   Total Assets: ${hre.ethers.formatUnits(totalAssetsBefore, 6)} USDC`);
    console.log(`   Total Supply: ${hre.ethers.formatUnits(totalSupplyBefore, 6)} Shares`);
    console.log(`   Share Price:  ${totalSupplyBefore > 0 ? Number(totalAssetsBefore) / Number(totalSupplyBefore) : 0}`);

    // 3. Trigger Harvest (via Rebalance or internal harvest if exposed)
    // BaseVault has 'deposit', 'withdraw', etc.
    // StrategyController has 'rebalance(user)'.
    // Does BaseVault have a 'harvest'? 
    // Checking artifact... BaseVault contract code earlier showed `lastHarvestTimestamp` and `totalHarvested` state vars.
    // But I didn't see a public `harvest()` function in the truncated view. 
    // It usually has one. Let's assume it does or use `rebalance` if it's the mechanism.
    // Alternatively, the StrategyController might need to be rebalanced.

    // Let's try calling 'rebalance' on the StrategyController for the vault itself or a user?
    // Actually, StrategyController.rebalance takes a 'user'. 
    // Wait, does the Vault deposit into StrategyController as a "user"?
    // Yes, standard pattern: Vault -> StrategyController -> Adapters. 
    // So Vault is the "user" in StrategyController's eyes.

    // We need to call `strategyController.rebalance(vaultAddress)`. 
    // Note: rebalance is `onlyRole(KEEPER_ROLE)`.
    // I need to ensure my signer has KEEPER_ROLE or is Admin. 
    // The deployer usually has KEEPER_ROLE.

    try {
        console.log("🚀 Calling StrategyController.rebalance(vaultAddress)...");
        const tx = await Controller.rebalance(vaultAddress);
        console.log(`   Tx Hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Harvest/Rebalance Complete!");
    } catch (e) {
        console.log(`⚠️  Rebalance failed: ${e.message}`);
        // Fallback: Check if Vault has direct harvest
        if (Vault.harvest) {
            console.log("🔄 Trying Vault.harvest()...");
            const tx = await Vault.harvest();
            await tx.wait();
            console.log("✅ Vault Harvest Complete!");
        }
    }

    // 4. Output Status After
    const totalAssetsAfter = await Vault.totalAssets();
    const totalSupplyAfter = await Vault.totalSupply();
    console.log(`📈 After Harvest:`);
    console.log(`   Total Assets: ${hre.ethers.formatUnits(totalAssetsAfter, 6)} USDC`);
    console.log(`   Total Supply: ${hre.ethers.formatUnits(totalSupplyAfter, 6)} Shares`);
    console.log(`   Share Price:  ${Number(totalAssetsAfter) / Number(totalSupplyAfter)}`);

    const profitRealized = totalAssetsAfter - totalAssetsBefore;
    console.log(`💰 Profit Realized: ${hre.ethers.formatUnits(profitRealized, 6)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
