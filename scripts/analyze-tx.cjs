const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    const txHash = "0x3f1ad03ef3436fc928e781f7865a0ff8a5c4588d7977ef44a8117cd060397dae";
    
    console.log("\n🔍 Analyzing Transaction...\n");

    const provider = hre.ethers.provider;
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
        console.log("❌ Transaction not found");
        return;
    }

    console.log("📋 Transaction Details:");
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Data:", tx.data);

    // Decode the function call
    const vaultInterface = new hre.ethers.Interface([
        "function deposit(uint256 assets, address receiver) returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
    ]);

    try {
        const decoded = vaultInterface.parseTransaction({ data: tx.data });
        console.log("\n📝 Function Called:", decoded.name);
        console.log("Arguments:");
        
        if (decoded.name === "deposit") {
            const assets = decoded.args[0];
            const receiver = decoded.args[1];
            console.log("  Assets:", hre.ethers.formatUnits(assets, 6), "USDC");
            console.log("  Receiver:", receiver);
        }
    } catch (e) {
        console.log("Could not decode:", e.message);
    }

    // Try to simulate to get the error
    console.log("\n🔍 Simulating transaction to get error...");
    
    try {
        await provider.call(tx, tx.blockNumber - 1);
        console.log("✅ Simulation succeeded (shouldn't happen for failed tx)");
    } catch (error) {
        console.log("❌ Revert reason:", error.message);
        
        // Try to decode the error
        if (error.data) {
            try {
                const errorInterface = new hre.ethers.Interface([
                    "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
                    "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
                    "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
                    "error OwnableUnauthorizedAccount(address account)"
                ]);
                
                const decodedError = errorInterface.parseError(error.data);
                console.log("\n📊 Decoded error:", decodedError);
            } catch (decodeErr) {
                console.log("Could not decode error data");
            }
        }
    }

    // Check vault state
    console.log("\n📊 Checking Vault State...");
    const vault = await hre.ethers.getContractAt("ConservativeVault", tx.to);
    
    try {
        const asset = await vault.asset();
        console.log("Asset (USDC):", asset);
        
        const strategyController = await vault.strategyController();
        console.log("Strategy Controller:", strategyController);
        
        // Check if vault has approved strategyController
        const MockUSDC = await hre.ethers.getContractAt("MockUSDC", asset);
        const vaultBalance = await MockUSDC.balanceOf(tx.to);
        console.log("Vault USDC Balance:", hre.ethers.formatUnits(vaultBalance, 6));
        
        // Check user's USDC balance and allowance
        const userBalance = await MockUSDC.balanceOf(tx.from);
        const userAllowance = await MockUSDC.allowance(tx.from, tx.to);
        console.log("\nUser USDC Balance:", hre.ethers.formatUnits(userBalance, 6));
        console.log("User Allowance to Vault:", hre.ethers.formatUnits(userAllowance, 6));
        
    } catch (err) {
        console.log("Error checking vault state:", err.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

