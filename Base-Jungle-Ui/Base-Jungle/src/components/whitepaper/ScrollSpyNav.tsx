import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NavSection {
    id: string;
    title: string;
}

const sections: NavSection[] = [
    { id: 'executive-summary', title: 'Executive Summary' },
    { id: 'position-tiers', title: 'Position Tiers' },
    { id: 'technical-architecture', title: 'Technical Architecture' },
    { id: 'tokenomics', title: 'Tokenomics & TGE' },
    { id: 'security', title: 'Security & Risk' },
    { id: 'roadmap', title: 'Roadmap' },
];

const ScrollSpyNav: React.FC = () => {
    const [activeSection, setActiveSection] = useState('executive-summary');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -70% 0px' }
        );

        sections.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <nav className="sticky top-8 h-fit">
            <div className="relative">
                {/* DNA Helix Line */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-900/50 via-blue-500/50 to-blue-900/50" />

                <ul className="space-y-1 pl-6">
                    {sections.map((section) => {
                        const isActive = activeSection === section.id;
                        return (
                            <li key={section.id} className="relative">
                                {/* Active Indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeSection"
                                        className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#0052FF]"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <button
                                    onClick={() => scrollToSection(section.id)}
                                    className={`text-left text-sm font-mono transition-colors ${isActive
                                            ? 'text-blue-400 font-bold'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {section.title}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default ScrollSpyNav;
