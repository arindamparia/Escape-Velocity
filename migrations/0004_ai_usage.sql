-- The AI search's cost guard: how many questions were asked each day. It holds counts only, never a question or an answer.
CREATE TABLE ai_usage (
  day   TEXT PRIMARY KEY,
  calls INTEGER NOT NULL DEFAULT 0
);
