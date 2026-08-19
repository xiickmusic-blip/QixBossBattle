# RAID QIX v1.2.1

## Music flow
- SoundCloud BGM seeks to 0 at every boss start.
- Boss-fight music loops from the beginning while the raid is active.
- Random Boss Mode still chooses a new playlist track per floor.
- Returning to the title fades BGM out and pauses it.
- On defeat the SoundCloud widget is progressively ducked while a low-passed procedural layer rises, creating a muffled / high-cut-like defeat transition before the title fade.

## Retro procedural SE
WebAudio synthesizes original retro bullet-hell / RPG-style effects for:
- laser activation
- circular AoE detonation
- player damage
- successful QIX line connection
- skill activation
- boss defeat

BGM Volume controls SoundCloud, SE Volume controls the procedural sound effects, and Master Volume scales both.

## Title / multiplayer
- Single-screen title composition with no title scrolling.
- Left navigation rail for BOSS MODE / RANDOM BOSS / LOADOUT / SETTINGS.
- SoundCloud tracklist and participants are larger panels.
- Session code, ROOM, INVITE, COPY and JOIN controls live in the lower-right corner.
- Starting a raid auto-creates a Steam room if one does not exist.

## Display
The Electron window is not manually resizable. Settings provide only 16:9 presets:
- 960x540
- 1280x720
- 1600x900
- 1920x1080
- Fullscreen

## v1.2.1 equipment / inventory
- Removed the layered legacy charm-render path from the active Loadout screen.
- Equipment now has two explicit slots.
- Click an equipped slot to unequip it immediately.
- Item detail has explicit SLOT 1 / SLOT 2 buttons plus a dedicated UNEQUIP button.
- Charms can be dragged directly into either equipment slot.
- Inventory uses a dense square-slot grid inspired by Minecraft-style inventories.
- At least 54 slots are shown, expanding in rows of 9 as the collection grows.
- Slots show rarity color, effect count, rarity rank and equipped-slot marker.
- Single click shows details, double-click equips/unequips, and drag-and-drop remains available for fusion.

Use `start.bat` to run and `build.bat` to build.
