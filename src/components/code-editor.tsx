"use client";

import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Language } from "@prisma/client";
import { getMonacoLanguage } from "@/lib/languages";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language | string;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({ value, onChange, language, readOnly = false, height = "100%" }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const monacoLang = typeof language === "string" && language.length <= 10
    ? language
    : getMonacoLanguage(language as Language);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-[#0d1117]">
      <Editor
        height={height}
        language={monacoLang}
        value={value}
        onChange={(v) => onChange(v || "")}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: "on",
          renderLineHighlight: "gutter",
          bracketPairColorization: { enabled: true },
          autoClosingBrackets: "always",
          tabSize: 2,
          wordWrap: "on",
          readOnly,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
        }}
      />
    </div>
  );
}
