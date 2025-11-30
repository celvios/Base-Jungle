import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import authRouter from "./auth";
import settingsRouter from "./settings";
import apiRouter from "./api";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware for SIWE
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'base-jungle-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Mount authentication routes
  app.use('/api/auth', authRouter);
  app.use('/api', settingsRouter);
  app.use('/api', apiRouter); // Portfolio, market, referrals, points

  // Vault Statistics
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getVaultStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vault statistics" });
    }
  });

  // Referral Tiers
  app.get("/api/referral-tiers", async (_req, res) => {
    try {
      const tiers = await storage.getReferralTiers();
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch referral tiers" });
    }
  });

  // Strategies
  app.get("/api/strategies", async (_req, res) => {
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  // Token Sale Data
  app.get("/api/token-sale", async (_req, res) => {
    try {
      const saleData = await storage.getTokenSaleData();
      res.json(saleData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch token sale data" });
    }
  });

  // Staking Multipliers
  app.get("/api/staking-multipliers", async (_req, res) => {
    try {
      const multipliers = await storage.getStakingMultipliers();
      res.json(multipliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staking multipliers" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
