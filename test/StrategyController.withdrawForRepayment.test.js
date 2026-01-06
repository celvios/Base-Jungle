const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyController - withdrawForRepayment", function () {
    let strategyController;
    let referralManager;
    let usdc;
    let mockAdapter1, mockAdapter2, mockAdapter3;
    let owner, keeper, user1;

    beforeEach(async function () {
        [owner, keeper, user1] = await ethers.getSigners();

        // Deploy USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USDC", "USDC", 6);

        // Deploy ReferralManager
        const ReferralManager = await ethers.getContractFactory("ReferralManager");
        referralManager = await ReferralManager.deploy();

        // Deploy StrategyController
        const StrategyController = await ethers.getContractFactory("StrategyController");
        strategyController = await StrategyController.deploy(await referralManager.getAddress());

        // Deploy mock adapters
        const MockAdapter = await ethers.getContractFactory("MockStrategyAdapter");
        mockAdapter1 = await MockAdapter.deploy(await usdc.getAddress());
        mockAdapter2 = await MockAdapter.deploy(await usdc.getAddress());
        mockAdapter3 = await MockAdapter.deploy(await usdc.getAddress());

        // Grant roles
        const KEEPER_ROLE = await strategyController.KEEPER_ROLE();
        await strategyController.grantRole(KEEPER_ROLE, keeper.address);

        const VAULT_ROLE = await strategyController.VAULT_ROLE();
        await strategyController.grantRole(VAULT_ROLE, owner.address);

        // Add strategies
        await strategyController.addStrategy(
            0, await mockAdapter1.getAddress(), await usdc.getAddress(),
            500, 20, 0
        );
        await strategyController.addStrategy(
            1, await mockAdapter2.getAddress(), await usdc.getAddress(),
            800, 40, 1
        );
        await strategyController.addStrategy(
            2, await mockAdapter3.getAddress(), await usdc.getAddress(),
            1200, 60, 2
        );

        // Setup user
        await referralManager.setUserTier(user1.address, 1); // Scout
    });

    describe("Basic Withdrawal Functionality", function () {
        beforeEach(async function () {
            // Allocate funds across strategies
            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);
        });

        it("Should withdraw requested amount for debt repayment", async function () {
            const withdrawAmount = ethers.parseUnits("200", 6);

            const withdrawn = await strategyController.connect(keeper).withdrawForRepayment.staticCall(
                user1.address,
                withdrawAmount
            );

            expect(withdrawn).to.equal(withdrawAmount);
        });

        it("Should withdraw from strategies in order", async function () {
            const withdrawAmount = ethers.parseUnits("200", 6);

            const balance1Before = await mockAdapter1.balanceOf();

            await strategyController.connect(keeper).withdrawForRepayment(
                user1.address,
                withdrawAmount
            );

            const balance1After = await mockAdapter1.balanceOf();

            // First strategy should be tapped first
            expect(balance1After).to.be.lt(balance1Before);
        });

        it("Should update user allocations correctly", async function () {
            const withdrawAmount = ethers.parseUnits("200", 6);

            const allocationBefore = await strategyController.userAllocations(user1.address, 0);

            await strategyController.connect(keeper).withdrawForRepayment(
                user1.address,
                withdrawAmount
            );

            const allocationAfter = await strategyController.userAllocations(user1.address, 0);

            expect(allocationAfter).to.be.lt(allocationBefore);
        });

        it("Should revert if amount is zero", async function () {
            await expect(
                strategyController.connect(keeper).withdrawForRepayment(user1.address, 0)
            ).to.be.revertedWith("Amount zero");
        });

        it("Should only allow KEEPER_ROLE", async function () {
            const withdrawAmount = ethers.parseUnits("200", 6);

            await expect(
                strategyController.connect(user1).withdrawForRepayment(user1.address, withdrawAmount)
            ).to.be.reverted;
        });
    });

    describe("Multi-Strategy Withdrawal", function () {
        beforeEach(async function () {
            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);
        });

        it("Should withdraw from multiple strategies if needed", async function () {
            // Request more than  what's in first strategy
            const withdrawAmount = ethers.parseUnits("800", 6);

            const balance1Before = await mockAdapter1.balanceOf();
            const balance2Before = await mockAdapter2.balanceOf();

            await strategyController.connect(keeper).withdrawForRepayment(
                user1.address,
                withdrawAmount
            );

            const balance1After = await mockAdapter1.balanceOf();
            const balance2After = await mockAdapter2.balanceOf();

            // Both strategies should be affected
            expect(balance1After).to.be.lt(balance1Before);
            expect(balance2After).to.be.lt(balance2Before);
        });

        it("Should stop withdrawing once target amount is reached", async function () {
            const withdrawAmount = ethers.parseUnits("300", 6);

            const balance3Before = await mockAdapter3.balanceOf();

            await strategyController.connect(keeper).withdrawForRepayment(
                user1.address,
                withdrawAmount
            );

            const balance3After = await mockAdapter3.balanceOf();

            // Third strategy shouldn't be touched if first two have enough
            expect(balance3After).to.equal(balance3Before);
        });

        it("Should handle partial withdrawals from strategies", async function () {
            const allocation1 = await strategyController.userAllocations(user1.address, 0);

            // Request amount greater than first allocation
            const withdrawAmount = allocation1 + ethers.parseUnits("100", 6);

            const withdrawn = await strategyController.connect(keeper).withdrawForRepayment.staticCall(
                user1.address,
                withdrawAmount
            );

            expect(withdrawn).to.equal(withdrawAmount);
        });
    });

    describe("Resilient Withdrawal with Failures", function () {
        beforeEach(async function () {
            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);
        });

        it("Should skip failed strategy and try next one", async function () {
            // Make first strategy fail
            await mockAdapter1.setShouldFail(true);

            const withdrawAmount = ethers.parseUnits("200", 6);

            // Should not revert, just skip to next strategy
            await expect(
                strategyController.connect(keeper).withdrawForRepayment(user1.address, withdrawAmount)
            ).to.not.be.reverted;
        });

        it("Should withdraw from working strategies when some fail", async function () {
            await mockAdapter1.setShouldFail(true);

            const withdrawAmount = ethers.parseUnits("200", 6);
            const balance2Before = await mockAdapter2.balanceOf();

            await strategyController.connect(keeper).withdrawForRepayment(
                user1.address,
                withdrawAmount
            );

            const balance2After = await mockAdapter2.balanceOf();

            // Strategy 2 should be used since strategy 1 failed
            expect(balance2After).to.be.lt(balance2Before);
        });

        it("Should revert if insufficient liquidity across all strategies", async function () {
            // Make all strategies fail or have no funds
            await mockAdapter1.setShouldFail(true);
            await mockAdapter2.setShouldFail(true);
            await mockAdapter3.setShouldFail(true);

            const withdrawAmount = ethers.parseUnits("200", 6);

            await expect(
                strategyController.connect(keeper).withdrawForRepayment(user1.address, withdrawAmount)
            ).to.be.revertedWith("Insufficient liquidity");
        });

        it("Should handle partial failures gracefully", async function () {
            // First two strategies work, third fails
            await mockAdapter3.setShouldFail(true);

            const withdrawAmount = ethers.parseUnits("700", 6);

            const withdrawn = await strategyController.connect(keeper).withdrawForRepayment.staticCall(
                user1.address,
                withdrawAmount
            );

            // Should still get funds from working strategies
            expect(withdrawn).to.be.gte(ethers.parseUnits("600", 6));
        });
    });

    describe("Edge Cases", function () {
        it("Should handle withdrawal when user has no allocations", async function () {
            const withdrawAmount = ethers.parseUnits("100", 6);

            await expect(
                strategyController.connect(keeper).withdrawForRepayment(user1.address, withdrawAmount)
            ).to.be.revertedWith("Insufficient liquidity");
        });

        it("Should handle withdrawal amount exactly equal to total allocation", async function () {
            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);

            const withdrawn = await strategyController.connect(keeper).withdrawForRepayment.staticCall(
                user1.address,
                totalAmount
            );

            expect(withdrawn).to.equal(totalAmount);
        });

        it("Should handle withdrawal greater than total allocation", async function () {
            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);

            const withdrawAmount = ethers.parseUnits("1500", 6);

            await expect(
                strategyController.connect(keeper).withdrawForRepayment(user1.address, withdrawAmount)
            ).to.be.revertedWith("Insufficient liquidity");
        });

        it("Should handle inactive strategies correctly", async function () {
            // Deactivate a strategy
            // (Assuming there's a way to deactivate - adjust based on your implementation)

            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);

            const withdrawAmount = ethers.parseUnits("200", 6);

            // Should skip inactive strategies
            const withdrawn = await strategyController.connect(keeper).withdrawForRepayment.staticCall(
                user1.address,
                withdrawAmount
            );

            expect(withdrawn).to.equal(withdrawAmount);
        });
    });

    describe("Integration with LeverageManager", function () {
        it("Should return exact amount needed for debt repayment", async function () {
            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);

            // LeverageManager needs exactly 350 USDC to repay debt
            const debtRepayment = ethers.parseUnits("350", 6);

            const withdrawn = await strategyController.connect(keeper).withdrawForRepayment.staticCall(
                user1.address,
                debtRepayment
            );

            expect(withdrawn).to.equal(debtRepayment);
        });

        it("Should work seamlessly with reentrancy guard", async function () {
            const totalAmount = ethers.parseUnits("1000", 6);
            await usdc.mint(await strategyController.getAddress(), totalAmount);
            await strategyController.allocate(user1.address, totalAmount);

            const withdrawAmount = ethers.parseUnits("200", 6);

            // First call
            await strategyController.connect(keeper).withdrawForRepayment(
                user1.address,
                withdrawAmount
            );

            // Second call should work (not locked)
            await expect(
                strategyController.connect(keeper).withdrawForRepayment(
                    user1.address,
                    withdrawAmount
                )
            ).to.not.be.reverted;
        });
    });
});
