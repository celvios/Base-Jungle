import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Base Jungle Protocol - Session 2", function () {
    let BaseJunglePositionNFT, PointsTracker, TreasuryManager, ReferralManager, ActivityVerifier;
    let nft, tracker, treasury, referral, verifier;
    let owner, user1, user2, user3, treasuryWallet;
    let mockToken;

    const TIER_PRICES = {
        0: ethers.parseUnits("100", 6), // Sprout
        1: ethers.parseUnits("500", 6), // Sapling
    };

    beforeEach(async function () {
        [owner, user1, user2, user3, treasuryWallet] = await ethers.getSigners();

        // Deploy Mock Token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock USDC", "USDC");
        await mockToken.waitForDeployment();

        // Deploy ReferralManager
        const ReferralManagerFactory = await ethers.getContractFactory("ReferralManager");
        referral = await ReferralManagerFactory.deploy();
        await referral.waitForDeployment();

        // Deploy ActivityVerifier
        const ActivityVerifierFactory = await ethers.getContractFactory("ActivityVerifier");
        verifier = await ActivityVerifierFactory.deploy();
        await verifier.waitForDeployment();

        // Deploy TreasuryManager
        const TreasuryManagerFactory = await ethers.getContractFactory("TreasuryManager");
        treasury = await TreasuryManagerFactory.deploy();
        await treasury.waitForDeployment();

        // Deploy PositionNFT (needs tracker address, but tracker needs NFT address... circular dependency)
        // Solution: Deploy NFT with placeholder, then update? Or deploy Tracker with placeholder?
        // The NFT contract takes tracker in constructor. The Tracker takes NFT in constructor.
        // We need to deploy one, then the other, but we can't if both are immutable in constructor.
        // Looking at code:
        // NFT: constructor(treasury, pointsTracker)
        // Tracker: constructor(referral, verifier, positionNFT)

        // We can deploy NFT with address(0) for tracker first, then set it if there is a setter.
        // Checking NFT code... no setter for pointsTracker.
        // Checking Tracker code... no setter for positionNFT.
        // This is a circular dependency issue in the design.
        // FIX: We will deploy NFT with a placeholder address for tracker, then deploy Tracker with NFT address.
        // But NFT needs to call tracker? NFT calls tracker? No, NFT is just data store mostly.
        // Wait, NFT doesn't seem to call tracker in the code I wrote. It just stores the address.
        // Let's check BaseJunglePositionNFT.sol...
        // It has `address public pointsTracker;` but doesn't seem to call it in `mintPosition`.
        // So we can deploy NFT first with a dummy address, then deploy Tracker with NFT address.
        // Then if NFT needs to call tracker later, we might need a setter.
        // For now, let's deploy NFT with a dummy address.

        const BaseJunglePositionNFTFactory = await ethers.getContractFactory("BaseJunglePositionNFT");
        // Deploy with dummy tracker address first
        nft = await BaseJunglePositionNFTFactory.deploy(await treasury.getAddress(), owner.address);
        await nft.waitForDeployment();

        // Deploy PointsTracker
        const PointsTrackerFactory = await ethers.getContractFactory("PointsTracker");
        tracker = await PointsTrackerFactory.deploy(
            await referral.getAddress(),
            await verifier.getAddress(),
            await nft.getAddress()
        );
        await tracker.waitForDeployment();

        // Setup Roles & Config
        const MINTER_ROLE = await nft.MINTER_ROLE();
        await nft.grantRole(MINTER_ROLE, owner.address);

        await nft.updateTierConfig(0, TIER_PRICES[0], 100, 10, 7); // Sprout: 10 daily
        await nft.updateTierConfig(1, TIER_PRICES[1], 500, 50, 14); // Sapling: 50 daily

        // Mint tokens
        await mockToken.mint(user1.address, ethers.parseUnits("10000", 6));
        await mockToken.mint(user2.address, ethers.parseUnits("10000", 6));
        await mockToken.mint(user3.address, ethers.parseUnits("10000", 6));
    });

    describe("Referral System", function () {
        it("Should register referrals and calculate multipliers", async function () {
            // User1 refers User2
            const code1 = ethers.encodeBytes32String("USER1");
            await referral.connect(user1).registerCode(code1);

            await referral.connect(user2).registerReferral(user2.address, code1);

            // User1 should have 1 direct referral -> 2.5% multiplier (250 bps)
            expect(await referral.getMultiplier(user1.address)).to.equal(250);

            // User2 refers User3
            const code2 = ethers.encodeBytes32String("USER2");
            await referral.connect(user2).registerCode(code2);
            await referral.connect(user3).registerReferral(user3.address, code2);

            // User2: 1 direct (250 bps)
            expect(await referral.getMultiplier(user2.address)).to.equal(250);

            // User1: 1 direct (250) + 1 indirect (100) = 350 bps
            expect(await referral.getMultiplier(user1.address)).to.equal(350);
        });
    });

    describe("Daily Farming", function () {
        it("Should accumulate points with time and multipliers", async function () {
            // User1 mints Sprout (10 pts/day)
            await nft.mintPosition(user1.address, 0, await mockToken.getAddress(), TIER_PRICES[0]);
            const tokenId = 0;

            // Setup referral for User1 (User1 refers User2)
            const code1 = ethers.encodeBytes32String("USER1");
            await referral.connect(user1).registerCode(code1);
            await referral.connect(user2).registerReferral(user2.address, code1);
            // User1 multiplier = 2.5%

            // Fast forward 10 days
            await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            // Claim
            await tracker.connect(user1).claimDailyPoints(tokenId);

            // Expected: 10 days * 10 pts = 100 base
            // Bonus: 100 * 250 / 10000 = 2.5 -> 2 pts (integer math)
            // Total: 102 pts
            const points = await tracker.userPoints(user1.address);
            expect(points.totalPoints).to.equal(102);
        });
    });

    describe("Activity Verification", function () {
        it("Should verify valid signature and award points", async function () {
            const activityId = ethers.encodeBytes32String("ACT1");
            const activityType = ethers.encodeBytes32String("SWAP");
            const points = 50;

            const latestBlock = await ethers.provider.getBlock("latest");
            const deadline = latestBlock.timestamp + 3600;

            // Sign
            const chainId = (await ethers.provider.getNetwork()).chainId;
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "bytes32", "bytes32", "uint256", "uint256", "uint256", "address"],
                [user1.address, activityId, activityType, points, deadline, chainId, await verifier.getAddress()]
            );
            const signature = await owner.signMessage(ethers.getBytes(messageHash));

            await tracker.connect(user1).submitActivity(activityId, activityType, points, deadline, signature);

            const userPoints = await tracker.userPoints(user1.address);
            expect(userPoints.totalPoints).to.equal(50);
        });
    });
});
