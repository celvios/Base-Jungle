import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Base Jungle Vaults - Session 3", function () {
    let vault, strategy, tracker, token;
    let owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy Mock Token (USDC)
        const MockTokenFactory = await ethers.getContractFactory("MockERC20");
        token = await MockTokenFactory.deploy("Mock USDC", "USDC");
        await token.waitForDeployment();

        // Deploy PointsTracker
        const PointsTrackerFactory = await ethers.getContractFactory("PointsTracker");
        tracker = await PointsTrackerFactory.deploy(owner.address, owner.address, owner.address);
        await tracker.waitForDeployment();

        // Deploy MockStrategy
        const MockStrategyFactory = await ethers.getContractFactory("MockStrategy");
        strategy = await MockStrategyFactory.deploy(await token.getAddress());
        await strategy.waitForDeployment();

        // Deploy YieldVault
        const YieldVaultFactory = await ethers.getContractFactory("YieldVault");
        vault = await YieldVaultFactory.deploy(
            await token.getAddress(),
            "Jungle Vault",
            "jUSDC",
            await tracker.getAddress(),
            await strategy.getAddress()
        );
        await vault.waitForDeployment();

        // Setup Roles
        const UPDATER_ROLE = await tracker.UPDATER_ROLE();
        await tracker.grantRole(UPDATER_ROLE, await vault.getAddress());

        // Mint tokens to users
        await token.mint(user1.address, ethers.parseUnits("10000", 6));
        await token.mint(user2.address, ethers.parseUnits("10000", 6));
    });

    describe("Deposits", function () {
        it("Should accept valid deposit and mint shares", async function () {
            const depositAmount = ethers.parseUnits("1000", 6);

            await token.connect(user1).approve(await vault.getAddress(), depositAmount);
            await vault.connect(user1).deposit(depositAmount, user1.address);

            expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
            expect(await vault.totalAssets()).to.equal(depositAmount);
        });

        it("Should award points on deposit", async function () {
            const depositAmount = ethers.parseUnits("100", 6); // $100
            await token.connect(user1).approve(await vault.getAddress(), depositAmount);

            await expect(vault.connect(user1).deposit(depositAmount, user1.address))
                .to.emit(tracker, "PointsUpdated")
                .withArgs(user1.address, 50, "yield_deposit"); // 50 points for $100
        });
    });

    describe("Withdrawals", function () {
        it("Should process withdrawal", async function () {
            const depositAmount = ethers.parseUnits("1000", 6);
            await token.connect(user1).approve(await vault.getAddress(), depositAmount);
            await vault.connect(user1).deposit(depositAmount, user1.address);

            // Withdraw
            await vault.connect(user1).withdraw(depositAmount, user1.address, user1.address);

            expect(await token.balanceOf(user1.address)).to.equal(ethers.parseUnits("10000", 6)); // Back to initial
            expect(await vault.balanceOf(user1.address)).to.equal(0);
        });
    });

    describe("Emergency", function () {
        it("Should allow emergency withdrawal", async function () {
            const depositAmount = ethers.parseUnits("1000", 6);
            await token.connect(user1).approve(await vault.getAddress(), depositAmount);
            await vault.connect(user1).deposit(depositAmount, user1.address);

            // Emergency withdraw
            await vault.connect(user1).emergencyWithdraw(depositAmount);

            expect(await token.balanceOf(user1.address)).to.equal(ethers.parseUnits("10000", 6));
        });
    });
});
