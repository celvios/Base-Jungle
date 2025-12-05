import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Security Fixes Tests", function () {
    let yieldVault, pointsTracker, referralManager, treasuryManager;
    let owner, user1, user2, user3, attacker, approver1, approver2, approver3;
    let mockUSDC, mockStrategy;

    beforeEach(async function () {
        [owner, user1, user2, user3, attacker, approver1, approver2, approver3] = await ethers.getSigners();

        // Deploy mock USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockUSDC = await MockERC20.deploy("USDC", "USDC");
        await mockUSDC.waitForDeployment();

        // Mint tokens
        await mockUSDC.mint(user1.address, ethers.parseUnits("100000", 6));
        await mockUSDC.mint(user2.address, ethers.parseUnits("100000", 6));
        await mockUSDC.mint(attacker.address, ethers.parseUnits("100000", 6));

        // Deploy ReferralManager
        const ReferralManager = await ethers.getContractFactory("ReferralManager");
        referralManager = await ReferralManager.deploy();
        await referralManager.waitForDeployment();

        // Deploy ActivityVerifier
        const ActivityVerifier = await ethers.getContractFactory("ActivityVerifier");
        const activityVerifier = await ActivityVerifier.deploy();
        await activityVerifier.waitForDeployment();

        // Deploy BaseJunglePositionNFT
        const BaseJunglePositionNFT = await ethers.getContractFactory("BaseJunglePositionNFT");
        const positionNFT = await BaseJunglePositionNFT.deploy(owner.address, owner.address);
        await positionNFT.waitForDeployment();

        // Deploy PointsTracker
        const PointsTracker = await ethers.getContractFactory("PointsTracker");
        pointsTracker = await PointsTracker.deploy(
            await referralManager.getAddress(),
            await activityVerifier.getAddress(),
            await positionNFT.getAddress()
        );
        await pointsTracker.waitForDeployment();

        // Deploy mock strategy
        const MockStrategy = await ethers.getContractFactory("MockStrategy");
        mockStrategy = await MockStrategy.deploy(await mockUSDC.getAddress());
        await mockStrategy.waitForDeployment();

        // Fund mock strategy
        await mockUSDC.mint(await mockStrategy.getAddress(), ethers.parseUnits("1000000", 6));

        // Deploy YieldVault
        const YieldVault = await ethers.getContractFactory("YieldVault");
        yieldVault = await YieldVault.deploy(
            await mockUSDC.getAddress(),
            "Base Jungle Yield Vault",
            "bjYV",
            await pointsTracker.getAddress(),
            await mockStrategy.getAddress()
        );
        await yieldVault.waitForDeployment();

        // Deploy TreasuryManager
        const TreasuryManager = await ethers.getContractFactory("TreasuryManager");
        treasuryManager = await TreasuryManager.deploy();
        await treasuryManager.waitForDeployment();

        // Setup treasury approvers
        const WITHDRAWAL_APPROVER_ROLE = await treasuryManager.WITHDRAWAL_APPROVER_ROLE();
        await treasuryManager.grantRole(WITHDRAWAL_APPROVER_ROLE, approver1.address);
        await treasuryManager.grantRole(WITHDRAWAL_APPROVER_ROLE, approver2.address);
        await treasuryManager.grantRole(WITHDRAWAL_APPROVER_ROLE, approver3.address);
    });

    // ========================================
    // H-1: Slippage Protection on Rebalance
    // ========================================
    describe("✅ H-1: Slippage Protection on Rebalance", function () {
        it("Should revert if slippage exceeds minReceived", async function () {
            const STRATEGY_CONTROLLER_ROLE = await yieldVault.STRATEGY_CONTROLLER_ROLE();
            await yieldVault.grantRole(STRATEGY_CONTROLLER_ROLE, owner.address);

            // Deploy new strategy
            const MockStrategy = await ethers.getContractFactory("MockStrategy");
            const newStrategy = await MockStrategy.deploy(await mockUSDC.getAddress());
            await newStrategy.waitForDeployment();

            // Deposit to vault first
            const depositAmount = ethers.parseUnits("10000", 6);
            await mockUSDC.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
            await yieldVault.connect(user1).deposit(depositAmount, user1.address);

            // Try to rebalance with unrealistic minReceived
            const rebalanceAmount = ethers.parseUnits("5000", 6);
            const minReceived = ethers.parseUnits("6000", 6); // Expecting more than we're withdrawing

            await expect(
                yieldVault.rebalance(await newStrategy.getAddress(), rebalanceAmount, minReceived)
            ).to.be.revertedWith("Excessive slippage");
        });

        it("Should succeed with reasonable slippage tolerance", async function () {
            const STRATEGY_CONTROLLER_ROLE = await yieldVault.STRATEGY_CONTROLLER_ROLE();
            await yieldVault.grantRole(STRATEGY_CONTROLLER_ROLE, owner.address);

            const MockStrategy = await ethers.getContractFactory("MockStrategy");
            const newStrategy = await MockStrategy.deploy(await mockUSDC.getAddress());
            await newStrategy.waitForDeployment();

            // Deposit to vault
            const depositAmount = ethers.parseUnits("10000", 6);
            await mockUSDC.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
            await yieldVault.connect(user1).deposit(depositAmount, user1.address);

            // Rebalance with 1% slippage tolerance
            const rebalanceAmount = ethers.parseUnits("5000", 6);
            const minReceived = ethers.parseUnits("4950", 6); // 1% slippage

            await expect(
                yieldVault.rebalance(await newStrategy.getAddress(), rebalanceAmount, minReceived)
            ).to.emit(yieldVault, "Rebalanced");
        });
    });

    // ========================================
    // H-2: Early Withdrawal Penalty Enforcement
    // ========================================
    describe("✅ H-2: Early Withdrawal Penalty Enforcement", function () {
        it("Should apply 10% penalty for withdrawal before 30 days", async function () {
            const depositAmount = ethers.parseUnits("10000", 6);
            await mockUSDC.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
            await yieldVault.connect(user1).deposit(depositAmount, user1.address);

            // Get user's shares balance
            const shares = await yieldVault.balanceOf(user1.address);

            const balanceBefore = await mockUSDC.balanceOf(user1.address);

            // Emergency withdraw immediately (before 30 days)
            await expect(
                yieldVault.connect(user1).emergencyWithdraw(shares)
            ).to.emit(yieldVault, "EarlyWithdrawalPenalty");

            const balanceAfter = await mockUSDC.balanceOf(user1.address);
            const received = balanceAfter - balanceBefore;

            // Should receive 90% (10% penalty)
            const expected = depositAmount * 9n / 10n;
            expect(received).to.be.closeTo(expected, ethers.parseUnits("10", 6));
        });

        it("Should not apply penalty after 30 days", async function () {
            const depositAmount = ethers.parseUnits("10000", 6);
            await mockUSDC.connect(user1).approve(await yieldVault.getAddress(), depositAmount);
            await yieldVault.connect(user1).deposit(depositAmount, user1.address);

            // Get user's shares balance
            const shares = await yieldVault.balanceOf(user1.address);

            // Fast forward 31 days
            await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            const balanceBefore = await mockUSDC.balanceOf(user1.address);

            // Emergency withdraw after 30 days
            await yieldVault.connect(user1).emergencyWithdraw(shares);

            const balanceAfter = await mockUSDC.balanceOf(user1.address);
            const received = balanceAfter - balanceBefore;

            // Should receive full amount (no penalty)
            expect(received).to.be.closeTo(depositAmount, ethers.parseUnits("10", 6));
        });
    });

    // ========================================
    // M-1: First Depositor Attack Prevention
    // ========================================
    describe("✅ M-1: First Depositor Attack Prevention", function () {
        it("Should prevent donation attack with virtual shares", async function () {
            // Attacker deposits minimum amount (100 USDC)
            const minDeposit = ethers.parseUnits("100", 6);
            await mockUSDC.connect(attacker).approve(await yieldVault.getAddress(), minDeposit);
            await yieldVault.connect(attacker).deposit(minDeposit, attacker.address);

            // Attacker donates remaining balance to strategy (simulating donation attack)
            // Attacker has 100K USDC, already deposited 100, so 99,900 remaining
            const donationAmount = ethers.parseUnits("99900", 6);
            await mockUSDC.connect(attacker).transfer(await mockStrategy.getAddress(), donationAmount);

            // Victim deposits 1000 USDC
            const victimDeposit = ethers.parseUnits("1000", 6);
            await mockUSDC.connect(user1).approve(await yieldVault.getAddress(), victimDeposit);
            await yieldVault.connect(user1).deposit(victimDeposit, user1.address);

            // Get victim's shares
            const victimShares = await yieldVault.balanceOf(user1.address);

            // Victim should get proportional shares (not 0 due to virtual shares)
            expect(victimShares).to.be.gt(0);
            console.log("Victim shares:", victimShares.toString());
        });
    });

    // ========================================
    // M-4: Enhanced Circular Referral Detection
    // ========================================
    describe("✅ M-4: Enhanced Circular Referral Detection", function () {
        it("Should prevent direct circular referral (A→B→A)", async function () {
            // User1 registers code
            await referralManager.connect(user1).registerCode(ethers.id("USER1"));

            // User2 registers with User1 as referrer
            await referralManager.connect(user2).registerCode(ethers.id("USER2"));
            await referralManager.registerReferral(user2.address, ethers.id("USER1"));

            // User1 tries to register with User2 as referrer (circular)
            await expect(
                referralManager.registerReferral(user1.address, ethers.id("USER2"))
            ).to.be.revertedWith("Circular referral detected");
        });

        it("Should prevent complex circular chain (A→B→C→A)", async function () {
            // Setup chain: User1 → User2 → User3
            await referralManager.connect(user1).registerCode(ethers.id("USER1"));
            await referralManager.connect(user2).registerCode(ethers.id("USER2"));
            await referralManager.connect(user3).registerCode(ethers.id("USER3"));

            await referralManager.registerReferral(user2.address, ethers.id("USER1"));
            await referralManager.registerReferral(user3.address, ethers.id("USER2"));

            // User1 tries to register with User3 (would create A→B→C→A)
            await expect(
                referralManager.registerReferral(user1.address, ethers.id("USER3"))
            ).to.be.revertedWith("Circular referral detected");
        });

        it("Should allow valid deep referral chains", async function () {
            const signers = await ethers.getSigners();

            // Create chain of 9 users (within 10 level limit)
            for (let i = 0; i < 9; i++) {
                await referralManager.connect(signers[i]).registerCode(ethers.id(`USER${i}`));
            }

            // Register chain: 0→1→2→3→4→5→6→7→8
            for (let i = 1; i < 9; i++) {
                await referralManager.registerReferral(signers[i].address, ethers.id(`USER${i - 1}`));
            }

            // Verify last user has correct referrer
            const info = await referralManager.referralInfo(signers[8].address);
            expect(info.referrer).to.equal(signers[7].address);
        });
    });

    // ========================================
    // M-5: Treasury Withdrawal Cancellation
    // ========================================
    describe("✅ M-5: Treasury Withdrawal Cancellation", function () {
        beforeEach(async function () {
            // Fund treasury
            const TREASURER_ROLE = await treasuryManager.TREASURER_ROLE();
            await treasuryManager.grantRole(TREASURER_ROLE, owner.address);

            const fundAmount = ethers.parseUnits("100000", 6);
            await mockUSDC.mint(owner.address, fundAmount);
            await mockUSDC.approve(await treasuryManager.getAddress(), fundAmount);
            await treasuryManager.receiveFunds(await mockUSDC.getAddress(), fundAmount, "Initial funding");
        });

        it("Should allow cancellation of withdrawal request", async function () {
            // Create withdrawal request
            const requestId = await treasuryManager.requestWithdrawal(
                await mockUSDC.getAddress(),
                user1.address,
                ethers.parseUnits("10000", 6),
                "dev",
                "Test withdrawal"
            );

            // Cancel the request
            await expect(
                treasuryManager.connect(approver1).cancelWithdrawal(0)
            ).to.emit(treasuryManager, "WithdrawalCancelled");

            // Verify it's cancelled
            expect(await treasuryManager.cancelledRequests(0)).to.be.true;
        });

        it("Should prevent execution of cancelled request", async function () {
            // Create and approve withdrawal
            await treasuryManager.requestWithdrawal(
                await mockUSDC.getAddress(),
                user1.address,
                ethers.parseUnits("10000", 6),
                "dev",
                "Test withdrawal"
            );

            await treasuryManager.connect(approver1).approveWithdrawal(0);
            await treasuryManager.connect(approver2).approveWithdrawal(0);
            await treasuryManager.connect(approver3).approveWithdrawal(0);

            // Cancel the request
            await treasuryManager.connect(approver1).cancelWithdrawal(0);

            // Fast forward past timelock
            await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            // Try to execute - should fail
            await expect(
                treasuryManager.executeWithdrawal(0)
            ).to.be.revertedWith("Request cancelled");
        });

        it("Should prevent approval of cancelled request", async function () {
            // Create withdrawal
            await treasuryManager.requestWithdrawal(
                await mockUSDC.getAddress(),
                user1.address,
                ethers.parseUnits("10000", 6),
                "dev",
                "Test withdrawal"
            );

            // Cancel it
            await treasuryManager.connect(approver1).cancelWithdrawal(0);

            // Try to approve - should fail
            await expect(
                treasuryManager.connect(approver2).approveWithdrawal(0)
            ).to.be.revertedWith("Request cancelled");
        });
    });
});
