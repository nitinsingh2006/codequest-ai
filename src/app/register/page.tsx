"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const signInRes = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      toast.error("Account created but login failed. Please login manually.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-cyber w-full max-w-md">
        <h1 className="text-3xl font-display font-bold text-center mb-2">⚔️ Join CodeQuest</h1>
        <p className="text-center text-gray-400 mb-8">Begin your coding adventure</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            type="text"
            placeholder="Hero Name"
            required
            className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6 chars)"
            required
            minLength={6}
            className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          />
          <button type="submit" disabled={loading} className="btn-cyber w-full">
            {loading ? "Creating..." : "Start Adventure"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already a hero?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
