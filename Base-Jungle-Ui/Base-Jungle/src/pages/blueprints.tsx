import React, { useState } from 'react';
import ControlDeck from '@/components/blueprints/ControlDeck';
import LogicBlockDiagram from '@/components/blueprints/LogicBlockDiagram';
import AllocationMatrix from '@/components/blueprints/AllocationMatrix';
import LeverageEngine from '@/components/blueprints/LeverageEngine';
import SimulationBench from '@/components/blueprints/SimulationBench';
import GlossarySidebar from '@/components/blueprints/GlossarySidebar';

const BlueprintsPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState('tree');

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pt-20 pb-16">
      <div className="flex">

        {/* Main Content Area */}
        <div className="flex-1 px-6 md:px-12 xl:pr-72 max-w-7xl mx-auto w-full">

          {/* Page Header */}
          <div className="mb-10 border-b border-gray-800 pb-6">
            <h1 className="text-4xl font-bold font-mono tracking-tight mb-2 text-white">
              The Architecture Lab
            </h1>
            <p className="text-gray-400 font-mono text-sm max-w-2xl">
              <span className="text-cyan-500">{">>"}</span> ACCESSING SECURE BLUEPRINTS...<br />
              <span className="text-cyan-500">{">>"}</span> DECRYPTING PROTOCOL LOGIC...
            </p>
          </div>

          {/* 1. Control Deck */}
          <ControlDeck selectedTier={selectedTier} onSelectTier={setSelectedTier} />

          {/* 2. Logic Block Diagram */}
          <div className="mb-12">
            <LogicBlockDiagram selectedTier={selectedTier} />
          </div>

          {/* 3. Allocation Matrix */}
          <div className="mb-12">
            <AllocationMatrix selectedTier={selectedTier} />
          </div>

          {/* 4. Leverage Engine (Conditional) */}
          {(selectedTier === 'tree' || selectedTier === 'forest') && (
            <div className="mb-12">
              <LeverageEngine selectedTier={selectedTier} />
            </div>
          )}

          {/* 5. Simulation Bench */}
          <div className="mb-12">
            <SimulationBench selectedTier={selectedTier} />
          </div>

        </div>

        {/* 6. Glossary Sidebar */}
        <GlossarySidebar />

      </div>
    </div>
  );
};

export default BlueprintsPage;
