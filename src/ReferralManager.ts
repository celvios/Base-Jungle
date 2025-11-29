import { ponder } from "@/generated";

// ReferralManager: ReferralRegistered event
ponder.on("ReferralManager:ReferralRegistered", async ({ event, context }) => {
    const { User, Referral, PointsEvent } = context.db;

    const referrer = event.args.referrer.toLowerCase();
    const referee = event.args.referee.toLowerCase();

    // Create or update referee user
    await User.upsert({
        id: referee,
        create: {
            referralCode: referee.slice(2, 12).toUpperCase(),
            referredBy: referrer,
            tier: 0,
            autoCompound: true,
            riskLevel: 0,
            leverageActive: false,
            leverageMultiplier: 1,
            createdAt: Number(event.block.timestamp),
            lastActiveAt: Number(event.block.timestamp),
        },
        update: {
            referredBy: referrer,
            lastActiveAt: Number(event.block.timestamp),
        },
    });

    // Create direct referral (level 1)
    await Referral.create({
        id: `${referrer}-${referee}`,
        data: {
            referrer,
            referee,
            level: 1,
            isActive: true,
            totalDeposited: 0n,
            createdAt: Number(event.block.timestamp),
        },
    });

    // Award referral bonus points to referrer
    await PointsEvent.create({
        id: `${event.transaction.hash}-${event.log.logIndex}-referrer`,
        data: {
            walletAddress: referrer,
            amount: 100, // 100 points for new referral
            source: "referral",
            txHash: event.transaction.hash,
            createdAt: Number(event.block.timestamp),
        },
    });

    // Check if referrer has a parent (indirect referral - level 2)
    const referrerUser = await User.findUnique({ id: referrer });
    if (referrerUser?.referredBy) {
        const grandParent = referrerUser.referredBy;

        await Referral.create({
            id: `${grandParent}-${referee}-indirect`,
            data: {
                referrer: grandParent,
                referee,
                level: 2,
                isActive: true,
                totalDeposited: 0n,
                createdAt: Number(event.block.timestamp),
            },
        });

        // Award indirect referral bonus
        await PointsEvent.create({
            id: `${event.transaction.hash}-${event.log.logIndex}-grandparent`,
            data: {
                walletAddress: grandParent,
                amount: 50, // 50 points for indirect referral
                source: "referral",
                txHash: event.transaction.hash,
                createdAt: Number(event.block.timestamp),
            },
        });
    }
});

// ReferralManager: TierChanged event
ponder.on("ReferralManager:TierChanged", async ({ event, context }) => {
    const { User, PointsEvent } = context.db;

    const userAddress = event.args.user.toLowerCase();
    const newTier = Number(event.args.newTier);

    // Update user tier
    await User.update({
        id: userAddress,
        data: {
            tier: newTier,
            lastActiveAt: Number(event.block.timestamp),
        },
    });

    // Award bonus points for tier upgrade
    const tierBonus = [0, 250, 500, 1000]; // Novice, Scout, Captain, Whale
    await PointsEvent.create({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        data: {
            walletAddress: userAddress,
            amount: tierBonus[newTier] || 0,
            source: "tier_upgrade",
            txHash: event.transaction.hash,
            createdAt: Number(event.block.timestamp),
        },
    });
});
