// Additional quest data for seeding — import and use in prisma/seed.ts
// Run: npx tsx prisma/seed-quests.ts

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const PYTHON_QUESTS = [
  { title: "Hello, Coder!", desc: "Print 'Hello, World!'", difficulty: "BEGINNER", xp: 25, starter: "# Print Hello, World!\n", solution: 'print("Hello, World!")', tests: [{ input: "", expected: "Hello, World!" }], hints: ["Use print()"] },
  { title: "Variable Vault", desc: "Store your age in a variable and print it", difficulty: "BEGINNER", xp: 30, starter: "# Create age variable and print it\n", solution: "age = 20\nprint(age)", tests: [{ input: "", expected: "20" }], hints: ["age = number"] },
  { title: "Sum Spell", desc: "Print the sum of 15 and 27", difficulty: "BEGINNER", xp: 30, starter: "# Print 15 + 27\n", solution: "print(15 + 27)", tests: [{ input: "", expected: "42" }], hints: ["Use + operator"] },
  { title: "String Sorcery", desc: "Concatenate 'Hello' and 'World' with a space", difficulty: "BEGINNER", xp: 35, starter: "# Join two strings\n", solution: 'print("Hello" + " " + "World")', tests: [{ input: "", expected: "Hello World" }], hints: ["Use + to join strings"] },
  { title: "Type Transformer", desc: "Convert string '42' to integer and print it doubled", difficulty: "BEGINNER", xp: 40, starter: "# Convert and double\nnum_str = '42'\n", solution: "num_str = '42'\nprint(int(num_str) * 2)", tests: [{ input: "", expected: "84" }], hints: ["int() converts strings"] },
  { title: "Loop Legend", desc: "Print numbers 1 to 5", difficulty: "EASY", xp: 50, starter: "# Print 1 to 5\n", solution: "for i in range(1, 6):\n    print(i)", tests: [{ input: "", expected: "1\n2\n3\n4\n5" }], hints: ["range(1, 6)"] },
  { title: "Even Hunter", desc: "Print even numbers from 1 to 10", difficulty: "EASY", xp: 60, starter: "# Print even numbers 1-10\n", solution: "for i in range(2, 11, 2):\n    print(i)", tests: [{ input: "", expected: "2\n4\n6\n8\n10" }], hints: ["range(start, stop, step)"] },
  { title: "List Lancer", desc: "Create a list [1,2,3,4,5] and print its sum", difficulty: "EASY", xp: 60, starter: "# Sum a list\n", solution: "nums = [1, 2, 3, 4, 5]\nprint(sum(nums))", tests: [{ input: "", expected: "15" }], hints: ["sum() adds list items"] },
  { title: "Function Forge", desc: "Write a function that returns a number squared", difficulty: "EASY", xp: 75, starter: "# Define square(n)\n\nprint(square(5))\n", solution: "def square(n):\n    return n * n\n\nprint(square(5))", tests: [{ input: "", expected: "25" }], hints: ["def name(param): return value"] },
  { title: "Max Finder", desc: "Find the maximum of three numbers", difficulty: "EASY", xp: 75, starter: "# Find max of 10, 25, 7\n", solution: "print(max(10, 25, 7))", tests: [{ input: "", expected: "25" }], hints: ["max() finds largest"] },
  { title: "Reverse Rider", desc: "Reverse the string 'hello' and print it", difficulty: "MEDIUM", xp: 100, starter: "# Reverse 'hello'\n", solution: "print('hello'[::-1])", tests: [{ input: "", expected: "olleh" }], hints: ["[::-1] reverses"] },
  { title: "Palindrome Paladin", desc: "Check if 'racecar' is a palindrome", difficulty: "MEDIUM", xp: 100, starter: "# Is 'racecar' a palindrome?\nword = 'racecar'\n", solution: "word = 'racecar'\nprint(word == word[::-1])", tests: [{ input: "", expected: "True" }], hints: ["Compare with reversed"] },
  { title: "Factorial Fighter", desc: "Calculate factorial of 5", difficulty: "MEDIUM", xp: 120, starter: "# Calculate 5!\n", solution: "result = 1\nfor i in range(1, 6):\n    result *= i\nprint(result)", tests: [{ input: "", expected: "120" }], hints: ["Multiply 1*2*3*4*5"] },
  { title: "Dict Detective", desc: "Count character frequency in 'hello'", difficulty: "MEDIUM", xp: 120, starter: "# Count chars in 'hello'\n", solution: "word = 'hello'\nfreq = {}\nfor c in word:\n    freq[c] = freq.get(c, 0) + 1\nprint(freq)", tests: [{ input: "", expected: "{'h': 1, 'e': 1, 'l': 2, 'o': 1}" }], hints: ["dict.get(key, default)"] },
  { title: "Prime Protector", desc: "Check if 17 is prime", difficulty: "MEDIUM", xp: 130, starter: "# Is 17 prime?\nn = 17\n", solution: "n = 17\nis_prime = all(n % i != 0 for i in range(2, int(n**0.5)+1))\nprint(is_prime)", tests: [{ input: "", expected: "True" }], hints: ["Check divisibility up to sqrt"] },
  { title: "Fibonacci Fury", desc: "Print first 10 Fibonacci numbers", difficulty: "HARD", xp: 200, starter: "# First 10 Fibonacci\n", solution: "a, b = 0, 1\nfor _ in range(10):\n    print(a)\n    a, b = b, a + b", tests: [{ input: "", expected: "0\n1\n1\n2\n3\n5\n8\n13\n21\n34" }], hints: ["a, b = b, a+b"] },
  { title: "Sort Sorcerer", desc: "Implement bubble sort on [5,3,8,1,2]", difficulty: "HARD", xp: 200, starter: "# Bubble sort\narr = [5, 3, 8, 1, 2]\n", solution: "arr = [5, 3, 8, 1, 2]\nfor i in range(len(arr)):\n    for j in range(len(arr)-1-i):\n        if arr[j] > arr[j+1]:\n            arr[j], arr[j+1] = arr[j+1], arr[j]\nprint(arr)", tests: [{ input: "", expected: "[1, 2, 3, 5, 8]" }], hints: ["Compare adjacent, swap if needed"] },
  { title: "🐉 FizzBuzz Dragon", desc: "FizzBuzz 1-20", difficulty: "BOSS", xp: 500, starter: "# FizzBuzz 1-20\n", solution: 'for i in range(1, 21):\n    if i % 15 == 0: print("FizzBuzz")\n    elif i % 3 == 0: print("Fizz")\n    elif i % 5 == 0: print("Buzz")\n    else: print(i)', tests: [{ input: "", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz" }], hints: ["Check 15 first"] },
];

const JS_QUESTS = [
  { title: "Console Quest", desc: "Print 'Hello, JavaScript!'", difficulty: "BEGINNER", xp: 25, starter: "// Print greeting\n", solution: 'console.log("Hello, JavaScript!");', tests: [{ input: "", expected: "Hello, JavaScript!" }], hints: ["console.log()"] },
  { title: "Arrow Academy", desc: "Create arrow function that doubles a number", difficulty: "EASY", xp: 60, starter: "// Arrow function double\n\nconsole.log(double(7));\n", solution: "const double = (n) => n * 2;\nconsole.log(double(7));", tests: [{ input: "", expected: "14" }], hints: ["const fn = (x) => x * 2"] },
  { title: "Array Alchemist", desc: "Filter even numbers from [1,2,3,4,5,6]", difficulty: "EASY", xp: 75, starter: "// Filter evens\nconst nums = [1,2,3,4,5,6];\n", solution: "const nums = [1,2,3,4,5,6];\nconsole.log(nums.filter(n => n % 2 === 0));", tests: [{ input: "", expected: "[ 2, 4, 6 ]" }], hints: [".filter(callback)"] },
  { title: "Object Oracle", desc: "Create a person object and print their name", difficulty: "EASY", xp: 60, starter: "// Create person with name 'Alex'\n", solution: 'const person = { name: "Alex" };\nconsole.log(person.name);', tests: [{ input: "", expected: "Alex" }], hints: ["{ key: value }"] },
  { title: "Promise Pioneer", desc: "Create a resolved promise and log its value", difficulty: "MEDIUM", xp: 100, starter: "// Resolve a promise with 'done'\n", solution: 'Promise.resolve("done").then(v => console.log(v));', tests: [{ input: "", expected: "done" }], hints: ["Promise.resolve(value)"] },
  { title: "Map Master", desc: "Double all numbers in [1,2,3] using map", difficulty: "EASY", xp: 60, starter: "// Map to double\n", solution: "console.log([1,2,3].map(n => n * 2));", tests: [{ input: "", expected: "[ 2, 4, 6 ]" }], hints: [".map(fn)"] },
  { title: "Destructure Demon", desc: "Destructure {x:1, y:2} and print x + y", difficulty: "MEDIUM", xp: 100, starter: "// Destructure and sum\nconst obj = {x: 1, y: 2};\n", solution: "const obj = {x: 1, y: 2};\nconst {x, y} = obj;\nconsole.log(x + y);", tests: [{ input: "", expected: "3" }], hints: ["const {a, b} = obj"] },
  { title: "Spread Sorcerer", desc: "Merge [1,2] and [3,4] using spread", difficulty: "MEDIUM", xp: 100, starter: "// Merge arrays\n", solution: "console.log([...[1,2], ...[3,4]]);", tests: [{ input: "", expected: "[ 1, 2, 3, 4 ]" }], hints: ["[...arr1, ...arr2]"] },
  { title: "Reduce Ranger", desc: "Sum [1,2,3,4,5] using reduce", difficulty: "MEDIUM", xp: 120, starter: "// Reduce to sum\n", solution: "console.log([1,2,3,4,5].reduce((a,b) => a+b, 0));", tests: [{ input: "", expected: "15" }], hints: [".reduce((acc, val) => acc + val, 0)"] },
  { title: "🐉 Async Dragon", desc: "Fetch simulation: resolve after 'delay' and print 'loaded'", difficulty: "BOSS", xp: 400, starter: "// Simulate async fetch\n", solution: 'async function load() {\n  await new Promise(r => setTimeout(r, 10));\n  console.log("loaded");\n}\nload();', tests: [{ input: "", expected: "loaded" }], hints: ["async/await with Promise"] },
];

const CPP_QUESTS = [
  { title: "Hello C++", desc: "Print 'Hello, C++!'", difficulty: "BEGINNER", xp: 30, starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Print greeting\n    return 0;\n}', solution: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}', tests: [{ input: "", expected: "Hello, C++!" }], hints: ["cout << text << endl"] },
  { title: "Sum Input", desc: "Read two integers and print their sum", difficulty: "EASY", xp: 60, starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read a, b and print sum\n    return 0;\n}', solution: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}', tests: [{ input: "3 5", expected: "8" }], hints: ["cin >> a >> b"] },
  { title: "Array Average", desc: "Calculate average of 5 numbers", difficulty: "EASY", xp: 75, starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int arr[] = {10, 20, 30, 40, 50};\n    // Print average\n    return 0;\n}', solution: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int arr[] = {10, 20, 30, 40, 50};\n    int sum = 0;\n    for(int i = 0; i < 5; i++) sum += arr[i];\n    cout << sum / 5 << endl;\n    return 0;\n}', tests: [{ input: "", expected: "30" }], hints: ["Loop and divide by count"] },
  { title: "Pointer Power", desc: "Use a pointer to modify a variable", difficulty: "MEDIUM", xp: 100, starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 10;\n    // Use pointer to set x = 20, print x\n    return 0;\n}', solution: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 10;\n    int* p = &x;\n    *p = 20;\n    cout << x << endl;\n    return 0;\n}', tests: [{ input: "", expected: "20" }], hints: ["int* p = &x; *p = value"] },
  { title: "Vector Victor", desc: "Push 1-5 into vector and print size", difficulty: "MEDIUM", xp: 100, starter: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v;\n    // Push 1-5, print size\n    return 0;\n}', solution: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v;\n    for(int i=1;i<=5;i++) v.push_back(i);\n    cout << v.size() << endl;\n    return 0;\n}', tests: [{ input: "", expected: "5" }], hints: ["v.push_back(i)"] },
];

async function main() {
  // Ensure worlds exist
  const pyWorld = await prisma.world.upsert({
    where: { id: "world-python-basics" },
    update: {},
    create: { id: "world-python-basics", name: "Python Foundations", description: "Master Python from zero to hero", language: "PYTHON", order: 1, unlockLevel: 1, theme: "forest" },
  });

  const jsWorld = await prisma.world.upsert({
    where: { id: "world-js-basics" },
    update: {},
    create: { id: "world-js-basics", name: "JavaScript Jungle", description: "Navigate the wild world of JavaScript", language: "JAVASCRIPT", order: 2, unlockLevel: 3, theme: "jungle" },
  });

  const cppWorld = await prisma.world.upsert({
    where: { id: "world-cpp-arena" },
    update: {},
    create: { id: "world-cpp-arena", name: "C++ Arena", description: "Enter the arena of high-performance programming", language: "CPP", order: 3, unlockLevel: 5, theme: "arena" },
  });

  // Seed quests
  const allQuests = [
    ...PYTHON_QUESTS.map((q, i) => ({ ...q, worldId: pyWorld.id, language: "PYTHON" as const, order: i + 1 })),
    ...JS_QUESTS.map((q, i) => ({ ...q, worldId: jsWorld.id, language: "JAVASCRIPT" as const, order: i + 1 })),
    ...CPP_QUESTS.map((q, i) => ({ ...q, worldId: cppWorld.id, language: "CPP" as const, order: i + 1 })),
  ];

  for (const q of allQuests) {
    const id = `quest-${q.language.toLowerCase().slice(0, 2)}-${q.order}`;
    await prisma.quest.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title: q.title,
        description: q.desc,
        language: q.language,
        difficulty: q.difficulty as any,
        xpReward: q.xp,
        coinReward: Math.round(q.xp * 0.2),
        order: q.order,
        worldId: q.worldId,
        starterCode: q.starter,
        solution: q.solution,
        testCases: q.tests,
        hints: q.hints,
        isBoss: q.difficulty === "BOSS",
      },
    });
  }

  console.log(`✅ Seeded ${allQuests.length} quests across 3 worlds`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
