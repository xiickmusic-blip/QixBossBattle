# RAID QIX

Electron + Steam P2P QIX boss raid prototype.

## v0.4.0

- Boss 3 GRID SERAPH laser rotation slowed from 0.62 to 0.24 rad/s
- arena widened to 876 x 432 inside the fixed 960 x 540 logical frame
- darker playfield/background and stronger captured-territory colors
- new Boss 4: GRAVITY MAW
  - three orbiting gravity wells pull the player
  - periodic expanding shockwave ring
  - its own projectile pattern and visual treatment
- renderer runtime split into base/combat/render/UI files for safer future iteration
- all cores are still mandatory for boss defeat
- PSX 320 x 180 pixelize path and fixed 16:9 rendering remain enabled

## Windows

- `start.bat` installs dependencies if needed, then runs `npm start`
- `build.bat` installs dependencies if needed, then runs `npm run build`
- portable build output: `dist/`

## Steam development

`steam_appid.txt` currently uses Spacewar App ID 480 for local testing. Replace it with the real App ID before release.
