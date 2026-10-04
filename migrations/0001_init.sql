-- Task ticks. task_id comes from the plan Markdown (e.g. 'w04-07', 'r-03').
CREATE TABLE task_progress (
  task_id    TEXT PRIMARY KEY,
  done       INTEGER NOT NULL CHECK (done IN (0, 1)),
  done_at    TEXT,
  updated_at TEXT NOT NULL
);

-- One row per week, filled on Sundays.
CREATE TABLE week_log (
  week            INTEGER PRIMARY KEY CHECK (week BETWEEN 1 AND 13),
  avg_medium_min  REAL    CHECK (avg_medium_min IS NULL OR avg_medium_min > 0),
  design_score    INTEGER CHECK (design_score IS NULL OR design_score BETWEEN 0 AND 10),
  redraw_misses   TEXT,
  lld_result      TEXT,
  mock_score      TEXT,
  fix_next_week   TEXT,
  updated_at      TEXT NOT NULL
);

-- Individual DSA problems, for stats only (counts, average time). Not used for points.
CREATE TABLE problem_log (
  id          TEXT PRIMARY KEY,                -- client UUID
  logged_on   TEXT NOT NULL,                   -- 'YYYY-MM-DD' in Asia/Kolkata
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  minutes     INTEGER CHECK (minutes IS NULL OR minutes > 0),
  no_ai       INTEGER NOT NULL DEFAULT 1 CHECK (no_ai IN (0, 1)),
  title       TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_problem_log_logged_on ON problem_log (logged_on);

-- Design library status. design_id comes from the ID column of the library tables.
CREATE TABLE design_status (
  design_id    TEXT PRIMARY KEY,
  status       TEXT NOT NULL CHECK (status IN ('not-started', 'attempted', 'redrawn-1', 'redrawn-2')),
  attempted_on TEXT,                           -- 'YYYY-MM-DD'; redraws due at +7 and +21 days
  drawing_url  TEXT,                           -- your Excalidraw link
  updated_at   TEXT NOT NULL
);

CREATE TABLE decision_card (
  id                   TEXT PRIMARY KEY,       -- client UUID
  design_id            TEXT NOT NULL,
  decision             TEXT NOT NULL,
  forced_by            TEXT NOT NULL,
  rejected_alternative TEXT,
  what_breaks          TEXT,
  numbers              TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);
CREATE INDEX idx_decision_card_design ON decision_card (design_id);

-- Why-notes, design notes, STAR stories, free notes.
CREATE TABLE note (
  id         TEXT PRIMARY KEY,                 -- client UUID
  kind       TEXT NOT NULL CHECK (kind IN ('why', 'design', 'story', 'free')),
  ref_id     TEXT,                             -- task ID for 'why', design ID for 'design'
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_note_ref ON note (kind, ref_id);

-- Flashcard state. card_id = the concept task ID its why-question came from.
CREATE TABLE flashcard_state (
  card_id      TEXT PRIMARY KEY,
  box          INTEGER NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  due_on       TEXT NOT NULL,                  -- 'YYYY-MM-DD'
  reviews      INTEGER NOT NULL DEFAULT 0,
  last_grade   TEXT CHECK (last_grade IS NULL OR last_grade IN ('again', 'hard', 'good')),
  updated_at   TEXT NOT NULL
);

-- Focus timer sessions, for stats.
CREATE TABLE focus_session (
  id          TEXT PRIMARY KEY,                -- client UUID
  kind        TEXT NOT NULL,                   -- task type or tool name
  ref_id      TEXT,
  started_at  TEXT NOT NULL,
  ended_at    TEXT NOT NULL,
  planned_min INTEGER NOT NULL CHECK (planned_min > 0)
);

-- Key-value settings.
CREATE TABLE settings (
  key        TEXT PRIMARY KEY CHECK (key IN ('theme', 'why_note', 'onboarded', 'chime')),
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Idempotency: every applied op, so a retried request never applies twice.
CREATE TABLE applied_op (
  op_id      TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
