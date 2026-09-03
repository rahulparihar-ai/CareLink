"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Mic, Hand, MessageSquareText, ArrowLeft, Volume2,
  CheckCircle2, ShieldAlert, Send, RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { KioskProgress } from "./KioskProgress";
import { HISTORY_SERVICE, type HistoryQuestion } from "@/services";
import { cn } from "@/utils";
import { useTranslation } from "@/i18n/useTranslation";
import type { ConversationTurn, HistoryQuestionCategory } from "@/types";

interface AnswerMap {
  [category: string]: string;
}

export function KioskHistory() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const kiosk = useAppStore((s) => s.kioskSession);
  const setKioskPhase = useAppStore((s) => s.setKioskPhase);
  const setKioskInputMode = useAppStore((s) => s.setKioskInputMode);
  const setKioskHistoryMode = useAppStore((s) => s.setKioskHistoryMode);
  const addConversationTurn = useAppStore((s) => s.addConversationTurn);
  const addRedFlagAlert = useAppStore((s) => s.addRedFlagAlert);
  const setClinicalHistory = useAppStore((s) => s.setClinicalHistory);

  const historyMode = kiosk?.historyMode ?? "allopathic";
  const inputMode = kiosk?.inputMode ?? "voice";

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<HistoryQuestion | null>(null);
  const [currentInterview, setCurrentInterview] = useState<HistoryQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [stage, setStage] = useState<"complaint" | "interview" | "systematic" | "summary">("complaint");
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [directAnswer, setDirectAnswer] = useState("");
  const [showTouchInput, setShowTouchInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);
  const nextId = () => `m-${msgIdRef.current++}`;

  const systematicQuestions = [
    ...HISTORY_SERVICE.getSystematicHistory().map((q) => ({
      id: `sys-${q.category}`,
      category: q.category,
      prompt: q.prompt,
      suggestions: q.suggestions,
    })),
    ...(historyMode === "ayush" ? HISTORY_SERVICE.getAyushQuestions() : []),
  ];
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, currentQuestion]);

  const systemSay = (content: string, category?: HistoryQuestionCategory) => {
    const id = nextId();
    addConversationTurn({
      id,
      role: "system",
      content,
      inputMode,
      timestamp: new Date().toISOString(),
      questionCategory: category,
    });
    setMessages((m) => [...m, {
      id: `${id}x`,
      role: "system",
      content,
      inputMode,
      timestamp: new Date().toISOString(),
      questionCategory: category,
    }]);
  };

  const patientSay = (content: string, category?: HistoryQuestionCategory, mode: "voice" | "touch" | "text" = "touch") => {
    const id = nextId();
    addConversationTurn({
      id,
      role: "patient",
      content,
      inputMode: mode,
      timestamp: new Date().toISOString(),
      questionCategory: category,
    });
    setMessages((m) => [...m, {
      id: `${id}x`,
      role: "patient",
      content,
      inputMode: mode,
      timestamp: new Date().toISOString(),
      questionCategory: category,
    }]);
  };

  const startInterview = (cc: string) => {
    const clean = cc.trim();
    if (!clean) return;
    setChiefComplaint(clean);
    const questions = HISTORY_SERVICE.getInitialQuestions(clean);
    setCurrentInterview(questions);
    setQIndex(0);
    setStage("interview");
    setTimeout(() => {
      setCurrentQuestion(questions[0]);
      systemSay(questions[0].prompt, questions[0].category);
    }, 600);
  };

  const allQuestions = [
    ...currentInterview,
    ...systematicQuestions,
  ];

  const answerQuestion = (answer: string, cat?: HistoryQuestionCategory) => {
    const category = cat ?? allQuestions[qIndex]?.category;
    if (!category) return;
    setAnswers((a) => ({ ...a, [category]: answer }));
    patientSay(answer, category);

    // Red flag detection on HPI
    if (category === "hpi" || category === "chief_complaint") {
      const rf = HISTORY_SERVICE.detectRedFlag(category, answer, chiefComplaint);
      if (rf && !redFlags.includes(rf.rule)) {
        setRedFlags((r) => [...r, rf.rule]);
        addRedFlagAlert(rf);
      }
    }

    setCurrentQuestion(null);
    setTyping(true);
    const nextIdx = qIndex + 1;
    setTimeout(() => {
      setTyping(false);
      if (nextIdx < allQuestions.length) {
        const q = allQuestions[nextIdx];
        setQIndex(nextIdx);
        setStage(nextIdx < currentInterview.length ? "interview" : "systematic");
        setCurrentQuestion(q);
        systemSay(q.prompt, q.category);
      } else {
        // Interview complete
        setStage("summary");
        systemSay("Thank you. I now have your complete history. Let me organize this for your doctor.");
        setTimeout(() => {
          const history = HISTORY_SERVICE.buildClinicalHistory(
            messages,
            { chiefComplaint, ...answers },
            historyMode
          );
          setClinicalHistory(history);
          setKioskPhase("documents");
          setTimeout(() => setView("KIOSK_DOCUMENTS"), 400);
        }, 1200);
      }
    }, 500);
  };

  const startVoiceInput = async () => {
    setListening(true);
    await HISTORY_SERVICE.transcribeVoice();
    setListening(false);
    if (stage === "complaint") {
      const text = "I have had chest pain for three days. It feels heavy and pressing, often spreading to my left arm.";
      patientSay(text, "chief_complaint", "voice");
      startInterview(text);
      return;
    }
    const q = allQuestions[qIndex];
    if (q) {
      const sample = q.suggestions[0];
      answerQuestion(sample, q.category);
      return;
    }
  };

  const handleAyushMode = () => {
    if (stage !== "complaint" && stage !== "summary") {
      systemSay("Mode can only be changed before starting the interview. Please restart if needed.");
      return;
    }
    if (historyMode === "allopathic") {
      setKioskHistoryMode("ayush");
      systemSay("Switched to Ayurvedic (AYUSH) history mode. Dashavidha Pariksha questions will be included.");
    } else {
      setKioskHistoryMode("allopathic");
      systemSay("Switched to standard clinical history mode.");
    }
  };

  const currentCategory = allQuestions[qIndex]?.category;
  const currentSuggestions = currentQuestion?.suggestions ?? allQuestions[qIndex]?.suggestions ?? [];

  return (
    <div className="app-shell min-h-dvh bg-card">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => { setKioskPhase("consent"); setView("KIOSK_CONSENT"); }} aria-label="Back" className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("kiosk.historyHeader")}</p>
            <p className="text-xs text-muted-foreground">
              {historyMode === "ayush" ? t("kiosk.ayushMode") : t("kiosk.historyStep")}
            </p>
          </div>
          <button onClick={handleAyushMode}
            className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", historyMode === "ayush" ? "bg-amber-500/15 text-amber-700" : "bg-muted text-muted-foreground")}>
            {historyMode === "ayush" ? t("kiosk.ayushOn") : t("kiosk.ayushOff")}
          </button>
        </div>
        <KioskProgress phase="history" />
      </header>

      {/* Red flag banner */}
      {redFlags.length > 0 && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div className="text-xs">
            <p className="font-bold text-red-700">{t("kiosk.flagTriage")}</p>
            <p className="text-red-600/80">
              {redFlags.join(", ")}
              {t("kiosk.flagBody")}
            </p>
          </div>
        </div>
      )}

      {/* Input mode toggle */}
      <div className="mx-4 mt-3 flex items-center gap-1.5 rounded-full bg-muted/70 p-1">
        {([
          { key: "voice", icon: Mic, label: t("kiosk.modeVoice") },
          { key: "touch", icon: Hand, label: t("kiosk.modeTouch") },
          { key: "text", icon: MessageSquareText, label: t("kiosk.modeText") },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => { setKioskInputMode(key); setShowTouchInput(false); }}
            className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition-colors",
              inputMode === key ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="mt-3 h-[calc(100dvh-300px)] overflow-y-auto px-4">
        <div className="space-y-2.5">
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm card-soft",
                m.role === "system" ? "bg-muted text-foreground" : "ml-auto bg-primary text-primary-foreground")}>
              <div className="flex items-start gap-2">
                <span>
                  {m.role === "system" && <Volume2 className="mr-1 inline size-3.5 opacity-60" />}
                  {m.content}
                </span>
              </div>
              {m.role === "patient" && m.inputMode !== "touch" && (
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                  {m.inputMode === "voice" ? <Mic className="size-3" /> : <MessageSquareText className="size-3" />}
                  {m.inputMode === "voice" ? "Voice" : "Text"}
                </div>
              )}
            </motion.div>
          ))}

          {typing && (
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3.5 py-2.5 w-fit">
              {[0, 1, 2].map((b) => <span key={b} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${b * 0.15}s` }} />)}
            </div>
          )}
        </div>
      </div>

      {/* Response area */}
      <div className="sticky bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        {stage === "complaint" ? (
          <div>
            <label className="block text-xs font-medium text-muted-foreground">What is the main reason for your visit?</label>
            <div className="mt-2 flex gap-2">
              <input
                value={directAnswer}
                onChange={(e) => setDirectAnswer(e.target.value)}
                placeholder="e.g. chest pain, fever, stomach pain..."
                className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => { if (e.key === "Enter") startInterview(directAnswer); }}
              />
              <Button className="h-11" onClick={() => startInterview(directAnswer)}><Send className="size-4" /></Button>
              {inputMode === "voice" || inputMode === "text" ? (
                <Button className="h-11" onClick={startVoiceInput} disabled={listening}>
                  {listening ? <RefreshCw className="size-4 animate-spin" /> : <Mic className="size-4" />}
                </Button>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Chest pain", "Fever & cough", "Stomach pain", "Headache", "Breathlessness", "Body ache"].map((s) => (
                <button key={s} onClick={() => startInterview(s)} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {currentQuestion ? (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Volume2 className="size-3.5" /> {currentQuestion.feature}
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px]">
                    {currentQuestion.category}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentSuggestions.map((s) => (
                    <motion.button key={s} whileTap={{ scale: 0.97 }}
                      onClick={() => answerQuestion(s, currentCategory)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary hover:bg-primary/10">
                      {s}
                    </motion.button>
                  ))}
                </div>
                <div className="mt-2.5 flex gap-2">
                  {inputMode === "voice" && (
                    <Button variant="outline" className="h-10 flex-1" onClick={startVoiceInput} disabled={listening}>
                      {listening ? <><RefreshCw className="size-4 animate-spin" /> Listening...</> : <><Mic className="size-4" /> Speak your answer</>}
                    </Button>
                  )}
                  {inputMode === "text" && (
                    <div className="flex w-full gap-2">
                      <input
                        value={directAnswer}
                        onChange={(e) => setDirectAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        onKeyDown={(e) => { if (e.key === "Enter") { answerQuestion(directAnswer, currentCategory); setDirectAnswer(""); } }}
                      />
                      <Button className="h-11" onClick={() => { answerQuestion(directAnswer, currentCategory); setDirectAnswer(""); }}>
                        <Send className="size-4" />
                      </Button>
                    </div>
                  )}
                  {inputMode === "touch" && (
                    <Button className="h-10 flex-1" onClick={() => setShowTouchInput((v) => !v)}>
                      <Hand className="size-4" /> Type an answer
                    </Button>
                  )}
                  {inputMode === "voice" && (
                    <Button className="h-10 flex-1" onClick={() => setShowTouchInput((v) => !v)}>
                      <Hand className="size-4" /> Type
                    </Button>
                  )}
                </div>
                {showTouchInput && inputMode !== "text" && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={directAnswer}
                      onChange={(e) => setDirectAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={(e) => { if (e.key === "Enter") { answerQuestion(directAnswer, currentCategory); setDirectAnswer(""); setShowTouchInput(false); } }}
                    />
                    <Button className="h-11" onClick={() => { answerQuestion(directAnswer, currentCategory); setDirectAnswer(""); setShowTouchInput(false); }}>
                      <Send className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary">
                <CheckCircle2 className="size-4" /> Organizing your history...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

