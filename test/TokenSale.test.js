import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("TokenSale", function () {
    let tokenSale, usdc, jungleToken;
    let owner, user1, user2;
    let startTime, endTime;

    const PRICE = ethers.parseUnits("0.1", 6); // 0.1 USDC
    const SOFT_CAP = ethers.parseUnits("100000", 6); // 100k USDC
    const HARD_CAP = ethers.parseUnits("500000", 6); // 500k USDC

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy Mocks
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USDC", "USDC");
        jungleToken = await MockERC20.deploy("Jungle", "JUNGLE"); // 18 decimals default

        // Mint tokens
        await usdc.mint(user1.address, ethers.parseUnits("10000", 6));
        await jungleToken.mint(owner.address, ethers.parseUnits("10000000", 18));

        // Setup Sale Times
        const block = await ethers.provider.getBlock("latest");
        startTime = block.timestamp + 100;
        endTime = startTime + 86400; // 1 day

        // Deploy Sale
        const TokenSale = await ethers.getContractFactory("TokenSale");
        tokenSale = await TokenSale.deploy(
            await usdc.getAddress(),
            await jungleToken.getAddress(),
            PRICE,
            startTime,
            endTime,
            SOFT_CAP,
            HARD_CAP
        );

        // Fund Sale
        await jungleToken.transfer(await tokenSale.getAddress(), ethers.parseUnits("5000000", 18));
    });

    it("Should allow purchase during sale", async function () {
        // Advance time
        await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 10]);
        await ethers.provider.send("evm_mine");

        const buyAmount = ethers.parseUnits("100", 6); // 100 USDC
        await usdc.connect(user1).approve(await tokenSale.getAddress(), buyAmount);

        await tokenSale.connect(user1).purchase(buyAmount);

        // Check tokens purchased: 100 USDC / 0.1 = 1000 Tokens
        const userInfo = await tokenSale.userInfo(user1.address);
        expect(userInfo.totalPurchased).to.equal(ethers.parseUnits("1000", 18));
    });

    it("Should calculate TGE claim correctly", async function () {
        // Buy
        await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 10]);
        await ethers.provider.send("evm_mine");

        const buyAmount = ethers.parseUnits("100", 6);
        await usdc.connect(user1).approve(await tokenSale.getAddress(), buyAmount);
        await tokenSale.connect(user1).purchase(buyAmount);

        // Finalize
        await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
        await ethers.provider.send("evm_mine");
        await tokenSale.finalizeSale();

        // Check claimable (10% TGE)
        const claimable = await tokenSale.getClaimableAmount(user1.address);
        // 1000 tokens * 10% = 100 tokens
        expect(claimable).to.equal(ethers.parseUnits("100", 18));
    });

    it("Should vest linearly after cliff", async function () {
        // Buy
        await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 10]);
        await ethers.provider.send("evm_mine");

        const buyAmount = ethers.parseUnits("100", 6);
        await usdc.connect(user1).approve(await tokenSale.getAddress(), buyAmount);
        await tokenSale.connect(user1).purchase(buyAmount);

        // Finalize
        await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
        await tokenSale.finalizeSale();

        // Move past cliff (30 days) + 6 months (half vesting)
        const cliff = 30 * 24 * 3600;
        const halfVesting = 182 * 24 * 3600;

        await ethers.provider.send("evm_increaseTime", [cliff + halfVesting]);
        await ethers.provider.send("evm_mine");

        const claimable = await tokenSale.getClaimableAmount(user1.address);

        // Total = 1000
        // TGE = 100
        // Remaining = 900
        // Vested = 900 * 50% = 450
        // Total Claimable = 100 + 450 = 550

        // Allow small rounding diff
        expect(claimable).to.be.closeTo(ethers.parseUnits("550", 18), ethers.parseUnits("1", 18));
    });
});
