"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, HeartPulse, Droplets, Wind, Thermometer, Gauge, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useLiveValue(base: number, jitter: number, min: number, max: number) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => {
        const next = v + (Math.random() * 2 - 1) * jitter;
        return Math.min(max, Math.max(min, Math.round(next * 10) / 10));
      });
    }, 2200);
    return () => clearInterval(id);
  }, [base, jitter, min, max]);
  return value;
}

function EkgTrace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="ekgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,60 L30,60 L40,60 L48,60 L52,40 L58,85 L64,55 L72,60 L120,60 L128,60 L134,28 L142,92 L150,60 L210,60 L220,60 L228,60 L232,38 L238,86 L244,58 L252,60 L300,60 L308,60 L314,30 L322,90 L330,60 L400,60"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 1 }}
        animate={{ x: [0, -400, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
      />
      <path
        d="M0,60 L400,60 L400,120 L0,120 Z"
        fill="url(#ekgFill)"
        opacity="0.6"
      />
    </svg>
  );
}

function VitalsTile({
  icon: Icon,
  label,
  value,
  unit,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  status: "healthy" | "warn" | "info";
}) {
  const tone =
    status === "healthy"
      ? "text-emerald-600 bg-emerald-500/10"
      : status === "warn"
        ? "text-amber-600 bg-amber-500/10"
        : "text-sky-600 bg-sky-500/10";
  return (
    <div className="rounded-xl border border-border bg-background px-2.5 py-2.5 card-soft">
      <div className="flex items-center gap-1.5">
        <span className={cn("flex size-6 items-center justify-center rounded-md", tone)}>
          <Icon className="size-3.5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}

export function LiveVitalsCard({ compact = false }: { compact?: boolean }) {
  const heartRate = useLiveValue(72, 2, 60, 88);
  const spo2 = useLiveValue(98, 0.4, 94, 100);
  const temp = useLiveValue(36.6, 0.1, 36.1, 37.2);
  const sys = useLiveValue(122, 2, 110, 130);
  const dia = useLiveValue(80, 1.5, 70, 88);
  const resp = useLiveValue(14, 1, 12, 18);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-4 card-soft">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Live Vitals</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Cpu className="size-3" /> Real-time
        </span>
      </div>

      <div className="relative h-16 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <EkgTrace className="h-full w-[160%] max-w-none" />
        </motion.div>
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border/60" />
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-3")}>
        <VitalsTile icon={HeartPulse} label="Heart Rate" value={`${heartRate}`} unit="bpm" status="healthy" />
        <VitalsTile icon={Droplets} label="SpO₂" value={`${spo2}%`} unit="Oxygen" status="healthy" />
        <VitalsTile icon={Thermometer} label="Temp" value={`${temp.toFixed(1)}°`} unit="Celsius" status="healthy" />
        <VitalsTile icon={Gauge} label="BP" value={`${sys}/${dia}`} unit="mmHg" status="healthy" />
        <VitalsTile icon={Wind} label="Respiration" value={`${resp}`} unit="breaths/min" status="healthy" />
        <VitalsTile icon={Activity} label="ECG" value="Sinus" unit="Normal" status="healthy" />
      </div>
    </div>
  );
}
