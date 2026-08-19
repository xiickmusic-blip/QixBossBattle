# RAID QIX

Electron-based QIX boss raid prototype with Steam lobby + P2P multiplayer.

## Current features

- Title screen with Solo, Lobby, Settings, and Loadout
- Three data-driven bosses: VOID BEAST, RICHOCHET, GRID SERAPH
- QIX territory capture combat and relic boss damage
- One skill slot and two charm slots
- Persistent charm inventory/loadout
- Boss-clear treasure chest awarding one random charm per player
- Steam friends-only lobby creation and lobby-ID joining
- Steam P2P packet transport through `steamworks.js`
- Remote player position and drawing-line synchronization
- Host-authoritative boss attacks, boss HP, and projectile snapshots
- Client capture-grid merge through the host
- Client relic damage forwarded to the host
- Offline fallback for UI/gameplay development

## Quick start on Windows

Double-click:

- `start.bat` — installs dependencies if needed, then runs `npm start`
- `build.bat` — installs dependencies if needed, then runs `npm run build`

Or use npm directly:

```bash
npm install
npm start
npm run build
```

The Windows portable build is written to `dist/`.

## Steam development

`steam_appid.txt` currently contains Spacewar App ID `480` for local Steam multiplayer testing. Replace it with the real RAID QIX App ID before shipping.

You can also override the development App ID for the current process with the environment variable `RAID_QIX_STEAM_APP_ID`.

Steam integration is isolated in `src/steam.js`. The current implementation targets the API exposed by `steamworks.js` 0.4.x: Steam lobby creation/join, P2P packet send/read, P2P session acceptance, and Steam callbacks.

## Multiplayer model

The lobby owner acts as raid host.

- Every player simulates their own movement and personal HP.
- Players send position, drawing line, and HP snapshots roughly every 80 ms.
- The host generates boss attacks and broadcasts boss/projectile state roughly every 100 ms.
- A client's completed QIX capture is sent to the host and merged into the shared grid.
- Relic damage caused by a client is sent as a reliable boss-damage packet to the host.
- The host decides boss death and broadcasts raid clear.

This is the first playable network model. Interpolation, reconnection, host migration, packet versioning, and anti-cheat validation are appropriate next hardening steps.

## Extending bosses

Add a boss entry to `src/renderer/game-data.js` and implement its attack identifier in `bossAttack()` in `src/renderer/game.js`. Shared HP/UI/reward systems consume the boss definition automatically.

## Extending charms

Charms are data entries with a `modifiers` object. Existing modifiers are composed centrally by `modifiers()` in `game.js`. New modifier families can be added by defining a key and consuming it at the appropriate gameplay hook.

## Packaging note

`electron-builder` is configured for a Windows portable executable. `steamworks.js` is unpacked from ASAR because it contains native binaries. Test the packaged build with Steam running before distributing a release build.
