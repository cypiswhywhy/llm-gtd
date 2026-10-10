---
name: project
description: Plan a multi-step project and keep only its next action on the board. Use when the user names an outcome too big for one item (a renovation, a house purchase, a holiday, learning a skill, quitting a habit), asks to break a project down, or asks what the next step of a project is. With no argument it sweeps every active project and promotes the next step of any that has room.
---

# GTD projects — one outcome, one next step

A project is an outcome that needs more than one action. Its plan lives as a checklist in a
`GTD/Projects/` note; only the active step exists as an item in `GTD/Items/`. Follow the schema and
the rules in the vault's `CLAUDE.md` — in particular the `## Projects` section and the
propose-then-apply rule.

Why it works this way: a twenty-step plan rendered as twenty cards is unusable. It reads as twenty
separate obligations, the board stops being a place where anything gets decided, and the project
stalls precisely because all of it is visible at once. **One visible step per project is the whole
feature** — never promote more steps than the project's `wip`, however reasonable it seems.

## Mode A — plan a project (`/gtd:project <description>`)

First look in `GTD/Projects/` for a note that matches the description. If one is there, this is a
**re-plan**: load it, skip to step 3, and add or rewrite **unchecked steps only** — never edit a
`- [x]` line.

1. **Agree the outcome.** Ask for one sentence saying how the user will know the project is
   finished. Push back on outcomes nobody can observe: "get fit" → "run 5 km without stopping".
   That sentence becomes `outcome:` and the `## Outcome` body section.

2. **Ask only what you can't work out yourself.** At most three questions, and only ones that
   change the plan — a deadline, a budget, a constraint that deletes whole steps. Don't interview.

3. **Draft the steps** — 5 to 12, in order, each one:
   - a **physical action** beginning with a verb, startable without deciding anything first.
     "Research studios" is not a step; "open Instagram, search #tattoowarsaw, paste 3 profiles into
     the project note" is. Word it the way the human would write it on their own list (rule 8 in
     `CLAUDE.md`) — the step text becomes the item's name.
   - **one sitting**, with a rough estimate appended as `~10m`, `~45m`, `~2h`. Anything over about
     two hours is really two steps — split it.
   - a **decision** where a decision is what's needed ("pick a studio and pay the deposit ~30m").
     An unmade choice blocks a project exactly as well as an undone task.
   If the project has an external date (a holiday, a deadline), order the steps backwards from it
   and say which step has to start when.

4. **Propose.** Show the outcome, the numbered steps with estimates, and the total. Ask the user to
   confirm, cut, or reorder. Wait — write nothing yet.

5. **Apply on confirmation:**
   - Create `GTD/Projects/<Project name>.md` with the project frontmatter from `CLAUDE.md`
     (`status: active`, `wip: 1`, today's `created`/`updated`, the `outcome`, and tags reused from
     the vault's existing vocabulary) and the `## Outcome` / `## Steps` / `## Notes` body. Create
     `GTD/Projects/` if it doesn't exist. If the note already exists and this was not a re-plan,
     STOP and report the collision — never overwrite.
   - Promote the **first step only** (see Promotion below).
   - Append to `GTD/Log.md`: `YYYY-MM-DD HH:MM [project] "<Project>" created (N steps) → "<first step>"`.

6. **Report** in three lines: the outcome, the first step, and how long that step takes. Nothing
   else — the plan is in the note, and the user only has to do one thing.

## Mode B — sweep (`/gtd:project` with no argument)

1. **Collect** every note in `GTD/Projects/` with `status: active`.
2. **Count each project's live steps**: items in `GTD/Items/` whose `project` points at that project
   and whose `status` is not `done`.
3. **Per project, work out what's needed:**
   - A promoted step's item is now `status: done` → tick its checklist line first: `- [x]` plus
     `✅ ` and the item's `updated` date.
   - Live steps below `wip`, unchecked steps remaining → propose promoting the first unchecked one.
   - Live steps at `wip` → nothing to propose; just name the step already on the board.
   - No unchecked steps left → propose closing the project (`status: done`). If its `## Notes` hold
     research worth keeping, offer the distillation from `/gtd:review`'s knowledge check.
   - The live step's item untouched for more than 14 days → say so and ask whether the step is too
     big. Offer to split it into two smaller checklist lines and promote the first.
4. **Propose one table** covering all projects: `#` (rule 9 in `CLAUDE.md`), project, step just
   completed, proposed next step, estimate. Ask the user to confirm all / pick exceptions by number.
5. **Apply** confirmed promotions, ticks and closures. Bump `updated` on every project note whose
   content changed. Append one `[project]` line per project to `GTD/Log.md`.
6. **Report.** Lead with the promoted steps as a short list the user can act on today. Then one line
   each for any `waiting` projects (blocked, and on whom) and any `someday` projects, so a stalled
   project can't hide — but propose nothing for those.

## Promotion — the one operation both modes share

1. Create the item note in `GTD/Items/`, named after the step text with the `~estimate` stripped,
   carrying the item frontmatter from `CLAUDE.md`: `status: next`, today's `created`/`updated`,
   `tags` inherited from the project, empty `source:`, `project: "[[<Project name>]]"`, and
   `kanban_order` set to minus the current time in milliseconds.
2. `status: next`, not `focus`: `focus` is the human's own shelf for what they are doing today, and
   a promotion has no business filling it. The user drags the card over when they pick it up.
3. Body: the step text in full, its estimate, and a `Part of [[<Project name>]]` line. Copy across
   whatever detail from the project's `## Notes` the step needs — the point is that the card can be
   acted on without opening the project note.
   If the step produces something — a list, a number, a decision — name the section of the project
   note where that output lands: working material goes under `## Notes`. Never send it to
   `## Outcome`, which holds nothing but the definition of done.
4. Append `→ [[<Item name>]]` to that step's checklist line in the project note. Link by **note
   name, never by path**: review moves done items into `GTD/Archive/` and a name-only wikilink
   survives the move.
5. If an item of that name already exists in `GTD/Items/` or `GTD/Archive/`, don't collide
   silently — propose a distinguishing name (append the project, e.g. `Call 3 studios (Tattoo)`).
6. Never promote a step already marked `- [x]`, and never take a project above its `wip`.

## Guard clauses

- **Never delete** a project note or a checklist line. An abandoned project is `status: done` with a
  `Cancelled: <reason>` line in the body; an abandoned step is `- [x] ~~text~~ (cancelled: reason)`.
- A done project **stays in `GTD/Projects/`** — it records how the thing got done. Projects are
  never archived; `GTD/Archive/` is for items.
- Never write a `kanban_order` into a project note: projects are not on the board.
- Never touch `GTD/Board.base`, `.obsidian/`, or any note outside `GTD/`.
