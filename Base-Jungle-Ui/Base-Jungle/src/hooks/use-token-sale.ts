import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';

// TokenSale ABI
const TOKEN_SALE_ABI = [
    {
        inputs: [{ name: 'usdcAmount', type: 'uint256' }],
        name: 'purchase',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'claim',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'userAddress', type: 'address' }],
        name: 'getClaimableAmount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '', type: 'address' }],
        name: 'userInfo',
        outputs: [
            { name: 'totalPurchased', type: 'uint256' },
            { name: 'totalClaimed', type: 'uint256' },
            { name: 'usdcSpent', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalRaised',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'hardCap',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'saleFinalized',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const TOKEN_SALE_ADDRESS = import.meta.env.VITE_TOKEN_SALE_ADDRESS as Address;

// Hook: Get user purchase info
export function useUserPurchaseInfo(userAddress: Address | undefined) {
    return useReadContract({
        address: TOKEN_SALE_ADDRESS,
        abi: TOKEN_SALE_ABI,
        functionName: 'userInfo',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Get claimable tokens
export function useClaimableTokens(userAddress: Address | undefined) {
    return useReadContract({
        address: TOKEN_SALE_ADDRESS,
        abi: TOKEN_SALE_ABI,
        functionName: 'getClaimableAmount',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
            refetchInterval: 60000, // Refresh every minute
        },
    });
}

// Hook: Get total raised
export function useTotalRaised() {
    return useReadContract({
        address: TOKEN_SALE_ADDRESS,
        abi: TOKEN_SALE_ABI,
        functionName: 'totalRaised',
        query: {
            refetchInterval: 30000,
        },
    });
}

// Hook: Check if sale finalized
export function useSaleFinalized() {
    return useReadContract({
        address: TOKEN_SALE_ADDRESS,
        abi: TOKEN_SALE_ABI,
        functionName: 'saleFinalized',
    });
}

// Hook: Purchase tokens
export function usePurchaseTokens() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['userPurchaseInfo'] });
            queryClient.invalidateQueries({ queryKey: ['totalRaised'] });
        },
    });

    const purchase = (usdcAmount: string) => {
        const parsedAmount = parseUnits(usdcAmount, 6); // USDC 6 decimals
        writeContract({
            address: TOKEN_SALE_ADDRESS,
            abi: TOKEN_SALE_ABI,
            functionName: 'purchase',
            args: [parsedAmount],
        });
    };

    return {
        purchase,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Claim vested tokens
export function useClaimTokens() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['userPurchaseInfo'] });
            queryClient.invalidateQueries({ queryKey: ['claimableTokens'] });
        },
    });

    const claim = () => {
        writeContract({
            address: TOKEN_SALE_ADDRESS,
            abi: TOKEN_SALE_ABI,
            functionName: 'claim',
        });
    };

    return {
        claim,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Helper: Format token amount (18 decimals)
export function formatTokens(amount: bigint): string {
    return formatUnits(amount, 18);
}
