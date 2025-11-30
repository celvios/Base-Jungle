import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Vault Statistics Schema
export interface VaultStat {
  id: string;
  label: string;
  value: string;
  change?: string;
  icon: string;
}

// Referral Tier Schema
export interface ReferralTier {
  id: string;
  name: string;
  requirement: string;
  pointMultiplier: string;
  maxLeverage: string;
  benefits: string[];
  minReferrals: number;
}

// Strategy Schema
export interface Strategy {
  id: string;
  name: string;
  description: string;
  apyRange: string;
  features: string[];
  icon: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Token Sale Data Schema
export interface TokenSaleData {
  totalCap: string;
  raised: string;
  softCap: string;
  hardCap: string;
  progress: number;
  endsAt: Date;
}

// Staking Multiplier Schema
export interface StakingMultiplier {
  duration: string;
  multiplier: string;
  withdrawalPolicy: string;
}
