import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight } from 'lucide-react';

const data = [
    {
        name: 'Strategies',
        children: [
            { name: 'Aave USDC', size: 6000, apy: 7, color: '#1e3a8a' }, // Dim Blue
            { name: 'Aerodrome ETH-USDC', size: 3000, apy: 15, color: '#2563eb' }, // Medium Blue
            { name: 'Beefy Concentrated', size: 1000, apy: 20, color: '#60a5fa' }, // Bright Blue
            { name: 'Moonwell DAI', size: 1500, apy: 9, color: '#1d4ed8' },
            { name: 'Compound USDC', size: 950, apy: 6, color: '#172554' },
        ],
    },
];

const CustomContent = (props: any) => {
    const { x, y, width, height, name, color, apy } = props;

    // If we don't have a valid size, don't render
    if (width <= 0 || height <= 0) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color || '#1e3a8a', // Use direct prop or fallback
                    stroke: '#050505',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
            />
            {width > 50 && height > 50 && (
                <foreignObject x={x} y={y} width={width} height={height}>
                    <div className="h-full w-full p-2 flex flex-col justify-between">
                        <span className="text-white font-bold text-xs truncate">{name}</span>
                        <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-mono text-xs">{apy || 0}%</span>
                        </div>
                    </div>
                </foreignObject>
            )}
        </g>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#0a0a0a] border border-gray-800 p-2 rounded shadow-xl">
                <p className="text-white text-xs font-bold">{data.name}</p>
                <p className="text-[#0052FF] text-xs">Allocation: ${(data.size || 0).toLocaleString()}</p>
                <p className="text-emerald-400 text-xs">APY: {data.apy || 0}%</p>
            </div>
        );
    }
    return null;
};

const YieldHeatmap: React.FC = () => {
    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Strategy Heatmap</h3>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#0052FF]" />
                        <span className="text-[10px] text-gray-500">High Alloc</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#002266]" />
                        <span className="text-[10px] text-gray-500">Low Alloc</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={data}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        content={<CustomContent />}
                    >
                        <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default YieldHeatmap;
