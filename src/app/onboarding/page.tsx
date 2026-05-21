"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STEPS = [
  { id: "welcome", title: "Welcome, Hero! ⚔️", subtitle: "Let's set up your coding adventure" },
  { id: "language", title: "Choose Your Path", subtitle: "What do you want to learn first?" },
  { id: "goal", title: "Set Your Goal", subtitle: "How much time can you commit?" },
  { id: "ready", title: "You're Ready!", subtitle: "Your adventure begins now" },
];

const LANGUAGES = [
  { id: "PYTHON", name: "Python", icon: "🐍", desc: "Best for beginners" },
  { id: "JAVASCRIPT", name: "JavaScript", icon: "⚡", desc: "Build websites" },
  { id: "CPP", name: "C++", icon: "🚀", desc: "High performance" },
  { id: "JAVA", name: "Java", icon: "☕", desc: "Enterprise apps" },
];

const GOALS = [
  { id: "casual", label: "5 min/day", desc: "Casual learner" },
  { id: "regular", label: "15 min/day", desc: "Regular practice" },
  { id: "serious", label: "30 min/day", desc: "Serious grinder" },
  { id: "intense", label: "60+ min/day", desc: "Full commitment" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState("");
  const [goal, setGoal] = useState("");

  async function handleComplete() {
    toast.success("Adventure begins! 🎮");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-20" />
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

      <motion.div className="w-full max-w-lg relative z-10" layout>
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-white/10"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card-cyber"
          >
            <h2 className="text-2xl font-display font-bold mb-1">{STEPS[step].title}</h2>
            <p className="text-gray-400 mb-6">{STEPS[step].subtitle}</p>

            {step === 0 && (
              <div className="space-y-4">
                <p className="text-gray-300">You&apos;re about to enter a world where coding meets gaming. Solve quests, defeat bosses, and level up your skills with an AI mentor by your side.</p>
                <button onClick={() => setStep(1)} className="btn-cyber w-full">Let&apos;s Go! 🚀</button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => { setLanguage(lang.id); setStep(2); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${language === lang.id ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20"}`}
                  >
                    <span className="text-3xl">{lang.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold">{lang.name}</p>
                      <p className="text-sm text-gray-400">{lang.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setGoal(g.id); setStep(3); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${goal === g.id ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/20"}`}
                  >
                    <span className="font-semibold">{g.label}</span>
                    <span className="text-sm text-gray-400">{g.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl animate-float shadow-[0_0_40px_rgba(108,99,255,0.4)]">
                  ⚔️
                </div>
                <p className="text-gray-300">Your quest awaits. Complete daily challenges, earn XP, and climb the leaderboard!</p>
                <button onClick={handleComplete} className="btn-cyber w-full text-lg py-4">Start My Adventure</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
