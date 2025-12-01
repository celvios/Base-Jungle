import { useState } from "react";
import { motion } from "framer-motion";
import { RootSystem } from "@/components/blueprints/root-system";
import { LeverageLoop } from "@/components/blueprints/leverage-loop";
import { SafetyValve } from "@/components/blueprints/safety-valve";
import { RebalanceSimulator } from "@/components/blueprints/rebalance-simulator";
import { WireframeGlobe } from "@/components/blueprints/wireframe-globe";

type StrategyLayer = "conservative" | "balanced" | "aggressive";

export default function Blueprints() {
  const [selectedLayer, setSelectedLayer] = useState<StrategyLayer>("conservative");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Hero Section: Wireframe Globe - Full Screen */}
      <section className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
        <WireframeGlobe
          selectedLayer={selectedLayer}
          isExpanded={isExpanded}
          onLayerSelect={setSelectedLayer}
          onExpand={setIsExpanded}
        />

        {/* Layer Navigation */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-wrap gap-4 z-10 px-4">
          {[
            { id: "conservative", label: "Understory", subtitle: "Conservative" },
            { id: "balanced", label: "Canopy", subtitle: "Balanced" },
            { id: "aggressive", label: "Emergent", subtitle: "Aggressive" }
          ].map((layer) => (
            <motion.button
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id as StrategyLayer)}
              className={`px-6 py-3 rounded-lg border-2 transition-all backdrop-blur-sm ${selectedLayer === layer.id
                ? "border-cyan-400 bg-cyan-400/20 text-cyan-400 shadow-lg shadow-cyan-400/50"
                : "border-white/20 bg-black/40 text-white/60 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-sm font-bold">{layer.label}</div>
              <div className="text-xs opacity-70">{layer.subtitle}</div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Root System Section */}
      <section className="py-20 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-cyan-400">
            The Root System
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
            Watch your funds flow through the DeFi ecosystem
          </p>
          <RootSystem strategy={selectedLayer} />
        </motion.div>
      </section>

      {/* Leverage Loop (Aggressive only) */}
      {selectedLayer === "aggressive" && (
        <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-transparent to-cyan-950/10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-cyan-400">
              The Leverage Loop
            </h2>
            <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
              Understanding 3x leverage through recursive borrowing
            </p>
            <LeverageLoop />
          </motion.div>
        </section>
      )}

      {/* Safety Valve */}
      <section className="py-20 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-cyan-400">
            Safety Controls
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
            Multi-layered risk management system
          </p>
          <SafetyValve />
        </motion.div>
      </section>

      {/* Rebalance Simulator */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-cyan-950/10 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-cyan-400">
            Rebalance Simulator
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
            See how the system adapts to changing market conditions
          </p>
          <RebalanceSimulator />
        </motion.div>
      </section>
    </div>
  );
}
