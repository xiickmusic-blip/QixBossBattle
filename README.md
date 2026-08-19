# RAID QIX v0.7.0

Electron + Steam P2P QIX boss raid prototype.

## v0.7.0
- Added triangular territory-breaker projectiles.
- Triangle bullets explode when they hit captured territory and erase a circular chunk back into danger space.
- GRAVITY MAW now demonstrates triangle volleys.
- Added reusable attack-module registry with radial, aimed, ricochet, triangle breaker, AoE telegraph, spiral, cross, gap-ring, needle, and heavy-orb attacks.
- Added RANDOM RAID endless mode from the title screen.
- Each floor procedurally generates a boss name, colors, attack-module combination, attack values, speed, timing, movement traits, and optional gravity/laser traits.
- Module count and pressure scale upward with floor.
- Clearing all cores advances to the next floor without ending the run.
- HP persists between random-raid floors. The run ends on player death.
- Best random-raid floor is persisted locally.
- Existing keyboard, click-move, and cursor-follow controls remain available.

Use `start.bat` to run and `build.bat` to build.
