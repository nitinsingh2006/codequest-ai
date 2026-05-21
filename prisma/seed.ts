import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Python World
  const pythonWorld = await prisma.world.upsert({
    where: { id: "world-python-basics" },
    update: {},
    create: {
      id: "world-python-basics",
      name: "Python Foundations",
      description: "Master Python basics - variables, loops, functions, and more!",
      language: "PYTHON",
      order: 1,
      unlockLevel: 1,
    },
  });

  // Seed Python Quests
  const quests = [
    {
      id: "quest-py-hello",
      title: "Hello, Coder!",
      description: "Write a program that prints 'Hello, World!'",
      language: "PYTHON" as const,
      difficulty: "BEGINNER" as const,
      xpReward: 50,
      coinReward: 10,
      order: 1,
      worldId: pythonWorld.id,
      starterCode: "# Write your code below\n",
      solution: 'print("Hello, World!")',
      testCases: [{ input: "", expected: "Hello, World!" }],
      hints: ["Use the print() function", "Strings go inside quotes"],
    },
    {
      id: "quest-py-variables",
      title: "Variable Vault",
      description: "Create a variable 'name' with your name and print a greeting.",
      language: "PYTHON" as const,
      difficulty: "BEGINNER" as const,
      xpReward: 75,
      coinReward: 15,
      order: 2,
      worldId: pythonWorld.id,
      starterCode: '# Create a variable called name and print "Hello, {name}!"\n',
      solution: 'name = "Player"\nprint(f"Hello, {name}!")',
      testCases: [{ input: "", expected: "Hello, " }],
      hints: ["Variables store data: name = 'value'", "Use f-strings: f\"Hello, {name}!\""],
    },
    {
      id: "quest-py-loop",
      title: "Loop Legend",
      description: "Print numbers 1 to 5, each on a new line.",
      language: "PYTHON" as const,
      difficulty: "EASY" as const,
      xpReward: 100,
      coinReward: 20,
      order: 3,
      worldId: pythonWorld.id,
      starterCode: "# Print numbers 1 to 5\n",
      solution: "for i in range(1, 6):\n    print(i)",
      testCases: [{ input: "", expected: "1\n2\n3\n4\n5" }],
      hints: ["Use a for loop with range()", "range(1, 6) gives 1,2,3,4,5"],
    },
    {
      id: "quest-py-function",
      title: "Function Forge",
      description: "Write a function 'add' that takes two numbers and returns their sum.",
      language: "PYTHON" as const,
      difficulty: "EASY" as const,
      xpReward: 125,
      coinReward: 25,
      order: 4,
      worldId: pythonWorld.id,
      starterCode: "# Define a function called add\n\n# Test it\nprint(add(3, 5))\n",
      solution: "def add(a, b):\n    return a + b\n\nprint(add(3, 5))",
      testCases: [{ input: "", expected: "8" }],
      hints: ["Use def to define functions", "return gives back a value"],
    },
    {
      id: "quest-py-boss",
      title: "🐉 The FizzBuzz Dragon",
      description: "Defeat the dragon! Print numbers 1-20. For multiples of 3 print 'Fizz', multiples of 5 print 'Buzz', both print 'FizzBuzz'.",
      language: "PYTHON" as const,
      difficulty: "BOSS" as const,
      xpReward: 300,
      coinReward: 50,
      order: 5,
      worldId: pythonWorld.id,
      starterCode: "# Defeat the FizzBuzz Dragon!\n# Print 1-20 with FizzBuzz rules\n",
      solution: 'for i in range(1, 21):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)',
      testCases: [{ input: "", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz" }],
      hints: ["Use modulo % to check divisibility", "Check 15 first (both 3 and 5)", "Use elif for multiple conditions"],
    },
  ];

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { id: quest.id },
      update: {},
      create: quest,
    });
  }

  // Seed Achievements
  const achievements = [
    { name: "First Blood", description: "Complete your first quest", icon: "⚔️", xpReward: 50, rarity: "COMMON" as const, condition: { type: "quests_completed", value: 1 } },
    { name: "Streak Master", description: "Maintain a 7-day streak", icon: "🔥", xpReward: 200, rarity: "RARE" as const, condition: { type: "streak", value: 7 } },
    { name: "Dragon Slayer", description: "Defeat a boss battle", icon: "🐉", xpReward: 500, rarity: "EPIC" as const, condition: { type: "boss_defeated", value: 1 } },
    { name: "Speed Demon", description: "Complete a quest in under 60 seconds", icon: "⚡", xpReward: 150, rarity: "RARE" as const, condition: { type: "speed_complete", value: 60 } },
    { name: "Centurion", description: "Complete 100 quests", icon: "🏛️", xpReward: 1000, rarity: "LEGENDARY" as const, condition: { type: "quests_completed", value: 100 } },
    { name: "Polyglot", description: "Complete quests in 5 different languages", icon: "🌍", xpReward: 300, rarity: "EPIC" as const, condition: { type: "languages_used", value: 5 } },
    { name: "Level 10", description: "Reach level 10", icon: "⭐", xpReward: 200, rarity: "COMMON" as const, condition: { type: "level", value: 10 } },
    { name: "XP Hoarder", description: "Accumulate 10,000 XP", icon: "💰", xpReward: 500, rarity: "RARE" as const, condition: { type: "xp", value: 10000 } },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
  }

  // Create JavaScript World
  const jsWorld = await prisma.world.upsert({
    where: { id: "world-js-basics" },
    update: {},
    create: {
      id: "world-js-basics",
      name: "JavaScript Jungle",
      description: "Navigate the wild world of JavaScript!",
      language: "JAVASCRIPT",
      order: 2,
      unlockLevel: 3,
      theme: "jungle",
    },
  });

  // JS Quests
  const jsQuests = [
    {
      id: "quest-js-hello",
      title: "Console Quest",
      description: "Print 'Hello, JavaScript!' to the console.",
      language: "JAVASCRIPT" as const,
      difficulty: "BEGINNER" as const,
      xpReward: 50,
      coinReward: 10,
      order: 1,
      worldId: jsWorld.id,
      starterCode: "// Print Hello, JavaScript!\n",
      solution: 'console.log("Hello, JavaScript!");',
      testCases: [{ input: "", expected: "Hello, JavaScript!" }],
      hints: ["Use console.log()"],
    },
    {
      id: "quest-js-arrow",
      title: "Arrow Academy",
      description: "Write an arrow function 'double' that returns a number multiplied by 2.",
      language: "JAVASCRIPT" as const,
      difficulty: "EASY" as const,
      xpReward: 100,
      coinReward: 20,
      order: 2,
      worldId: jsWorld.id,
      starterCode: "// Write an arrow function called double\n\nconsole.log(double(7));\n",
      solution: "const double = (n) => n * 2;\nconsole.log(double(7));",
      testCases: [{ input: "", expected: "14" }],
      hints: ["Arrow syntax: const fn = (x) => x * 2"],
    },
  ];

  for (const quest of jsQuests) {
    await prisma.quest.upsert({ where: { id: quest.id }, update: {}, create: quest });
  }

  // Create C++ World
  const cppWorld = await prisma.world.upsert({
    where: { id: "world-cpp-arena" },
    update: {},
    create: {
      id: "world-cpp-arena",
      name: "C++ Arena",
      description: "Enter the arena of high-performance programming!",
      language: "CPP",
      order: 3,
      unlockLevel: 5,
      theme: "arena",
    },
  });

  // Battle Pass
  await prisma.battlePass.upsert({
    where: { season: 1 },
    update: {},
    create: {
      season: 1,
      name: "Season 1: Genesis",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 86400000), // 90 days
      tiers: {
        create: [
          { tier: 1, xpRequired: 100, rewardType: "coins", rewardValue: "50" },
          { tier: 2, xpRequired: 300, rewardType: "title", rewardValue: "Rookie Coder" },
          { tier: 3, xpRequired: 600, rewardType: "gems", rewardValue: "10" },
          { tier: 4, xpRequired: 1000, rewardType: "xp_boost", rewardValue: "1.5x for 24h" },
          { tier: 5, xpRequired: 1500, rewardType: "title", rewardValue: "Code Warrior", isPremium: true },
        ],
      },
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
