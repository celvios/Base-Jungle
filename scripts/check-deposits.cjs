const { ethers } = require("hardhat");

async function main() {
    const userAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    
    // Vault addresses
    const CONSERVATIVE_VAULT = "0x986ca22e9f0A6104AAdea7C2698317A690045D13";
    const AGGRESSIVE_VAULT = "0x7eD340313599090b25fA1F6F21671FE0210808E8";
    
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    const vaultABI = ["function balanceOf(address) view returns (uint256)"];
    
    const conservativeVault = new ethers.Contract(CONSERVATIVE_VAULT, vaultABI, provider);
    const aggressiveVault = new ethers.Contract(AGGRESSIVE_VAULT, vaultABI, provider);
    
    try {
        const conservativeBalance = await conservativeVault.balanceOf(userAddress);
        const aggressiveBalance = await aggressiveVault.balanceOf(userAddress);
        
        console.log(`📊 Vault Deposits for ${userAddress}:`);
        console.log(`🟢 Conservative Vault: ${ethers.formatEther(conservativeBalance)} shares`);
        console.log(`🔴 Aggressive Vault: ${ethers.formatEther(aggressiveBalance)} shares`);
        
        const totalShares = conservativeBalance + aggressiveBalance;
        console.log(`💰 Total Vault Shares: ${ethers.formatEther(totalShares)}`);
        
        if (totalShares === 0n) {
            console.log("\n❌ NO DEPOSITS FOUND");
            console.log("💡 User needs to deposit into vaults first");
        } else {
            console.log("\n✅ DEPOSITS FOUND");
            console.log("🤖 Allocation should happen automatically on deposit");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);