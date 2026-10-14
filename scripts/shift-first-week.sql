-- One-off, 14 Oct 2026: the plan now starts on Mon 12 Oct instead of Mon 5 Oct, so the work done in the first week
-- (plan days 5 to 11 Oct, which run 04:00 to 04:00 Kolkata, that is 22:30 UTC to 22:30 UTC) moves forward by exactly 7 days.
-- Ticks stay ticked (they are not tied to a date); this only moves the dates that drive "active days", streaks and
-- "missed days". Problems logged for earlier months (the AlgoTracker import) are not touched.
-- Run once:  npx wrangler d1 execute escape-velocity --remote --file scripts/shift-first-week.sql
UPDATE task_progress
   SET done_at    = strftime('%Y-%m-%dT%H:%M:%fZ', done_at, '+7 days'),
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', updated_at, '+7 days')
 WHERE done = 1 AND done_at >= '2026-10-04T22:30:00' AND done_at < '2026-10-11T22:30:00';

UPDATE focus_session
   SET started_at = strftime('%Y-%m-%dT%H:%M:%fZ', started_at, '+7 days'),
       ended_at   = strftime('%Y-%m-%dT%H:%M:%fZ', ended_at, '+7 days')
 WHERE started_at >= '2026-10-04T22:30:00' AND started_at < '2026-10-11T22:30:00';
