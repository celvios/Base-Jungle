# Base Jungle - Passive DeFi Aggregator

## Overview

Base Jungle is a passive DeFi aggregation protocol on the Base blockchain. It allows users to deposit assets into automated Master Vaults that manage trading, rebalancing, and compounding through intelligent strategy allocation. The platform includes a points-based reward system, automated leverage, and a tiered referral matrix that boosts leverage and reward multipliers.

This project is a full-stack web application, featuring a React frontend with shadcn/ui and an Express.js backend, serving as a landing page and marketing site for the DeFi protocol.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The design emphasizes a dark, premium Web3/DeFi aesthetic, drawing inspiration from DeXe and Gravitas protocols. It utilizes a custom HSL-based color palette for light/dark mode, Inter and JetBrains Mono fonts, and a responsive, mobile-first approach with adaptive grid layouts. Accessibility is ensured through Radix UI primitives and comprehensive keyboard navigation support. Key interactive elements include hover-elevate effects and smooth, transform-based animations.

### Technical Implementations
**Frontend:** Built with React 18 and TypeScript, using Vite for fast development. Styling is managed with Tailwind CSS and the shadcn/ui component library, leveraging Radix UI for accessible foundations. State management uses TanStack Query for server state and React Context for themes. Wouter handles client-side routing. A custom `WalletContext` manages wallet connections, designed for future Web3 integration.
**Backend:** An Express.js server, written in TypeScript, provides RESTful API endpoints. It currently uses in-memory mock data (MemStorage) but is designed for seamless migration to a database.
**Data Storage:** While currently using in-memory storage, the system is prepared for PostgreSQL integration via Drizzle ORM, with a defined schema and migration configurations.

### Feature Specifications
**Pages:**
- **Home:** A modular landing page with sections for navigation, hero content, stats, features, referral tiers, strategies, and token sale information.
- **Dashboard ("Base Camp"):** Features 7 interactive widgets in a bento grid layout: RainCatcher (net worth), Sonar (bot activity), Vine (referral tree), BiomassCapacitor (points), StrategyBreakers (risk controls), Atmosphere (market health), all wrapped in a GlassPanel for consistent aesthetic.
- **Referrals:** Displays referral stats, shareable links, tier progression, and an overview of the tiered program.
- **Leaderboard:** Shows top 50 rankings with a podium display and a full table.
**Modals:** A context-driven modal system manages `Harvest` (for rewards) and `Seeding` (for strategy configuration) modals, using shadcn Dialog primitives.
**Theming:** Comprehensive light/dark mode support with semantic theme tokens, ensuring all components and SVG elements adapt correctly.
**Wallet Integration:** A dedicated `WalletContext` and `WalletProfile` component manage wallet connection, display address, and handle disconnection, with full mobile support.

## External Dependencies

### Third-Party Services
- **Blockchain:** Base blockchain (Layer 2) as the target network.
- **Development Tools:** Replit-specific plugins (cartographer, dev-banner).

### API Integrations
- **Current:** All data is currently served from in-memory storage; no external APIs are integrated yet.
- **Planned:** Integration with DeFi protocols (e.g., Aerodrome, UniswapV3, Aave), price oracles (Chainlink, Pyth), and blockchain indexing services (The Graph or Ponder).

### Package Dependencies
- **Frontend:** `react`, `react-dom`, `wouter`, `@tanstack/react-query`, `react-hook-form`, `zod`, `tailwindcss`, `radix-ui` packages, `class-variance-authority`, `lucide-react`.
- **Backend:** `express`, `drizzle-orm`, `@neondatabase/serverless`, `connect-pg-simple`.
- **Build & Utilities:** `vite`, `esbuild`, `typescript`, `drizzle-kit`, `date-fns`, `clsx`, `tailwind-merge`, `nanoid`.