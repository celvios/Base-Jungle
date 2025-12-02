import React, { useState, useEffect } from 'react';
import EcosystemVitals from '@/components/analytics/EcosystemVitals';
import CanopyGrowthChart from '@/components/analytics/CanopyGrowthChart';
import YieldHeatmap from '@/components/analytics/YieldHeatmap';
import FoodChain from '@/components/analytics/FoodChain';
import RainCycle from '@/components/analytics/RainCycle';
import { SkeletonCard, SkeletonChart, Skeleton } from '@/components/ui/skeleton';
import BackToHome from '@/components/ui/BackToHome';

const AnalyticsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-[#050505] text-white font-sans pt-24 pb-16">
                <BackToHome />
                <div className="w-full space-y-8 px-6 md:px-8">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                    <SkeletonChart />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

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
