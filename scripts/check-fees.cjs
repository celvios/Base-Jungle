const hre = require("hardhat");
const fs = require("fs");

/**
 * Script to check total fees collected in TreasuryManager
 * Usage: npx hardhat run scripts/check-fees.cjs --network baseSepolia
 */

async function main() {
    console.log("\n💰 Checking Fee Collection Status...\n");
    console.log("═══════════════════════════════════════════════════════\n");

    // Load deployed addresses
    let addresses;
    try {
        const addressesFile = fs.readFileSync("./deployed-addresses-sepolia.json", "utf8");
        addresses = JSON.parse(addressesFile);
    } catch (error) {
        console.error("❌ Error: Could not load deployed-addresses-sepolia.json");
        console.error("Make sure you've deployed contracts first.");
        process.exit(1);
    }

    const USDC_ADDRESS = addresses.usdcAddress;
    const TREASURY_MANAGER = addresses.contracts.treasuryManager;
    const CONSERVATIVE_VAULT = addresses.contracts.conservativeVault;
    const AGGRESSIVE_VAULT = addresses.contracts.aggressiveVault;

    console.log("📋 Contract Addresses:");
    console.log(`   USDC: ${USDC_ADDRESS}`);
    console.log(`   Treasury Manager: ${TREASURY_MANAGER}`);
    console.log(`   Conservative Vault: ${CONSERVATIVE_VAULT}`);
    console.log(`   Aggressive Vault: ${AGGRESSIVE_VAULT}\n`);

    // Get TreasuryManager ABI
    const TreasuryManagerABI = [
        "function getFundBreakdown(address token) external view returns (uint256 liquidity, uint256 dev, uint256 marketing, uint256 team, uint256 total)",
        "function funds(address token) external view returns (uint256 liquidityReserve, uint256 developmentFund, uint256 marketingFund, uint256 teamFund, uint256 totalReceived)"
    ];

    // Get Vault ABI for fee info
    const VaultABI = [
        "function depositFee() external view returns (uint256)",
        "function feeCollector() external view returns (address)",
        "function BASIS_POINTS() external view returns (uint256)"
    ];

    try {
        const treasuryManager = await hre.ethers.getContractAt(TreasuryManagerABI, TREASURY_MANAGER);
        const conservativeVault = await hre.ethers.getContractAt(VaultABI, CONSERVATIVE_VAULT);
        const aggressiveVault = await hre.ethers.getContractAt(VaultABI, AGGRESSIVE_VAULT);

        // Get fee rates
        console.log("📊 Fee Configuration:");
        const conservativeFee = await conservativeVault.depositFee();
        const aggressiveFee = await aggressiveVault.depositFee();
        const basisPoints = await conservativeVault.BASIS_POINTS();
        
        console.log(`   Conservative Vault Deposit Fee: ${conservativeFee} basis points (${(Number(conservativeFee) / Number(basisPoints) * 100).toFixed(2)}%)`);
        console.log(`   Aggressive Vault Deposit Fee: ${aggressiveFee} basis points (${(Number(aggressiveFee) / Number(basisPoints) * 100).toFixed(2)}%)\n`);

        // Get fee collectors
        const conservativeFeeCollector = await conservativeVault.feeCollector();
        const aggressiveFeeCollector = await aggressiveVault.feeCollector();
        console.log("🏦 Fee Collectors:");
        console.log(`   Conservative Vault → ${conservativeFeeCollector}`);
        console.log(`   Aggressive Vault → ${aggressiveFeeCollector}\n`);

        // Get USDC contract
        const USDC_ABI = [
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ];
        const usdc = await hre.ethers.getContractAt(USDC_ABI, USDC_ADDRESS);
        const decimals = await usdc.decimals();

        // Check Treasury Manager balance
        const treasuryBalance = await usdc.balanceOf(TREASURY_MANAGER);
        console.log("💵 Treasury Manager USDC Balance:");
        console.log(`   ${hre.ethers.formatUnits(treasuryBalance, decimals)} USDC\n`);

        // Get fund breakdown from TreasuryManager
        try {
            const breakdown = await treasuryManager.getFundBreakdown(USDC_ADDRESS);
            console.log("📦 Fund Breakdown in TreasuryManager:");
            console.log(`   Liquidity Reserve: ${hre.ethers.formatUnits(breakdown.liquidity, decimals)} USDC`);
            console.log(`   Development Fund: ${hre.ethers.formatUnits(breakdown.dev, decimals)} USDC`);
            console.log(`   Marketing Fund: ${hre.ethers.formatUnits(breakdown.marketing, decimals)} USDC`);
            console.log(`   Team Fund: ${hre.ethers.formatUnits(breakdown.team, decimals)} USDC`);
            console.log(`   Total Received: ${hre.ethers.formatUnits(breakdown.total, decimals)} USDC\n`);
        } catch (error) {
            console.log("⚠️  Could not fetch fund breakdown (may not be implemented yet)\n");
        }

        // Check vault balances (fees should be sent to treasury, not stay in vault)
        const conservativeVaultBalance = await usdc.balanceOf(CONSERVATIVE_VAULT);
        const aggressiveVaultBalance = await usdc.balanceOf(AGGRESSIVE_VAULT);
        
        console.log("🏛️  Vault USDC Balances:");
        console.log(`   Conservative Vault: ${hre.ethers.formatUnits(conservativeVaultBalance, decimals)} USDC`);
        console.log(`   Aggressive Vault: ${hre.ethers.formatUnits(aggressiveVaultBalance, decimals)} USDC\n`);

        // Summary
        console.log("═══════════════════════════════════════════════════════");
        console.log("📈 SUMMARY:");
        console.log(`   Total Fees in Treasury: ${hre.ethers.formatUnits(treasuryBalance, decimals)} USDC`);
        console.log(`   Deposit Fee Rate: ${(Number(conservativeFee) / Number(basisPoints) * 100).toFixed(2)}%`);
        console.log("═══════════════════════════════════════════════════════\n");

    } catch (error) {
        console.error("❌ Error checking fees:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

