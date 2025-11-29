import { db, dbRun, dbGet, dbAll } from '../db/database';

export interface DepositRecord {
    id?: number;
    user_address: string;
    vault_address: string;
    initial_amount: number;
    shares_received: number;
    deposit_timestamp: number;
    tx_hash: string;
    remaining_shares: number;
    is_fully_withdrawn: boolean;
}

export interface WithdrawalRecord {
    id?: number;
    user_address: string;
    vault_address: string;
    shares_burned: number;
    assets_received: number;
    withdrawal_timestamp: number;
    tx_hash: string;
    was_mature: boolean;
    penalty_paid: number;
}

export interface VaultPosition {
    userAddress: string;
    vaultAddress: string;
    initialDeposit: number;
    currentShares: number;
    currentValue: number;
    totalYield: number;
    depositDate: Date;
    daysStaked: number;
}

/**
 * Track a new deposit
 */
export async function trackDeposit(
    userAddress: string,
    vaultAddress: string,
    amount: number,
    shares: number,
    timestamp: number,
    txHash: string
): Promise<void> {
    await dbRun(
        `INSERT OR REPLACE INTO vault_deposits 
    (user_address, vault_address, initial_amount, shares_received, deposit_timestamp, tx_hash, remaining_shares, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userAddress, vaultAddress, amount, shares, timestamp, txHash, shares]
    );
}

/**
 * Track a withdrawal
 */
export async function trackWithdrawal(
    userAddress: string,
    vaultAddress: string,
    sharesBurned: number,
    assetsReceived: number,
    timestamp: number,
    txHash: string,
    wasMature: boolean,
    penalty: number
): Promise<void> {
    // Record withdrawal
    await dbRun(
        `INSERT OR REPLACE INTO vault_withdrawals
    (user_address, vault_address, shares_burned, assets_received, withdrawal_timestamp, tx_hash, was_mature, penalty_paid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userAddress, vaultAddress, sharesBurned, assetsReceived, timestamp, txHash, wasMature ? 1 : 0, penalty]
    );

    // Update deposit records (FIFO - oldest deposits withdrawn first)
    await updateDepositShares(userAddress, vaultAddress, sharesBurned);
}

/**
 * Update remaining shares after withdrawal (FIFO)
 */
async function updateDepositShares(
    userAddress: string,
    vaultAddress: string,
    sharesToBurn: number
): Promise<void> {
    const deposits = await dbAll(
        `SELECT * FROM vault_deposits 
    WHERE user_address = ? AND vault_address = ? AND is_fully_withdrawn = 0
    ORDER BY deposit_timestamp ASC`,
        [userAddress, vaultAddress]
    ) as DepositRecord[];

    let remainingToBurn = sharesToBurn;

    for (const deposit of deposits) {
        if (remainingToBurn <= 0) break;

        const depositShares = deposit.remaining_shares;

        if (remainingToBurn >= depositShares) {
            // Fully withdraw this deposit
            await dbRun(
                `UPDATE vault_deposits 
        SET remaining_shares = 0, is_fully_withdrawn = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
                [deposit.id]
            );
            remainingToBurn -= depositShares;
        } else {
            // Partially withdraw this deposit
            await dbRun(
                `UPDATE vault_deposits 
        SET remaining_shares = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
                [depositShares - remainingToBurn, deposit.id]
            );
            remainingToBurn = 0;
        }
    }
}

/**
 * Get user's vault position with principal/yield breakdown
 */
export async function getVaultPosition(
    userAddress: string,
    vaultAddress: string,
    currentShareBalance: number,
    currentAssetValue: number
): Promise<VaultPosition | null> {
    // Get all non-withdrawn deposits for this user/vault
    const deposits = await dbAll(
        `SELECT * FROM vault_deposits 
    WHERE user_address = ? AND vault_address = ? AND is_fully_withdrawn = 0
    ORDER BY deposit_timestamp ASC`,
        [userAddress, vaultAddress]
    ) as DepositRecord[];

    if (deposits.length === 0) {
        return null;
    }

    // Calculate weighted average initial deposit
    // Based on remaining shares from each deposit
    let totalInitialValue = 0;
    let totalShares = 0;
    let earliestDeposit = deposits[0].deposit_timestamp;

    for (const deposit of deposits) {
        const shareRatio = deposit.remaining_shares / deposit.shares_received;
        const initialValue = deposit.initial_amount * shareRatio;

        totalInitialValue += initialValue;
        totalShares += deposit.remaining_shares;

        if (deposit.deposit_timestamp < earliestDeposit) {
            earliestDeposit = deposit.deposit_timestamp;
        }
    }

    const totalYield = currentAssetValue - totalInitialValue;
    const daysStaked = Math.floor((Date.now() / 1000 - earliestDeposit) / 86400);

    return {
        userAddress,
        vaultAddress,
        initialDeposit: totalInitialValue,
        currentShares: currentShareBalance,
        currentValue: currentAssetValue,
        totalYield: Math.max(0, totalYield),
        depositDate: new Date(earliestDeposit * 1000),
        daysStaked,
    };
}

/**
 * Get deposit history for a user
 */
export async function getUserDepositHistory(
    userAddress: string,
    vaultAddress?: string
): Promise<DepositRecord[]> {
    if (vaultAddress) {
        return dbAll(
            `SELECT * FROM vault_deposits 
      WHERE user_address = ? AND vault_address = ?
      ORDER BY deposit_timestamp DESC`,
            [userAddress, vaultAddress]
        ) as Promise<DepositRecord[]>;
    }

    return dbAll(
        `SELECT * FROM vault_deposits 
    WHERE user_address = ?
    ORDER BY deposit_timestamp DESC`,
        [userAddress]
    ) as Promise<DepositRecord[]>;
}

/**
 * Get withdrawal history for a user
 */
export async function getUserWithdrawalHistory(
    userAddress: string,
    vaultAddress?: string
): Promise<WithdrawalRecord[]> {
    if (vaultAddress) {
        return dbAll(
            `SELECT * FROM vault_withdrawals 
      WHERE user_address = ? AND vault_address = ?
      ORDER BY withdrawal_timestamp DESC`,
            [userAddress, vaultAddress]
        ) as Promise<WithdrawalRecord[]>;
    }

    return dbAll(
        `SELECT * FROM vault_withdrawals 
    WHERE user_address = ?
    ORDER BY withdrawal_timestamp DESC`,
        [userAddress]
    ) as Promise<WithdrawalRecord[]>;
}
