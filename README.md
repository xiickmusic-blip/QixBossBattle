# RAID QIX v2.0.1

Hotfix after the v2 flat renderer refactor.

## START RAID transition fix

Root cause:
`resetGame()` and Random Boss setup still called the legacy global `updateHud()`.
The v2 UI renamed the implementation to `updateHudV2()`, so clicking START did this:

1. `state.mode` became `raid`
2. reset began
3. `updateHud()` threw `ReferenceError`
4. `UI.showGame()` was never reached
5. the game loop continued behind the title, which is why damage SE could be heard

v2.0.1 restores a canonical `updateHud` hook and explicitly aliases it to `updateHudV2`.

The start sequence is also reordered:
- create room
- prepare music
- initialize boss/game state
- hide menu / reveal game canvas
- only then enable `state.mode = raid`
- play BGM / send network start

If initialization fails, the title remains visible and a readable error panel is shown.

## Additional audit fixes
- fixed Random Boss floor setup accidentally recursing into itself
- restored Boss 5/6 runtime timer state
- replaced old fixed-charm reward DOM path with the procedural v2 reward queue
- added missing random attack category sets
- added global runtime error / unhandled promise reporting

## Runtime architecture
Renderer remains exactly six JavaScript files:
- data.js
- core.js
- combat.js
- render.js
- systems.js
- ui.js

No v05-v129 patch stack is loaded.
