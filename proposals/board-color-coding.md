# Proposal: per-value colors on the GTD kanban board

**Status:** parked, not implemented. Investigated 2026-07-22/23, nothing in the repo changed.
Revised 2026-07-23 with §1.1 (core has no tag-colour feature) and §5 (what a from-scratch plugin
could do).
**Question that started it:** "could each tag have its own color on the GTD kanban board?"
**Short answer:** not for `tags`, not with CSS — but the same effect is available via a
*link-valued* property. Details below.

This file is a cold-start briefing. It is **not** part of the three-way sync set
(`install.md` / `update.md` / `install.html`) — nothing fetches or embeds it, and no schema
version stamps it. Editing or deleting it has no effect on installed vaults.

---

## 1. The blocking finding: tags carry no identity in Bases

`GTD/Board.base` is rendered by the `kanban-bases-view` plugin. Its `createCard` (bundled
`main.js`, upstream `src/components/card.ts`) does not render property values itself — it delegates:

```js
const valueEl = propertyEl.createSpan({ cls: CSS_CLASSES.CARD_PROPERTY_VALUE });
value.renderTo(valueEl, ctx.app.renderContext);
```

So tag rendering is core Obsidian's, and in Obsidian **1.12.7** the Bases render context does:

```js
e.prototype.renderTag = function (e, t) {
  var n = this, i = e.slice(1);
  t.createEl("a", { cls: "tag", text: i });      // no href, no data-*, "#" stripped
  ...
};
```

A tag on a card is therefore `<a class="tag">work</a>` — **every tag pill is DOM-identical apart
from its text**, and CSS cannot select on text. The familiar snippet

```css
a.tag[href="#work"] { color: … }
```

works everywhere else in Obsidian (editor, reading view) only because the *markdown* renderer emits
the `href`. Bases does not. There is no Bases setting, no `.base` key, and no plugin option that
changes this.

### 1.1 Core Obsidian has no per-tag colour feature either

Checked in the 1.12.7 bundle: **zero** occurrences of `tagColor` / `tagColors` / `tagAppearance`.
The only tag styling core knows about is a set of *global* theme variables (≈ offset 179019):

```css
--tag-size: var(--font-smaller);
--tag-color: var(--text-accent);
--tag-background: hsla(var(--interactive-accent-hsl), 0.1);
--tag-border-color: …; --tag-radius: …; --tag-padding-x/y: …;
```

applied by a single rule `a.tag { background-color: var(--tag-background); border: …;
border-radius: var(--tag-radius); color: var(--tag-color); … }` (≈ offset 469724).

Two things follow:

- Tags **already render as pills** — background, border, radius, small font. What's missing is only
  a *per-tag hue*, not the pill shape. Any "make them look like labels" work is already done.
- There is no user-level tag-colour setting for a plugin (or a snippet) to inherit or respect. Any
  colour scheme is entirely the plugin's or the snippet's own invention. Plugins like Colorful Tag
  work by generating `a.tag[href="#x"]` rules — which is exactly the selector Bases doesn't give us,
  so **installing one of those will not colour the board.**

## 2. Why links *are* colorable

Obsidian builds Bases values from frontmatter in `fromFrontMatter`, whose lazy evaluator resolves,
in this order:

```js
t.fromFrontMatter = function (e, n, i) {
  var r = new t(Object.assign({}, i));
  var o = r.lazyEvaluator = function (i, r) {
    if (String.isString(i) && "tags" === i.toLowerCase()) {   // 1. the `tags` KEY is special-cased
      if (vc(r, !0)) return new DW(r);                        //    → TagsValue → renderTag → dead end
      if (String.isString(r)) return new DW([r]);
    }
    if (String.isString(r)) {
      var a = BW.parseFromString(e, r, n.path);               // 2. "[[…]]" → LinkValue
      if (a) return a;
      if (Qc(r)) return new RW(r);                            // 3. URL
      var s = LW.parseFromString(r);                          // 4. date
      if (s) return s;
    }
    var l = zW(r);
    return (l instanceof SW || l instanceof t) && (l.lazyEvaluator = o), l;   // propagates into LISTS
  };
  return r;
};
```

Two consequences:

- `tags` is intercepted before the link branch, so **no rewriting of the `tags` field can rescue it**.
- Any *other* key whose string value looks like `[[…]]` becomes a `LinkValue`, and the evaluator is
  re-attached to list values — so a YAML **list** of wikilinks yields one identified element each,
  the same shape `tags` has on a card today.

`LinkValue.renderTo` → `renderFileLink`, which does:

```js
n.addClass("markdown-rendered");
var l = n.createSpan("internal-link");
… l.setText(…)
l.setAttr("data-href", r);              // ← the hook CSS needs
l.toggleClass("is-unresolved", !i);     // ← target note need NOT exist
```

`data-href` is the link text **exactly as written** (minus any `|alias`), not the resolved path.

## 3. The proposal

Add a second, deliberately **closed-vocabulary** axis alongside `tags` — working name `areas`:

```yaml
areas: ["[[Work]]", "[[Health]]"]
```

Add `areas` to the kanban view's `order:` in `GTD/Board.base`. Resulting card DOM:

```html
<div class="obk-card-property" data-label="note.areas">
  <span class="obk-card-property-label">Areas</span>          <!-- hidden by the existing snippet -->
  <span class="obk-card-property-value">
    <div class="value-list-container">
      <span class="value-list-element markdown-rendered">
        <span class="internal-link is-unresolved" data-href="Work">Work</span>
      </span>
      …
```

Appended to `.obsidian/snippets/gtd-kanban.css` (the snippet that already exists since v3):

```css
.obk-card .internal-link {
  padding: 0 .4em;
  border-radius: .4em;
  text-decoration: none;
  opacity: 1;                                   /* beat .is-unresolved's fade */
  color: var(--pill, var(--text-muted));
  background: color-mix(in srgb, var(--pill, transparent) 15%, transparent);
}
.obk-card .internal-link[data-href="Work"]   { --pill: var(--color-blue); }
.obk-card .internal-link[data-href="Health"] { --pill: var(--color-green); }
```

### Conventions to fix before writing any code

- **Link form.** `"[[Work]]"` → `data-href="Work"` (short, but competes with a same-named note
  anywhere in the vault — harmless, it just resolves). `"[[GTD/Areas/Work|Work]]"` →
  `data-href="GTD/Areas/Work"`, displays `Work`, stays namespaced. **Pick one and never deviate** —
  the CSS keys on the raw string.
- **The target notes do not need to exist.** Unresolved links render fine (`.is-unresolved`), so
  this can be a pure label scheme that writes nothing new into the vault. Only create
  `GTD/Areas/*.md` if the areas should become real MOC notes.
- **`areas` is not `tags`.** `tags` stays open and free-form ("reuse before inventing", CLAUDE.md
  rule 5). `areas` must stay at ~6–8 values, because that is where a palette stops being readable
  and unlisted values fall back to gray.

### Known wrinkles

- **Click target.** The plugin's card click handler bails only on `e.target.closest("a")`, and Bases
  renders internal links as a `span` — so clicking an area pill fires *both* the link handler and
  the card handler; expect the item note to open too. Drag/drop is unaffected.
- **Filters.** Comparisons must use wikilink syntax (`areas.contains(link("Work"))` /
  `area == "[[Work]]"`); `LinkValue.looseEquals` parses a plain string back into a link, but don't
  rely on it without testing.
- **Palette is vocabulary-specific.** The installer cannot know a user's areas. Either it ships a
  commented placeholder palette, or something regenerates the snippet from the areas in use. **This
  is the one genuinely unresolved design question** — see §7.

## 4. Options considered (cheapest first)

| # | Option | Per-value color? | Cost | Verdict |
|---|---|---|---|---|
| 1 | **Per-column accent colors.** Built into the plugin (`--obk-column-accent-color`, color button on the column header, persisted in `columnColors:` — the key already exists in `GTD/Board.base`). | Per *status* only | Zero, UI-only | Do this regardless; it is free |
| 2 | **Uniform tag-pill styling.** `.obk-card .obk-card-property-value a.tag { … }` in the existing snippet. | No — one color for all | ~6 lines of CSS, schema bump to ship | Best legibility-per-effort; independent of everything else here |
| 3 | **Link-valued `areas` property** (§3). | **Yes** | New frontmatter key ⇒ v6 + migration | The recommendation, but not yet |
| 4 | **A "By tag" kanban view** grouping on `note.tags`, then colour the columns per #1. | Per column | One extra view in `Board.base` | Broken by multi-tag items: the plugin's `normalizePropertyValue` stringifies the whole list, so `work, urgent` becomes its own column. Only viable if items carry exactly one tag |
| 5 | **Patch the plugin upstream** — after `renderTo`, walk `valueEl.querySelectorAll("a.tag")` and set `data-tag` from `textContent`. Repo: `xiwcx/obsidian-bases-kanban`, `src/components/card.ts`. | **Yes, for real tags** | ~3 lines + PR + release wait | The *correct* fix if per-*tag* color is what is actually wanted. Worth opening regardless of the rest |
| 6 | **Write our own Bases kanban view plugin.** See §5. | **Yes, for real tags** | Owning a plugin | Technically the best answer, the worst cost/benefit. Only if we'd want to own a kanban view anyway |

## 5. If we wrote the kanban plugin ourselves

Asked separately, worth recording: **yes, per-tag colours (pill background included) are trivial in
a plugin we control.** The blocker is not Bases and not the data model — it is one line of
`xiwcx`'s card renderer, `value.renderTo(valueEl, ctx.app.renderContext)`, which hands the DOM to
core and loses the tag name. A plugin that owns its own rendering simply doesn't delegate:

```js
const tags = entry.getValue("note.tags");           // TagsValue: list of TagValue
for (const t of tags.data) {                        // t.data === "#work", t.lowerTag === "#work"
  const name = t.data.slice(1);
  valueEl.createSpan({ cls: "xk-tag", text: name, attr: { "data-tag": name } });
}
```

From there colour is free — inline style, or `[data-tag="work"]` in CSS. Note from §1.1 that the
pill *shape* already exists in core styling; only hue is being added.

Three ways to assign the hue:

1. **Explicit map in the `.base` YAML** — a `tagColors:` key alongside the `columnColors:` that
   `GTD/Board.base` already carries, edited through a swatch picker reusing the plugin's existing
   column-colour popover. Follows the plugin's own precedent, is per-view, and syncs with the vault.
2. **Hash the tag name to a hue** — `hue = hash(tag) % 360`, then `oklch()` or `color-mix()` against
   `--background-primary` so it survives both themes. Zero configuration, scales past eight tags,
   stable across vaults. Lightness and chroma must be pinned hard or the board turns into confetti.
3. **Hybrid (what to build):** hash by default, explicit overrides win. New tags are immediately
   distinguishable; the handful that matter get chosen colours.

**Cost caveat, and the reason this is ranked last in §4:** option 5's three-line `data-tag` patch
buys the same CSS hook without owning drag-and-drop, swimlanes, quick-add, column colours, the
column/card order persistence, and compatibility with a Bases view API that is still moving. Write
the plugin only if there's an independent reason to own a kanban view.

## 6. Recommendation

1. **Now (free):** colour the six status columns via the plugin UI. No repo change.
2. **Cheap and safe:** option 2 — uniform tag pills — folded into whatever the next schema bump is.
   It is a pure CSS addition to a file the system already owns.
3. **Prototype before committing the repo:** hand-edit three or four items in
   `~/.knowchemy/public` with `areas:`, paste the §3 CSS into that vault's
   `.obsidian/snippets/gtd-kanban.css`, reload Obsidian (Ctrl/Cmd+R), and judge whether the board
   actually reads better. **Do not bump the schema before this test.** If it reads well, it is worth
   a v6; if it just adds noise next to `tags`, drop the whole idea and keep option 1 + 2.
4. **In parallel, no downside:** open the upstream `data-tag` PR (option 5). If it lands, per-tag
   colours become a snippet-only feature and options 3/4 become unnecessary.

## 7. If it goes ahead — implementation checklist

A new frontmatter key is a **schema v5 → v6** change, so the usual invariants apply (see `CLAUDE.md`):

- [ ] `install.md` §1 — add `areas: []` to the schema block; bump `**Schema version: 6.**`
- [ ] `install.md` §2 — add `areas: []` to `Templates/GTD Item.md`
- [ ] `install.md` §3 — `properties: note.areas: displayName: Areas`; add `- areas` to the **kanban**
      view's `order:` (and consider the table views). Remember: `file.name` must stay out of the
      kanban `order:`
- [ ] `install.md` §8 — append the `### v5 → v6` changelog entry: backfill `areas: []` on every item
      in `GTD/Items/` and `GTD/Archive/`, append the CSS rules to the existing snippet, tell the user
      to reload Obsidian
- [ ] `install.md` §9 — bump the `[capture] Vault initialized (schema v6)` log line
- [ ] `update.md` — mirror the §8 changelog entry **identically**
- [ ] `install.html` — mirror both the schema marker and the changelog into the `#prompt-data` JSON
      blob (literal `\n`, `\"`, real `—` em dashes), then re-validate the JSON
- [ ] decide the palette-generation question from §3 before writing the migration
- [ ] optionally teach `/gtd-triage` to propose an `area` alongside tags
- [ ] sync check:
      ```sh
      grep -n 'Schema version: [0-9]' install.md install.html
      grep -c '^\s*### v' install.md update.md
      ```
- [ ] remember pushing to `main` is a live deploy to every installed vault

## 8. Reproducing the evidence

Findings above came from reading two bundles, not from documentation — re-verify if Obsidian or the
plugin has updated since.

```sh
# Obsidian's own bundle — the version in the filename WILL change after an update
ls ~/.config/obsidian/*.asar
python3 - <<'EOF'
d = open('/home/cypis/.config/obsidian/obsidian-1.12.7.asar', 'rb').read().decode('utf8', 'replace')
for pat in ('renderTag = function', 'renderTag', 'fromFrontMatter', 'setAttr("data-href"'):
    i = d.find(pat.replace(' = ', '='))
    print(pat, i)
    print(d[i-200:i+500], '\n')
EOF

# the plugin bundle, in the live vault
grep -o 'obk-card-property[a-z-]*' ~/.knowchemy/public/.obsidian/plugins/kanban-bases-view/main.js | sort -u
```

Relevant offsets in `obsidian-1.12.7.asar` (decoded as text): `renderTag` ≈ 2726453,
`fromFrontMatter` ≈ 2731481, `renderFileLink` ≈ 2724918, `List.renderTo`
(`value-list-container` / `value-list-element`) ≈ 2733939, the `--tag-*` variable block ≈ 179019,
the `a.tag { … }` rule ≈ 469724.

For §1.1, the null result is the finding — re-run it if Obsidian ships a tag-colour feature:

```sh
python3 -c "
d = open('/home/cypis/.config/obsidian/obsidian-1.12.7.asar','rb').read().decode('utf8','replace')
for p in ('tagColor','tagColors','tagAppearance','tag-color'): print(p, d.count(p))"
# expected: 0 0 0 17  — the 17 are all theme variables / .nav-file-tag, none per-tag
```

---

## How to resume this in a new session

Paste roughly:

> Read `proposals/board-color-coding.md` in this repo. I want to do §6 step 3 — the hand
> prototype in `~/.knowchemy/public` — before deciding on a v6.

Everything needed is in this file; the investigation does not have to be redone unless Obsidian's
`renderTag` has changed.
