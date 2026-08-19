# RAID QIX v1.1.0

## Ghost laser-line fix
The thin yellow lines in Random Raid were traced to the legacy `drawRandomBoss()` implementation.
It drew two raw lines whenever the procedural config had `laser=true`, independently from the real
SweepLaser attack. That legacy rendering has been removed. Only actual scheduled SweepLaser entities
can now draw laser warnings or active beams.

## Title / multiplayer
- SOLO MODE removed from the visible title flow.
- Main modes are BOSS MODE and RANDOM BOSS MODE.
- Steam room creation, invite, join-by-code, member list and lobby ID are on the title screen.
- Steam invite uses `Lobby.openInviteDialog()` / overlay invite support when available.
- Boss selection is on the title screen.
- One-player rooms can still start a raid.

## SoundCloud Boss Tracklist
- Add SoundCloud track URLs from the title screen.
- Optional BPM value can be stored per track.
- In Random Boss Mode, the host selects one track from the playlist every time the floor/boss changes.
- The selected URL is sent to lobby members with `bgm-sync`.
- Playback uses SoundCloud's official HTML5 Widget API.
- BGM volume controls SoundCloud widget volume.
- Host/client BGM starts are scheduled with the same short delay for approximate sync.

## Beat visuals
SoundCloud Widget PLAY_PROGRESS drives a visual pulse.
If current track metadata exposes BPM it is used; otherwise the playlist BPM value is used.
The boss and bullets receive a small visual-only vibration on beats. Gameplay collision positions are unchanged.

## Settings
- Master Volume
- BGM Volume
- SE Volume
- PSX Pixelize
- Screen Shake
- Control Mode

Use `start.bat` and `build.bat`.
