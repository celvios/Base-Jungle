import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("PointsTracker Redemption", function () {
    let pointsTracker;
    let owner, user1;
    let referralManager, activityVerifier, positionNFT;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy Mocks
        const MockReferralManager = await ethers.getContractFactory("MockReferralManager");
        referralManager = await MockReferralManager.deploy();

        const ActivityVerifier = await ethers.getContractFactory("ActivityVerifier");
        activityVerifier = await ActivityVerifier.deploy();

        const BaseJunglePositionNFT = await ethers.getContractFactory("BaseJunglePositionNFT");
        // Pass dummy addresses for treasury and pointsTracker to break circular dependency
        positionNFT = await BaseJunglePositionNFT.deploy(owner.address, owner.address);

        // Deploy PointsTracker
        const PointsTracker = await ethers.getContractFactory("PointsTracker");
        pointsTracker = await PointsTracker.deploy(
            await referralManager.getAddress(),
            await activityVerifier.getAddress(),
            await positionNFT.getAddress()
        );

        // Award points to user1
        await pointsTracker.updatePoints(user1.address, 1000, "test_award");
    });

    it("Should allow user to redeem points", async function () {
        // Check initial balance
        let userPoints = await pointsTracker.userPoints(user1.address);
        expect(userPoints.totalPoints).to.equal(1000);

        // Redeem 500 points
        await expect(pointsTracker.connect(user1).redeemPoints(500))
            .to.emit(pointsTracker, "PointsRedeemed")
            .withArgs(user1.address, 500);

        // Check final balance
        userPoints = await pointsTracker.userPoints(user1.address);
        expect(userPoints.totalPoints).to.equal(500);
    });

    it("Should revert if insufficient points", async function () {
        // Try to redeem 2000 points (balance 1000)
        await expect(pointsTracker.connect(user1).redeemPoints(2000))
            .to.be.revertedWith("Insufficient points");
    });
});
