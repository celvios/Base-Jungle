import React from 'react';
import { motion } from 'framer-motion';
import PulseMap from '@/components/ecosystem/PulseMap';
import SentinelGrid from '@/components/ecosystem/SentinelGrid';
import HuntersLog from '@/components/ecosystem/HuntersLog';
import OracleVision from '@/components/ecosystem/OracleVision';
import SimulationWidget from '@/components/ecosystem/SimulationWidget';

const EcosystemPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans overflow-hidden relative">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center space-x-4 mb-8">
                    <h1 className="text-3xl font-bold tracking-wider text-white uppercase">Ecosystem</h1>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-900/20 border border-blue-500/30 rounded-full">
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                        />
                        <span className="text-xs font-mono text-blue-400">LIVE NETWORK STATUS</span>
                    </div>
                </header>

                {/* Hero Section: Pulse Map */}
                <section>
                    <PulseMap />
                </section>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Sentinels & Oracle */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-sm font-mono text-gray-500 mb-4 uppercase tracking-widest">Active Sentinels</h2>
                            <SentinelGrid />
                        </section>

                        <section>
                            <h2 className="text-sm font-mono text-gray-500 mb-4 uppercase tracking-widest">Data Integrity</h2>
                            <OracleVision />
                        </section>
                    </div>

                    {/* Right Column: Logs & Simulation */}
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-sm font-mono text-gray-500 mb-4 uppercase tracking-widest">Hunter's Log</h2>
                            <HuntersLog />
                        </section>

                        <section>
                            <h2 className="text-sm font-mono text-gray-500 mb-4 uppercase tracking-widest">System Diagnostics</h2>
                            <SimulationWidget />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EcosystemPage;
