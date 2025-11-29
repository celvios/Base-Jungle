import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Phase 5: Referral System Upgrade", function () {
    let referralManager, pointsTracker, positionNFT, activityVerifier;
    let owner, user1, user2, user3, user4, user5, user6;
    let users = [];

    beforeEach(async function () {
        [owner, user1, user2, user3, user4, user5, user6, ...users] = await ethers.getSigners();

        // Deploy ReferralManager first
        const ReferralManagerFactory = await ethers.getContractFactory("ReferralManager");
        referralManager = await ReferralManagerFactory.deploy();
        await referralManager.waitForDeployment();

        // Deploy ActivityVerifier
        const ActivityVerifierFactory = await ethers.getContractFactory("ActivityVerifier");
        activityVerifier = await ActivityVerifierFactory.deploy();
        await activityVerifier.waitForDeployment();

        // Deploy TreasuryManager (needed for PositionNFT)
        const TreasuryManagerFactory = await ethers.getContractFactory("TreasuryManager");
        const treasuryManager = await TreasuryManagerFactory.deploy();
        await treasuryManager.waitForDeployment();

        // Deploy PositionNFT with treasury and temporary points tracker address
        const MockPositionNFT = await ethers.getContractFactory("BaseJunglePositionNFT");
        positionNFT = await MockPositionNFT.deploy(
            await treasuryManager.getAddress(),
            ethers.ZeroAddress, // Temporary, will be updated
            { gasLimit: 10000000 }
        );
        await positionNFT.waitForDeployment();

        // Deploy PointsTracker
        const PointsTrackerFactory = await ethers.getContractFactory("PointsTracker");
        pointsTracker = await PointsTrackerFactory.deploy(
            await referralManager.getAddress(),
            await activityVerifier.getAddress(),
            await positionNFT.getAddress()
        );
        await pointsTracker.waitForDeployment();

        // Grant roles
        const UPDATER_ROLE = await pointsTracker.UPDATER_ROLE();
        await pointsTracker.grantRole(UPDATER_ROLE, owner.address);

        const ACTIVITY_TRACKER_ROLE = await referralManager.ACTIVITY_TRACKER_ROLE();
        await referralManager.grantRole(ACTIVITY_TRACKER_ROLE, owner.address);
    });

    describe("✅ Tier System", function () {
        it("Should start all users at Novice tier (0 active referrals)", async function () {
            const tier = await referralManager.getUserTier(user1.address);
            expect(tier).to.equal(0); // Tier.Novice
        });

        it("Should upgrade to Scout tier with 5 active referrals", async function () {
            // User1 registers code
            await referralManager.connect(user1).registerCode(ethers.id("USER1"));

            // Register 5 referrals
            for (let i = 0; i < 5; i++) {
                await referralManager.connect(users[i]).registerReferral(users[i].address, ethers.id("USER1"));
                // Mark them as active
                await referralManager.markActive(users[i].address);
            }

            const tier = await referralManager.getUserTier(user1.address);
            expect(tier).to.equal(1); // Tier.Scout
        });

        // Skipping Captain tier test due to Hardhat signer limits (requires 20 signers)
        it.skip("Should upgrade to Captain tier with 20 active referrals", async function () {
            // This test requires more signers than Hardhat provides by default
        });
    });

    describe("✅ Tier Multipliers & Leverage", function () {
        it("Should return correct multipliers for each tier", async function () {
            const noviceMultiplier = await referralManager.getTierMultiplier(0);
            const scoutMultiplier = await referralManager.getTierMultiplier(1);
            const captainMultiplier = await referralManager.getTierMultiplier(2);
            const whaleMultiplier = await referralManager.getTierMultiplier(3);

            expect(noviceMultiplier).to.equal(10000); // 1.0x
            expect(scoutMultiplier).to.equal(11000); // 1.1x
            expect(captainMultiplier).to.equal(12500); // 1.25x
            expect(whaleMultiplier).to.equal(15000); // 1.5x
        });

        it("Should return correct max leverage for each tier", async function () {
            const noviceLeverage = await referralManager.getMaxLeverage(0);
            const scoutLeverage = await referralManager.getMaxLeverage(1);
            const captainLeverage = await referralManager.getMaxLeverage(2);
            const whaleLeverage = await referralManager.getMaxLeverage(3);

            expect(noviceLeverage).to.equal(15000); // 1.5x
            expect(scoutLeverage).to.equal(20000); // 2.0x
            expect(captainLeverage).to.equal(30000); // 3.0x
            expect(whaleLeverage).to.equal(50000); // 5.0x
        });
    });

    describe("✅ Active Referral Tracking", function () {
        beforeEach(async function () {
            await referralManager.connect(user1).registerCode(ethers.id("USER1"));
            await referralManager.connect(user2).registerReferral(user2.address, ethers.id("USER1"));
        });

        it("Should not count referral as active until markActive is called", async function () {
            const activeRefs = await referralManager.referralInfo(user1.address);
            expect(activeRefs.activeDirectReferrals).to.equal(0);
        });

        it("Should increment activeDirectReferrals when markActive is called", async function () {
            await referralManager.markActive(user2.address);

            const activeRefs = await referralManager.referralInfo(user1.address);
            expect(activeRefs.activeDirectReferrals).to.equal(1);
        });

        it("Should emit UserActivated event", async function () {
            await expect(referralManager.markActive(user2.address))
                .to.emit(referralManager, "UserActivated")
                .withArgs(user2.address);
        });

        it("Should emit TierUpgraded event when referrer's tier changes", async function () {
            // Register 4 more referrals and activate them
            for (let i = 0; i < 4; i++) {
                await referralManager.connect(users[i]).registerReferral(users[i].address, ethers.id("USER1"));
                await referralManager.markActive(users[i].address);
            }

            // The 5th activation should trigger tier upgrade to Scout
            await expect(referralManager.markActive(user2.address))
                .to.emit(referralManager, "TierUpgraded")
                .withArgs(user1.address, 1); // Tier.Scout
        });
    });

    describe("✅ Activity Expiry", function () {
        beforeEach(async function () {
            await referralManager.connect(user1).registerCode(ethers.id("USER1"));
            await referralManager.connect(user2).registerReferral(user2.address, ethers.id("USER1"));
            await referralManager.markActive(user2.address);
        });

        it("Should NOT deactivate user before 30 days", async function () {
            // Advance time by 29 days
            await hre.network.provider.send("evm_increaseTime", [29 * 24 * 60 * 60]);
            await hre.network.provider.send("evm_mine");

            await referralManager.checkActivityExpiry(user2.address);

            const info = await referralManager.referralInfo(user2.address);
            expect(info.isActive).to.be.true;
        });

        it("Should deactivate user after 30 days of inactivity", async function () {
            // Advance time by 31 days
            await hre.network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
            await hre.network.provider.send("evm_mine");

            await referralManager.checkActivityExpiry(user2.address);

            const info = await referralManager.referralInfo(user2.address);
            expect(info.isActive).to.be.false;
        });

        it("Should decrement referrer's activeDirectReferrals on expiry", async function () {
            await hre.network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
            await hre.network.provider.send("evm_mine");

            await referralManager.checkActivityExpiry(user2.address);

            const referrerInfo = await referralManager.referralInfo(user1.address);
            expect(referrerInfo.activeDirectReferrals).to.equal(0);
        });

        it("Should refresh activity timestamp when markActive is called again", async function () {
            const before = await referralManager.referralInfo(user2.address);

            await hre.network.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
            await hre.network.provider.send("evm_mine");

            await referralManager.markActive(user2.address);

            const after = await referralManager.referralInfo(user2.address);
            expect(after.lastActivityTimestamp).to.be.gt(before.lastActivityTimestamp);
        });
    });

    describe("✅ Commission Distribution", function () {
        beforeEach(async function () {
            // Setup 3-level referral chain: user3 -> user2 -> user1
            await referralManager.connect(user1).registerCode(ethers.id("USER1"));
            await referralManager.connect(user2).registerCode(ethers.id("USER2"));

            await referralManager.connect(user2).registerReferral(user2.address, ethers.id("USER1"));
            await referralManager.connect(user3).registerReferral(user3.address, ethers.id("USER2"));
        });

        it("Should award 10% commission to direct referrer", async function () {
            // Award 1000 points to user3
            await pointsTracker.updatePoints(user3.address, 1000, "test");

            // User2 (direct referrer) should get 10% = 100 points
            const user2Points = await pointsTracker.userPoints(user2.address);
            expect(user2Points.totalPoints).to.equal(100);
        });

        it("Should award 5% commission to indirect referrer", async function () {
            // Award 1000 points to user3
            await pointsTracker.updatePoints(user3.address, 1000, "test");

            // User1 (indirect referrer) should get 5% = 50 points
            const user1Points = await pointsTracker.userPoints(user1.address);
            expect(user1Points.totalPoints).to.equal(50);
        });

        it("Should emit correct events for commissions", async function () {
            await expect(pointsTracker.updatePoints(user3.address, 1000, "test"))
                .to.emit(pointsTracker, "PointsUpdated")
                .withArgs(user3.address, 1000, "test")
                .and.to.emit(pointsTracker, "PointsUpdated")
                .withArgs(user2.address, 100, "referral_commission_l1")
                .and.to.emit(pointsTracker, "PointsUpdated")
                .withArgs(user1.address, 50, "referral_commission_l2");
        });

        it("Should work correctly with no referrer", async function () {
            // user4 has no referrer
            await pointsTracker.updatePoints(user4.address, 1000, "test");

            const user4Points = await pointsTracker.userPoints(user4.address);
            expect(user4Points.totalPoints).to.equal(1000);
        });

        it("Should work correctly with only direct referrer (no grandparent)", async function () {
            // user2 has only user1 as referrer (no grandparent)
            await pointsTracker.updatePoints(user2.address, 1000, "test");

            const user2Points = await pointsTracker.userPoints(user2.address);
            const user1Points = await pointsTracker.userPoints(user1.address);

            expect(user2Points.totalPoints).to.equal(1000);
            expect(user1Points.totalPoints).to.equal(100); // 10% commission
        });
    });

    describe("✅ getUserTierInfo Helper", function () {
        it("Should return comprehensive tier info", async function () {
            await referralManager.connect(user1).registerCode(ethers.id("USER1"));

            // Register 5 actives for Scout tier
            for (let i = 0; i < 5; i++) {
                await referralManager.connect(users[i]).registerReferral(users[i].address, ethers.id("USER1"));
                await referralManager.markActive(users[i].address);
            }

            const info = await referralManager.getUserTierInfo(user1.address);

            expect(info.tier).to.equal(1); // Scout
            expect(info.pointMultiplier).to.equal(11000); // 1.1x
            expect(info.maxLeverage).to.equal(20000); // 2.0x
            expect(info.activeReferrals).to.equal(5);
            expect(info.totalReferrals).to.equal(5);
        });
    });
});
