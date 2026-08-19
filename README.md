# RAID QIX v2.0.0

Full renderer/UI refactor.

Runtime renderer is flattened to six files:
- `data.js`
- `core.js`
- `combat.js`
- `render.js`
- `systems.js`
- `ui.js`

The old patch chain (`game-v05.js` through `game-v129.js`) is not used in v2.

Gameplay retained:
- QIX territory capture
- six fixed bosses
- all-cores-required victory
- Random Boss endless mode
- circular / line / cone / donut / tracking telegraphs
- rotating sweep lasers
- triangle territory-breaker projectiles
- procedural attack library
- Steam P2P room flow
- SoundCloud boss playlist
- procedural charms, rarity, inventory, equip, five-item fusion
- keyboard / click / cursor-follow controls
- PSX pixel rendering

UI is rebuilt from scratch in a rave flyer / street graphic direction with a responsive 16:9 layout and one UI controller.

`start.bat` runs the game.
`build.bat` creates a Windows portable build.
