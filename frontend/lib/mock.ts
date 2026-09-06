export const categories = [
  { slug: 'javascript',   name: 'JavaScript',       count: 12, color: '#F7DF1E', hint: 'closures, async, this' },
  { slug: 'python',       name: 'Python',           count: 9,  color: '#4B8BBE', hint: 'gil, decorators, itertools' },
  { slug: 'networking',   name: 'Networking',       count: 7,  color: '#7FE7CE', hint: 'tcp/ip, dns, tls' },
  { slug: 'dbms',         name: 'DBMS',             count: 14, color: '#A78BFA', hint: 'indexing, joins, acid' },
  { slug: 'os',           name: 'Operating Systems',count: 8,  color: '#F5C775', hint: 'threads, memory, i/o' },
  { slug: 'dsa',          name: 'Data Structures',  count: 22, color: '#FF9E7A', hint: 'trees, graphs, dp' },
  { slug: 'cloud',        name: 'Cloud & AWS',      count: 11, color: '#5EC2FF', hint: 's3, iam, lambda' },
  { slug: 'security',     name: 'Cybersecurity',    count: 6,  color: '#FF6B9B', hint: 'auth, xss, csrf' },
  { slug: 'system-design',name: 'System Design',    count: 5,  color: '#B4F5A2', hint: 'scale, cache, queue' },
  { slug: 'testing',      name: 'E2E Testing',      count: 4,  color: '#C7B8FF', hint: 'playwright, cypress' },
];

export const quizzes = [
  { id: 'q1', title: 'DBMS: Indexing',        cat: 'DBMS',        level: 'Advanced',    q: 12, min: 15, desc: 'B-trees, hash indexes, covering indexes and query plans.' },
  { id: 'q2', title: 'DBMS: Fundamentals',    cat: 'DBMS',        level: 'Beginner',    q: 20, min: 20, desc: 'SQL, joins, transactions, normalization and ACID.' },
  { id: 'q3', title: 'JavaScript Core',       cat: 'JavaScript',  level: 'Beginner',    q: 18, min: 18, desc: 'Types, coercion, event loop, prototypes.' },
  { id: 'q4', title: 'Async JavaScript',      cat: 'JavaScript',  level: 'Advanced',    q: 14, min: 20, desc: 'Promises, microtasks, generators, async iterators.' },
  { id: 'q5', title: 'Python Fluency',        cat: 'Python',      level: 'Intermediate',q: 16, min: 16, desc: 'Comprehensions, dunder methods, typing, dataclasses.' },
  { id: 'q6', title: 'HTTP & The Wire',       cat: 'Networking',  level: 'Beginner',    q: 10, min: 12, desc: 'Methods, status, headers, HTTP/2, HTTP/3.' },
  { id: 'q7', title: 'System Design: Feeds',  cat: 'System Design', level: 'Advanced',  q:  8, min: 25, desc: 'Fanout on write vs read, caching, ranking.' },
  { id: 'q8', title: 'Playwright in Practice',cat: 'E2E Testing', level: 'Intermediate',q: 15, min: 18, desc: 'Selectors, waits, network interception, fixtures.' },
  { id: 'q9', title: 'AWS: IAM Deep Dive',    cat: 'Cloud & AWS', level: 'Advanced',    q: 12, min: 20, desc: 'Roles, policies, STS, boundaries.' },
];

// weeklyPts: points earned in the last 7 days (independent ranking from all-time pts).
// categoryPts: points earned per topic track, keyed by category slug — used to build
// the "By category" leaderboard view.
export const leaders = [
  { rank: 1, name: 'Kaia Moreno',      initials: 'KM', pts: 4820, streak: 42, country: 'ES', weeklyPts: 410, categoryPts: { javascript: 620, python: 340, dbms: 980, dsa: 1240, cloud: 210, networking: 180, security: 90,  'system-design': 760, os: 250, testing: 150 } as Record<string, number> },
  { rank: 2, name: 'Govind Iyer',      initials: 'GI', pts: 4610, streak: 31, country: 'IN', weeklyPts: 560, categoryPts: { javascript: 1120, python: 260, dbms: 640, dsa: 480,  cloud: 340, networking: 210, security: 120, 'system-design': 640, os: 300, testing: 500 } as Record<string, number> },
  { rank: 3, name: 'Ramesh Patel',     initials: 'RP', pts: 4390, streak: 27, country: 'IN', weeklyPts: 180, categoryPts: { javascript: 380, python: 210, dbms: 1340, dsa: 560,  cloud: 260, networking: 890, security: 140, 'system-design': 310, os: 200, testing: 100 } as Record<string, number> },
  { rank: 4, name: 'Anouk Laurent',    initials: 'AL', pts: 4110, streak: 22, country: 'FR', weeklyPts: 620, categoryPts: { javascript: 260, python: 1180, dbms: 420, dsa: 640,  cloud: 180, networking: 160, security: 760, 'system-design': 210, os: 190, testing: 110 } as Record<string, number> },
  { rank: 5, name: 'Yuki Tanaka',      initials: 'YT', pts: 3980, streak: 19, country: 'JP', weeklyPts: 340, categoryPts: { javascript: 210, python: 190, dbms: 260, dsa: 1420, cloud: 130, networking: 210, security: 180, 'system-design': 980, os: 160, testing: 240 } as Record<string, number> },
  { rank: 6, name: 'Platform Admin',   initials: 'PA', pts: 3730, streak: 15, country: 'US', weeklyPts: 90,  categoryPts: { javascript: 310, python: 260, dbms: 340, dsa: 280,  cloud: 1160,networking: 240, security: 210, 'system-design': 320, os: 280, testing: 330 } as Record<string, number> },
  { rank: 7, name: 'Nadia Khoury',     initials: 'NK', pts: 3520, streak: 12, country: 'LB', weeklyPts: 260, categoryPts: { javascript: 190, python: 220, dbms: 210, dsa: 260,  cloud: 210, networking: 1240,security: 160, 'system-design': 260, os: 620, testing: 150 } as Record<string, number> },
  { rank: 8, name: 'Milo Andersson',   initials: 'MA', pts: 3340, streak: 11, country: 'SE', weeklyPts: 710, categoryPts: { javascript: 260, python: 210, dbms: 190, dsa: 240,  cloud: 260, networking: 180, security: 1080,'system-design': 210, os: 260, testing: 460 } as Record<string, number> },
  { rank: 9, name: 'Priya Rao',        initials: 'PR', pts: 3210, streak: 9,  country: 'IN', weeklyPts: 130, categoryPts: { javascript: 210, python: 260, dbms: 190, dsa: 210,  cloud: 240, networking: 190, security: 160, 'system-design': 210, os: 210, testing: 1340 } as Record<string, number> },
  { rank:10, name: 'E2E Player',       initials: 'EP', pts: 3080, streak: 8,  country: 'DE', weeklyPts: 200, categoryPts: { javascript: 160, python: 190, dbms: 210, dsa: 190,  cloud: 180, networking: 210, security: 190, 'system-design': 190, os: 190, testing: 1180 } as Record<string, number> },
];

export const codeSnippets = [
  { lang: 'JavaScript', q: 'typeof NaN === ?',                  a: "'number'" },
  { lang: 'Python',     q: 'bool([]) is ?',                     a: 'False' },
  { lang: 'SQL',        q: 'NULL = NULL returns ?',             a: 'UNKNOWN' },
  { lang: 'Networking', q: "HTTP status for I'm a teapot?",    a: '418' },
  { lang: 'DBMS',       q: 'Best index for LIKE "a%" is ?',     a: 'B-tree' },
  { lang: 'System',     q: 'CAP: choose ?',                     a: 'AP vs CP' },
];

export const stats = { categories: 10, questions: 128, live: 14, players: 3120 };

export const testimonials = [
  { name: 'Iris Bergman',  role: 'Senior FE, Stripe',  quote: 'It replaced my LeetCode-for-fundamentals ritual. The prompts feel written by an engineer, not a bot.' },
  { name: 'Dev Choudhary', role: 'SRE, Datadog',       quote: 'Networking and DBMS decks are savage. Cleared two on-sites this quarter.' },
  { name: 'Lena Köhler',   role: 'Staff, Klarna',      quote: 'Beautiful, fast, and the mono type in the code cards is chef’s kiss.' },
];

export const usersList = [
  { name: 'Platform Admin', email: 'guptagovind516@gmail.com', role: 'Admin',   joined: '2 mo ago', attempts: 24, streak: 15 },
  { name: 'Kaia Moreno',    email: 'kaia@company.io',          role: 'Player',  joined: '3 mo ago', attempts: 96, streak: 42 },
  { name: 'Govind Iyer',    email: 'govind@company.io',        role: 'Player',  joined: '3 mo ago', attempts: 82, streak: 31 },
  { name: 'Ramesh Patel',   email: 'ramesh@company.io',        role: 'Player',  joined: '2 mo ago', attempts: 74, streak: 27 },
  { name: 'Anouk Laurent',  email: 'anouk@company.io',         role: 'Player',  joined: '1 mo ago', attempts: 60, streak: 22 },
  { name: 'Yuki Tanaka',    email: 'yuki@company.io',          role: 'Editor',  joined: '3 wk ago', attempts: 44, streak: 19 },
];

/* Question pool for the custom Build-a-quiz flow ---------------------- */
// Small hand-authored pool per category/difficulty. In a real backend this
// would come from the same question bank the admin CMS manages — this is a
// frontend-only stand-in so /build has real content to sample from.
export const questionPool: Record<string, { prompt: string; options: string[]; answer: number; difficulty: string }[]> = {
  javascript: [
    { prompt: 'What does `typeof null` evaluate to?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], answer: 2, difficulty: 'Beginner' },
    { prompt: 'Which method creates a new array without mutating the original?', options: ['push()', 'splice()', 'map()', 'sort()'], answer: 2, difficulty: 'Beginner' },
    { prompt: 'What is a closure?', options: ['A loop that never ends', 'A function bundled with its lexical scope', 'A way to close a file handle', 'A CSS selector'], answer: 1, difficulty: 'Intermediate' },
    { prompt: 'What does `Promise.allSettled` return once resolved?', options: ['The first settled promise only', 'An array of {status, value|reason} for every promise', 'A single merged value', 'Nothing — it throws'], answer: 1, difficulty: 'Advanced' },
    { prompt: 'In the event loop, microtasks run relative to macrotasks how?', options: ['After all macrotasks', 'Before the next macrotask, after the current task', 'Randomly interleaved', 'Only on page unload'], answer: 1, difficulty: 'Advanced' },
  ],
  python: [
    { prompt: 'What does `len([1,2,3])` return?', options: ['2', '3', '4', 'Error'], answer: 1, difficulty: 'Beginner' },
    { prompt: 'Which keyword defines a function in Python?', options: ['func', 'def', 'function', 'lambda'], answer: 1, difficulty: 'Beginner' },
    { prompt: 'What does a list comprehension `[x*2 for x in range(3)]` produce?', options: ['[0,1,2]', '[0,2,4]', '[2,4,6]', 'Error'], answer: 1, difficulty: 'Intermediate' },
    { prompt: 'What is the GIL?', options: ['A garbage collector', 'A lock allowing only one thread to execute Python bytecode at a time', 'A type hint system', 'A package manager'], answer: 1, difficulty: 'Advanced' },
    { prompt: 'What does `@dataclass` primarily generate for you?', options: ['A REST API', '__init__, __repr__, __eq__ boilerplate', 'A database schema', 'Type coercion'], answer: 1, difficulty: 'Intermediate' },
  ],
  dbms: [
    { prompt: 'What does ACID stand for in transactions?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Data', 'Aggregate, Cache, Index, Delete', 'None of these'], answer: 0, difficulty: 'Beginner' },
    { prompt: 'What is the primary purpose of an index?', options: ['Encrypt data', 'Speed up read queries', 'Enforce foreign keys', 'Compress storage'], answer: 1, difficulty: 'Beginner' },
    { prompt: 'What is a covering index?', options: ['An index that covers all tables', 'An index containing every column a query needs, avoiding a table lookup', 'A backup index', 'An index on a view'], answer: 1, difficulty: 'Intermediate' },
    { prompt: 'What isolation level prevents non-repeatable reads but allows phantom reads?', options: ['Read uncommitted', 'Read committed', 'Repeatable read', 'Serializable'], answer: 2, difficulty: 'Advanced' },
    { prompt: 'Why can adding an index slow down writes?', options: ['It locks the whole table permanently', 'Every write must also update the index structure', 'Indexes disable transactions', 'It does not slow writes'], answer: 1, difficulty: 'Intermediate' },
  ],
  networking: [
    { prompt: 'What port does HTTPS use by default?', options: ['80', '21', '443', '8080'], answer: 2, difficulty: 'Beginner' },
    { prompt: 'What does DNS resolve?', options: ['IP addresses to domain names', 'Domain names to IP addresses', 'MAC addresses to ports', 'None of these'], answer: 1, difficulty: 'Beginner' },
    { prompt: 'What is the main advantage of HTTP/2 over HTTP/1.1?', options: ['Plain text headers', 'Multiplexed streams over one connection', 'No encryption needed', 'UDP transport'], answer: 1, difficulty: 'Intermediate' },
    { prompt: 'In TCP, what does the three-way handshake establish?', options: ['Encryption keys', 'A reliable, ordered connection', 'DNS resolution', 'Load balancing'], answer: 1, difficulty: 'Intermediate' },
    { prompt: 'What problem does TLS 1.3 0-RTT introduce a tradeoff around?', options: ['Slower handshakes', 'Replay attacks on early data', 'No encryption at all', 'IPv6 compatibility'], answer: 1, difficulty: 'Advanced' },
  ],
  'system-design': [
    { prompt: 'What does horizontal scaling mean?', options: ['Adding more RAM to one server', 'Adding more servers', 'Upgrading the CPU', 'Reducing traffic'], answer: 1, difficulty: 'Beginner' },
    { prompt: 'What is a cache-aside pattern?', options: ['The app checks the cache first, falls back to the DB on a miss', 'The DB writes directly to cache', 'Caching is disabled', 'A cache with no eviction'], answer: 0, difficulty: 'Intermediate' },
    { prompt: 'Fanout-on-write vs fanout-on-read trades off what?', options: ['Nothing, they are identical', 'Write cost vs read cost for feed generation', 'Security vs speed', 'Storage vs CPU only'], answer: 1, difficulty: 'Advanced' },
    { prompt: 'What does CAP theorem say you must choose between under a partition?', options: ['Cost vs Availability', 'Consistency vs Availability', 'Caching vs Persistence', 'Concurrency vs Atomicity'], answer: 1, difficulty: 'Advanced' },
  ],
  dsa: [
    { prompt: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], answer: 1, difficulty: 'Beginner' },
    { prompt: 'Which data structure uses LIFO ordering?', options: ['Queue', 'Stack', 'Heap', 'Graph'], answer: 1, difficulty: 'Beginner' },
    { prompt: 'What is the average time complexity of hash map lookup?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'], answer: 2, difficulty: 'Intermediate' },
    { prompt: 'Dynamic programming primarily optimizes problems with which property?', options: ['Random ordering', 'Overlapping subproblems and optimal substructure', 'No recursion allowed', 'Only sorting problems'], answer: 1, difficulty: 'Advanced' },
  ],
};

export const buildableCategories = Object.keys(questionPool);

export const playQuiz = {
  id: 'p1',
  title: 'Python Basics',
  level: 'Beginner',
  cat: 'Python',
  totalMinutes: 14,
  questions: [
    { id: 1, prompt: 'Which built-in type stores key-value pairs?', options: ['set','list','tuple','dict'], answer: 3 },
    { id: 2, prompt: 'What does len("hello") return?', options: ['4','5','6','undefined'], answer: 1 },
    { id: 3, prompt: 'Which keyword defines a function?', options: ['func','def','function','lambda'], answer: 1 },
    { id: 4, prompt: 'What is the output of  bool([]) ?', options: ['True','False','None','Error'], answer: 1 },
    { id: 5, prompt: 'Which sorts a list in place?', options: ['sorted()','list.sort()','sort()','arrange()'], answer: 1 },
    { id: 6, prompt: 'Which is an immutable type?', options: ['list','dict','set','tuple'], answer: 3 },
    { id: 7, prompt: 'Slice a[1:] returns?', options: ['first item','all except first','all except last','copy'], answer: 1 },
    { id: 8, prompt: 'a is b compares?', options: ['values','identities','types','lengths'], answer: 1 },
    { id: 9, prompt: 'Which is used for docstrings?', options: ['//','#','"""..."""','/* */'], answer: 2 },
    { id:10, prompt: 'range(3) yields?', options: ['0,1,2,3','1,2,3','0,1,2','2,3,4'], answer: 2 },
    { id:11, prompt: '3 ** 2 evaluates to?', options: ['6','9','5','1'], answer: 1 },
    { id:12, prompt: 'What returns the class of x?', options: ['classof(x)','type(x)','x.class','instanceof(x)'], answer: 1 },
    { id:13, prompt: 'Which reads a file line by line?', options: ['read()','readline()','readlines()','open()'], answer: 1 },
    { id:14, prompt: 'Which is NOT truthy?', options: ['"0"','[]','1','"False"'], answer: 1 },
  ],
};
