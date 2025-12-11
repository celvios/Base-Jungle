const hre = require("hardhat");

async function main() {
    const errorData = "0xfb8f41b20000000000000000000000007916ea0ba5f9638fa3dd3bcd4dbd2b60f716cbfa0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001dcd6500";
    
    console.log("\n🔍 Decoding Error...\n");
    
    const iface = new hre.ethers.Interface([
        "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
        "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)"
    ]);
    
    try {
        const decoded = iface.parseError(errorData);
        console.log("Error Name:", decoded.name);
        console.log("Parameters:");
        console.log("  Address:", decoded.args[0]);
        console.log("  Current:", hre.ethers.formatUnits(decoded.args[1], 6), "USDC");
        console.log("  Needed:", hre.ethers.formatUnits(decoded.args[2], 6), "USDC");
        
        console.log("\n📊 Analysis:");
        console.log(`  ${decoded.args[0]} needs ${hre.ethers.formatUnits(decoded.args[2], 6)} USDC`);
        console.log(`  But only has ${hre.ethers.formatUnits(decoded.args[1], 6)} USDC`);
    } catch (e) {
        console.log("Could not decode:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

