// Add this to RebalanceKeeper.ts after the addUser method around line 284

/**
 * Remove user from tracking
 */
removeUser(userAddress: string): void {
    if(this.trackedUsers.has(userAddress)) {
    this.trackedUsers.delete(userAddress);
    console.log(`➖ Removed user from tracking: ${sanitizeAddress(userAddress)}`);
}
    }

    /**
     * Subscribe to blockchain events for automatic user tracking
     */
    private subscribeToEvents(): void {
    if(this.isListening) return;

    console.log('📡 Starting event listeners...');

    // Listen to PositionOpened events
    this.leverageManager.on('PositionOpened', (user: string, deposit: bigint, leverage: bigint) => {
        console.log(`\n📍 New position opened by ${sanitizeAddress(user)}`);
        this.addUser(user);
    });

    // Listen to PositionClosed events
    this.leverageManager.on('PositionClosed', (user: string, withdrawn: bigint) => {
        console.log(`\n👋 Position closed by ${sanitizeAddress(user)}`);
        this.removeUser(user);
    });

    // Listen to TierChanged events for strategy rebalancing
    this.referralManager.on('TierChanged', async (user: string, newTier: number) => {
        console.log(`\n⬆️ Tier changed for ${sanitizeAddress(user)} to ${newTier}`);

        try {
            const needsRebalance = await this.strategyController.needsRebalance(user);
            if (needsRebalance) {
                console.log(`   🔄 Triggering strategy rebalance due to tier change...`);
                await this.triggerStrategyRebalance(user);
            }
        } catch (error: any) {
            console.error(`   ❌ Error checking strategy rebalance:`, error?.message || error);
        }
    });

    this.isListening = true;
    console.log('✅ Event listeners active\n');
}

    /**
     * Trigger strategy rebalance for tier change
     */
    private async triggerStrategyRebalance(user: string): Promise < void> {
    try {
        const gasEstimate = await this.strategyController.rebalance.estimateGas(user);
        const gasLimit = gasEstimate + (gasEstimate * 20n / 100n);

        const tx = await this.strategyController.rebalance(user, { gasLimit });
        console.log(`   📤 Strategy rebalance tx: ${tx.hash}`);

        const receipt = await tx.wait(2);
        if(receipt?.status === 1) {
    console.log(`   ✅ Strategy rebalance successful`);
}
        } catch (error: any) {
    console.error(`   ❌ Strategy rebalance failed:`, error?.message || error);
}
    }

// Replace the addUser method implementation (lines 274-284) with:

addUser(userAddress: string): void {
    // Validate address
    if(!ethers.isAddress(userAddress)) {
    throw new Error(`Invalid Ethereum address: ${userAddress}`);
}

if (!this.trackedUsers.has(userAddress)) {
    this.trackedUsers.add(userAddress);
    console.log(`➕ Added user to tracking: ${sanitizeAddress(userAddress)}`);
}
    }
