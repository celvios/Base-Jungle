import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlossaryTooltipProps {
    term: string;
    definition: string;
    children: React.ReactNode;
}

const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({ term, definition, children }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <span className="relative inline-block">
            <span
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="border-b border-dashed border-blue-500/50 cursor-help text-blue-400"
            >
                {children}
            </span>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#0a0a0a] border border-blue-500/50 rounded-lg shadow-[0_0_20px_rgba(0,82,255,0.2)] z-50"
                    >
                        <div className="text-xs font-bold text-blue-400 mb-1">{term}</div>
                        <div className="text-xs text-gray-300 leading-relaxed">{definition}</div>

                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="w-2 h-2 bg-[#0a0a0a] border-r border-b border-blue-500/50 rotate-45" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
};

export default GlossaryTooltip;
