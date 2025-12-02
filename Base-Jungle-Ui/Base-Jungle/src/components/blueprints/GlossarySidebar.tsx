import React from 'react';
import { BookOpen } from 'lucide-react';

const GlossarySidebar: React.FC = () => {
    const terms = [
        { term: 'Impermanent Loss', def: 'Temporary loss of funds due to volatility in a liquidity pair.' },
        { term: 'Delta Neutral', def: 'A strategy that hedges against price movements to minimize directional risk.' },
        { term: 'Auto-Compound', def: 'Automatically reinvesting yield to maximize APY.' },
        { term: 'Liquidation', def: 'Forced closure of a position when collateral value drops below a threshold.' },
        { term: 'Health Factor', def: 'A metric indicating the safety of a leveraged position (>1.0 is safe).' },
    ];

    return (
        <div className="hidden xl:block w-72 fixed right-0 top-20 bottom-0 border-l border-gray-800 bg-[#050505]/95 backdrop-blur p-6 overflow-y-auto">
            <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Protocol Glossary
            </h3>

            <div className="space-y-6">
                {terms.map((item) => (
                    <div key={item.term}>
                        <div className="text-cyan-400 font-mono text-sm font-bold mb-1">{item.term}</div>
                        <div className="text-gray-500 text-xs leading-relaxed">
                            {item.def}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GlossarySidebar;
