import { expect } from "chai";
import { ethers } from "hardhat";
import ADDRESSES from "./addresses.cjs";
import { fundTestAccount } from "./helpers.cjs";

describe("🔱 Phase 6 Fork Tests - AerodromeLPAdapter", function () {
    let owner, user1;
    let lpAdapter;
    let usdc, weth;
    let aeroRouter;

    before(async function () {
        // Check if we're on a fork
        if (process.env.FORK !== 'true') {
            console.log("\n⚠️  Skipping fork tests - set FORK=true to run\n");
            this.skip();
        }

        [owner, user1] = await ethers.getSigners();

        console.log("\n🔄 Funding test accounts with real USDC and WETH...");

        // Fund user1 with real tokens from mainnet fork
        const tokens = await fundTestAccount(
            user1,
            ethers.parseUnits("5000", 6), // 5000 USDC
            ethers.parseUnits("2", 18)     // 2 WETH
        );

        usdc = tokens.usdc;
        weth = tokens.weth;

        console.log("✅ Funded user1:");
        console.log(`  - USDC: ${ethers.formatUnits(await usdc.balanceOf(user1.address), 6)}`);
        console.log(`  - WETH: ${ethers.formatUnits(await weth.balanceOf(user1.address), 18)}`);

        // Get real Aerodrome router
        aeroRouter = await ethers.getContractAt(
            ["function addLiquidity(address,address,bool,uint256,uint256,uint256,uint256,address,uint256) external returns (uint256,uint256,uint256)"],
            ADDRESSES.AERODROME_ROUTER
        );

        console.log("\n🏗️  Deploying AerodromeLPAdapter with real contracts...");

        // Deploy our adapter pointing to real contracts
        const AerodromeLPAdapter = await ethers.getContractFactory("AerodromeLPAdapter");

        lpAdapter = await AerodromeLPAdapter.deploy(
            ADDRESSES.AERODROME_ROUTER,
            ADDRESSES.USDC,
            ADDRESSES.WETH,
            ADDRESSES.AERODROME_USDC_WETH_PAIR, // Real USDC/WETH pair
            false // volatile pool
        );

        await lpAdapter.waitForDeployment();

        // Grant VAULT_ROLE to user1
        const VAULT_ROLE = await lpAdapter.VAULT_ROLE();
        await lpAdapter.grantRole(VAULT_ROLE, user1.address);

        console.log("✅ Adapter deployed at:", await lpAdapter.getAddress());
    });

    describe("🧪 Previously Skipped Tests - Now on Real Contracts", function () {

        it("Should add liquidity and get REAL LP tokens", async function () {
            const amountA = ethers.parseUnits("1000", 6);  // 1000 USDC
            const amountB = ethers.parseUnits("0.5", 18);  // 0.5 WETH

            console.log("\n📊 Adding liquidity to real Aerodrome pool...");

            // Approve tokens
            await usdc.connect(user1).approve(await lpAdapter.getAddress(), amountA);
            await weth.connect(user1).approve(await lpAdapter.getAddress(), amountB);

            // Add liquidity through our adapter
            const tx = await lpAdapter.connect(user1).addLiquidity(amountA, amountB, 0, 0);
            const receipt = await tx.wait();

            console.log("✅ Liquidity added! Gas used:", receipt.gasUsed.toString());

            // This should emit LiquidityAdded event
            await expect(tx).to.emit(lpAdapter, "LiquidityAdded");
        });

        it("✨ Should track LP positions (REAL LP tokens!)", async function () {
            console.log("\n📈 Checking LP balance from real Aerodrome pair...");

            // THIS IS THE TEST THAT WAS SKIPPED!
            // On fork, getLPBalance() calls the REAL pair contract
            const lpBalance = await lpAdapter.getLPBalance();

            console.log("💎 LP Token Balance:", ethers.formatUnits(lpBalance, 18));

            // We should have LP tokens now from the previous add liquidity
            expect(lpBalance).to.be.gt(0n);

            console.log("✅ Successfully queried REAL LP tokens!");
        });

        it("✨ Should remove liquidity (REAL LP token burn!)", async function () {
            console.log("\n🔥 Removing liquidity from real Aerodrome pool...");

            // THIS IS THE OTHER TEST THAT WAS SKIPPED!
            // Get our LP balance
            const lpBalance = await lpAdapter.getLPBalance();
            console.log("🎫 LP tokens to burn:", ethers.formatUnits(lpBalance, 18));

            expect(lpBalance).to.be.gt(0n, "Should have LP tokens from previous test");

            // Remove all liquidity
            const tx = await lpAdapter.connect(user1).removeLiquidity(lpBalance, 0, 0);
            const receipt = await tx.wait();

            console.log("✅ Liquidity removed! Gas used:", receipt.gasUsed.toString());

            // Should emit event
            await expect(tx).to.emit(lpAdapter, "LiquidityRemoved");

            // LP balance should be 0 now
            const newLpBalance = await lpAdapter.getLPBalance();
            expect(newLpBalance).to.equal(0n);

            console.log("✅ Successfully removed REAL LP tokens!");
        });

        it("Should calculate share of pool with real reserves", async function () {
            // Add some liquidity first
            const amountA = ethers.parseUnits("500", 6);
            const amountB = ethers.parseUnits("0.25", 18);

            await usdc.connect(user1).approve(await lpAdapter.getAddress(), amountA);
            await weth.connect(user1).approve(await lpAdapter.getAddress(), amountB);

            await lpAdapter.connect(user1).addLiquidity(amountA, amountB, 0, 0);

            // Get share of pool
            const [shareA, shareB] = await lpAdapter.getShareOfPool();

            console.log("\n📊 Share of pool:");
            console.log(`  - USDC: ${ethers.formatUnits(shareA, 6)}`);
            console.log(`  - WETH: ${ethers.formatUnits(shareB, 18)}`);

            expect(shareA).to.be.gt(0n);
            expect(shareB).to.be.gt(0n);
        });
    });
});
