import { motion } from "framer-motion";
import { Hammer } from "lucide-react";

const HammerLoader = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Anvil Base with Metallic Finish */}
        <div className="w-20 h-6 bg-slate-900 rounded-t-sm rounded-b-md mb-2 shadow-2xl animate-anvil flex items-center justify-center overflow-hidden border-b-4 border-slate-950">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-900 to-slate-950 opacity-90" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
          <div className="w-12 h-1 bg-indigo-500/20 rounded-full blur-[2px] -translate-y-1" />
        </div>

        {/* Heavy Industrial Hammer - Adjusted left for center strike alignment */}
        <motion.div
          className="absolute -top-14 -left-10 text-slate-800 animate-hammer drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]"
        >
          <Hammer size={54} fill="currentColor" strokeWidth={1} />
        </motion.div>

        {/* Impact Spark System */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 0],
                opacity: [0, 1, 0],
                x: [0, (i - 1.5) * 25, (i - 1.5) * 40],
                y: [0, -25, -5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                times: [0.28, 0.32, 0.45],
                ease: "easeOut"
              }}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full blur-[0.5px] shadow-[0_0_10px_#fbbf24]"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] ">Forging Data...</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manufacturing Intelligence Active</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-20 flex items-center justify-center">
      {content}
    </div>
  );
};

export default HammerLoader;
