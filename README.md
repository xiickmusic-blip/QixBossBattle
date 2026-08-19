# RAID QIX

Electron-based QIX boss raid prototype with a Steam multiplayer adapter.

## Current features

- Title screen with Solo, Lobby, Settings, and Loadout
- Three data-driven bosses
  - VOID BEAST
  - RICHOCHET
  - GRID SERAPH
- QIX territory capture combat and relic boss damage
- One skill slot
- Two charm slots
- Charm modifiers for movement speed, max HP, cooldown, drawing speed, relic damage, and death-save charges
- Boss-clear treasure chest that awards one random charm
- Local inventory/loadout persistence through `localStorage`
- Steam lobby/P2P adapter boundary through the Electron preload bridge
- Offline fallback for UI/gameplay development

## Run

```bash
npm install
npm start
```

## Steam development

The current adapter initializes Steamworks with Spacewar App ID `480` for development. Replace this with the real App ID before release.

The Steam implementation is intentionally isolated in `src/steam.js`. The current renderer protocol already sends lobby/game packets, but the final Steam Networking Messages/Sockets transport must be wired against the exact `steamworks.js` version selected for production.

## Extending bosses

Add a boss entry to `src/renderer/game-data.js` and implement its attack identifier in `bossAttack()` in `src/renderer/game.js`. Shared HP/UI/reward systems automatically consume the boss definition.

## Extending charms

Charms are data entries with a `modifiers` object. Existing modifiers are composed centrally by `modifiers()` in `game.js`, making new equipment straightforward. For entirely new effect families, add a modifier key and consume it at the appropriate gameplay hook.

## Multiplayer architecture

The game uses a host-oriented protocol. Lobby creation/joining lives in the main process and renderer gameplay communicates through a narrow preload API. Boss selection/start packets are already represented; authoritative state synchronization and remote-player rendering are the next production step.
