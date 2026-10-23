# Issue: Windows bluescreen (0xCA) when viewing the visual in Firefox

Status: ready-for-human (deploy, then client confirms, file Bugzilla report)

## Report (client, 2026-10)

- Opening https://internationales-musikinstitut.de/de/ferienkurse/ crashes the client's Windows PC, which also drops their connection to the city network. This happened more than once.
- Error: `PNP_DETECTED_FATAL_ERROR (0xCA)`
- Browser: Firefox 158.0.1 (64-bit), which was current at the time ("Firefox ist aktuell"), so an outdated browser is **not** the cause.
- Firefox on macOS (Rasso) and Chrome (client) work fine. Can't reproduce on macOS.
- The ferienkurse page embeds this project as an iframe: `content/themes/imd/templates/fk-animation.php` in the main site, wrapped by `FKAnimationWrapper`, which forwards `pointermove` and `scroll:progress` messages to the iframe.

## Analysis

- 0xCA is a Windows kernel bugcheck raised by a driver. A web page can't cause it alone; at most it triggers a driver bug, most likely in the graphics driver under compositor load. The lost network connection is probably just the crash and reboot.
- No WebGL here. Three.js `SVGRenderer` plus CSS transforms.
- ~~`.ball svg` 200vmax layers~~: dead CSS, no `.ball` element exists. Objects are small `<img>`s (30/10/5vmin).
- Main load: the room. `SVGRenderer` re-writes the path `d` strings of a 150vw×150vh SVG every rAF, so it gets re-rasterized every frame. Firefox rasterizes SVG on the CPU and uploads it as a texture → constant texture churn on the GPU driver. It also sat in a `will-change: transform` layer scaled/rotated by `Float`.
- Nothing paused when the iframe was off-screen or the tab hidden. Ball had no reduced-motion handling.

## Fixes (implemented, not deployed)

1. Single loop on `gsap.ticker` (`onTick()` in `utils.ts`) for Ball + Room, capped at 30fps, movement scaled by delta time.
2. Loop + all gsap animations pause while the tab is hidden or the iframe is off-screen (`Scene.ts`, IntersectionObserver against the parent viewport, no WP changes needed).
3. Ball respects `prefers-reduced-motion`.
4. Removed dead `.ball` CSS.
5. No `will-change` on the room's `Float` wrapper (`willChange` option).

Verified in Chromium (Firefox can't launch in the sandbox): runs when visible, fully stops off-screen, resumes without jumps, no errors.

## Root cause (confirmed)

Reproduced on macOS with Firefox 158.0.1 (aarch64): hang + coil whine on pointermove, then heavy frame drops. Code unchanged since 2024-12, so it is a Firefox regression. Bisected with URL flags: any CSS scale or rotation of the room SVG (Float wrapper or the SVG itself) triggers it; translate only is fine.

Fix: room `Float` translates only (`factors.scale: 0`). See `docs/adr/room-translate-only.md`.

Todo: minimal repro for Bugzilla.

## Ask the client (to confirm the cause)

- Update the graphics driver and run Windows Update.
- Firefox → Settings → General → Performance → turn off hardware acceleration, restart, and open the page again. If it's stable, the graphics driver is confirmed.
- Send the graphics section of `about:support` and the GPU model.

## Deploy

`pnpm deploy` (build + rsync, uses `.env`).
