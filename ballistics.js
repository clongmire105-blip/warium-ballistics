(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    root.WariumBallistics = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const TICKS_PER_SECOND = 20;
    const AIR_DRAG = 0.99;
    const GRAVITY = 0.05;
    const MAX_TICKS = 4000;
    const MINECRAFT_SPREAD_SCALE = 0.0172275;
    const DISPERSION_SAMPLES = 800;

    const WEAPONS = {
        battle_cannon: {
            name: "Battle Cannon",
            usesBarrels: true,
            shells: {
                ap: { name: "AP shell", baseSpeed: 3.3, spread: (barrels) => 8 / (barrels * 2) },
                solid: { name: "Solid shell", baseSpeed: 3.2, spread: (barrels) => 8 / (barrels * 2) },
                explosive: { name: "HE / HEAT / flak / smoke", baseSpeed: 3.0, spread: (barrels) => 10 / (barrels * 2) }
            }
        },
        artillery: {
            name: "Artillery",
            usesBarrels: true,
            shells: {
                solid: { name: "Solid / AP shell", baseSpeed: 3.2, spread: (barrels) => 10 / (barrels * 1.5) },
                explosive: { name: "HE / gas / incendiary", baseSpeed: 3.0, spread: (barrels) => 14 / (barrels * 1.5) }
            }
        },
        mortar: {
            name: "Mortar",
            usesBarrels: false,
            shells: {
                standard: { name: "HE / smoke shell", fixedSpeed: 5.0, spread: () => 5.0 }
            }
        }
    };

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function radians(degrees) {
        return degrees * Math.PI / 180;
    }

    function degrees(radiansValue) {
        return radiansValue * 180 / Math.PI;
    }

    function normalizeSignedDegrees(value) {
        let normalized = (value + 180) % 360;
        if (normalized < 0) normalized += 360;
        return normalized - 180;
    }

    function normalizeBearing(value) {
        let normalized = value % 360;
        if (normalized < 0) normalized += 360;
        return normalized;
    }

    function getProfile(weaponId, shellId, barrels, rplInstalled) {
        const weapon = WEAPONS[weaponId];
        if (!weapon) throw new Error("Unknown weapon profile.");
        const shell = weapon.shells[shellId];
        if (!shell) throw new Error("Unknown shell profile.");

        const safeBarrels = weapon.usesBarrels ? clamp(Math.round(barrels), 1, 11) : 0;
        const multiplier = weapon.usesBarrels && rplInstalled ? 2.0 : 1.0;
        const speed = shell.fixedSpeed !== undefined
            ? shell.fixedSpeed
            : (shell.baseSpeed + safeBarrels / 1.25) * multiplier;

        return {
            weaponId,
            shellId,
            weaponName: weapon.name,
            shellName: shell.name,
            barrels: safeBarrels,
            rplInstalled: Boolean(rplInstalled),
            rplAffectsSpeed: weapon.usesBarrels,
            speed,
            speedBlocksPerSecond: speed * TICKS_PER_SECOND,
            inaccuracy: shell.spread(safeBarrels)
        };
    }

    function getGeometry(origin, target) {
        const dx = target.x - origin.x;
        const dy = target.y - origin.y;
        const dz = target.z - origin.z;
        const horizontalRange = Math.hypot(dx, dz);
        const yaw = normalizeSignedDegrees(degrees(Math.atan2(-dx, dz)));
        const bearing = normalizeBearing(degrees(Math.atan2(dx, -dz)));
        return { dx, dy, dz, horizontalRange, yaw, bearing };
    }

    // Warium stores tan(displayed pitch), adds 0.5, halves the horizontal
    // direction, and lets Projectile.shoot normalize the resulting vector.
    function mortarElevationFromSetting(settingDegrees, relativeYawDegrees = 0) {
        const setting = radians(settingDegrees);
        const relativeYaw = radians(relativeYawDegrees);
        const horizontalMagnitude = 0.5 / Math.max(1e-9, Math.abs(Math.cos(relativeYaw)));
        return degrees(Math.atan2(Math.tan(setting) + 0.5, horizontalMagnitude));
    }

    function mortarSettingFromElevation(elevationDegrees, relativeYawDegrees = 0) {
        const elevation = radians(elevationDegrees);
        const relativeYaw = radians(relativeYawDegrees);
        const horizontalMagnitude = 0.5 / Math.max(1e-9, Math.abs(Math.cos(relativeYaw)));
        return degrees(Math.atan(horizontalMagnitude * Math.tan(elevation) - 0.5));
    }

    function seededRandom(seed) {
        let state = seed >>> 0;
        return function () {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ value >>> 15, value | 1);
            value ^= value + Math.imul(value ^ value >>> 7, value | 61);
            return ((value ^ value >>> 14) >>> 0) / 4294967296;
        };
    }

    function dispersionSeed(speed, elevationRadians, geometry, inaccuracy) {
        const values = [speed, elevationRadians, geometry.horizontalRange, geometry.dy, geometry.yaw, inaccuracy];
        let hash = 2166136261;
        for (const value of values) {
            const scaled = Math.round(value * 100000);
            hash ^= scaled;
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function percentile(sortedValues, fraction) {
        if (sortedValues.length === 0) return 0;
        const index = (sortedValues.length - 1) * fraction;
        const low = Math.floor(index);
        const high = Math.ceil(index);
        if (low === high) return sortedValues[low];
        return sortedValues[low] + (sortedValues[high] - sortedValues[low]) * (index - low);
    }

    function estimateDispersion(options) {
        const geometry = options.geometry;
        const elevationRadians = options.elevationRadians;
        const speed = options.speed;
        const launchOffset = Math.max(0, options.launchOffset || 0);
        const inaccuracy = Math.max(0, options.inaccuracy || 0);
        const sampleCount = Math.max(1, Math.round(options.samples || DISPERSION_SAMPLES));
        const offsetHorizontal = launchOffset * Math.cos(elevationRadians);
        const offsetVertical = launchOffset * Math.sin(elevationRadians);
        const targetRange = geometry.horizontalRange - offsetHorizontal;
        const targetY = geometry.dy - offsetVertical;
        const slantRange = Math.max(1, Math.hypot(geometry.horizontalRange, geometry.dy));

        if (inaccuracy === 0 || targetRange <= 0) {
            return { medianMeters: 0, p90Meters: 0, percentError: 0, samples: sampleCount };
        }

        const forwardX = geometry.dx / geometry.horizontalRange;
        const forwardZ = geometry.dz / geometry.horizontalRange;
        const sideX = forwardZ;
        const sideZ = -forwardX;
        const horizontalSpeed = Math.cos(elevationRadians);
        const nominal = {
            x: forwardX * horizontalSpeed,
            y: Math.sin(elevationRadians),
            z: forwardZ * horizontalSpeed
        };
        const deviation = MINECRAFT_SPREAD_SCALE * inaccuracy;
        const random = seededRandom(dispersionSeed(speed, elevationRadians, geometry, inaccuracy));
        const misses = [];

        for (let sample = 0; sample < sampleCount; sample += 1) {
            const triangular = () => deviation * (random() - random());
            let vx = (nominal.x + triangular()) * speed;
            let vy = (nominal.y + triangular()) * speed;
            let vz = (nominal.z + triangular()) * speed;
            let x = 0;
            let y = 0;
            let z = 0;
            let previousForward = 0;
            let closestDistance = Math.hypot(targetRange, targetY);
            let miss = null;

            for (let tick = 1; tick <= MAX_TICKS; tick += 1) {
                const nextX = x + vx;
                const nextY = y + vy;
                const nextZ = z + vz;
                const nextForward = nextX * forwardX + nextZ * forwardZ;
                const nextSide = nextX * sideX + nextZ * sideZ;
                closestDistance = Math.min(
                    closestDistance,
                    Math.hypot(nextForward - targetRange, nextY - targetY, nextSide)
                );

                if (nextForward >= targetRange && nextForward > previousForward) {
                    const fraction = (targetRange - previousForward) / (nextForward - previousForward);
                    const impactX = x + (nextX - x) * fraction;
                    const impactY = y + (nextY - y) * fraction;
                    const impactZ = z + (nextZ - z) * fraction;
                    const crossRange = impactX * sideX + impactZ * sideZ;
                    miss = Math.hypot(crossRange, impactY - targetY);
                    break;
                }

                x = nextX;
                y = nextY;
                z = nextZ;
                previousForward = nextForward;
                vx *= AIR_DRAG;
                vy = vy * AIR_DRAG - GRAVITY;
                vz *= AIR_DRAG;

                if (y < targetY - 512 && vy < 0) break;
            }

            misses.push(miss === null ? closestDistance : miss);
        }

        misses.sort((a, b) => a - b);
        const medianMeters = percentile(misses, 0.5);
        return {
            medianMeters,
            p90Meters: percentile(misses, 0.9),
            percentError: medianMeters / slantRange * 100,
            samples: sampleCount
        };
    }

    function simulateToRange(speed, elevationRadians, horizontalRange, targetDeltaY) {
        if (!Number.isFinite(speed) || speed <= 0 || horizontalRange < 0) return null;

        let x = 0;
        let y = 0;
        let vx = speed * Math.cos(elevationRadians);
        let vy = speed * Math.sin(elevationRadians);
        let apex = 0;
        const points = [{ x: 0, y: 0 }];

        if (horizontalRange < 1e-9) {
            return {
                error: -targetDeltaY,
                impactY: 0,
                timeTicks: 0,
                apex: 0,
                impactSpeed: speed,
                points
            };
        }

        if (vx <= 1e-10) return null;

        for (let tick = 1; tick <= MAX_TICKS; tick += 1) {
            const nextX = x + vx;
            const nextY = y + vy;

            if (nextY > apex) apex = nextY;

            if (nextX >= horizontalRange) {
                const fraction = (horizontalRange - x) / (nextX - x);
                const impactY = y + (nextY - y) * fraction;
                points.push({ x: horizontalRange, y: impactY });
                return {
                    error: impactY - targetDeltaY,
                    impactY,
                    timeTicks: (tick - 1) + fraction,
                    apex,
                    impactSpeed: Math.hypot(vx, vy),
                    points
                };
            }

            x = nextX;
            y = nextY;
            if (tick < 240 || tick % 3 === 0) points.push({ x, y });

            vx *= AIR_DRAG;
            vy = vy * AIR_DRAG - GRAVITY;

            if (vx < 1e-10 && x < horizontalRange) return null;
        }
        return null;
    }

    function evaluateAngle(speed, elevationRadians, geometry, launchOffset) {
        const offsetHorizontal = launchOffset * Math.cos(elevationRadians);
        const offsetVertical = launchOffset * Math.sin(elevationRadians);
        const flightRange = geometry.horizontalRange - offsetHorizontal;
        const flightDeltaY = geometry.dy - offsetVertical;
        if (flightRange <= 1e-7) return null;

        const simulation = simulateToRange(speed, elevationRadians, flightRange, flightDeltaY);
        if (!simulation) return null;
        return {
            ...simulation,
            flightRange,
            flightDeltaY,
            offsetHorizontal,
            offsetVertical
        };
    }

    function bisectRoot(speed, geometry, launchOffset, low, high, lowEval, highEval) {
        let lo = low;
        let hi = high;
        let loEval = lowEval;
        let hiEval = highEval;

        for (let iteration = 0; iteration < 70; iteration += 1) {
            const mid = (lo + hi) / 2;
            const midEval = evaluateAngle(speed, mid, geometry, launchOffset);
            if (!midEval) break;
            if (Math.abs(midEval.error) < 1e-9) return { angle: mid, evaluation: midEval };

            if (Math.sign(loEval.error) === Math.sign(midEval.error)) {
                lo = mid;
                loEval = midEval;
            } else {
                hi = mid;
                hiEval = midEval;
            }
        }

        const angle = (lo + hi) / 2;
        return { angle, evaluation: evaluateAngle(speed, angle, geometry, launchOffset) || hiEval };
    }

    function minimizeAbsoluteError(speed, geometry, launchOffset, low, high) {
        const ratio = (Math.sqrt(5) - 1) / 2;
        let a = low;
        let b = high;
        let c = b - ratio * (b - a);
        let d = a + ratio * (b - a);
        let cEval = evaluateAngle(speed, c, geometry, launchOffset);
        let dEval = evaluateAngle(speed, d, geometry, launchOffset);

        for (let i = 0; i < 50; i += 1) {
            const cError = cEval ? Math.abs(cEval.error) : Infinity;
            const dError = dEval ? Math.abs(dEval.error) : Infinity;
            if (cError < dError) {
                b = d;
                d = c;
                dEval = cEval;
                c = b - ratio * (b - a);
                cEval = evaluateAngle(speed, c, geometry, launchOffset);
            } else {
                a = c;
                c = d;
                cEval = dEval;
                d = a + ratio * (b - a);
                dEval = evaluateAngle(speed, d, geometry, launchOffset);
            }
        }

        const angle = (a + b) / 2;
        return { angle, evaluation: evaluateAngle(speed, angle, geometry, launchOffset) };
    }

    function solveTarget(options) {
        const origin = options.origin;
        const target = options.target;
        const speed = options.speed;
        const launchOffset = Math.max(0, options.launchOffset || 0);
        const weaponId = options.weaponId || (options.profile && options.profile.weaponId) || null;
        const inaccuracy = options.inaccuracy !== undefined
            ? options.inaccuracy
            : (options.profile ? options.profile.inaccuracy : 0);
        const geometry = getGeometry(origin, target);

        if (geometry.horizontalRange < 1e-6) {
            return {
                geometry,
                solutions: [],
                reason: "The firing point and target share the same X/Z position; yaw is undefined for this mount calculation."
            };
        }

        const minimumAngle = radians(-89.5);
        const maximumAngle = radians(89.5);
        const step = radians(0.1);
        const samples = [];
        const roots = [];

        for (let angle = minimumAngle; angle <= maximumAngle + 1e-10; angle += step) {
            samples.push({ angle, evaluation: evaluateAngle(speed, angle, geometry, launchOffset) });
        }

        for (let i = 1; i < samples.length; i += 1) {
            const previous = samples[i - 1];
            const current = samples[i];
            if (!previous.evaluation || !current.evaluation) continue;

            if (Math.abs(previous.evaluation.error) < 1e-7) {
                roots.push({ angle: previous.angle, evaluation: previous.evaluation });
            }

            if (Math.sign(previous.evaluation.error) !== Math.sign(current.evaluation.error)) {
                roots.push(bisectRoot(
                    speed,
                    geometry,
                    launchOffset,
                    previous.angle,
                    current.angle,
                    previous.evaluation,
                    current.evaluation
                ));
            }
        }

        for (let i = 1; i < samples.length - 1; i += 1) {
            const before = samples[i - 1];
            const sample = samples[i];
            const after = samples[i + 1];
            if (!before.evaluation || !sample.evaluation || !after.evaluation) continue;
            const error = Math.abs(sample.evaluation.error);
            if (error <= Math.abs(before.evaluation.error)
                && error <= Math.abs(after.evaluation.error)
                && error < 0.05) {
                const candidate = minimizeAbsoluteError(speed, geometry, launchOffset, before.angle, after.angle);
                if (candidate.evaluation && Math.abs(candidate.evaluation.error) < 0.001) roots.push(candidate);
            }
        }

        roots.sort((a, b) => a.angle - b.angle);
        const deduplicated = [];
        for (const rootResult of roots) {
            if (!rootResult.evaluation) continue;
            if (deduplicated.some((existing) => Math.abs(existing.angle - rootResult.angle) < radians(0.02))) continue;
            deduplicated.push(rootResult);
        }

        const selectedRoots = deduplicated.length > 2
            ? [deduplicated[0], deduplicated[deduplicated.length - 1]]
            : deduplicated;

        const horizontalUnitX = geometry.dx / geometry.horizontalRange;
        const horizontalUnitZ = geometry.dz / geometry.horizontalRange;
        const solutions = selectedRoots.map((rootResult, index) => {
            const elevation = degrees(rootResult.angle);
            const evaluation = rootResult.evaluation;
            const muzzle = {
                x: origin.x + horizontalUnitX * evaluation.offsetHorizontal,
                y: origin.y + evaluation.offsetVertical,
                z: origin.z + horizontalUnitZ * evaluation.offsetHorizontal
            };
            const shiftedPoints = evaluation.points.map((point) => ({
                x: point.x + evaluation.offsetHorizontal,
                y: point.y + evaluation.offsetVertical
            }));
            if (launchOffset > 0) shiftedPoints.unshift({ x: 0, y: 0 });

            return {
                type: selectedRoots.length === 1 ? "only" : (index === 0 ? "low" : "high"),
                elevation,
                minecraftPitch: -elevation,
                mortarPitch: weaponId === "mortar" ? mortarSettingFromElevation(elevation) : null,
                yaw: geometry.yaw,
                bearing: geometry.bearing,
                timeTicks: evaluation.timeTicks,
                timeSeconds: evaluation.timeTicks / TICKS_PER_SECOND,
                apexAboveReference: evaluation.apex + evaluation.offsetVertical,
                apexWorldY: origin.y + evaluation.apex + evaluation.offsetVertical,
                impactSpeed: evaluation.impactSpeed,
                impactSpeedBlocksPerSecond: evaluation.impactSpeed * TICKS_PER_SECOND,
                residual: evaluation.error,
                dispersion: estimateDispersion({
                    geometry,
                    elevationRadians: rootResult.angle,
                    speed,
                    launchOffset,
                    inaccuracy
                }),
                muzzle,
                points: shiftedPoints
            };
        });

        return {
            weaponId,
            inaccuracy,
            geometry,
            solutions,
            reason: solutions.length === 0
                ? (weaponId === "mortar"
                    ? "No nominal mortar trajectory reaches this point at Warium's fixed launch speed. Move the target closer or change the firing elevation."
                    : "No nominal trajectory reaches this point at the selected launch speed. Add barrels, select the RPL profile, or move the target closer.")
                : null
        };
    }

    function resolveReferencePosition(input) {
        const raw = { x: input.x, y: input.y, z: input.z };
        if (input.referenceMode !== "breech") {
            return { origin: raw, launchOffset: 0, description: "Exact projectile origin" };
        }

        if (input.weaponId === "mortar") {
            return {
                origin: { x: raw.x + 0.5, y: raw.y + 3.0, z: raw.z + 0.5 },
                launchOffset: 0,
                description: "Mortar block position converted to Warium spawn point"
            };
        }

        return {
            origin: { x: raw.x + 0.5, y: raw.y + 0.5, z: raw.z + 0.5 },
            launchOffset: clamp(Math.round(input.barrels), 1, 11) + 1.5,
            description: "Breech block position with Warium barrel-length muzzle offset"
        };
    }

    return {
        TICKS_PER_SECOND,
        AIR_DRAG,
        GRAVITY,
        WEAPONS,
        MINECRAFT_SPREAD_SCALE,
        DISPERSION_SAMPLES,
        getProfile,
        getGeometry,
        mortarElevationFromSetting,
        mortarSettingFromElevation,
        estimateDispersion,
        simulateToRange,
        solveTarget,
        resolveReferencePosition,
        normalizeSignedDegrees,
        normalizeBearing
    };
});
