"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Lightweight entrance animation wrapper. Respects the user's reduced-motion
 * preference and staggers nicely when used in a list (pass `index`).
 */
export function Reveal({
  children,
  delay = 0,
  index,
  className,
}: {
  children: ReactNode;
  delay?: number;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay + (index ?? 0) * 0.06, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}