import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, Zap } from 'lucide-react';

const Roundtable: React.FC = () => {
    const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);

    // Mock Data for 9 Signers (5 Active, 4 Inactive/Standby)
    const signers = [
        { id: 1, name: 'DevLead.eth', role: 'Core Engineer', active: true, lastActive: '2h ago', verified: true },
        { id: 2, name: 'SecAudit_01', role: 'Security Lead', active: true, lastActive: '5h ago', verified: true },
        { id: 3, name: 'Ops_Manager', role: 'Operations', active: true, lastActive: '1d ago', verified: true },
        { id: 4, name: 'Comm_Lead', role: 'Community', active: true, lastActive: '4h ago', verified: true },
        { id: 5, name: 'Advisor_Fin', role: 'Financial Advisor', active: true, lastActive: '6h ago', verified: true },
        { id: 6, name: 'Backup_01', role: 'Cold Storage', active: false, lastActive: '30d ago', verified: true },
        { id: 7, name: 'Backup_02', role: 'Legal Counsel', active: false, lastActive: '15d ago', verified: true },
        { id: 8, name: 'Investor_Rep', role: 'Early Backer', active: false, lastActive: 'Never', verified: true },
        { id: 9, name: 'Dao_Bridge', role: 'Future Delegate', active: false, lastActive: 'Never', verified: false },
    ];

    // Helper to generate glitch text for address
    const GlitchText = ({ text }: { text: string }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <span
                className="font-mono cursor-help"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {isHovered ? text : `${text.substring(0, 6)}...${text.substring(text.length - 4)}`}
            </span>
        );
    };

    return (
        <div className="w-full bg-[#050505] border border-gray-800 rounded-2xl p-8 relative overflow-hidden mb-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between mb-8 relative z-10">
                <div>
                    <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                        THE ROUNDTABLE
                    </h2>
                    <p className="text-gray-500 text-sm font-mono mt-1">5-of-9 Multisig Consensus Required</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-blue-900/20 border border-blue-500/30 px-3 py-1.5 rounded text-blue-400 mt-4 md:mt-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    SYSTEM SECURE
                </div>
            </div>

            {/* The Table Layout */}
            <div className="relative max-w-2xl mx-auto aspect-square md:aspect-video flex items-center justify-center">

                {/* Center Obelisk (The Contract) */}
                <div className="absolute z-20 w-24 h-24 bg-black border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] flex flex-col items-center justify-center rounded-lg">
                    <Zap className="w-8 h-8 text-blue-400 mb-1" />
                    <span className="text-[10px] font-mono text-blue-300">CORE</span>
                </div>

                {/* Connection Beams (Only for active signers) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {signers.map((signer, i) => {
                        if (!signer.active) return null;
                        // Calculate positions based on a circle
                        const angle = (i * (360 / 9)) - 90;
                        const radius = 140; // Adjust based on container size
                        // Note: This is a simplified visual representation. 
                        // In a real implementation, we'd calculate exact coordinates relative to the SVG center.
                        return null;
                    })}
                    {/* Placeholder for beams - using CSS for simplicity in this iteration */}
                </svg>

                {/* Seats Grid (Mobile: 3x3, Desktop: Circular-ish via Grid) */}
                <div className="grid grid-cols-3 gap-4 md:gap-12 relative z-10">
                    {signers.map((signer) => (
                        <motion.div
                            key={signer.id}
                            className="relative group"
                            onHoverStart={() => setHoveredSeat(signer.id)}
                            onHoverEnd={() => setHoveredSeat(null)}
                            whileHover={{ scale: 1.1 }}
                        >
                            {/* Avatar */}
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${signer.active
                                    ? 'border-blue-500 bg-blue-950/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400'
                                    : 'border-gray-800 bg-gray-900/50 text-gray-700 opacity-50'
                                }`}>
                                <User className="w-8 h-8 md:w-10 md:h-10" />
                            </div>

                            {/* Status Dot */}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${signer.active ? 'bg-green-500' : 'bg-gray-600'}`} />

                            {/* Bio Card Popover */}
                            <AnimatePresence>
                                {hoveredSeat === signer.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-black border border-gray-700 rounded-lg p-3 shadow-2xl z-50 pointer-events-none"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-white">{signer.name}</span>
                                            {signer.verified && <ShieldCheck className="w-3 h-3 text-blue-400" />}
                                        </div>
                                        <div className="space-y-1 text-[10px] font-mono text-gray-400">
                                            <div className="flex justify-between">
                                                <span>Role:</span>
                                                <span className="text-gray-300">{signer.role}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Active:</span>
                                                <span className={signer.active ? 'text-green-400' : 'text-gray-500'}>{signer.lastActive}</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-800 text-center text-blue-500/80">
                                                VERIFIED SIGNER
                                            </div>
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black border-r border-b border-gray-700" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Roundtable;
