import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface AccumulatorProps {
    points: number;
    multiplier: number;
    onHarvest: () => void;
}

const Accumulator: React.FC<AccumulatorProps> = ({ points, multiplier, onHarvest }) => {
    return (
        <div className="col-span-1 bg-[#0a0a0a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden">

            <div className="z-10 flex justify-between items-start mb-4">
                <div className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Accumulator
                </div>
                <div className="text-xs font-mono text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded bg-blue-900/20">
                    {multiplier}x Speed
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center z-10 space-y-4">
                <div className="text-3xl font-bold font-mono text-white tracking-tight">
                    {points.toLocaleString()} <span className="text-sm text-gray-500">PTS</span>
                </div>

                <Button
                    onClick={onHarvest}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                    Harvest Rewards
                </Button>
            </div>

            {/* Bubble Tank Visual */}
            <div className="absolute inset-0 z-0 opacity-20">
                {/* Rising Bubbles Animation (Simulated with multiple divs) */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bottom-0 w-2 h-2 bg-blue-400 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -300],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.5]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "linear"
                        }}
                    />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
            </div>
        </div>
    );
};

export default Accumulator;
