-- Solved problems from AlgoTracker are read live from its own database and shown on Progress; nothing is copied here.
-- This removes the import bookkeeping that 0002 added (the problem link column, url, stays).
DROP INDEX IF EXISTS idx_problem_log_url_key;
DROP INDEX IF EXISTS idx_problem_log_external;
ALTER TABLE problem_log DROP COLUMN url_key;
ALTER TABLE problem_log DROP COLUMN external_id;
ALTER TABLE problem_log DROP COLUMN source;
DROP TABLE IF EXISTS sync_state;
