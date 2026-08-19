# RAID QIX

Electron-based QIX boss raid prototype with Steam lobby + P2P multiplayer.

## Quick start on Windows

- `start.bat` installs dependencies if needed and runs `npm start`
- `build.bat` installs dependencies if needed and runs `npm run build`
- portable Windows output goes to `dist/`

## Steam development

`steam_appid.txt` currently contains Spacewar App ID `480` for testing. Replace it with the real App ID before shipping.

## Multiplayer snapshot

- Steam friends-only lobby + lobby ID join
- P2P packet transport through steamworks.js
- remote player position and drawing-line sync
- host-authoritative boss attack / HP / projectile state
- capture grid merge through host
- authoritative core destruction synchronized by core ID
- raid-clear reward per player

This is the first playable network model. Interpolation, reconnection, host migration, protocol versioning, and anti-cheat validation are next hardening steps.

## v0.3.0 gameplay/rendering changes

- Bosses only die after every core is destroyed. HP/integrity cannot end the raid early.
- Core placement is sparse, center-weighted, spaced apart, and kept away from the outer border.
- Gameplay uses a fixed 960x540 logical canvas with letterboxing, so resizing does not change the playfield or world proportions.
- PSX-style presentation renders the logical scene through a 320x180 nearest-neighbor buffer with coordinate quantization and scanline texture.
- Boss visuals have richer silhouettes, glow, inner geometry, and distinct rendering per boss.
- GRID SERAPH now has unique rotating cutting lasers and periodic teleportation.
