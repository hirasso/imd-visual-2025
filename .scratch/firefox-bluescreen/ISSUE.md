# Issue: Windows bluescreen (0xCA) when viewing the visual in Firefox

## Report (client, 2026-10)

- Opening https://internationales-musikinstitut.de/de/ferienkurse/ crashes the client's Windows PC, which also drops their connection to the city network. This happened more than once.
- Error: `PNP_DETECTED_FATAL_ERROR (0xCA)`
- Browser: Firefox 158.0.1 (64-bit), which was current at the time ("Firefox ist aktuell"), so an outdated browser is **not** the cause.
- Firefox on macOS (Rasso) and Chrome (client) work fine. Can't reproduce on macOS.
- The ferienkurse page embeds this project as an iframe: `content/themes/imd/templates/fk-animation.php` in the main site, wrapped by `FKAnimationWrapper`, which forwards `pointermove` and `scroll:progress` messages to the iframe.

## Analysis

- 0xCA is a Windows kernel bugcheck raised by a driver. A web page can't cause it alone; at most it triggers a driver bug, most likely in the graphics driver under compositor load. The lost network connection is probably just the crash and reboot.
- No WebGL here. Three.js `SVGRenderer` plus CSS transforms, so the load is in compositing and rasterizing large layers:
  - `src/styles/style.css`: `.ball svg` is **200vmax × 200vmax**. At 1080p that's 3840×3840 px, about 59 MB of GPU texture per ball. There are 3 balls (`src/components/Scene.astro`). Each ball element gets `will-change: transform` and a new rotate/translate every frame (`Ball.ts`).
  - The room SVG (`.room`, 150vw×150vh) is re-rendered with `SVGRenderer` every rAF (`Room.ts`), which replaces the SVG path DOM every frame.
  - `Ball.ts` `move()` schedules the next rAF even while `paused`, and nothing respects `prefersReducedMotion()`.
  - Nothing pauses when the iframe is off-screen or the tab is hidden. Browsers throttle hidden tabs, but not an off-screen iframe on a visible page.

## Proposed fixes (not yet approved; discuss before changing code)

1. **Shrink the ball SVGs** to the size they actually need, or clip them. Find out why 200vmax was used: was it for rotating without visible edges?
2. **Pause all loops when invisible**: `visibilitychange`, plus the parent page telling the iframe whether it's in the viewport (via the existing postMessage channel or an IntersectionObserver in `FKAnimationWrapper`).
3. **Respect `prefers-reduced-motion`** in `Ball.ts` (Room and Float already do).
4. Stop the Ball rAF loop entirely while paused instead of re-scheduling.
5. Optional: cap the frame rate (e.g. 30fps). The motion is slow (speeds of 0.02–0.05), so this would hardly be visible.
6. Optional: render the room only when the rotation or tilt actually changes.

## Ask the client (to confirm the cause)

- Update the graphics driver and run Windows Update.
- Firefox → Settings → General → Performance → turn off hardware acceleration, restart, and open the page again. If it's stable, the graphics driver is confirmed.
- Send the graphics section of `about:support` and the GPU model.

## Deploy

`pnpm deploy` (build + rsync, uses `.env`).
