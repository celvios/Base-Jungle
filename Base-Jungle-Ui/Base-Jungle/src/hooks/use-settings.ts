import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// StrategyController ABI
const STRATEGY_CONTROLLER_ABI = [
    {
        inputs: [{ name: 'autoCompound', type: 'bool' }, { name: 'riskLevel', type: 'uint8' }],
        name: 'setUserSettings',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: '', type: 'address' }],
        name: 'userSettings',
        outputs: [
            { name: 'autoCompound', type: 'bool' },
            { name: 'riskLevel', type: 'uint8' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const STRATEGY_CONTROLLER_ADDRESS = import.meta.env.VITE_STRATEGY_CONTROLLER_ADDRESS as Address;

// Hook: Get user settings from contract
export function useUserSettingsContract(userAddress: Address | undefined) {
    return useReadContract({
        address: STRATEGY_CONTROLLER_ADDRESS,
        abi: STRATEGY_CONTROLLER_ABI,
        functionName: 'userSettings',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });
}

// Hook: Update settings on contract
export function useUpdateSettingsContract() {
    const queryClient = useQueryClient();
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        onSuccess() {
            queryClient.invalidateQueries({ queryKey: ['userSettings'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });

    const updateSettings = (autoCompound: boolean, riskLevel: number) => {
        writeContract({
            address: STRATEGY_CONTROLLER_ADDRESS,
            abi: STRATEGY_CONTROLLER_ABI,
            functionName: 'setUserSettings',
            args: [autoCompound, riskLevel],
        });
    };

    return {
        updateSettings,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
    };
}

// Hook: Update settings in backend (for display preferences, etc.)
export function useUpdateSettingsBackend() {
    const queryClient = useQueryClient();
    const token = localStorage.getItem('auth_token');

    return useMutation({
        mutationFn: async (settings: {
            address: string;
            autoCompound?: boolean;
            riskLevel?: string;
            leverageMultiplier?: number;
        }) => {
            const response = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

// Combined hook: Update settings both on-chain and backend
export function useUpdateSettings(userAddress: Address) {
    const { updateSettings: updateContract, isPending: isContractPending } = useUpdateSettingsContract();
    const { mutateAsync: updateBackend, isPending: isBackendPending } = useUpdateSettingsBackend();

    const updateBoth = async (settings: {
        autoCompound: boolean;
        riskLevel: number; // 0=Low, 1=Medium, 2=High
    }) => {
        // 1. Update on-chain first
        updateContract(settings.autoCompound, settings.riskLevel);

        // 2. Update backend
        await updateBackend({
            address: userAddress,
            autoCompound: settings.autoCompound,
            riskLevel: settings.riskLevel === 0 ? 'LOW' : settings.riskLevel === 1 ? 'MEDIUM' : 'HIGH',
        });
    };

    return {
        updateSettings: updateBoth,
        isPending: isContractPending || isBackendPending,
    };
}
