/**
 * Curated, non-executable technical assessment tasks (D4); see docs/INTERVIEWS.md.
 *
 * Every task is read, not run: the candidate traces code, finds a defect, states a complexity or
 * reads a query result. Answers are checked against the keys below on the server. Code shown here
 * is display text only; nothing in SkillBridge executes it or any code a user submits.
 *
 * Keys were worked out by hand and are re-derived in tests where possible (the SQL tasks are
 * checked against the stated tables in backend/src/tests/technical_assessments.test.ts).
 */

export type TaskKind = 'trace' | 'review' | 'complexity' | 'sql';
export type TaskLanguage = 'javascript' | 'python' | 'sql';

export type AnswerKey =
  | { type: 'choice'; options: string[]; correct: number }
  /** Accepted answers; compared case-insensitively with whitespace collapsed, numbers numerically. */
  | { type: 'text'; accepted: string[] }
  /** The 1-based line of `code` that holds the defect. */
  | { type: 'line'; correct: number };

export interface AssessmentTask {
  id: string;
  kind: TaskKind;
  /** Canonical lexicon skill. */
  skill: string;
  language: TaskLanguage;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  code: string;
  answer: AnswerKey;
  explanation: string;
}

const COMPLEXITY_OPTIONS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];

export const SQL_TABLES = `employees
| id | name | dept  | salary |
|----|------|-------|--------|
| 1  | Asha | Eng   | 90     |
| 2  | Ben  | Eng   | 70     |
| 3  | Chen | Sales | 60     |
| 4  | Dina | Sales | 80     |
| 5  | Eli  | HR    | 50     |

orders
| id | employee_id |
|----|-------------|
| 10 | 1           |
| 11 | 1           |
| 12 | 3           |`;

export const ASSESSMENT_BANK: AssessmentTask[] = [
  // ---- Trace: what does it print? ----------------------------------------------------------------
  {
    id: 'trace-js-reference',
    kind: 'trace',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: 'const a = [1, 2, 3];\nconst b = a;\nb.push(4);\nconsole.log(a.length);',
    answer: { type: 'text', accepted: ['4'] },
    explanation: 'b and a refer to the same array, so pushing through b changes a: its length becomes 4.',
  },
  {
    id: 'trace-js-typeof-null',
    kind: 'trace',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: 'console.log(typeof null);',
    answer: { type: 'text', accepted: ['object', '"object"', "'object'"] },
    explanation: 'A long-standing quirk of JavaScript: typeof null is "object".',
  },
  {
    id: 'trace-js-continue',
    kind: 'trace',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: 'let x = 0;\nfor (let i = 0; i < 5; i++) {\n  if (i % 2 === 0) continue;\n  x += i;\n}\nconsole.log(x);',
    answer: { type: 'text', accepted: ['4'] },
    explanation: 'Even values of i are skipped, so only 1 and 3 are added: 1 + 3 = 4.',
  },
  {
    id: 'trace-js-var-closure',
    kind: 'trace',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: 'var fns = [];\nfor (var i = 0; i < 3; i++) {\n  fns.push(() => i);\n}\nconsole.log(fns[0]());',
    answer: { type: 'text', accepted: ['3'] },
    explanation: 'var is function-scoped, so every closure shares one i, which is 3 when the loop ends. With let each iteration would get its own i.',
  },
  {
    id: 'trace-js-event-loop',
    kind: 'trace',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'hard',
    prompt: 'In what order are the letters printed?',
    code: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');",
    answer: { type: 'choice', options: ['A B C D', 'A D B C', 'A D C B', 'A C D B'], correct: 2 },
    explanation: 'Synchronous code runs first (A, D). Promise callbacks are microtasks and run before timer callbacks (macrotasks), so C comes before B.',
  },
  {
    id: 'trace-py-default-arg',
    kind: 'trace',
    skill: 'Python',
    language: 'python',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: 'def f(items=[]):\n    items.append(1)\n    return len(items)\n\nf()\nprint(f())',
    answer: { type: 'text', accepted: ['2'] },
    explanation: 'The default list is created once, when the function is defined, and shared by every call: the second call sees two items.',
  },
  {
    id: 'trace-py-sort',
    kind: 'trace',
    skill: 'Python',
    language: 'python',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: 'nums = [3, 1, 2]\nnums.sort()\nprint(nums[-1] * 2)',
    answer: { type: 'text', accepted: ['6'] },
    explanation: 'After sorting, nums is [1, 2, 3]; the last element is 3, and 3 * 2 = 6.',
  },
  {
    id: 'trace-py-dict-get',
    kind: 'trace',
    skill: 'Python',
    language: 'python',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: 'd = {"a": 1}\nprint(d.get("b", 0) + d["a"])',
    answer: { type: 'text', accepted: ['1'] },
    explanation: 'get returns the default 0 for the missing key "b", and d["a"] is 1: 0 + 1 = 1.',
  },

  // ---- Review: find the defect -------------------------------------------------------------------
  {
    id: 'review-js-assignment',
    kind: 'review',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'easy',
    prompt: 'Which line contains the bug?',
    code: 'function isAdult(user) {\n  if (user.age = 18) {\n    return true;\n  }\n  return user.age > 18;\n}',
    answer: { type: 'line', correct: 2 },
    explanation: 'Line 2 assigns 18 instead of comparing (=== or >=), so the condition is always true and the age is overwritten.',
  },
  {
    id: 'review-js-sql-injection',
    kind: 'review',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'medium',
    prompt: 'What is the main problem with this handler?',
    code: "app.get('/user', async (req, res) => {\n  const id = req.query.id;\n  const rows = await db.query(\"SELECT * FROM users WHERE id = \" + id);\n  res.json(rows);\n});",
    answer: {
      type: 'choice',
      options: ['The query is open to SQL injection', 'SELECT * is not allowed in a handler', 'req.query cannot be read in a GET handler', 'res.json cannot send an array'],
      correct: 0,
    },
    explanation: 'User input is concatenated into the SQL text. Use a parameterised query (for example "WHERE id = $1" with [id]).',
  },
  {
    id: 'review-js-foreach-async',
    kind: 'review',
    skill: 'JavaScript',
    language: 'javascript',
    difficulty: 'hard',
    prompt: 'What is wrong with this function?',
    code: "async function saveAll(items) {\n  items.forEach(async (item) => {\n    await db.save(item);\n  });\n  console.log('all saved');\n}",
    answer: {
      type: 'choice',
      options: ['"all saved" can be logged before the saves finish', 'forEach cannot be given an async function', 'db.save must not be awaited', 'Nothing is wrong'],
      correct: 0,
    },
    explanation: 'forEach ignores the promises its callback returns, so saveAll does not wait for them. Use for...of with await, or await Promise.all(items.map(...)).',
  },
  {
    id: 'review-py-empty-average',
    kind: 'review',
    skill: 'Python',
    language: 'python',
    difficulty: 'easy',
    prompt: 'Which input makes this function fail?',
    code: 'def average(values):\n    total = 0\n    for v in values:\n        total += v\n    return total / len(values)',
    answer: { type: 'choice', options: ['[1, 2, 3]', '[]', '[0]', '[-1, 1]'], correct: 1 },
    explanation: 'An empty list makes len(values) zero, and dividing by zero raises ZeroDivisionError. [0] and [-1, 1] are fine: only the divisor matters.',
  },
  {
    id: 'review-py-off-by-one',
    kind: 'review',
    skill: 'Python',
    language: 'python',
    difficulty: 'medium',
    prompt: 'The function should return the last n items. What does last_n([1, 2, 3, 4], 2) actually return?',
    code: 'def last_n(items, n):\n    return items[len(items) - n - 1:]',
    answer: { type: 'choice', options: ['[3, 4]', '[2, 3, 4]', '[4]', '[1, 2]'], correct: 1 },
    explanation: 'The start index is 4 - 2 - 1 = 1, so the slice is items[1:] = [2, 3, 4]: one item too many. items[-n:] (for n > 0) is correct.',
  },

  // ---- Complexity ---------------------------------------------------------------------------------
  {
    id: 'complexity-nested-duplicates',
    kind: 'complexity',
    skill: 'Data Structures and Algorithms',
    language: 'python',
    difficulty: 'easy',
    prompt: 'What is the worst-case time complexity, for n items?',
    code: 'def has_duplicate(items):\n    for i in range(len(items)):\n        for j in range(i + 1, len(items)):\n            if items[i] == items[j]:\n                return True\n    return False',
    answer: { type: 'choice', options: COMPLEXITY_OPTIONS, correct: 4 },
    explanation: 'Every pair is compared in the worst case (no duplicates): n(n-1)/2 comparisons, which is O(n²).',
  },
  {
    id: 'complexity-set-duplicates',
    kind: 'complexity',
    skill: 'Data Structures and Algorithms',
    language: 'python',
    difficulty: 'easy',
    prompt: 'What is the expected time complexity, for n items?',
    code: 'def has_duplicate(items):\n    seen = set()\n    for x in items:\n        if x in seen:\n            return True\n        seen.add(x)\n    return False',
    answer: { type: 'choice', options: COMPLEXITY_OPTIONS, correct: 2 },
    explanation: 'One pass, with set membership and insertion in expected constant time: O(n), at the cost of O(n) extra memory.',
  },
  {
    id: 'complexity-binary-search',
    kind: 'complexity',
    skill: 'Data Structures and Algorithms',
    language: 'python',
    difficulty: 'easy',
    prompt: 'What is the worst-case time complexity on a sorted list of n items?',
    code: 'def find(items, target):\n    lo, hi = 0, len(items) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1',
    answer: { type: 'choice', options: COMPLEXITY_OPTIONS, correct: 1 },
    explanation: 'Each step halves the remaining range, so at most about log₂ n steps: O(log n).',
  },
  {
    id: 'complexity-doubling-loop',
    kind: 'complexity',
    skill: 'Data Structures and Algorithms',
    language: 'javascript',
    difficulty: 'medium',
    prompt: 'What is the time complexity of f(n)?',
    code: 'function f(n) {\n  let count = 0;\n  for (let i = 1; i < n; i *= 2) {\n    for (let j = 0; j < n; j++) count++;\n  }\n  return count;\n}',
    answer: { type: 'choice', options: COMPLEXITY_OPTIONS, correct: 3 },
    explanation: 'The outer loop doubles i, so it runs about log₂ n times; the inner loop runs n times for each: O(n log n).',
  },
  {
    id: 'complexity-recursive-space',
    kind: 'complexity',
    skill: 'Data Structures and Algorithms',
    language: 'python',
    difficulty: 'medium',
    prompt: 'What is the space complexity (call stack included) of fact(n)?',
    code: 'def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)',
    answer: { type: 'choice', options: COMPLEXITY_OPTIONS, correct: 2 },
    explanation: 'Each call waits on the next, so n frames are on the stack at the deepest point: O(n) space. A loop would need O(1).',
  },

  // ---- SQL reading ------------------------------------------------------------------------------------
  {
    id: 'sql-group-count',
    kind: 'sql',
    skill: 'SQL',
    language: 'sql',
    difficulty: 'medium',
    prompt: 'Using the tables below, how many rows does this query return?',
    code: 'SELECT dept, COUNT(*)\nFROM employees\nWHERE salary > 55\nGROUP BY dept;',
    answer: { type: 'text', accepted: ['2'] },
    explanation: 'The WHERE clause removes Eli (HR, 50) before grouping, leaving Eng and Sales: 2 groups.',
  },
  {
    id: 'sql-offset',
    kind: 'sql',
    skill: 'SQL',
    language: 'sql',
    difficulty: 'easy',
    prompt: 'Using the tables below, what name does this query return?',
    code: 'SELECT name\nFROM employees\nORDER BY salary DESC\nLIMIT 1 OFFSET 1;',
    answer: { type: 'text', accepted: ['Dina'] },
    explanation: 'Ordered by salary from highest: Asha (90), Dina (80), Ben (70)… OFFSET 1 skips Asha, so the result is Dina.',
  },
  {
    id: 'sql-avg',
    kind: 'sql',
    skill: 'SQL',
    language: 'sql',
    difficulty: 'easy',
    prompt: 'Using the tables below, what value does this query return?',
    code: "SELECT AVG(salary)\nFROM employees\nWHERE dept = 'Sales';",
    answer: { type: 'text', accepted: ['70'] },
    explanation: 'Sales salaries are 60 and 80; their average is 70.',
  },
  {
    id: 'sql-left-join-zero',
    kind: 'sql',
    skill: 'SQL',
    language: 'sql',
    difficulty: 'hard',
    prompt: 'Using the tables below, how many rows of the result show a count of 0?',
    code: 'SELECT e.name, COUNT(o.id)\nFROM employees e\nLEFT JOIN orders o ON o.employee_id = e.id\nGROUP BY e.name;',
    answer: { type: 'text', accepted: ['3'] },
    explanation: 'Asha has 2 orders and Chen 1. Ben, Dina and Eli have none: the LEFT JOIN keeps them with a NULL o.id, which COUNT(o.id) counts as 0. That is 3 rows.',
  },
  {
    id: 'sql-count-distinct',
    kind: 'sql',
    skill: 'SQL',
    language: 'sql',
    difficulty: 'easy',
    prompt: 'Using the tables below, what value does this query return?',
    code: 'SELECT COUNT(DISTINCT dept)\nFROM employees;',
    answer: { type: 'text', accepted: ['3'] },
    explanation: 'The departments are Eng, Sales and HR: 3 distinct values.',
  },
];

export const TASKS_BY_ID = new Map(ASSESSMENT_BANK.map(t => [t.id, t]));
