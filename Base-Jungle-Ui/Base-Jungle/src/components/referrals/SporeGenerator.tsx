import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface SporeGeneratorProps {
    referralCode: string;
    referralLink: string;
}

const SporeGenerator: React.FC<SporeGeneratorProps> = ({ referralCode, referralLink }) => {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast({
            title: "Spore sequence copied",
            description: "Ready for distribution.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-blue-900/30 rounded-2xl p-6 w-full max-w-md relative overflow-hidden group">
            {/* Holographic Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 animate-scan" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Share2 className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white font-mono tracking-wider">SPORE GENERATOR</h3>
                </div>

                <p className="text-sm text-gray-400 mb-6 font-mono">
                    Distribute your unique genetic sequence to grow your colony. Earn 10% of referred yield.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-blue-400 font-mono uppercase mb-1 block">Genetic Sequence (Code)</label>
                        <div className="font-mono text-xl font-bold text-white tracking-widest bg-black/50 p-2 rounded border border-blue-900/50">
                            {referralCode || "LOADING..."}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-blue-400 font-mono uppercase mb-1 block">Propagation Vector (Link)</label>
                        <div className="flex gap-2">
                            <Input
                                value={referralLink}
                                readOnly
                                className="bg-black/50 border-blue-900/50 text-gray-300 font-mono text-xs"
                            />
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                className="border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SporeGenerator;
