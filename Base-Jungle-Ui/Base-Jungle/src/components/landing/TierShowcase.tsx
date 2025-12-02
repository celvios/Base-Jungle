import React from 'react';
import ParallaxScroll from './SpecimenGallery/ParallaxScroll';
import MobileGallery from './SpecimenGallery/MobileGallery';

const TierShowcase: React.FC = () => {
    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:block">
                <ParallaxScroll />
            </div>

            {/* Mobile View */}
            <div className="block md:hidden">
                <MobileGallery />
            </div>
        </>
    );
};

export default TierShowcase;
