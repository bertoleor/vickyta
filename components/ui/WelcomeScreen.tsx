"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeScreenProps {
  readonly message: string;
  readonly onComplete: () => void;
  readonly delay?: number;
}

/**
 * WelcomeScreen Component - iOS Style with smooth transitions
 * 
 * Displays a welcome message with a clean, centered layout.
 * Uses framer-motion for professional fade/scale transitions.
 */
export function WelcomeScreen({
  message,
  onComplete,
  delay = 500,
}: WelcomeScreenProps) {
  // Navigation auto-complete after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete();
    }, 5000); // Exactly 5 seconds

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      >
        <div className="relative text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight"
          >
            {message}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-4 text-text-secondary font-medium"
          >
            Tu asistente financiero personal
          </motion.p>
          
          {/* Progress bar indicator */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute -bottom-12 left-0 h-1 bg-primary/20 rounded-full"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
