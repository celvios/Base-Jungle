/**
 * Test Aerodrome LP Strategy Profitability on Base Mainnet Fork
 * 
 * This script:
 * 1. Forks Base mainnet locally
 * 2. Provides liquidity to Aerodrome USDC/WETH pool
 * 3. Stakes LP tokens in gauge
 * 4. Simulates time passage (24h, 7d, 30d)
 * 5. Claims rewards and calculates actual APY
 * 6. Compares with Moonwell and Beefy strategies
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// Base Mainnet Addresses
const ADDRESSES = {
    // Tokens
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    WETH: "0x4200000000000000000000000000000000000006",
    AERO: "0x940181a94a35a4569e4529a3cdfb74e38fd98631",

    // Aerodrome
    ROUTER: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
    USDC_WETH_POOL: "0xb2cc224c1c9feE385f8ad6a55b4d94E92359DC59",
    USDC_WETH_GAUGE: "0x519BBD1Dd8C6A94C46080E24f316c14Ee758C025", // Need to verify

    // For comparison
    MOONWELL_USDC: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22", // Moonwell USDC market
    BEEFY_VAULT: "0x...", // Beefy USDC vault (need actual address)
};

// ABIs (minimal)
const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
];

const ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, bool stable, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)"
];

const GAUGE_ABI = [
    "function deposit(uint256 amount) external",
    "function withdraw(uint256 amount) external",
    "function getReward(address account) external",
    "function earned(address account) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
];

const PAIR_ABI = [
    "function getReserves() view returns (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast)",
    "function totalSupply() view returns (uint256)"
];

async function main() {
    console.log("🧪 Testing Aerodrome LP Strategy on Base Mainnet Fork\n");
    console.log("═══════════════════════════════════════════════════════════\n");

    // Get signer (impersonate a whale for testing)
    const [signer] = await ethers.getSigners();

    // Impersonate USDC whale for testing
    const USDC_WHALE = "0x20FE51A9229EEf2cF8Ad9E89d91CAb9312cF3b7A"; // Coinbase wallet
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [USDC_WHALE],
    });
    const whale = await ethers.getSigner(USDC_WHALE);

    // Get contracts
    const usdc = await ethers.getContractAt(ERC20_ABI, ADDRESSES.USDC, whale);
    const weth = await ethers.getContractAt(ERC20_ABI, ADDRESSES.WETH, whale);
    const aero = await ethers.getContractAt(ERC20_ABI, ADDRESSES.AERO, whale);
    const router = await ethers.getContractAt(ROUTER_ABI, ADDRESSES.ROUTER, whale);
    const pool = await ethers.getContractAt(PAIR_ABI, ADDRESSES.USDC_WETH_POOL, whale);

    // Test amount: $9,000 USDC
    const testAmount = ethers.parseUnits("9000", 6); // USDC has 6 decimals

    console.log("📊 Initial Setup:");
    console.log(`Test Amount: $9,000 USDC`);
    console.log(`Whale Address: ${USDC_WHALE}`);

    const initialUSDC = await usdc.balanceOf(whale.address);
    console.log(`Whale USDC Balance: $${ethers.formatUnits(initialUSDC, 6)}\n`);

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Add Liquidity to Aerodrome USDC/WETH Pool
    // ═══════════════════════════════════════════════════════════
    console.log("1️⃣  Adding Liquidity to Aerodrome USDC/WETH Pool...\n");

    // Get pool reserves to calculate optimal amounts
    const [reserve0, reserve1] = await pool.getReserves();
    console.log(`Pool Reserves:`);
    console.log(`  USDC: $${ethers.formatUnits(reserve0, 6)}`);
    console.log(`  WETH: ${ethers.formatUnits(reserve1, 18)} ETH\n`);

    // Calculate WETH amount needed (maintain pool ratio)
    const wethAmount = (testAmount * reserve1) / reserve0;
    console.log(`Amounts to provide:`);
    console.log(`  USDC: $${ethers.formatUnits(testAmount, 6)}`);
    console.log(`  WETH: ${ethers.formatUnits(wethAmount, 18)} ETH\n`);

    // Approve router
    await usdc.approve(ADDRESSES.ROUTER, testAmount);
    await weth.approve(ADDRESSES.ROUTER, wethAmount);

    // Add liquidity
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const tx = await router.addLiquidity(
        ADDRESSES.USDC,
        ADDRESSES.WETH,
        false, // volatile pool
        testAmount,
        wethAmount,
        testAmount * 95n / 100n, // 5% slippage
        wethAmount * 95n / 100n,
        whale.address,
        deadline
    );
    await tx.wait();

    const lpBalance = await pool.balanceOf(whale.address);
    console.log(`✅ Liquidity Added!`);
    console.log(`LP Tokens Received: ${ethers.formatUnits(lpBalance, 18)}\n`);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Stake LP Tokens in Gauge (if gauge exists)
    // ═══════════════════════════════════════════════════════════
    console.log("2️⃣  Staking LP Tokens in Gauge...\n");

    try {
        const gauge = await ethers.getContractAt(GAUGE_ABI, ADDRESSES.USDC_WETH_GAUGE, whale);
        await pool.approve(ADDRESSES.USDC_WETH_GAUGE, lpBalance);
        await gauge.deposit(lpBalance);
        console.log(`✅ LP Tokens Staked!\n`);
    } catch (error) {
        console.log(`⚠️  Gauge not found or error staking. Continuing with LP only...\n`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Simulate Time Passage and Calculate APY
    // ═══════════════════════════════════════════════════════════
    console.log("3️⃣  Simulating Time Passage...\n");

    const timeframes = [
        { name: "24 Hours", seconds: 86400 },
        { name: "7 Days", seconds: 604800 },
        { name: "30 Days", seconds: 2592000 }
    ];

    for (const timeframe of timeframes) {
        console.log(`\n📅 ${timeframe.name} Simulation:`);
        console.log("─────────────────────────────────────────────────────\n");

        // Fast-forward time
        await hre.network.provider.send("evm_increaseTime", [timeframe.seconds]);
        await hre.network.provider.send("evm_mine");

        // Get current LP value
        const [newReserve0, newReserve1] = await pool.getReserves();
        const totalSupply = await pool.totalSupply();
        const lpValue = (lpBalance * newReserve0 * 2n) / totalSupply; // Approximate USD value

        console.log(`LP Token Value: $${ethers.formatUnits(lpValue, 6)}`);

        // Try to get AERO rewards
        try {
            const gauge = await ethers.getContractAt(GAUGE_ABI, ADDRESSES.USDC_WETH_GAUGE, whale);
            const earned = await gauge.earned(whale.address);
            console.log(`AERO Rewards Earned: ${ethers.formatUnits(earned, 18)} AERO`);

            // Estimate AERO value (assume $1 per AERO for simplicity)
            const aeroValue = earned; // 1:1 if AERO = $1
            const totalValue = lpValue + aeroValue;

            console.log(`Total Value: $${ethers.formatUnits(totalValue, 6)}`);

            // Calculate APY
            const profit = totalValue - testAmount;
            const profitPercent = (Number(profit) / Number(testAmount)) * 100;
            const annualizedAPY = (profitPercent * 365 * 86400) / timeframe.seconds;

            console.log(`\n💰 Profit: $${ethers.formatUnits(profit, 6)} (${profitPercent.toFixed(2)}%)`);
            console.log(`📈 Annualized APY: ${annualizedAPY.toFixed(2)}%`);
            console.log(`💵 Daily Earnings: $${(Number(profit) * 86400 / timeframe.seconds).toFixed(2)}/day`);
        } catch (error) {
            console.log(`⚠️  Could not fetch gauge rewards`);

            // Calculate trading fee APY only
            const profit = lpValue - testAmount;
            const profitPercent = (Number(profit) / Number(testAmount)) * 100;
            const annualizedAPY = (profitPercent * 365 * 86400) / timeframe.seconds;

            console.log(`\n💰 Trading Fee Profit: $${ethers.formatUnits(profit, 6)} (${profitPercent.toFixed(2)}%)`);
            console.log(`📈 Trading Fee APY: ${annualizedAPY.toFixed(2)}%`);
            console.log(`💵 Daily Earnings: $${(Number(profit) * 86400 / timeframe.seconds).toFixed(2)}/day`);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Compare with Other Strategies
    // ═══════════════════════════════════════════════════════════
    console.log("\n\n4️⃣  Strategy Comparison:\n");
    console.log("═══════════════════════════════════════════════════════════\n");
    console.log("Strategy          | APY    | Daily on $9K | Risk");
    console.log("------------------|--------|--------------|--------");
    console.log("Moonwell Lending  | 5%     | $1.23        | Low");
    console.log("Beefy Vault       | 10%    | $2.47        | Low");
    console.log("Aerodrome LP      | ???%   | $???         | Medium");
    console.log("\n(Aerodrome APY calculated above based on simulation)\n");

    console.log("═══════════════════════════════════════════════════════════\n");
    console.log("✅ Test Complete!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
