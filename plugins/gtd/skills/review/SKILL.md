---
name: review
description: GTD weekly review / lint pass — surface stalled projects, flag stale items, archive old done items or move the ones worth keeping to Pocket, resurface someday items, spot duplicates. Use when the user asks for a review, weekly review, cleanup, or "what's rotting".
---

# GTD review (lint pass)

A maintenance sweep over `GTD/Items/` and `GTD/Projects/`, in the spirit of llm-wiki's lint operation. Follow the schema and rules in the vault's `CLAUDE.md`. Report first; apply only what the user confirms.

## Checks

Read all notes in `GTD/Items/` and every project note in `GTD/Projects/`, then evaluate (item thresholds by `updated`, project thresholds by the derived last-moved date in check 1, both relative to today):

1. **Stalled projects** — read every note in `GTD/Projects/` with `status: active` and work out when it last *moved*: the latest of the most recent `✅ YYYY-MM-DD` in its `## Steps` checklist, the `updated` of its live step item(s), and the project's own `created` (for one that has never moved at all). Nothing in **14 days** → stalled. A project already at `status: waiting` counts as stalled after **30 days** instead — being blocked on someone else is not a permanent condition. `someday` projects are skipped by definition.

   Stalled projects go **first** in the report, one line each: the project, how many days since it moved, and the step it is stuck on. Then ask the one question that matters — *what is blocking it?* — and propose **exactly one** exit, the one the evidence supports, with a word on why:
   - the live step's item is `done` and unchecked steps remain → the project only needs a sweep; say so and point at `/gtd:project`. Don't promote from here; promotion is that skill's job.
   - the live step has sat untouched since the day it was promoted → it is probably too big to start. Offer to split it into two smaller checklist lines.
   - the step text or the project body names another party → `status: waiting` on the project, with who and since when in the body.
   - over 60 days and no exit fits → ask outright whether it is still wanted: `status: someday`, or `status: done` with a `Cancelled: <reason>` line.

   Four exits, one proposal. Offering all four per project turns the review into another pile of decisions instead of the thing that clears them.

   A step item belonging to a **stalled** project is reported here, under its project, and not a second time in checks 3–5. When the project is moving and only one of its steps is cold, the reverse holds: that item is reported by its own check and the project is left alone.

2. **Inbox backlog** — items still `inbox` after 3 days → recommend running `/gtd:triage`.
3. **Stale focus** — `focus` untouched > 7 days → ask: still working on it? Suggest `next`, `waiting`, or `someday`.
4. **Stalled waiting** — `waiting` untouched > 14 days → suggest a follow-up action (ping the other party) or unblocking.
5. **Old next** — `next` untouched > 30 days → honesty check: promote to `focus` or demote to `someday`.
6. **Someday resurface** — pick up to 5 `someday` items (oldest `updated` first) and ask whether any should become `next` or be closed.
7. **Archive** — `status: done` with `updated` older than 30 days → move the file to `GTD/Archive/` (plain `mv`, keep the name).
8. **Hygiene** — items with no tags, near-duplicate titles, frontmatter that deviates from the schema in `CLAUDE.md`.
9. **Keep in Pocket** — for done items the human could want again — content worth keeping (a clipped article, a recipe, research) or an option collected for a decision that can come up again (the holiday places that weren't chosen) — propose moving them to Pocket instead of the archive, with a category and tags from the Pocket vocabulary (every `category` and `tags` value in `Pocket/Notes/`). A row confirmed here is moved exactly as the `## Pocket` section of `CLAUDE.md` describes, and check 7 skips it.

## Output

1. Present a **review report** grouped by check, with a proposed action per finding (skip empty checks), every finding numbered `#1`, `#2`, … in one sequence across the whole report (rule 9 in `CLAUDE.md`). Focus/next/waiting counts plus active/stalled project counts at the top give the board's health at a glance.
2. Ask the user to confirm all / pick exceptions by number.
3. Apply confirmed changes: frontmatter edits, `mv` to Archive or Pocket, bump `updated` on every touched note.
4. Append to `GTD/Log.md`: one `[review]` summary line plus one `[archive]` line per archived item and one `[pocket]` line per item moved to Pocket.
5. Close with the 1–3 things that most need the user's attention this week.
