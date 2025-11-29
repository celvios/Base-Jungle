import { createConfig } from "@ponder/core";
import { http } from "viem";

import { BaseVaultAbi } from "./abis/BaseVaultAbi";
import { ReferralManagerAbi } from "./abis/ReferralManagerAbi";
import { StrategyControllerAbi } from "./abis/StrategyControllerAbi";
import { PointsTrackerAbi } from "./abis/PointsTrackerAbi";

export default createConfig({
    database: {
        kind: "postgres",
        connectionString: process.env.DATABASE_URL || "postgresql://basejungle:basejungle_dev_pass@localhost:5432/basejungle",
    },
    networks: {
        baseSepolia: {
            chainId: 84532,
            transport: http(process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org"),
        },
    },
    contracts: {
        ConservativeVault: {
            abi: BaseVaultAbi,
            network: "baseSepolia",
            address: "0x986ca22e9f0A6104AAdea7C2698317A690045D13",
            startBlock: 18000000, // Adjust to actual deployment block
        },
        AggressiveVault: {
            abi: BaseVaultAbi,
            network: "baseSepolia",
            address: "0x7eD340313599090b25fA1F6F21671FE0210808E8",
            startBlock: 18000000,
        },
        ReferralManager: {
            abi: ReferralManagerAbi,
            network: "baseSepolia",
            address: "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15",
            startBlock: 18000000,
        },
        StrategyController: {
            abi: StrategyControllerAbi,
            network: "baseSepolia",
            address: "0x65CD6764A4f574c1F6154518519925277C6CFF81",
            startBlock: 18000000,
        },
        PointsTracker: {
            abi: PointsTrackerAbi,
            network: "baseSepolia",
            address: "0x3dEDE79F6aD12973e723e67071F17e5C42A93173",
            startBlock: 18000000,
        },
    },
});
