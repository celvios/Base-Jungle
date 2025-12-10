const hre = require("hardhat");

async function main() {
    const errorData = "0xe450d38c00000000000000000000000048c9310b3139dd5b8d9c05b24b56539c56c27f9100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014d73c50";
    
    console.log("\n🔍 Decoding Error Data...\n");
    
    const errorInterface = new hre.ethers.Interface([
        "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
        "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)"
    ]);
    
    try {
        const decoded = errorInterface.parseError(errorData);
        console.log("Error:", decoded.name);
        console.log("Parameters:");
        console.log("  Sender/Spender:", decoded.args[0]);
        console.log("  Balance/Allowance:", hre.ethers.formatUnits(decoded.args[1], 6), "USDC");
        console.log("  Needed:", hre.ethers.formatUnits(decoded.args[2], 6), "USDC");
        
        console.log("\n📊 Analysis:");
        if (decoded.name === "ERC20InsufficientBalance") {
            console.log(`  ❌ ${decoded.args[0]} has insufficient balance`);
            console.log(`     Current: ${hre.ethers.formatUnits(decoded.args[1], 6)} USDC`);
            console.log(`     Needs: ${hre.ethers.formatUnits(decoded.args[2], 6)} USDC`);
        } else {
            console.log(`  ❌ ${decoded.args[0]} has insufficient allowance`);
            console.log(`     Current: ${hre.ethers.formatUnits(decoded.args[1], 6)} USDC`);
            console.log(`     Needs: ${hre.ethers.formatUnits(decoded.args[2], 6)} USDC`);
        }
    } catch (e) {
        console.log("Could not decode:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

