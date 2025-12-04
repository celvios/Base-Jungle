import React from 'react';
import HolographicComparison from './SpecimenGallery/HolographicComparison';
import MobileGallery from './SpecimenGallery/MobileGallery';

const TierShowcase: React.FC = () => {
    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:block">
                <HolographicComparison />
            </div>

            {/* Mobile View */}
            <div className="block md:hidden">
                <MobileGallery />
            </div>
        </>
    );
};

export default TierShowcase;
