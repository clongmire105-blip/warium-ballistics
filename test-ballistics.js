"use strict";

const assert = require("assert");
const B = require("./ballistics.js");

function near(actual, expected, tolerance, message) {
    assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: got ${actual}, expected ${expected}`);
}

const artilleryRpl = B.getProfile("artillery", "solid", 4, true);
const artilleryVanilla = B.getProfile("artillery", "solid", 4, false);
near(artilleryVanilla.speed, 6.4, 1e-12, "Artillery base speed");
near(artilleryRpl.speed, 12.8, 1e-12, "Artillery RPL speed");

const battleAp = B.getProfile("battle_cannon", "ap", 5, true);
near(battleAp.speed, 14.6, 1e-12, "Battle cannon AP speed");

const mortarRpl = B.getProfile("mortar", "standard", 0, true);
const mortarVanilla = B.getProfile("mortar", "standard", 0, false);
near(mortarRpl.speed, 5, 1e-12, "Mortar RPL speed");
near(mortarVanilla.speed, 5, 1e-12, "Mortar no-RPL speed");
near(B.mortarElevationFromSetting(0), 45, 1e-12, "Zero mortar setting true elevation");
near(B.mortarSettingFromElevation(45), 0, 1e-12, "45-degree elevation mortar setting");

const east = B.getGeometry({ x: 0, y: 64, z: 0 }, { x: 100, y: 64, z: 0 });
near(east.yaw, -90, 1e-12, "East-facing Minecraft yaw");
near(east.bearing, 90, 1e-12, "East-facing compass bearing");

const mortarSolution = B.solveTarget({
    origin: { x: 0, y: 64, z: 0 },
    target: { x: 100, y: 64, z: 0 },
    speed: 5,
    launchOffset: 0,
    profile: mortarRpl
});
assert.strictEqual(mortarSolution.solutions.length, 2, "Mortar should have low and high arcs at 100 m");
for (const solution of mortarSolution.solutions) {
    assert.ok(Math.abs(solution.residual) < 1e-6, "Solved trajectory should intersect target height");
}
assert.ok(mortarSolution.solutions[0].elevation < mortarSolution.solutions[1].elevation, "Low arc must precede high arc");
for (const solution of mortarSolution.solutions) {
    near(
        B.mortarElevationFromSetting(solution.mortarPitch),
        solution.elevation,
        1e-9,
        "Mortar setting should reproduce solved elevation"
    );
    assert.ok(solution.dispersion.percentError > 0, "Mortar solution should report nonzero spread error");
    assert.ok(solution.dispersion.p90Meters >= solution.dispersion.medianMeters, "P90 miss radius should exceed CEP50");
}

const shortBattle = B.getProfile("battle_cannon", "solid", 1, true);
const longBattle = B.getProfile("battle_cannon", "solid", 8, true);
const shortBarrelSolution = B.solveTarget({
    origin: { x: 0, y: 64, z: 0 },
    target: { x: 200, y: 64, z: 0 },
    speed: shortBattle.speed,
    profile: shortBattle
});
const longBarrelSolution = B.solveTarget({
    origin: { x: 0, y: 64, z: 0 },
    target: { x: 200, y: 64, z: 0 },
    speed: longBattle.speed,
    profile: longBattle
});
assert.ok(shortBarrelSolution.solutions.length > 0 && longBarrelSolution.solutions.length > 0, "Barrel dispersion fixtures must be reachable");
assert.ok(
    longBarrelSolution.solutions[0].dispersion.percentError < shortBarrelSolution.solutions[0].dispersion.percentError,
    "More battle-cannon barrels should reduce expected percentage error"
);

const breech = B.resolveReferencePosition({
    x: 10,
    y: 60,
    z: -5,
    referenceMode: "breech",
    weaponId: "battle_cannon",
    barrels: 4
});
assert.deepStrictEqual(breech.origin, { x: 10.5, y: 60.5, z: -4.5 });
near(breech.launchOffset, 5.5, 1e-12, "Battle cannon muzzle offset");

const impossible = B.solveTarget({
    origin: { x: 0, y: 64, z: 0 },
    target: { x: 1000, y: 64, z: 0 },
    speed: 1,
    launchOffset: 0
});
assert.strictEqual(impossible.solutions.length, 0, "Unreachable target must report no solution");
assert.ok(impossible.reason, "Unreachable target must include a reason");

console.log("All Warium ballistics tests passed.");
