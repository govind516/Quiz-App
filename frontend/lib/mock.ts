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

export const leaders = [
  { rank: 1, name: 'Kaia Moreno',      initials: 'KM', pts: 4820, streak: 42, country: 'ES' },
  { rank: 2, name: 'Govind Iyer',      initials: 'GI', pts: 4610, streak: 31, country: 'IN' },
  { rank: 3, name: 'Ramesh Patel',     initials: 'RP', pts: 4390, streak: 27, country: 'IN' },
  { rank: 4, name: 'Anouk Laurent',    initials: 'AL', pts: 4110, streak: 22, country: 'FR' },
  { rank: 5, name: 'Yuki Tanaka',      initials: 'YT', pts: 3980, streak: 19, country: 'JP' },
  { rank: 6, name: 'Platform Admin',   initials: 'PA', pts: 3730, streak: 15, country: 'US' },
  { rank: 7, name: 'Nadia Khoury',     initials: 'NK', pts: 3520, streak: 12, country: 'LB' },
  { rank: 8, name: 'Milo Andersson',   initials: 'MA', pts: 3340, streak: 11, country: 'SE' },
  { rank: 9, name: 'Priya Rao',        initials: 'PR', pts: 3210, streak: 9,  country: 'IN' },
  { rank:10, name: 'E2E Player',       initials: 'EP', pts: 3080, streak: 8,  country: 'DE' },
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

export const adminStats = {
  totalLearners: 6,
  attemptsToday: 1,
  avgScore: 33,
  pendingAI: 1,
};

export const attemptsWeek = [
  { day: 'SAT', val: 0 }, { day: 'SUN', val: 0 }, { day: 'MON', val: 0 },
  { day: 'TUE', val: 12 }, { day: 'WED', val: 27 }, { day: 'THU', val: 0 }, { day: 'FRI', val: 0 },
];

export const avgScoreTrend = [
  { day: 'SAT', val: 62 }, { day: 'SUN', val: 55 },
  { day: 'TUE', val: 70 }, { day: 'WED', val: 22 }, { day: 'FRI', val: 4 },
];

export const quizCompletion = { started: 55, finished: 55, abandoned: 0 };

export const topCategoriesWeek = [
  { name: 'E2E Testing', count: 25 },
  { name: 'JavaScript',  count: 2 },
  { name: 'Python',      count: 2 },
  { name: 'DBMS',        count: 1 },
];

export const adminQuizzes = [
  { id: 'aq1', title: 'JavaScript: SmokeTest — BEGINNER', cat: 'JavaScript', status: 'draft', questions: 0 },
  { id: 'aq2', title: 'DBMS: Indexing — ADVANCED',        cat: 'DBMS',       status: 'live',  questions: 1 },
  { id: 'aq3', title: 'Python: Basics — BEGINNER',        cat: 'Python',     status: 'live',  questions: 14 },
  { id: 'aq4', title: 'Networking: TCP/IP',               cat: 'Networking', status: 'draft', questions: 6 },
];

export const questionBank = [
  {
    id: 'qb1',
    status: 'approved',
    type: 'MCQ',
    points: 1,
    prompt: 'What is the primary purpose of creating an index on a database table column?',
    choices: [
      { text: 'To encrypt sensitive data stored in that column', correct: false },
      { text: 'To speed up the retrieval of data during search queries', correct: true },
      { text: 'To automatically duplicate data for disaster recovery', correct: false },
      { text: 'To prevent unauthorized users from modifying the column', correct: false },
    ],
  },
  {
    id: 'qb2',
    status: 'approved',
    type: 'MCQ',
    points: 1,
    prompt: 'Which of the following is a main trade-off when adding indexes to a database table?',
    choices: [
      { text: 'Data retrieval (SELECT) operations become slower', correct: false },
      { text: 'Write operations (INSERT, UPDATE, DELETE) become slower', correct: true },
      { text: 'The table can no longer be referenced by foreign keys', correct: false },
      { text: 'The database engine automatically disables constraints', correct: false },
    ],
  },
  {
    id: 'qb3',
    status: 'approved',
    type: 'MCQ',
    points: 1,
    prompt: 'What is the primary purpose of creating an index on a database table column?',
    choices: [
      { text: 'To encrypt sensitive data stored in the column at rest', correct: false },
      { text: 'To speed up the retrieval of data from the table', correct: true },
      { text: 'To automatically duplicate data for disaster recovery', correct: false },
      { text: 'To compress the table size and save disk space', correct: false },
    ],
  },
];

export const reviewQueue = [
  {
    id: 'rv1',
    topic: 'JavaScript closures and event loop',
    cat: 'JavaScript',
    difficulty: 'Intermediate',
    prompt: 'What will the following code log to the console?  for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))',
    choices: [
      { text: '0 1 2', correct: false },
      { text: '3 3 3', correct: true },
      { text: 'undefined undefined undefined', correct: false },
      { text: 'TypeError', correct: false },
    ],
    generatedBy: 'Gemini Flash 6.0',
    submittedAt: '2m ago',
  },
];

export const usersList = [
  { name: 'Platform Admin', email: 'guptagovind516@gmail.com', role: 'Admin',   joined: '2 mo ago', attempts: 24, streak: 15 },
  { name: 'Kaia Moreno',    email: 'kaia@company.io',          role: 'Player',  joined: '3 mo ago', attempts: 96, streak: 42 },
  { name: 'Govind Iyer',    email: 'govind@company.io',        role: 'Player',  joined: '3 mo ago', attempts: 82, streak: 31 },
  { name: 'Ramesh Patel',   email: 'ramesh@company.io',        role: 'Player',  joined: '2 mo ago', attempts: 74, streak: 27 },
  { name: 'Anouk Laurent',  email: 'anouk@company.io',         role: 'Player',  joined: '1 mo ago', attempts: 60, streak: 22 },
  { name: 'Yuki Tanaka',    email: 'yuki@company.io',          role: 'Editor',  joined: '3 wk ago', attempts: 44, streak: 19 },
];

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
