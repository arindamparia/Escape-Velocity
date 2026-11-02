# Growth: design

The Growth track teaches Atomic Habits, The 48 Laws of Power, How to Win Friends and Influence People and four more books inside the app, by doing. It also uses the same habit science to change how the study programme runs. This doc came first; the code follows it.

## 1. The learning model

The success test is: after six weeks of about ten minutes a day, can you explain every core idea, spot it in a real situation, use it on purpose, and name one thing you changed? Reading summaries fails that test. Retrieval, application and spacing pass it. So every idea goes round the same spiral:

| Step | When | What you do | Why it works |
| --- | --- | --- | --- |
| 1. Guess | The day it is new | Answer the idea's question **before** the idea is shown (one line) | Generating an answer first makes the real one stick (the plan's own derive-first rule) |
| 2. Lesson | The same minute | Read the 60-second lesson, rate your guess: *had it*, *close*, *new to me* | Feedback straight after a guess |
| 3. Card | From the next day | The idea's card joins the Growth deck (Leitner, 1/3/7/14/30 days) | Spaced retrieval |
| 4. Scenario | Once all its ideas are learned | A real situation with three moves; choose, get honest feedback | Transfer: spotting the idea in the wild |
| 5. Try it | Within the week | One small real-world assignment, then two lines: what you did, what happened | Application, and the "something I changed" of the success test |
| 6. Review | Sunday | The Growth review: what worked, what to change, what to drop | Reflection; closes the loop |

**Pace.** A day's session is two new ideas, the cards due (at most 8), and one scenario: about 8 to 10 minutes. On a light day, or the day after a gap, it is one idea (the two-minute version). The path is a queue, not a calendar: a missed day moves nothing and leaves no backlog. At two a day the core (Atomic Habits, the 48 laws, How to Win Friends) is done in about six weeks, and everything in about ten.

## 2. Part A: the study programme, rebuilt with habit science

An audit of how a week runs now:

| Area | Before | After |
| --- | --- | --- |
| **Cue** (make it obvious) | The plan says "morning, before work" and "night". Nothing says *when exactly* or *after what*. | Each block (weekday morning, weekday night, Saturday, Sunday) has an **anchor**: "After I pour my tea, I open Today and press Start." You can edit it; it has a default. The current block's anchor is one quiet line on Today's next-up card. |
| **Launch ritual** | Start is one click and starts the timer and the Cabin sound. | Kept. The anchor names the ritual: open Today, Start, the sound is the cue that work has begun. |
| **Starting** (make it easy) | Light versions exist only for festival days. | Every task type has a **two-minute start** ("open the problem and write the brute force as a comment"). It shows under the next-up card as "Can't face it?", so a bad day starts at two minutes, not at zero. |
| **Shutdown ritual** | None. The day just ends. | **Close the day** (folded, on Today in the evening): tick what is done, one line for tomorrow. Tomorrow's next-up card shows that line ("Last night you wrote: …"). The day is closed and the next one is cued (Zeigarnik). |
| **Reward** (make it satisfying) | Points and the constellation. | Kept, unchanged. Growth adds **identity votes**: every real action this week (a tick, a solved problem, a lesson, a kept habit) counts as a vote for the identity you chose. It is shown as a count, never as a loss. |
| **Identity** | Your "why" (five lines). | Kept. Plus one **identity statement per chapter** ("I am an engineer who solves one problem a day"), editable, with a suggestion for each chapter. |
| **Never miss twice** | Waiting for you, the welcome-back restart. | Kept. The welcome-back card now names the rule: one miss is an accident, two is the start of a new habit, so today is two minutes. |
| **Plateau and Goldilocks** | Chapters exist; nothing explains the flat middle. | **Coach notes by week**: one line on the Monday card. Week 5: "the plateau of latent potential starts here: work stored, not yet visible". Week 7: the difficulty steps up, so expect 30% misses (the Goldilocks zone). |
| **Learning science** | Strong on retrieval (flashcards, redraws), spacing (+7/+21) and derive-first. | Weak spots: (a) no DSA redo queue, though rule 5 says "redo in two weeks"; (b) no interleaving note for the mixed weeks; (c) no buffer. Fixes: coach notes for (b), and the Sunday Growth review asks "what needs a redo" for (a). Friday stays the buffer (rule 5 already says so). No change to points. |

### Gap audit

| Gap | Decision |
| --- | --- |
| Sleep | Rule 6 says 7+ hours. Add a **field-kit lesson** (sleep and memory consolidation) and suggest it as a habit in the builder. |
| Exercise | Rule 6 says a 20 to 30 minute walk. Field-kit lesson; habit suggestion. |
| Burnout | The rest note after six days exists. Field-kit lesson (signs, the 2-day rule), linked from the rest note. |
| Procrastination | Covered by the Atomic Habits lessons (two-minute rule, temptation bundling, environment) and the two-minute starts. |
| Interview anxiety | Field-kit lesson (reappraisal: "I am excited", box breathing, a pre-interview ritual). Mock tasks link to it. |
| Networking and referrals | The plan has "ask for referrals" in week 13 but no how-to. Field-kit lesson plus How to Win Friends scripts (a referral message). |
| Resume and LinkedIn | The plan has a resume task (week 13). Field-kit lesson on how to say it (impact first), no plan change. |
| Negotiating the offer | The plan says "know your number". Never Split the Difference teaches it (anchoring, labels, calibrated questions, the Ackerman model), with a salary script. |
| Reputation at work | The 48 laws (reputation, credit, the boss) and How to Win Friends: their whole subject. No plan task. |

**Plan edits** (made only where they earn their place):

```diff
 ## 2. Information architecture
-### Navigation: five destinations
+### Navigation: six destinations
+| **Growth** (`/growth`) | "How do I become the person who does this?" | Today's Growth session, the books as paths, the 48 laws, scenarios, habits, Growth progress |
-Five is deliberate: every extra nav item is a decision you make before studying. …
+Six is deliberate: … Growth is the one addition: it is a second track with its own progress, and folding it into Study would hide it.
+## 23. The Growth track (what the compiler reads in plan/growth/)
 ## Mocks, stories and applying
-Target applications go out from Mon 11 Jan.
+Target applications go out from Mon 25 Jan.        (a stale date from the move)
```

No task is added, removed or re-pointed. Points, the weekly target, streaks, readiness and the `.ics` export do not change.

## 3. Information architecture

A sixth top-level tab, **Growth** (`/growth`), with its own sub-navigation like Study:

| URL | What |
| --- | --- |
| `/growth` | **Today's session**: two ideas (guess, then the lesson), cards due, one scenario, this week's thing to try, your habits for today |
| `/growth/ah`, `/law`, `/hf`, `/inf`, `/ns`, `/dw`, `/ms`, `/fk` | Each book as a **path**: every idea as a card (`#ah-03`, `#law-17`), learned ones marked, the rest open to browse. The 48 laws page groups them by theme and has a filter box |
| `/growth/scenarios` | Every scenario, open once its ideas are learned (or "try it anyway") |
| `/growth/habits` | Your anchors, the habit builder (up to five habits), today's ticks, "why did it fail" |
| `/growth/progress` | Growth progress by week, the Growth review, identity statements |

**Today**: one folded row, "Growth today", that looks like Waiting and Optional, placed after Waiting: "2 ideas, 3 cards, 1 scenario · about 9 min · 14 votes this week". Open, it shows the first idea's question and a button to the session. The anchor line, the two-minute start and "Last night you wrote" go inside the next-up card as small lines. Close the day is folded under the list in the evening. Everything fits the height budget; see section 7.

## 4. Content source

There is a sibling directory, `plan/growth/`, with one Markdown file per book plus `00-programme.md`. It is read by the same compile step (`scripts/lib/growth.ts`, called from `compile-plan.ts`). It is not a new Part of the plan file because:
- The plan file is the 13-week spec (1,900 lines). Growth adds about 25,000 words of cards. One file per book keeps each reviewable.
- Its structure is cards with fields, not sections with surfaces.

The plan stays the spec: Part 1 section 23 defines the format, and CLAUDE.md names both sources.

**Format** (validated, with a loud failure on any error):

```
## Book · ah · Atomic Habits · James Clear, 2018
### ah-03 · Habit stacking
- **Group:** Make it obvious
- **Ask:** the question shown before the idea
- **Lesson:** the 60-second lesson (markdown)
- **Use:** the concrete move               (laws, Influence, Never Split: required)
- **Story:** the story that teaches it     (laws: required)
- **Backfires:** …   **Spot:** …   **Counter:** …   (laws, Influence: required)
- **Script:** word-for-word                (How to Win Friends: required)
- **Plan:** how it applies to the 13 weeks (Atomic Habits: required)
- **Card:** front ‖ back
- **Try:** the real-world assignment
```

Scenarios: `### sc-04 · title`, `- **Ideas:** law-07, hf-12`, `- **Kind:** choose | spot`, `- **Situation:**`, then `- **A:** move ‖ best|ok|poor ‖ feedback` (at least three options, exactly one best). The programme file holds the path (every idea exactly once), the anchors (one per block), the two-minute starts (one per task type), coach notes by week (1 to 13) and identity suggestions by chapter.

The compiler fails on: a missing required field, a duplicate id, an id whose prefix is not its book, the 48 laws not exactly `law-01` to `law-48`, a scenario naming an unknown idea, options without exactly one best, a path that misses or repeats an idea, or a task type without a two-minute start.

## 5. Data model

Most of it reuses what exists:
- **Notes** (`note.upsert`, kind `free`) with `grow:` refs, hidden from the Free notes list and from Recent like `plan:` and `eq:`:
  - `grow:anchor:<block>`
  - `grow:habit:<1-5>` (the builder's fields as text)
  - `grow:identity:c<n>`
  - `grow:try:<idea>` (what you did, what happened)
  - `grow:review:w<NN>`
  - `grow:tomorrow:<ymd>`
  - `grow:ask:<idea>` (your guess)
- **Flashcards**: the Growth deck is the existing `flashcard.review` op and `flashcard_state` table. The card id is the idea id (`law-03`). The id pattern widens to accept it, and the Worker checks it against the compiled list. The plan deck's 10-a-day cap and its due count now count plan cards only; the Growth deck has its own cap of 8.
- **One new table** for what cannot be a note, in migration `0005_growth.sql`:

```sql
CREATE TABLE growth (key TEXT PRIMARY KEY, value TEXT NOT NULL, on_day TEXT NOT NULL, updated_at TEXT NOT NULL);
```

  It has one new op, `growth.set { key, value: string | null, on: YYYY-MM-DD }`. This is desired state: `null` deletes, and applying it twice is harmless. The keys are:
  - `learned:<idea>` = `had` | `close` | `new`
  - `scenario:<id>` = `A`…`E`
  - `tried:<idea>` = `1`
  - `kept:h<n>:<ymd>` = `1`
  The reducer and the Worker change together, and `parity.test.ts` covers the op.

**Cost**: every Growth action is one `POST /api/ops`, like a tick. Nothing reads, nothing polls. The Growth chunks are static files.

## 6. Progress, kept apart

Growth never touches points, the weekly target, the streak, readiness or the constellation. A unit test feeds Growth marks into the points and streak functions and checks that nothing moves. Growth progress is shown **in weeks**:
- ideas learned (and of those, how many you already half-knew);
- cards reviewed, scenarios answered, things tried;
- habit days kept;
- votes;
- "weeks with Growth" (at least three active days, like the study streak).

There is no loss warning, and a quiet week shows as quiet, not as red. The settings calendar is unchanged; it stays the study calendar.

## 7. Today and the height budget

Today is about 1,590 px on a desktop and 3,100 px on a phone, against budgets of 1,800 and 3,500. The additions:
- Growth today, one folded line: about 50 px.
- Inside the next-up card, the anchor and the two-minute start: two small lines, about 45 px.
- Close the day: folded, evenings only.

The budget holds. If it did not, the anchor line would move into the "Can't face it?" line.

## 8. Where this could feel like homework, and the answers

- **"Two more things to do every day."** Growth is folded, never the next-up action, never in "n of m", and missing it costs nothing. The session ends after its ten minutes; "one more" is offered, never pushed.
- **"The cards pile up."** There is a cap of 8, and the oldest-due come first, as in the plan deck.
- **"Week 3: the novelty is gone."** Scenarios unlock from week 1 and are the fun part. The 48 laws and the negotiation lessons pay off at work the same week, and the "Try" assignments make each week about a real conversation. The Sunday review asks what to drop, so the owner can trim it.
- **"Preachy."** The power content is taught as the books teach it: the move, when it works, how it backfires, and the counter. No moralising; the backfire is there because it is practical.
- **"Long reading."** Each lesson is 60 to 90 words. The detail (story, spot, counter, script) is behind *More*.

## 9. Content outline and size

| Book | Ideas | Words (about) |
| --- | --- | --- |
| Atomic Habits (`ah`): the fundamentals, the four laws and their inversions, advanced tactics | 24 | 3,600 |
| The 48 Laws of Power (`law`), in 7 themes | 48 | 9,600 |
| How to Win Friends (`hf`), its 4 parts and 30 principles | 30 | 4,500 |
| Influence (`inf`), Cialdini's 7 principles: reciprocity, commitment and consistency, social proof, liking, authority, scarcity, unity | 7 | 1,400 |
| Never Split the Difference (`ns`) | 10 | 1,700 |
| Deep Work (`dw`) | 7 | 1,000 |
| Make It Stick (`ms`) | 7 | 1,000 |
| Field kit (`fk`): sleep, movement, burnout, nerves, referrals, resume, reputation, negotiation day | 8 | 1,100 |
| Scenarios (`sc`), choose and spot | 24 | 3,500 |
| Programme: path, anchors, two-minute starts, coach notes, identity | n/a | 1,200 |

That is about 140 ideas and 28,000 words. On disk it is about 230 KB of JSON, in chunks of 20 to 60 KB, one per book and loaded only on its page. Today loads only the index chunk: about 8 KB with ids, titles, the path order and the day's first questions.

**Why these four extra books:**
- **Influence:** the science under both power and friendship; it pairs with the other two.
- **Never Split the Difference:** the offer negotiation in week 13.
- **Deep Work:** the 15 hours a week are worth twice as much done deep.
- **Make It Stick:** why this app's loop (retrieval, spacing, interleaving) works, so you trust it.

Mindset (Dweck) is left out because the Mindset page already covers that ground.
