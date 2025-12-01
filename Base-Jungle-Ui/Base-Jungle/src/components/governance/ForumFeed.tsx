import React from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';

const ForumFeed: React.FC = () => {
    const discussions = [
        { id: 1, title: 'Proposal: Increase Forest Tier leverage cap?', replies: 124, active: true },
        { id: 2, title: 'Discussion: Add Aerodrome/USDbC Pool', replies: 45, active: true },
        { id: 3, title: 'RFC: Adjusting Guardian Council Quorum', replies: 89, active: false },
    ];

    return (
        <div className="w-full bg-[#050505] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-white">Active Discussions</h3>
                </div>
                <button className="text-xs font-mono text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                    JOIN THE DEBATE <ExternalLink className="w-3 h-3" />
                </button>
            </div>

            <div className="space-y-3">
                {discussions.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-800/50 hover:border-gray-700 hover:bg-gray-900/50 transition-all cursor-pointer group"
                    >
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate pr-4">
                            {item.title}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                            <span>{item.replies} replies</span>
                            {item.active && <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ForumFeed;
