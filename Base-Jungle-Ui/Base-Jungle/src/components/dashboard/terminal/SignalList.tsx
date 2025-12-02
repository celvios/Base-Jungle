import React from 'react';
import { Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Referral {
    address: string;
    tier: string;
    status: 'active' | 'risk' | 'inactive';
    lastActive: string;
}

interface SignalListProps {
    referrals: Referral[];
}

const SignalList: React.FC<SignalListProps> = ({ referrals }) => {
    const activeCount = referrals.filter(r => r.status === 'active').length;
    const riskCount = referrals.filter(r => r.status === 'risk').length;

    return (
        <div className="col-span-1 bg-[#0a0a0a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col h-full">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" /> Signal List
                </div>
                <div className="flex gap-3 text-[10px] font-mono">
                    <span className="text-green-400">{activeCount} Active</span>
                    <span className="text-orange-400">{riskCount} Risk</span>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-4 text-[10px] font-mono text-gray-600 uppercase mb-2 px-2">
                <div className="col-span-2">Node ID</div>
                <div>Tier</div>
                <div className="text-right">Status</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                {referrals.map((ref, i) => (
                    <div key={i} className="grid grid-cols-4 items-center p-2 rounded hover:bg-white/5 transition-colors text-xs font-mono border border-transparent hover:border-white/5">
                        <div className="col-span-2 text-gray-300 truncate pr-2">{ref.address}</div>
                        <div className="text-blue-400">{ref.tier}</div>
                        <div className="flex justify-end">
                            {ref.status === 'active' && (
                                <div className="flex items-center gap-1 text-green-500">
                                    <span className="hidden md:inline">{ref.lastActive}</span>
                                    <CheckCircle className="w-3 h-3" />
                                </div>
                            )}
                            {ref.status === 'risk' && (
                                <div className="flex items-center gap-1 text-orange-500">
                                    <span className="hidden md:inline">Expiring</span>
                                    <AlertTriangle className="w-3 h-3" />
                                </div>
                            )}
                            {ref.status === 'inactive' && (
                                <div className="flex items-center gap-1 text-gray-600">
                                    <span className="hidden md:inline">Dead</span>
                                    <XCircle className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SignalList;
