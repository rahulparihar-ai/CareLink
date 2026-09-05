"use client";

import { motion } from "framer-motion";

interface ThorCharacterProps {
  /** Base size in px of the clickable badge (the character fills it). */
  size?: number;
  /** True while Thor is narrating (extra sparkle animation). */
  talking?: boolean;
  /** True when the chat panel is open (badge switches to a close affordance). */
  active?: boolean;
  onClick?: () => void;
}

/**
 * Chibi "Thor" — a Stormbreaker-wielding boy guide. Pure inline SVG + Framer
 * Motion: gentle hover-float, an occasional hammer swing/shimmer, and a
 * lightning shimmer whenever Thor "talks". Respects reduced-motion via the
 * app's store so animations simply freeze into a static pose.
 */
export function ThorCharacter({ size = 64, talking = false, active = false, onClick }: ThorCharacterProps) {
  const float = { y: [0, -5, 0], rotate: [-2, 2, -2] };

  return (
    <motion.button
      type="button"
      aria-label={active ? "Close Thor guide" : "Talk to Thor guide"}
      onClick={onClick}
      className="relative grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.92 }}
      animate={active ? { scale: 1, rotate: 0 } : float}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* soft glow behind the character */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-amber-300/40 blur-md"
        animate={talking ? { opacity: [0.3, 0.9, 0.3], scale: [1, 1.15, 1] } : { opacity: 0.5, scale: 1 }}
        transition={{ duration: talking ? 0.9 : 2.4, repeat: Infinity }}
      />

      {/* the character */}
      <svg viewBox="0 0 100 100" width={size} height={size} className="relative z-10 drop-shadow-sm">
        {/* cape */}
        <motion.path
          d="M50 18 C 32 24 26 40 22 68 C 30 62 36 62 42 66 C 40 52 44 42 50 40 C 56 42 60 52 58 66 C 64 62 70 62 78 68 C 74 40 68 24 50 18 Z"
          fill="#C0392B"
          animate={talking ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* body / tunic */}
        <path d="M37 40 C 37 60 40 74 50 82 C 60 74 63 60 63 40 Z" fill="#2471A3" />
        <path d="M40 44 L 60 44 L 57 70 L 50 76 L 43 70 Z" fill="#1F618D" />
        <path d="M37 58 Q 50 64 63 58 L 62 64 Q 50 70 38 64 Z" fill="#F5B041" />

        {/* head */}
        <circle cx="50" cy="28" r="16" fill="#FAD7A0" />
        {/* hair */}
        <path d="M34 26 C 34 14 44 8 50 9 C 56 14 62 18 64 26 C 58 21 55 18 50 18 C 45 18 42 21 34 26 Z" fill="#F1C40F" />
        <path d="M50 9 C 48 12 48 15 49 18 C 51 19 52 18 51 16 C 52 13 51 10 50 9 Z" fill="#F1C40F" />

        {/* winged helmet */}
        <path d="M34 22 L 20 12 L 30 26 Q 35 20 34 22 Z" fill="#95A5A6" />
        <path d="M66 22 L 80 12 L 70 26 Q 65 20 66 22 Z" fill="#95A5A6" />
        <path d="M34 20 C 34 12 46 8 50 9 C 54 8 66 12 66 20 C 62 17 54 15 50 16 C 46 15 38 17 34 20 Z" fill="#B9C9D3" />

        {/* eyes */}
        <circle cx="44" cy="27" r="2.2" fill="#2C3E50" />
        <circle cx="56" cy="27" r="2.2" fill="#2C3E50" />
        <circle cx="44.6" cy="26.4" r="0.7" fill="#FFFFFF" />
        <circle cx="56.6" cy="26.4" r="0.7" fill="#FFFFFF" />

        {/* smile */}
        <path d="M45 33 Q 50 37 55 33" stroke="#2C3E50" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* Stormbreaker - floating beside his raised hand */}
        <motion.g
          animate={talking ? { rotate: [0, -14, 6, 0] } : { rotate: [0, 4, 0] }}
          transition={{ duration: talking ? 1.1 : 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "70px 46px" }}
        >
          {/* handle */}
          <path d="M66 86 L 78 30" stroke="#8D6E63" strokeWidth="5" strokeLinecap="round" />
          <path d="M67 82 L 77 34" stroke="#A1887F" strokeWidth="2" strokeLinecap="round" />
          {/* axe head */}
          <path d="M76 30 L 84 22 Q 92 20 93 28 Q 94 36 86 36 L 78 34 Z" fill="#7F8C8D" />
          <path d="M80 29 L 88 26" stroke="#BDC3C7" strokeWidth="1.4" strokeLinecap="round" />
          {/* rune glow */}
          <motion.rect
            x="80"
            y="26"
            width="8"
            height="6"
            rx="1.5"
            fill="#F9E79F"
            opacity={0}
            animate={talking ? { opacity: [0, 0.9, 0] } : { opacity: [0, 0.35, 0] }}
            transition={{ duration: talking ? 0.8 : 2, repeat: Infinity }}
          />
        </motion.g>

        {/* arm holding the hammer */}
        <path d="M58 44 C 64 46 68 50 70 56 C 72 49 70 43 66 40 C 62 38 58 40 58 44 Z" fill="#FAD7A0" />

        {/* lightning sparks while talking */}
        {talking && (
          <>
            <motion.path
              d="M12 34 L 18 28 L 15 40 L 22 38 L 13 52"
              stroke="#F1C40F"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              style={{ transformOrigin: "17px 40px" }}
            />
            <motion.path
              d="M88 58 L 92 52 L 90 60 L 95 56 L 84 68"
              stroke="#F9E79F"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: 0.35 }}
              style={{ transformOrigin: "90px 60px" }}
            />
          </>
        )}
      </svg>
    </motion.button>
  );
}