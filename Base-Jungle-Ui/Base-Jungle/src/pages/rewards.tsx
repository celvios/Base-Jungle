import { PointsBreakdown } from "@/components/rewards/PointsBreakdown";
import { ReferralEarnings } from "@/components/rewards/ReferralEarnings";
import { TGEChecklist } from "@/components/rewards/TGEChecklist";

export default function RewardsPage() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8 lg:px-12">
            <div className="w-full space-y-8">

                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <a href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6" /></svg>
                            Back to Dashboard
                        </a>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
                        TGE Control Center
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        Track your ecosystem contributions, manage rewards, and prepare for the Token Generation Event.
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Points Engine */}
                    <div className="lg:col-span-1">
                        <PointsBreakdown />
                    </div>

                    {/* Middle Column: TGE Checklist */}
                    <div className="lg:col-span-1">
                        <TGEChecklist />
                    </div>

                    {/* Right Column: Earnings */}
                    <div className="lg:col-span-1">
                        <ReferralEarnings />
                    </div>
                </div>

                {/* Footer Hint */}
                <div className="text-center text-xs text-muted-foreground/50 pt-8">
                    <p>Points are updated hourly. TGE eligibility is subject to DAO governance votes.</p>
                </div>
            </div>
        </div>
    );
}
