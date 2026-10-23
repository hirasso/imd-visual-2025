# For the AGENTS

Static [Astro](https://astro.build/) site: the animated visual for the IMD Ferienkurse. TypeScript, Alpine.js, GSAP, Three.js (`SVGRenderer`, no WebGL). No backend, no DDEV.

It runs standalone and as an iframe inside the main IMD WordPress site (`../content/themes/imd/templates/fk-animation.php`, wrapped by the `FKAnimationWrapper` Alpine component, which forwards `pointermove` and `scroll:progress` messages). In development the WP site embeds `http://localhost:4321/` if reachable, else `/imd-visual-2025/dist/`.

## Local development

```bash
pnpm install
pnpm watch     # Astro dev server on http://localhost:4321
```

## Key commands

```bash
pnpm build     # production build into ./dist/
pnpm preview   # serve ./dist/ locally
pnpm deploy    # build + rsync to $DEPLOY_DESTINATION (.env)
```

No type-check, formatter, linter or tests are installed. Don't add them without asking.

## Code style

- derive from the existing code
- prefix getters with `get`; methods that request data from a remote API may use `fetch`
- keep comments as short as possible
- do not add comments if not really required
- only use languages I know. No python please
- Use `/** */` block comments (not `//`) for anything that's not an "end of the line" comment
- docblocks state _what_ a thing does, never _why_ it does it or why it was built that way (exception: Inline docs like e.g. "using the raw value because..."); no {@see} cross-references at all; skip the docblock entirely if the name is self-explanatory; hard ceiling of 3 lines, shorter preferred.
- Exception: operational knowledge that would cause a bug if lost (a browser quirk, a library gotcha, "deliberately absent" behavior) — relocate it to a new ADR under `docs/adr/` (only if definitely important, max terse like inline comments), then trim the code docblock to the rule above.

## Before making changes

- if the change is big, always first propose what you are planning, even if not in plan mode
- performance matters: the visual animates every frame and runs embedded on a content page. Keep GPU/compositor load low (layer sizes, `will-change`, per-frame DOM writes)

## After making changes

- Keep inline code comments as short as possible. Be extremely concise and sacrifice grammar for the sake of concision
- Mark issues that are solved by the current edit as `done` (see further down, #issue-tracker and #triage-labels).
- run `pnpm build` to make sure the site still builds

### TypeScript

- Keep DRY! Ask if unsure.
- Prefer fewer, bigger modules: bundle related functionality in one file instead of many small ones
- Components live in `src/scripts/components/<Name>/<Name>.ts` and are registered in `src/scripts/alpine.ts`
- Prefer GSAP helpers (`gsap.quickTo()`, `gsap.quickSetter()`, `gsap.ticker`) over hand-rolled animation loops

## Project structure

| Path | Purpose |
|------|---------|
| `src/pages/index.astro` | The only page |
| `src/layouts/Layout.astro` | HTML shell |
| `src/components/` | Astro components (`Scene`, `Room`, `Object`) |
| `src/scripts/alpine.ts` | Alpine entrypoint, registers components |
| `src/scripts/components/` | Alpine components (`Scene`, `Room`, `Ball`, `Float`) |
| `src/scripts/utils.ts` | Shared helpers |
| `src/styles/style.css` | Global styles |
| `src/assets/` | Images, preprocessed by Astro |
| `dist/` | Build output (deployed, also embedded by the WP site in dev) |

## Do not touch without explicit request

- `.env` file
- the `deploy` script, and never run `pnpm deploy`
- the embedding WordPress site outside this folder (`../content/…`)
- No commits without explicit request
- do not edit TODO files

## Agent skills

### Issue tracker

Issues and PRDs live as markdown files under `.scratch/<feature-slug>/`.

### Triage labels

Canonical vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`).

Always move `Status: done` issues into `.scratch/done`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root.

### Charts from the /improve-codebase-architecture skill

Store them inside `.scratch/charts` folder
