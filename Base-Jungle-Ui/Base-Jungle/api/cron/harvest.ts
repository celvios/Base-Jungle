/**
 * Vercel Cron Function - Hourly Yield Harvester
 * Deployed as: /api/cron/harvest
 * Schedule: Every hour via vercel.json
 */

import { ethers } from 'ethers';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const VAULT_ABI = [
    'function harvestAndCompound() external returns (uint256)',
    'function lastHarvestTimestamp() view returns (uint256)',
    'function totalAssets() view returns (uint256)',
    'function hasRole(bytes32, address) view returns (bool)'
];

const KEEPER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('KEEPER_ROLE'));

// Load from environment
const VAULTS = [
    { name: 'Conservative', address: process.env.VITE_CONSERVATIVE_VAULT_ADDRESS },
    { name: 'Aggressive', address: process.env.VITE_AGGRESSIVE_VAULT_ADDRESS },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify this is a cron request (security)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org');
        const signer = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY!, provider);

        const results = [];

        for (const vault of VAULTS) {
            if (!vault.address) continue;

            try {
                const vaultContract = new ethers.Contract(vault.address, VAULT_ABI, signer);

                // Check KEEPER_ROLE
                const hasRole = await vaultContract.hasRole(KEEPER_ROLE, await signer.getAddress());
                if (!hasRole) {
                    results.push({ vault: vault.name, status: 'no_role' });
                    continue;
                }

                // Check last harvest
                const lastHarvest = await vaultContract.lastHarvestTimestamp();
                const now = Math.floor(Date.now() / 1000);
                const hoursSince = (now - Number(lastHarvest)) / 3600;

                if (hoursSince < 1) {
                    results.push({ vault: vault.name, status: 'too_soon', hoursSince });
                    continue;
                }

                // Harvest
                const tx = await vaultContract.harvestAndCompound();
                const receipt = await tx.wait();

                results.push({
                    vault: vault.name,
                    status: 'success',
                    tx: tx.hash,
                    gasUsed: receipt?.gasUsed.toString()
                });

            } catch (error: any) {
                results.push({
                    vault: vault.name,
                    status: 'error',
                    error: error.message.slice(0, 100)
                });
            }
        }

        return res.status(200).json({
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error: any) {
        console.error('Harvest error:', error);
        return res.status(500).json({ error: error.message });
    }
}
