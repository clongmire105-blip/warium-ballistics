# Warium Ballistics Calculator

Standalone calculator for Warium 1.3.0 artillery, battle cannons, and mortars on Minecraft 1.20.1.

## Run

Double-click `launch-calculator.cmd`, or open `index.html` in a browser. The tool has no installation, server, or network requirement.

## Included profiles

- Battle cannon AP: `(3.3 + barrels / 1.25) * runtime multiplier`
- Battle cannon solid: `(3.2 + barrels / 1.25) * runtime multiplier`
- Battle cannon HE/HEAT/flak/smoke: `(3.0 + barrels / 1.25) * runtime multiplier`
- Artillery solid/AP: `(3.2 + barrels / 1.25) * runtime multiplier`
- Artillery HE/gas/incendiary: `(3.0 + barrels / 1.25) * runtime multiplier`
- Mortar HE/smoke: fixed `5.0` blocks/tick

The runtime multiplier is `2.0` when Ritchie's Projectile Library is installed and `1.0` without it. Warium does not apply this multiplier to mortars.

## Physics model

The solver reproduces Minecraft's discrete AbstractArrow flight loop used by these Warium entities:

1. Advance position using current velocity.
2. Multiply velocity by `0.99` air drag.
3. Subtract `0.05` from vertical velocity for gravity.

It scans the complete practical elevation range and refines every target-height intersection, returning low and high arcs when both exist.

Mortars use a separate control conversion matching Warium's launch procedure. Warium stores `tan(displayed pitch)`, adds `0.5` to that vertical component, halves the horizontal direction, and then normalizes the vector. Consequently, a centered mortar at a displayed `0 deg` setting launches at approximately `45 deg`. The calculator reports both the usable mortar aimer setting and the resulting true elevation.

Each solution also runs 800 deterministic dispersion trials using Minecraft's triangular `Projectile.shoot(..., inaccuracy)` perturbation. The reported percentage is the median miss distance (CEP50) divided by straight-line target distance; the 90% miss radius shows the wider expected dispersion. Barrel count is included through Warium's barrel-dependent inaccuracy formulas, while mortars use their fixed inaccuracy of `5.0`.

The model does not account for terrain collisions, moving launch vehicles, server lag, or a mount's mechanical rotation limits. Use world coordinates for VS-mounted weapons.

## Verified sources

The constants and mortar control transform were derived from the installed local jars:

- `Warium 1.3.0.jar`: `ArtilleryFireScriptProcedure`, `BCFireScriptProcedure`, `MortarOnBlockRightClickedProcedure`, and `ProjectilelibsProcedure`
- `ritchiesprojectilelib-2.1.1-mc.1.20.1-forge.jar`: precise-motion networking mixin and projectile tags

RPL improves motion synchronization; the launch-speed difference comes from Warium's own loaded-mod check.

## Test

Run:

```powershell
node test-ballistics.js
```
