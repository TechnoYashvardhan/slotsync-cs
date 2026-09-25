import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface AnimatedViewWrapperProps {
  viewKey: string;
  children: React.ReactNode;
}

export function AnimatedViewWrapper({ viewKey, children }: AnimatedViewWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
        animate={{
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] },
        }}
        exit={{
          opacity: 0,
          y: -4,
          filter: 'blur(2px)',
          transition: { duration: 0.15, ease: 'easeIn' },
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
