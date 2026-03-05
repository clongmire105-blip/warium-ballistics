<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Minecraft Ballistic Calculator (Warium-compatible)</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 20px; max-width: 980px; }
    h1 { font-size: 20px; margin: 0 0 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .card { border: 1px solid #333; border-radius: 10px; padding: 14px; background: #111; }
    label { display:block; font-size: 12px; opacity: 0.85; margin: 10px 0 4px; }
    input, select, button, textarea {
      width: 100%; box-sizing: border-box; padding: 10px;
      border-radius: 8px; border: 1px solid #333;
      background:#0b0b0b; color:#eee;
    }
    .row { display:flex; gap:10px; }
    .row > * { flex: 1; }
    button { cursor:pointer; font-weight: 600; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .out { white-space: pre-wrap; line-height: 1.35; }
    .small { font-size: 12px; opacity: 0.8; }
    .warn { color: #ffb84d; }
    .ok { color: #6ee7b7; }
    .bad { color: #ff7a7a; }
    .pill { display:inline-block; padding:2px 8px; border-radius:999px; border:1px solid #333; margin-left:8px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Ballistic Calculator <span class="pill">Minecraft tick-physics</span></h1>

  <div class="grid">
    <div class="card">
      <h2 style="font-size:16px;margin:0 0 8px;">Inputs</h2>

      <div class="row">
        <div>
          <label>Shooter X</label>
          <input id="sx" type="number" step="0.01" value="0"/>
        </div>
        <div>
          <label>Shooter Y</label>
          <input id="sy" type="number" step="0.01" value="64"/>
        </div>
        <div>
          <label>Shooter Z</label>
          <input id="sz" type="number" step="0.01" value="0"/>
        </div>
      </div>

      <div class="row">
        <div>
          <label>Target X</label>
          <input id="tx" type="number" step="0.01" value="100"/>
        </div>
        <div>
          <label>Target Y</label>
          <input id="ty" type="number" step="0.01" value="64"/>
        </div>
        <div>
          <label>Target Z</label>
          <input id="tz" type="number" step="0.01" value="0"/>
        </div>
      </div>

      <label>Weapon</label>
      <select id="weapon"></select>

      <div id="orientationWrap" style="display:none;">
        <label>Rocket orientation</label>
        <select id="orientation">
          <option value="HORIZONTAL">Horizontal assembly</option>
          <option value="VERTICAL">Vertical assembly</option>
        </select>
      </div>

      <div class="row">
        <div>
          <label>Arc preference</label>
          <select id="arc">
            <option value="LOW">Low arc (flatter)</option>
            <option value="HIGH">High arc (lob)</option>
          </select>
        </div>
        <div>
          <label>Accuracy tolerance (blocks)</label>
          <input id="tol" type="number" step="0.01" value="0.50"/>
        </div>
      </div>

      <div class="row">
        <div>
          <label>Max sim ticks</label>
          <input id="maxt" type="number" step="1" value="700"/>
        </div>
        <div>
          <label>Angle iterations</label>
          <input id="iters" type="number" step="1" value="40"/>
        </div>
      </div>

      <label class="small">Note: Pitch is Minecraft pitch (negative = up). Yaw is Minecraft-style heading.</label>

      <div class="row" style="margin-top:12px;">
        <button id="compute">Compute solution</button>
        <button id="swap">Swap shooter/target</button>
      </div>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin:0 0 8px;">Output</h2>
      <div id="status" class="mono out"></div>
      <hr style="border:0;border-top:1px solid #333;margin:12px 0;">
      <div id="result" class="mono out"></div>
      <hr style="border:0;border-top:1px solid #333;margin:12px 0;">
      <label>Copy-friendly</label>
      <textarea id="copy" class="mono" rows="6" readonly></textarea>
      <div class="small" style="margin-top:10px;">
        You can host this file directly on GitHub Pages (Settings → Pages).
      </div>
    </div>
  </div>

<script>
/**
 * Weapon profiles
 * Tune these to match your actual Warium / WariumTactics projectile behavior.
 *
 * Units:
 *  - speed: blocks / tick
 *  - gravity: blocks / tick^2
 *  - drag: multiplicative per tick
 */
const PROFILES = [
  {
    id: "ARTILLERY",
    name: "Artillery / Battle Cannon (barrels)",
    usesBarrels: true,
    minBarrels: 1,
    maxBarrels: 12,
    supportsOrientation: false,
    defaultOrientation: "NONE",
    minRange: (ori) => 8,
    maxRange: (ori) => 1200,
    armingDistance: (ori) => 0,
    gravity: (ori) => 0.05,
    drag: (ori) => 0.99,
    speed: (barrels, ori) => 1.55 + 0.18 * barrels, // example model
  },
  {
    id: "MORTAR",
    name: "Mortar (fixed tube)",
    usesBarrels: false,
    minBarrels: 1,
    maxBarrels: 1,
    supportsOrientation: false,
    defaultOrientation: "NONE",
    minRange: (ori) => 6,
    maxRange: (ori) => 500,
    armingDistance: (ori) => 0,
    gravity: (ori) => 0.05,
    drag: (ori) => 0.99,
    speed: (barrels, ori) => 1.25, // example
  },
  {
    id: "ROCKET",
    name: "Rocket ordnance (orientation matters)",
    usesBarrels: false,
    minBarrels: 1,
    maxBarrels: 1,
    supportsOrientation: true,
    defaultOrientation: "HORIZONTAL",
    // Example: vertical assembly might be “lofted” / less horizontal reach; horizontal assembly more range.
    minRange: (ori) => 20,
    maxRange: (ori) => (ori === "HORIZONTAL" ? 1400 : 900),
    armingDistance: (ori) => 20,
    gravity: (ori) => 0.03,  // rockets often feel “flatter” in mods; tune per your entity
    drag: (ori) => 0.995,
    speed: (barrels, ori) => (ori === "HORIZONTAL" ? 2.2 : 2.0),
  },
];

function wrapDegrees(deg) {
  deg %= 360;
  if (deg >= 180) deg -= 360;
  if (deg < -180) deg += 360;
  return deg;
}

// MC-ish yaw: 0=+Z, 90=-X, 180=-Z, -90=+X
function computeYawDeg(dx, dz) {
  const yawRad = Math.atan2(-dx, dz);
  return wrapDegrees(yawRad * 180 / Math.PI);
}

/**
 * Simulates vertical-plane flight using MC-style per-tick physics:
 *   x += vx; y += vy;
 *   vx *= drag; vy = (vy * drag) - gravity
 *
 * Returns signed vertical miss at the time we cross/past target horizontal distance.
 */
function simulateToHorizontal(targetHoriz, targetDy, speed, thetaRad, gravity, drag, maxTicks) {
  let vx = speed * Math.cos(thetaRad);
  let vy = speed * Math.sin(thetaRad);
  let x = 0, y = 0;

  let bestAbs = Infinity;
  let bestSigned = 0;
  let bestTick = 0;

  for (let t=0; t<maxTicks; t++) {
    x += vx;
    y += vy;

    // track close region
    const dx = targetHoriz - x;
    if (Math.abs(dx) < 1.0) {
      const missSigned = y - targetDy;
      const missAbs = Math.abs(missSigned);
      if (missAbs < bestAbs) { bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1; }
    }

    if (x >= targetHoriz) {
      const missSigned = y - targetDy;
      const missAbs = Math.abs(missSigned);
      if (missAbs < bestAbs) { bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1; }
      return { missSigned: bestSigned, missAbs: bestAbs, ticks: bestTick, reached: true };
    }

    vx *= drag;
    vy = (vy * drag) - gravity;

    if (y < targetDy - 256) break;
  }
  return { missSigned: bestSigned, missAbs: bestAbs, ticks: bestTick, reached: false };
}

function solvePitch(targetHoriz, targetDy, speed, gravity, drag, maxTicks, iterations, preferHighArc) {
  // Search elevation theta in radians (math-space: +up)
  // We’ll look for a theta where missSigned ~ 0.
  let lo = 1 * Math.PI/180;
  let hi = 89 * Math.PI/180;

  let best = null;

  for (let i=0; i<iterations; i++) {
    const mid = (lo + hi) * 0.5;
    const s = simulateToHorizontal(targetHoriz, targetDy, speed, mid, gravity, drag, maxTicks);

    if (!best || s.missAbs < best.missAbs) best = { theta: mid, ...s };

    // close enough
    if (s.missAbs < 0.001) break;

    // If above target at crossing => too much elevation => decrease angle
    if (s.missSigned > 0) hi = mid;
    else lo = mid;
  }

  if (!best) return null;

  // MC pitch is negative up:
  const pitchDeg = -(best.theta * 180 / Math.PI);

  return { pitchDeg, timeTicks: best.ticks, miss: best.missAbs, reached: best.reached };
}

function findBestSolution(profile, sx,sy,sz, tx,ty,tz, orientation, preferHighArc, tol, maxTicks, iterations) {
  const dx = tx - sx;
  const dy = ty - sy;
  const dz = tz - sz;

  const yawDeg = computeYawDeg(dx, dz);
  const horiz = Math.sqrt(dx*dx + dz*dz);

  // Hard constraints first
  if (horiz < profile.minRange(orientation)) {
    return { ok:false, reason:`Too close: horizontal distance ${horiz.toFixed(2)} < min range ${profile.minRange(orientation)}.` };
  }
  if (horiz > profile.maxRange(orientation)) {
    return { ok:false, reason:`Too far: horizontal distance ${horiz.toFixed(2)} > max range ${profile.maxRange(orientation)}.` };
  }
  if (horiz < profile.armingDistance(orientation)) {
    return { ok:false, reason:`Within arming distance: ${horiz.toFixed(2)} < ${profile.armingDistance(orientation)}.` };
  }

  const gravity = profile.gravity(orientation);
  const drag = profile.drag(orientation);

  if (profile.usesBarrels) {
    let best = null;

    for (let b=profile.minBarrels; b<=profile.maxBarrels; b++) {
      const speed = profile.speed(b, orientation);
      const sol = solvePitch(horiz, dy, speed, gravity, drag, maxTicks, iterations, preferHighArc);
      if (!sol) continue;

      const candidate = { barrels:b, speed, yawDeg, ...sol };
      if (!best || candidate.miss < best.miss) best = candidate;

      if (candidate.miss <= tol && candidate.reached) {
        return { ok:true, profile, orientation, ...candidate, note:"Found within tolerance." };
      }
    }
    if (!best) return { ok:false, reason:"No solution found (simulation did not reach target distance)." };

    if (!best.reached) return { ok:false, reason:"No solution: projectile could not reach the target distance within sim ticks.", bestEffort: best };
    return { ok:false, reason:`No ballistic solution within tolerance ${tol}. Best miss = ${best.miss.toFixed(2)} blocks.`, bestEffort: best };
  } else {
    const speed = profile.speed(1, orientation);
    const sol = solvePitch(horiz, dy, speed, gravity, drag, maxTicks, iterations, preferHighArc);
    if (!sol) return { ok:false, reason:"No solution found." };

    const out = { barrels: null, speed, yawDeg, ...sol };
    if (!out.reached) return { ok:false, reason:"No solution: projectile could not reach the target distance within sim ticks.", bestEffort: out };
    if (out.miss > tol) return { ok:false, reason:`No ballistic solution within tolerance ${tol}. Miss = ${out.miss.toFixed(2)} blocks.`, bestEffort: out };
    return { ok:true, profile, orientation, ...out, note:"Found within tolerance." };
  }
}

// ---- UI wiring ----
const weaponSel = document.getElementById("weapon");
const orientationWrap = document.getElementById("orientationWrap");
const orientationSel = document.getElementById("orientation");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const copyEl = document.getElementById("copy");

function getNum(id) { return Number(document.getElementById(id).value); }
function getProfileById(id) { return PROFILES.find(p => p.id === id); }

function refreshWeaponOptions() {
  weaponSel.innerHTML = "";
  for (const p of PROFILES) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    weaponSel.appendChild(opt);
  }
  weaponSel.value = PROFILES[0].id;
  onWeaponChanged();
}

function onWeaponChanged() {
  const p = getProfileById(weaponSel.value);
  if (p.supportsOrientation) {
    orientationWrap.style.display = "block";
    orientationSel.value = p.defaultOrientation || "HORIZONTAL";
  } else {
    orientationWrap.style.display = "none";
    orientationSel.value = "NONE";
  }
}

weaponSel.addEventListener("change", onWeaponChanged);

document.getElementById("swap").addEventListener("click", () => {
  const sx = document.getElementById("sx").value;
  const sy = document.getElementById("sy").value;
  const sz = document.getElementById("sz").value;
  document.getElementById("sx").value = document.getElementById("tx").value;
  document.getElementById("sy").value = document.getElementById("ty").value;
  document.getElementById("sz").value = document.getElementById("tz").value;
  document.getElementById("tx").value = sx;
  document.getElementById("ty").value = sy;
  document.getElementById("tz").value = sz;
});

document.getElementById("compute").addEventListener("click", () => {
  const sx = getNum("sx"), sy = getNum("sy"), sz = getNum("sz");
  const tx = getNum("tx"), ty = getNum("ty"), tz = getNum("tz");
  const tol = getNum("tol");
  const maxTicks = Math.max(10, Math.floor(getNum("maxt")));
  const iterations = Math.max(10, Math.floor(getNum("iters")));

  const profile = getProfileById(weaponSel.value);
  const orientation = profile.supportsOrientation ? orientationSel.value : "NONE";
  const preferHighArc = (document.getElementById("arc").value === "HIGH");

  const dx = tx - sx, dz = tz - sz;
  const horiz = Math.sqrt(dx*dx + dz*dz);

  statusEl.textContent = "";
  resultEl.textContent = "";
  copyEl.value = "";

  const sol = findBestSolution(profile, sx,sy,sz, tx,ty,tz, orientation, preferHighArc, tol, maxTicks, iterations);

  if (!sol.ok) {
    statusEl.innerHTML = `<span class="bad">UNREACHABLE</span>\n${sol.reason}\n\n` +
      `Horizontal distance: ${horiz.toFixed(2)} blocks\n` +
      `Weapon: ${profile.name}${profile.supportsOrientation ? " ("+orientation+")" : ""}\n`;

    if (sol.bestEffort) {
      const be = sol.bestEffort;
      resultEl.innerHTML =
        `<span class="warn">Best effort (not within tolerance)</span>\n` +
        `Yaw:   ${be.yawDeg.toFixed(2)}°\n` +
        `Pitch: ${be.pitchDeg.toFixed(2)}°  (MC pitch; negative=up)\n` +
        `${profile.usesBarrels ? `Barrels: ${be.barrels}\n` : ""}` +
        `Speed: ${be.speed.toFixed(3)} blocks/tick\n` +
        `Miss:  ${be.miss.toFixed(2)} blocks\n` +
        `TOF:   ${be.timeTicks.toFixed(0)} ticks (${(be.timeTicks/20).toFixed(2)}s)\n`;
      copyEl.value =
        `UNREACHABLE (best effort)\n` +
        `Yaw=${be.yawDeg.toFixed(2)} Pitch=${be.pitchDeg.toFixed(2)}` +
        (profile.usesBarrels ? ` Barrels=${be.barrels}` : "") +
        ` Miss=${be.miss.toFixed(2)} TOF=${be.timeTicks.toFixed(0)}t\n`;
    }
    return;
  }

  statusEl.innerHTML = `<span class="ok">REACHABLE</span>\n${sol.note}\n` +
    `Horizontal distance: ${horiz.toFixed(2)} blocks\n` +
    `Weapon: ${profile.name}${profile.supportsOrientation ? " ("+orientation+")" : ""}\n`;

  resultEl.textContent =
    `Yaw:   ${sol.yawDeg.toFixed(2)}°\n` +
    `Pitch: ${sol.pitchDeg.toFixed(2)}°  (MC pitch; negative=up)\n` +
    (profile.usesBarrels ? `Barrels: ${sol.barrels}\n` : "") +
    `Speed: ${sol.speed.toFixed(3)} blocks/tick\n` +
    `Miss:  ${sol.miss.toFixed(2)} blocks (≤ ${tol.toFixed(2)} target)\n` +
    `TOF:   ${sol.timeTicks.toFixed(0)} ticks (${(sol.timeTicks/20).toFixed(2)}s)\n`;

  copyEl.value =
    `REACHABLE\n` +
    `Yaw=${sol.yawDeg.toFixed(2)} Pitch=${sol.pitchDeg.toFixed(2)}` +
    (profile.usesBarrels ? ` Barrels=${sol.barrels}` : "") +
    ` Miss=${sol.miss.toFixed(2)} TOF=${sol.timeTicks.toFixed(0)}t\n`;
});

refreshWeaponOptions();
</script>
</body>
</html>
