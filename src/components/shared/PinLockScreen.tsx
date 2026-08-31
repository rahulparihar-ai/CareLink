"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { cn } from "@/lib/utils";

export function PinLockScreen() {
  const pin = useAppStore((s) => s.pin);
  const setIsUnlocked = useAppStore((s) => s.setIsUnlocked);
  const setPinEnabled = useAppStore((s) => s.setPinEnabled);
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);

  const press = (d: string) => {
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    setError(false);
    if (next.length === 4) {
      const entered = next.join("");
      if (pin && entered === pin) {
        setIsUnlocked(true);
      } else if (!pin) {
        // first-time setup: set pin
        useAppStore.setState({ pin: entered });
        setIsUnlocked(true);
      } else {
        setError(true);
        setDigits([]);
      }
    }
  };

  const backspace = () => {
    setDigits((d) => d.slice(0, -1));
    setError(false);
  };

  const clear = () => { setPinEnabled(false); setIsUnlocked(true); };

  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center bg-card px-8">
      <CareLinkLogo size="lg" />

      <div className="mt-8 flex flex-col items-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-7" />
        </div>
        <p className="mt-3 text-lg font-semibold">App Locked</p>
        <p className="text-sm text-muted-foreground">{pin ? "Enter your PIN" : "Set your 4-digit PIN"}</p>

        {/* Dots */}
        <div className="mt-6 flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              animate={{ scale: digits[i] ? 1 : 0.7 }}
              className={cn(
                "size-4 rounded-full border-2 transition-colors",
                error ? "border-destructive" : "border-muted-foreground/40",
                digits[i] && (error ? "bg-destructive" : "bg-primary border-primary")
              )}
            />
          ))}
        </div>
        {error && <p className="mt-2 text-xs text-destructive">Incorrect PIN. Try again.</p>}
      </div>

      {/* Keypad */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button key={n} onClick={() => press(n)} aria-label={`Digit ${n}`}
            className="flex size-16 items-center justify-center rounded-2xl bg-muted text-xl font-semibold transition-transform active:scale-95">
            {n}
          </button>
        ))}
        <div />
        <button onClick={() => press("0")} aria-label="Digit 0"
          className="flex size-16 items-center justify-center rounded-2xl bg-muted text-xl font-semibold transition-transform active:scale-95">
          0
        </button>
        <button onClick={backspace} aria-label="Backspace" className="flex size-16 items-center justify-center rounded-2xl text-muted-foreground">
          ⌫
        </button>
      </div>

      <button onClick={clear} className="mt-6 text-sm text-muted-foreground underline">
        Disable lock (demo)
      </button>
    </div>
  );
}
