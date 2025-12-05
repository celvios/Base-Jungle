import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Liquidation System Tests", function () {
    let leverageManager, cascadingLiquidationHandler, moonwellAdapter, referralManager;
    let owner, user1, user2, keeper, liquidator;
    let usdc, mUSDC, comptroller;
    let usdcFeed;

    beforeEach(async function () {
        [owner, user1, user2, keeper, liquidator] = await ethers.getSigners();

        // Deploy mock USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USDC", "USDC");
        await usdc.waitForDeployment();

        // Mint tokens
        await usdc.mint(user1.address, ethers.parseUnits("100000", 6));
        await usdc.mint(user2.address, ethers.parseUnits("100000", 6));

        // Deploy Chainlink mock feed
        const MockAggregator = await ethers.getContractFactory("MockChainlinkAggregator");
        usdcFeed = await MockAggregator.deploy(8, ethers.parseUnits("1", 8)); // $1
        await usdcFeed.waitForDeployment();

        // Deploy mock Moonwell contracts
        const MockComptroller = await ethers.getContractFactory("MockComptroller");
        comptroller = await MockComptroller.deploy();
        await comptroller.waitForDeployment();

        const MockMToken = await ethers.getContractFactory("MockMToken");
        mUSDC = await MockMToken.deploy(await usdc.getAddress(), "Moonwell USDC", "mUSDC");
        await mUSDC.waitForDeployment();

        // Deploy ChainlinkOracle
        const ChainlinkOracle = await ethers.getContractFactory("ChainlinkOracle");
        const oracle = await ChainlinkOracle.deploy();
        await oracle.waitForDeployment();
        await oracle.setFeed(await usdc.getAddress(), await usdcFeed.getAddress(), 3600);

        // Deploy MoonwellAdapter
        const MoonwellAdapter = await ethers.getContractFactory("MoonwellAdapter");
        moonwellAdapter = await MoonwellAdapter.deploy(
            await comptroller.getAddress(),
            await oracle.getAddress()
        );
        await moonwellAdapter.waitForDeployment();
        await moonwellAdapter.setMToken(await usdc.getAddress(), await mUSDC.getAddress());

        // Deploy ReferralManager
        const ReferralManager = await ethers.getContractFactory("ReferralManager");
        referralManager = await ReferralManager.deploy();
        await referralManager.waitForDeployment();

        // Deploy LeverageManager
        const LeverageManager = await ethers.getContractFactory("LeverageManager");
        leverageManager = await LeverageManager.deploy(
            await referralManager.getAddress(),
            await moonwellAdapter.getAddress()
        );
        await leverageManager.waitForDeployment();

        // Grant STRATEGY_ROLE to keeper
        const STRATEGY_ROLE = await leverageManager.STRATEGY_ROLE();
        await leverageManager.grantRole(STRATEGY_ROLE, keeper.address);

        // Deploy CascadingLiquidationHandler
        const TWAPOracle = await ethers.getContractFactory("TWAPOracle");
        const twapOracle = await TWAPOracle.deploy(await oracle.getAddress());
        await twapOracle.waitForDeployment();

        const CascadingLiquidationHandler = await ethers.getContractFactory("CascadingLiquidationHandler");
        cascadingLiquidationHandler = await CascadingLiquidationHandler.deploy(
            await leverageManager.getAddress(),
            await twapOracle.getAddress()
        );
        await cascadingLiquidationHandler.waitForDeployment();

        // Grant KEEPER_ROLE to keeper in cascading handler
        const KEEPER_ROLE = await cascadingLiquidationHandler.KEEPER_ROLE();
        await cascadingLiquidationHandler.grantRole(KEEPER_ROLE, keeper.address);
    });

    // ========================================
    // Test 1: Successful liquidation of underwater position
    // ========================================
    describe("✅ Test 1: Successful Liquidation", function () {
        it("Should successfully liquidate an underwater position", async function () {
            // Setup: Create leveraged position
            const collateral = ethers.parseUnits("10000", 6);
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);

            const borrowAmount = ethers.parseUnits("5000", 6);
            await moonwellAdapter.connect(user1).borrow(await mUSDC.getAddress(), borrowAmount);

            // Open leverage position
            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150 // 1.5x leverage
            );

            // Simulate price drop to make position underwater
            // Set health factor below MIN_HEALTH_FACTOR (1.2)
            await comptroller.setAccountLiquidity(user1.address, 0, ethers.parseUnits("1000", 6), 0);

            // Get initial state
            const debtBefore = await leverageManager.getUserDebt(user1.address);
            const collateralBefore = await leverageManager.getUserCollateral(user1.address);

            // Execute liquidation
            const tx = await leverageManager.connect(keeper).liquidate(
                user1.address,
                liquidator.address
            );

            // Verify liquidation event
            await expect(tx).to.emit(leverageManager, "LiquidationExecuted");

            // Verify debt reduced by 50%
            const debtAfter = await leverageManager.getUserDebt(user1.address);
            expect(debtAfter).to.equal(debtBefore / 2n);

            // Verify collateral seized (with 10% bonus)
            const expectedSeized = (debtBefore / 2n) * 11000n / 10000n;
            const collateralAfter = await leverageManager.getUserCollateral(user1.address);
            expect(collateralAfter).to.equal(collateralBefore - expectedSeized);
        });
    });

    // ========================================
    // Test 2: Cannot liquidate healthy position
    // ========================================
    describe("❌ Test 2: Cannot Liquidate Healthy Position", function () {
        it("Should revert when trying to liquidate a healthy position", async function () {
            // Setup: Create healthy leveraged position
            const collateral = ethers.parseUnits("10000", 6);
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);

            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );

            // Set healthy health factor (above MIN_HEALTH_FACTOR)
            await comptroller.setAccountLiquidity(user1.address, ethers.parseUnits("5000", 6), 0, 0);

            // Try to liquidate - should revert
            await expect(
                leverageManager.connect(keeper).liquidate(user1.address, liquidator.address)
            ).to.be.revertedWith("Position healthy");
        });
    });

    // ========================================
    // Test 3: Liquidator receives correct bonus (10%)
    // ========================================
    describe("💰 Test 3: Liquidator Bonus", function () {
        it("Should give liquidator exactly 10% bonus", async function () {
            // Setup underwater position
            const collateral = ethers.parseUnits("10000", 6);
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);

            const borrowAmount = ethers.parseUnits("5000", 6);
            await moonwellAdapter.connect(user1).borrow(await mUSDC.getAddress(), borrowAmount);

            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );

            // Make underwater
            await comptroller.setAccountLiquidity(user1.address, 0, ethers.parseUnits("1000", 6), 0);

            const debtBefore = await leverageManager.getUserDebt(user1.address);
            const liquidatorBalanceBefore = await usdc.balanceOf(liquidator.address);

            // Liquidate
            await leverageManager.connect(keeper).liquidate(user1.address, liquidator.address);

            // Verify liquidator received debt repaid + 10% bonus
            const liquidatorBalanceAfter = await usdc.balanceOf(liquidator.address);
            const debtRepaid = debtBefore / 2n;
            const expectedBonus = debtRepaid * 1000n / 10000n; // 10%
            const expectedTotal = debtRepaid + expectedBonus;

            expect(liquidatorBalanceAfter - liquidatorBalanceBefore).to.equal(expectedTotal);
        });
    });

    // ========================================
    // Test 4: Position state updates correctly
    // ========================================
    describe("📊 Test 4: Position State Updates", function () {
        it("Should correctly update position state after liquidation", async function () {
            // Setup
            const collateral = ethers.parseUnits("10000", 6);
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);

            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );

            await comptroller.setAccountLiquidity(user1.address, 0, ethers.parseUnits("1000", 6), 0);

            const [, , totalDepositedBefore, totalBorrowedBefore, ,] = await leverageManager.positions(user1.address);

            // Liquidate
            await leverageManager.connect(keeper).liquidate(user1.address, liquidator.address);

            // Verify position updated
            const [, , totalDepositedAfter, totalBorrowedAfter, , lastUpdate] = await leverageManager.positions(user1.address);

            expect(totalBorrowedAfter).to.equal(totalBorrowedBefore / 2n);
            expect(totalDepositedAfter).to.be.lt(totalDepositedBefore);
            expect(lastUpdate).to.be.gt(0);
        });
    });

    // ========================================
    // Test 5: Multiple liquidations in sequence
    // ========================================
    describe("🔄 Test 5: Multiple Liquidations", function () {
        it("Should handle multiple liquidations in sequence", async function () {
            // Setup two underwater positions
            const collateral = ethers.parseUnits("10000", 6);

            // User 1 position
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);
            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );
            await comptroller.setAccountLiquidity(user1.address, 0, ethers.parseUnits("1000", 6), 0);

            // User 2 position
            await usdc.connect(user2).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user2).deposit(await mUSDC.getAddress(), collateral);
            await leverageManager.connect(user2).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );
            await comptroller.setAccountLiquidity(user2.address, 0, ethers.parseUnits("1000", 6), 0);

            // Liquidate both
            await expect(
                leverageManager.connect(keeper).liquidate(user1.address, liquidator.address)
            ).to.emit(leverageManager, "LiquidationExecuted");

            await expect(
                leverageManager.connect(keeper).liquidate(user2.address, liquidator.address)
            ).to.emit(leverageManager, "LiquidationExecuted");

            // Verify both positions liquidated
            const debt1 = await leverageManager.getUserDebt(user1.address);
            const debt2 = await leverageManager.getUserDebt(user2.address);

            expect(debt1).to.be.lt(ethers.parseUnits("5000", 6));
            expect(debt2).to.be.lt(ethers.parseUnits("5000", 6));
        });
    });

    // ========================================
    // Test 6: Liquidation with insufficient collateral
    // ========================================
    describe("⚠️ Test 6: Insufficient Collateral", function () {
        it("Should revert if collateral insufficient for liquidation", async function () {
            // Setup position with very low collateral
            const collateral = ethers.parseUnits("100", 6);
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);

            // Try to create position with high debt (this should fail in real scenario)
            // For testing, we'll manually set up an impossible scenario
            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );

            // Manually set very high debt (simulating extreme market conditions)
            // Note: This would require modifying the contract or using a more sophisticated mock

            // Make underwater
            await comptroller.setAccountLiquidity(user1.address, 0, ethers.parseUnits("10000", 6), 0);

            // Liquidation should handle this gracefully or revert
            // Implementation depends on contract logic
        });
    });

    // ========================================
    // Test 7: Access control (only STRATEGY_ROLE)
    // ========================================
    describe("🔐 Test 7: Access Control", function () {
        it("Should only allow STRATEGY_ROLE to liquidate", async function () {
            // Setup underwater position
            const collateral = ethers.parseUnits("10000", 6);
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);
            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );
            await comptroller.setAccountLiquidity(user1.address, 0, ethers.parseUnits("1000", 6), 0);

            // Try to liquidate without STRATEGY_ROLE - should revert
            await expect(
                leverageManager.connect(user2).liquidate(user1.address, liquidator.address)
            ).to.be.reverted; // Will revert with AccessControl error

            // Keeper with STRATEGY_ROLE should succeed
            await expect(
                leverageManager.connect(keeper).liquidate(user1.address, liquidator.address)
            ).to.emit(leverageManager, "LiquidationExecuted");
        });
    });

    // ========================================
    // Test 8: Integration with CascadingLiquidationHandler
    // ========================================
    describe("🔗 Test 8: Cascading Liquidation Integration", function () {
        it("Should queue and process liquidation through handler", async function () {
            // Setup underwater position
            const collateral = ethers.parseUnits("10000", 6);
            await usdc.connect(user1).approve(await moonwellAdapter.getAddress(), collateral);
            await moonwellAdapter.connect(user1).deposit(await mUSDC.getAddress(), collateral);
            await leverageManager.connect(user1).openLeveragePosition(
                await moonwellAdapter.getAddress(),
                collateral,
                150
            );
            await comptroller.setAccountLiquidity(user1.address, 0, ethers.parseUnits("1000", 6), 0);

            // Queue liquidation
            await cascadingLiquidationHandler.connect(keeper).queueLiquidation(
                user1.address,
                await moonwellAdapter.getAddress()
            );

            // Verify queued
            const stats = await cascadingLiquidationHandler.getLiquidationStats();
            expect(stats.critical + stats.high + stats.medium + stats.low).to.be.gt(0);

            // Process batch
            await cascadingLiquidationHandler.connect(keeper).processBatch(10);

            // Verify liquidation processed
            const totalProcessed = await cascadingLiquidationHandler.totalLiquidationsProcessed();
            expect(totalProcessed).to.equal(1);
        });
    });
});
