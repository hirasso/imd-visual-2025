# Room Float: translate only

The room's `Float` uses `factors.scale: 0`, so it only translates. No scale, no rotation, no counter-rotation of the SVG.

Firefox 158 (Windows + macOS) hangs on pointermove when the room SVG, which `SVGRenderer` redraws every frame, gets a CSS scale or rotation. Translate is fine. On Windows it led to a `PNP_DETECTED_FATAL_ERROR (0xCA)` bluescreen. See `.scratch/firefox-bluescreen/ISSUE.md`.

Don't re-enable scale/rotation on the room without testing in Firefox.
