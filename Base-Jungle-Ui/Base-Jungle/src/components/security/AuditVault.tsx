import React from 'react';
import { FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const AuditVault: React.FC = () => {
    const audits = [
        { id: 1, firm: 'CertiK', status: 'PASSED', date: 'Oct 2024', hash: '7f...a2' },
        { id: 2, firm: 'Quantstamp', status: 'PASSED', date: 'Nov 2024', hash: 'b4...9c' },
        { id: 3, firm: 'OpenZeppelin', status: 'PASSED', date: 'Dec 2024', hash: 'e1...5f' },
    ];

    return (
        <div className="w-full mb-12">
            <h3 className="text-lg font-bold font-mono text-gray-500 mb-6 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5" /> The Audit Vault
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {audits.map((audit) => (
                    <motion.div
                        key={audit.id}
                        className="bg-[#050505] border border-gray-800 rounded-xl p-6 relative overflow-hidden group cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                    >
                        {/* Holographic Seal Effect */}
                        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />

                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-bold text-white font-mono">{audit.firm}</h4>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>

                        <div className="space-y-2 font-mono text-xs">
                            <div className="flex justify-between text-gray-500">
                                <span>Status:</span>
                                <span className="text-green-400 font-bold">{audit.status}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Date:</span>
                                <span className="text-gray-300">{audit.date}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Commit:</span>
                                <span className="text-cyan-600 bg-cyan-950/30 px-1 rounded">{audit.hash}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-center text-xs font-bold text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            VIEW REPORT <ExternalLink className="w-3 h-3 ml-1" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AuditVault;
