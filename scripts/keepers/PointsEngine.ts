import { ethers } from "ethers";

/**
 * Updated PointsEngine with New Rules:
 * - Minimum hold: 60 days  
 * - Auto-compound: enabled (automatic)
 * - Holding bonus: +50 points every 30 days
 * - New user bonus: 100 points (one-time)
 */

interface StrategyMultipliers {
    [key: string]: number;
}

interface UserDeposit {
    address: string;
    amount: number; // in USD
    strategy: string;
    depositTime: number; // timestamp
    isNewUser: boolean;
}

export class PointsEngine {
    // Strategy multipliers for daily points
    private static readonly STRATEGY_MULTIPLIERS: StrategyMultipliers = {
        moonwell: 1.0,      // Conservative: 1x
        aave: 1.0,          // Conservative: 1x
        compound: 1.0,      // Conservative: 1x
        beefy: 1.2,         // Auto-compound: 1.2x
        aerodrome: 1.5,     // LP Stable: 1.5x
        aerodromeGauge: 1.5,// LP Stable + Staking: 1.5x
        uniswapV3: 2.0,     // LP Volatile: 2x
        leveraged: 3.0,     // Leveraged: 3x
    };

    // Strategy APYs (annual percentage yields)
    private static readonly STRATEGY_APYS: StrategyMultipliers = {
        moonwell: 4.2,
        aave: 3.8,
        compound: 4.0,
        beefy: 6.8,
        aerodrome: 12.5,
        aerodromeGauge: 13.5,
        uniswapV3: 25.0,
        leveraged: 30.0,
    };

    private static readonly MINIMUM_HOLD_DAYS = 60;
    private static readonly HOLDING_BONUS_POINTS = 50;
    private static readonly HOLDING_BONUS_INTERVAL_DAYS = 30;
    private static readonly NEW_USER_BONUS = 100;

    /**
     * Calculate daily points for a user deposit
     */
    static calculateDailyPoints(depositAmount: number, strategy: string): number {
        const multiplier = this.STRATEGY_MULTIPLIERS[strategy] || 1.0;
        // Base: 1 point per $1 per day, times strategy multiplier
        return depositAmount * multiplier;
    }

    /**
     * Calculate daily profit for a deposit (with auto-compound)
     */
    static calculateDailyProfit(depositAmount: number, strategy: string, dayNumber: number = 1): number {
        const apy = this.STRATEGY_APYS[strategy] || 0;
        const dailyRate = apy / 365 / 100; // Convert APY to daily rate

        // With auto-compound: compound daily
        const compounded = depositAmount * Math.pow(1 + dailyRate, dayNumber);
        return compounded - depositAmount;
    }

    /**
     * Calculate total points for a full period (e.g., 60 days)
     */
    static calculateTotalPoints(deposit: UserDeposit, days: number): {
        dailyPoints: number;
        basePoints: number;
        holdingBonuses: number;
        newUserBonus: number;
        totalPoints: number;
    } {
        const dailyPoints = this.calculateDailyPoints(deposit.amount, deposit.strategy);
        const basePoints = dailyPoints * days;

        // Holding bonuses: +50 every 30 days
        const bonusCount = Math.floor(days / this.HOLDING_BONUS_INTERVAL_DAYS);
        const holdingBonuses = bonusCount * this.HOLDING_BONUS_POINTS;

        // New user bonus (one-time)
        const newUserBonus = deposit.isNewUser ? this.NEW_USER_BONUS : 0;

        const totalPoints = basePoints + holdingBonuses + newUserBonus;

        return {
            dailyPoints,
            basePoints,
            holdingBonuses,
            newUserBonus,
            totalPoints,
        };
    }

    /**
     * Calculate total profit for a full period with daily auto-compound
     */
    static calculateTotalProfit(depositAmount: number, strategy: string, days: number): {
        dailyProfit: number;
        totalProfit: number;
        finalBalance: number;
        returnPercent: number;
    } {
        const apy = this.STRATEGY_APYS[strategy] || 0;
        const dailyRate = apy / 365 / 100;

        // Auto-compound daily
        const finalBalance = depositAmount * Math.pow(1 + dailyRate, days);
        const totalProfit = finalBalance - depositAmount;
        const dailyProfit = totalProfit / days;
        const returnPercent = (totalProfit / depositAmount) * 100;

        return {
            dailyProfit,
            totalProfit,
            finalBalance,
            returnPercent,
        };
    }

    /**
     * Generate complete report for a deposit
     */
    static generateReport(deposit: UserDeposit, days: number = 60): void {
        console.log("\n═══════════════════════════════════════════════════════");
        console.log("           POINTS & PROFIT CALCULATION");
        console.log("═══════════════════════════════════════════════════════\n");

        console.log(`Deposit: $${deposit.amount}`);
        console.log(`Strategy: ${deposit.strategy}`);
        console.log(`Period: ${days} days\n`);

        // Points calculation
        const points = this.calculateTotalPoints(deposit, days);
        console.log("─────────────────────────────────────────────────────");
        console.log("POINTS BREAKDOWN:");
        console.log(`  Daily Points: ${points.dailyPoints}/day`);
        console.log(`  Base Points (${days} days): ${points.basePoints}`);
        console.log(`  Holding Bonuses: +${points.holdingBonuses} (${Math.floor(days / 30)}x $50)`);
        if (deposit.isNewUser) {
            console.log(`  New User Bonus: +${points.newUserBonus}`);
        }
        console.log(`  TOTAL POINTS: ${points.totalPoints}`);
        console.log("");

        // Profit calculation
        const profit = this.calculateTotalProfit(deposit.amount, deposit.strategy, days);
        console.log("─────────────────────────────────────────────────────");
        console.log("PROFIT BREAKDOWN (Auto-Compound):");
        console.log(`  Daily Profit (avg): $${profit.dailyProfit.toFixed(4)}`);
        console.log(`  Total Profit: $${profit.totalProfit.toFixed(2)}`);
        console.log(`  Final Balance: $${profit.finalBalance.toFixed(2)}`);
        console.log(`  Return: ${profit.returnPercent.toFixed(2)}%`);
        console.log("═══════════════════════════════════════════════════════\n");
    }

    /**
     * Example: Compare all strategies for a $100 deposit over 60 days
     */
    static compareStrategies(depositAmount: number = 100, days: number = 60): void {
        const strategies = Object.keys(this.STRATEGY_APYS);

        console.log("\n═══════════════════════════════════════════════════════");
        console.log(`      STRATEGY COMPARISON - $${depositAmount} for ${days} days`);
        console.log("═══════════════════════════════════════════════════════\n");

        const results: any[] = [];

        for (const strategy of strategies) {
            const deposit: UserDeposit = {
                address: "0x...",
                amount: depositAmount,
                strategy,
                depositTime: Date.now(),
                isNewUser: true,
            };

            const points = this.calculateTotalPoints(deposit, days);
            const profit = this.calculateTotalProfit(depositAmount, strategy, days);

            results.push({
                strategy,
                points: points.totalPoints,
                profit: profit.totalProfit,
                returnPercent: profit.returnPercent,
                apy: this.STRATEGY_APYS[strategy],
            });
        }

        // Sort by return percent
        results.sort((a, b) => b.returnPercent - a.returnPercent);

        console.log("Strategy          | Total Points | Profit   | Return  | APY");
        console.log("------------------|--------------|----------|---------|-------");
        results.forEach(r => {
            const strategyPadded = r.strategy.padEnd(17);
            const pointsPadded = r.points.toString().padEnd(12);
            const profitPadded = `$${r.profit.toFixed(2)}`.padEnd(8);
            const returnPadded = `${r.returnPercent.toFixed(2)}%`.padEnd(7);
            const apyPadded = `${r.apy}%`;
            console.log(`${strategyPadded} | ${pointsPadded} | ${profitPadded} | ${returnPadded} | ${apyPadded}`);
        });

        console.log("\n═══════════════════════════════════════════════════════\n");
    }
}

// Run examples if executed directly
if (require.main === module) {
    // Example 1: Aerodrome LP with $100 for 60 days
    const exampleDeposit: UserDeposit = {
        address: "0x1234...",
        amount: 100,
        strategy: "aerodrome",
        depositTime: Date.now(),
        isNewUser: true,
    };

    PointsEngine.generateReport(exampleDeposit, 60);

    // Example 2: Compare all strategies
    PointsEngine.compareStrategies(100, 60);
}

export default PointsEngine;
