import React from 'react';
import { Copy, ExternalLink, Database } from 'lucide-react';

interface AllocationMatrixProps {
    selectedTier: string;
}

const AllocationMatrix: React.FC<AllocationMatrixProps> = ({ selectedTier }) => {

    const getData = () => {
        switch (selectedTier) {
            case 'sprout':
                return [
                    { component: 'Lending', protocol: 'Aave v3', asset: 'USDC', alloc: '60.0%', type: 'Supply Only', contract: '0x7f...a2' },
                    { component: 'Liquidity', protocol: 'Aerodrome', asset: 'USDC/DAI', alloc: '30.0%', type: 'Stable LP', contract: '0x4b...c9' },
                    { component: 'Staking', protocol: 'Lido', asset: 'stETH', alloc: '10.0%', type: 'Liquid Stake', contract: '0x2e...11' },
                ];
            case 'tree':
                return [
                    { component: 'Lending', protocol: 'Moonwell', asset: 'USDC', alloc: '40.0%', type: 'Supply & Borrow', contract: '0x8a...b1' },
                    { component: 'Liquidity', protocol: 'Aerodrome', asset: 'WETH/USDC', alloc: '40.0%', type: 'Volatile LP', contract: '0x3c...d4' },
                    { component: 'Leverage', protocol: 'Compound', asset: 'ETH', alloc: '20.0%', type: 'Loop 2x', contract: '0x1f...e5' },
                ];
            case 'forest':
                return [
                    { component: 'Farming', protocol: 'Beefy', asset: 'AERO', alloc: '20.0%', type: 'Auto-Compound', contract: '0x9d...f2' },
                    { component: 'Leverage', protocol: 'Aave v3', asset: 'WETH', alloc: '50.0%', type: 'Loop 5x', contract: '0x5e...a8' },
                    { component: 'Delta-N', protocol: 'GMX', asset: 'GLP', alloc: '30.0%', type: 'Hedged', contract: '0x2b...c3' },
                ];
            default: return [];
        }
    };

    const data = getData();

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-mono text-cyan-500 tracking-widest uppercase">Data Module // Allocation Matrix</h3>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 border-b border-gray-800">
                                <th className="p-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Component</th>
                                <th className="p-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Protocol</th>
                                <th className="p-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Asset</th>
                                <th className="p-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Allocation</th>
                                <th className="p-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Strategy Type</th>
                                <th className="p-3 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Contract</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-xs">
                            {data.map((row, i) => (
                                <tr key={i} className="border-b border-gray-800/50 hover:bg-cyan-900/10 transition-colors group">
                                    <td className="p-3 font-bold text-white">{row.component}</td>
                                    <td className="p-3 text-cyan-300">{row.protocol}</td>
                                    <td className="p-3 text-gray-300">{row.asset}</td>
                                    <td className="p-3 text-emerald-400 font-bold">{row.alloc}</td>
                                    <td className="p-3 text-gray-400">{row.type}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-gray-900 px-1.5 py-0.5 rounded text-gray-500 border border-gray-800">{row.contract}</span>
                                            <button className="text-gray-600 hover:text-cyan-400 transition-colors">
                                                <Copy className="w-3 h-3" />
                                            </button>
                                            <button className="text-gray-600 hover:text-cyan-400 transition-colors">
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="p-2 bg-gray-900/30 border-t border-gray-800 flex justify-between items-center text-[10px] font-mono text-gray-500">
                    <span>SYNC: LIVE [BLOCK 1829304]</span>
                    <span>INTEGRITY CHECK: PASS</span>
                </div>
            </div>
        </div>
    );
};

export default AllocationMatrix;
