"use client";

import { useState, useCallback, useRef } from "react";

export function useJSRunner() {
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const runJS = useCallback(async (code: string, input = ""): Promise<string> => {
    setLoading(true);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
        setLoading(false);
        resolve("Error: Execution timed out (10s limit)");
      }, 10000);

      const blob = new Blob([`
        const __inputs = ${JSON.stringify(input.split("\n"))};
        let __inputIdx = 0;
        const prompt = () => __inputs[__inputIdx++] || "";
        const readline = prompt;
        let __output = [];
        const originalConsole = { log: console.log, error: console.error };
        console.log = (...args) => __output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
        console.error = (...args) => __output.push("Error: " + args.join(" "));
        try {
          ${code}
        } catch(e) {
          __output.push("Error: " + e.message);
        }
        postMessage(__output.join("\\n"));
      `], { type: "application/javascript" });

      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      workerRef.current = worker;

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        worker.terminate();
        setLoading(false);
        resolve(e.data || "(No output)");
      };

      worker.onerror = (e) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        worker.terminate();
        setLoading(false);
        resolve(`Error: ${e.message}`);
      };
    });
  }, []);

  return { runJS, loading, ready: true };
}
