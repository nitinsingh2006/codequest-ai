"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Lightbulb, Bug, ArrowLeft, Timer, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CodeEditor } from "@/components/code-editor";
import { usePyodide } from "@/hooks/use-pyodide";
import { Button } from "@/components/ui/button";
import { XPPopup } from "@/components/ui/gamification-effects";

const ParticleBackground = dynamic(
  () => import("@/components/3d/particle-background").then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);

export default function QuestPlayPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [showXP, setShowXP] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "passed" | "failed">("idle");

  const { data: quest } = useQuery({
    queryKey: ["quest", id],
    queryFn: () => fetch(`/api/quests/${id}`).then((r) => r.json()),
  });

  const { runPython, loading: pyLoading, ready: pyReady } = usePyodide();

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (quest?.starterCode && !code) setCode(quest.starterCode);
  }, [quest]);

  const submitMutation = useMutation({
    mutationFn: (data: { passed: boolean }) =>
      fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId: id, code, passed: data.passed, timeTaken: elapsed }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.firstCompletion && data.xpEarned > 0) {
        setXpEarned(data.xpEarned);
        setShowXP(true);
        setTimeout(() => setShowXP(false), 2000);
        toast.success(`🎉 Quest Complete! +${data.xpEarned} XP`);
        queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      }
    },
  });

  const aiMutation = useMutation({
    mutationFn: (type: string) =>
      fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, code, questId: id, error: output, language: "python" }),
      }).then((r) => r.json()),
    onSuccess: (data) => setAiResponse(data.response),
  });

  async function handleRun() {
    if (!pyReady) { toast.error("Python engine loading..."); return; }
    setStatus("running");
    setOutput("");

    const result = await runPython(code);
    setOutput(result);

    if (quest?.testCases) {
      const tests = quest.testCases as { expected: string }[];
      const passed = tests.some((t) => result.trim().includes(t.expected.trim()));
      setStatus(passed ? "passed" : "failed");
      if (passed) submitMutation.mutate({ passed: true });
    }
  }

  if (!quest) return <div className="animate-pulse h-screen bg-surface-light rounded-2xl" />;

  return (
    <>
      <ParticleBackground />
      <XPPopup amount={xpEarned} show={showXP} />

      <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 relative z-10">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <Link href="/quests">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-display font-bold">{quest.title}</h1>
              <p className="text-sm text-gray-400">{quest.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-400 font-mono glass px-3 py-1.5 rounded-lg">
              <Timer className="w-4 h-4" />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </div>
            <span className="text-xp text-sm font-display font-bold">⚡ {quest.xpReward} XP</span>
          </div>
        </motion.div>

        {/* Main Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Editor */}
          <motion.div
            className="flex flex-col gap-3 min-h-0"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CodeEditor value={code} onChange={setCode} language="python" />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleRun} disabled={pyLoading || status === "running"}>
                <Play className="w-4 h-4" /> {status === "running" ? "Running..." : "Run Code"}
              </Button>
              <Button variant="neon" onClick={() => aiMutation.mutate("hint")} disabled={aiMutation.isPending}>
                <Lightbulb className="w-4 h-4" /> {aiMutation.isPending ? "Thinking..." : "Hint"}
              </Button>
              <Button variant="ghost" onClick={() => aiMutation.mutate("bug_explanation")}>
                <Bug className="w-4 h-4" /> Explain Bug
              </Button>
            </div>
          </motion.div>

          {/* Output Panel */}
          <motion.div
            className="flex flex-col gap-3 min-h-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Output */}
            <div className="flex-1 glass rounded-2xl p-4 font-mono text-sm overflow-auto relative">
              {status === "passed" && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
              )}
              {status === "failed" && (
                <div className="absolute top-3 right-3">
                  <XCircle className="w-5 h-5 text-danger" />
                </div>
              )}
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Output</p>
              <pre className={`whitespace-pre-wrap ${status === "passed" ? "text-success" : status === "failed" ? "text-danger" : "text-gray-300"}`}>
                {output || "Run your code to see output..."}
              </pre>
            </div>

            {/* AI Response */}
            <AnimatePresence>
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-strong rounded-2xl p-4 border-accent/20"
                >
                  <p className="text-accent text-xs font-semibold mb-2 uppercase tracking-wider">🤖 AI Mentor</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{aiResponse}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!pyReady && (
              <div className="text-center text-xs text-gray-500 py-2 font-mono">
                ⏳ Loading Python engine...
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
