# Installing LLM-GTD

LLM-GTD is a Claude Code plugin, `gtd`. This repo is its marketplace. The vault files it writes live in [`plugins/gtd/vault/`](plugins/gtd/vault/), and the skills in [`plugins/gtd/skills/`](plugins/gtd/skills/).

It works on a **fresh vault** or an **existing one**. Everything it writes lives under `GTD/` and `Pocket/`, plus `Templates/GTD Item.md`, `Templates/Pocket Note.md` and `clipper/`. It stops and asks rather than overwrite anything already there, and it never touches `.obsidian/`.

## Steps

1. **Install two Obsidian plugins.** Settings → Community plugins → install and enable `Base Board` and `Templater`. `Base Board` draws the boards; use version **2.6.0 or newer** (older versions clash with Obsidian 1.14's own kanban) on Obsidian **1.10.2 or newer**.
2. **Install the Claude Code plugin** for this vault only. In a terminal at the vault root:

   ```sh
   claude plugin install gtd --marketplace cypiswhywhy/llm-gtd --scope project
   ```

   `--scope project` records the plugin in the vault's `.claude/settings.json`, so the `/gtd:*` commands appear only in this vault.
3. **Run `/gtd:install`** in Claude Code at the vault root. It writes the schema (`CLAUDE.md`), both boards, the templates and the clipper templates.
4. **Flip one switch** — no prompt can do it, it lives in Templater's settings. Settings → Templater → turn on **Trigger Templater on new file creation**, then under **Folder Templates** add folder `GTD/Items` → template `Templates/GTD Item.md` and folder `Pocket/Notes` → template `Templates/Pocket Note.md`. Now any note you create in either folder, from a board's `+` button too, gets the schema frontmatter. The templates fill in only the keys a note is missing, so a card added to the `next` column stays in `next`.

Card order inside a column is the plugin's own `kanban_order` property, **not** the Bases "Sort" setting — `Base Board` ignores that on a kanban view by design. Every new item is stamped with minus its creation timestamp, so the newest sits at the top of its column. Dragging still works and takes precedence.

## Updating

- **Installed with the plugin:** in a terminal, in the vault folder, run `claude plugin marketplace update llm-gtd`, then `claude plugin update gtd@llm-gtd --scope project`. Start Claude Code again and run `/gtd:update` to migrate the vault's data. From plugin 1.2.0 on, `/gtd:update` checks for a newer plugin and offers to run those two commands for you.
- **Installed before the plugin** (schema v14 or older): run the vault's old `/gtd-update`, or paste [`update.md`](update.md). Its last migration, v15, moves the vault onto the plugin.
