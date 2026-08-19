# RAID QIX v0.9.0

## Combat
- Fixed circular AoE telegraph impact resolution and added visible impact flash.
- All bosses now use a shared slow rotation rate.
- All normal bosses receive slow randomized drifting movement.
- Random bosses also use deliberately slow randomized movement.
- Rotating laser attacks are now a high-weight Random Raid module and visibly telegraphed.
- GRAVITY MAW keeps shared laser mechanics.
- Former unavoidable top/bottom curtain attacks are now striped alternating lanes with safe gaps.

## New reusable mechanics
- Expanding donut rings
- Collapsing donut rings
- Triple predictive AoEs
- Pizza-slice cone mechanics
- Alternating cross lines
- Edge-in striped lanes
- Meteor spreads
- Bait + spread tracking AoEs
- Rotating line walls

All are reusable functions and several are added to the Random Raid attack registry.

## Random Raid rewards
When the player dies, rewards are granted based on bosses defeated:
- 1 defeated boss = 1 charm
- 10 defeated bosses = 10 charms
The run reward is rolled immediately and added to inventory.

## Inventory
- Inventory list and item detail are now separate.
- Clicking an item opens rarity, description, owned count and equip action.
- Rarity colors: Common / Uncommon / Rare / Epic.
- Fusion: 3 charms of the same rarity -> 1 random charm of the next rarity.
- Epic is currently the top rarity and cannot be fused further.

Use `start.bat` to run and `build.bat` to build.
