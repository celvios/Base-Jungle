import React from 'react';
import { BookOpen } from 'lucide-react';

const GlossarySidebar: React.FC = () => {
    const terms = [
        { term: 'Rebalancing', def: 'Moving funds to higher APY pools automatically.' },
        { term: 'Harvesting', def: 'Collecting reward tokens (AERO) and selling them for USDC.' },
        { term: 'Slippage', def: 'Price difference during a swap (Max 0.5%).' },
        { term: 'Health Factor', def: 'Safety score. < 1.0 means liquidation. We keep it > 1.4.' },
        { term: 'Delta Neutral', def: 'Hedging against price moves to earn yield safely.' },
        { term: 'Auto-Compound', def: 'Reinvesting yield to earn interest on interest.' },
    ];

    return (
        <div className="hidden xl:block w-64 border-l border-gray-800 bg-[#050505] p-6 h-full fixed right-0 top-16 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-mono text-gray-500 tracking-widest uppercase">Tech Glossary</h3>
            </div>

            <div className="space-y-6">
                {terms.map((item, i) => (
                    <div key={i} className="group">
                        <h4 className="text-xs font-bold text-cyan-500 font-mono mb-1 group-hover:text-cyan-400 transition-colors">
                            {item.term}
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-mono group-hover:text-gray-400 transition-colors">
                            {item.def}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800">
                <div className="text-[10px] text-gray-600 font-mono">
                    <p className="mb-2">SYSTEM STATUS:</p>
                    <p className="text-emerald-500">● ALL SYSTEMS NOMINAL</p>
                    <p>LAST AUDIT: 12 DAYS AGO</p>
                </div>
            </div>
        </div>
    );
};

export default GlossarySidebar;
