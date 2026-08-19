# RAID QIX v0.9.2

## Laser fix
The old random rotating laser was actually a static Line AoE snapshot. It could appear as a thin stationary line and disappear without looking like a fired laser.

v0.9.2 adds a real persistent SweepLaser entity:
- dashed warning rays
- warning -> active transition
- bright thick damage beams
- beams rotate continuously while active
- 2 / 3 / 4 arm variants
- randomized slow angular speed
- reusable by any boss and Random Raid

## Random Raid pacing
Random Raid now uses an attack scheduler instead of firing whichever AoE is available immediately.

Floor 1 starts around 1.15 to 1.75 seconds between mechanics. As floors increase the interval gradually shortens, with a lower bound so it does not become impossible. Area-heavy mechanics get extra recovery time, and repeated area attacks bias the next selection toward bullet or movement mechanics.

## New reusable gimmicks
- Broken bullet ring with safe gaps
- Two-safe-quadrant attack
- Prediction feint
- Clock-position AoEs
- Footstep / trail AoEs
- In -> Out -> In combo
- Double spiral barrage
- Alternating stripe swap
- Boss dash movement mechanic
- Orbiting satellite burst
- Persistent rotating sweep lasers

Random bosses now draw from a larger attack pool and use 4-9 attack types depending on depth.

## Movement
Every Random Raid boss is explicitly assigned a visible slow drift speed of 6-14 units/sec. Bosses bounce at arena edges and can occasionally use the separate dash gimmick.

## Validation
All renderer JavaScript files pass `node --check`.

Use `start.bat` to run and `build.bat` to build.
