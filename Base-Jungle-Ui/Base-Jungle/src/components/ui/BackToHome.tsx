import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

const BackToHome: React.FC = () => {
    return (
        <Link href="/">
            <button className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/30 transition-all group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-mono uppercase tracking-wider">Back to Home</span>
            </button>
        </Link>
    );
};

export default BackToHome;
