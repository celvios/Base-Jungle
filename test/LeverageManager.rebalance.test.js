const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LeverageManager - Rebalance Function", function () {
    let leverageManager;
    let strategyController;
    let referralManager;
    let mockOracle;
    let mockLendingAdapter;
    let usdc;
    let owner, keeper, user1;

    beforeEach(async function () {
        [owner, keeper, user1] = await ethers.getSigners();

        // Deploy mock USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USDC", "USDC", 6);

        // Deploy ReferralManager
        const ReferralManager = await ethers.getContractFactory("ReferralManager");
        referralManager = await ReferralManager.deploy();

        // Deploy LeverageManager
        const LeverageManager = await ethers.getContractFactory("LeverageManager");
        leverageManager = await LeverageManager.deploy(
            await referralManager.getAddress(),
            await usdc.getAddress()
        );

        // Deploy mock StrategyController
        const MockStrategyController = await ethers.getContractFactory("MockStrategyController");
        strategyController = await MockStrategyController.deploy(await usdc.getAddress());

        // Deploy mock oracle
        const MockChainlinkOracle = await ethers.getContractFactory("MockChainlinkOracle");
        mockOracle = await MockChainlinkOracle.deploy();

        // Deploy mock lending adapter
        const MockLendingAdapter = await ethers.getContractFactory("MockLendingAdapter");
        mockLendingAdapter = await MockLendingAdapter.deploy(await usdc.getAddress());

        // Configure LeverageManager
        await leverageManager.setStrategyController(await strategyController.getAddress());
        await leverageManager.setOracle(await mockOracle.getAddress());
        await leverageManager.setLendingAdapter(await mockLendingAdapter.getAddress());

        // Grant KEEPER_ROLE
        const KEEPER_ROLE = await leverageManager.KEEPER_ROLE();
        await leverageManager.grantRole(KEEPER_ROLE, keeper.address);

        // Setup user tier (Scout = 2x leverage)
        await referralManager.setUserTier(user1.address, 1); // Scout tier
    });

    describe("Rebalance with Actual Fund Movement", function () {
        beforeEach(async function () {
            // User opens position
            const depositAmount = ethers.parseUnits("1000", 6); // 1000 USDC
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            // Simulate funds in strategy
            await usdc.mint(await strategyController.getAddress(), depositAmount);
        });

        it("Should withdraw funds from StrategyController", async function () {
            const strategyBalanceBefore = await usdc.balanceOf(await strategyController.getAddress());

            // Trigger rebalance with minHealthFactor
            const minHealthFactor = 15000; // 1.5x
            await leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor);

            const strategyBalanceAfter = await usdc.balanceOf(await strategyController.getAddress());

            // Strategy should have less funds after withdrawal
            expect(strategyBalanceAfter).to.be.lt(strategyBalanceBefore);
        });

        it("Should repay debt to lending adapter", async function () {
            const position = await leverageManager.positions(user1.address);
            const initialBorrowed = position.totalBorrowed;

            const minHealthFactor = 15000;
            await leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor);

            const positionAfter = await leverageManager.positions(user1.address);

            // Debt should be reduced
            expect(positionAfter.totalBorrowed).to.be.lt(initialBorrowed);
        });

        it("Should update position state correctly", async function () {
            const positionBefore = await leverageManager.positions(user1.address);

            const minHealthFactor = 15000;
            await leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor);

            const positionAfter = await leverageManager.positions(user1.address);

            // Verify state updates
            expect(positionAfter.totalBorrowed).to.be.lt(positionBefore.totalBorrowed);
            expect(positionAfter.totalDeposited).to.be.lt(positionBefore.totalDeposited);
            expect(positionAfter.currentLeverage).to.be.lte(positionBefore.currentLeverage);
        });

        it("Should emit PositionRebalanced event", async function () {
            const minHealthFactor = 15000;

            await expect(
                leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor)
            ).to.emit(leverageManager, "PositionRebalanced");
        });

        it("Should revert if health factor below minHealthFactor (slippage protection)", async function () {
            // Set unrealistic minHealthFactor
            const minHealthFactor = 50000; // 5.0x - impossible to achieve

            await expect(
                leverageManager.connect(keeper).rebalance(user1.address, minHealthFactor)
            ).to.be.revertedWith("Slippage: HF too low");
        });

        it("Should revert if StrategyController not set", async function () {
            // Deploy new LeverageManager without controller
            const LeverageManager = await ethers.getContractFactory("LeverageManager");
            const newLM = await LeverageManager.deploy(
                await referralManager.getAddress(),
                await usdc.getAddress()
            );

            const KEEPER_ROLE = await newLM.KEEPER_ROLE();
            await newLM.grantRole(KEEPER_ROLE, keeper.address);

            await expect(
                newLM.connect(keeper).rebalance(user1.address, 15000)
            ).to.be.revertedWith("Controller not set");
        });

        it("Should revert if LendingAdapter not set", async function () {
            // Create new instance without adapter
            const LeverageManager = await ethers.getContractFactory("LeverageManager");
            const newLM = await LeverageManager.deploy(
                await referralManager.getAddress(),
                await usdc.getAddress()
            );

            await newLM.setStrategyController(await strategyController.getAddress());

            const KEEPER_ROLE = await newLM.KEEPER_ROLE();
            await newLM.grantRole(KEEPER_ROLE, keeper.address);

            await expect(
                newLM.connect(keeper).rebalance(user1.address, 15000)
            ).to.be.revertedWith("Adapter not set");
        });

        it("Should only allow KEEPER_ROLE to rebalance", async function () {
            await expect(
                leverageManager.connect(user1).rebalance(user1.address, 15000)
            ).to.be.reverted; // AccessControl revert
        });
    });

    describe("Oracle-Based Health Factor", function () {
        it("Should use oracle when available", async function () {
            // Set oracle price
            await mockOracle.setPrice(await usdc.getAddress(), ethers.parseUnits("1", 18));

            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await leverageManager.getAddress(), depositAmount);
            await leverageManager.connect(user1).openPosition(depositAmount);

            // Mock strategy value
            await strategyController.setUserValue(user1.address, depositAmount * 2n);

            const healthFactor = await leverageManager.getHealthFactor(user1.address);

            // Should reflect oracle-based calculation
            expect(healthFactor).to.be.gt(0);
        });

        it("Should fallback to simple calculation if oracle not set", async function () {
            // Create LeverageManager without oracle
            const LeverageManager = await ethers.getContractFactory("LeverageManager");
            const newLM = await LeverageManager.deploy(
                await referralManager.getAddress(),
                await usdc.getAddress()
            );

            await newLM.setStrategyController(await strategyController.getAddress());

            const depositAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(user1.address, depositAmount);
            await usdc.connect(user1).approve(await newLM.getAddress(), depositAmount);

            // Should still work without oracle
            await referralManager.setUserTier(user1.address, 1);
            await newLM.connect(user1).openPosition(depositAmount);

            const healthFactor = await newLM.getHealthFactor(user1.address);
            expect(healthFactor).to.be.gt(0);
        });
    });

    describe("Admin Configuration Functions", function () {
        it("Should allow admin to set StrategyController", async function () {
            const newController = ethers.Wallet.createRandom().address;

            await expect(
                leverageManager.setStrategyController(newController)
            ).to.emit(leverageManager, "StrategyControllerUpdated")
                .withArgs(newController);
        });

        it("Should allow admin to set Oracle", async function () {
            const newOracle = ethers.Wallet.createRandom().address;

            await expect(
                leverageManager.setOracle(newOracle)
            ).to.emit(leverageManager, "OracleUpdated")
                .withArgs(newOracle);
        });

        it("Should allow admin to set LendingAdapter", async function () {
            const newAdapter = ethers.Wallet.createRandom().address;

            await expect(
                leverageManager.setLendingAdapter(newAdapter)
            ).to.emit(leverageManager, "LendingAdapterUpdated")
                .withArgs(newAdapter);
        });

        it("Should revert if non-admin tries to set controller", async function () {
            const newController = ethers.Wallet.createRandom().address;

            await expect(
                leverageManager.connect(user1).setStrategyController(newController)
            ).to.be.reverted;
        });

        it("Should revert for zero address", async function () {
            await expect(
                leverageManager.setStrategyController(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid controller");
        });
    });
});
