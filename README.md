# RAID QIX v1.0.0

## Player hitbox
Visual player size is unchanged, but damaging collision uses a smaller ~4.5px hurtbox.

## Rotating laser start bug
- Sweep laser state is cleared on boss reset and Random Raid floor setup.
- No sweep laser can persist from the previous boss.
- Initial laser timing gets a startup delay so a warning line cannot be stuck on frame 0.

## Reward opening
Rewards are sealed cards and open one by one.
Hover a revealed reward to inspect its effects before claiming.

## Procedural hack-and-slash charms
Charms are generated with 1-5 effects. Rarity is determined only by the number of effects.
Duplicate effects are allowed and every effect rolls from +1 to +5.

Examples:
- R1: SPD+1
- R2: SPD+2 / HP+4
- R5: SPD+1 / SPD+1 / CDR+5 / CORE+2 / HP+1

A 5-effect charm is maximum rarity even if every roll is only +1.

## Fusion
Drag five unique charms into the five fusion slots.
All five must share the same rarity.
Fusion consumes those items and creates one random charm of the next rarity.
R5 is the maximum.

Use `start.bat` to run and `build.bat` to build.
