import React from 'react';
import { Users, AlertCircle, Circle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Referral {
    address: string;
    tier: string;
    status: 'active' | 'risk' | 'inactive';
    lastActive: string;
}

interface SignalListProps {
    referrals: Referral[];
    onNudge?: (address: string) => void;
}

const SignalList: React.FC<SignalListProps> = ({ referrals, onNudge }) => {
    const activeCount = referrals.filter(r => r.status === 'active').length;
    const riskCount = referrals.filter(r => r.status === 'risk').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-400';
            case 'risk': return 'text-orange-400';
            case 'inactive': return 'text-gray-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Circle className="w-2 h-2 fill-current text-green-400" />;
            case 'risk': return <AlertCircle className="w-3 h-3 text-orange-400" />;
            case 'inactive': return <Circle className="w-2 h-2 fill-current text-gray-600" />;
            default: return null;
        }
    };

    return (
        <div className="glass-card rounded-xl p-6 col-span-1 md:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        SIGNAL LIST
                    </h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">NETWORK CONNECTIONS</p>
                </div>
                <div className="flex gap-4 text-sm font-mono">
                    <span className="text-green-400">ACTIVE: {activeCount}</span>
                    <span className="text-orange-400">AT RISK: {riskCount}</span>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-xs font-mono text-gray-500 uppercase">
                            <th className="py-3 px-4">Address</th>
                            <th className="py-3 px-4">Tier</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {referrals.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-500 font-mono">
                                    No active signals detected. Share your referral link to expand the network.
                                </td>
                            </tr>
                        ) : (
                            referrals.map((ref, index) => (
                                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 font-mono text-gray-300">{ref.address}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
                                            {ref.tier}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className={`flex items-center gap-2 ${getStatusColor(ref.status)}`}>
                                            {getStatusIcon(ref.status)}
                                            <span className="font-mono text-xs uppercase">
                                                {ref.status === 'active' && `Active (${ref.lastActive})`}
                                                {ref.status === 'risk' && `Expires in ${ref.lastActive}`}
                                                {ref.status === 'inactive' && 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {ref.status === 'risk' && onNudge && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onNudge(ref.address)}
                                                className="h-7 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                                            >
                                                [ NUDGE ]
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SignalList;
