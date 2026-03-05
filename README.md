<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>Warium Ballistic Calculator</title>
  <style>
    :root{
      --bg:#0b0d12;
      --panel:#111522;
      --text:#e9eefb;
      --muted:#a9b4d0;
      --line:#27304a;
      --accent:#7aa2ff;
      --good:#4ade80;
      --warn:#fbbf24;
      --bad:#fb7185;
      --shadow: 0 10px 30px rgba(0,0,0,.35);
      --radius:14px;
      --radius-sm:10px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --sans: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    }

    *{ box-sizing:border-box; }
    html,body{ height:100%; }
    body{
      margin:0;
      font-family:var(--sans);
      background:
        radial-gradient(1200px 700px at 30% -10%, rgba(122,162,255,.18), transparent 60%),
        radial-gradient(900px 600px at 100% 0%, rgba(74,222,128,.10), transparent 55%),
        var(--bg);
      color:var(--text);
    }

    .wrap{
      max-width:1180px;
      margin:0 auto;
      padding: 18px 16px 28px;
    }

    header{
      display:flex;
      gap:12px;
      align-items:flex-end;
      justify-content:space-between;
      padding: 10px 4px 16px;
    }
    .title{
      display:flex;
      flex-direction:column;
      gap:6px;
    }
    h1{
      margin:0;
      font-size:18px;
      letter-spacing:.2px;
      line-height:1.2;
    }
    .subtitle{
      margin:0;
      color:var(--muted);
      font-size:12px;
    }

    .pill{
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding:6px 10px;
      border:1px solid var(--line);
      border-radius:999px;
      background: rgba(255,255,255,.02);
      color:var(--muted);
      font-size:12px;
      white-space:nowrap;
    }

    .grid{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:14px;
      align-items:start;
    }

    .card{
      background: linear-gradient(180deg, rgba(255,255,255,.03), transparent 120%), var(--panel);
      border:1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow:hidden;
    }
    .card-h{
      padding: 14px 16px 10px;
      border-bottom:1px solid rgba(39,48,74,.65);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
    }
    .card-h .h{
      font-size:13px;
      color:var(--muted);
      letter-spacing:.25px;
      text-transform:uppercase;
      margin:0;
    }
    .card-b{ padding: 14px 16px 16px; }

    .row{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:10px;
    }
    .row3{
      display:grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap:10px;
    }

    label{
      display:block;
      font-size:12px;
      color:var(--muted);
      margin: 10px 0 6px;
    }

    input, select, textarea, button{
      width:100%;
      font: inherit;
      color:var(--text);
      border-radius: var(--radius-sm);
      border:1px solid var(--line);
      background: rgba(255,255,255,.02);
      padding: 11px 12px;
      outline:none;
    }
    textarea{ resize:vertical; min-height: 140px; font-family: var(--mono); }

    input:focus, select:focus, textarea:focus{
      border-color: rgba(122,162,255,.7);
      box-shadow: 0 0 0 3px rgba(122,162,255,.15);
    }

    .help{
      margin:10px 0 0;
      color:var(--muted);
      font-size:12px;
      line-height:1.35;
    }

    .actions{
      display:flex;
      gap:10px;
      margin-top: 14px;
    }
    .btn{
      cursor:pointer;
      user-select:none;
      font-weight:700;
      border:1px solid var(--line);
      background: rgba(122,162,255,.12);
    }
    .btn:hover{ background: rgba(122,162,255,.18); }
    .btn2{
      cursor:pointer;
      user-select:none;
      font-weight:700;
      background: rgba(255,255,255,.04);
    }
    .btn2:hover{ background: rgba(255,255,255,.07); }

    .status{
      font-family: var(--mono);
      white-space: pre-wrap;
      line-height:1.35;
      font-size:13px;
      margin:0;
    }
    .status .ok{ color:var(--good); }
    .status .warn{ color:var(--warn); }
    .status .bad{ color:var(--bad); }

    .monoOut{
      font-family: var(--mono);
      white-space: pre-wrap;
      line-height:1.35;
      font-size:13px;
      margin:0;
    }

    details{
      border:1px solid rgba(39,48,74,.6);
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,.02);
      padding: 10px 12px;
      margin-top: 10px;
    }
    summary{
      cursor:pointer;
      color: var(--text);
      font-weight:700;
      list-style:none;
    }
    summary::-webkit-details-marker{ display:none; }
    .summarySub{
      color: var(--muted);
      font-weight:600;
      font-size:12px;
      margin-top:4px;
    }

    .miniActions{
      display:flex;
      gap:10px;
      margin-top: 10px;
    }

    .tiny{
      font-size:12px;
      color:var(--muted);
    }

    .rightTools{
      display:flex;
      gap:10px;
      align-items:center;
    }

    .iconBtn{
      border:1px solid var(--line);
      background: rgba(255,255,255,.03);
      padding:6px 10px;
      border-radius:999px;
      font-size:12px;
      cursor:pointer;
      color:var(--muted);
    }
    .iconBtn:hover{ background: rgba(255,255,255,.06); color:var(--text); }

    /* Mobile */
    @media (max-width: 940px){
      .grid{ grid-template-columns: 1fr; }
      .row{ grid-template-columns: 1fr; }
      .row3{ grid-template-columns: 1fr; }
      header{ align-items:flex-start; flex-direction:column; }
      .rightTools{ width:100%; justify-content:flex-start; }
      .actions{ flex-direction:column; }
      .miniActions{ flex-direction:column; }
      textarea{ min-height: 160px; }
    }

    /* Sticky compute bar for mobile */
    .stickyBar{
      position: sticky;
      bottom: 0;
      z-index: 10;
      padding: 12px 0 0;
      margin-top: 14px;
      background: linear-gradient(180deg, transparent, rgba(11,13,18,.85) 30%, rgba(11,13,18,.95));
      backdrop-filter: blur(8px);
    }
    .stickyBar .actions{ margin:0; padding: 10px 0 6px; }
    @media (min-width: 941px){
      .stickyBar{ position: static; background: none; backdrop-filter:none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="title">
        <h1>Warium Ballistic Calculator</h1>
        <p class="subtitle">Artillery • Battle Cannon • Mortar • Large Rocket (tick-physics solver, low/high arc)</p>
      </div>
      <div class="rightTools">
        <span class="pill"><span style="color:var(--accent);font-weight:800;">MC 1.20.1</span> • mobile-friendly</span>
        <button class="iconBtn" id="scrollToResults" type="button">Results ↓</button>
      </div>
    </header>

    <div class="grid">
      <!-- INPUTS -->
      <section class="card">
        <div class="card-h">
          <p class="h">Inputs</p>
          <span class="tiny">All distances in blocks. Angles in degrees.</span>
        </div>
        <div class="card-b">

          <label>Weapon</label>
          <select id="weapon">
            <option value="ARTILLERY">Artillery Breech</option>
            <option value="BATTLE">Battle Cannon Breech</option>
            <option value="MORTAR">Mortar</option>
            <option value="LARGE_ROCKET">Large Rocket</option>
          </select>

          <!-- Cannons -->
          <div id="cannonWrap">
            <div class="row">
              <div>
                <label>Cannon facing</label>
                <select id="cannonFacing">
                  <option value="NORTH">North (-Z)</option>
                  <option value="EAST">East (+X)</option>
                  <option value="SOUTH">South (+Z)</option>
                  <option value="WEST">West (-X)</option>
                </select>
              </div>
              <div>
                <label>ProjectileLib installed?</label>
                <select id="plibC">
                  <option value="NO">No (factor 1.0)</option>
                  <option value="YES">Yes (factor 2.0)</option>
                </select>
              </div>
            </div>

            <div class="row">
              <div>
                <label>Arc preference</label>
                <select id="arcPrefC">
                  <option value="LOW">Low arc (flatter)</option>
                  <option value="HIGH">High arc (lob over terrain)</option>
                </select>
              </div>
              <div>
                <label>High-arc minimum elevation (deg)</label>
                <input id="highArcMinDegC" type="number" step="0.1" value="55.0"/>
              </div>
            </div>

            <label>Barrel mode</label>
            <select id="barrelMode">
              <option value="FIXED">I already have N barrels</option>
              <option value="SEARCH">Find minimum barrels to hit (1..Max)</option>
            </select>

            <div class="row" id="barrelFixedRow">
              <div>
                <label>Barrels (count of barrel blocks)</label>
                <input id="barrels" type="number" step="1" min="0" value="12"/>
              </div>
              <div>
                <label>Shooter coordinates represent</label>
                <select id="coordsAreC">
                  <option value="BREECH">Breech block position</option>
                  <option value="MUZZLE">Muzzle/spawn position</option>
                </select>
              </div>
            </div>

            <div class="row" id="barrelSearchRow" style="display:none;">
              <div>
                <label>Max barrels to test</label>
                <input id="maxBarrels" type="number" step="1" min="1" value="16"/>
              </div>
              <div>
                <label>Shooter coordinates represent</label>
                <select id="coordsAreC2">
                  <option value="BREECH">Breech block position</option>
                  <option value="MUZZLE">Muzzle/spawn position</option>
                </select>
              </div>
            </div>

            <p class="help">
              Cannon “high arc” searches near-vertical elevations. Increase minimum elevation (e.g. 65–75°) to clear taller terrain (range drops).
            </p>
          </div>

          <!-- Mortar -->
          <div id="mortarWrap" style="display:none;">
            <div class="row">
              <div>
                <label>Mortar facing</label>
                <select id="mortarFacing">
                  <option value="NORTH">North (-Z)</option>
                  <option value="EAST">East (+X)</option>
                  <option value="SOUTH">South (+Z)</option>
                  <option value="WEST">West (-X)</option>
                </select>
              </div>
              <div>
                <label>Shooter coordinates represent</label>
                <select id="coordsAreM">
                  <option value="BLOCK">Mortar block position</option>
                  <option value="MUZZLE">Muzzle/spawn position</option>
                </select>
              </div>
            </div>

            <div class="row">
              <div>
                <label>Arc preference</label>
                <select id="arcPrefM">
                  <option value="HIGH">High arc (typical mortar)</option>
                  <option value="LOW">Low arc (only if needed)</option>
                </select>
              </div>
              <div>
                <label>High-arc minimum elevation (deg)</label>
                <input id="highArcMinDegM" type="number" step="0.1" value="65.0"/>
              </div>
            </div>

            <details>
              <summary>Advanced mortar parameters</summary>
              <div class="summarySub">Defaults match Warium mortar block launch. Adjust only if your modded mortar differs.</div>

              <div class="row">
                <div>
                  <label>Muzzle speed (blocks/tick)</label>
                  <input id="mSpeed" type="number" step="0.01" value="5.00"/>
                </div>
                <div>
                  <label>Muzzle offset (block coords → spawn)</label>
                  <input id="mMuzzle" type="text" value="+0.5, +3.0, +0.5" readonly/>
                </div>
              </div>

              <p class="help">
                Warium mortar stores PitchTag and adds +0.5 internally when building the shoot vector.
                This calculator outputs PitchTag as <span style="font-family:var(--mono);">tan(AimerPitch) − 0.5</span>.
              </p>
            </details>

            <p class="help">
              Mortar solver includes facing input and supports high-arc shots by default.
            </p>
          </div>

          <!-- Rocket -->
          <div id="rocketWrap" style="display:none;">
            <div class="row">
              <div>
                <label>Mount orientation</label>
                <select id="rocketOri">
                  <option value="HORIZONTAL">Horizontal</option>
                  <option value="VERTICAL">Vertical</option>
                </select>
              </div>
              <div>
                <label>Rocket facing</label>
                <select id="rocketFacing">
                  <!-- options filled dynamically -->
                </select>
              </div>
            </div>

            <div class="row">
              <div>
                <label>ProjectileLib installed?</label>
                <select id="plibR">
                  <option value="NO">No (factor 1.0)</option>
                  <option value="YES">Yes (factor 2.0)</option>
                </select>
              </div>
              <div>
                <label>Vertical reach factor (0–1)</label>
                <input id="rVerticalHorizFactor" type="number" step="0.01" value="0.70"/>
              </div>
            </div>

            <details>
              <summary>Advanced rocket parameters</summary>
              <div class="summarySub">Tune if your ordnance assembly launches with different initial speed/boost.</div>

              <div class="row">
                <div>
                  <label>Initial launch speed (blocks/tick)</label>
                  <input id="rInitSpeed" type="number" step="0.01" value="4.00"/>
                </div>
                <div>
                  <label>Boost ticks</label>
                  <input id="rBoostTicks" type="number" step="1" value="40"/>
                </div>
              </div>

              <div class="row">
                <div>
                  <label>Boost per tick (multiplier base)</label>
                  <input id="rBoostPerTick" type="number" step="0.001" value="0.020"/>
                </div>
                <div>
                  <label>Note</label>
                  <input type="text" value="Boost multiplies velocity after drag/gravity each tick" readonly/>
                </div>
              </div>

              <p class="help">
                Horizontal vs Vertical: vertical uses an “effective horizontal distance” penalty (the factor above) to reflect reduced horizontal reach in practice.
              </p>
            </details>

            <p class="help">
              Rocket outputs both <b>world yaw/pitch</b> and <b>relative yaw to the chosen facing</b> (for horizontal mounts).
            </p>
          </div>

          <hr>

          <div class="row3">
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

          <div class="row3">
            <div>
              <label>Target X</label>
              <input id="tx" type="number" step="0.01" value="700"/>
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

          <div class="row">
            <div>
              <label>Accuracy tolerance (blocks)</label>
              <input id="tol" type="number" step="0.01" value="0.50"/>
            </div>
            <div>
              <label>Max simulation ticks</label>
              <input id="maxt" type="number" step="1" value="900"/>
            </div>
          </div>

          <div class="stickyBar">
            <div class="actions">
              <button class="btn" id="compute" type="button">Compute</button>
              <button class="btn2" id="swap" type="button">Swap shooter / target</button>
            </div>
          </div>

          <p class="help">
            Output conventions:
            <b>World yaw</b> uses Minecraft convention (0=+Z, 90=-X, 180=-Z, -90=+X).
            For cannons/mortar, <b>Aimer yaw/pitch</b> are relative to the weapon’s facing and match Warium’s tan-encoded aim model.
          </p>
        </div>
      </section>

      <!-- RESULTS -->
      <section class="card" id="resultsCard">
        <div class="card-h">
          <p class="h">Results</p>
          <div class="rightTools">
            <button class="iconBtn" id="copyBtn" type="button">Copy</button>
            <button class="iconBtn" id="clearBtn" type="button">Clear</button>
          </div>
        </div>
        <div class="card-b">
          <pre id="status" class="status"></pre>
          <hr>
          <pre id="result" class="monoOut"></pre>
          <hr>
          <label>Copy-friendly</label>
          <textarea id="copy" readonly></textarea>
          <div class="miniActions">
            <button class="btn2" id="copyBtn2" type="button">Copy text above</button>
            <button class="btn2" id="scrollToTop" type="button">Back to inputs ↑</button>
          </div>
        </div>
      </section>
    </div>
  </div>

<script>
(() => {
  const DEG = Math.PI / 180.0;
  const $ = (id) => document.getElementById(id);
  const getNum = (id) => Number($(id).value);

  function wrapDegrees(deg) {
    deg %= 360;
    if (deg >= 180) deg -= 360;
    if (deg < -180) deg += 360;
    return deg;
  }

  // World yaw (Minecraft-ish): 0=+Z, 90=-X, 180=-Z, -90=+X
  function computeMinecraftYawDeg(dx, dz) {
    const yawRad = Math.atan2(-dx, dz);
    return wrapDegrees(yawRad * 180 / Math.PI);
  }

  function basisFromFacing(facing){
    // forward + right in XZ-plane (same basis used in earlier versions)
    switch(facing){
      case "NORTH": return { f:{x:0,z:-1}, r:{x:1,z:0} };
      case "EAST":  return { f:{x:1,z:0},  r:{x:0,z:1} };
      case "SOUTH": return { f:{x:0,z:1},  r:{x:-1,z:0} };
      case "WEST":  return { f:{x:-1,z:0}, r:{x:0,z:-1} };
      default:      return { f:{x:0,z:-1}, r:{x:1,z:0} };
    }
  }

  function projectileLibFactorCannon() { return ($("plibC").value === "YES") ? 2.0 : 1.0; }
  function projectileLibFactorRocket() { return ($("plibR").value === "YES") ? 2.0 : 1.0; }

  // Cannon speed models (edit here if you change Warium formulas)
  function cannonMuzzleSpeed(weapon, barrels){
    const factor = projectileLibFactorCannon();
    const b = barrels;
    if (weapon === "ARTILLERY") return (3.0 + (b / 1.25)) * factor;
    if (weapon === "BATTLE")   return (3.3 + (b / 1.25)) * factor;
    return 0;
  }
  function cannonMuzzleOffset(weapon, barrels){
    if (weapon === "ARTILLERY") return 2 + barrels;
    if (weapon === "BATTLE")   return 1 + barrels;
    return 0;
  }

  // --- Common projectile physics (AbstractArrow-like): move -> drag -> gravity
  function simulateToHorizontal(targetHoriz, targetDy, speed, elevationRad, maxTicks){
    const g = 0.05;
    const drag = 0.99;

    let vx = speed * Math.cos(elevationRad);
    let vy = speed * Math.sin(elevationRad);
    let x = 0.0, y = 0.0;

    let bestAbs = Infinity, bestSigned = 0.0, bestTick = 0;

    for (let t=0; t<maxTicks; t++){
      x += vx; y += vy;

      const dx = targetHoriz - x;
      if (Math.abs(dx) < 1.0){
        const missSigned = y - targetDy;
        const missAbs = Math.abs(missSigned);
        if (missAbs < bestAbs){ bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1; }
      }

      if (x >= targetHoriz){
        const missSigned = y - targetDy;
        const missAbs = Math.abs(missSigned);
        if (missAbs < bestAbs){ bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1; }
        return { reached:true, missSigned:bestSigned, missAbs:bestAbs, ticks:bestTick };
      }

      vx *= drag;
      vy = (vy * drag) - g;
    }
    return { reached:false, missSigned:bestSigned, missAbs:bestAbs, ticks:bestTick };
  }

  // Solve elevation with optional "HIGH arc" lower bound
  function solveElevation(targetHoriz, targetDy, speed, maxTicks, tol, arcPref, highArcMinDeg){
    const minDeg = (arcPref === "HIGH") ? Math.min(89.0, Math.max(0.1, highArcMinDeg)) : 0.1;
    let lo = minDeg * DEG;
    let hi = 89.0 * DEG;

    let best = null;
    let a = lo, b = hi;

    for (let i=0; i<56; i++){
      const mid = 0.5*(a+b);
      const s = simulateToHorizontal(targetHoriz, targetDy, speed, mid, maxTicks);

      if (!best || s.missAbs < best.missAbs) best = { theta:mid, ...s };
      if (s.reached && s.missAbs <= tol) return { ok:true, theta:mid, sample:s };

      if (s.reached){
        if (s.missSigned > 0) b = mid; else a = mid;
      } else {
        // Didn't reach horizontally => reduce angle
        b = mid;
      }
    }

    return best
      ? { ok:false, theta: best.theta, sample: best, reason: best.reached ? `Best miss ${best.missAbs.toFixed(2)} blocks (over tolerance).` : "Did not reach target distance within max ticks." }
      : { ok:false, reason:"No solution found." };
  }

  // Warium aim encoding coupling:
  // direction uses forward=1, lateral=tan(yaw), vertical=tan(pitch)
  // tan(elevation) = tan(pitch) / sqrt(1 + tan(yaw)^2)
  function elevationToWariumPitchDeg(thetaRad, yawDeg){
    const yawTan = Math.tan(yawDeg * DEG);
    const scale = Math.sqrt(1 + yawTan*yawTan);
    const pitchTan = Math.tan(thetaRad) * scale;
    return Math.atan(pitchTan) / DEG;
  }

  function yawToTags(yawDeg, facing){
    const yawTan = Math.tan(yawDeg * DEG);
    const sign = (facing === "NORTH" || facing === "EAST") ? 1.0 : -1.0;
    if (facing === "NORTH" || facing === "SOUTH"){
      return { X: yawTan * sign, Z: 0.0 };
    } else {
      return { X: 0.0, Z: yawTan * sign };
    }
  }

  // --- Large rocket physics: drag+gravity then thrust scaling for first N ticks
  function simulateLargeRocketToHorizontal(targetHoriz, targetDy, speed, elevationRad, maxTicks, projLibFactor, boostTicks, boostPerTick){
    const g = 0.05;
    const drag = 0.99;
    const thrustMul = 1.0 + boostPerTick * projLibFactor;

    let vx = speed * Math.cos(elevationRad);
    let vy = speed * Math.sin(elevationRad);
    let x = 0.0, y = 0.0;

    let bestAbs = Infinity, bestSigned = 0.0, bestTick = 0;

    for (let t=0; t<maxTicks; t++){
      x += vx; y += vy;

      const dx = targetHoriz - x;
      if (Math.abs(dx) < 1.0){
        const missSigned = y - targetDy;
        const missAbs = Math.abs(missSigned);
        if (missAbs < bestAbs){ bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1; }
      }

      if (x >= targetHoriz){
        const missSigned = y - targetDy;
        const missAbs = Math.abs(missSigned);
        if (missAbs < bestAbs){ bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1; }
        return { reached:true, missSigned:bestSigned, missAbs:bestAbs, ticks:bestTick };
      }

      vx *= drag;
      vy = (vy * drag) - g;

      if ((t+1) <= boostTicks){
        vx *= thrustMul;
        vy *= thrustMul;
      }
    }
    return { reached:false, missSigned:bestSigned, missAbs:bestAbs, ticks:bestTick };
  }

  function solveElevationLargeRocket(targetHoriz, targetDy, speed, maxTicks, tol, projLibFactor, boostTicks, boostPerTick){
    let lo = 0.1 * DEG;
    let hi = 89.0 * DEG;

    let best = null;
    let a = lo, b = hi;

    for (let i=0; i<64; i++){
      const mid = 0.5*(a+b);
      const s = simulateLargeRocketToHorizontal(targetHoriz, targetDy, speed, mid, maxTicks, projLibFactor, boostTicks, boostPerTick);

      if (!best || s.missAbs < best.missAbs) best = { theta:mid, ...s };
      if (s.reached && s.missAbs <= tol) return { ok:true, theta:mid, sample:s };

      if (s.reached){
        if (s.missSigned > 0) b = mid; else a = mid;
      } else {
        b = mid;
      }
    }

    return best
      ? { ok:false, theta: best.theta, sample: best, reason: best.reached ? `Best miss ${best.missAbs.toFixed(2)} blocks (over tolerance).` : "Rocket did not reach target distance within max ticks." }
      : { ok:false, reason:"No solution found." };
  }

  // --- UI helpers
  function fmt(n, d=3){ return Number.isFinite(n) ? n.toFixed(d) : "NaN"; }
  function fmt2(n){ return Number.isFinite(n) ? n.toFixed(2) : "NaN"; }

  function setOutputs(statusHtml, resultText, copyText){
    $("status").innerHTML = statusHtml || "";
    $("result").textContent = resultText || "";
    $("copy").value = copyText || "";
  }

  // Rocket facing options depending on mount orientation
  function refreshRocketFacingOptions(){
    const ori = $("rocketOri").value;
    const sel = $("rocketFacing");
    const prev = sel.value;

    sel.innerHTML = "";
    if (ori === "HORIZONTAL"){
      for (const v of ["NORTH","EAST","SOUTH","WEST"]){
        const o = document.createElement("option");
        o.value = v;
        o.textContent = (v==="NORTH"?"North (-Z)":v==="EAST"?"East (+X)":v==="SOUTH"?"South (+Z)":"West (-X)");
        sel.appendChild(o);
      }
      sel.value = ["NORTH","EAST","SOUTH","WEST"].includes(prev) ? prev : "NORTH";
    } else {
      for (const v of ["UP","DOWN"]){
        const o = document.createElement("option");
        o.value = v;
        o.textContent = (v==="UP"?"Up (+Y)":"Down (-Y)");
        sel.appendChild(o);
      }
      sel.value = (prev==="UP"||prev==="DOWN") ? prev : "UP";
    }
  }

  function setWeaponUI(){
    const weapon = $("weapon").value;
    $("cannonWrap").style.display = (weapon === "ARTILLERY" || weapon === "BATTLE") ? "block" : "none";
    $("mortarWrap").style.display = (weapon === "MORTAR") ? "block" : "none";
    $("rocketWrap").style.display = (weapon === "LARGE_ROCKET") ? "block" : "none";
    if (weapon === "LARGE_ROCKET") refreshRocketFacingOptions();
  }

  function setBarrelModeUI(){
    const mode = $("barrelMode").value;
    $("barrelFixedRow").style.display = (mode === "FIXED") ? "grid" : "none";
    $("barrelSearchRow").style.display = (mode === "SEARCH") ? "grid" : "none";
  }

  $("weapon").addEventListener("change", setWeaponUI);
  $("barrelMode").addEventListener("change", setBarrelModeUI);
  $("rocketOri").addEventListener("change", () => refreshRocketFacingOptions());

  setWeaponUI();
  setBarrelModeUI();

  // Swap coordinates
  $("swap").addEventListener("click", () => {
    const sx = $("sx").value, sy = $("sy").value, sz = $("sz").value;
    $("sx").value = $("tx").value; $("sy").value = $("ty").value; $("sz").value = $("tz").value;
    $("tx").value = sx; $("ty").value = sy; $("tz").value = sz;
  });

  // --- Solvers per weapon

  function computeCannonOnce(weapon, facing, shooter, target, barrels, coordsAre, tol, maxTicks, arcPref, highArcMinDeg){
    const basis = basisFromFacing(facing);

    // if shooter coords represent breech, move to muzzle based on barrels
    let sx = shooter.x, sy = shooter.y, sz = shooter.z;
    if (coordsAre === "BREECH"){
      const off = cannonMuzzleOffset(weapon, barrels);
      sx += basis.f.x * off + 0.5;
      sy += 0.5;
      sz += basis.f.z * off + 0.5;
    }

    const dx = target.x - sx;
    const dy = target.y - sy;
    const dz = target.z - sz;

    const forwardDist = dx*basis.f.x + dz*basis.f.z;
    const rightDist   = dx*basis.r.x + dz*basis.r.z;

    const worldYaw = computeMinecraftYawDeg(dx, dz);

    if (forwardDist <= 0.001){
      return { ok:false, reason:"Target is behind relative to cannon facing.", worldYaw };
    }

    const yawAimerDeg = Math.atan2(rightDist, forwardDist) / DEG;
    const horiz = Math.hypot(dx, dz);
    const speed = cannonMuzzleSpeed(weapon, barrels);

    const elev = solveElevation(horiz, dy, speed, maxTicks, tol, arcPref, highArcMinDeg);
    if (!elev.ok){
      const be = elev.sample ? elev.sample : null;
      if (!be) return { ok:false, reason:elev.reason || "Unreachable.", worldYaw };

      const pitchAimerDeg = elevationToWariumPitchDeg(elev.theta, yawAimerDeg);
      const tags = yawToTags(yawAimerDeg, facing);

      return {
        ok:false,
        reason: elev.reason || "Unreachable.",
        worldYaw,
        bestEffort: {
          yawAimerDeg, pitchAimerDeg,
          pitchTag: Math.tan(pitchAimerDeg * DEG),
          xTag: tags.X, zTag: tags.Z,
          miss: be.missAbs, tofTicks: be.ticks,
          speed, horiz, dy
        }
      };
    }

    const pitchAimerDeg = elevationToWariumPitchDeg(elev.theta, yawAimerDeg);
    const tags = yawToTags(yawAimerDeg, facing);

    return {
      ok:true,
      worldYaw,
      yawAimerDeg,
      pitchAimerDeg,
      pitchTag: Math.tan(pitchAimerDeg * DEG),
      xTag: tags.X,
      zTag: tags.Z,
      miss: elev.sample.missAbs,
      tofTicks: elev.sample.ticks,
      speed,
      horiz,
      dy
    };
  }

  function computeMortarOnce(facing, shooter, target, coordsAre, tol, maxTicks, arcPref, highArcMinDeg){
    const basis = basisFromFacing(facing);

    // If shooter coords are the mortar block position, Warium spawns projectile at +0.5,+3.0,+0.5
    let sx = shooter.x, sy = shooter.y, sz = shooter.z;
    if (coordsAre === "BLOCK"){
      sx += 0.5;
      sy += 3.0;
      sz += 0.5;
    }

    const dx = target.x - sx;
    const dy = target.y - sy;
    const dz = target.z - sz;

    const forwardDist = dx*basis.f.x + dz*basis.f.z;
    const rightDist   = dx*basis.r.x + dz*basis.r.z;

    const worldYaw = computeMinecraftYawDeg(dx, dz);

    if (forwardDist <= 0.001){
      return { ok:false, reason:"Target is behind relative to mortar facing.", worldYaw };
    }

    const yawAimerDeg = Math.atan2(rightDist, forwardDist) / DEG;
    const horiz = Math.hypot(dx, dz);

    // Default Warium mortar speed = 5.0f
    const speed = Math.max(0.01, getNum("mSpeed"));

    const elev = solveElevation(horiz, dy, speed, maxTicks, tol, arcPref, highArcMinDeg);
    if (!elev.ok){
      const be = elev.sample ? elev.sample : null;
      if (!be) return { ok:false, reason:elev.reason || "Unreachable.", worldYaw };

      const pitchAimerDeg = elevationToWariumPitchDeg(elev.theta, yawAimerDeg);
      const tags = yawToTags(yawAimerDeg, facing);

      // Mortar pitch storage: storedPitch + 0.5 is used in the shoot vector
      // => storedPitch should be tan(pitch) - 0.5 to make effective yDir = tan(pitch)
      const mortarPitchTag = Math.tan(pitchAimerDeg * DEG) - 0.5;

      return {
        ok:false,
        reason: elev.reason || "Unreachable.",
        worldYaw,
        bestEffort: {
          yawAimerDeg, pitchAimerDeg,
          pitchTag: mortarPitchTag,
          xTag: tags.X, zTag: tags.Z,
          miss: be.missAbs, tofTicks: be.ticks,
          speed, horiz, dy
        }
      };
    }

    const pitchAimerDeg = elevationToWariumPitchDeg(elev.theta, yawAimerDeg);
    const tags = yawToTags(yawAimerDeg, facing);
    const mortarPitchTag = Math.tan(pitchAimerDeg * DEG) - 0.5;

    return {
      ok:true,
      worldYaw,
      yawAimerDeg,
      pitchAimerDeg,
      pitchTag: mortarPitchTag,
      xTag: tags.X,
      zTag: tags.Z,
      miss: elev.sample.missAbs,
      tofTicks: elev.sample.ticks,
      speed,
      horiz,
      dy
    };
  }

  function computeRocketOnce(shooter, target, tol, maxTicks){
    const dx = target.x - shooter.x;
    const dy = target.y - shooter.y;
    const dz = target.z - shooter.z;

    const worldYaw = computeMinecraftYawDeg(dx, dz);
    const horiz = Math.hypot(dx, dz);

    const ori = $("rocketOri").value;        // HORIZONTAL / VERTICAL
    const facing = $("rocketFacing").value;  // N/E/S/W or UP/DOWN
    const verticalFactor = Math.max(0.05, Math.min(1.0, getNum("rVerticalHorizFactor")));

    // Penalize effective horizontal reach for vertical mounts (tunable)
    const horizEffective = (ori === "VERTICAL") ? (horiz / verticalFactor) : horiz;

    const projLib = projectileLibFactorRocket();
    const speed = Math.max(0.01, getNum("rInitSpeed"));
    const boostTicks = Math.max(0, Math.floor(getNum("rBoostTicks")));
    const boostPerTick = Math.max(0, getNum("rBoostPerTick"));

    // For horizontal mounts, compute relative yaw vs facing direction (like cannons)
    let yawRelDeg = NaN;
    let forwardDist = NaN, rightDist = NaN;
    if (ori === "HORIZONTAL"){
      const basis = basisFromFacing(facing);
      forwardDist = dx*basis.f.x + dz*basis.f.z;
      rightDist   = dx*basis.r.x + dz*basis.r.z;
      yawRelDeg = Math.atan2(rightDist, forwardDist) / DEG; // relative to rocket forward axis
    }

    const elev = solveElevationLargeRocket(horizEffective, dy, speed, maxTicks, tol, projLib, boostTicks, boostPerTick);
    if (!elev.ok){
      const be = elev.sample ? elev.sample : null;
      const pitchDeg = Number.isFinite(elev.theta) ? -(elev.theta / DEG) : NaN; // MC pitch: negative is up
      return {
        ok:false,
        reason: elev.reason || "Unreachable.",
        bestEffort: be ? {
          worldYaw, yawRelDeg, pitchDeg,
          miss: be.missAbs, tofTicks: be.ticks,
          speed, horiz, dy,
          ori, facing, verticalFactor,
          forwardDist, rightDist
        } : null
      };
    }

    const pitchDeg = -(elev.theta / DEG);
    return {
      ok:true,
      worldYaw, yawRelDeg, pitchDeg,
      miss: elev.sample.missAbs,
      tofTicks: elev.sample.ticks,
      speed, horiz, dy,
      ori, facing, verticalFactor,
      forwardDist, rightDist
    };
  }

  // --- Render compute
  function renderCompute(){
    const weapon = $("weapon").value;
    const tol = Math.max(0.0001, getNum("tol"));
    const maxTicks = Math.max(50, Math.floor(getNum("maxt")));

    const shooter = { x:getNum("sx"), y:getNum("sy"), z:getNum("sz") };
    const target  = { x:getNum("tx"), y:getNum("ty"), z:getNum("tz") };

    if (weapon === "LARGE_ROCKET"){
      const sol = computeRocketOnce(shooter, target, tol, maxTicks);

      if (!sol.ok){
        const be = sol.bestEffort;
        const status = `<span class="bad">UNREACHABLE</span>\n${sol.reason}\n`;
        const result = be ? (
          `Best effort (Large Rocket)\n` +
          `World yaw:    ${fmt(be.worldYaw,3)}°\n` +
          (Number.isFinite(be.yawRelDeg) ? `Rel yaw:      ${fmt(be.yawRelDeg,3)}° (relative to facing)\n` : ``) +
          `Pitch:        ${fmt(be.pitchDeg,3)}° (MC pitch; negative=up)\n` +
          `Miss:         ${fmt2(be.miss)} blocks\n` +
          `TOF:          ${be.tofTicks} ticks (${(be.tofTicks/20).toFixed(2)}s)\n` +
          `Horiz:        ${fmt2(be.horiz)} blocks   ΔY: ${fmt2(be.dy)}\n` +
          `Mount:        ${be.ori}  Facing: ${be.facing}\n` +
          `VertFactor:   ${fmt(be.verticalFactor,2)}\n` +
          `InitSpeed:    ${fmt(be.speed,3)} blocks/tick\n`
        ) : "";

        const copy =
          `UNREACHABLE (Large Rocket)\n` +
          (be ? `WorldYaw=${fmt(be.worldYaw,3)} RelYaw=${fmt(be.yawRelDeg,3)} Pitch=${fmt(be.pitchDeg,3)} Miss=${fmt2(be.miss)} TOF=${be.tofTicks}t\n` : "");

        setOutputs(status, result, copy);
      } else {
        const status =
          `<span class="ok">REACHABLE</span>\nWithin tolerance (≤ ${tol.toFixed(2)}).\n`;

        const result =
          `Large Rocket\n` +
          `World yaw:    ${fmt(sol.worldYaw,3)}°\n` +
          (Number.isFinite(sol.yawRelDeg) ? `Rel yaw:      ${fmt(sol.yawRelDeg,3)}° (relative to facing)\n` : ``) +
          `Pitch:        ${fmt(sol.pitchDeg,3)}° (MC pitch; negative=up)\n` +
          `Miss:         ${fmt2(sol.miss)} blocks\n` +
          `TOF:          ${sol.tofTicks} ticks (${(sol.tofTicks/20).toFixed(2)}s)\n` +
          `Horiz:        ${fmt2(sol.horiz)} blocks   ΔY: ${fmt2(sol.dy)}\n` +
          `Mount:        ${sol.ori}  Facing: ${sol.facing}\n` +
          `VertFactor:   ${fmt(sol.verticalFactor,2)}\n` +
          `InitSpeed:    ${fmt(sol.speed,3)} blocks/tick\n`;

        const copy =
          `REACHABLE (Large Rocket)\n` +
          `WorldYaw=${fmt(sol.worldYaw,3)} RelYaw=${fmt(sol.yawRelDeg,3)} Pitch=${fmt(sol.pitchDeg,3)}\n` +
          `Miss=${fmt2(sol.miss)} TOF=${sol.tofTicks}t Mount=${sol.ori} Facing=${sol.facing} VertFactor=${fmt(sol.verticalFactor,2)} InitSpeed=${fmt(sol.speed,3)}\n`;

        setOutputs(status, result, copy);
      }
      return;
    }

    if (weapon === "MORTAR"){
      const facing = $("mortarFacing").value;
      const coordsAre = $("coordsAreM").value;

      const arcPref = $("arcPrefM").value;
      const highArcMinDeg = getNum("highArcMinDegM");

      const sol = computeMortarOnce(facing, shooter, target, coordsAre, tol, maxTicks, arcPref, highArcMinDeg);

      if (!sol.ok){
        const be = sol.bestEffort;
        const status = `<span class="bad">UNREACHABLE</span>\n${sol.reason}\n`;
        const result = be ? (
          `Best effort (Mortar)\n` +
          `World yaw:    ${fmt(sol.worldYaw,3)}°\n` +
          `Aimer yaw:    ${fmt(be.yawAimerDeg,3)}° (relative to facing)\n` +
          `Aimer pitch:  ${fmt(be.pitchAimerDeg,3)}° (relative; MC pitch = -this)\n` +
          `Miss:         ${fmt2(be.miss)} blocks\n` +
          `TOF:          ${be.tofTicks} ticks (${(be.tofTicks/20).toFixed(2)}s)\n` +
          `Speed:        ${fmt(be.speed,3)} blocks/tick\n` +
          `Horiz:        ${fmt2(be.horiz)} blocks   ΔY: ${fmt2(be.dy)}\n` +
          `Tags: PitchTag=${fmt(be.pitchTag,6)} XTag=${fmt(be.xTag,6)} ZTag=${fmt(be.zTag,6)}\n`
        ) : "";

        const copy =
          `UNREACHABLE (Mortar)\n` +
          (be ? `WorldYaw=${fmt(sol.worldYaw,3)} Facing=${facing} AimerYaw=${fmt(be.yawAimerDeg,3)} AimerPitch=${fmt(be.pitchAimerDeg,3)} Miss=${fmt2(be.miss)}\n` : "");

        setOutputs(status, result, copy);
      } else {
        const status =
          `<span class="ok">REACHABLE</span>\nWithin tolerance (≤ ${tol.toFixed(2)}).\n` +
          (arcPref === "HIGH" ? `<span class="warn">High arc</span> selected.\n` : "");

        const result =
          `Mortar\n` +
          `World yaw:    ${fmt(sol.worldYaw,3)}°\n` +
          `Aimer yaw:    ${fmt(sol.yawAimerDeg,3)}° (relative to facing)\n` +
          `Aimer pitch:  ${fmt(sol.pitchAimerDeg,3)}° (relative; MC pitch = -this)\n` +
          `\nWarium-style tags:\n` +
          `PitchTag = tan(AimerPitch) − 0.5 = ${fmt(sol.pitchTag,6)}\n` +
          `XTag = ${fmt(sol.xTag,6)}\n` +
          `ZTag = ${fmt(sol.zTag,6)}\n` +
          `\nBallistics:\n` +
          `Speed: ${fmt(sol.speed,3)} blocks/tick\n` +
          `Miss:  ${fmt2(sol.miss)} blocks\n` +
          `TOF:   ${sol.tofTicks} ticks (${(sol.tofTicks/20).toFixed(2)}s)\n` +
          `Arc:   ${arcPref}${arcPref==="HIGH" ? ` (min elev ${highArcMinDeg.toFixed(1)}°)` : ""}\n`;

        const copy =
          `REACHABLE (Mortar)\n` +
          `Facing=${facing} Arc=${arcPref}\n` +
          `AimerYaw=${fmt(sol.yawAimerDeg,3)} AimerPitch=${fmt(sol.pitchAimerDeg,3)}\n` +
          `PitchTag=${fmt(sol.pitchTag,6)} XTag=${fmt(sol.xTag,6)} ZTag=${fmt(sol.zTag,6)}\n` +
          `Speed=${fmt(sol.speed,3)} TOF=${sol.tofTicks}t Miss=${fmt2(sol.miss)} WorldYaw=${fmt(sol.worldYaw,3)}\n`;

        setOutputs(status, result, copy);
      }
      return;
    }

    // ARTILLERY / BATTLE
    const facing = $("cannonFacing").value;
    const arcPref = $("arcPrefC").value;
    const highArcMinDeg = getNum("highArcMinDegC");
    const mode = $("barrelMode").value;

    if (mode === "FIXED"){
      const barrels = Math.max(0, Math.floor(getNum("barrels")));
      const coordsAre = $("coordsAreC").value;

      const sol = computeCannonOnce(weapon, facing, shooter, target, barrels, coordsAre, tol, maxTicks, arcPref, highArcMinDeg);

      if (!sol.ok){
        const be = sol.bestEffort;
        const status = `<span class="bad">UNREACHABLE</span>\n${sol.reason}\n`;
        const result = be ? (
          `Best effort (${weapon})\n` +
          `World yaw:    ${fmt(sol.worldYaw,3)}°\n` +
          `Aimer yaw:    ${fmt(be.yawAimerDeg,3)}° (relative to facing)\n` +
          `Aimer pitch:  ${fmt(be.pitchAimerDeg,3)}° (relative; MC pitch = -this)\n` +
          `Miss:         ${fmt2(be.miss)} blocks\n` +
          `TOF:          ${be.tofTicks} ticks (${(be.tofTicks/20).toFixed(2)}s)\n` +
          `Speed:        ${fmt(be.speed,3)} blocks/tick\n` +
          `Horiz:        ${fmt2(be.horiz)} blocks   ΔY: ${fmt2(be.dy)}\n` +
          `Tags: PitchTag=${fmt(be.pitchTag,6)} XTag=${fmt(be.xTag,6)} ZTag=${fmt(be.zTag,6)}\n`
        ) : "";

        const copy =
          `UNREACHABLE (${weapon})\n` +
          (be ? `Facing=${facing} Barrels=${barrels} Arc=${arcPref} AimerYaw=${fmt(be.yawAimerDeg,3)} AimerPitch=${fmt(be.pitchAimerDeg,3)} Miss=${fmt2(be.miss)}\n` : "");

        setOutputs(status, result, copy);
      } else {
        const status =
          `<span class="ok">REACHABLE</span>\nWithin tolerance (≤ ${tol.toFixed(2)}).\n` +
          (arcPref === "HIGH" ? `<span class="warn">High arc</span> selected.\n` : "");

        const result =
          `${weapon} Cannon\n` +
          `World yaw:    ${fmt(sol.worldYaw,3)}°\n` +
          `Aimer yaw:    ${fmt(sol.yawAimerDeg,3)}° (relative to facing)\n` +
          `Aimer pitch:  ${fmt(sol.pitchAimerDeg,3)}° (relative; MC pitch = -this)\n` +
          `\nWarium tag equivalents:\n` +
          `PitchTag = tan(AimerPitch) = ${fmt(sol.pitchTag,6)}\n` +
          `XTag = ${fmt(sol.xTag,6)}\n` +
          `ZTag = ${fmt(sol.zTag,6)}\n` +
          `\nBallistics:\n` +
          `Barrels: ${barrels}\n` +
          `Speed:   ${fmt(sol.speed,3)} blocks/tick\n` +
          `Miss:    ${fmt2(sol.miss)} blocks\n` +
          `TOF:     ${sol.tofTicks} ticks (${(sol.tofTicks/20).toFixed(2)}s)\n` +
          `Arc:     ${arcPref}${arcPref==="HIGH" ? ` (min elev ${highArcMinDeg.toFixed(1)}°)` : ""}\n`;

        const copy =
          `REACHABLE (${weapon})\n` +
          `Facing=${facing} Barrels=${barrels} Arc=${arcPref}\n` +
          `AimerYaw=${fmt(sol.yawAimerDeg,3)} AimerPitch=${fmt(sol.pitchAimerDeg,3)}\n` +
          `PitchTag=${fmt(sol.pitchTag,6)} XTag=${fmt(sol.xTag,6)} ZTag=${fmt(sol.zTag,6)}\n` +
          `Speed=${fmt(sol.speed,3)} TOF=${sol.tofTicks}t Miss=${fmt2(sol.miss)} WorldYaw=${fmt(sol.worldYaw,3)}\n`;

        setOutputs(status, result, copy);
      }
      return;
    }

    // SEARCH barrels
    const coordsAre = $("coordsAreC2").value;
    const maxB = Math.max(1, Math.floor(getNum("maxBarrels")));

    let bestOk = null;
    let bestEff = null;

    for (let b=1; b<=maxB; b++){
      const sol = computeCannonOnce(weapon, facing, shooter, target, b, coordsAre, tol, maxTicks, arcPref, highArcMinDeg);
      if (sol.ok){
        bestOk = { barrels:b, sol };
        break;
      }
      if (sol.bestEffort){
        const be = sol.bestEffort;
        if (!bestEff || be.miss < bestEff.be.miss){
          bestEff = { barrels:b, worldYaw: sol.worldYaw, be };
        }
      }
    }

    if (!bestOk){
      const status = `<span class="bad">UNREACHABLE</span>\nNo solution within tolerance up to ${maxB} barrels.\n`;
      let result = "";
      let copy = `UNREACHABLE (${weapon})\nFacing=${facing} Arc=${arcPref} MaxBarrels=${maxB}\n`;

      if (bestEff){
        const be = bestEff.be;
        result =
          `Best effort (barrels=${bestEff.barrels})\n` +
          `World yaw:    ${fmt(bestEff.worldYaw,3)}°\n` +
          `Aimer yaw:    ${fmt(be.yawAimerDeg,3)}°\n` +
          `Aimer pitch:  ${fmt(be.pitchAimerDeg,3)}°\n` +
          `Miss:         ${fmt2(be.miss)} blocks\n` +
          `Speed:        ${fmt(be.speed,3)} blocks/tick\n`;
        copy += `BestEffortBarrels=${bestEff.barrels} AimerYaw=${fmt(be.yawAimerDeg,3)} AimerPitch=${fmt(be.pitchAimerDeg,3)} Miss=${fmt2(be.miss)}\n`;
      }

      setOutputs(status, result, copy);
      return;
    }

    const sol = bestOk.sol;
    const status =
      `<span class="ok">REACHABLE</span>\nMinimum barrels found within tolerance.\n` +
      (arcPref === "HIGH" ? `<span class="warn">High arc</span> selected.\n` : "");

    const result =
      `${weapon} Cannon (min barrels)\n` +
      `World yaw:    ${fmt(sol.worldYaw,3)}°\n` +
      `Aimer yaw:    ${fmt(sol.yawAimerDeg,3)}°\n` +
      `Aimer pitch:  ${fmt(sol.pitchAimerDeg,3)}°\n` +
      `\nWarium tag equivalents:\n` +
      `PitchTag = ${fmt(sol.pitchTag,6)}\n` +
      `XTag = ${fmt(sol.xTag,6)}\n` +
      `ZTag = ${fmt(sol.zTag,6)}\n` +
      `\nBallistics:\n` +
      `Barrels needed: ${bestOk.barrels}\n` +
      `Speed:          ${fmt(sol.speed,3)} blocks/tick\n` +
      `Miss:           ${fmt2(sol.miss)} blocks\n` +
      `TOF:            ${sol.tofTicks} ticks (${(sol.tofTicks/20).toFixed(2)}s)\n` +
      `Arc:            ${arcPref}${arcPref==="HIGH" ? ` (min elev ${highArcMinDeg.toFixed(1)}°)` : ""}\n`;

    const copy =
      `REACHABLE (${weapon}) (min barrels)\n` +
      `Facing=${facing} Arc=${arcPref} Barrels=${bestOk.barrels}\n` +
      `AimerYaw=${fmt(sol.yawAimerDeg,3)} AimerPitch=${fmt(sol.pitchAimerDeg,3)}\n` +
      `PitchTag=${fmt(sol.pitchTag,6)} XTag=${fmt(sol.xTag,6)} ZTag=${fmt(sol.zTag,6)}\n` +
      `Speed=${fmt(sol.speed,3)} TOF=${sol.tofTicks}t Miss=${fmt2(sol.miss)} WorldYaw=${fmt(sol.worldYaw,3)}\n`;

    setOutputs(status, result, copy);
  }

  $("compute").addEventListener("click", () => {
    renderCompute();
    $("resultsCard").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  async function copyText(){
    const txt = $("copy").value || "";
    if (!txt.trim()) return;
    try{
      await navigator.clipboard.writeText(txt);
      const prev = $("copyBtn").textContent;
      $("copyBtn").textContent = "Copied ✓";
      $("copyBtn2").textContent = "Copied ✓";
      setTimeout(() => { $("copyBtn").textContent = prev; $("copyBtn2").textContent = "Copy text above"; }, 1100);
    }catch{
      $("copy").focus(); $("copy").select();
      document.execCommand("copy");
    }
  }

  $("copyBtn").addEventListener("click", copyText);
  $("copyBtn2").addEventListener("click", copyText);

  $("clearBtn").addEventListener("click", () => setOutputs("", "", ""));
  $("scrollToTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  $("scrollToResults").addEventListener("click", () => $("resultsCard").scrollIntoView({ behavior: "smooth", block: "start" }));

})();
</script>
</body>
</html>
