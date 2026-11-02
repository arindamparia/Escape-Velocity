-- The Growth track (plan/growth): what you learned, which scenario move you chose, what you tried, and which habit you
-- kept on which day. One row per key, desired state: a growth.set op with value null deletes its row.
--   learned:<idea>          had | close | new   (how your guess compared with the lesson)
--   scenario:<sc-NN>        A..E                (the move you chose)
--   tried:<idea>            1                   (you did the real-world assignment)
--   kept:h<1-5>:<YYYY-MM-DD> 1                  (you kept habit n that day)
CREATE TABLE growth (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  on_day     TEXT NOT NULL,                    -- 'YYYY-MM-DD' in Asia/Kolkata, the plan day it happened
  updated_at TEXT NOT NULL
);
