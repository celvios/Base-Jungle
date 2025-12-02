import React from 'react';

interface TerminalLayoutProps {
    children: React.ReactNode;
}

const TerminalLayout: React.FC<TerminalLayoutProps> = ({ children }) => {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {children}
        </div>
    );
};

export default TerminalLayout;
