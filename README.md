# RAID QIX v1.2.9

UI audit / interaction repair release.

## Audit findings
The project had accumulated many version-patch scripts that override the same UI functions and handlers.

Examples from the v1.2.8 tree:
- title mode handlers were assigned multiple times
- START was rebound multiple times
- reward and fusion actions had multiple handler generations
- screen visibility was controlled by `.active`, `openScreen()`, inline `!important`, Surface Controller code and later watchdog code at the same time
- some UI routing still depended on early per-element `.onclick` assignments

That architecture can produce a visible button whose final event route no longer matches the final screen controller.

## Fix: single UI Kernel
v1.2.9 adds one final delegated UI controller loaded last.

It owns:
- Title -> Boss / Random mode
- Boss selection
- Start
- Loadout
- Settings
- Back navigation
- Steam room/create/join/invite/copy
- SoundCloud ADD
- Loadout Gear/Fusion tabs
- Fusion button
- Reward open/continue
- Screen visibility

Recognized controls are intercepted in capture phase, so old stacked `.onclick` handlers cannot double-run or override the final behavior.

## Screen routing
The UI Kernel directly controls display / visibility / pointer-events for each menu surface.
Obsolete mutation-observer UI repair is disabled.

## Performance
v1.2.8 cache and menu-render optimizations are retained.

## Verification
All JavaScript files pass `node --check`.

Use `start.bat` to run and `build.bat` to build.
