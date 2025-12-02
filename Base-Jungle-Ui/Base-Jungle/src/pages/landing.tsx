import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Loader } from '@react-three/drei';
import AntigravityScene from '@/components/landing/AntigravityScene';
import GenesisSeed from '@/components/landing/GenesisSeed';
import HeroOverlay from '@/components/landing/HeroOverlay';
import LawsOfJungle from '@/components/landing/LawsOfJungle';
import TierShowcase from '@/components/landing/TierShowcase';
import EcosystemPulse from '@/components/landing/EcosystemPulse';
import { Twitter, Disc, Github, Hexagon } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">

            {/* 1. Hero Section: The Zero-Gravity Chamber */}
            <section className="relative h-screen w-full bg-white">
                <div className="absolute inset-0 z-0">
                    <AntigravityParticles />
                </div>
                <HeroOverlay />
            </section>

            {/* 2. Live Stats Strip */}
            <EcosystemPulse />

            {/* 3. Feature Section: Laws of the Jungle */}
            <LawsOfJungle />

            {/* 4. Tier Showcase: Specimen Parallax */}
            <TierShowcase />

            {/* 5. Footer: The Deep Void */}
            <footer className="bg-black border-t-2 border-blue-900/30 py-16 px-4 md:px-8 relative z-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Hexagon className="w-8 h-8 text-blue-500 fill-blue-500/20" />
                            <span className="text-xl font-bold tracking-tight">Base Jungle</span>
                        </div>
                        <p className="text-gray-500 text-sm font-mono max-w-xs">
                            Automated Wealth on Base. <br />
                            Plant the capital. The bots hunt the yield.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col space-y-2 font-mono text-sm text-gray-400">
                        <a href="/blueprints" className="hover:text-blue-400 transition-colors">Blueprints</a>
                        <a href="/security" className="hover:text-blue-400 transition-colors">Security</a>
                        <a href="/governance" className="hover:text-blue-400 transition-colors">Governance</a>
                    </div>

                    {/* Socials */}
                    <div className="flex gap-4 justify-start md:justify-end">
                        <a href="#" className="p-2 border border-gray-800 rounded-lg hover:bg-white/5 transition-colors group">
                            <Twitter className="w-5 h-5 text-gray-500 group-hover:text-white" />
                        </a>
                        <a href="#" className="p-2 border border-gray-800 rounded-lg hover:bg-white/5 transition-colors group">
                            <Disc className="w-5 h-5 text-gray-500 group-hover:text-white" />
                        </a>
                        <a href="#" className="p-2 border border-gray-800 rounded-lg hover:bg-white/5 transition-colors group">
                            <Github className="w-5 h-5 text-gray-500 group-hover:text-white" />
                        </a>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-900 text-center md:text-left text-[10px] text-gray-600 font-mono uppercase">
                    © 2024 Base Jungle Protocol. All rights reserved.
                </div>
            </footer>

            <Loader />
        </div>
    );
};

export default LandingPage;
