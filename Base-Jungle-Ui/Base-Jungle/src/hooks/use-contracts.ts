import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';

// Contract ABIs (simplified - add full ABIs from your artifacts)
const VAULT_ABI = [
    {
        inputs: [{ name: 'assets', type: 'uint256' }, { name: 'receiver', type: 'address' }],
        name: 'deposit',
        outputs: [{ name: 'shares', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'shares', type: 'uint256' }, { name: 'receiver', type: 'address' }, { name: 'owner', type: 'address' }],
        name: 'redeem',
        outputs: [{ name: 'assets', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const POINTS_TRACKER_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'userPoints',
        outputs: [
            { name: 'totalPoints', type: 'uint256' },
            { name: 'lastClaimTimestamp', type: 'uint256' },
            { name: 'pendingDailyPoints', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'redeemPoints',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

// Contract Addresses (from environment or hardcoded for now)
const CONTRACTS = {
    BASE_VAULT: (import.meta.env.VITE_BASE_VAULT_ADDRESS as Address) || '0x0',
    POINTS_TRACKER: '0x0De850d04BC2B9c5315C82b26CB51D43c51A4e4b' as Address, // Hardcoded for testing
};

// Hook: Get vault balance
export function useVaultBalance(userAddress: Address | undefined) {
    return useReadContract({
        address: CONTRACTS.BASE_VAULT,
        abi: VAULT_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get user points
export function useUserPoints(userAddress: Address | undefined) {
    return useReadContract({
        address: CONTRACTS.POINTS_TRACKER,
        abi: POINTS_TRACKER_ABI,
        functionName: 'userPoints',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Deposit into vault
export function useVaultDeposit() {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const deposit = (assets: string, receiver: Address) => {
        writeContract({
            address: CONTRACTS.BASE_VAULT,
            abi: VAULT_ABI,
            functionName: 'deposit',
            args: [parseEther(assets), receiver],
        });
    };

    return {
        deposit,
        isPending,
        isConfirming,
        isSuccess,
        hash,
    };
}

// Hook: Redeem points
export function useRedeemPoints() {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const redeemPoints = (amount: string) => {
        writeContract({
            address: CONTRACTS.POINTS_TRACKER,
            abi: POINTS_TRACKER_ABI,
            functionName: 'redeemPoints',
            args: [parseEther(amount)],
        });
    };

    return {
        redeemPoints,
        isPending,
        isConfirming,
        isSuccess,
        hash,
    };
}
