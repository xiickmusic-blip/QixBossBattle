# RAID QIX v0.6.0

Electron + Steam P2P QIX boss raid prototype.

## v0.6.0
- Added BOSS 6: HEX CHOIR.
- HEX CHOIR reuses the shared circular AoE telegraph system.
- Its main pattern creates a ring of telegraphed AoEs with one visible safe gap.
- Added three control modes in Settings:
  - KEYBOARD / WASD
  - MOUSE CLICK MOVE
  - CURSOR FOLLOW
- CLICK MOVE: left-click a destination and move toward it. Dragging updates the destination.
- CURSOR FOLLOW: continuously move toward the cursor without clicking.
- Right-click activates the equipped skill in both mouse control modes.
- Control mode is persisted in localStorage.
- Existing keyboard controls and E-key skill remain available in keyboard mode.

## Quick start
- `start.bat`
- `build.bat`

Steam development App ID: 480
