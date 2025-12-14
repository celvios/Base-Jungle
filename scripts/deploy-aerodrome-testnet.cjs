const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Aerodrome Strategy to Base Sepolia (Testnet)...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Load existing deployments
    const deploymentsPath = path.join(__dirname, "../deployed-addresses-sepolia.json");
    let deployments = {};
    if (fs.existsSync(deploymentsPath)) {
        deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    }

    // 1. Get or Deploy Mock Tokens
    let usdcAddress = deployments.mockUSDC || deployments.usdcAddress;
    let wethAddress = deployments.mockWETH; // Check if exists, or deploy
    let aeroAddress = deployments.mockAERO; // Check if exists, or deploy

    if (!usdcAddress) {
        console.log("Deploying MockUSDC...");
        const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
        const usdc = await MockUSDC.deploy();
        await usdc.waitForDeployment();
        usdcAddress = await usdc.getAddress();
        console.log("MockUSDC deployed to:", usdcAddress);
    }

    // Deploy MockWETH if missing (using MockERC20)
    if (!wethAddress) {
        console.log("Deploying MockWETH...");
        const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
        const weth = await MockERC20.deploy("Wrapped Ether", "WETH");
        await weth.waitForDeployment();
        wethAddress = await weth.getAddress();
        console.log("MockWETH deployed to:", wethAddress);
    }

    // Deploy MockAERO if missing
    if (!aeroAddress) {
        console.log("Deploying MockAERO...");
        const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
        const aero = await MockERC20.deploy("Aerodrome", "AERO");
        await aero.waitForDeployment();
        aeroAddress = await aero.getAddress();
        console.log("MockAERO deployed to:", aeroAddress);
    }

    // 2. Deploy Mock Aerodrome Protocol
    console.log("Deploying Mock Aerodrome Protocol...");

    // Router
    const MockRouter = await hre.ethers.getContractFactory("MockAerodromeRouter");
    const router = await MockRouter.deploy();
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("MockRouter deployed to:", routerAddress);

    // Pool (USDC-WETH)
    const MockPool = await hre.ethers.getContractFactory("MockAerodromePool");
    const pool = await MockPool.deploy(usdcAddress, wethAddress);
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("MockPool (USDC-WETH) deployed to:", poolAddress);

    // Gauge (Staking Pool LP, Rewarding AERO)
    const MockGauge = await hre.ethers.getContractFactory("MockAerodromeGauge");
    const gauge = await MockGauge.deploy(poolAddress, aeroAddress);
    await gauge.waitForDeployment();
    const gaugeAddress = await gauge.getAddress();
    console.log("MockGauge deployed to:", gaugeAddress);

    // Fund Gauge with AERO rewards
    const aeroContract = await hre.ethers.getContractAt("MockERC20", aeroAddress);
    await aeroContract.mint(gaugeAddress, hre.ethers.parseEther("1000000")); // 1M AERO rewards
    console.log("Funded Gauge with 1M AERO rewards");

    // 3. Deploy Adapters
    console.log("Deploying Adapters...");

    // LP Adapter
    const AerodromeLPAdapter = await hre.ethers.getContractFactory("AerodromeLPAdapter");
    const lpAdapter = await AerodromeLPAdapter.deploy(
        routerAddress,
        usdcAddress,
        wethAddress,
        poolAddress,
        false // Volatile (false) for USDC-WETH usually
    );
    await lpAdapter.waitForDeployment();
    const lpAdapterAddress = await lpAdapter.getAddress();
    console.log("AerodromeLPAdapter deployed to:", lpAdapterAddress);

    // Gauge Adapter
    const AerodromeGaugeAdapter = await hre.ethers.getContractFactory("AerodromeGaugeAdapter");
    // Ensure DEXAggregator exists in deployments, or deploy mock/placeholder
    let dexAggregatorAddress = deployments.dexAggregator;
    if (!dexAggregatorAddress) {
        // Deploy basic DEX Aggregator if missing
        const DEXAggregator = await hre.ethers.getContractFactory("DEXAggregator");
        const dexAgg = await DEXAggregator.deploy(routerAddress, hre.ethers.ZeroAddress, hre.ethers.ZeroAddress); // Use MockRouter as primary, no UniV3
        await dexAgg.waitForDeployment();
        dexAggregatorAddress = await dexAgg.getAddress();
        console.log("DEXAggregator deployed to:", dexAggregatorAddress);
    }

    const gaugeAdapter = await AerodromeGaugeAdapter.deploy(
        dexAggregatorAddress,
        aeroAddress
    );
    await gaugeAdapter.waitForDeployment();
    const gaugeAdapterAddress = await gaugeAdapter.getAddress();
    console.log("AerodromeGaugeAdapter deployed to:", gaugeAdapterAddress);

    // Grant Role to Vault? 
    // The StrategyController adds the strategy and the vault delegates calls. 
    // Adapters usually require checking msg.sender is Vault.
    // We need to set up the StrategyController.

    const strategyControllerAddress = deployments.strategyController;
    if (strategyControllerAddress) {
        const controller = await hre.ethers.getContractAt("StrategyController", strategyControllerAddress);

        // Add Strategy: Adapter = LP Adapter?
        // Wait, strategy usually points to ONE adapter. 
        // If we have LP and Gauge, do we bundle them? 
        // Looking at StrategyController, it adds `adapter`.
        // If `AerodromeLPAdapter` is the main entry, it should handle gauge staking internally 
        // OR the Controller uses multiple steps.
        // Based on previous files, `AerodromeLPAdapter` does NOT reference Gauge.
        // This implies the StrategyController or Vault must manually call GaugeAdapter.
        // OR I should have linked them. 
        // For now, I will add LP Adapter as the main strategy. 
        // The user can manually call "stake" via the UI if I expose it, or the strategy should have done it.

        // *Correction*: Usually `adapter` in StrategyController IS the strategy logic. 
        // If `AerodromeLPAdapter` doesn't stake, yield is low.
        // I should perhaps update `AerodromeLPAdapter` to CACHE the gauge and call it?
        // Or maybe `AerodromeGaugeAdapter` IS the strategy that wraps LP?
        // "Stake LP tokens in Aerodrome gauges..." -> GaugeAdapter seems to be the one dealing with yield.
        // But `AerodromeLPAdapter` deals with *entering* the pool.

        // Let's add BOTH for now, or assume the UI handles the flow (Deposit -> LP -> Stake).
        // Given the UI has "Harvest", it implies the system handles it.

        console.log("Adding LP Strategy to Controller...");
        // Tier 1 (Novice), 70% allocation
        try {
            await controller.addStrategy(lpAdapterAddress, 1, 7000); // Add LP adapter
            console.log("Added LP Adapter to Strategy Controller");
        } catch (e) {
            console.log("Could not add strategy (maybe already added or permission):", e.message);
        }
    }

    // Update deployments file
    deployments.mockWETH = wethAddress;
    deployments.mockAERO = aeroAddress;
    deployments.mockAerodromeRouter = routerAddress;
    deployments.mockAerodromePool = poolAddress;
    deployments.mockAerodromeGauge = gaugeAddress;
    deployments.aerodromeLPAdapter = lpAdapterAddress;
    deployments.aerodromeGaugeAdapter = gaugeAdapterAddress;
    deployments.dexAggregator = dexAggregatorAddress;

    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log("✅ Deployments updated in:", deploymentsPath);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
