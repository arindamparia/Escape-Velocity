# Growth · scenarios

## Scenarios

Real situations, three or four moves, and honest feedback. A scenario opens once you have learned the ideas it uses (or press "try it anyway"). "Spot" scenarios ask you to name what is being done to you.

### sc-01 · Monday, 6:45 a.m., no motivation
- **Ideas:** ah-07, ah-08, ah-16
- **Kind:** choose
- **Situation:** It is Monday morning. You slept badly, the plan says a timed medium, and the thought of it makes you want to scroll instead. You have 40 minutes before you need to get ready for work.
- **A:** Skip today and do two tomorrow. ‖ poor ‖ Stacking yesterday on today is exactly what rule 4 forbids, and it makes tomorrow heavier. Missing once is fine, but this is the start of the spiral.
- **B:** Follow your stack: tea, sit, open Today, press Start, and do only the two-minute start (write the brute force). ‖ best ‖ The cue does the deciding, and two minutes is small enough to do on a bad day. Most of the time the two minutes become the full problem; if not, you still cast a vote.
- **C:** Wait until you feel motivated, maybe after a coffee and the news. ‖ ok ‖ Sometimes it comes; usually the news eats the 40 minutes. Motivation follows action more often than it causes it.

### sc-02 · The design that keeps failing
- **Ideas:** ah-02, ah-22, ms-06
- **Kind:** choose
- **Situation:** Week 6. Your last three Saturday cold attempts were poor: you missed key components and the redraws show it. You start thinking you are just not good at system design.
- **A:** Drop the cold attempts and read the breakdowns first for a few weeks, so the designs come out right. ‖ poor ‖ This trades real learning for fluency: the designs look better and stick worse (ms-01). It removes the very difficulty that is building the skill.
- **B:** Keep the loop, but check your calibration: compare your attempts with week 2's, and look for one specific recurring miss (say, failure handling). Work on that one thing next Saturday. ‖ best ‖ You are probably in the valley of disappointment, and the redraws are your data. Fixing one recurring gap is deliberate practice at the edge of your ability.
- **C:** Add a second design every weekday night to catch up. ‖ ok ‖ The instinct is right (more reps), but it doubles the load and risks burnout. One targeted fix beats twice the volume.

### sc-03 · Credit in the all-hands
- **Ideas:** law-07, law-01, law-36
- **Kind:** choose
- **Situation:** In the monthly all-hands, your tech lead presents the caching redesign you proposed and built as "something the team came up with", and takes the director's praise. Your name isn't mentioned.
- **A:** Reply in the all-hands chat: "Glad you liked it, I designed and built that one!" ‖ poor ‖ Public correction of your lead makes you look petty and makes an enemy of the person who writes your review (law 1, law 36). You might be right and still lose.
- **B:** Say nothing now. Afterwards, send the director a short write-up of the cache design with numbers, from you, cc'ing your lead, and thank your lead for presenting it. ‖ best ‖ Your name is now on the work, in writing, at the right level, and your lead keeps face. This is law 7's counter without breaking law 1.
- **C:** Raise it privately with your lead: you'd like to present your own work next time. ‖ ok ‖ Reasonable and honest, and worth doing, but on its own it leaves this result unattributed. Combine it with B.

### sc-04 · The recruiter's deadline
- **Ideas:** inf-06, law-35, ns-04
- **Kind:** spot
- **Situation:** A company makes you an offer on Monday and says it expires on Wednesday, "because we have other strong candidates". You are in the final round at a company you prefer, with results due next week.
- **A:** Scarcity and a forced deadline, aimed at stopping you from comparing offers. ‖ best ‖ Right. Exploding offers use scarcity and forced time (law 35). The counter: thank them, say you're excited, and ask for a week to finish your process. Real offers usually survive it.
- **B:** Reciprocity: they gave you an offer, so you owe them a quick answer. ‖ poor ‖ Reciprocity may be in your head, but the main lever here is the deadline and the hint of competition.
- **C:** Authority: they are telling you what the rules are. ‖ ok ‖ Partly: the deadline is presented as policy. But the active ingredient is scarcity: if it weren't scarce, it wouldn't press you.

### sc-05 · The friendly free help
- **Ideas:** inf-01, law-12, law-40
- **Kind:** spot
- **Situation:** A senior engineer from another team spends an evening helping you debug, unasked. Two days later, in a planning meeting, they ask you to back their proposal to move your team's service onto their platform, which you think is premature.
- **A:** Reciprocity, possibly deliberate: a favour that creates a debt, collected as a public yes. ‖ best ‖ Exactly. Thank them genuinely, then judge the proposal on its merits: the favour was a favour, not a down payment. You can say "I'm grateful for your help, and I want to look at the migration cost before I back it."
- **B:** Liking: they're nice, so you'll want to agree. ‖ ok ‖ Liking is part of it, but the timing (help, then a request) points at reciprocity.
- **C:** Social proof: they make it seem everyone has moved. ‖ poor ‖ Nothing here says others moved. The pattern is help first, ask second.

### sc-06 · The design review that turns into a fight
- **Ideas:** hf-10, hf-11, law-09, ns-05
- **Kind:** choose
- **Situation:** In a design review, a staff engineer says your choice of Postgres for the ledger "won't scale" and wants Cassandra. You're sure Postgres is right at your volume. The room is watching.
- **A:** Say "with respect, that's wrong: we do 200 writes a second" and walk through why. ‖ poor ‖ You may win the argument and lose the person (hf-10). "That's wrong" to a staff engineer in public triggers pride, not reflection.
- **B:** Summarise their concern ("so the worry is that writes grow 50x and a single primary won't keep up?"), agree on what would decide it, and offer to bring a load test with the growth numbers. ‖ best ‖ "That's right" first, then a test instead of an argument (law 9). They keep face, and the data decides. Often the test proves you right and they champion your design.
- **C:** Say nothing and switch to Cassandra to avoid conflict. ‖ ok ‖ Surrender can be tactical (law 22), but this is your system and a real technical call; giving it up without data costs the product and your credibility.

### sc-07 · The coffee chat with a manager
- **Ideas:** hf-07, hf-08, law-14
- **Kind:** choose
- **Situation:** You've got a 20-minute coffee chat with an engineering manager at a fintech you want to join. No open role is listed yet.
- **A:** Spend the time telling them about your experience, so they know you're strong. ‖ ok ‖ They will learn about you, but you'll learn nothing about them, and people remember how interested you were, not how impressive.
- **B:** Ask about their team's hardest current problem and what a great engineer there does differently; listen; at the end, ask what kind of engineer they'll need next. ‖ best ‖ They talk (hf-07), in their terms (hf-08), and you collect exactly the information (law 14) that tells you how to position yourself when the role opens.
- **C:** Ask directly for a referral. ‖ poor ‖ Too early; it turns a relationship into a transaction. Earn the ask first; it comes easily later.

### sc-08 · The counteroffer
- **Ideas:** law-03, law-20, law-29
- **Kind:** choose
- **Situation:** You've accepted an offer from a new company. When you resign, your manager offers a 25% raise to stay, and asks you to decide by tomorrow.
- **A:** Accept the raise immediately; it's money on the table. ‖ poor ‖ The reasons you were leaving are still there, and you are now the one who nearly left. Many counteroffers end within a year. And the deadline is theirs, not yours.
- **B:** Decide by your plan to the end: you knew this might happen, you wrote down why you're leaving, so thank them and decline, warmly. ‖ best ‖ Planning all the way to the end (law 29) means this was decided before the meeting. Leaving warmly keeps a reference and a door open.
- **C:** Use it to push the new company higher. ‖ ok ‖ Possible before you accept; after you've accepted, it can sour the new relationship before day one. Done only with great care, and early.

### sc-09 · The teammate who complains
- **Ideas:** law-10, hf-18, hf-17
- **Kind:** choose
- **Situation:** A teammate you like complains every day: about the manager, the codebase, the company. Lately you've started agreeing more, and you leave lunch in a worse mood.
- **A:** Stop eating lunch with them. ‖ ok ‖ It protects your mood, and law 10 supports it, but it's abrupt and loses a friend who may be going through something.
- **B:** Listen once with sympathy ("I'd be frustrated too"), ask what one thing would help, and then steer lunch to other topics; spend more time with people who are building something. ‖ best ‖ Sympathy without joining the spiral. You stay kind and keep your distance from the mood, which is the point of law 10.
- **C:** Tell them their negativity is affecting the team. ‖ poor ‖ Criticism makes people defensive (hf-01); they will remember this, and the complaining won't stop.

### sc-10 · The salary question too early
- **Ideas:** ns-06, ns-07, law-04
- **Kind:** choose
- **Situation:** In the first recruiter screen, before any technical round, the recruiter asks: "What are your salary expectations?"
- **A:** Give your current salary and say you'd like 20% more. ‖ poor ‖ You just anchored low on your old number, and the whole process will be priced off it.
- **B:** "I'd like to learn more about the role and level first. What's the range you have for it?" ‖ best ‖ Saying less (law 4) and a calibrated question (ns-07) puts the first number on them. If pushed, give a researched range whose bottom is your target (ns-06).
- **C:** Say "I'm flexible, money isn't the main thing for me." ‖ ok ‖ Friendly, but it tells them you will take the bottom of the band. Interest in the role and a market range can go together.

### sc-11 · You broke production
- **Ideas:** hf-12, law-05, law-26
- **Kind:** choose
- **Situation:** Your migration took down checkout for 12 minutes on a Friday evening. The incident channel is asking what happened. Nobody knows yet that it was your change.
- **A:** Wait to see whether someone finds it, and help quietly with the fix. ‖ poor ‖ It will be found, and then the story is that you hid it, which costs far more reputation (law 5) than the outage.
- **B:** Post first: "It was my migration. I've rolled it back, checkout is recovering, and I'll write the postmortem with the fix and the test that would have caught it." ‖ best ‖ Admitting quickly (hf-12) disarms everyone, and owning the fix turns an incident into a reputation for reliability. It is the opposite of keeping your hands clean, and it works better today.
- **C:** Say "it looks like the migration tool had an issue". ‖ poor ‖ Blaming the tool is a scapegoat (law 26) and will be seen through. Blameless postmortems need honest inputs.

### sc-12 · Spot the move: "everyone takes the standard package"
- **Ideas:** inf-03, inf-05, law-31
- **Kind:** spot
- **Situation:** You ask for a higher joining bonus. The recruiter says: "Honestly, almost everyone at this level takes the standard package. Our compensation team designs it carefully. You can choose: a higher base or the joining bonus, but not both."
- **A:** Social proof, authority, and controlled options, together. ‖ best ‖ All three: "everyone takes it" (inf-03), "the compensation team designs it" (inf-05), and a two-option frame that hides a third (law 31). Counter: "I understand. What would it take to do both, given the scope we discussed?"
- **B:** Reciprocity. ‖ poor ‖ Nothing has been given here to create a debt.
- **C:** Liking. ‖ ok ‖ A friendly tone may be in play, but the levers are the crowd, the authority and the frame.

### sc-13 · The new lead's revolution
- **Ideas:** law-45, law-38, hf-16
- **Kind:** choose
- **Situation:** You join a new team as SDE-2. The deploy process is slow and manual, tests are flaky, and nobody writes design docs. You see how to fix all three.
- **A:** In your first week, write a proposal fixing all three at once and present it at the team meeting. ‖ poor ‖ Too much change from an outsider, too fast: people defend the old way, and you get labelled as the new person who thinks we're all doing it wrong.
- **B:** Follow the conventions for a month, fix the flakiest test yourself, then ask the team "would a short design doc have helped on that last incident?". ‖ best ‖ Respect the old ways (law 38), one small improvement at a time (law 45), and let them reach the idea (hf-16). By month three, you are changing things with allies.
- **C:** Complain to your manager about the process in your first 1:1. ‖ ok ‖ Honest, and your manager may agree, but it starts your story as a critic. Lead with one fix, not a list of problems.

### sc-14 · The interviewer is cold
- **Ideas:** hf-05, law-39, fk-04
- **Kind:** choose
- **Situation:** In a system design interview, the interviewer doesn't smile, interrupts you twice, and says "that won't work" about your first idea. You feel your pulse rising.
- **A:** Defend the first idea firmly; you know it works. ‖ ok ‖ Holding a correct idea is good, but defending without asking what they see risks an argument, and many interviewers push back on purpose to see how you handle it.
- **B:** Breathe, stay warm, and ask: "What's the concern you see there? Is it the write volume?" Then adapt the design in the open. ‖ best ‖ Calm under provocation (law 39), warmth (hf-05) and a question turn pressure into collaboration. Adapting cheerfully is exactly what they're testing.
- **C:** Apologise and change the design entirely. ‖ poor ‖ Folding instantly looks like you didn't believe your own reasoning. Ask first, then change what deserves changing.

### sc-15 · The habit that died
- **Ideas:** ah-05, ah-15, ah-19
- **Kind:** choose
- **Situation:** Your evening concept habit was going well for two weeks, then stopped. You notice that the night block now starts after you've "relaxed" with YouTube for an hour.
- **A:** Decide to be more disciplined from tomorrow. ‖ poor ‖ Willpower against a cue that's already wired rarely wins. Nothing in the system changed.
- **B:** Diagnose it with the four laws: the cue moved (YouTube first), the response got harder (late and tired). Restack it: after dinner and the dishes, Start before any screen; make YouTube the reward after. Never miss twice. ‖ best ‖ The system broke, not you. Restacking the cue, bundling the reward after, and the two-minute start fix the actual failure.
- **C:** Move the concept work to the weekend. ‖ ok ‖ It might work, but it overloads the weekend and gives up a daily habit you had built.

### sc-16 · The referral ask
- **Ideas:** fk-05, inf-07, law-13
- **Kind:** choose
- **Situation:** A college senior you haven't talked to in three years is now a staff engineer at a company on your target list.
- **A:** "Hi! Long time. Can you refer me to your company?" ‖ poor ‖ It asks for something big with nothing in it for them, from a cold start.
- **B:** "Hi Arjun, fellow NIT Durgapur alum here. I saw your talk on the ledger rewrite. I'm applying for SDE-2 on the payments team, where I built X. Would you be open to referring me? Link and resume attached; no worries if not." ‖ best ‖ Shared identity (inf-07), real interest, proof, an exact ask, an easy no, and a hint of their gain (a strong hire, often a referral bonus).
- **C:** Like his posts for a month first, then ask. ‖ ok ‖ Warming up isn't wrong, but a month of likes is slow and a bit transparent. A specific, sincere message is warmer.

### sc-17 · Spot it: the "small" first yes
- **Ideas:** inf-02, law-31
- **Kind:** spot
- **Situation:** Your manager asks, "You'd agree you're keen to grow into a leadership role, right?" You say yes. Next: "Great, then you'll take on the on-call rotation lead and interview loop coordination this quarter, alongside your project."
- **A:** Commitment and consistency: a small public yes used to make a big ask feel like it follows from it. ‖ best ‖ That's it (the foot-in-the-door). Counter: "Knowing what this involves, I'd want to pick one of them, and agree what comes off my plate." Your first yes doesn't commit you to everything.
- **B:** Scarcity. ‖ poor ‖ Nothing is made scarce here.
- **C:** Unity: "we're a family". ‖ ok ‖ Not quite: no shared identity is invoked; the lever is your own earlier yes.

### sc-18 · The quiet senior with influence
- **Ideas:** law-19, law-42, hf-09
- **Kind:** choose
- **Situation:** Your proposal needs approval from the architecture forum. One quiet principal engineer rarely speaks in the forum, but everyone glances at her before voting.
- **A:** Present to the forum and hope your design convinces everyone. ‖ ok ‖ It might, but you're ignoring who actually moves the room.
- **B:** Ask her for 20 minutes before the forum: "You know the platform better than anyone; what would you change in this?" Incorporate her points. ‖ best ‖ You've identified the shepherd (law 42), asked for advice in a way that makes her feel important (hf-09), and shaped the design with her. The forum follows.
- **C:** Lobby everyone else first so she's outvoted. ‖ poor ‖ Working around a respected person is how you offend the wrong one (law 19).

### sc-19 · Asked to estimate under pressure
- **Ideas:** ns-07, law-22, ns-02
- **Kind:** choose
- **Situation:** A product director asks you, in front of your team, to commit to shipping a payment refunds feature in two weeks. Your honest estimate is five.
- **A:** Agree to two weeks to look committed. ‖ poor ‖ A counterfeit yes now becomes a missed date and a hit to your reputation later.
- **B:** "It sounds like there's a hard date behind this. How am I supposed to ship refunds safely in two weeks without dropping the reconciliation work? What's the date driven by?" ‖ best ‖ A label (ns-02) and a calibrated question (ns-07) make the constraint everyone's problem, often uncovering a smaller scope that meets the real need.
- **C:** Say "that's impossible" and give your five-week estimate. ‖ ok ‖ Honest, but a flat "impossible" in public invites a contest of wills; you'll be more effective helping them solve the real problem.

### sc-20 · Spot it: the sudden flattery
- **Ideas:** inf-04, law-33, law-12
- **Kind:** spot
- **Situation:** A colleague who has rarely spoken to you suddenly praises your code in public, asks about your weekend, and a week later asks you to take over their messy migration "because you're the only one careful enough".
- **A:** Liking and a thumbscrew (your pride in being careful), used to hand you unwanted work. ‖ best ‖ Yes: liking built quickly (inf-04) and your self-image as careful turned into a lever (law 33). Counter: separate the compliment from the ask, and decide on the work alone.
- **B:** Authority. ‖ poor ‖ There's no claim of expertise or title here.
- **C:** Selective honesty, the honest gesture before the big ask. ‖ ok ‖ Close: generosity before the ask (law 12) is part of it. The sharpest lever is flattery of the trait they need you to use.

### sc-21 · The offer call
- **Ideas:** fk-08, ns-03, ns-09, law-47
- **Kind:** choose
- **Situation:** You have an offer at 36. Your target is 41, your walk-away 37. On the negotiation call, after your accusation audit and anchor at 44, the recruiter comes back with 40.5 and a joining bonus.
- **A:** Push for 44 again; they moved once, they'll move again. ‖ poor ‖ You're near your target. Squeezing hard now risks the relationship with your future employer and can stall the offer (law 47).
- **B:** "Thank you, that's close. If we can make the base 41 and keep the joining bonus, I can sign this week." ‖ best ‖ A small, precise final step with a clear close (ns-09), at your target, then stop (law 47). Everyone wins.
- **C:** Accept 40.5 straight away. ‖ ok ‖ A good result, and fine to accept. The last small step usually costs nothing to ask for, done warmly.

### sc-22 · Saturday, tired, the plan says a full design
- **Ideas:** ah-16, dw-03, fk-03
- **Kind:** choose
- **Situation:** It's Saturday of week 9. You've been tired all week, slept six hours a night, and feel cynical about the plan. The Saturday design is 3.5 hours.
- **A:** Push through the full 3.5 hours; discipline is what separates people. ‖ ok ‖ Sometimes right, but exhaustion plus cynicism are two of burnout's three marks (fk-03). A forced day can cost two more.
- **B:** Do the 45-minute cold attempt only, then rest properly: a walk, people, an early night. Finish the loop on Sunday if you're fresher. ‖ best ‖ The two-minute rule scaled up: you keep the habit (and the vote), and you recover. Cutting the extras first, never the Saturday design entirely, is rule 8.
- **C:** Skip the weekend entirely and restart Monday. ‖ poor ‖ Two days off with no plan is how one miss becomes a break. Rest, yes, but keep the anchor.

### sc-23 · The idea you want adopted
- **Ideas:** hf-16, hf-14, law-43
- **Kind:** choose
- **Situation:** You want your team to adopt idempotency keys on all payment APIs. The tech lead is lukewarm: "we've never needed them".
- **A:** Write a strongly worded doc listing every incident that idempotency would have prevented. ‖ ok ‖ The data is useful, but a doc that proves the lead wrong makes them defend the status quo.
- **B:** Ask: "We agree a double charge is the worst bug we could ship? And retries happen on timeouts? How do we make sure a retried payment can't charge twice today?" Let the lead arrive at keys. ‖ best ‖ A series of yeses (hf-14) and a question that lets the lead discover the idea (hf-16) win the heart, not just the argument (law 43).
- **C:** Implement it in your service quietly and see. ‖ ok ‖ Demonstration can work (law 9), but on a shared API pattern, shipping it unilaterally can read as going around your lead.

### sc-24 · A week with no Growth
- **Ideas:** ah-19, ah-23, ah-24
- **Kind:** choose
- **Situation:** You missed every Growth session last week; study went fine, but the cards are due and the path hasn't moved. You feel you've "failed" at self-improvement.
- **A:** Do all the missed ideas today to catch up. ‖ poor ‖ The path is a queue, not a debt: there is nothing to catch up. A huge session makes the habit feel like a chore.
- **B:** Do today's normal session, two ideas and the cards due, and in the Sunday review ask what got in the way and what to change. ‖ best ‖ Never miss twice (ah-19), review to fix the system (ah-23), and keep the identity about how you work, not a perfect record (ah-24).
- **C:** Drop Growth until the plan ends; study comes first. ‖ ok ‖ Study does come first, and that's a legitimate choice. But a ten-minute habit is easy to keep, and its payoff (offers, reputation) arrives in the same weeks.
