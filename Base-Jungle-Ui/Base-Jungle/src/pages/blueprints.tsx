import { useState } from "react";
import { motion } from "framer-motion";
import { FrequencyTuner } from "@/components/blueprints/frequency-tuner";
import { SankeyFlow } from "@/components/blueprints/sankey-flow";
import { LeverageSimulator } from "@/components/blueprints/leverage-simulator";
import { BotLogic } from "@/components/blueprints/bot-logic";
import { SafetyGrid } from "@/components/blueprints/safety-grid";

type Strategy = "conservative" | "balanced" | "aggressive";

export default function Blueprints() {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>("conservative");

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Frequency Tuner - Sticky Header */}
      <FrequencyTuner
        selectedStrategy={selectedStrategy}
        onStrategyChange={setSelectedStrategy}
      />

      {/* Main Content - No max-width for fullscreen */}
      <div className="w-full space-y-20">
        {/* Sankey Flow Section - Fullscreen */}
        <section className="min-h-screen flex items-center justify-center px-4 md:px-8">
          <motion.div
            className="w-full max-w-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4 text-[#0052FF]">
              Fund Flow Schematic
            </h2>
            <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
              Interactive visualization showing exactly where your funds go. Hover to highlight, click to deep-dive.
            </p>
            <SankeyFlow strategy={selectedStrategy} />
          </motion.div>
        </section>

        {/* Leverage Simulator (Aggressive only) - Fullscreen */}
        {selectedStrategy === "aggressive" && (
          <section className="min-h-screen flex items-center justify-center px-4 md:px-8 bg-gradient-to-b from-transparent via-[#0052FF]/5 to-transparent">
            <motion.div
              className="w-full max-w-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-center mb-4 text-[#0052FF]">
                Leverage Simulator
              </h2>
              <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
                See how leverage multiplies your exposure and potential returns
              </p>
              <LeverageSimulator />
            </motion.div>
          </section>
        )}

        {/* Bot Logic Board - Fullscreen */}
        <section className="min-h-screen flex items-center justify-center px-4 md:px-8">
          <motion.div
            className="w-full max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4 text-[#0052FF]">
              Bot Trigger Logic
            </h2>
            <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
              Automated decision-making explained through IF/THEN statements
            </p>
            <BotLogic />
          </motion.div>
        </section>

        {/* Safety Grid - Fullscreen */}
        <section className="min-h-screen flex items-center justify-center px-4 md:px-8 pb-20">
          <motion.div
            className="w-full max-w-6xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4 text-[#0052FF]">
              Safety Parameters
            </h2>
            <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
              Hardcoded risk controls protecting your capital
            </p>
            <SafetyGrid />
          </motion.div>
        </section>
      </div>
    </div>
  );
}
