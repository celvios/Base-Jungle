import React, { useState, useEffect } from 'react';
import SystemIntegrity from '@/components/security/SystemIntegrity';
import GuardianMonitor from '@/components/security/GuardianMonitor';
import DefenseParameters from '@/components/security/DefenseParameters';
import AuditVault from '@/components/security/AuditVault';
import EmergencyOverride from '@/components/security/EmergencyOverride';
import InsuranceFund from '@/components/security/InsuranceFund';
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton';
import BackToHome from '@/components/ui/BackToHome';

const SecurityPage: React.FC = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#000000] text-white font-sans pb-24 md:pb-12">
                <BackToHome />
                <div className="w-full px-4 md:px-8 pt-24 md:pt-12 space-y-8">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-6 w-1/2" />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white font-sans pb-24 md:pb-12">
            <BackToHome />
            <div className="w-full px-4 md:px-8 pt-24 md:pt-12">

                {/* 1. Hero Section: System Integrity */}
                <SystemIntegrity />

                {/* 2. Main Module: The Guardian */}
                <GuardianMonitor />

                {/* 3. Defense Parameters */}
                <DefenseParameters />

                {/* 4. The Audit Vault */}
                <AuditVault />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 5. Emergency Override */}
                    <EmergencyOverride />

                    {/* 6. Insurance Fund */}
                    <InsuranceFund />
                </div>

            </div>
        </div>
    );
};

export default SecurityPage;
