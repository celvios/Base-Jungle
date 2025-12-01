import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockViewerProps {
    code: string;
    language?: string;
    filename?: string;
}

const CodeBlockViewer: React.FC<CodeBlockViewerProps> = ({
    code,
    language = 'solidity',
    filename = 'Contract.sol'
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Simple syntax highlighting for Solidity/TS
    const highlightCode = (source: string) => {
        return source.split('\n').map((line, i) => {
            // Basic tokenization for display purposes
            const highlightedLine = line
                .replace(/\b(contract|function|struct|mapping|address|uint256|bool|string|public|external|internal|private|view|pure|returns|memory|storage|calldata|if|else|for|while|return|emit|event|modifier|constructor)\b/g, '<span class="text-purple-400">$1</span>')
                .replace(/\b(true|false)\b/g, '<span class="text-orange-400">$1</span>')
                .replace(/("[^"]*")/g, '<span class="text-green-400">$1</span>')
                .replace(/(\/\/[^\n]*)/g, '<span class="text-gray-500 italic">$1</span>')
                .replace(/\b(require|msg\.sender|msg\.value|block\.timestamp)\b/g, '<span class="text-blue-400">$1</span>');

            return (
                <div key={i} className="table-row">
                    <span className="table-cell text-right pr-4 text-gray-700 select-none text-xs w-8">{i + 1}</span>
                    <span className="table-cell" dangerouslySetInnerHTML={{ __html: highlightedLine || ' ' }} />
                </div>
            );
        });
    };

    return (
        <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0a0a0a] shadow-2xl my-6 group">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono ml-2">
                        <Terminal className="w-3 h-3" />
                        <span>{filename}</span>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
                    title="Copy code"
                >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm text-gray-300 leading-relaxed">
                    <div className="table w-full">
                        {highlightCode(code)}
                    </div>
                </pre>
            </div>
        </div>
    );
};

export default CodeBlockViewer;
