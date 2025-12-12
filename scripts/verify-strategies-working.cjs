const hre = require("hardhat");

async function main() {
  const vaultAddress = "0x0fFc833fBaa8f567695a0cd640BD4009FF3dC841";
  console.log(`🔍 Verifying strategies for Vault: ${vaultAddress}`);

  // 1. Get Vault and StrategyController
  const Vault = await hre.ethers.getContractAt("BaseVault", vaultAddress);
  const controllerAddress = await Vault.strategyController();
  console.log(`🎮 StrategyController: ${controllerAddress}`);

  const Controller = await hre.ethers.getContractAt("StrategyController", controllerAddress);

  // 2. Check registered strategies
  const strategyCount = await Controller.strategyCount();
  console.log(`📋 Total Strategies Registered: ${strategyCount}`);

  let beefyStrategyId = -1;

  for (let i = 0; i < strategyCount; i++) {
    const strategy = await Controller.strategies(i);
    console.log(`   Strategy #${i}:`);
    console.log(`     Type: ${strategy.strategyType} (4 = VAULT_BEEFY)`);
    console.log(`     Adapter: ${strategy.adapter}`);
    console.log(`     Active: ${strategy.isActive}`);
    console.log(`     Allocated Total: ${hre.ethers.formatUnits(strategy.totalAllocated, 6)} USDC`); // Assuming USDC (6 decimals)

    if (Number(strategy.strategyType) === 4) { // StrategyType.VAULT_BEEFY
      beefyStrategyId = i;
    }
  }

  if (beefyStrategyId === -1) {
    console.log("❌ No Beefy Strategy found!");
    return;
  }

  // 3. Check User Allocation for Beefy
  const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Replace with user address if known, using default signer for now or checking events
  // Note: The user didn't provide their address in the prompt, but the vault address. 
  // I will check the vault's own balance in the strategies as the vault is the one holding user funds? 
  // Wait, StrategyController allocates *per user*? 
  // Looking at StrategyController.sol: mapping(address => mapping(uint256 => uint256)) public userAllocations;
  // Yes, it allocates per user. 
  // I don't have the user's address. I'll rely on the "Allocated Total" from the strategy check above.

  // 4. Check Adapter details
  const beefyStrategy = await Controller.strategies(beefyStrategyId);
  const BeefyAdapter = await hre.ethers.getContractAt("BeefyVaultAdapter", beefyStrategy.adapter);

  console.log(`🥩 Verifying Beefy Adapter at ${beefyStrategy.adapter}`);
  try {
    const wantToken = await BeefyAdapter.asset();
    console.log(`     Want Token: ${wantToken}`);

    const beefyVaultAddr = await BeefyAdapter.beefyVault();
    console.log(`     Underlying Beefy Vault: ${beefyVaultAddr}`);

    const balance = await BeefyAdapter.balanceOf();
    console.log(`     Adapter Balance (Underlying): ${hre.ethers.formatUnits(balance, 6)}`);

    // Check allowance?
    // Check if Adapter is paused?
  } catch (e) {
    console.log(`❌ Error querying Beefy Adapter: ${e.message}`);
  }

  // 5. Check actual Beefy Vault
  try {
    const beefyVaultAddr = await BeefyAdapter.beefyVault();
    const BeefyVault = await hre.ethers.getContractAt("IERC20", beefyVaultAddr); // Trying as ERC20 first
    const totalSupply = await BeefyVault.totalSupply();
    console.log(`     Beefy Vault Total Supply: ${totalSupply}`);
  } catch (e) {
    console.log(`❌ Error querying underlying Beefy Vault: ${e.message}`);
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
