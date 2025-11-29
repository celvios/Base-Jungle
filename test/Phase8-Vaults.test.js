import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Phase 8: Risk-Tiered Vaults", function () {
    let conservativeVault, aggressiveVault, feeCollector;
    let asset;
    let referralManager, pointsTracker, strategyController;
    let owner, user1, user2, captain, whale;
    let treasury, staking, buyback;

    beforeEach(async function () {
        [owner, user1, user2, captain, whale, treasury, staking, buyback] = await ethers.getSigners();

        // Deploy mock asset (USDC)
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        asset = await MockERC20.deploy("USDC", "USDC");
        await asset.waitForDeployment();

        // Mint tokens to users
        await asset.mint(user1.address, ethers.parseUnits("10000", 6));
        await asset.mint(user2.address, ethers.parseUnits("10000", 6));
        await asset.mint(captain.address, ethers.parseUnits("10000", 6));
        await asset.mint(whale.address, ethers.parseUnits("10000", 6));

        // Deploy Mocks
        const MockReferralManager = await ethers.getContractFactory("contracts/mocks/MockReferralManager.sol:MockReferralManager");
        referralManager = await MockReferralManager.deploy();
        await referralManager.waitForDeployment();

        // Mock PointsTracker (optional dependency)
        pointsTracker = ethers.ZeroAddress;

        const MockStrategyController = await ethers.getContractFactory("contracts/mocks/MockStrategyController.sol:MockStrategyController");
        strategyController = await MockStrategyController.deploy();
        await strategyController.waitForDeployment();

        // Deploy FeeCollector
        const FeeCollector = await ethers.getContractFactory("FeeCollector");
        feeCollector = await FeeCollector.deploy(
            treasury.address,
            staking.address,
            buyback.address
        );
        await feeCollector.waitForDeployment();

        // Deploy ConservativeVault
        const ConservativeVault = await ethers.getContractFactory("ConservativeVault");
        conservativeVault = await ConservativeVault.deploy(
            await asset.getAddress(),
            await referralManager.getAddress(),
            pointsTracker, // address(0)
            await strategyController.getAddress(),
            await feeCollector.getAddress()
        );
        await conservativeVault.waitForDeployment();

        // Deploy AggressiveVault
        const AggressiveVault = await ethers.getContractFactory("AggressiveVault");
        aggressiveVault = await AggressiveVault.deploy(
            await asset.getAddress(),
            await referralManager.getAddress(),
            pointsTracker, // address(0)
            await strategyController.getAddress(),
            await feeCollector.getAddress()
        );
        await aggressiveVault.waitForDeployment();

        // Setup Tiers
        // 0: Novice, 1: Scout, 2: Explorer, 3: Captain, 4: Whale
        await referralManager.setUserTier(user1.address, 0); // Novice
        await referralManager.setUserTier(captain.address, 3); // Captain
        await referralManager.setUserTier(whale.address, 4); // Whale
    });

    describe("✅ FeeCollector", function () {
        it("Should have correct initial split (60/30/10)", async function () {
            const [treasurySplit, stakingSplit, buybackSplit] = await feeCollector.getSplit();
            expect(treasurySplit).to.equal(6000); // 60%
            expect(stakingSplit).to.equal(3000);  // 30%
            expect(buybackSplit).to.equal(1000);  // 10%
        });

        it("Should distribute fees correctly", async function () {
            // Mint fees to collector
            await asset.mint(await feeCollector.getAddress(), ethers.parseUnits("1000", 6));

            // Distribute
            await feeCollector.distributeFees(await asset.getAddress());

            // Check balances
            expect(await asset.balanceOf(treasury.address)).to.equal(ethers.parseUnits("600", 6));
            expect(await asset.balanceOf(staking.address)).to.equal(ethers.parseUnits("300", 6));
            expect(await asset.balanceOf(buyback.address)).to.equal(ethers.parseUnits("100", 6));
        });
    });

    describe("✅ ConservativeVault", function () {
        it("Should allow deposits from Novice users", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await asset.connect(user1).approve(await conservativeVault.getAddress(), amount);

            await expect(conservativeVault.connect(user1).deposit(amount, user1.address))
                .to.emit(conservativeVault, "Deposited");

            expect(await conservativeVault.balanceOf(user1.address)).to.be.gt(0);
        });

        it("Should charge 0.1% deposit fee", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await asset.connect(user1).approve(await conservativeVault.getAddress(), amount);

            await conservativeVault.connect(user1).deposit(amount, user1.address);

            // Fee is 0.1% = 1 USDC
            // Assets in vault = 999 USDC
            // Shares = 999 (1:1 initially)

            // Check fee collector balance
            expect(await asset.balanceOf(await feeCollector.getAddress())).to.equal(ethers.parseUnits("1", 6));
        });

        it("Should enforce 7-day withdrawal lock (early withdrawal fee)", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await asset.connect(user1).approve(await conservativeVault.getAddress(), amount);
            await conservativeVault.connect(user1).deposit(amount, user1.address);

            // Try to withdraw immediately
            const shares = await conservativeVault.balanceOf(user1.address);

            // Should succeed but charge penalty
            // Penalty is 0.5% of assets
            // Assets = 999
            // Penalty = 999 * 0.005 = 4.995 USDC

            await conservativeVault.connect(user1).withdraw(ethers.parseUnits("999", 6), user1.address, user1.address);

            // Check fee collector has deposit fee (1) + penalty (~5)
            const feeBalance = await asset.balanceOf(await feeCollector.getAddress());
            expect(feeBalance).to.be.gt(ethers.parseUnits("5", 6));
        });
    });

    describe("✅ AggressiveVault (Tier-Gated)", function () {
        it("Should REJECT deposits from Novice users", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await asset.connect(user1).approve(await aggressiveVault.getAddress(), amount);

            await expect(
                aggressiveVault.connect(user1).deposit(amount, user1.address)
            ).to.be.revertedWith("Tier too low - need Captain (20+ refs)");
        });

        it("Should ALLOW deposits from Captain users", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await asset.connect(captain).approve(await aggressiveVault.getAddress(), amount);

            await expect(aggressiveVault.connect(captain).deposit(amount, captain.address))
                .to.emit(aggressiveVault, "Deposited");
        });

        it("Should charge 0% deposit fee for Captains", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await asset.connect(captain).approve(await aggressiveVault.getAddress(), amount);

            await aggressiveVault.connect(captain).deposit(amount, captain.address);

            // Fee should be 0
            expect(await asset.balanceOf(await feeCollector.getAddress())).to.equal(0);

            // Full amount in vault
            expect(await aggressiveVault.totalAssets()).to.equal(amount);
        });

        it("Should enforce 30-day withdrawal lock", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await asset.connect(captain).approve(await aggressiveVault.getAddress(), amount);
            await aggressiveVault.connect(captain).deposit(amount, captain.address);

            // Withdraw immediately -> 1% penalty
            await aggressiveVault.connect(captain).withdraw(amount, captain.address, captain.address);

            // Fee collector should have 1% = 10 USDC
            expect(await asset.balanceOf(await feeCollector.getAddress())).to.equal(ethers.parseUnits("10", 6));
        });
    });
});
