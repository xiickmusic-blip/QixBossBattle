# RAID QIX v0.9.1

Combat audit / bug-fix release.

## Fixed
- Random Raid circular AoEs now always advance from warning to impact.
- Lines, cones, donuts and tracking circles now share a reliable warning -> impact -> remove lifecycle.
- Laser warnings now turn into a clearly visible bright damage beam.
- Random Raid now explicitly ticks both circle and non-circle telegraph systems.
- Random bosses now always drift slowly instead of relying on the old bypassed `drift` path.
- Random bosses also always rotate slowly.
- Rotating lasers now have a strong chance to appear in Random Raid and use the shared laser module.

## Root causes fixed
v0.8 bypassed the old random-boss updater. That meant movement and some telegraph ticking were skipped.
Circle AoEs could be spawned by Random Raid but never advanced to their impact state.
The laser module used a short line-active state with weak visual feedback, so it could appear to be only a thin warning line.

## Validation
All renderer JavaScript files pass `node --check`.

Use `start.bat` to run and `build.bat` to build.
