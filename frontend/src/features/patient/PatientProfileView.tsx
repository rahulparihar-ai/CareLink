"use client";

import { Copy, Share2, QrCode, ShieldCheck, User, Phone, Droplets, BadgeCheck } from "lucide-react";
import { useAppStore } from "@/store";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { InfoRow, SectionTitle } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useState } from "react";

export function PatientProfileView() {
  const setView = useAppStore((s) => s.setView);
  const p = useAppStore((s) => s.patientProfile);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p?.id ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!p) {
    return (
      <PatientPageShell title="Profile" currentTab="PATIENT_PROFILE" onBack={() => setView("PATIENT_HOME")}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center card-soft">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="size-7" />
          </div>
          <p className="mt-3 font-semibold">No profile yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete registration to build your CareLink health profile.
          </p>
        </div>
      </PatientPageShell>
    );
  }

  const share = async () => {
    const data = { title: "CareLink Health ID", text: `My CareLink patient ID is ${p?.id} (${p?.name}).`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(data.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <PatientPageShell title="Profile" currentTab="PATIENT_PROFILE" onBack={() => setView("PATIENT_HOME")}>
      {/* Identity card */}
      <div className="hero-glow overflow-hidden rounded-3xl border border-primary/20 bg-card p-5 card-soft">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
            {p?.name?.charAt(0) ?? "R"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{p?.name}</p>
            <p className="text-sm text-muted-foreground">{p?.id}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <StatusBadge variant="success" dot>{p?.abhaStatus ?? "Not Linked"}</StatusBadge>
              <StatusBadge variant="muted">{p?.bloodGroup}</StatusBadge>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={copy} className="flex-1">
            {copied ? <BadgeCheck className="mr-1.5 size-4 text-emerald-500" /> : <Copy className="mr-1.5 size-4" />}
            {copied ? "Copied!" : "Copy ID"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowQr(true)} className="flex-1">
            <QrCode className="mr-1.5 size-4" /> QR
          </Button>
          <Button size="sm" variant="outline" onClick={share} className="flex-1">
            <Share2 className="mr-1.5 size-4" /> Share
          </Button>
        </div>
      </div>

      {/* Basic info */}
      <section className="mt-6">
        <SectionTitle title="Basic Information" />
        <div className="rounded-2xl border border-border bg-card p-3 card-soft">
          <InfoRow icon={User} label="Age / Gender" value={`${p?.age} · ${p?.gender}`} />
          <div className="mx-4 h-px bg-border" />
          <InfoRow icon={Phone} label="Mobile" value={p?.mobileNumber} />
          <div className="mx-4 h-px bg-border" />
          <InfoRow icon={Droplets} label="Blood Group" value={p?.bloodGroup} />
          <div className="mx-4 h-px bg-border" />
          <InfoRow icon={ShieldCheck} label="Emergency Contact" value={<span className="text-xs">{p?.emergencyContact}</span>} />
        </div>
      </section>

      {/* QR modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setShowQr(false)}>
          <div className="rounded-3xl bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold">CareLink Patient ID</p>
            <p className="text-xs text-muted-foreground">{p?.id}</p>
            <div className="mt-4 flex justify-center rounded-2xl border border-border bg-white p-4">
              <QRCodeSVG value={p?.id ?? ""} size={160} fgColor="#1a6eb5" />
            </div>
            <Button className="mt-4 w-full" onClick={() => setShowQr(false)}>Done</Button>
          </div>
        </div>
      )}
    </PatientPageShell>
  );
}
