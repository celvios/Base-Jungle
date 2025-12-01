import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command } from 'lucide-react';

interface SearchResult {
    section: string;
    sectionId: string;
    snippet: string;
}

const searchableContent: SearchResult[] = [
    { section: 'Withdrawal Fees', sectionId: 'security', snippet: '0.1% - 2.0% based on tier' },
    { section: 'Keeper Incentives', sectionId: 'security', snippet: 'Automated reward distribution' },
    { section: 'Health Factor', sectionId: 'technical-architecture', snippet: 'Liquidation safety metric' },
    { section: 'APY Calculation', sectionId: 'position-tiers', snippet: 'Annual Percentage Yield' },
    { section: 'TVL Requirements', sectionId: 'position-tiers', snippet: 'Total Value Locked minimums' },
];

const SearchBar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.trim()) {
            const filtered = searchableContent.filter(
                (item) =>
                    item.section.toLowerCase().includes(query.toLowerCase()) ||
                    item.snippet.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [query]);

    const handleResultClick = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setIsOpen(false);
        setQuery('');
    };

    return (
        <>
            {/* Search Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-500 hover:border-blue-500/50 transition-colors group"
            >
                <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span className="text-sm font-mono">SEARCH DATABASE...</span>
                </div>
                <div className="flex items-center space-x-1 text-xs">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                </div>
            </button>

            {/* Search Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
                        />

                        {/* Search Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 bg-[#0a0a0a] border border-blue-500/50 rounded-lg shadow-[0_0_30px_rgba(0,82,255,0.2)]"
                        >
                            {/* Input */}
                            <div className="flex items-center px-4 py-3 border-b border-gray-800">
                                <Search className="w-5 h-5 text-blue-500 mr-3" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search documentation..."
                                    className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-gray-600"
                                />
                            </div>

                            {/* Results */}
                            {results.length > 0 && (
                                <div className="max-h-96 overflow-y-auto p-2">
                                    {results.map((result, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleResultClick(result.sectionId)}
                                            className="w-full text-left px-4 py-3 rounded hover:bg-blue-900/20 transition-colors group"
                                        >
                                            <div className="text-sm font-bold text-blue-400 group-hover:text-blue-300">
                                                {result.section}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{result.snippet}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {query && results.length === 0 && (
                                <div className="p-8 text-center text-gray-600 text-sm">
                                    No results found for "{query}"
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default SearchBar;
