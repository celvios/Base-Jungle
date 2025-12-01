import { motion } from "framer-motion";

const safetyCards = [
    {
        id: "slippage",
        icon: "🔧",
        title: "Hardcoded Slippage",
        value: "Max 0.5%",
        description: "Transactions revert if price impact exceeds this limit.",
    },
    {
        id: "health",
        icon: "🛡️",
        title: "Health Factor Buffer",
        value: "HF > 1.4",
        description: "Auto-repay triggers immediately if buffer is breached.",
    },
    {
        id: "diversification",
        icon: "📊",
        title: "Diversification Cap",
        value: "Max 30% / Protocol",
        description: "Prevents single-point-of-failure exposure.",
    },
    {
        id: "timelock",
        icon: "⏱️",
        title: "Timelock",
        value: "48 Hours",
        description: "Critical upgrades require a 2-day public delay.",
    },
];

export function SafetyGrid() {
    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {safetyCards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        className="p-8 bg-white/5 backdrop-blur-sm border border-[#0052FF]/30 rounded-lg hover:border-[#0052FF] transition-all group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        {/* Icon */}
                        <div className="text-5xl mb-4">{card.icon}</div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-[#0052FF] mb-2">{card.title}</h3>

                        {/* Value */}
                        <div className="text-3xl font-bold text-white mb-4">{card.value}</div>

                        {/* Description */}
                        <p className="text-sm text-white/60 leading-relaxed">{card.description}</p>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-[#0052FF]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
