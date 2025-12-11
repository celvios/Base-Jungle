const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🧪 Testing allocate() directly...\n");

    const STRATEGY_CONTROLLER = "0xa412EB221364Cc0891ad9215be7353cE0a1a2486";
    const VAULT = "0x7916Ea0bA5F9638fA3dD3BCD4DBD2b60f716cbFa";
    const USER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";

    // Get vault contract
    const vault = await hre.ethers.getContractAt("ConservativeVault", VAULT);
    
    // Check if vault has USDC to send
    const usdc = await hre.ethers.getContractAt(
        ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256) returns (bool)"],
        MOCK_USDC
    );
    
    const vaultBalance = await usdc.balanceOf(VAULT);
    console.log("Vault USDC Balance:", hre.ethers.formatUnits(vaultBalance, 6), "USDC");

    // Try calling allocate directly from vault address
    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);
    
    // First, send some USDC to StrategyController
    const testAmount = hre.ethers.parseUnits("100", 6);
    
    if (vaultBalance >= testAmount) {
        console.log("\n📤 Transferring USDC from vault to StrategyController...");
        const [signer] = await hre.ethers.getSigners();
        
        // Impersonate vault to call allocate
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [VAULT],
        });
        
        const vaultSigner = await hre.ethers.getSigner(VAULT);
        const scAsVault = sc.connect(vaultSigner);
        
        try {
            console.log("🧪 Calling allocate() from vault address...");
            await scAsVault.allocate.staticCall(USER, testAmount);
            console.log("✅ allocate() call succeeded!");
        } catch (error) {
            console.log("❌ allocate() call failed!");
            console.log("Error:", error.message);
            if (error.data) {
                console.log("Error data:", error.data);
            }
        }
        
        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [VAULT],
        });
    } else {
        console.log("\n⚠️  Vault doesn't have enough USDC to test");
        console.log("   Need:", hre.ethers.formatUnits(testAmount, 6), "USDC");
        console.log("   Have:", hre.ethers.formatUnits(vaultBalance, 6), "USDC");
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

