"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Send, Volume2, Pause, Play, SkipForward,
  ArrowLeft, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { AyushAiEngine } from "@/services/ayushEngine";
import { cn } from "@/utils";
import { uid } from "@/lib/brand/constants";
import type {
  AyushConversationTurn,
  AyushRedFlag,
  AssessmentField,
  EvidenceItem,
} from "@/types/ayush";

interface ChatMessage {
  id: string;
  role: "ai" | "patient";
  content: string;
  questionId?: string;
  options?: { label: string; value: string }[];
  showEvidence?: boolean;
  evidence?: EvidenceItem[];
}

export function AyushInterviewView() {
  const { t, language } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const session = useAppStore((s) => s.ayushSession);
  const updateAyushSession = useAppStore((s) => s.updateAyushSession);
  const addAyushDoctorQueueEntry = useAppStore((s) => s.addAyushDoctorQueueEntry);
  const patientProfile = useAppStore((s) => s.patientProfile);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    text: string;
    options?: { label: string; value: string }[];
    answerType: string;
  } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [redFlagAlert, setRedFlagAlert] = useState<AyushRedFlag | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [history, setHistory] = useState(session?.clinicalHistory ?? null);
  const [assessment, setAssessment] = useState(session?.ayurvedicAssessment ?? null);
  const [redFlags, setRedFlags] = useState<AyushRedFlag[]>([]);
  const [showEvidencePanel, setShowEvidencePanel] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const turnIdRef = useRef(0);

  // Initialize with first question
  useEffect(() => {
    if (!session || messages.length > 0) return;
    const q = AyushAiEngine.getInitialQuestion(language);
    const text = AyushAiEngine.getLocalizedText(q, language);
    const opts = q.answerType !== "open" ? AyushAiEngine.getLocalizedOptions(q, language) : undefined;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([{
      id: "ai-welcome",
      role: "ai",
      content: t("ayush.interviewWelcome"),
    }, {
      id: `ai-${q.id}`,
      role: "ai",
      content: text,
      questionId: q.id,
      options: opts,
    }]);
    setCurrentQuestion({ id: q.id, text, options: opts, answerType: q.answerType });
  }, [session, language, messages.length, t]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, currentQuestion]);

  // Simulate voice listening
  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      setIsProcessing(true);
      // Simulate voice processing delay
      setTimeout(() => {
        const demoTranscripts: Record<string, string> = {
          "cc-main": "Pet mein jalan aur discomfort hai, khane ke baad badh jaata hai",
          "cc-duration": "3 months se hai",
          "cc-severity": "6 out of 10",
          "cc-pattern": "Dheere dheere badh raha hai",
          "cc-worse": "Spicy food aur stress se badh jaata hai",
          "cc-better": "Thanda paani aur rest se thoda better hota hai",
          "cc-associated": "Bloating bhi hota hai, kabhi kabhi nausea",
          "sys-past-med": "Koi badi bimari nahi hai",
          "sys-meds": "Koi regular dawai nahi le raha hoon",
          "sys-allergy": "Koi known allergy nahi hai",
          "sys-family": "Papa ko sugar hai",
          "sys-diet": "Ghar ka khana khata hoon, mostly vegetarian, irregular meals",
          "sys-sleep": "Raat ko 6-7 ghante sota hoon, neend theek aati hai",
          "sys-bowel": "Kabhi kabhi constipation hota hai",
          "ay-agni": "Bhookh lagti hai lekin kabhi kabhi deri se lagti hai, khane ke baad heaviness",
          "ay-koshtha": "Madhyama - mostly regular, kabhi kabhi constipation",
          "ay-prakriti": "Not sure, maybe Pitta type",
          "ay-nidana": "Stress aur irregular meals lagta hai trigger hai",
          "ay-ahara-vihara": "Subah 7 baje uthta hoon, exercise nahi karta, khana irregular rehta hai",
          "ay-sattva": "Kabhi anxious hota hoon, mostly rajasic",
          "ay-vyayama": "Low - zyada exercise nahi karta",
        };
        const response = demoTranscripts[currentQuestion?.id || ""] || "Theek hai, main samajh gaya";
        processAnswer(response);
        setIsProcessing(false);
      }, 2000);
    } else {
      setIsListening(true);
    }
  };

  const completeInterview = useCallback((
    finalHistory: typeof history,
    finalAssessment: typeof assessment,
    finalRedFlags: AyushRedFlag[]
  ) => {
    if (!finalHistory || !finalAssessment || !session) return;

    const completion = AyushAiEngine.calculateCompletion(finalHistory, finalAssessment);
    updateAyushSession({ historyCompletion: completion });

    // Generate physician summary
    const summary = AyushAiEngine.generatePhysicianSummary(
      patientProfile?.id || "unknown",
      patientProfile?.name || "Unknown",
      patientProfile?.age || 0,
      patientProfile?.gender || "unknown",
      language,
      finalHistory,
      finalAssessment,
      finalRedFlags,
      session.conversationTurns
    );

    updateAyushSession({ summary, phase: "complete", completedAt: new Date().toISOString() });

    // Add to doctor queue
    addAyushDoctorQueueEntry({
      id: uid("dq"),
      sessionId: session.id,
      patientId: patientProfile?.id || "unknown",
      patientName: patientProfile?.name || "Unknown",
      age: patientProfile?.age || 0,
      gender: patientProfile?.gender || "unknown",
      chiefComplaint: finalHistory.chiefComplaint.value,
      status: finalRedFlags.length > 0 ? "NEEDS_REVIEW" : "WAITING",
      redFlagLevel: finalRedFlags.some((r) => r.level === "URGENT") ? "URGENT" : finalRedFlags.length > 0 ? "NEEDS_REVIEW" : "NORMAL",
      redFlagCount: finalRedFlags.length,
      historyCompletion: completion,
      aiSummaryAvailable: true,
      ayushAssessmentReady: true,
      language,
      createdAt: new Date().toISOString(),
      summary,
    });

    setView("PATIENT_AYUSH_SUMMARY");
  }, [session, patientProfile, updateAyushSession, addAyushDoctorQueueEntry, language, setView]);

  const processAnswer = useCallback((response: string) => {
    if (!currentQuestion || !session) return;

    const q = AyushAiEngine.getQuestion(currentQuestion.id);
    if (!q || !history || !assessment) return;

    // AI processes the response - real state transition
    const result = AyushAiEngine.processResponse(q, response, history, assessment);

    // Update local state
    setHistory(result.updatedHistory);
    setAssessment(result.updatedAssessment);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: response }));
    setAskedIds((prev) => [...prev, currentQuestion.id]);

    // Add patient message
    const patientMsg: ChatMessage = {
      id: `p-${turnIdRef.current++}`,
      role: "patient",
      content: response,
    };
    setMessages((prev) => [...prev, patientMsg]);

    // Create conversation turn
    const turn: AyushConversationTurn = {
      id: uid("turn"),
      role: "patient",
      content: response,
      inputMode: session.inputMode,
      questionId: currentQuestion.id,
      category: q.category,
      timestamp: new Date().toISOString(),
      evidenceCreated: true,
      redFlagTriggered: !!result.redFlag,
    };

    // Handle red flags
    if (result.redFlag) {
      setRedFlagAlert(result.redFlag);
      setRedFlags((prev) => [...prev, result.redFlag!]);
      return; // Stop - red flag requires attention
    }

    // Find next question
    const newAskedIds = [...askedIds, currentQuestion.id];
    const newAnswers = { ...answers, [currentQuestion.id]: response };
    const nextQ = AyushAiEngine.getNextQuestion(newAskedIds, newAnswers, language);

    // Update session in store
    const completion = AyushAiEngine.calculateCompletion(result.updatedHistory, result.updatedAssessment);
    updateAyushSession({
      conversationTurns: [...(session.conversationTurns || []), turn],
      clinicalHistory: result.updatedHistory,
      ayurvedicAssessment: result.updatedAssessment,
      redFlags: [...redFlags, ...(result.redFlag ? [result.redFlag] : [])],
      historyCompletion: completion,
      askedQuestionIds: newAskedIds,
    });

    if (nextQ) {
      // AI asks next question
      const nextText = AyushAiEngine.getLocalizedText(nextQ, language);
      const nextOpts = nextQ.answerType !== "open" ? AyushAiEngine.getLocalizedOptions(nextQ, language) : undefined;

      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `ai-${nextQ.id}`,
          role: "ai",
          content: nextText,
          questionId: nextQ.id,
          options: nextOpts,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setCurrentQuestion({ id: nextQ.id, text: nextText, options: nextOpts, answerType: nextQ.answerType });
      }, 800);
    } else {
      // Interview complete - generate summary
      setTimeout(() => {
        completeInterview(result.updatedHistory, result.updatedAssessment, [...redFlags]);
      }, 1000);
    }
  }, [currentQuestion, session, history, assessment, askedIds, answers, redFlags, language, updateAyushSession, completeInterview]);

  const handleTextSubmit = () => {
    if (!textInput.trim() || isProcessing) return;
    processAnswer(textInput.trim());
    setTextInput("");
    inputRef.current?.focus();
  };

  const handleOptionSelect = (value: string, label: string) => {
    processAnswer(label);
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    processAnswer("Skipped");
  };

  const handleRedFlagContinue = () => {
    setRedFlagAlert(null);
    // Continue interview after red flag acknowledgment
    const q = AyushAiEngine.getQuestion(currentQuestion?.id || "");
    if (!q || !history || !assessment) return;
    const newAskedIds = [...askedIds, currentQuestion!.id];
    const nextQ = AyushAiEngine.getNextQuestion(newAskedIds, answers, language);
    if (nextQ) {
      const nextText = AyushAiEngine.getLocalizedText(nextQ, language);
      const nextOpts = nextQ.answerType !== "open" ? AyushAiEngine.getLocalizedOptions(nextQ, language) : undefined;
      setMessages((prev) => [...prev, {
        id: `ai-${nextQ.id}`,
        role: "ai",
        content: nextText,
        questionId: nextQ.id,
        options: nextOpts,
      }]);
      setCurrentQuestion({ id: nextQ.id, text: nextText, options: nextOpts, answerType: nextQ.answerType });
    }
  };

  const handleNotifyCareTeam = () => {
    setRedFlagAlert(null);
    // In production this would notify the care team
    const q = AyushAiEngine.getQuestion(currentQuestion?.id || "");
    if (!q || !history || !assessment) return;
    const newAskedIds = [...askedIds, currentQuestion!.id];
    const nextQ = AyushAiEngine.getNextQuestion(newAskedIds, answers, language);
    if (nextQ) {
      const nextText = AyushAiEngine.getLocalizedText(nextQ, language);
      const nextOpts = nextQ.answerType !== "open" ? AyushAiEngine.getLocalizedOptions(nextQ, language) : undefined;
      setMessages((prev) => [...prev, {
        id: `ai-${nextQ.id}`,
        role: "ai",
        content: nextText,
        questionId: nextQ.id,
        options: nextOpts,
      }]);
      setCurrentQuestion({ id: nextQ.id, text: nextText, options: nextOpts, answerType: nextQ.answerType });
    }
  };

  if (!session) {
    setView("PATIENT_AYUSH");
    return null;
  }

  const completion = session.historyCompletion || 0;

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Red Flag Modal */}
      <AnimatePresence>
        {redFlagAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm space-y-4 rounded-2xl border border-red-500/30 bg-background p-6 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="size-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-red-600">{t("ayush.redFlagTitle")}</h3>
                  <p className="text-xs text-muted-foreground">{t("ayush.redFlagLevel")}: {redFlagAlert.level}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{redFlagAlert.reason}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleNotifyCareTeam}>
                  {t("ayush.notifyCareTeam")}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleRedFlagContinue}>
                  {t("ayush.continueIfAllowed")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Button variant="ghost" size="icon" onClick={() => setView("PATIENT_AYUSH")} className="-ml-1">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("ayush.brand")}</p>
            <p className="text-[10px] text-muted-foreground">{t("ayush.interviewSubtitle")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowHistoryPanel(!showHistoryPanel)}>
            {showHistoryPanel ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground">{t("ayush.historyCompletion")}</span>
          <span className="text-[10px] font-semibold">{completion}%</span>
        </div>
      </header>

      {/* Structured History Panel (collapsible) */}
      <AnimatePresence>
        {showHistoryPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-muted/30"
          >
            <div className="max-h-64 overflow-y-auto p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("ayush.liveHistory")}</p>
              <div className="space-y-1.5">
                {history && Object.entries(history).map(([key, field]) => {
                  if (typeof field !== "object" || !field || !("value" in field)) return null;
                  const f = field as AssessmentField;
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-background px-2.5 py-1.5 text-xs">
                      <span className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className={cn("max-w-[50%] truncate font-medium", f.value ? "text-foreground" : "text-muted-foreground")}>
                        {f.value || "—"}
                      </span>
                    </div>
                  );
                })}
                {/* Ayurvedic fields */}
                {assessment && [
                  { key: "Agni", field: assessment.agni },
                  { key: "Koshtha", field: assessment.koshtha },
                  { key: "Prakriti", field: assessment.dashavidha.prakriti },
                ].map(({ key, field }) => (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-background px-2.5 py-1.5 text-xs">
                    <span className="text-muted-foreground">{key}</span>
                    <span className={cn("max-w-[50%] truncate font-medium", field.value ? "text-foreground" : "text-muted-foreground")}>
                      {field.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-lg space-y-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "patient" ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                msg.role === "patient"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card"
              )}>
                <p className="text-sm leading-relaxed">{msg.content}</p>

                {/* Touch Options */}
                {msg.options && msg.questionId && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {msg.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleOptionSelect(opt.value, opt.label)}
                        className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Source Evidence Button */}
                {msg.showEvidence && msg.evidence && (
                  <button
                    onClick={() => setShowEvidencePanel(
                      showEvidencePanel === msg.id ? null : msg.id
                    )}
                    className="mt-2 flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    <CheckCircle2 className="size-3" />
                    {t("ayush.viewEvidence")}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                <motion.span
                  className="size-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs text-muted-foreground">{t("ayush.processing")}</span>
              </div>
            </div>
          )}

          {/* Listening indicator */}
          {isListening && (
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2"
              >
                <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-600">{t("ayush.listening")}</span>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      {!isPaused && !redFlagAlert && (
        <div className="border-t border-border bg-background/85 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto max-w-lg space-y-2">
            {/* Text Input */}
            {session.inputMode === "text" && (
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                  placeholder={t("ayush.typePlaceholder")}
                  className="flex-1 resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={1}
                />
                <Button size="icon" onClick={handleTextSubmit} disabled={!textInput.trim()}>
                  <Send className="size-4" />
                </Button>
              </div>
            )}

            {/* Voice + Touch Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {session.inputMode === "voice" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVoice}
                    className={cn(isListening && "text-red-500")}
                  >
                    {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                  </Button>
                )}
                {currentQuestion?.answerType !== "open" && (
                  <Button variant="ghost" size="icon" onClick={handleSkip}>
                    <SkipForward className="size-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="icon">
                  <Volume2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView("PATIENT_AYUSH")}
                  className="text-destructive"
                >
                  <XCircle className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <div className="flex flex-1 items-center justify-center bg-background/80">
          <div className="text-center space-y-3">
            <Pause className="mx-auto size-12 text-muted-foreground" />
            <p className="text-sm font-semibold">{t("ayush.interviewPaused")}</p>
            <p className="text-xs text-muted-foreground">{t("ayush.resumeHint")}</p>
            <Button onClick={() => setIsPaused(false)}>
              <Play className="mr-2 size-4" />
              {t("ayush.resume")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
