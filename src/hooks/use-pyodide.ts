"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide?: () => Promise<PyodideInterface>;
  }
}

export function usePyodide() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const pyodideRef = useRef<PyodideInterface | null>(null);

  useEffect(() => {
    // Load Pyodide script
    if (typeof window === "undefined") return;
    if (document.getElementById("pyodide-script")) return;

    const script = document.createElement("script");
    script.id = "pyodide-script";
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.3/full/pyodide.js";
    script.onload = async () => {
      try {
        const pyodide = await window.loadPyodide!();
        pyodideRef.current = pyodide;
        setReady(true);
      } catch (e) {
        console.error("Pyodide load failed:", e);
      }
    };
    document.head.appendChild(script);
  }, []);

  const runPython = useCallback(async (code: string): Promise<string> => {
    if (!pyodideRef.current) return "Python engine not ready yet...";

    setLoading(true);
    let output = "";

    try {
      pyodideRef.current.setStdout({ batched: (msg) => { output += msg + "\n"; } });
      pyodideRef.current.setStderr({ batched: (msg) => { output += `Error: ${msg}\n`; } });

      await pyodideRef.current.runPythonAsync(code);
      return output.trimEnd() || "(No output)";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Extract just the relevant error line
      const lines = message.split("\n");
      const errorLine = lines.find((l) => l.includes("Error:")) || lines[lines.length - 1];
      return output + (errorLine || message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { runPython, loading, ready };
}
