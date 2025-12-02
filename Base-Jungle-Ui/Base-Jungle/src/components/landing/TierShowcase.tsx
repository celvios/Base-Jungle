import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const TierShowcase: React.FC = () => {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });

    const x = useTransform(scrollYProgress, [0, 1], ["1%", "-55%"]);

    const tiers = [
        { id: 1, name: 'Sprout', price: '$100', risk: 'Low', lock: '90 Days', color: 'from-green-400 to-green-600' },
        { id: 2, name: 'Sapling', price: '$400', risk: 'Low', lock: '180 Days', color: 'from-emerald-400 to-emerald-600' },
        { id: 3, name: 'Branch', price: '$1,200', risk: 'Moderate', lock: 'Balanced', color: 'from-teal-400 to-teal-600' },
        { id: 4, name: 'Tree', price: '$3,600', risk: 'Moderate', lock: '2x Leverage', color: 'from-cyan-400 to-cyan-600' },
        { id: 5, name: 'Grove', price: '$7,200', risk: 'Aggressive', lock: '3x Leverage', color: 'from-blue-400 to-blue-600' },
        { id: 6, name: 'Forest', price: '$14,400', risk: 'Aggressive', lock: '5x Leverage', color: 'from-indigo-400 to-indigo-600' },
    ];

    return (
        <section ref={targetRef} className="relative h-[300vh] bg-[#050505]">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                <div className="absolute top-12 left-8 z-10">
                    <h2 className="text-4xl font-bold font-mono text-white">SPECIMEN PARALLAX</h2>
                    <p className="text-gray-500 font-mono text-sm mt-2">Scroll to explore tiers</p>
                </div>

                <motion.div style={{ x }} className="flex gap-12 px-24">
                    {tiers.map((tier) => (
                        <div key={tier.id} className="relative w-[400px] h-[500px] flex-shrink-0 bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 flex flex-col justify-between group hover:border-gray-600 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

                            <div>
                                <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Specimen 0{tier.id}</div>
                                <h3 className="text-5xl font-bold text-white mb-2">{tier.name}</h3>
                                <div className={`text-xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r ${tier.color}`}>
                                    {tier.price}
                                </div>
                            </div>

                            {/* Abstract Shape Placeholder */}
                            <div className="flex-1 flex items-center justify-center my-8">
                                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${tier.color} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`} />
                                <div className={`w-24 h-24 border-2 border-gray-700 rounded-lg rotate-45 group-hover:rotate-90 transition-transform duration-700`} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-6">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase">Risk Profile</div>
                                    <div className="text-sm font-bold text-white">{tier.risk}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase">Lock / Leverage</div>
                                    <div className="text-sm font-bold text-white">{tier.lock}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default TierShowcase;
