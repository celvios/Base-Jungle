import { ponder } from "@/generated";

// PointsTracker: PointsAwarded event
ponder.on("PointsTracker:PointsAwarded", async ({ event, context }) => {
    const { PointsEvent } = context.db;

    const userAddress = event.args.user.toLowerCase();
    const points = Number(event.args.points);
    const source = event.args.source;

    // Log points award
    await PointsEvent.create({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        data: {
            walletAddress: userAddress,
            amount: points,
            source: source.toLowerCase(),
            txHash: event.transaction.hash,
            createdAt: Number(event.block.timestamp),
        },
    });
});
