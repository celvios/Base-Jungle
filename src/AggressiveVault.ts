import { ponder } from "@/generated";
import { randomUUID } from "crypto";

// AggressiveVault: Deposited event
ponder.on("AggressiveVault:Deposited", async ({ event, context }) => {
    const { User, VaultPosition, PointsEvent } = context.db;

    const userAddress = event.args.user.toLowerCase();
    const assets = event.args.assets;
    const shares = event.args.shares;

    // Create or update user
    await User.upsert({
        id: userAddress,
        create: {
            referralCode: userAddress.slice(2, 12).toUpperCase(),
            tier: 0,
            autoCompound: true,
            riskLevel: 1, // Medium risk for aggressive vault
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
            vaultType: "aggressive",
            principal: assets,
            shares,
            depositedAt: Number(event.block.timestamp),
            isActive: true,
            depositTxHash: event.transaction.hash,
        },
    });

    // Award bonus points for aggressive vault (1.5x multiplier)
    await PointsEvent.create({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        data: {
            walletAddress: userAddress,
            amount: Math.floor((Number(assets) / 1e6 / 100) * 1.5),
            source: "deposit",
            txHash: event.transaction.hash,
            createdAt: Number(event.block.timestamp),
        },
    });
});

// AggressiveVault: Withdrawn event
ponder.on("AggressiveVault:Withdrawn", async ({ event, context }) => {
    const { VaultPosition, PointsEvent } = context.db;

    const userAddress = event.args.user.toLowerCase();

    // Deactivate positions
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

    // Award points for yield
    const yieldAmount = event.args.assets - event.args.shares;
    if (yieldAmount > 0n) {
        await PointsEvent.create({
            id: `${event.transaction.hash}-${event.log.logIndex}`,
            data: {
                walletAddress: userAddress,
                amount: Math.floor((Number(yieldAmount) / 1e6 / 100) * 1.5), // 1.5x for aggressive
                source: "harvest",
                txHash: event.transaction.hash,
                createdAt: Number(event.block.timestamp),
            },
        });
    }
});
