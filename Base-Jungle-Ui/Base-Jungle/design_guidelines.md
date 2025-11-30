# Design Guidelines: Passive DeFi Aggregator Landing Page

## Design Approach

**Selected Approach:** Reference-Based (DeFi/Web3 Category)
**Primary References:** DeXe Protocol, Gravitas Protocol
**Justification:** This is a sophisticated DeFi protocol requiring visual credibility and modern Web3 aesthetic to build trust with crypto-native users. The reference designs successfully balance technical complexity with approachable UI.

**Key Design Principles:**
1. **Dark, Premium Aesthetic:** Establish credibility and align with crypto industry standards
2. **Data Visualization Focus:** Present complex financial data clearly through cards, stats, and hierarchical information
3. **Trust Through Clarity:** Use generous spacing and clear typography to make complex DeFi mechanics understandable
4. **Strategic Visual Interest:** Concentrate visual wow-factor in hero, keep subsequent sections clean and functional

---

## Typography System

**Font Stack:**
- **Primary Display:** Inter (700-800 weight) via Google Fonts for headings and hero text
- **Body/UI:** Inter (400-500 weight) for all content, labels, and data
- **Monospace:** JetBrains Mono (500 weight) for numerical data, APY percentages, wallet addresses

**Hierarchy:**
- **Hero Headline:** text-6xl md:text-7xl lg:text-8xl font-bold leading-tight
- **Section Headers:** text-4xl md:text-5xl font-bold
- **Subsection Titles:** text-2xl md:text-3xl font-semibold
- **Card Titles:** text-xl font-semibold
- **Body Text:** text-base md:text-lg leading-relaxed
- **Small Labels:** text-sm font-medium uppercase tracking-wider
- **Stats/Numbers:** text-3xl md:text-4xl font-mono font-bold

---

## Layout System

**Spacing Primitives (Tailwind Units):**
- **Core Set:** Use 4, 6, 8, 12, 16, 20, 24, 32 consistently
- **Section Vertical Padding:** py-16 md:py-24 lg:py-32
- **Card Internal Padding:** p-6 md:p-8
- **Element Spacing:** space-y-4, space-y-6, space-y-8 for vertical stacks
- **Grid Gaps:** gap-6 md:gap-8 for multi-column layouts

**Container Strategy:**
- **Max-width containers:** max-w-7xl mx-auto px-6 md:px-8 for all content sections
- **Full-width backgrounds:** w-full with contained inner content
- **Hero section:** Full viewport height (min-h-screen) with centered content

---

## Component Library

### Navigation Bar
- Fixed top position with backdrop blur effect
- Logo left, navigation links center, "Connect Wallet" button right
- Height: h-20, with py-4 internal padding
- Icons: Heroicons for menu toggle (mobile)

### Hero Section
- Full viewport (min-h-screen) with centered content
- Two-column layout on desktop: Text (60%) + 3D Visualization Space (40%)
- Headline + subtitle + dual CTA buttons (primary "Launch App" + secondary "Learn More")
- Buttons on hero image: Use backdrop-blur-sm and subtle dark overlay on button backgrounds

### Stats Dashboard Cards
- Grid: grid-cols-1 md:grid-cols-3 lg:grid-cols-4
- Each stat card: Rounded corners (rounded-xl), inner padding p-6
- Layout: Icon top, large number (font-mono), label below
- Subtle border treatment

### Features Grid
- Four main features: Master Vaults, Points System, Automated Leverage, Referral Matrix
- Grid: grid-cols-1 md:grid-cols-2 gap-8
- Card structure: Icon (Heroicons), title (text-xl), description (3-4 lines), optional "Learn more" link

### Referral Tier Showcase
- Horizontal card layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each tier: Badge/label, multiplier stat, leverage cap, benefits list
- Visual progression from Novice → Whale with increasing visual prominence

### Strategy Breakdown Section
- Four strategies in grid: Lending, LP, Yield Farming, Arbitrage
- Each card: Icon top, strategy name, bullet points of mechanics, APY range indicator
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

### Token Sale/Progress Widget
- Prominent card: Progress bar showing allocation tiers
- Countdown timer (if pre-launch)
- Staking multiplier table embedded
- Placement: Dedicated section between features and strategies

### Footer
- Three-column layout on desktop: Brand/description, Quick Links, Community/Social
- Newsletter signup form inline
- Legal links and protocol information bottom row
- Padding: py-16

---

## Images

**Hero Section:**
- **Large Hero Background:** Abstract 3D visualization of interconnected vaults/network nodes with depth-of-field blur effect, positioned behind hero text as full-width background image
- **Treatment:** Dark gradient overlay (from bottom) to ensure text readability
- **Buttons:** Apply backdrop-blur-sm to CTA buttons placed over the hero image

**Feature Icons/Illustrations:**
- Use Heroicons throughout for consistency (no custom SVGs)
- Strategy cards: Each gets a representative icon (currency-dollar, chart-bar, arrows-right-left, lightning-bolt)

**Section Dividers:**
- Subtle gradient separators between major sections (not images, pure CSS)

**No Additional Photography:** Keep focus on data, cards, and typography rather than stock photos

---

## Multi-Column Strategy

**Where Used:**
- Stats dashboard: 4 columns (desktop), 2 (tablet), 1 (mobile)
- Features grid: 2 columns (desktop), 1 (mobile)
- Referral tiers: 4 columns horizontal scroll on mobile, 4 columns fixed desktop
- Strategy breakdown: 4 columns (desktop), 2 (tablet), 1 (mobile)
- Footer: 3 columns (desktop), 1 (mobile)

**Where Avoided:**
- Hero content (single centered column with asymmetric 3D element)
- Explanatory sections with long-form text
- Token sale widget (single prominent card)

---

## Animation Guidelines

**Minimal Implementation:**
- Hero: Subtle floating animation on 3D vault element (translate-y only)
- Stats: Count-up animation on page load for numbers only
- Cards: Simple fade-in on scroll (stagger by 100ms)
- No parallax effects, no complex scroll-triggered animations
- Hover states: Subtle scale (scale-105) and shadow increase only