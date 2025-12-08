import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { USDC_ADDRESS } from '@/constants/tokens';

// ERC20 ABI for USDC approval
const ERC20_ABI = [
    {
        inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
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

// Vault ABI (ERC4626)
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
    {
        inputs: [{ name: 'shares', type: 'uint256' }],
        name: 'convertToAssets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalAssets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getMinimumDeposit',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

// Contract addresses from environment
// USDC_ADDRESS is now imported from constants/tokens.ts (uses Mock USDC)
const BASE_VAULT_ADDRESS = import.meta.env.VITE_BASE_VAULT_ADDRESS as Address;
const CONSERVATIVE_VAULT_ADDRESS = import.meta.env.VITE_CONSERVATIVE_VAULT_ADDRESS as Address;
const AGGRESSIVE_VAULT_ADDRESS = import.meta.env.VITE_AGGRESSIVE_VAULT_ADDRESS as Address;

// Hook: Check USDC allowance
export function useUSDCAllowance(owner: Address | undefined, spender: Address | undefined) {
    return useReadContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: owner && spender ? [owner, spender] : undefined,
        query: {
            enabled: !!owner && !!spender,
        },
    });
}

// Hook: Get USDC balance
export function useUSDCBalance(address: Address | undefined) {
    return useReadContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });
}

// Hook: Approve USDC
export function useApproveUSDC(vaultAddress: Address) {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const approve = (amount: string) => {
        const parsedAmount = parseUnits(amount, 6); // USDC has 6 decimals
        writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [vaultAddress, parsedAmount],
        });
    };

    return {
        approve,
        isPending,
        isConfirming,
        isSuccess,
        hash,
    };
}

// Hook: Deposit into vault
export function useVaultDeposit(vaultAddress: Address) {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Invalidate queries on success
    useEffect(() => {
        if (isSuccess) {
            queryClient.invalidateQueries({ queryKey: ['vaultBalances'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        }
    }, [isSuccess, queryClient]);

    const deposit = (assets: string, receiver: Address) => {
        const parsedAssets = parseUnits(assets, 6); // USDC has 6 decimals
        writeContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'deposit',
            args: [parsedAssets, receiver],
        });
    };

    return {
        deposit,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Withdraw (redeem) from vault
export function useVaultWithdraw(vaultAddress: Address) {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Invalidate queries on success
    useEffect(() => {
        if (isSuccess) {
            queryClient.invalidateQueries({ queryKey: ['vaultBalances'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        }
    }, [isSuccess, queryClient]);

    const withdraw = (shares: string, receiver: Address, owner: Address) => {
        const parsedShares = parseUnits(shares, 18); // Vault shares are 18 decimals
        writeContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: 'redeem',
            args: [parsedShares, receiver, owner],
        });
    };

    return {
        withdraw,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Get vault share balance
export function useVaultShareBalance(vaultAddress: Address, userAddress: Address | undefined) {
    return useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
            refetchInterval: 10000, // Refresh every 10 seconds
        },
    });
}

// Hook: Get vault TVL
export function useVaultTVL(vaultAddress: Address) {
    return useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'totalAssets',
        query: {
            refetchInterval: 30000, // Refresh every 30 seconds
        },
    });
}

// Hook: Get minimum deposit for user
export function useVaultMinimumDeposit(vaultAddress: Address, userAddress: Address | undefined) {
    return useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'getMinimumDeposit',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Helper: Format USDC amount
export function formatUSDC(amount: bigint): string {
    return formatUnits(amount, 6);
}

// Helper: Format vault shares
export function formatShares(shares: bigint): string {
    return formatUnits(shares, 18);
}

// Hook: Get vault balance in USDC (converts shares to assets)
export function useVaultBalance(vaultAddress: Address | undefined, userAddress: Address | undefined) {
    const { data: shares, isLoading: loadingShares } = useVaultShareBalance(vaultAddress!, userAddress);
    const { data: totalAssets, isLoading: loadingAssets } = useVaultTVL(vaultAddress!);

    return useReadContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'convertToAssets',
        args: shares ? [shares] : undefined,
        query: {
            enabled: !!vaultAddress && !!shares && shares > 0n,
            refetchInterval: 10000,
        },
    });
}
