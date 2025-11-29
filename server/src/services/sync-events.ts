import { ethers } from 'ethers';
import { addActivity } from './activity';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL!;
const CONSERVATIVE_VAULT = process.env.CONSERVATIVE_VAULT_ADDRESS!;
const AGGRESSIVE_VAULT = process.env.AGGRESSIVE_VAULT_ADDRESS!;

// Simple Deposit event ABI
const VAULT_ABI = [
    'event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)',
    'event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)'
];

/**
 * Sync recent events from vaults
 */
export async function syncRecentEvents(blocksToScan: number = 1000) {
    console.log(`\n🔍 Scanning last ${blocksToScan} blocks for vault events...\n`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - blocksToScan);

    const vaults = [
        { address: CONSERVATIVE_VAULT, name: 'Conservative' },
        { address: AGGRESSIVE_VAULT, name: 'Aggressive' }
    ];

    let totalEvents = 0;

    for (const vault of vaults) {
        try {
            const contract = new ethers.Contract(vault.address, VAULT_ABI, provider);

            // Get Deposit events
            const depositFilter = contract.filters.Deposit();
            const deposits = await contract.queryFilter(depositFilter, fromBlock, currentBlock);

            // Get Withdraw events
            const withdrawFilter = contract.filters.Withdraw();
            const withdrawals = await contract.queryFilter(withdrawFilter, fromBlock, currentBlock);

            // Process deposits
            for (const event of deposits) {
                const block = await event.getBlock();
                await addActivity({
                    tx_hash: event.transactionHash,
                    block_number: event.blockNumber,
                    timestamp: block.timestamp,
                    event_type: 'deposit',
                    user_address: event.args![1] as string, // owner
                    vault_address: vault.address,
                    amount: Number(ethers.formatUnits(event.args![2] as bigint, 6)), // USDC has 6 decimals
                });
                totalEvents++;
            }

            // Process withdrawals
            for (const event of withdrawals) {
                const block = await event.getBlock();
                await addActivity({
                    tx_hash: event.transactionHash,
                    block_number: event.blockNumber,
                    timestamp: block.timestamp,
                    event_type: 'withdraw',
                    user_address: event.args![2] as string, // owner
                    vault_address: vault.address,
                    amount: Number(ethers.formatUnits(event.args![3] as bigint, 6)),
                });
                totalEvents++;
            }

            console.log(`✅ ${vault.name} Vault: ${deposits.length} deposits, ${withdrawals.length} withdrawals`);

        } catch (error: any) {
            console.error(`❌ Error syncing ${vault.name} vault:`, error.message);
        }
    }

    console.log(`\n✅ Sync complete: ${totalEvents} events added to database\n`);
}

// Run sync if called directly
if (require.main === module) {
    const blocksToScan = parseInt(process.argv[2]) || 1000;

    console.log('🚀 Starting event sync...');
    console.log(`📍 Network: Base Sepolia`);
    console.log(`📦 Scanning from block: ${blocksToScan} blocks ago\n`);

    syncRecentEvents(blocksToScan)
        .then(() => {
            console.log('✅ Event sync complete!');
            process.exit(0);
        })
        .catch((err) => {
            console.error('\n❌ Sync failed:', err.message);
            process.exit(1);
        });
}
