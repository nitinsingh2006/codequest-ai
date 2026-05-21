import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-20" />
      <div className="absolute inset-0 bg-gradient-radial from-primary/8 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent/5 to-transparent rounded-full blur-3xl" />

      <div className="max-w-4xl space-y-8 relative z-10">
        {/* Logo */}
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl shadow-[0_0_80px_rgba(108,99,255,0.4)] animate-float">
          ⚔️
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-black gradient-text leading-tight tracking-tight">
          CodeQuest AI
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          The AI-powered coding universe. Solve quests, battle bosses, compete in arenas — master{" "}
          <span className="text-accent font-semibold">7 languages</span> with your personal AI mentor.
        </p>

        <div className="flex gap-4 justify-center pt-4 flex-wrap">
          <Link href="/register" className="btn-cyber text-lg px-10 py-4 shadow-[0_0_40px_rgba(108,99,255,0.3)]">
            🚀 Start Adventure
          </Link>
          <Link href="/login" className="btn-neon text-lg px-10 py-4">
            Login
          </Link>
        </div>

        {/* Language badges */}
        <div className="flex flex-wrap justify-center gap-3 pt-6">
          {[
            { icon: "🐍", name: "Python", color: "from-blue-500/20 to-blue-600/10" },
            { icon: "⚡", name: "JavaScript", color: "from-yellow-500/20 to-yellow-600/10" },
            { icon: "🚀", name: "C++", color: "from-blue-400/20 to-blue-500/10" },
            { icon: "☕", name: "Java", color: "from-orange-500/20 to-orange-600/10" },
            { icon: "⚛️", name: "React", color: "from-cyan-500/20 to-cyan-600/10" },
            { icon: "⚙️", name: "C", color: "from-gray-400/20 to-gray-500/10" },
            { icon: "🎨", name: "HTML/CSS", color: "from-red-500/20 to-red-600/10" },
          ].map((lang) => (
            <span key={lang.name} className={`px-4 py-2 rounded-full bg-gradient-to-r ${lang.color} border border-white/10 text-sm font-medium`}>
              {lang.icon} {lang.name}
            </span>
          ))}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
          {[
            { icon: "🤖", label: "AI Mentor", desc: "Adaptive hints & code review" },
            { icon: "⚔️", label: "PvP Duels", desc: "Real-time coding battles" },
            { icon: "🏰", label: "Boss Fights", desc: "Epic timed challenges" },
            { icon: "🏆", label: "ELO Ranking", desc: "Climb from Bronze to GM" },
          ].map((f) => (
            <div key={f.label} className="card-cyber text-center py-6 px-3">
              <p className="text-3xl mb-3">{f.icon}</p>
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 pt-8 text-center">
          <div>
            <p className="text-3xl font-display font-bold text-primary">7</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Languages</p>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-accent">∞</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">AI Quests</p>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-xp">100%</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Free</p>
          </div>
        </div>
      </div>
    </div>
  );
}
