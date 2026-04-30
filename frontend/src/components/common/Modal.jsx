
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";

/**
 * Modal: The System Interaction Node
 * Designed with a high-fidelity 'Commercial Operations' design language.
 */
const Modal = ({ isOpen, onClose, title, children, size = "xl" }) => {
  const sizeClasses = {
    "sm": "max-w-sm",
    "md": "max-w-md",
    "lg": "max-w-lg",
    "xl": "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Elite Backdrop Protocol */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md"
          />
          
          {/* Modal Intelligence Layer */}
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
              className={`bg-white rounded-[3.5rem] shadow-3xl shadow-slate-900/20 w-full ${sizeClasses[size] || "max-w-xl"} overflow-hidden pointer-events-auto border border-slate-100 flex flex-col max-h-[95vh]`}
            >
              {/* Modal Control Header */}
              <div className="flex items-center justify-between px-10 pt-12 pb-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tightest uppercase italic leading-tight">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-inner active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Dynamic Content Repository */}
              <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                {children}
              </div>
              
              {/* Security Badge Footer */}
              <div className="px-10 pb-6 pt-2 flex items-center justify-center gap-3 opacity-20">
                 <ShieldCheck className="w-3 h-3 text-slate-400" />
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Authorized Transaction Node</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
