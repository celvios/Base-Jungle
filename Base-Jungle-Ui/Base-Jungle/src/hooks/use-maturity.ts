import { useReadContract } from 'wagmi';
import { Address } from 'viem';

const MATURITY_PERIOD = 60 * 24 * 60 * 60; // 60 days in seconds (matches smart contracts)

// Simple ABI for reading deposit timestamp
const VAULT_ABI = [
    {
        name: 'depositTimestamp',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'lastDepositTime',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

interface MaturityInfo {
    isMature: boolean;
    daysRemaining: number;
    depositTime: number | null;
    maturityDate: Date | null;
    isLoading: boolean;
}

/**
 * Check if a user's deposit has matured (60 days)
 * Works with both BaseVault (depositTimestamp) and YieldVault (lastDepositTime)
 */
export function useDepositMaturity(
    vaultAddress: Address | undefined,
    userAddress: Address | undefined
): MaturityInfo {
    // Try depositTimestamp first (BaseVault)
    const { data: depositTimestamp, isLoading: loading1 } = useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'depositTimestamp',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!vaultAddress && !!userAddress,
        },
    });

    // Try lastDepositTime as fallback (YieldVault)
    const { data: lastDepositTime, isLoading: loading2 } = useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'lastDepositTime',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!vaultAddress && !!userAddress,
        },
    });

    const isLoading = loading1 || loading2;

    // Use whichever timestamp is available
    const depositTime = depositTimestamp || lastDepositTime;

    if (!depositTime || depositTime === 0n) {
        return {
            isMature: false,
            daysRemaining: 60,
            depositTime: null,
            maturityDate: null,
            isLoading,
        };
    }

    const depositTimeSec = Number(depositTime);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceDeposit = currentTime - depositTimeSec;
    const maturityTime = depositTimeSec + MATURITY_PERIOD;

    const isMature = timeSinceDeposit >= MATURITY_PERIOD;
    const secondsRemaining = Math.max(0, maturityTime - currentTime);
    const daysRemaining = Math.ceil(secondsRemaining / 86400);

    return {
        isMature,
        daysRemaining,
        depositTime: depositTimeSec,
        maturityDate: new Date(maturityTime * 1000),
        isLoading,
    };
}

/**
 * Calculate early withdrawal penalty (if deposit is immature)
 * Based on vault smart contract logic:
 * - 10% penalty on PRINCIPAL (not yield)
 * - Yield is forfeited entirely
 * - Bonus points are lost
 */
export function calculateEarlyWithdrawalPenalty(
    principalAmount: number,
    isMature: boolean
): number {
    if (isMature) return 0;

    // 10% penalty on principal if withdrawn early
    return principalAmount * 0.10;
}
