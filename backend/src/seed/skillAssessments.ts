import crypto from 'node:crypto';

/**
 * Curated multiple-choice questions used for skill checks.
 *
 * Scope and honesty: a skill check is a short knowledge quiz written by the SkillBridge authors.
 * Passing it shows that the user answered conceptual questions correctly at one point in time. It
 * is not a certification, it does not test building anything, and nothing here is executed.
 *
 * Every question has exactly one correct option and an explanation shown after submission.
 * Answers are never sent to the client before an attempt is submitted.
 */

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  /** Index of the correct option. */
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

const q = (id: string, prompt: string, options: [string, string, string, string], answer: 0 | 1 | 2 | 3, explanation: string): AssessmentQuestion => ({
  id,
  prompt,
  options,
  answer,
  explanation
});

export const SKILL_ASSESSMENTS: Record<string, AssessmentQuestion[]> = {
  JavaScript: [
    q('js-1', 'What does `typeof null` evaluate to in JavaScript?', ['"null"', '"object"', '"undefined"', '"number"'], 1, '`typeof null` is "object". It is a long-standing quirk of the language kept for compatibility.'),
    q('js-2', 'Which statement about `let` and `var` is correct?', ['Both are function-scoped', '`let` is block-scoped; `var` is function-scoped', '`var` is block-scoped; `let` is function-scoped', 'Neither can be reassigned'], 1, '`let` and `const` are scoped to the enclosing block; `var` is scoped to the enclosing function.'),
    q('js-3', 'What is logged by `console.log([1, 2, 3].map(n => n * 2))`?', ['[1, 2, 3]', '6', '[2, 4, 6]', 'undefined'], 2, '`map` returns a new array with the callback applied to each element.'),
    q('js-4', 'What does `===` check that `==` does not?', ['That both operands are objects', 'That the values are equal without type conversion', 'That both operands are defined', 'That the operands are the same variable'], 1, '`===` compares without converting types, so `1 === "1"` is false while `1 == "1"` is true.'),
    q('js-5', 'A function is declared with `async`. What does calling it return?', ['The value in its return statement, directly', 'A Promise', 'A callback', 'undefined, always'], 1, 'An async function always returns a Promise that resolves to its return value.'),
    q('js-6', 'Given `setTimeout(() => console.log("A"), 0); console.log("B");`, what is the output order?', ['A then B', 'B then A', 'Only B', 'It varies between runs'], 1, 'The timer callback is queued and runs after the current synchronous code finishes, so B is logged first.'),
    q('js-7', 'What does `const` prevent?', ['Changing the properties of an object', 'Reassigning the variable', 'Reading the variable before it is declared only', 'Using the variable inside a function'], 1, '`const` prevents reassignment of the binding. An object held in a `const` can still have its properties changed.')
  ],
  TypeScript: [
    q('ts-1', 'When are TypeScript types checked?', ['While the program runs', 'At compile time; they are removed from the emitted JavaScript', 'Only in the browser', 'Only when a test runs'], 1, 'Types are checked by the compiler and erased. They do not exist at run time.'),
    q('ts-2', 'What does the type `string | undefined` mean?', ['A string that is never empty', 'A value that is either a string or undefined', 'A string converted to undefined', 'An optional function'], 1, 'It is a union type: the value may be a string or undefined, and must be narrowed before string methods are used safely.'),
    q('ts-3', 'Why is `unknown` safer than `any`?', ['It is faster at run time', 'A value of type `unknown` must be narrowed before it can be used', 'It cannot hold objects', 'It is checked at run time'], 1, '`any` switches type checking off for the value; `unknown` forces a check before use.'),
    q('ts-4', 'What does `interface User { name: string; age?: number }` say about `age`?', ['It is required', 'It is optional', 'It must be null', 'It is read-only'], 1, 'The `?` marks the property as optional.'),
    q('ts-5', 'Data arrives from an HTTP API at run time. What does a TypeScript type annotation on it guarantee?', ['That the data has that shape', 'Nothing at run time; the data must be validated separately', 'That invalid data throws an error', 'That the server is typed too'], 1, 'Annotations are compile-time claims. Data from outside the program needs run-time validation.'),
    q('ts-6', 'What does `Array<T>` use?', ['A decorator', 'A generic type parameter', 'An enum', 'A namespace'], 1, '`T` is a type parameter: `Array<string>` is an array of strings.'),
    q('ts-7', 'What is the effect of `as` in `value as string`?', ['It converts the value to a string at run time', 'It tells the compiler to treat the value as a string without checking', 'It validates the value', 'It copies the value'], 1, 'A type assertion changes only what the compiler believes. It performs no conversion or check.')
  ],
  React: [
    q('react-1', 'What causes a React function component to render again?', ['Any variable inside it changing', 'A change to its state or props, or its parent rendering', 'Every browser repaint', 'Only a page reload'], 1, 'React re-renders a component when its state changes, its props change, or its parent re-renders.'),
    q('react-2', 'Why does a list rendered with `map` need a `key` on each item?', ['For styling', 'So React can tell which items were added, removed or moved', 'To make the list sortable', 'To prevent re-renders entirely'], 1, 'Keys give items a stable identity between renders so React can update the right ones.'),
    q('react-3', 'What is wrong with calling `setCount(count + 1)` twice in one event handler to add 2?', ['Nothing; it adds 2', 'Both calls read the same `count`, so it adds 1', 'It throws an error', 'It adds 4'], 1, 'Both calls use the value from the current render. Use the updater form `setCount(c => c + 1)` to build on the latest value.'),
    q('react-4', 'When does the function passed to `useEffect(fn, [])` run?', ['On every render', 'After the first render only', 'Before the first render', 'Never'], 1, 'With an empty dependency array the effect runs after the component mounts, and its cleanup runs on unmount.'),
    q('react-5', 'How should state held in an array be updated?', ['By calling `push` on it', 'By creating a new array and setting state to it', 'By assigning to an index', 'By reloading the component'], 1, 'State must not be mutated in place. A new array lets React detect the change.'),
    q('react-6', 'What are props?', ['Private data a component manages itself', 'Inputs passed to a component by its parent', 'Global variables', 'CSS classes'], 1, 'Props are passed from parent to child and are read-only inside the child.'),
    q('react-7', 'Where may hooks such as `useState` be called?', ['Anywhere, including inside conditions', 'At the top level of a component or custom hook', 'Only inside event handlers', 'Only in class components'], 1, 'Hooks must be called in the same order on every render, so not inside conditions, loops or nested functions.')
  ],
  'Node.js': [
    q('node-1', 'What happens to other requests while a Node.js server runs a long synchronous computation?', ['They are handled on other threads automatically', 'They wait, because JavaScript runs on a single thread', 'They are rejected', 'They run faster'], 1, 'Application JavaScript runs on one thread. Blocking it delays every other request.'),
    q('node-2', 'What is `package-lock.json` (or another lockfile) for?', ['Listing only production dependencies', 'Recording the exact versions installed so installs are repeatable', 'Storing environment variables', 'Compiling the project'], 1, 'A lockfile pins the full dependency tree so every install resolves to the same versions.'),
    q('node-3', 'How does a program read an environment variable named PORT in Node.js?', ['`env.PORT`', '`process.env.PORT`', '`window.PORT`', '`require("PORT")`'], 1, 'Environment variables are available on `process.env`.'),
    q('node-4', 'What does `await` do inside an async function?', ['Blocks the whole process until the promise settles', 'Pauses that function until the promise settles, letting other work run', 'Runs the promise on another CPU core', 'Converts a callback to a promise'], 1, '`await` suspends only the current async function; the event loop keeps processing other work.'),
    q('node-5', 'In an Express application, what is middleware?', ['A database driver', 'A function that receives the request and response and can pass control on', 'A template engine', 'A test runner'], 1, 'Middleware functions run in order for a request and call `next` to continue the chain.'),
    q('node-6', 'What happens if a rejected promise is never handled?', ['Nothing', 'An unhandled rejection is raised, which by default ends the process in current Node.js versions', 'It is retried automatically', 'It becomes a resolved promise'], 1, 'Unhandled rejections are errors. Since Node.js 15 the default behaviour is to terminate the process.'),
    q('node-7', 'Which is true of `require` and `import` in Node.js?', ['They are the same syntax', '`require` is CommonJS; `import` is ES modules', '`import` only works in browsers', '`require` is asynchronous'], 1, 'Node.js supports both module systems; which applies depends on the file extension and package settings.')
  ],
  Python: [
    q('py-1', 'Which of these Python types is immutable?', ['list', 'dict', 'tuple', 'set'], 2, 'Tuples cannot be changed after creation; lists, dicts and sets can.'),
    q('py-2', 'What does `[x * 2 for x in range(3)]` produce?', ['[0, 1, 2]', '[0, 2, 4]', '[2, 4, 6]', '[1, 2, 3]'], 1, '`range(3)` yields 0, 1, 2 and each is doubled.'),
    q('py-3', 'What is the usual cost of testing membership with `in` for a set, compared with a list?', ['The same for both', 'About constant time for a set; proportional to length for a list', 'Slower for a set', 'It depends on the Python version only'], 1, 'Sets are hash-based, so membership tests do not scan every element.'),
    q('py-4', 'What happens with a mutable default argument such as `def f(items=[])`?', ['A new list is created on every call', 'The same list is shared between calls', 'It is a syntax error', 'The list is copied automatically'], 1, 'Default values are evaluated once, when the function is defined, so the list persists between calls.'),
    q('py-5', 'What does `with open("f.txt") as fh:` guarantee?', ['The file is read into memory', 'The file is closed when the block ends, even after an error', 'The file is locked', 'The file is created if missing'], 1, 'The context manager closes the file on leaving the block.'),
    q('py-6', 'What does `a is b` test?', ['That the values are equal', 'That both names refer to the same object', 'That both are the same type', 'That neither is None'], 1, '`is` compares identity; `==` compares value.'),
    q('py-7', 'What does a virtual environment provide?', ['Faster execution', 'An isolated set of installed packages for a project', 'A different Python syntax', 'Automatic testing'], 1, 'It keeps a project\'s dependencies separate from other projects and from the system installation.')
  ],
  SQL: [
    q('sql-1', 'Which rows does a LEFT JOIN return?', ['Only rows that match in both tables', 'Every row of the left table, with NULLs where the right table has no match', 'Every row of the right table only', 'Every combination of rows'], 1, 'A LEFT JOIN keeps all rows from the left table and fills unmatched right-side columns with NULL.'),
    q('sql-2', 'What is the difference between WHERE and HAVING?', ['There is none', 'WHERE filters rows before grouping; HAVING filters groups after aggregation', 'HAVING runs first', 'WHERE only works with numbers'], 1, 'WHERE applies to individual rows; HAVING applies to the results of GROUP BY.'),
    q('sql-3', 'What does a primary key guarantee?', ['Rows are stored in insertion order', 'Each row has a unique, non-NULL identifier', 'The table cannot be changed', 'Queries on the table are always fast'], 1, 'A primary key is unique and cannot be NULL.'),
    q('sql-4', 'How does an index usually affect a table?', ['Faster reads on the indexed columns, some extra cost on writes', 'Faster writes, slower reads', 'No effect on speed', 'It removes duplicate rows'], 0, 'An index speeds up lookups but must be maintained on every insert, update and delete.'),
    q('sql-5', 'What does `SELECT COUNT(*) FROM orders` return?', ['The sum of all order values', 'The number of rows in the table', 'The number of columns', 'The largest order id'], 1, '`COUNT(*)` counts rows.'),
    q('sql-6', 'How should a value supplied by a user be placed in a query?', ['Concatenated into the SQL string', 'Passed as a bound parameter', 'Wrapped in quotes by hand', 'Converted to upper case first'], 1, 'Bound parameters keep data separate from the query text, which prevents SQL injection.'),
    q('sql-7', 'What does a transaction provide?', ['A backup of the database', 'A group of statements that either all take effect or none do', 'A faster query plan', 'Automatic indexing'], 1, 'A transaction is atomic: it commits as a whole or is rolled back as a whole.')
  ],
  Git: [
    q('git-1', 'What does `git commit` do?', ['Uploads changes to the remote', 'Records the staged changes in the local repository', 'Discards local changes', 'Creates a branch'], 1, 'A commit is recorded locally. `git push` sends commits to a remote.'),
    q('git-2', 'What is the difference between `git fetch` and `git pull`?', ['They are identical', '`fetch` downloads remote changes; `pull` also integrates them into the current branch', '`pull` only downloads', '`fetch` deletes local changes'], 1, '`pull` is a fetch followed by a merge or rebase.'),
    q('git-3', 'What does a merge conflict mean?', ['The repository is corrupted', 'Two branches changed the same lines and Git needs a person to choose', 'The remote is unreachable', 'A commit is missing'], 1, 'Git stops and marks the conflicting regions so they can be resolved by hand.'),
    q('git-4', 'What is `.gitignore` for?', ['Listing collaborators', 'Naming files Git should not track', 'Storing credentials safely', 'Configuring branches'], 1, 'Patterns in `.gitignore` keep matching untracked files out of the repository.'),
    q('git-5', 'Why is rewriting history on a shared branch (for example with a forced push) risky?', ['It is slow', 'Other people\'s work based on the old history no longer lines up', 'It deletes the remote', 'It disables branching'], 1, 'Collaborators who have the old commits will diverge from the rewritten branch.'),
    q('git-6', 'What does `git status` show?', ['The commit history', 'Which files are staged, modified or untracked', 'The remote URL only', 'The size of the repository'], 1, 'It summarises the working tree and the staging area.'),
    q('git-7', 'What is a branch in Git?', ['A copy of the whole repository on disk', 'A movable pointer to a commit', 'A remote server', 'A tag that cannot move'], 1, 'A branch is a lightweight reference that advances as commits are added.')
  ],
  Docker: [
    q('docker-1', 'What is the difference between an image and a container?', ['They are the same thing', 'An image is a read-only template; a container is a running instance of one', 'A container is stored in a registry; an image is not', 'An image is a virtual machine'], 1, 'Containers are created from images and add a writable layer and a process.'),
    q('docker-2', 'What happens to data written inside a container\'s own filesystem when the container is removed?', ['It is kept automatically', 'It is lost unless it was written to a volume or bind mount', 'It is copied to the image', 'It is uploaded to the registry'], 1, 'The writable layer is deleted with the container. Volumes exist to keep data.'),
    q('docker-3', 'In a Dockerfile, what does each instruction such as RUN or COPY create?', ['A new container', 'A layer that can be cached', 'A network', 'A volume'], 1, 'Layers are cached, so unchanged steps are reused on the next build.'),
    q('docker-4', 'Why should secrets not be written into an image with ENV or COPY?', ['It makes the image larger', 'Anyone who can pull the image can read them', 'Docker forbids it', 'They expire'], 1, 'Image layers and their history are readable by anyone with access to the image.'),
    q('docker-5', 'What does publishing a port with `-p 8080:80` do?', ['Maps port 8080 in the container to port 80 on the host', 'Maps port 8080 on the host to port 80 in the container', 'Opens both ports on the host', 'Blocks port 80'], 1, 'The format is host port, then container port.'),
    q('docker-6', 'What is Docker Compose used for?', ['Building a single image faster', 'Defining and running several containers together from one file', 'Scanning images for vulnerabilities', 'Replacing Dockerfiles'], 1, 'A Compose file describes services, networks and volumes that are started together.'),
    q('docker-7', 'Why run a container process as a non-root user?', ['It starts faster', 'It limits what the process can do if it is compromised', 'It is required by Docker', 'It reduces image size'], 1, 'Dropping root reduces the damage a compromised process can cause.')
  ]
};

/** Number of questions in one attempt. */
export const ASSESSMENT_QUESTION_COUNT = 5;
/** Correct answers needed to pass (4 of 5) unless a skill sets its own. */
export const ASSESSMENT_PASS_MARK = 4;

export interface AssessmentCriteria {
  questionCount: number;
  passMark: number;
}

/**
 * Passing criteria are set per skill. Every skill currently uses the default; a skill whose bank
 * warrants a different length or pass mark is listed here.
 */
export const ASSESSMENT_CRITERIA: Record<string, Partial<AssessmentCriteria>> = {};

export const criteriaFor = (skill: string): AssessmentCriteria => ({
  questionCount: ASSESSMENT_QUESTION_COUNT,
  passMark: ASSESSMENT_PASS_MARK,
  ...ASSESSMENT_CRITERIA[skill]
});

/** Changes whenever a question, option, answer or the pass rule changes. */
export const ASSESSMENT_BANK_VERSION = crypto
  .createHash('sha256')
  .update(JSON.stringify([SKILL_ASSESSMENTS, ASSESSMENT_QUESTION_COUNT, ASSESSMENT_PASS_MARK, ASSESSMENT_CRITERIA]))
  .digest('hex')
  .slice(0, 12);
