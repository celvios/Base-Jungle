import { Pool } from 'pg';
import { createPublicClient, http, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Vault ABI for reading balances
const VAULT_ABI = [
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'shares', type: 'uint256' }],
        name: 'convertToAssets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

const CONSERVATIVE_VAULT = process.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address;
const AGGRESSIVE_VAULT = process.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address;

async function snapshotUserBalance(userAddress: Address, vaultAddress: Address) {
    try {
        // Get user's share balance
        const shares = await client.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'balanceOf',
            args: [userAddress],
        });

        if (shares === BigInt(0)) {
            return; // Skip users with no balance
        }

        // Convert shares to USDC value
        const balanceUsdc = await client.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'convertToAssets',
            args: [shares],
        });

        // Store snapshot
        await pool.query(
            `INSERT INTO balance_snapshots (user_address, vault_address, balance_usdc, share_balance, snapshot_time)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
                userAddress,
                vaultAddress,
                Number(balanceUsdc) / 1e6, // Convert to USDC decimals
                shares.toString(),
            ]
        );

        console.log(`Snapshot created for ${userAddress} in vault ${vaultAddress}`);
    } catch (error) {
        console.error(`Failed to snapshot ${userAddress}:`, error);
    }
}

async function snapshotAllBalances() {
    try {
        console.log('Starting balance snapshot job...');

        // Get all unique user addresses from deposits or users table
        const result = await pool.query(
            `SELECT DISTINCT user_address FROM deposits 
             UNION 
             SELECT DISTINCT wallet_address as user_address FROM users
             WHERE wallet_address IS NOT NULL`
        );

        const users = result.rows.map(row => row.user_address as Address);
        console.log(`Found ${users.length} users to snapshot`);

        // Snapshot each user's balance in both vaults
        for (const user of users) {
            await snapshotUserBalance(user, CONSERVATIVE_VAULT);
            await snapshotUserBalance(user, AGGRESSIVE_VAULT);
        }

        console.log('Balance snapshot job completed');
    } catch (error) {
        console.error('Snapshot job failed:', error);
    }
}

// Run immediately if called directly
if (require.main === module) {
    snapshotAllBalances()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { snapshotAllBalances };
