import React from 'react';
import { motion } from 'framer-motion';

const EcosystemPulse: React.FC = () => {
    const stats = [
        "TOTAL VALUE LOCKED: $12,405,000",
        "///",
        "POINTS GENERATED: 45,000,000",
        "///",
        "CURRENT BEST APY: 14.2% (Aerodrome)",
        "///",
        "NEXT HARVEST IN: 04h 12m",
        "///",
        "SYSTEM STATUS: OPERATIONAL",
        "///"
    ];

    // Duplicate stats to create a seamless loop
    const marqueeContent = [...stats, ...stats, ...stats, ...stats];

    return (
        <div className="w-full bg-[#020202] border-y border-gray-900 overflow-hidden py-3 relative z-30">
            <div className="flex">
                <motion.div
                    className="flex items-center gap-12 whitespace-nowrap"
                    animate={{ x: [0, -1000] }} // Adjust based on content width
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30 // Adjust speed
                    }}
                >
                    {marqueeContent.map((item, index) => (
                        <span
                            key={index}
                            className={`text-xs font-mono ${item === "///" ? "text-gray-700" : "text-blue-400"}`}
                        >
                            {item}
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default EcosystemPulse;
