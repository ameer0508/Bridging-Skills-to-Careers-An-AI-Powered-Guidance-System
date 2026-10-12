/**
 * Deterministic interview question bank, used whenever AI question generation is unavailable.
 *
 * Templates may contain placeholders that are filled only from facts on record for the user:
 *   {role} {company} {skill} {gap} {experience} {project} {jobSkill}
 * A template that needs a fact the user does not have is simply not eligible, so no skill,
 * employer or project is ever invented.
 */

export type InterviewCategory = 'technical' | 'behavioral' | 'project' | 'resume' | 'career';
export type InterviewDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionNeed = 'skill' | 'gap' | 'experience' | 'project' | 'jobSkill' | 'company';

export type RoleFamily =
  | 'frontend'
  | 'backend'
  | 'data'
  | 'ml'
  | 'devops'
  | 'security'
  | 'design'
  | 'mobile'
  | 'product'
  | 'software';

export interface BankQuestion {
  id: string;
  category: InterviewCategory;
  difficulty: InterviewDifficulty;
  text: string;
  concepts: string[];
  /** Facts that must be available to fill the template. */
  needs?: QuestionNeed[];
  /** Only for these role families (omit for any role). */
  families?: RoleFamily[];
  /** Only when the user (or the job posting) lists one of these exact skills. */
  skills?: string[];
}

/** Maps a free-text role title to the families whose questions suit it. */
export function roleFamilies(roleTitle: string): RoleFamily[] {
  const t = roleTitle.toLowerCase();
  const families: RoleFamily[] = [];
  const add = (family: RoleFamily, pattern: RegExp) => {
    if (pattern.test(t)) families.push(family);
  };
  add('frontend', /front[\s-]?end|ui engineer|web developer|full[\s-]?stack|react|angular|vue/);
  add('backend', /back[\s-]?end|full[\s-]?stack|api|server|software engineer|java|node|python developer/);
  add('ml', /machine learning|\bml\b|\bai\b|deep learning|nlp|computer vision/);
  add('data', /data (analyst|scientist|engineer)|analytics|business intelligence|\bbi\b|business analyst/);
  add('devops', /devops|cloud|site reliability|\bsre\b|platform|infrastructure/);
  add('security', /security|cyber|penetration|soc analyst/);
  add('design', /design|\bux\b|\bui\/ux\b/);
  add('mobile', /mobile|android|ios|flutter|react native/);
  add('product', /product (manager|owner)|business analyst|project manager|scrum/);
  if (families.length === 0 || /software|developer|engineer|programmer/.test(t)) families.push('software');
  return [...new Set(families)];
}

const q = (
  id: string,
  category: InterviewCategory,
  difficulty: InterviewDifficulty,
  text: string,
  concepts: string[],
  extra: Pick<BankQuestion, 'needs' | 'families' | 'skills'> = {}
): BankQuestion => ({ id, category, difficulty, text, concepts, ...extra });

export const INTERVIEW_QUESTION_BANK: BankQuestion[] = [
  // ---- Technical: grounded in a skill on the resume --------------------------------------
  q('tech_skill_tradeoff', 'technical', 'medium', 'You list {skill} on your resume. Describe a situation where {skill} was the wrong tool for a task, and what you would use instead.', ['Trade-offs', 'Alternatives', 'Reasoning from requirements'], { needs: ['skill'] }),
  q('tech_skill_debug', 'technical', 'medium', 'Walk me through how you would debug a problem in a {skill} codebase that only appears in production.', ['Reproduction', 'Logging and observability', 'Isolating the cause', 'Verifying the fix'], { needs: ['skill'] }),
  q('tech_skill_explain', 'technical', 'easy', 'Explain a core concept of {skill} to a teammate who has never used it, including one common mistake beginners make.', ['Clear explanation', 'Core concept', 'Common pitfall'], { needs: ['skill'] }),
  q('tech_skill_quality', 'technical', 'medium', 'How do you test and review work written with {skill} so that defects are caught before release?', ['Testing strategy', 'Code review', 'Automation'], { needs: ['skill'] }),
  q('tech_skill_perf', 'technical', 'hard', 'A feature built with {skill} has become slow as usage grew. How do you find the bottleneck and decide what to change?', ['Measurement before optimisation', 'Profiling', 'Bottleneck analysis', 'Trade-offs'], { needs: ['skill'] }),
  q('tech_skill_recent', 'technical', 'easy', 'What is the most complex thing you have built or solved using {skill}, and what made it difficult?', ['Concrete example', 'Technical difficulty', 'Own contribution'], { needs: ['skill'] }),

  // ---- Technical: grounded in a gap for the target role ---------------------------------------
  q('tech_gap_plan', 'technical', 'medium', '{role} roles commonly expect {gap}, which your resume does not show. How would you become productive with {gap} on a real project?', ['Learning plan', 'Transferable knowledge', 'Practice on real work'], { needs: ['gap'] }),
  q('tech_gap_relate', 'technical', 'medium', 'Without hands-on {gap} experience, how would you reason about a task that needs it? Relate it to something you already know.', ['Transferable concepts', 'Honest limits', 'Asking good questions'], { needs: ['gap'] }),
  q('tech_gap_first_week', 'technical', 'easy', 'You join a team that relies on {gap}. What do you do in your first week to get up to speed without slowing the team down?', ['Onboarding approach', 'Documentation', 'Small first contribution'], { needs: ['gap'] }),

  // ---- Technical: role family -----------------------------------------------------------------------
  q('fam_fe_state', 'technical', 'medium', 'How do you decide where state should live in a web application, and when is a global store justified?', ['Local vs shared state', 'Data flow', 'Complexity trade-offs'], { families: ['frontend'] }),
  q('fam_fe_perf', 'technical', 'hard', 'A page takes six seconds to become interactive on a mid-range phone. How do you investigate and what do you fix first?', ['Measuring load performance', 'Bundle size', 'Rendering cost', 'Prioritisation'], { families: ['frontend', 'mobile'] }),
  q('fam_fe_a11y', 'technical', 'medium', 'How do you make sure an interface you build can be used with a keyboard and a screen reader?', ['Semantic markup', 'Focus management', 'Accessible names', 'Testing'], { families: ['frontend', 'design'] }),
  q('fam_fe_api', 'technical', 'medium', 'How do you handle loading, empty and error states when a screen depends on several API calls?', ['Async states', 'Error handling', 'User feedback'], { families: ['frontend', 'mobile'] }),
  q('fam_be_api', 'technical', 'medium', 'Design an API endpoint that lets a client page through a very large list. What are the trade-offs of the approach you choose?', ['Pagination strategy', 'Consistency', 'Performance'], { families: ['backend'] }),
  q('fam_be_idempotent', 'technical', 'hard', 'A client retries a payment request after a timeout. How do you make sure the user is not charged twice?', ['Idempotency', 'Retries', 'Transactions'], { families: ['backend'] }),
  q('fam_be_schema', 'technical', 'medium', 'How do you change a database schema that a running service depends on without downtime?', ['Backward-compatible migration', 'Rollout order', 'Rollback'], { families: ['backend', 'devops'] }),
  q('fam_be_auth', 'technical', 'medium', 'How would you make sure one user can never read or change another user\'s data through your API?', ['Authorisation checks', 'Ownership scoping', 'Testing access control'], { families: ['backend', 'security'] }),
  q('fam_be_cache', 'technical', 'hard', 'When would you add a cache to a service, and how do you keep cached data from going stale?', ['When caching helps', 'Invalidation', 'Consistency trade-offs'], { families: ['backend'] }),
  q('fam_data_clean', 'technical', 'medium', 'You receive a dataset with missing values and obvious outliers. How do you decide what to do with them before analysis?', ['Understanding the cause', 'Imputation vs removal', 'Documenting assumptions'], { families: ['data', 'ml'] }),
  q('fam_data_metric', 'technical', 'medium', 'A stakeholder asks why a key metric dropped last week. How do you structure the investigation?', ['Defining the metric', 'Segmenting', 'Ruling out data issues', 'Communicating uncertainty'], { families: ['data', 'product'] }),
  q('fam_data_sql', 'technical', 'medium', 'How would you find duplicate records in a large table and decide which copy to keep?', ['Grouping and counting', 'Choosing a key', 'Verifying before deleting'], { families: ['data', 'backend'] }),
  q('fam_data_viz', 'technical', 'easy', 'How do you choose a chart for a result, and what makes a chart misleading?', ['Matching chart to question', 'Scale and baseline', 'Clarity'], { families: ['data'] }),
  q('fam_ml_overfit', 'technical', 'medium', 'Your model scores well in training and poorly on new data. What do you check and what do you try?', ['Overfitting', 'Validation strategy', 'Regularisation', 'Data leakage'], { families: ['ml', 'data'] }),
  q('fam_ml_metric', 'technical', 'medium', 'How do you choose an evaluation metric for a classification problem where one class is rare?', ['Class imbalance', 'Precision and recall', 'Cost of errors'], { families: ['ml', 'data'] }),
  q('fam_ml_prod', 'technical', 'hard', 'What can go wrong after a model is deployed, and how would you notice?', ['Data drift', 'Monitoring', 'Retraining', 'Fallback behaviour'], { families: ['ml'] }),
  q('fam_ops_deploy', 'technical', 'medium', 'Describe how you would release a change so that a bad deploy can be undone quickly.', ['Deployment strategy', 'Rollback', 'Health checks'], { families: ['devops', 'backend'] }),
  q('fam_ops_incident', 'technical', 'hard', 'A service is returning errors and the cause is unknown. What do you do in the first fifteen minutes?', ['Triage', 'Mitigation before root cause', 'Communication', 'Evidence gathering'], { families: ['devops', 'backend', 'security'] }),
  q('fam_ops_iac', 'technical', 'medium', 'Why keep infrastructure configuration in version control, and what problems does it not solve?', ['Reproducibility', 'Review', 'Drift', 'Secrets handling'], { families: ['devops'] }),
  q('fam_ops_monitor', 'technical', 'medium', 'How do you decide what to alert on so that alerts stay useful?', ['Symptoms vs causes', 'Alert fatigue', 'Service objectives'], { families: ['devops'] }),
  q('fam_sec_threat', 'technical', 'medium', 'Pick a web application you know. What are the three risks you would check first, and why those?', ['Threat modelling', 'Prioritising risk', 'Common vulnerability classes'], { families: ['security'] }),
  q('fam_sec_secret', 'technical', 'medium', 'A credential was committed to a repository by mistake. What do you do, in order?', ['Revocation first', 'Assessing exposure', 'Preventing recurrence'], { families: ['security', 'devops'] }),
  q('fam_sec_input', 'technical', 'medium', 'How do you treat data that comes from users or other systems so it cannot be used to attack your application?', ['Validation', 'Output encoding', 'Least privilege'], { families: ['security', 'backend'] }),
  q('fam_design_research', 'technical', 'medium', 'How do you find out whether a design actually works for users, with little time and no budget?', ['Lightweight research', 'Testing with users', 'Acting on findings'], { families: ['design', 'product'] }),
  q('fam_design_handoff', 'technical', 'medium', 'How do you hand a design to engineers so that what is built matches what you intended?', ['Specification', 'Collaboration', 'Edge cases and states'], { families: ['design'] }),
  q('fam_design_critique', 'technical', 'easy', 'Describe a design decision you changed after feedback. What convinced you?', ['Openness to feedback', 'Evidence', 'Iteration'], { families: ['design'] }),
  q('fam_mobile_offline', 'technical', 'hard', 'How would you design a mobile feature that keeps working when the device is offline?', ['Local storage', 'Sync and conflicts', 'User feedback'], { families: ['mobile'] }),
  q('fam_mobile_release', 'technical', 'medium', 'What is different about releasing a mobile app compared with a website, and how does it change the way you work?', ['Release process', 'Versioning', 'Backward compatibility'], { families: ['mobile'] }),
  q('fam_prod_prioritise', 'technical', 'medium', 'You have ten requests and capacity for three. How do you decide, and how do you explain the decision?', ['Prioritisation method', 'Stakeholders', 'Trade-offs'], { families: ['product'] }),
  q('fam_prod_requirements', 'technical', 'medium', 'How do you turn a vague request into requirements a team can build and test?', ['Clarifying the goal', 'Acceptance criteria', 'Scope'], { families: ['product', 'data'] }),
  q('fam_sw_review', 'technical', 'easy', 'What do you look for when you review someone else\'s code?', ['Correctness', 'Readability', 'Tests', 'Constructive feedback'], { families: ['software', 'frontend', 'backend'] }),
  q('fam_sw_design', 'technical', 'hard', 'How would you design a service for a {role} team that must stay available when one of its dependencies fails?', ['Failure isolation', 'Timeouts and retries', 'Graceful degradation'], { families: ['software', 'backend', 'devops'] }),
  q('fam_sw_legacy', 'technical', 'medium', 'You inherit code with no tests that you need to change. How do you proceed safely?', ['Characterisation tests', 'Small steps', 'Risk management'], { families: ['software', 'frontend', 'backend', 'mobile'] }),
  q('fam_sw_complexity', 'technical', 'medium', 'How do you decide whether a piece of code is efficient enough, and when is it worth optimising?', ['Measuring', 'Algorithmic cost', 'Cost of optimisation'], { families: ['software', 'backend', 'data'] }),

  // ---- Technical: specific skills -------------------------------------------------------------------
  q('sk_react_render', 'technical', 'medium', 'What causes a React component to re-render, and how do you avoid unnecessary re-renders?', ['State and props changes', 'Memoisation', 'Measuring first'], { skills: ['React'] }),
  q('sk_react_effects', 'technical', 'medium', 'When should you not use an effect in React, and what do you do instead?', ['Derived state', 'Event handlers', 'Effect dependencies'], { skills: ['React'] }),
  q('sk_js_async', 'technical', 'medium', 'Explain how asynchronous code runs in JavaScript and one bug that misunderstanding it can cause.', ['Event loop', 'Promises', 'Race conditions'], { skills: ['JavaScript'] }),
  q('sk_ts_types', 'technical', 'medium', 'How does TypeScript help you catch errors, and where can it give a false sense of safety?', ['Static types', 'Runtime boundaries', 'Unsafe casts'], { skills: ['TypeScript'] }),
  q('sk_node_block', 'technical', 'hard', 'What happens to a Node.js server when one request does heavy computation, and how do you deal with it?', ['Single-threaded event loop', 'Blocking work', 'Offloading'], { skills: ['Node.js'] }),
  q('sk_python_struct', 'technical', 'easy', 'In Python, when would you choose a list, a dictionary or a set, and why does it matter?', ['Data structure choice', 'Lookup cost', 'Readability'], { skills: ['Python'] }),
  q('sk_java_memory', 'technical', 'medium', 'How does memory management work in Java, and what can still cause a memory leak?', ['Garbage collection', 'Object references', 'Diagnosing leaks'], { skills: ['Java'] }),
  q('sk_sql_index', 'technical', 'medium', 'How does an index speed up a query, and when does adding one make things worse?', ['Index structure', 'Write cost', 'Query plans'], { skills: ['SQL', 'PostgreSQL', 'MySQL'] }),
  q('sk_sql_join', 'technical', 'easy', 'Explain the difference between an inner join and a left join with an example of when each is the right choice.', ['Join semantics', 'Missing rows', 'Example'], { skills: ['SQL', 'PostgreSQL', 'MySQL'] }),
  q('sk_mongo_model', 'technical', 'medium', 'In MongoDB, how do you decide between embedding data in a document and referencing another collection?', ['Access patterns', 'Document growth', 'Consistency'], { skills: ['MongoDB'] }),
  q('sk_rest_design', 'technical', 'medium', 'What makes an HTTP API easy to use correctly, and how do you report errors to its clients?', ['Resource naming', 'Status codes', 'Error format', 'Versioning'], { skills: ['REST APIs', 'Express.js'] }),
  q('sk_docker_image', 'technical', 'medium', 'What is the difference between a container image and a running container, and how do you keep images small and safe?', ['Image vs container', 'Layers', 'Minimal base', 'No secrets in images'], { skills: ['Docker'] }),
  q('sk_k8s_basics', 'technical', 'hard', 'What does Kubernetes do when a container keeps crashing, and how would you find out why?', ['Restart behaviour', 'Logs and events', 'Probes'], { skills: ['Kubernetes'] }),
  q('sk_aws_design', 'technical', 'medium', 'How do you control cost and access when you run a workload on AWS?', ['Least privilege', 'Cost visibility', 'Right-sizing'], { skills: ['AWS'] }),
  q('sk_git_conflict', 'technical', 'easy', 'Two people changed the same lines on different branches. How do you resolve it, and how do you avoid it happening often?', ['Merge conflicts', 'Small changes', 'Communication'], { skills: ['Git'] }),
  q('sk_cicd_pipeline', 'technical', 'medium', 'What should an automated pipeline check before a change is deployed, and what should stop the release?', ['Build and tests', 'Quality gates', 'Fast feedback'], { skills: ['CI/CD'] }),
  q('sk_linux_debug', 'technical', 'medium', 'A Linux server is slow. Which things do you check first and what would each tell you?', ['CPU, memory, disk, network', 'Process inspection', 'Logs'], { skills: ['Linux'] }),
  q('sk_html_semantic', 'technical', 'easy', 'Why does it matter which HTML element you choose when several would look the same?', ['Semantics', 'Accessibility', 'Browser behaviour'], { skills: ['HTML'] }),
  q('sk_css_layout', 'technical', 'easy', 'How do you build a layout that works on a phone and a wide monitor?', ['Responsive layout', 'Flexible units', 'Breakpoints'], { skills: ['CSS', 'Tailwind CSS'] }),
  q('sk_ml_pipeline', 'technical', 'medium', 'Describe the steps between raw data and a model you would trust, and where mistakes usually creep in.', ['Data split', 'Feature preparation', 'Leakage', 'Evaluation'], { skills: ['Machine Learning', 'Scikit-learn', 'TensorFlow', 'PyTorch'] }),
  q('sk_pandas_scale', 'technical', 'medium', 'Your Pandas script runs out of memory on a large file. What are your options?', ['Chunking', 'Data types', 'Moving work to a database'], { skills: ['Pandas'] }),
  q('sk_excel_model', 'technical', 'easy', 'How do you build a spreadsheet analysis that someone else can check and reuse?', ['Structure', 'Avoiding hard-coded values', 'Validation'], { skills: ['Excel'] }),
  q('sk_testing_layers', 'technical', 'medium', 'How do you decide what to cover with unit tests and what needs an end-to-end test?', ['Test layers', 'Cost and confidence', 'Flaky tests'], { skills: ['Testing', 'Jest', 'Selenium'] }),
  q('sk_figma_system', 'technical', 'easy', 'How do you keep a set of screens consistent as a product grows?', ['Reusable components', 'Design tokens', 'Documentation'], { skills: ['Figma'] }),

  // ---- Technical: job posting ------------------------------------------------------------------------
  q('job_skill_evidence', 'technical', 'medium', 'This posting asks for {jobSkill}. Give a concrete example of work you have done with it, or the closest thing you have done.', ['Concrete example', 'Own contribution', 'Honest about limits'], { needs: ['jobSkill'] }),
  q('job_skill_depth', 'technical', 'hard', 'The role relies on {jobSkill}. What is something about {jobSkill} that is easy to get wrong, and how do you avoid it?', ['Depth of understanding', 'Pitfall', 'Mitigation'], { needs: ['jobSkill'] }),

  // ---- Behavioural -------------------------------------------------------------------------------------
  q('beh_conflict', 'behavioral', 'medium', 'Tell me about a time you disagreed with a teammate about how to do something. What did you do and how did it end?', ['Situation and task', 'Listening', 'Resolution', 'Result'], {}),
  q('beh_deadline', 'behavioral', 'medium', 'Describe a time you were not going to meet a deadline. What did you do when you realised?', ['Early communication', 'Re-planning', 'Result'], {}),
  q('beh_mistake', 'behavioral', 'medium', 'Tell me about a mistake you made in your work. How did you find it and what changed afterwards?', ['Ownership', 'Fix', 'Lesson applied'], {}),
  q('beh_feedback', 'behavioral', 'easy', 'Describe a piece of critical feedback you received. What did you do with it?', ['Receiving feedback', 'Specific change', 'Outcome'], {}),
  q('beh_unclear', 'behavioral', 'medium', 'Tell me about a task where the requirements were unclear. How did you move forward?', ['Clarifying questions', 'Assumptions', 'Outcome'], {}),
  q('beh_learn_fast', 'behavioral', 'easy', 'Describe a time you had to learn something new quickly to finish a piece of work.', ['Learning approach', 'Applying it', 'Result'], {}),
  q('beh_initiative', 'behavioral', 'medium', 'Tell me about something you improved that nobody asked you to improve.', ['Spotting the problem', 'Action', 'Measured effect'], {}),
  q('beh_teamwork', 'behavioral', 'easy', 'Describe a project where the team result mattered more than your own part. What was your contribution?', ['Own role', 'Collaboration', 'Team outcome'], {}),
  q('beh_pressure', 'behavioral', 'medium', 'Tell me about a time something broke or went wrong under time pressure. What did you do first?', ['Staying calm', 'Prioritising', 'Outcome and follow-up'], {}),
  q('beh_priorities', 'behavioral', 'medium', 'Describe a time you had more work than time. How did you decide what to do and what to leave?', ['Prioritisation', 'Communication', 'Result'], {}),
  q('beh_explain', 'behavioral', 'easy', 'Tell me about a time you had to explain something technical to someone without a technical background.', ['Audience awareness', 'Simplifying', 'Checking understanding'], {}),
  q('beh_help', 'behavioral', 'easy', 'Describe a time you helped someone else succeed at their work.', ['Noticing the need', 'What you did', 'Their outcome'], {}),
  q('beh_exp_challenge', 'behavioral', 'medium', 'Thinking about your time as {experience}: what was the hardest situation you faced there, and how did you handle it?', ['Specific situation', 'Action taken', 'Result'], { needs: ['experience'] }),

  // ---- Project -----------------------------------------------------------------------------------------
  q('proj_named_tradeoff', 'project', 'medium', 'In your project "{project}", what was the most important technical decision you made, and what did you give up by choosing it?', ['Decision', 'Alternatives considered', 'Trade-off'], { needs: ['project'] }),
  q('proj_named_redo', 'project', 'medium', 'If you started "{project}" again today, what would you do differently and why?', ['Reflection', 'Specific change', 'Reasoning'], { needs: ['project'] }),
  q('proj_named_hard', 'project', 'medium', 'What was the hardest problem you hit while building "{project}", and how did you solve it?', ['Problem', 'Approach', 'Outcome'], { needs: ['project'] }),
  q('proj_named_scale', 'project', 'hard', 'Suppose "{project}" suddenly had a hundred times more users or data. What would break first?', ['Bottleneck', 'Reasoning', 'What to change'], { needs: ['project'] }),
  q('proj_named_test', 'project', 'easy', 'How did you check that "{project}" actually worked correctly?', ['Testing approach', 'Edge cases', 'What was not tested'], { needs: ['project'] }),
  q('proj_generic_tradeoff', 'project', 'medium', 'Walk me through a technical decision in a project you worked on and the trade-offs you weighed.', ['Decision', 'Alternatives', 'Trade-off'], {}),
  q('proj_generic_scope', 'project', 'medium', 'Describe a project where you had to cut scope. How did you decide what to drop?', ['Prioritisation', 'Impact', 'Outcome'], {}),
  q('proj_generic_role', 'project', 'easy', 'Pick a project you worked on with others. Which parts were yours, and how did your part connect to the rest?', ['Own contribution', 'Interfaces', 'Collaboration'], {}),
  q('proj_generic_fail', 'project', 'medium', 'Tell me about a project that did not go as planned. What happened and what did you learn?', ['What went wrong', 'Response', 'Lesson'], {}),

  // ---- Resume ----------------------------------------------------------------------------------------------
  q('res_exp_proud', 'resume', 'easy', 'From your time as {experience}, describe a piece of work you are proud of and what your own part in it was.', ['Specific work', 'Own contribution', 'Result'], { needs: ['experience'] }),
  q('res_exp_impact', 'resume', 'medium', 'As {experience}, what changed because of your work? How do you know?', ['Outcome', 'Evidence', 'Own contribution'], { needs: ['experience'] }),
  q('res_exp_day', 'resume', 'easy', 'Describe your day-to-day responsibilities as {experience} and which of them you would want more of in your next role.', ['Responsibilities', 'Preferences', 'Link to target role'], { needs: ['experience'] }),
  q('res_skill_where', 'resume', 'easy', 'Your resume lists {skill}. Where exactly did you use it, and for how long?', ['Specific context', 'Depth of use', 'Honesty'], { needs: ['skill'] }),
  q('res_skill_level', 'resume', 'medium', 'How would you rate your {skill} ability, and what is something in {skill} you still find difficult?', ['Self-assessment', 'Known limits', 'Plan to improve'], { needs: ['skill'] }),
  q('res_generic_walk', 'resume', 'easy', 'Walk me through your background in two minutes, focusing on what is relevant to a {role} role.', ['Relevant highlights', 'Clear structure', 'Link to role'], {}),
  q('res_generic_strongest', 'resume', 'easy', 'Which single item on your resume best shows you can do a {role} job, and why that one?', ['Chosen evidence', 'Reasoning', 'Relevance'], {}),
  q('res_generic_gapyear', 'resume', 'easy', 'Is there anything on your resume you expect an interviewer to question? How would you explain it?', ['Self-awareness', 'Clear explanation'], {}),

  // ---- Career -----------------------------------------------------------------------------------------------
  q('car_why_role', 'career', 'easy', 'Why do you want to work as a {role}, and what have you done so far that points in that direction?', ['Motivation', 'Evidence', 'Realistic view of the role'], {}),
  q('car_gap_close', 'career', 'medium', 'Your profile shows little evidence of {gap}. What is your plan to close that gap in the next three months?', ['Concrete plan', 'Timeline', 'How progress is checked'], { needs: ['gap'] }),
  q('car_strength_fit', 'career', 'easy', 'Which of your strengths matters most for a {role} role, and where have you used it?', ['Strength', 'Example', 'Relevance'], {}),
  q('car_first_90', 'career', 'medium', 'What would you aim to have done in your first ninety days as a {role}?', ['Learning', 'First contributions', 'Realistic scope'], {}),
  q('car_grow', 'career', 'easy', 'What do you want to be noticeably better at one year from now, and how will you get there?', ['Specific goal', 'Plan', 'Measure'], {}),
  q('car_team', 'career', 'easy', 'What kind of team and working style helps you do your best work, and what do you find difficult?', ['Self-awareness', 'Specific examples'], {}),
  q('car_company_why', 'career', 'easy', 'Why are you interested in this {role} position at {company} specifically?', ['Knowledge of the company or role', 'Fit', 'Motivation'], { needs: ['company'] }),
  q('car_company_contribute', 'career', 'medium', 'Based on the job description at {company}, where do you think you would contribute soonest, and where would you need support?', ['Reading of the posting', 'Strengths', 'Honest gaps'], { needs: ['company'] }),
  q('car_job_gap', 'career', 'medium', 'This posting asks for {jobSkill}, which your resume does not clearly show. How would you address that if you were hired?', ['Honesty', 'Related experience', 'Learning plan'], { needs: ['jobSkill'] }),
];
