import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("StrategyController Settings", function () {
    let strategyController;
    let owner, user1;
    let referralManager;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy Mock ReferralManager
        const MockReferralManager = await ethers.getContractFactory("MockReferralManager");
        referralManager = await MockReferralManager.deploy();

        // Deploy StrategyController
        const StrategyController = await ethers.getContractFactory("StrategyController");
        strategyController = await StrategyController.deploy(await referralManager.getAddress());
    });

    it("Should allow user to update settings", async function () {
        // Default settings should be empty/false/0
        let settings = await strategyController.userSettings(user1.address);
        expect(settings.autoCompound).to.be.false;
        expect(settings.riskLevel).to.equal(0);

        // Update settings: AutoCompound=true, Risk=High(2)
        await expect(strategyController.connect(user1).setUserSettings(true, 2))
            .to.emit(strategyController, "SettingsUpdated")
            .withArgs(user1.address, true, 2);

        // Verify update
        settings = await strategyController.userSettings(user1.address);
        expect(settings.autoCompound).to.be.true;
        expect(settings.riskLevel).to.equal(2);
    });

    it("Should revert on invalid risk level", async function () {
        // Risk level 3 is invalid (max 2)
        await expect(strategyController.connect(user1).setUserSettings(true, 3))
            .to.be.revertedWith("Invalid risk level");
    });
});
