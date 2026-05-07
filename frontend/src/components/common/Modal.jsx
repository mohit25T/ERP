
import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldCheck } from "lucide-react";

/**
 * Modal: The System Interaction Node
 * Refined for enterprise density and dark mode support.
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
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    "full": "max-w-[95vw]",
    "screen": "max-w-full h-full rounded-none"
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Elite Backdrop Protocol */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm"
          />
          
          {/* Modal Intelligence Layer */}
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`bg-card rounded-md shadow-2xl w-full ${sizeClasses[size] || "max-w-xl"} overflow-hidden pointer-events-auto border border-border flex flex-col max-h-[90vh]`}
            >
              {/* Modal Control Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                   <div className="w-1 h-4 bg-primary rounded-full"></div>
                   <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Dynamic Content Repository */}
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 text-sm">
                {children}
              </div>
              
              {/* Security Badge Footer */}
              <div className="px-4 py-3 border-t border-border/50 flex items-center justify-center gap-2 opacity-40">
                 <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                 <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Enterprise Secured Node</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
