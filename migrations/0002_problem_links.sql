-- Problems get a link, and problems solved in AlgoTracker (algotracker.xyz) are imported alongside the ones logged here.
-- url_key is the problem's canonical address (see canonicalProblemUrl in shared/constants.ts), so the same problem logged in
-- both places is counted once.
ALTER TABLE problem_log ADD COLUMN url TEXT;
ALTER TABLE problem_log ADD COLUMN url_key TEXT;
ALTER TABLE problem_log ADD COLUMN source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'algotracker'));
ALTER TABLE problem_log ADD COLUMN external_id TEXT;
CREATE INDEX idx_problem_log_url_key ON problem_log (url_key);
CREATE UNIQUE INDEX idx_problem_log_external ON problem_log (source, external_id) WHERE external_id IS NOT NULL;

-- Small key-value store for the server's own bookkeeping (when AlgoTracker was last read, and how that went).
CREATE TABLE sync_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
