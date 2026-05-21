import { Language } from "@prisma/client";

// ─── LANGUAGE METADATA ───────────────────────────────────────────────────────

export interface LanguageConfig {
  id: Language;
  name: string;
  icon: string;
  color: string;
  monacoId: string; // Monaco editor language ID
  extension: string;
  execution: "browser" | "judge0" | "both";
  starterTemplate: string;
  helloWorld: string;
  categories: string[];
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  PYTHON: {
    id: "PYTHON",
    name: "Python",
    icon: "🐍",
    color: "#3776AB",
    monacoId: "python",
    extension: ".py",
    execution: "both",
    starterTemplate: `# Write your solution here\n\ndef solve():\n    pass\n\nsolve()`,
    helloWorld: `print("Hello, World!")`,
    categories: ["Backend", "DSA", "AI/ML"],
  },
  JAVASCRIPT: {
    id: "JAVASCRIPT",
    name: "JavaScript",
    icon: "⚡",
    color: "#F7DF1E",
    monacoId: "javascript",
    extension: ".js",
    execution: "browser",
    starterTemplate: `// Write your solution here\n\nfunction solve() {\n  \n}\n\nsolve();`,
    helloWorld: `console.log("Hello, World!");`,
    categories: ["Frontend", "Backend", "DSA"],
  },
  HTML_CSS: {
    id: "HTML_CSS",
    name: "HTML/CSS",
    icon: "🎨",
    color: "#E34F26",
    monacoId: "html",
    extension: ".html",
    execution: "browser",
    starterTemplate: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* Your styles here */\n  </style>\n</head>\n<body>\n  <!-- Your HTML here -->\n</body>\n</html>`,
    helloWorld: `<h1>Hello, World!</h1>`,
    categories: ["Frontend"],
  },
  C: {
    id: "C",
    name: "C",
    icon: "⚙️",
    color: "#A8B9CC",
    monacoId: "c",
    extension: ".c",
    execution: "judge0",
    starterTemplate: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}`,
    helloWorld: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
    categories: ["Systems", "DSA"],
  },
  CPP: {
    id: "CPP",
    name: "C++",
    icon: "🚀",
    color: "#00599C",
    monacoId: "cpp",
    extension: ".cpp",
    execution: "judge0",
    starterTemplate: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}`,
    helloWorld: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    categories: ["Systems", "DSA", "Competitive"],
  },
  JAVA: {
    id: "JAVA",
    name: "Java",
    icon: "☕",
    color: "#ED8B00",
    monacoId: "java",
    extension: ".java",
    execution: "judge0",
    starterTemplate: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n        \n    }\n}`,
    helloWorld: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    categories: ["Backend", "DSA", "Enterprise"],
  },
  REACT: {
    id: "REACT",
    name: "React",
    icon: "⚛️",
    color: "#61DAFB",
    monacoId: "typescript",
    extension: ".tsx",
    execution: "browser",
    starterTemplate: `export default function App() {\n  return (\n    <div>\n      {/* Build your component here */}\n    </div>\n  );\n}`,
    helloWorld: `export default function App() {\n  return <h1>Hello, World!</h1>;\n}`,
    categories: ["Frontend"],
  },
};

// Extended languages (not yet in DB enum — add via migration)
export const EXTENDED_LANGUAGES = {
  GO: { name: "Go", icon: "🐹", color: "#00ADD8", monacoId: "go" },
  RUST: { name: "Rust", icon: "🦀", color: "#CE422B", monacoId: "rust" },
  SQL: { name: "SQL", icon: "🗄️", color: "#336791", monacoId: "sql" },
  TYPESCRIPT: { name: "TypeScript", icon: "📘", color: "#3178C6", monacoId: "typescript" },
} as const;

// ─── LEARNING PATHS ──────────────────────────────────────────────────────────

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  languages: Language[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  modules: PathModule[];
}

export interface PathModule {
  id: string;
  name: string;
  topics: string[];
  questCount: number;
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "web-fundamentals",
    name: "Web Fundamentals",
    description: "Master HTML, CSS, and JavaScript from scratch",
    icon: "🌐",
    languages: ["HTML_CSS", "JAVASCRIPT"],
    difficulty: "beginner",
    estimatedHours: 40,
    modules: [
      { id: "html-basics", name: "HTML Basics", topics: ["Tags", "Forms", "Semantic HTML"], questCount: 15 },
      { id: "css-styling", name: "CSS Styling", topics: ["Selectors", "Flexbox", "Grid", "Animations"], questCount: 20 },
      { id: "js-fundamentals", name: "JS Fundamentals", topics: ["Variables", "Functions", "DOM", "Events"], questCount: 25 },
    ],
  },
  {
    id: "python-mastery",
    name: "Python Mastery",
    description: "From zero to Python hero",
    icon: "🐍",
    languages: ["PYTHON"],
    difficulty: "beginner",
    estimatedHours: 60,
    modules: [
      { id: "py-basics", name: "Python Basics", topics: ["Variables", "Loops", "Functions"], questCount: 20 },
      { id: "py-data", name: "Data Structures", topics: ["Lists", "Dicts", "Sets", "Tuples"], questCount: 20 },
      { id: "py-oop", name: "OOP", topics: ["Classes", "Inheritance", "Polymorphism"], questCount: 15 },
      { id: "py-advanced", name: "Advanced", topics: ["Decorators", "Generators", "Context Managers"], questCount: 15 },
    ],
  },
  {
    id: "dsa-warrior",
    name: "DSA Warrior",
    description: "Crack coding interviews with data structures & algorithms",
    icon: "⚔️",
    languages: ["PYTHON", "CPP", "JAVA"],
    difficulty: "intermediate",
    estimatedHours: 100,
    modules: [
      { id: "arrays-strings", name: "Arrays & Strings", topics: ["Two Pointers", "Sliding Window", "Prefix Sum"], questCount: 30 },
      { id: "linked-lists", name: "Linked Lists", topics: ["Reversal", "Fast/Slow", "Merge"], questCount: 15 },
      { id: "trees-graphs", name: "Trees & Graphs", topics: ["BFS", "DFS", "BST", "Dijkstra"], questCount: 30 },
      { id: "dp", name: "Dynamic Programming", topics: ["Memoization", "Tabulation", "Patterns"], questCount: 25 },
    ],
  },
  {
    id: "systems-programming",
    name: "Systems Programming",
    description: "Low-level mastery with C and C++",
    icon: "🔧",
    languages: ["C", "CPP"],
    difficulty: "advanced",
    estimatedHours: 80,
    modules: [
      { id: "c-basics", name: "C Fundamentals", topics: ["Pointers", "Memory", "Structs"], questCount: 20 },
      { id: "cpp-oop", name: "C++ OOP", topics: ["Classes", "Templates", "STL"], questCount: 20 },
      { id: "systems", name: "Systems Concepts", topics: ["OS", "Networking", "Concurrency"], questCount: 15 },
    ],
  },
  {
    id: "fullstack-react",
    name: "Fullstack React",
    description: "Build production apps with React and Node.js",
    icon: "⚛️",
    languages: ["JAVASCRIPT", "REACT"],
    difficulty: "intermediate",
    estimatedHours: 70,
    modules: [
      { id: "react-basics", name: "React Basics", topics: ["Components", "Props", "State", "Hooks"], questCount: 20 },
      { id: "react-advanced", name: "Advanced React", topics: ["Context", "Reducers", "Custom Hooks"], questCount: 15 },
      { id: "node-api", name: "Node.js APIs", topics: ["Express", "REST", "Auth", "DB"], questCount: 20 },
    ],
  },
];

// ─── QUEST DIFFICULTY SCALING ────────────────────────────────────────────────

export const DIFFICULTY_CONFIG = {
  BEGINNER: { xpBase: 25, timeLimit: null, hintCount: 3 },
  EASY: { xpBase: 50, timeLimit: 600, hintCount: 2 },
  MEDIUM: { xpBase: 100, timeLimit: 300, hintCount: 1 },
  HARD: { xpBase: 200, timeLimit: 180, hintCount: 0 },
  BOSS: { xpBase: 500, timeLimit: 120, hintCount: 0 },
} as const;

export function getLanguageConfig(language: Language): LanguageConfig {
  return LANGUAGES[language];
}

export function getMonacoLanguage(language: Language): string {
  return LANGUAGES[language].monacoId;
}

export function getSupportedLanguages(): LanguageConfig[] {
  return Object.values(LANGUAGES);
}
