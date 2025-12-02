import React from 'react';
import EcosystemVitals from '@/components/analytics/EcosystemVitals';
import CanopyGrowthChart from '@/components/analytics/CanopyGrowthChart';
import YieldHeatmap from '@/components/analytics/YieldHeatmap';
import FoodChain from '@/components/analytics/FoodChain';
import RainCycle from '@/components/analytics/RainCycle';
import BackToHome from '@/components/ui/BackToHome';

const AnalyticsPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans pt-24 pb-16">
            <BackToHome />
            <div className="w-full space-y-8 px-6 md:px-8">

                {/* Header */}
                <div className="space-y-2 mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">
                        The Observatory
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-lg">
                        High-fidelity ecosystem monitoring. Tracking real-time protocol health, yield performance, and network vitals.
                    </p>
                </div>

                {/* HUD */}
                <section>
                    <EcosystemVitals />
                </section>

                {/* Main Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Canopy Growth Chart (Spans 2 columns) */}
                    <div className="lg:col-span-2">
                        <CanopyGrowthChart />
                    </div>

                    {/* Yield Heatmap (Spans 1 column) */}
                    <div className="lg:col-span-1">
                        <YieldHeatmap />
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <FoodChain />
                    <RainCycle />
                </div>

            </div>
        </div>
    );
};

export default AnalyticsPage;
