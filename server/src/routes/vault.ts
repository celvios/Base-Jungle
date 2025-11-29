import express from 'express';
import {
    getVaultPosition,
    getUserDepositHistory,
    getUserWithdrawalHistory,
    trackDeposit,
    trackWithdrawal
} from '../services/vault-tracking';

export const vaultRouter = express.Router();

/**
 * GET /api/vault/:vaultAddress/user/:userAddress/position
 * Get user's position in a vault with principal/yield breakdown
 */
vaultRouter.get('/:vaultAddress/user/:userAddress/position', async (req, res) => {
    try {
        const { vaultAddress, userAddress } = req.params;
        const { currentShares, currentValue } = req.query;

        if (!currentShares || !currentValue) {
            return res.status(400).json({
                success: false,
                error: 'Missing required query params: currentShares, currentValue'
            });
        }

        const shares = parseFloat(currentShares as string);
        const value = parseFloat(currentValue as string);

        const position = await getVaultPosition(
            userAddress.toLowerCase(),
            vaultAddress.toLowerCase(),
            shares,
            value
        );

        if (!position) {
            return res.json({
                success: true,
                position: null,
                message: 'No deposits found for this vault'
            });
        }

        res.json({
            success: true,
            position: {
                initialDeposit: position.initialDeposit,
                currentValue: position.currentValue,
                totalYield: position.totalYield,
                principal: position.initialDeposit,
                yield: position.totalYield,
                depositDate: position.depositDate,
                daysStaked: position.daysStaked,
            }
        });
    } catch (error: any) {
        console.error('Get vault position error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/vault/:vaultAddress/user/:userAddress/deposits
 * Get deposit history
 */
vaultRouter.get('/:vaultAddress/user/:userAddress/deposits', async (req, res) => {
    try {
        const { vaultAddress, userAddress } = req.params;

        const deposits = await getUserDepositHistory(
            userAddress.toLowerCase(),
            vaultAddress.toLowerCase()
        );

        res.json({
            success: true,
            deposits
        });
    } catch (error: any) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/vault/:vaultAddress/user/:userAddress/withdrawals
 * Get withdrawal history
 */
vaultRouter.get('/:vaultAddress/user/:userAddress/withdrawals', async (req, res) => {
    try {
        const { vaultAddress, userAddress } = req.params;

        const withdrawals = await getUserWithdrawalHistory(
            userAddress.toLowerCase(),
            vaultAddress.toLowerCase()
        );

        res.json({
            success: true,
            withdrawals
        });
    } catch (error: any) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/vault/track-deposit
 * Track a new deposit (called by event listener or user)
 */
vaultRouter.post('/track-deposit', async (req, res) => {
    try {
        const { userAddress, vaultAddress, amount, shares, timestamp, txHash } = req.body;

        if (!userAddress || !vaultAddress || !amount || !shares || !timestamp || !txHash) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        await trackDeposit(
            userAddress.toLowerCase(),
            vaultAddress.toLowerCase(),
            parseFloat(amount),
            parseFloat(shares),
            parseInt(timestamp),
            txHash
        );

        res.json({
            success: true,
            message: 'Deposit tracked successfully'
        });
    } catch (error: any) {
        console.error('Track deposit error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/vault/track-withdrawal
 * Track a withdrawal (called by event listener or user)
 */
vaultRouter.post('/track-withdrawal', async (req, res) => {
    try {
        const {
            userAddress,
            vaultAddress,
            sharesBurned,
            assetsReceived,
            timestamp,
            txHash,
            wasMature,
            penalty
        } = req.body;

        if (!userAddress || !vaultAddress || !sharesBurned || !assetsReceived || !timestamp || !txHash) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        await trackWithdrawal(
            userAddress.toLowerCase(),
            vaultAddress.toLowerCase(),
            parseFloat(sharesBurned),
            parseFloat(assetsReceived),
            parseInt(timestamp),
            txHash,
            Boolean(wasMature),
            parseFloat(penalty) || 0
        );

        res.json({
            success: true,
            message: 'Withdrawal tracked successfully'
        });
    } catch (error: any) {
        console.error('Track withdrawal error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
