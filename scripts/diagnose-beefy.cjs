const hre = require("hardhat");

async function main() {
    const adapterAddress = "0x4ba85843280187acE3670E707dF6c1E3BBbbcf2A";
    console.log(`🔍 Diagnosing Beefy Adapter at ${adapterAddress}`);

    // 1. Check code exists
    const code = await hre.ethers.provider.getCode(adapterAddress);
    if (code === "0x") {
        console.log("❌ No code at adapter address!");
        return;
    }

    // 2. Try raw calls to debugging getters potentially missing from artifact
    // Or just standard ones.
    const Adapter = await hre.ethers.getContractAt("BeefyVaultAdapter", adapterAddress);

    try {
        console.log("📞 Calling asset()...");
        const asset = await Adapter.asset();
        console.log(`✅ Asset: ${asset}`);

        const Token = await hre.ethers.getContractAt("IERC20", asset);
        const symbol = await Token.symbol().catch(() => "Unknown");
        const balance = await Token.balanceOf(adapterAddress);
        console.log(`   Detailed: Symbol=${symbol}, AdapterAssetBalance=${balance}`);
    } catch (e) {
        console.log(`❌ asset() failed: ${e.message}`);
    }

    /*
    try {
        console.log("📞 Calling beefyVault()...");
        // Note: If immutable, sometimes it's not a standard public getter if logic changed? 
        // But solidity generates one.
        const vault = await Adapter.beefyVault();
        console.log(`✅ Beefy Vault: ${vault}`);
        
        // Check vault details
        const MockVault = await hre.ethers.getContractAt("IBeefyVault", vault);
        const vaultBal = await MockVault.balanceOf(adapterAddress);
        console.log(`   Adapter Shares in Vault: ${vaultBal}`);
        
        const ppfs = await MockVault.getPricePerFullShare();
        console.log(`   Price Per Full Share: ${ppfs}`);
  
    } catch (e) {
        console.log(`❌ beefyVault() failed: ${e.message}`);
    }
    */

    try {
        console.log("📞 Calling balanceOf()...");
        const bal = await Adapter.balanceOf();
        console.log(`✅ balanceOf: ${bal}`);
    } catch (e) {
        console.log(`❌ balanceOf() failed: ${e.message}`);
        // If it fails, let's look at reasoning
        // It calls IBeefyVault(beefyVault).balanceOf(this)
        // If beefyVault is 0 or invalid, it reverts.
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
