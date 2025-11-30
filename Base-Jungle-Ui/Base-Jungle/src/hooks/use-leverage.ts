import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';

// LeverageController ABI
const LEVERAGE_CONTROLLER_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'isLeverageUnlocked',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'multiplier', type: 'uint8' }],
        name: 'activateLeverage',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'deactivateLeverage',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getCurrentLeverage',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getMaxLeverage',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const LEVERAGE_CONTROLLER_ADDRESS = import.meta.env.VITE_LEVERAGE_CONTROLLER_ADDRESS as Address;

// Hook: Check if leverage is unlocked
export function useLeverageUnlocked(userAddress: Address | undefined) {
    return useReadContract({
        address: LEVERAGE_CONTROLLER_ADDRESS,
        abi: LEVERAGE_CONTROLLER_ABI,
        functionName: 'isLeverageUnlocked',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get current leverage multiplier
export function useCurrentLeverage(userAddress: Address | undefined) {
    return useReadContract({
        address: LEVERAGE_CONTROLLER_ADDRESS,
        abi: LEVERAGE_CONTROLLER_ABI,
        functionName: 'getCurrentLeverage',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get max allowed leverage (based on tier)
export function useMaxLeverage(userAddress: Address | undefined) {
    return useReadContract({
        address: LEVERAGE_CONTROLLER_ADDRESS,
        abi: LEVERAGE_CONTROLLER_ABI,
        functionName: 'getMaxLeverage',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Activate leverage
export function useActivateLeverage() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['currentLeverage'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    const activate = (multiplier: number) => {
        // Multiplier must be 2, 3, or 5
        if (![2, 3, 5].includes(multiplier)) {
            throw new Error('Invalid leverage multiplier. Must be 2, 3, or 5.');
        }

        writeContract({
            address: LEVERAGE_CONTROLLER_ADDRESS,
            abi: LEVERAGE_CONTROLLER_ABI,
            functionName: 'activateLeverage',
            args: [multiplier],
        });
    };

    return {
        activate,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Deactivate leverage
export function useDeactivateLeverage() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['currentLeverage'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    const deactivate = () => {
        writeContract({
            address: LEVERAGE_CONTROLLER_ADDRESS,
            abi: LEVERAGE_CONTROLLER_ABI,
            functionName: 'deactivateLeverage',
        });
    };

    return {
        deactivate,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Combined hook for leverage management
export function useLeverageManager(userAddress: Address | undefined) {
    const { data: isUnlocked, isLoading: isLoadingUnlocked } = useLeverageUnlocked(userAddress);
    const { data: currentMultiplier, isLoading: isLoadingCurrent } = useCurrentLeverage(userAddress);
    const { data: maxMultiplier, isLoading: isLoadingMax } = useMaxLeverage(userAddress);
    const { activate, isPending: isActivating } = useActivateLeverage();
    const { deactivate, isPending: isDeactivating } = useDeactivateLeverage();

    return {
        isUnlocked: isUnlocked || false,
        currentMultiplier: currentMultiplier || 1,
        maxMultiplier: maxMultiplier || 1,
        isActive: currentMultiplier !== undefined && currentMultiplier > 1,
        activate,
        deactivate,
        isLoading: isLoadingUnlocked || isLoadingCurrent || isLoadingMax,
        isPending: isActivating || isDeactivating,
    };
}
