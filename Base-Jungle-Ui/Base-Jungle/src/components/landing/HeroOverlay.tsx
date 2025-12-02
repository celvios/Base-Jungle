import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { Link } from 'wouter';

const HeroOverlay: React.FC = () => {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center space-y-6 pointer-events-auto px-4">
                <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 leading-none select-none">
                    BASE<br />
                    JUNGLE.
                </h1>

                <p className="text-gray-400 font-mono text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                    The first fully passive DeFi aggregation protocol on Base. <br className="hidden md:block" />
                    You plant the capital. The bots hunt the yield.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
                    <Link href="/dashboard">
                        <button className="group relative px-8 py-4 bg-[#0052FF] text-white font-bold tracking-wider uppercase rounded-none overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(0,82,255,0.6)]">
                            <span className="relative z-10 flex items-center gap-2">
                                Launch App <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </Link>

                    <Link href="/blueprints">
                        <button className="group px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-mono text-sm tracking-wider uppercase transition-all hover:bg-white/10 hover:border-white/20">
                            <span className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                View Blueprints
                            </span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-12 animate-bounce">
                <div className="w-6 h-10 border-2 border-gray-700 rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-gray-500 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default HeroOverlay;
