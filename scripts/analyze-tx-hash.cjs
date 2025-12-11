const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    const txHash = "0xe895cdafb66beb96013aa54282bd7b9cd695853a37e92a0989a8cd0fc4f02b2f";
    
    console.log("\n🔍 Analyzing Transaction...\n");
    console.log("Transaction:", txHash);
    console.log("BaseScan:", `https://sepolia.basescan.org/tx/${txHash}\n`);

    const provider = hre.ethers.provider;
    
    try {
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        console.log("📋 Transaction Details:");
        console.log("From:", tx.from);
        console.log("To:", tx.to);
        console.log("Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");
        
        if (receipt.status === 0) {
            console.log("\n❌ Transaction Failed!");
            
            // Try to get revert reason
            try {
                const code = await provider.call(tx, receipt.blockNumber);
                console.log("Revert reason (if available):", code);
            } catch (error) {
                console.log("Error getting revert reason:", error.message);
                
                // Try to decode error data
                if (error.data) {
                    console.log("\n🔍 Error Data:", error.data);
                    
                    const errorInterface = new hre.ethers.Interface([
                        "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
                        "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
                        "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)"
                    ]);
                    
                    try {
                        const decoded = errorInterface.parseError(error.data);
                        console.log("\n📊 Decoded Error:");
                        console.log("Name:", decoded.name);
                        console.log("Account:", decoded.args[0]);
                        if (decoded.args.length > 1) {
                            console.log("Role/Balance:", decoded.args[1]);
                        }
                    } catch (decodeErr) {
                        console.log("Could not decode error");
                    }
                }
            }
        }
    } catch (error) {
        console.log("Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

