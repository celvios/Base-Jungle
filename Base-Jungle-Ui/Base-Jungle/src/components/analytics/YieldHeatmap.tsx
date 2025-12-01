import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

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
    const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: payload.color, // Use the color defined in data
                    stroke: '#050505',
                    strokeWidth: 2,
                    opacity: 0.8,
                }}
                className="hover:opacity-100 transition-opacity cursor-pointer"
            />
            {width > 50 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                >
                    {name}
                </text>
            )}
            {width > 50 && height > 50 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 16}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize={10}
                >
                    {payload.apy}% APY
                </text>
            )}
        </g>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#050505] border border-gray-800 p-3 rounded-lg shadow-xl">
                <p className="text-white font-bold mb-1">{data.name}</p>
                <p className="text-gray-400 text-xs">Allocation: ${(data.size).toLocaleString()}</p>
                <p className="text-[#0052FF] font-mono font-bold">APY: {data.apy}%</p>
            </div>
        );
    }
    return null;
};

const YieldHeatmap: React.FC = () => {
    return (
        <div className="w-full bg-[#050505]/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 h-full">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">The Yield Heatmap</h3>
                <p className="text-sm text-gray-500">Strategy Performance & Allocation</p>
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
