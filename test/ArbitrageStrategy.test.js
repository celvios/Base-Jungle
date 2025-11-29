const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArbitrageStrategy", function () {
    let flashLoanReceiver, strategy, dexAggregator;
    let owner, keeper, user;
    let usdc, weth;
    let balancerVault;

    beforeEach(async function () {
        [owner, keeper, user] = await ethers.getSigners();

        // Deploy mock tokens
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);

        // Deploy mock Balancer Vault
        const MockBalancerVault = await ethers.getContractFactory("MockBalancerVault");
        balancerVault = await MockBalancerVault.deploy();
        await balancerVault.waitForDeployment();

        // Fund Balancer Vault for flash loans
        await usdc.mint(await balancerVault.getAddress(), ethers.parseUnits("1000000", 6));

        // Deploy mock DEXAggregator
        const MockDEXAggregator = await ethers.getContractFactory("MockDEXAggregator");
        dexAggregator = await MockDEXAggregator.deploy();

        // Deploy BalancerFlashLoanReceiver
        const BalancerFlashLoanReceiver = await ethers.getContractFactory("BalancerFlashLoanReceiver");
        flashLoanReceiver = await BalancerFlashLoanReceiver.deploy(await balancerVault.getAddress());

        // Deploy ArbitrageStrategy
        const ArbitrageStrategy = await ethers.getContractFactory("ArbitrageStrategy");
        strategy = await ArbitrageStrategy.deploy(
            await flashLoanReceiver.getAddress(),
            await dexAggregator.getAddress()
        );

        // Link contracts
        await flashLoanReceiver.setArbitrageStrategy(await strategy.getAddress());

        // Grant KEEPER_ROLE
        const KEEPER_ROLE = await strategy.KEEPER_ROLE();
        await strategy.grantRole(KEEPER_ROLE, keeper.address);
    });

    describe("Deployment", function () {
        it("Should set the correct flash loan receiver", async function () {
            expect(await strategy.flashLoanReceiver()).to.equal(await flashLoanReceiver.getAddress());
        });

        it("Should set the correct DEX aggregator", async function () {
            expect(await strategy.dexAggregator()).to.equal(await dexAggregator.getAddress());
        });

        it("Should grant KEEPER_ROLE to keeper", async function () {
            const KEEPER_ROLE = await strategy.KEEPER_ROLE();
            expect(await strategy.hasRole(KEEPER_ROLE, keeper.address)).to.be.true;
        });

        it("Should set default parameters", async function () {
            expect(await strategy.minProfitBasisPoints()).to.equal(50); // 0.5%
            expect(await strategy.maxGasPrice()).to.equal(ethers.parseUnits("100", "gwei"));
            expect(await strategy.paused()).to.be.false;
        });
    });

    describe("Parameter Updates", function () {
        it("Should allow admin to update min profit", async function () {
            await strategy.setMinProfitBasisPoints(100); // 1%
            expect(await strategy.minProfitBasisPoints()).to.equal(100);
        });

        it("Should reject min profit > 10%", async function () {
            await expect(
                strategy.setMinProfitBasisPoints(1001)
            ).to.be.revertedWith("Max 10%");
        });

        it("Should allow admin to update max gas price", async function () {
            await strategy.setMaxGasPrice(ethers.parseUnits("50", "gwei"));
            expect(await strategy.maxGasPrice()).to.equal(ethers.parseUnits("50", "gwei"));
        });

        it("Should allow admin to pause", async function () {
            await strategy.setPaused(true);
            expect(await strategy.paused()).to.be.true;
        });

        it("Should reject non-admin parameter updates", async function () {
            await expect(
                strategy.connect(user).setMinProfitBasisPoints(100)
            ).to.be.reverted;
        });
    });

    describe("Arbitrage Execution", function () {
        it("Should execute profitable arbitrage", async function () {
            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [
                    await usdc.getAddress(),
                    await weth.getAddress(),
                    await usdc.getAddress()
                ],
                dexAddresses: [
                    "0x1111111111111111111111111111111111111111",
                    "0x2222222222222222222222222222222222222222"
                ],
                flashLoanAmount: ethers.parseUnits("10000", 6), // $10k
                estimatedProfit: ethers.parseUnits("100", 6),   // $100 profit
                deadline: Math.floor(Date.now() / 1000) + 300   // 5 min
            };

            await strategy.connect(keeper).executeArbitrage(opportunity);

            const stats = await strategy.getStatistics();
            expect(stats.executedCount).to.equal(1);
        });

        it("Should reject arbitrage when paused", async function () {
            await strategy.setPaused(true);

            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [await usdc.getAddress()],
                dexAddresses: [],
                flashLoanAmount: ethers.parseUnits("10000", 6),
                estimatedProfit: ethers.parseUnits("100", 6),
                deadline: Math.floor(Date.now() / 1000) + 300
            };

            await expect(
                strategy.connect(keeper).executeArbitrage(opportunity)
            ).to.be.revertedWith("Strategy paused");
        });

        it("Should reject arbitrage with expired deadline", async function () {
            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [await usdc.getAddress()],
                dexAddresses: [],
                flashLoanAmount: ethers.parseUnits("10000", 6),
                estimatedProfit: ethers.parseUnits("100", 6),
                deadline: Math.floor(Date.now() / 1000) - 100 // Expired
            };

            await expect(
                strategy.connect(keeper).executeArbitrage(opportunity)
            ).to.be.revertedWith("Opportunity expired");
        });

        it("Should reject arbitrage below profit threshold", async function () {
            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [await usdc.getAddress()],
                dexAddresses: [],
                flashLoanAmount: ethers.parseUnits("10000", 6),
                estimatedProfit: ethers.parseUnits("1", 6), // Only $1
                deadline: Math.floor(Date.now() / 1000) + 300
            };

            await expect(
                strategy.connect(keeper).executeArbitrage(opportunity)
            ).to.be.revertedWith("Profit below threshold");
        });

        it("Should reject non-keeper execution", async function () {
            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [await usdc.getAddress()],
                dexAddresses: [],
                flashLoanAmount: ethers.parseUnits("10000", 6),
                estimatedProfit: ethers.parseUnits("100", 6),
                deadline: Math.floor(Date.now() / 1000) + 300
            };

            await expect(
                strategy.connect(user).executeArbitrage(opportunity)
            ).to.be.reverted;
        });
    });

    describe("Profitability Simulation", function () {
        it("Should correctly simulate profitable arbitrage", async function () {
            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [await usdc.getAddress()],
                dexAddresses: ["0x1111111111111111111111111111111111111111"],
                flashLoanAmount: ethers.parseUnits("10000", 6),
                estimatedProfit: ethers.parseUnits("100", 6),
                deadline: Math.floor(Date.now() / 1000) + 300
            };

            const [profitable, netProfit] = await strategy.simulateArbitrage(opportunity);
            expect(profitable).to.be.true;
            expect(netProfit).to.be.gt(0);
        });

        it("Should correctly identify unprofitable arbitrage", async function () {
            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [await usdc.getAddress()],
                dexAddresses: Array(10).fill("0x1111111111111111111111111111111111111111"), // Many swaps = high gas
                flashLoanAmount: ethers.parseUnits("1000", 6),
                estimatedProfit: ethers.parseUnits("1", 6), // Very low profit
                deadline: Math.floor(Date.now() / 1000) + 300
            };

            const [profitable] = await strategy.simulateArbitrage(opportunity);
            expect(profitable).to.be.false;
        });
    });

    describe("Route Validation", function () {
        it("Should validate correct circular route", async function () {
            const route = [
                await usdc.getAddress(),
                await weth.getAddress(),
                await usdc.getAddress()
            ];
            expect(await strategy.validateRoute(route)).to.be.true;
        });

        it("Should reject non-circular route", async function () {
            const route = [
                await usdc.getAddress(),
                await weth.getAddress()
            ];
            expect(await strategy.validateRoute(route)).to.be.false;
        });

        it("Should reject too-short route", async function () {
            const route = [await usdc.getAddress()];
            expect(await strategy.validateRoute(route)).to.be.false;
        });
    });

    describe("Statistics", function () {
        it("Should track arbitrage statistics", async function () {
            const opportunity = {
                tokenIn: await usdc.getAddress(),
                swapPath: [
                    await usdc.getAddress(),
                    await weth.getAddress(),
                    await usdc.getAddress()
                ],
                dexAddresses: [
                    "0x1111111111111111111111111111111111111111",
                    "0x2222222222222222222222222222222222222222"
                ],
                flashLoanAmount: ethers.parseUnits("10000", 6),
                estimatedProfit: ethers.parseUnits("100", 6),
                deadline: Math.floor(Date.now() / 1000) + 300
            };

            await strategy.connect(keeper).executeArbitrage(opportunity);
            await strategy.connect(keeper).executeArbitrage(opportunity);

            const stats = await strategy.getStatistics();
            expect(stats.executedCount).to.equal(2);
        });
    });
});
