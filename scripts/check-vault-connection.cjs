const { ethers } = require("hardhat");

async function main() {
    const userAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    // Contract addresses from frontend
    const CONSERVATIVE_VAULT = "0x986ca22e9f0A6104AAdea7C2698317A690045D13";
    const AGGRESSIVE_VAULT = "0x7eD340313599090b25fA1F6F21671FE0210808E8";
    const STRATEGY_CONTROLLER = "0x65CD6764A4f574c1F6154518519925277C6CFF81";
    
    console.log("🔍 CHECKING VAULT-STRATEGY CONNECTION...\n");
    
    // Check vault balances again
    const vaultABI = [
        "function balanceOf(address) view returns (uint256)",
        "function totalAssets() view returns (uint256)",
        "function totalSupply() view returns (uint256)"
    ];
    
    const conservativeVault = new ethers.Contract(CONSERVATIVE_VAULT, vaultABI, provider);
    const aggressiveVault = new ethers.Contract(AGGRESSIVE_VAULT, vaultABI, provider);
    
    try {
        console.log("📊 VAULT BALANCES:");
        const conservativeBalance = await conservativeVault.balanceOf(userAddress);
        const aggressiveBalance = await aggressiveVault.balanceOf(userAddress);
        
        console.log(`Conservative Vault: ${ethers.formatEther(conservativeBalance)} shares`);
        console.log(`Aggressive Vault: ${ethers.formatEther(aggressiveBalance)} shares`);
        
        // Check total assets in vaults
        const conservativeAssets = await conservativeVault.totalAssets();
        const aggressiveAssets = await aggressiveVault.totalAssets();
        
        console.log(`\nConservative Total Assets: ${ethers.formatUnits(conservativeAssets, 6)} USDC`);
        console.log(`Aggressive Total Assets: ${ethers.formatUnits(aggressiveAssets, 6)} USDC`);
        
        // Check if vaults have VAULT_ROLE in StrategyController
        const strategyController = new ethers.Contract(
            STRATEGY_CONTROLLER,
            [
                "function hasRole(bytes32 role, address account) view returns (bool)",
                "function VAULT_ROLE() view returns (bytes32)"
            ],
            provider
        );
        
        const vaultRole = await strategyController.VAULT_ROLE();
        const conservativeHasRole = await strategyController.hasRole(vaultRole, CONSERVATIVE_VAULT);
        const aggressiveHasRole = await strategyController.hasRole(vaultRole, AGGRESSIVE_VAULT);
        
        console.log(`\n🔐 VAULT ROLES:`);
        console.log(`Conservative Vault has VAULT_ROLE: ${conservativeHasRole}`);
        console.log(`Aggressive Vault has VAULT_ROLE: ${aggressiveHasRole}`);
        
        if (!conservativeHasRole || !aggressiveHasRole) {
            console.log("\n❌ PROBLEM FOUND:");
            console.log("Vaults don't have VAULT_ROLE in StrategyController!");
            console.log("This means they CAN'T call allocate() function!");
            console.log("\n💡 SOLUTION:");
            console.log("Grant VAULT_ROLE to both vault contracts:");
            console.log(`strategyController.grantRole(VAULT_ROLE, "${CONSERVATIVE_VAULT}")`);
            console.log(`strategyController.grantRole(VAULT_ROLE, "${AGGRESSIVE_VAULT}")`);
        } else {
            console.log("\n✅ Vaults have proper roles - they should be calling allocate()");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);