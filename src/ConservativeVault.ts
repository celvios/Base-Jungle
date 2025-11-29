import { ponder } from "@/generated";
import { randomUUID } from "crypto";

// ConservativeVault: Deposited event
ponder.on("ConservativeVault:Deposited", async ({ event, context }) => {
    const { User, VaultPosition, PointsEvent } = context.db;

    const userAddress = event.args.user.toLowerCase();
    const assets = event.args.assets;
    const shares = event.args.shares;

    // Create or update user
    await User.upsert({
        id: userAddress,
        create: {
            referralCode: userAddress.slice(2, 12).toUpperCase(), // Generate unique code
            tier: 0, // Novice by default
            autoCompound: true,
            riskLevel: 0,
            leverageActive: false,
            leverageMultiplier: 1,
            createdAt: Number(event.block.timestamp),
            lastActiveAt: Number(event.block.timestamp),
        },
        update: {
            lastActiveAt: Number(event.block.timestamp),
        },
    });

    // Create vault position
    await VaultPosition.create({
        id: randomUUID(),
        data: {
            userAddress,
            vaultAddress: event.log.address.toLowerCase(),
            vaultType: "conservative",
            principal: assets,
            shares,
            depositedAt: Number(event.block.timestamp),
            isActive: true,
            depositTxHash: event.transaction.hash,
        },
    });

    // Award points for deposit
    await PointsEvent.create({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        data: {
            walletAddress: userAddress,
            amount: Math.floor(Number(assets) / 1e6 / 100), // 1 point per $100
            source: "deposit",
            txHash: event.transaction.hash,
            createdAt: Number(event.block.timestamp),
        },
    });
});

// ConservativeVault: Withdrawn event
ponder.on("ConservativeVault:Withdrawn", async ({ event, context }) => {
    const { VaultPosition, PointsEvent } = context.db;

    const userAddress = event.args.user.toLowerCase();
    const shares = event.args.shares;

    // Find and deactivate the position
    const positions = await VaultPosition.findMany({
        where: {
            userAddress,
            vaultAddress: event.log.address.toLowerCase(),
            isActive: true,
        },
    });

    for (const position of positions.items) {
        await VaultPosition.update({
            id: position.id,
            data: {
                isActive: false,
            },
        });
    }

    // Award points for harvest (if yield was generated)
    const yieldAmount = event.args.assets - event.args.shares; // Simplified
    if (yieldAmount > 0n) {
        await PointsEvent.create({
            id: `${event.transaction.hash}-${event.log.logIndex}`,
            data: {
                walletAddress: userAddress,
                amount: Math.floor(Number(yieldAmount) / 1e6 / 100),
                source: "harvest",
                txHash: event.transaction.hash,
                createdAt: Number(event.block.timestamp),
            },
        });
    }
});

// ConservativeVault: YieldHarvested event (if exists in ABI)
ponder.on("ConservativeVault:YieldHarvested", async ({ event, context }) => {
    const { VaultPosition, PointsEvent } = context.db;

    const userAddress = event.args.user.toLowerCase();
    const yieldAmount = event.args.amount;

    // Update last harvest time
    const positions = await VaultPosition.findMany({
        where: {
            userAddress,
            vaultAddress: event.log.address.toLowerCase(),
            isActive: true,
        },
    });

    for (const position of positions.items) {
        await VaultPosition.update({
            id: position.id,
            data: {
                lastHarvestAt: Number(event.block.timestamp),
            },
        });
    }

    // Award harvest points
    await PointsEvent.create({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        data: {
            walletAddress: userAddress,
            amount: Math.floor(Number(yieldAmount) / 1e6 / 100),
            source: "harvest",
            txHash: event.transaction.hash,
            createdAt: Number(event.block.timestamp),
        },
    });
});
