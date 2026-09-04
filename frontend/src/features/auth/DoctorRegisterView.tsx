"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Stethoscope, Phone, ShieldCheck, CheckCircle2,
  UserRound, Lock, Building2, AlertTriangle, BadgeCheck, Search,
  Briefcase, UserCheck, MailCheck, Check, Copy,
} from "lucide-react";
import { useAppStore } from "@/store";
import { generatePatientId } from "@/lib/brand/constants";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { getLanguageDir } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";
import { PRACTICE_TYPES, type PracticeType, DEMO_ORGANIZATIONS } from "@/data/organizations";
import {
  PROFESSION_TYPES, CREDENTIAL_FIELDS, COUNCILS, INDIAN_STATES,
  type ProfessionType,
} from "@/data/professions";
import { verifyProfessionalCredentials, verifyIdentity } from "@/services/verificationService";
import { validateMobile, sendOtp, verifyOtp, type AuthResult } from "@/services/authService";

const STEPS = [
  { key: "profession" },
  { key: "mobile" },
  { key: "basic" },
  { key: "credentials" },
  { key: "verification" },
  { key: "account" },
  { key: "practice" },
  { key: "welcome" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const SPECIALIZATIONS = [
  "General Medicine", "Cardiology", "Dermatology", "Gastroenterology",
  "Gynecology", "Neurology", "Ophthalmology", "Orthopedics", "Pediatrics",
  "Psychiatry", "ENT", "Pulmonology", "Nephrology", "Geriatrics",
];

const GENDERS = ["male", "female", "other"] as const;

export function DoctorRegisterView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const setRole = useAppStore((s) => s.setRole);
  const loginMobile = useAppStore((s) => s.loginMobile);
  const setLoginMobile = useAppStore((s) => s.setLoginMobile);
  const setDoctorProfile = useAppStore((s) => s.setDoctorProfile);
  const addAuditEvent = useAppStore((s) => s.addAuditEvent);
  const language = useAppStore((s) => s.language);

  const [step, setStep] = useState<StepKey>("profession");

  // Step 1 — profession
  const [professionType, setProfessionType] = useState<ProfessionType | null>(null);

  // Step 2 — mobile OTP
  const [mobile, setMobile] = useState(loginMobile || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileErr, setMobileErr] = useState("");
  const [otpErr, setOtpErr] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // Step 3 — basic details
  const [basic, setBasic] = useState({ name: "", age: "", gender: "", languages: "" });

  // Step 4 — credentials (profession-specific)
  const [creds, setCreds] = useState({
    council: "", registrationNumber: "", registrationDate: "", qualification: "",
    specialization: "", experience: "", state: "",
  });

  // Step 5 — professional verification
  const [profStatus, setProfStatus] = useState<"verified" | "pending" | "idle">("idle");
  const [profChecking, setProfChecking] = useState(false);

  // Step 6 — identity verification
  const [idStatus, setIdStatus] = useState<"verified" | "idle">("idle");
  const [idChecking, setIdChecking] = useState(false);

  // Step 7 — account
  const [account, setAccount] = useState({ password: "", confirm: "" });

  // Step 8-10 — practice type & workplace
  const [practiceType, setPracticeType] = useState<PracticeType | "">("");
  const [orgSearch, setOrgSearch] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [clinicRequest, setClinicRequest] = useState(false);
  const [workplaceFilter, setWorkplaceFilter] = useState<"all" | PracticeType>("all");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // CareLink Doctor ID assigned at registration. The doctor logs in with this
  // account ID + password. It is separate from any professional registration
  // number (NMC/HPR/HP-ID) or hospital ID.
  const [issuedDoctorId, setIssuedDoctorId] = useState("");

  const set = <K extends keyof typeof basic>(k: K, v: string) => setBasic((f) => ({ ...f, [k]: v }));
  const setCred = <K extends keyof typeof creds>(k: K, v: string) => setCreds((f) => ({ ...f, [k]: v }));
  const setAcc = <K extends keyof typeof account>(k: K, v: string) => setAccount((f) => ({ ...f, [k]: v }));

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isIndependent = practiceType === "independent";

  const displayedIndex = STEPS.findIndex((s) => s.key === step);

  const goBack = () => {
    setError("");
    if (stepIndex === 0) {
      setView("DOCTOR_LOGIN");
      return;
    }
    setStep(STEPS[stepIndex - 1].key);
  };

  const runMobileOtp = async (action: "send" | "verify") => {
    setMobileErr("");
    setOtpErr("");
    if (action === "send") {
      if (!validateMobile(mobile)) {
        setMobileErr(t("dreg.mobile.invalid"));
        return;
      }
      setSendingOtp(true);
      const res: AuthResult = await sendOtp(mobile);
      setSendingOtp(false);
      if (!res.ok) {
        setMobileErr(t("dreg.mobile.invalid"));
        return;
      }
      setOtpSent(true);
      return;
    }
    // verify
    if (!otp.trim()) {
      setOtpErr(t("dreg.mobile.otpInvalid"));
      return;
    }
    setSendingOtp(true);
    const res: AuthResult = await verifyOtp(otp.trim());
    setSendingOtp(false);
    if (!res.ok) {
      setOtpErr(t("dreg.mobile.otpInvalid"));
      return;
    }
    setMobileVerified(true);
    setLoginMobile(mobile);
  };

  const runProfVerification = async () => {
    setProfChecking(true);
    setError("");
    const res = await verifyProfessionalCredentials({
      name: basic.name,
      registrationNumber: creds.registrationNumber,
      council: creds.council,
    });
    setProfChecking(false);
    setProfStatus(res.status === "verified" ? "verified" : "pending");
  };

  const runIdentityVerification = async () => {
    setIdChecking(true);
    setError("");
    const res = await verifyIdentity({ name: basic.name, mobile });
    setIdChecking(false);
    setIdStatus(res.status === "verified" ? "verified" : "idle");
  };

  // Runs both professional and identity checks together on the single
  // "verification" step, then advances to the account step.
  const runAllVerification = async () => {
    if (profChecking || idChecking) return;
    setError("");
    await Promise.all([runProfVerification(), runIdentityVerification()]);
    setStep("account");
  };

  const finalize = () => {
    setSaving(true);
    const doctorId = generatePatientId().replace("CL", "DR");
    const name = basic.name.trim();
    const langs = basic.languages.split(",").map((l) => l.trim()).filter(Boolean);
    const pt = (practiceType || "independent") as PracticeType;
    const needsWorkplace = pt === "government" || pt === "private" || pt === "clinic";
    setIssuedDoctorId(doctorId);

    setDoctorProfile({
      id: doctorId,
      name: name.startsWith("Dr") ? name : `Dr. ${name}`,
      specialization: creds.specialization,
      facility: workplace,
      mobileNumber: mobile || (loginMobile || undefined),
      gender: basic.gender || undefined,
      professionalId: creds.registrationNumber || undefined,
      loginId: mobile,
      doctorId,
      password: account.password || undefined,
      languages: langs,
      experience: creds.experience || undefined,
      age: basic.age || undefined,
      mobileVerified: true,
      professionType: (professionType || "medical-doctor"),
      profession: PROFESSION_TYPES.find((p) => p.value === professionType)?.label ?? "Medical Doctor",
      qualification: creds.qualification || undefined,
      registrationNumber: creds.registrationNumber || undefined,
      council: creds.council || undefined,
      state: creds.state || undefined,
      registrationDate: creds.registrationDate || undefined,
      // Professional verification is separate from workplace affiliation.
      professionalVerification: profStatus === "verified" ? "verified" : "pending",
      identityVerified: idStatus === "verified",
      practiceType: pt,
      workplaceType: needsWorkplace ? pt : undefined,
      workplace: pt === "independent" ? undefined : workplace,
      workplaceVerified: false,
      affiliationStatus: pt === "independent" ? "none" : "pending",
      clinicRequest:
        pt === "clinic" && clinicRequest && !workplace
          ? { name: (workplace || basic.name.split(" ")[0] + "'s Clinic").trim(), status: "requested" }
          : undefined,
    });

    addAuditEvent({
      id: doctorId + "-reg-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: name,
      role: "DOCTOR",
      action: "PROFILE_CREATED",
      detail: `Doctor registration · profession=${professionType ?? ""} · practice=${pt} · professionalVerification=${profStatus} · identity=${idStatus} · affiliation=${pt === "independent" ? "none" : "pending"}`,
    });

    setRole("DOCTOR");
    setSaving(false);
    setStep("welcome");
  };

  const finish = () => setView("DOCTOR_HOME");

  const dir = getLanguageDir(language);
  const inputCls =
    "w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  const credentialFields = professionType ? CREDENTIAL_FIELDS[professionType] : CREDENTIAL_FIELDS["medical-doctor"];

  const stepLabel = (key: StepKey) => t(`dreg.step.${key}`);

  const orgs = PRACTICE_TYPES.map((pt) => pt.value)
    .filter((v): v is PracticeType => v !== "independent");

  // Demo organization directory imported from /data/organizations (clearly labelled demo).
  const demoOrgs = DEMO_ORGANIZATIONS;

  const filteredOrgs = demoOrgs.filter((o) => {
    if (practiceType && o.type !== practiceType) return false;
    if (workplaceFilter !== "all" && o.type !== workplaceFilter) return false;
    if (orgSearch.trim() && !o.name.toLowerCase().includes(orgSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card" dir={dir}>
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label={t("dreg.back")}>
          <ChevronLeft />
        </Button>
        <div className="mx-auto">
          <CareLinkLogo size="sm" />
        </div>
        <div className="w-9" />
      </div>

      <div className="px-6">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const active = i <= displayedIndex;
            const isCurrent = i === displayedIndex;
            return (
              <div key={s.key} className="flex flex-1 items-center gap-1">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isCurrent ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-0.5 flex-1 rounded-full", i < displayedIndex ? "bg-primary/40" : "bg-muted")} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-center">
          {STEPS.map((s) => (
            <span
              key={s.key}
              className={cn("flex-1 text-[9px] font-medium", STEPS.findIndex((x) => x.key === step) === STEPS.findIndex((x) => x.key === s.key) ? "text-primary" : "text-muted-foreground")}
            >
              {stepLabel(s.key)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {/* ===== STEP 1: PROFESSION ===== */}
            {step === "profession" && (
              <div>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Briefcase className="size-7" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">{t("dreg.joinTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.joinSubtitle")}</p>

                <div className="mt-5 space-y-2.5">
                  {PROFESSION_TYPES.map((p) => {
                    const active = professionType === p.value;
                    return (
                      <button key={p.value} onClick={() => { setProfessionType(p.value); setError(""); }}
                        className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors card-soft",
                          active ? "border-primary bg-primary/5" : "border-border bg-card")}>
                        <span className={cn("flex size-10 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          {p.value === "medical-doctor" ? <Stethoscope className="size-5" /> : p.value === "nurse" ? <ShieldCheck className="size-5" /> : <Briefcase className="size-5" />}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.desc}</p>
                        </div>
                        {active && <CheckCircle2 className="size-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </div>
            )}

            {/* ===== STEP 2: MOBILE OTP ===== */}
            {step === "mobile" && (
              <div>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Phone className="size-7" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">{t("dreg.mobile.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.mobile.subtitle")}</p>

                <div className="mt-5 space-y-4">
                  {!otpSent ? (
                    <>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">{t("dreg.mobile.number")}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">+91</span>
                          <input
                            inputMode="numeric"
                            value={mobile}
                            onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "").slice(0, 10)); setMobileErr(""); }}
                            placeholder="9876543210"
                            className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                          />
                        </div>
                        {mobileErr && <p className="mt-1.5 text-sm text-destructive">{mobileErr}</p>}
                      </div>
                      <Button size="lg" className="h-14 w-full text-base" disabled={sendingOtp} onClick={() => runMobileOtp("send")}>
                        {sendingOtp ? t("dreg.saving") : t("dreg.mobile.sendOtp")} <ChevronRight className="ml-1.5" />
                      </Button>
                    </>
                  ) : mobileVerified ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <MailCheck className="size-6 text-emerald-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">+91 {mobile}</p>
                        <p className="text-xs text-muted-foreground">{t("dreg.mobile.mockHint")}</p>
                      </div>
                      <CheckCircle2 className="size-6 text-emerald-600" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">{t("dreg.mobile.enterOtp")}</label>
                        <div className="flex items-center justify-between rounded-xl border border-input bg-card px-4 py-3">
                          <span className="text-sm font-medium">+91 {mobile}</span>
                          <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">{t("dreg.mobile.mockHint")}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input
                            inputMode="numeric"
                            value={otp}
                            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpErr(""); }}
                            placeholder="••••••"
                            className="flex-1 rounded-xl border border-input bg-card px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] outline-none focus:border-ring"
                          />
                          <Button variant="outline" disabled={sendingOtp} onClick={() => runMobileOtp("send")}>
                            {t("dreg.mobile.resend")}
                          </Button>
                        </div>
                        {otpErr && <p className="mt-1.5 text-sm text-destructive">{otpErr}</p>}
                      </div>
                      <Button size="lg" className="h-14 w-full text-base" disabled={sendingOtp} onClick={() => runMobileOtp("verify")}>
                        {sendingOtp ? t("dreg.saving") : t("dreg.mobile.verifyOtp")} <ChevronRight className="ml-1.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ===== STEP 3: BASIC DETAILS ===== */}
            {step === "basic" && (
              <div>
                <h1 className="text-2xl font-bold">{t("dreg.basic.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.basic.subtitle")}</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.fullName")}</label>
                    <input value={basic.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.age")}</label>
                      <input type="number" inputMode="numeric" min={18} max={90} value={basic.age}
                        onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="35" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.gender")}</label>
                      <select value={basic.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
                        <option value="">{t("dreg.genderOther")}</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g === "male" ? t("dreg.genderMale") : g === "female" ? t("dreg.genderFemale") : t("dreg.genderOther")}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.profession")}</label>
                    <input readOnly value={PROFESSION_TYPES.find((p) => p.value === professionType)?.label ?? "—"} className={cn(inputCls, "bg-muted/40 text-muted-foreground")} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.languages")}</label>
                    <input value={basic.languages} onChange={(e) => set("languages", e.target.value)} placeholder="English, Hindi, Urdu" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 4: CREDENTIALS (profession-specific) ===== */}
            {step === "credentials" && (
              <div>
                <h1 className="text-2xl font-bold">{t("dreg.credentials.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.credentials.subtitle")}</p>
                <div className="mt-5 space-y-4">
                  {credentialFields.includes("council") && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.council")}</label>
                      <select value={creds.council} onChange={(e) => setCred("council", e.target.value)} className={inputCls}>
                        <option value="">{t("dreg.selectCouncil")}</option>
                        {(COUNCILS[professionType ?? "medical-doctor"] ?? []).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  {credentialFields.includes("registrationNumber") && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.regNumber")}</label>
                      <input value={creds.registrationNumber} onChange={(e) => setCred("registrationNumber", e.target.value)} placeholder={t("dreg.regNumberPlaceholder")} className={inputCls} />
                    </div>
                  )}
                  {credentialFields.includes("registrationDate") && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.regDate")}</label>
                      <input type="date" value={creds.registrationDate} onChange={(e) => setCred("registrationDate", e.target.value)} className={inputCls} />
                    </div>
                  )}
                  {credentialFields.includes("qualification") && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.qualification")}</label>
                      <input value={creds.qualification} onChange={(e) => setCred("qualification", e.target.value)} placeholder="e.g. MBBS, MD (General Medicine)" className={inputCls} />
                    </div>
                  )}
                  {credentialFields.includes("specialization") && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.specialization")}</label>
                      <select value={creds.specialization} onChange={(e) => setCred("specialization", e.target.value)} className={inputCls}>
                        <option value="">{t("dreg.selectSpec")}</option>
                        {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  {credentialFields.includes("experience") && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("dreg.experience")}</label>
                      <input value={creds.experience} onChange={(e) => setCred("experience", e.target.value)} placeholder="e.g. 8" className={inputCls} />
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.state")}</label>
                    <select value={creds.state} onChange={(e) => setCred("state", e.target.value)} className={inputCls}>
                      <option value="">{t("dreg.selectState")}</option>
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>{t("dreg.credentials.subtitle")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 5: VERIFICATION (professional + identity) ===== */}
            {step === "verification" && (
              <div>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserCheck className="size-7" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">{t("dreg.verifyProf.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.verifyProf.subtitle")}</p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-border bg-card p-4 card-soft">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="size-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{t("dreg.verifyProf.title")}</p>
                        <p className="text-xs text-muted-foreground">{t("dreg.verifyProf.regNumber")}: {creds.registrationNumber || "—"}</p>
                      </div>
                      {profChecking ? (
                        <span className="text-xs text-muted-foreground">{t("dreg.verifyProf.checking")}</span>
                      ) : (
                        <CheckCircle2 className="size-6 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4 card-soft">
                    <div className="flex items-center gap-3">
                      <UserCheck className="size-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{t("dreg.verifyId.title")}</p>
                        <p className="text-xs text-muted-foreground">{basic.name || "—"} · +91 {mobile}</p>
                      </div>
                      {idChecking ? (
                        <span className="text-xs text-muted-foreground">{t("dreg.verifyProf.checking")}</span>
                      ) : (
                        <CheckCircle2 className="size-6 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 dark:bg-amber-500/10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-5 text-amber-700 dark:text-amber-300" />
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t("dreg.verifyProf.pending")}</p>
                    </div>
                    <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-300/80">{t("dreg.verifyId.mockDesc")}</p>
                  </div>
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </div>
            )}

            {/* ===== STEP 6: ACCOUNT ===== */}
            {step === "account" && (
              <div>
                <h1 className="text-2xl font-bold">{t("dreg.account.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.account.subtitle")}</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.account.password")}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                      <input type="password" value={account.password} onChange={(e) => setAcc("password", e.target.value)} placeholder="••••••••"
                        className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.account.confirm")}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                      <input type="password" value={account.confirm} onChange={(e) => setAcc("confirm", e.target.value)} placeholder="••••••••"
                        className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700">
                    <CheckCircle2 className="size-4" /> {t("dreg.account.mobileLinked")}: <b>+91 {mobile}</b>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 8: PRACTICE + WORKPLACE (combined) ===== */}
            {step === "practice" && (
              <div>
                <h1 className="text-2xl font-bold">{t("dreg.practice.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.practice.subtitle")}</p>
                <div className="mt-5 space-y-2.5">
                  {PRACTICE_TYPES.map((pt) => {
                    const active = practiceType === pt.value;
                    return (
                      <button key={pt.value} onClick={() => { setPracticeType(pt.value); setError(""); }}
                        className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors card-soft",
                          active ? "border-primary bg-primary/5" : "border-border bg-card")}>
                        <span className={cn("flex size-10 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          <Building2 className="size-5" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{t(`dreg.practiceType.${pt.value}`)}</p>
                          <p className="text-xs text-muted-foreground">{t(`dreg.practiceDesc.${pt.value}`)}</p>
                        </div>
                        {active && <CheckCircle2 className="size-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {!isIndependent && (
                  <>
                    <div className="mt-5 relative">
                      <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <input value={orgSearch} onChange={(e) => setOrgSearch(e.target.value)}
                        placeholder={t("dreg.workplace.search")}
                        className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-3 text-sm outline-none focus:border-ring" />
                    </div>

                    <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
                      <FilterChip active={workplaceFilter === "all"} label={t("dreg.workplace.all")} onClick={() => setWorkplaceFilter("all")} />
                      {orgs.map((v) => (
                        <FilterChip key={v} active={workplaceFilter === v && practiceType !== v} label={t(`dreg.practiceType.${v}`)} onClick={() => setWorkplaceFilter(v)} />
                      ))}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {filteredOrgs.map((o) => (
                        <button key={o.id} onClick={() => setWorkplace(o.name)}
                          className={cn("flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm", workplace === o.name ? "border-primary bg-primary/5" : "border-border bg-card")}>
                          <Building2 className="size-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{o.name}</p>
                            <p className="text-[11px] text-muted-foreground">{t("dreg.workplace.demoPrefix")} {o.city}</p>
                          </div>
                          {workplace === o.name && <CheckCircle2 className="size-5 text-primary" />}
                        </button>
                      ))}
                      {filteredOrgs.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                          {t("dreg.workplace.none")}
                        </div>
                      )}
                    </div>

                    {workplace && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
                        <Building2 className="size-4 text-primary" />
                        <span className="flex-1 font-medium">{workplace}</span>
                        <button onClick={() => setWorkplace("")} className="text-xs text-primary">{t("dreg.workplace.change")}</button>
                      </div>
                    )}

                    {practiceType === "clinic" && (
                      <button
                        onClick={() => setClinicRequest((v) => !v)}
                        className={cn("mt-3 flex w-full items-center gap-3 rounded-2xl border p-4 text-left", clinicRequest ? "border-primary bg-primary/5" : "border-dashed border-border bg-card")}>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><AlertTriangle className="size-5" /></span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{t("dreg.clinic.requestTitle")}</p>
                          <p className="text-xs text-muted-foreground">{t("dreg.clinic.requestDesc")}</p>
                        </div>
                        {clinicRequest && <CheckCircle2 className="size-5 text-primary" />}
                      </button>
                    )}
                  </>
                )}

                {isIndependent && (
                  <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-sm font-semibold">{t("dreg.independent.title")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("dreg.independent.subtitle")}</p>
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <span>{t("dreg.independent.profStatus")}: <b>{profStatus === "verified" ? t("dreg.verifyProf.verified") : t("dreg.verifyProf.pending")}</b></span>
                    </div>
                  </div>
                )}

                {!isIndependent && (
                  <div className="mt-5 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 dark:bg-amber-500/10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{t("dreg.affiliation.workplace")}</p>
                      <span className="flex items-center gap-1 text-sm font-medium text-amber-700"><ClockIcon className="size-4" /> {t("dreg.affiliation.pendingBadge")}</span>
                    </div>
                    {workplace && <p className="mt-2 text-sm">{workplace}</p>}
                    <p className="mt-1 text-xs text-amber-700/80">{t("dreg.affiliation.pending")}</p>
                  </div>
                )}
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </div>
            )}

            {/* ===== STEP 9: WELCOME ===== */}
            {step === "welcome" && (
              <div className="flex flex-col items-center pt-6 text-center">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-11" />
                </motion.div>
                <h1 className="mt-6 text-2xl font-bold">{t("dreg.welcome.title")}</h1>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("dreg.welcome.subtitle")}</p>

                <div className="mt-6 w-full rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("dreg.welcome.yourDoctorId")}</p>
                  <p className="mt-1 text-2xl font-bold tracking-wide text-primary">{issuedDoctorId || "—"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{t("dreg.welcome.doctorIdHint")}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(issuedDoctorId)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    <Copy className="size-3.5" /> {t("dreg.welcome.copyId")}
                  </button>
                </div>

                <div className="mt-6 w-full rounded-2xl border border-border bg-card p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound className="size-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{basic.name.trim() || "—"}</p>
                      <p className="text-xs text-muted-foreground">{PROFESSION_TYPES.find((p) => p.value === professionType)?.label} · {creds.specialization || "—"}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-muted-foreground">{t("dreg.welcome.profComplete")}</span>
                      <span className="flex items-center gap-1 font-medium text-emerald-600"><Check className="size-4" /> {t("dreg.verifyProf.verified")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs text-muted-foreground">{t("dreg.welcome.workplace")}</span>
                      <span className="font-medium">
                        {practiceType === "independent" ? t("dreg.welcome.independent") : (workplace || t("dreg.affiliation.pendingBadge"))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-border p-4 pb-safe">
        {step !== "welcome" ? (
          <Button onClick={goNextCore} size="lg" className="h-14 w-full text-base" disabled={saving}>
            {saving ? t("dreg.saving") : t("dreg.continue")} <ChevronRight className="ml-1.5" />
          </Button>
        ) : (
          <Button onClick={finish} size="lg" className="h-14 w-full text-base">
            {t("dreg.welcome.enterPortal")} <ChevronRight className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );

  function goNextCore() {
    setError("");
    switch (step) {
      case "profession":
        if (!professionType) { setError(t("dreg.practice.required")); return; }
        setStep("mobile");
        return;
      case "mobile":
        if (!mobileVerified) { setError(t("dreg.mobile.otpInvalid")); return; }
        setStep("basic");
        return;
      case "basic":
        if (!basic.name.trim()) { setError(t("dreg.nameRequired")); return; }
        setStep("credentials");
        return;
      case "credentials":
        if (!creds.registrationNumber.trim()) { setError(t("dreg.regNumberRequired")); return; }
        if (professionType === "medical-doctor" && !creds.specialization) { setError(t("dreg.selectSpec")); return; }
        setStep("verification");
        return;
      case "verification":
        void runAllVerification();
        return;
      case "account": {
        if (!account.password) { setError(t("dreg.account.passShort")); return; }
        if (account.password.length < 6) { setError(t("dreg.account.passShort")); return; }
        if (account.password !== account.confirm) { setError(t("dreg.account.passMismatch")); return; }
        setStep("practice");
        return;
      }
      case "practice": {
        if (!practiceType) { setError(t("dreg.practice.required")); return; }
        if (!isIndependent) {
          if (practiceType === "clinic" && !clinicRequest && !workplace) { setError(t("dreg.clinic.required")); return; }
          if (practiceType !== "clinic" && !workplace) { setError(t("dreg.workplace.required")); return; }
        }
        finalize();
        return;
      }
      default:
        return;
    }
  }
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium", active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>
      {label}
    </button>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
  );
}