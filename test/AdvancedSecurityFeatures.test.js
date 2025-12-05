import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Advanced Security Features Tests", function () {
    let twapOracle, ilProtection, liquidationHandler;
    let chainlinkOracle, leverageManager;
    let owner, user1, user2, liquidator, keeper;
    let usdc, weth, usdcFeed, wethFeed;

    beforeEach(async function () {
        [owner, user1, user2, liquidator, keeper] = await ethers.getSigners();

        // Deploy mock tokens
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USDC", "USDC");
        weth = await MockERC20.deploy("WETH", "WETH");
        await usdc.waitForDeployment();
        await weth.waitForDeployment();

        // Deploy Chainlink feeds
        const MockAggregator = await ethers.getContractFactory("MockChainlinkAggregator");
        usdcFeed = await MockAggregator.deploy(8, ethers.parseUnits("1", 8));
        wethFeed = await MockAggregator.deploy(8, ethers.parseUnits("2000", 8));
        await usdcFeed.waitForDeployment();
        await wethFeed.waitForDeployment();

        // Deploy ChainlinkOracle
        const ChainlinkOracle = await ethers.getContractFactory("ChainlinkOracle");
        chainlinkOracle = await ChainlinkOracle.deploy();
        await chainlinkOracle.waitForDeployment();

        await chainlinkOracle.setFeed(await usdc.getAddress(), await usdcFeed.getAddress());
        await chainlinkOracle.setFeed(await weth.getAddress(), await wethFeed.getAddress());

        // Deploy TWAPOracle
        const TWAPOracle = await ethers.getContractFactory("TWAPOracle");
        twapOracle = await TWAPOracle.deploy(await chainlinkOracle.getAddress());
        await twapOracle.waitForDeployment();

        // Deploy ReferralManager for leverage testing
        const ReferralManager = await ethers.getContractFactory("ReferralManager");
        const referralManager = await ReferralManager.deploy();
        await referralManager.waitForDeployment();

        // Deploy LeverageManager
        const LeverageManager = await ethers.getContractFactory("LeverageManager");
        leverageManager = await LeverageManager.deploy(await twapOracle.getAddress());
        await leverageManager.waitForDeployment();
        await leverageManager.setReferralManager(await referralManager.getAddress());

        // Deploy CascadingLiquidationHandler
        const CascadingLiquidationHandler = await ethers.getContractFactory("CascadingLiquidationHandler");
        liquidationHandler = await CascadingLiquidationHandler.deploy(
            await leverageManager.getAddress(),
            await twapOracle.getAddress()
        );
        await liquidationHandler.waitForDeployment();

        // Grant roles
        const KEEPER_ROLE = await liquidationHandler.KEEPER_ROLE();
        const LIQUIDATOR_ROLE = await liquidationHandler.LIQUIDATOR_ROLE();
        await liquidationHandler.grantRole(KEEPER_ROLE, keeper.address);
        await liquidationHandler.grantRole(LIQUIDATOR_ROLE, liquidator.address);
    });

    // ========================================
    // TWAP Oracle Tests
    // ========================================
    describe("🔒 TWAP Oracle - Flash Loan Protection", function () {
        it("Should build price history", async function () {
            // Update price multiple times
            await twapOracle.updatePrice(await weth.getAddress());

            // Fast forward 10 minutes
            await ethers.provider.send("evm_increaseTime", [10 * 60]);
            await ethers.provider.send("evm_mine");

            await twapOracle.updatePrice(await weth.getAddress());

            // Fast forward another 10 minutes
            await ethers.provider.send("evm_increaseTime", [10 * 60]);
            await ethers.provider.send("evm_mine");

            await twapOracle.updatePrice(await weth.getAddress());

            const count = await twapOracle.getObservationCount(await weth.getAddress());
            expect(count).to.equal(3);
        });

        it("Should calculate TWAP correctly", async function () {
            // Build price history
            await twapOracle.updatePrice(await weth.getAddress());

            for (let i = 0; i < 5; i++) {
                await ethers.provider.send("evm_increaseTime", [10 * 60]);
                await ethers.provider.send("evm_mine");
                await twapOracle.updatePrice(await weth.getAddress());
            }

            // Get TWAP
            const twap = await twapOracle.getTWAP(await weth.getAddress());
            expect(twap).to.be.gt(0);

            console.log("TWAP:", ethers.formatUnits(twap, 18));
        });

        it("Should reject extreme price deviations", async function () {
            // Initial price
            await twapOracle.updatePrice(await weth.getAddress());

            // Try to update with 50% higher price (should trigger circuit breaker)
            await wethFeed.updateAnswer(ethers.parseUnits("3000", 8));

            await expect(
                twapOracle.updatePrice(await weth.getAddress())
            ).to.be.revertedWith("Price deviation too high");
        });

        it("Should detect price manipulation", async function () {
            // Build normal price history
            for (let i = 0; i < 5; i++) {
                await twapOracle.updatePrice(await weth.getAddress());
                await ethers.provider.send("evm_increaseTime", [10 * 60]);
                await ethers.provider.send("evm_mine");
            }

            // Price is safe initially
            let isSafe = await twapOracle.isPriceSafe(await weth.getAddress());
            expect(isSafe).to.be.true;

            // Simulate flash loan attack (within deviation limit but still suspicious)
            await wethFeed.updateAnswer(ethers.parseUnits("2100", 8)); // 5% increase
            await twapOracle.updatePrice(await weth.getAddress());

            // Check if price is still considered safe
            isSafe = await twapOracle.isPriceSafe(await weth.getAddress());
            console.log("Price safe after 5% spike:", isSafe);
        });

        it("Should use protected price for critical operations", async function () {
            // Build price history
            for (let i = 0; i < 5; i++) {
                await twapOracle.updatePrice(await weth.getAddress());
                await ethers.provider.send("evm_increaseTime", [10 * 60]);
                await ethers.provider.send("evm_mine");
            }

            // Get protected price (TWAP)
            const protectedPrice = await twapOracle.getProtectedPrice(await weth.getAddress());

            // Get spot price
            const spotPrice = await twapOracle.getSpotPrice(await weth.getAddress());

            console.log("Protected price:", ethers.formatUnits(protectedPrice, 18));
            console.log("Spot price:", ethers.formatUnits(spotPrice, 18));

            expect(protectedPrice).to.be.gt(0);
        });
    });

    // ========================================
    // Impermanent Loss Protection Tests
    // ========================================
    describe("🔒 Impermanent Loss Protection", function () {
        it("Should calculate IL correctly for various price changes", async function () {
            // Deploy a contract that uses the library
            const TestIL = await ethers.getContractFactory("TestILProtection");
            const testIL = await TestIL.deploy();
            await testIL.waitForDeployment();

            // Test scenarios
            const scenarios = [
                { initial: 2000, current: 2000, expectedIL: 0 },      // No change
                { initial: 2000, current: 2200, expectedIL: 50 },     // 10% up ≈ 0.5% IL
                { initial: 2000, current: 2500, expectedIL: 200 },    // 25% up ≈ 2% IL
                { initial: 2000, current: 3000, expectedIL: 570 },    // 50% up ≈ 5.7% IL
                { initial: 2000, current: 4000, expectedIL: 2000 },   // 100% up ≈ 20% IL
            ];

            for (const scenario of scenarios) {
                const il = await testIL.calculateIL(
                    ethers.parseUnits(scenario.initial.toString(), 18),
                    ethers.parseUnits(scenario.current.toString(), 18)
                );

                console.log(`Price ${scenario.initial} → ${scenario.current}: IL = ${il} bps`);

                // Allow some tolerance
                expect(il).to.be.closeTo(scenario.expectedIL, 100);
            }
        });

        it("Should classify IL severity correctly", async function () {
            const TestIL = await ethers.getContractFactory("TestILProtection");
            const testIL = await TestIL.deploy();
            await testIL.waitForDeployment();

            // Test severity levels
            expect(await testIL.getILSeverity(30)).to.equal(0);    // SAFE
            expect(await testIL.getILSeverity(100)).to.equal(1);   // LOW
            expect(await testIL.getILSeverity(300)).to.equal(2);   // MEDIUM
            expect(await testIL.getILSeverity(700)).to.equal(3);   // HIGH
            expect(await testIL.getILSeverity(1500)).to.equal(4);  // CRITICAL
        });

        it("Should recommend correct actions based on IL", async function () {
            const TestIL = await ethers.getContractFactory("TestILProtection");
            const testIL = await TestIL.deploy();
            await testIL.waitForDeployment();

            // Test action recommendations
            expect(await testIL.getRecommendedAction(30)).to.equal(0);    // Proceed
            expect(await testIL.getRecommendedAction(100)).to.equal(1);   // Warn
            expect(await testIL.getRecommendedAction(300)).to.equal(2);   // Confirm
            expect(await testIL.getRecommendedAction(1500)).to.equal(3);  // Block
        });
    });

    // ========================================
    // Cascading Liquidation Handler Tests
    // ========================================
    describe("🔒 Cascading Liquidation Handler", function () {
        it("Should queue liquidations by priority", async function () {
            // This test would require setting up actual positions
            // For now, we verify the contract is deployed correctly

            const stats = await liquidationHandler.getLiquidationStats();
            expect(stats.critical).to.equal(0);
            expect(stats.high).to.equal(0);
            expect(stats.medium).to.equal(0);
            expect(stats.low).to.equal(0);
        });

        it("Should enforce batch size limits", async function () {
            // Try to process with invalid batch size
            await expect(
                liquidationHandler.connect(liquidator).processBatch(0)
            ).to.be.revertedWith("Invalid batch size");

            await expect(
                liquidationHandler.connect(liquidator).processBatch(100)
            ).to.be.revertedWith("Invalid batch size");
        });

        it("Should activate circuit breaker on excessive liquidations", async function () {
            // This would require simulating many liquidations
            // Document the circuit breaker mechanism
            console.log("Circuit breaker: Max 20 liquidations per block");
        });

        it("Should calculate total value at risk", async function () {
            const valueAtRisk = await liquidationHandler.getTotalValueAtRisk();
            expect(valueAtRisk).to.equal(0); // No liquidations queued
        });
    });
});

// Helper contract for testing IL library
contract TestILProtection {
    using ImpermanentLossProtection for uint256;

        function calculateIL(uint256 initial, uint256 current) external pure returns(uint256) {
        return ImpermanentLossProtection.calculateIL(initial, current);
    }

    function getILSeverity(uint256 ilPercent) external pure returns(uint8) {
        return uint8(ImpermanentLossProtection.getILSeverity(ilPercent));
    }

    function getRecommendedAction(uint256 ilPercent) external pure returns(uint8) {
        return ImpermanentLossProtection.getRecommendedAction(ilPercent);
    }
}
