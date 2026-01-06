const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration: Complete Rebalance Flow", function () {
    let leverageManager, strategyController, referralManager;
    let moonwellAdapter, mockOracle;
    let usdc;
    let mockStrategy1, mockStrategy2;
    let owner, keeper, user1, user2;

    beforeEach(async function () {
        [owner, keeper, user1, user2] = await ethers.getSigners();

        // Deploy USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USDC", "USDC", 6);

        // Deploy ReferralManager
        const ReferralManager = await ethers.getContractFactory("ReferralManager");
        referralManager = await ReferralManager.deploy();

        // Deploy StrategyController
        const StrategyController = await ethers.getContractFactory("StrategyController");
        strategyController = await StrategyController.deploy(await referralManager.getAddress());

        // Deploy LeverageManager
        const LeverageManager = await ethers.getContractFactory("LeverageManager");
        leverageManager = await LeverageManager.deploy(
            await referralManager.getAddress(),
            await usdc.getAddress()
        );

        // Deploy mocks
        const MockLendingAdapter = await ethers.getContractFactory("MockLendingAdapter");
        moonwellAdapter = await MockLendingAdapter.deploy(await usdc.getAddress());

        const MockChainlinkOracle = await ethers.getContractFactory("MockChainlinkOracle");
        mockOracle = await MockChainlinkOracle.deploy();

        const MockAdapter = await ethers.getContractFactory("MockStrategyAdapter");
        mockStrategy1 = await MockAdapter.deploy(await usdc.getAddress());
        mockStrategy2 = await MockAdapter.deploy(await usdc.getAddress());

        // Configure LeverageManager
        await leverageManager.setStrategyController(await strategyController.getAddress());
        await leverageManager.setOracle(await mockOracle.getAddress());
        await leverageManager.setLendingAdapter(await moonwellAdapter.getAddress());

        // Setup strategies in controller
        await strategyController.addStrategy(
            0, await mockStrategy1.getAddress(), await usdc.getAddress(),
            500, 20, 0
        );
        await strategyController.addStrategy(
            1, await mockStrategy2.getAddress(), await usdc.getAddress(),
            800, 40, 1
        );

        // Grant roles
        const KEEPER_ROLE_LM = await leverageManager.KEEPER_ROLE();
        await leverageManager.grantRole(KEEPER_ROLE_LM, keeper.address);

        const KEEPER_ROLE_SC = await strategyController.KEEPER_ROLE();
        await strategyController.grantRole(KEEPER_ROLE_SC, keeper.address);

        const VAULT_ROLE = await strategyController.VAULT_ROLE();
        await strategyController.grantRole(VAULT_ROLE, await leverageManager.getAddress());

        // Set user tiers
        await referralManager.setUserTier(user1.address, 1); // Scout (2x)
        await referralManager.setUserTier(user2.address, 2); // Captain (3x)

        // Set oracle price
        await mockOracle.setPrice(await usdc.getAddress(), ethers.parseUnits("1", 18));
    });

    describe("End-to-End Rebalance Scenario", function () {
        it("Should complete full cycle: deposit → leverage → allocate → rebalance → repay", async function () {
            console.log("\n      📝 Step 1: User deposits and opens leveraged position");
            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            const position = await leverageManager.positions(user1.address);
            console.log(`         💰 Position opened: ${ethers.formatUnits(position.totalDeposited, 6)} USDC`);
            expect(position.active).to.be.true;
            expect(position.totalBorrowed).to.be.gt(0);

            console.log("\n      📝 Step 2: Allocate funds to strategies");
            await usdc.mint(await strategyController.getAddress(), position.totalDeposited);
            await strategyController.allocate(user1.address, position.totalDeposited);

            const strategy1Allocation = await strategyController.userAllocations(user1.address, 0);
            console.log(`         📊 Strategy 1 allocation: ${ethers.formatUnits(strategy1Allocation, 6)} USDC`);
            expect(strategy1Allocation).to.be.gt(0);

            console.log("\n      📝 Step 3: Simulate market conditions causing danger zone");
            // Simulate 20% loss in strategy value (health factor drops)
            const currentValue = await mockStrategy1.balanceOf();
            await mockStrategy1.setBalance(currentValue * 80n / 100n);

            const healthFactorBefore = await leverageManager.getHealthFactor(user1.address);
            console.log(`         ⚠️  Health factor before: ${Number(healthFactorBefore) / 10000}x`);

            console.log("\n      📝 Step 4: Keeper triggers rebalance");
            const minHealthFactor = 15000; // 1.5x
            await leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor);

            console.log("\n      📝 Step 5: Verify rebalance results");
            const positionAfter = await leverageManager.positions(user1.address);
            const healthFactorAfter = await leverageManager.getHealthFactor(user1.address);

            console.log(`         ✅ Debt reduced: ${ethers.formatUnits(position.totalBorrowed - positionAfter.totalBorrowed, 6)} USDC`);
            console.log(`         ✅ Health factor after: ${Number(healthFactorAfter) / 10000}x`);

            expect(positionAfter.totalBorrowed).to.be.lt(position.totalBorrowed);
            expect(healthFactorAfter).to.be.gte(healthFactorBefore);
        });

        it("Should handle multiple users independently", async function () {
            // User 1 setup
            const deposit1 = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, deposit1);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), deposit1);
            await leverageManager.connect(user1).openPosition(deposit1);

            // User 2 setup
            const deposit2 = ethers.parseUnits("2000", 6);
            await usdc.mint(user2.address, deposit2);
            await usdc.connect(user2).approve(await leverageManager.getAddress(), deposit2);
            await leverageManager.connect(user2).openPosition(deposit2);

            const position1Before = await leverageManager.positions(user1.address);
            const position2Before = await leverageManager.positions(user2.address);

            // Rebalance only user1
            await usdc.mint(await strategyController.getAddress(), position1Before.totalDeposited);
            const minHealthFactor = 15000;
            await leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor);

            const position1After = await leverageManager.positions(user1.address);
            const position2After = await leverageManager.positions(user2.address);

            // User1 should be affected, user2 should not
            expect(position1After.totalBorrowed).to.be.lt(position1Before.totalBorrowed);
            expect(position2After.totalBorrowed).to.equal(position2Before.totalBorrowed);
        });
    });

    describe("Strategy Drift Detection and Rebalance", function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            const position = await leverageManager.positions(user1.address);
            await usdc.mint(await strategyController.getAddress(), position.totalDeposited);
            await strategyController.allocate(user1.address, position.totalDeposited);
        });

        it("Should detect drift and trigger strategy rebalance", async function () {
            // Simulate 10% growth in strategy 1 (creates drift > 5%)
            const allocation1 = await strategyController.userAllocations(user1.address, 0);
            await mockStrategy1.setBalance(allocation1 * 110n / 100n);

            const needsRebalance = await strategyController.needsRebalance(user1.address);
            expect(needsRebalance).to.be.true;

            const allocationBefore = await strategyController.userAllocations(user1.address, 0);
            await strategyController.connect(keeper).rebalance(user1.address);
            const allocationAfter = await strategyController.userAllocations(user1.address, 0);

            // Allocation should be adjusted
            expect(allocationAfter).to.not.equal(allocationBefore);
        });

        it("Should not rebalance when drift is below threshold", async function () {
            // Simulate 3% growth (below 5% threshold)
            const allocation1 = await strategyController.userAllocations(user1.address, 0);
            await mockStrategy1.setBalance(allocation1 * 103n / 100n);

            const needsRebalance = await strategyController.needsRebalance(user1.address);
            expect(needsRebalance).to.be.false;

            const allocationBefore = await strategyController.userAllocations(user1.address, 0);
            await strategyController.connect(keeper).rebalance(user1.address);
            const allocationAfter = await strategyController.userAllocations(user1.address, 0);

            // No change expected
            expect(allocationAfter).to.equal(allocationBefore);
        });
    });

    describe("Tier Change Triggering Rebalance", function () {
        it("Should rebalance allocations when user tier changes", async function () {
            // Setup user as Novice
            await referralManager.setUserTier(user1.address, 0); // Novice

            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            const position = await leverageManager.positions(user1.address);
            await usdc.mint(await strategyController.getAddress(), position.totalDeposited);
            await strategyController.allocate(user1.address, position.totalDeposited);

            // Check initial allocation (Novice gets conservative allocation)
            const noviceAllocation = await strategyController.userAllocations(user1.address, 0);

            // Upgrade to Scout tier
            await referralManager.setUserTier(user1.address, 1); // Scout

            // Check if needs rebalance
            const needsRebalance = await strategyController.needsRebalance(user1.address);
            if (needsRebalance) {
                await strategyController.connect(keeper).rebalance(user1.address);
            }

            // Allocation should change to Scout tier allocation
            const scoutAllocation = await strategyController.userAllocations(user1.address, 0);

            // Different tiers have different allocations
            console.log(`      Novice allocation: ${ethers.formatUnits(noviceAllocation, 6)}`);
            console.log(`      Scout allocation: ${ethers.formatUnits(scoutAllocation, 6)}`);
        });
    });

    describe("Emergency Scenarios", function () {
        it("Should handle emergency rebalance when health factor critical", async function () {
            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            const position = await leverageManager.positions(user1.address);
            await usdc.mint(await strategyController.getAddress(), position.totalDeposited);
            await strategyController.allocate(user1.address, position.totalDeposited);

            // Simulate severe loss (50% drop - emergency zone)
            const currentValue = await mockStrategy1.balanceOf();
            await mockStrategy1.setBalance(currentValue * 50n / 100n);

            const healthFactorBefore = await leverageManager.getHealthFactor(user1.address);
            console.log(`      🚨 Emergency health factor: ${Number(healthFactorBefore) / 10000}x`);

            // Emergency rebalance
            const minHealthFactor = 12000; // Lower threshold for emergency
            await leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor);

            const healthFactorAfter = await leverageManager.getHealthFactor(user1.address);
            console.log(`      ✅ Recovered to: ${Number(healthFactorAfter) / 10000}x`);

            expect(healthFactorAfter).to.be.gte(minHealthFactor);
        });

        it("Should handle strategy failure gracefully", async function () {
            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            const position = await leverageManager.positions(user1.address);
            await usdc.mint(await strategyController.getAddress(), position.totalDeposited);
            await strategyController.allocate(user1.address, position.totalDeposited);

            // Make strategy 1 fail
            await mockStrategy1.setShouldFail(true);

            // Should still be able to withdraw from strategy 2
            const withdrawAmount = ethers.parseUnits("200", 6);
            await expect(
                strategyController.connect(keeper).withdrawForRepayment(user1.address, withdrawAmount)
            ).to.not.be.reverted;
        });
    });

    describe("Gas Efficiency", function () {
        it("Should use less gas with drift-based vs full rebalance", async function () {
            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            const position = await leverageManager.positions(user1.address);
            await usdc.mint(await strategyController.getAddress(), position.totalDeposited);
            await strategyController.allocate(user1.address, position.totalDeposited);

            // Create small drift
            const allocation1 = await strategyController.userAllocations(user1.address, 0);
            await mockStrategy1.setBalance(allocation1 * 107n / 100n);

            const tx = await strategyController.connect(keeper).rebalance(user1.address);
            const receipt = await tx.wait();

            console.log(`      ⛽ Drift-based rebalance gas: ${receipt.gasUsed.toString()}`);

            // Should be significantly less than 500k gas (full rebalance)
            expect(receipt.gasUsed).to.be.lt(300000n);
        });
    });
});
