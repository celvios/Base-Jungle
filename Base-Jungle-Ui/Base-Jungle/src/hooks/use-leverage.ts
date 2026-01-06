import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useUserTier } from './use-referrals';


// LeverageManager ABI (matching deployed contract)
const LEVERAGE_MANAGER_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'positions',
        outputs: [
            { name: 'user', type: 'address' },
            { name: 'initialDeposit', type: 'uint256' },
            { name: 'totalDeposited', type: 'uint256' },
            { name: 'totalBorrowed', type: 'uint256' },
            { name: 'currentLeverage', type: 'uint256' },
            { name: 'timestamp', type: 'uint256' },
            { name: 'active', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'tier', type: 'uint8' }],
        name: 'tierLeverage',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'depositAmount', type: 'uint256' }],
        name: 'openPosition',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'closePosition',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getHealthFactor',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getPositionHealth',
        outputs: [
            { name: 'healthFactor', type: 'uint256' },
            { name: 'collateralValue', type: 'uint256' },
            { name: 'borrowValue', type: 'uint256' },
            { name: 'availableToBorrow', type: 'uint256' },
            { name: 'isHealthy', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const LEVERAGE_MANAGER_ADDRESS = import.meta.env.VITE_LEVERAGE_CONTROLLER_ADDRESS as Address;

// Hook: Get user's position
export function useUserPosition(userAddress: Address | undefined) {
    return useReadContract({
        address: LEVERAGE_MANAGER_ADDRESS,
        abi: LEVERAGE_MANAGER_ABI,
        functionName: 'positions',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get tier leverage limit
export function useTierLeverage(tier: number | undefined) {
    return useReadContract({
        address: LEVERAGE_MANAGER_ADDRESS,
        abi: LEVERAGE_MANAGER_ABI,
        functionName: 'tierLeverage',
        args: tier !== undefined ? [tier] : undefined,
        query: {
            enabled: tier !== undefined,
        },
    });
}

// Hook: Get position health
export function usePositionHealth(userAddress: Address | undefined) {
    return useReadContract({
        address: LEVERAGE_MANAGER_ADDRESS,
        abi: LEVERAGE_MANAGER_ABI,
        functionName: 'getPositionHealth',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Open leveraged position
export function useOpenPosition() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            queryClient.invalidateQueries({ queryKey: ['positionHealth'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    const openPosition = (depositAmount: bigint) => {
        writeContract({
            address: LEVERAGE_MANAGER_ADDRESS,
            abi: LEVERAGE_MANAGER_ABI,
            functionName: 'openPosition',
            args: [depositAmount],
        });
    };

    return {
        openPosition,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Close leveraged position
export function useClosePosition() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            queryClient.invalidateQueries({ queryKey: ['positionHealth'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    const closePosition = () => {
        writeContract({
            address: LEVERAGE_MANAGER_ADDRESS,
            abi: LEVERAGE_MANAGER_ABI,
            functionName: 'closePosition',
        });
    };

    return {
        closePosition,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Combined hook for leverage management
export function useLeverageManager(userAddress: Address | undefined) {
    // Automatically fetch user tier
    const { data: userTier } = useUserTier(userAddress);

    const { data: position, isLoading: isLoadingPosition } = useUserPosition(userAddress);
    const { data: tierLeverageLimit, isLoading: isLoadingTier } = useTierLeverage(userTier);
    const { data: health, isLoading: isLoadingHealth } = usePositionHealth(userAddress);
    const { openPosition, isPending: isOpening } = useOpenPosition();
    const { closePosition, isPending: isClosing } = useClosePosition();

    // Convert basis points to multiplier (10000 = 1x, 20000 = 2x, etc.)
    const maxMultiplier = tierLeverageLimit ? Number(tierLeverageLimit) / 10000 : 1;
    const currentMultiplier = position?.currentLeverage ? Number(position.currentLeverage) / 10000 : 1;
    const isActive = position?.active || false;

    // Leverage is unlocked if tier allows more than 1x (i.e., not Novice tier)
    const isUnlocked = maxMultiplier > 1;

    return {
        // Position data
        position: position ? {
            user: position.user,
            initialDeposit: position.initialDeposit,
            totalDeposited: position.totalDeposited,
            totalBorrowed: position.totalBorrowed,
            currentLeverage: position.currentLeverage,
            timestamp: position.timestamp,
            active: position.active,
        } : null,

        // Health data
        health: health ? {
            healthFactor: health.healthFactor,
            collateralValue: health.collateralValue,
            borrowValue: health.borrowValue,
            availableToBorrow: health.availableToBorrow,
            isHealthy: health.isHealthy,
        } : null,

        // Computed values
        isUnlocked,
        currentMultiplier,
        maxMultiplier,
        isActive,

        // Actions
        openPosition,
        closePosition,

        // Loading states
        isLoading: isLoadingPosition || isLoadingTier || isLoadingHealth,
        isPending: isOpening || isClosing,
    };
}
