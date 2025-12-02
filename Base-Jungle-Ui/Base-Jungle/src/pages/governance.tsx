import React from 'react';
import ConstitutionTimeline from '@/components/governance/ConstitutionTimeline';
import Roundtable from '@/components/governance/Roundtable';
import TimeChamber from '@/components/governance/TimeChamber';
import FutureBallot from '@/components/governance/FutureBallot';
import ForumFeed from '@/components/governance/ForumFeed';
import BackToHome from '@/components/ui/BackToHome';

const GovernancePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 md:pb-12">
            <BackToHome />
            <div className="w-full px-4 md:px-8 pt-24 md:pt-12">

                {/* 1. Hero Section: The Constitution */}
                <ConstitutionTimeline />

                {/* 2. Main Module: The Roundtable */}
                <Roundtable />

                {/* 3. The Time Chamber */}
                <TimeChamber />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 4. Future Ballot (Teaser) */}
                    <div className="lg:col-span-2">
                        <FutureBallot />
                    </div>

                    {/* 5. Forum Link (Soft Governance) */}
                    <div className="lg:col-span-1">
                        <ForumFeed />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GovernancePage;
