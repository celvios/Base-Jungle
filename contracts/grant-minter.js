// Grant minter role to deployer wallet
// Run from contracts directory: npx hardhat run contracts/grant-minter.js --network baseSepolia

import hre from "hardhat";

async function main() {
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const DEPLOYER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";

    console.log("🔑 Granting MINTER_ROLE to deployer...\n");
    console.log(`USDC Contract: ${USDC_ADDRESS}`);
    console.log(`Deployer: ${DEPLOYER}\n`);

    // Get the USDC contract
    const usdc = await hre.ethers.getContractAt(
        "FiatTokenV2_1",
        USDC_ADDRESS
    );

    // Get MINTER_ROLE hash
    const MINTER_ROLE = await usdc.MINTER_ROLE();
    console.log(`MINTER_ROLE hash: ${MINTER_ROLE}`);

    // Check if already has role
    const hasRole = await usdc.hasRole(MINTER_ROLE, DEPLOYER);

    if (hasRole) {
        console.log("✅ Deployer already has MINTER_ROLE!");
        return;
    }

    console.log("⏳ Granting MINTER_ROLE...");

    // Grant the role
    const tx = await usdc.grantRole(MINTER_ROLE, DEPLOYER);
    console.log(`Transaction hash: ${tx.hash}`);

    await tx.wait();

    console.log("✅ MINTER_ROLE granted successfully!");
    console.log("\n🎉 You can now mint USDC!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
