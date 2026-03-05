<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Warium Ballistic Calculator (Artillery / Battle Cannon)</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 20px; max-width: 1050px; }
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
    hr { border:0; border-top:1px solid #333; margin:12px 0; }
  </style>
</head>
<body>
  <h1>Warium Ballistic Calculator <span class="pill">1.20.1</span></h1>

  <div class="grid">
    <div class="card">
      <h2 style="font-size:16px;margin:0 0 8px;">Inputs</h2>

      <label>Weapon</label>
      <select id="weapon">
        <option value="ARTILLERY">Artillery Breech (crusty_chunks)</option>
        <option value="BATTLE">Battle Cannon Breech (crusty_chunks)</option>
      </select>

      <div class="row">
        <div>
          <label>Cannon facing</label>
          <select id="facing">
            <option value="NORTH">North (-Z)</option>
            <option value="EAST">East (+X)</option>
            <option value="SOUTH">South (+Z)</option>
            <option value="WEST">West (-X)</option>
          </select>
        </div>
        <div>
          <label>ProjectileLib installed?</label>
          <select id="plib">
            <option value="NO">No (factor 1.0)</option>
            <option value="YES">Yes (factor 2.0)</option>
          </select>
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
          <label>Apply Warium muzzle offset?</label>
          <select id="useMuzzle">
            <option value="YES">Yes (recommended)</option>
            <option value="NO">No (treat shooter coords as muzzle)</option>
          </select>
        </div>
      </div>

      <div class="row" id="barrelSearchRow" style="display:none;">
        <div>
          <label>Max barrels to test</label>
          <input id="maxBarrels" type="number" step="1" min="1" value="16"/>
        </div>
        <div>
          <label>Apply Warium muzzle offset?</label>
          <select id="useMuzzle2">
            <option value="YES">Yes (recommended)</option>
            <option value="NO">No (treat shooter coords as muzzle)</option>
          </select>
        </div>
      </div>

      <label class="small">
        “Barrels” here means the same thing Warium counts: the number of barrel blocks in front of the breech.
      </label>

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
          <label>Max sim ticks</label>
          <input id="maxt" type="number" step="1" value="900"/>
        </div>
      </div>

      <label class="small">
        Physics model: vanilla-arrow style per tick: move → drag 0.99 → gravity 0.05.
      </label>

      <div class="row" style="margin-top:12px;">
        <button id="compute">Compute</button>
        <button id="swap">Swap shooter/target</button>
      </div>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin:0 0 8px;">Output</h2>
      <div id="status" class="mono out"></div>
      <hr>
      <div id="result" class="mono out"></div>
      <hr>
      <label>Copy-friendly</label>
      <textarea id="copy" class="mono" rows="9" readonly></textarea>
      <div class="small" style="margin-top:10px;">
        Notes:
        <ul>
          <li>Yaw/Pitch shown are the degrees you’d set on Warium’s Aimer item.</li>
          <li>“PitchTag / XTag / ZTag” are the actual tan()-encoded BlockEntity values Warium writes.</li>
        </ul>
      </div>
    </div>
  </div>

<script>
  // --- Helpers ---
  const DEG = Math.PI / 180.0;

  function dot(a,b){ return a.x*b.x + a.y*b.y + a.z*b.z; }
  function len2(x,z){ return Math.sqrt(x*x + z*z); }

  function basisFromFacing(facing){
    // forward + right (XZ-plane), matching “looking down barrel”
    // NORTH: forward (0,0,-1), right (1,0,0)
    // EAST:  forward (1,0,0),  right (0,0,1)
    // SOUTH: forward (0,0,1),  right (-1,0,0)
    // WEST:  forward (-1,0,0), right (0,0,-1)
    switch(facing){
      case "NORTH": return { f:{x:0,y:0,z:-1}, r:{x:1,y:0,z:0} };
      case "EAST":  return { f:{x:1,y:0,z:0},  r:{x:0,y:0,z:1} };
      case "SOUTH": return { f:{x:0,y:0,z:1},  r:{x:-1,y:0,z:0} };
      case "WEST":  return { f:{x:-1,y:0,z:0}, r:{x:0,y:0,z:-1} };
      default:      return { f:{x:0,y:0,z:-1}, r:{x:1,y:0,z:0} };
    }
  }

  function projectileLibFactor(){
    return (document.getElementById("plib").value === "YES") ? 2.0 : 1.0;
  }

  // Warium-derived muzzle speed formulas (from jar)
  function muzzleSpeedBlocksPerTick(weapon, barrels){
    const factor = projectileLibFactor();
    const b = barrels;
    if (weapon === "ARTILLERY"){
      // ArtilleryFireScriptProcedure: (3.0 + b/1.25) * factor  (some branch uses 3.2)
      return (3.0 + (b / 1.25)) * factor;
    }
    if (weapon === "BATTLE"){
      // BCFireScriptProcedure: common branch uses (3.3 + b/1.25) * factor
      return (3.3 + (b / 1.25)) * factor;
    }
    return 0;
  }

  // Warium muzzle offset along forward axis (from jar)
  function muzzleOffsetBlocks(weapon, barrels){
    if (weapon === "ARTILLERY") return 2 + barrels;
    if (weapon === "BATTLE")   return 1 + barrels;
    return 0;
  }

  // --- Physics simulation (vanilla-arrow style) ---
  // Per tick:
  // 1) x += vx; y += vy
  // 2) vx *= drag; vy = vy*drag - g
  function simulateToHorizontal(targetHoriz, targetDy, speed, elevationRad, maxTicks){
    const g = 0.05;
    const drag = 0.99;

    let vx = speed * Math.cos(elevationRad);
    let vy = speed * Math.sin(elevationRad);
    let x = 0.0, y = 0.0;

    // best around crossing
    let bestAbs = Infinity, bestSigned = 0.0, bestTick = 0;

    for (let t=0; t<maxTicks; t++){
      x += vx;
      y += vy;

      const dx = targetHoriz - x;
      if (Math.abs(dx) < 1.0){
        const missSigned = y - targetDy;
        const missAbs = Math.abs(missSigned);
        if (missAbs < bestAbs){
          bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1;
        }
      }

      if (x >= targetHoriz){
        const missSigned = y - targetDy;
        const missAbs = Math.abs(missSigned);
        if (missAbs < bestAbs){
          bestAbs = missAbs; bestSigned = missSigned; bestTick = t+1;
        }
        return { reached:true, missSigned:bestSigned, missAbs:bestAbs, ticks:bestTick };
      }

      vx *= drag;
      vy = (vy * drag) - g;
    }
    return { reached:false, missSigned:bestSigned, missAbs:bestAbs, ticks:bestTick };
  }

  // Solve for elevation angle theta (true elevation above horizontal)
  function solveElevation(targetHoriz, targetDy, speed, maxTicks, tol){
    const lo = 0.1 * DEG;
    const hi = 89.0 * DEG;

    const sLo = simulateToHorizontal(targetHoriz, targetDy, speed, lo, maxTicks);
    const sHi = simulateToHorizontal(targetHoriz, targetDy, speed, hi, maxTicks);

    // No solution classification using signs
    // missSigned > 0 means shot is ABOVE target at crossing; <0 means BELOW.
    if (sLo.reached && sHi.reached){
      if (sLo.missSigned > 0 && sHi.missSigned > 0){
        return { ok:false, reason:"Too close / too high: even the flattest shot is still above target at that distance.", best:sLo };
      }
      if (sLo.missSigned < 0 && sHi.missSigned < 0){
        return { ok:false, reason:"Too far / too low: even the highest lob is still below target at that distance.", best:sHi };
      }
    }

    let best = null;
    let a = lo, b = hi;

    for (let i=0; i<45; i++){
      const mid = 0.5*(a+b);
      const s = simulateToHorizontal(targetHoriz, targetDy, speed, mid, maxTicks);

      if (!best || s.missAbs < best.missAbs) best = { theta:mid, ...s };

      if (s.reached && s.missAbs <= tol) return { ok:true, theta:mid, sample:s };

      // Binary search by sign (only reliable if reached)
      if (s.reached){
        if (s.missSigned > 0) b = mid; else a = mid;
      } else {
        // If we didn't reach horiz, increase angle? Not necessarily; but usually more time -> higher angle reduces horiz.
        // We'll just shrink toward lower angle to preserve horiz reach.
        b = mid;
      }
    }

    if (!best) return { ok:false, reason:"No solution found.", best:null };
    return {
      ok: best.reached && best.missAbs <= tol,
      theta: best.theta,
      sample: best,
      reason: best.reached ? `Best miss ${best.missAbs.toFixed(2)} blocks (over tolerance).` : "Projectile did not reach target distance within max ticks."
    };
  }

  // Convert true elevation theta to Warium “Pitch degrees” given yaw degrees
  // Warium direction uses (forward=1, lateral=tan(yaw), vertical=tan(pitch)).
  // That causes: tan(elevation) = tan(pitch) / sqrt(1 + tan(yaw)^2)
  // => tan(pitch) = tan(elevation) * sqrt(1 + tan(yaw)^2)
  function elevationToWariumPitchDeg(thetaRad, yawDeg){
    const yawTan = Math.tan(yawDeg * DEG);
    const scale = Math.sqrt(1 + yawTan*yawTan);
    const pitchTan = Math.tan(thetaRad) * scale;
    return Math.atan(pitchTan) / DEG;
  }

  // Warium BE tag mapping for yaw (based on AimerProcedureProcedure sign logic)
  function yawToTags(yawDeg, facing){
    const yawTan = Math.tan(yawDeg * DEG);
    const sign = (facing === "NORTH" || facing === "EAST") ? 1.0 : -1.0;

    // If cannon faces N/S (stepX==0) => store X = tan(yaw)*sign, Z = 0
    // If cannon faces E/W (stepZ==0) => store Z = tan(yaw)*sign, X = 0
    if (facing === "NORTH" || facing === "SOUTH"){
      return { X: yawTan * sign, Z: 0.0 };
    } else {
      return { X: 0.0, Z: yawTan * sign };
    }
  }

  // --- UI Wiring ---
  const statusEl = document.getElementById("status");
  const resultEl = document.getElementById("result");
  const copyEl = document.getElementById("copy");

  function getNum(id){ return Number(document.getElementById(id).value); }

  function setBarrelModeUI(){
    const mode = document.getElementById("barrelMode").value;
    document.getElementById("barrelFixedRow").style.display = (mode === "FIXED") ? "flex" : "none";
    document.getElementById("barrelSearchRow").style.display = (mode === "SEARCH") ? "flex" : "none";
  }
  document.getElementById("barrelMode").addEventListener("change", setBarrelModeUI);
  setBarrelModeUI();

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

  function computeOnce(weapon, facing, shooter, target, barrels, useMuzzleOffset, tol, maxTicks){
    // Apply muzzle offset if shooter is breech
    let sx = shooter.x, sy = shooter.y, sz = shooter.z;
    const basis = basisFromFacing(facing);

    if (useMuzzleOffset){
      const off = muzzleOffsetBlocks(weapon, barrels);
      sx += basis.f.x * off + 0.5;
      sy += 0.5;
      sz += basis.f.z * off + 0.5;
    }

    const dx = target.x - sx;
    const dy = target.y - sy;
    const dz = target.z - sz;

    // Local distances
    const forwardDist = dx*basis.f.x + dz*basis.f.z;
    const rightDist   = dx*basis.r.x + dz*basis.r.z;

    // If behind the cannon, Warium yaw would go past 90 and tan() blows up.
    if (forwardDist <= 0.001){
      return { ok:false, reason:"Target is behind or at/behind the breech relative to cannon facing (forwardDist ≤ 0).", details:{ forwardDist, rightDist } };
    }

    const yawDeg = Math.atan2(rightDist, forwardDist) / DEG;
    const horiz = Math.sqrt(dx*dx + dz*dz);

    const speed = muzzleSpeedBlocksPerTick(weapon, barrels);

    const elev = solveElevation(horiz, dy, speed, maxTicks, tol);
    if (!elev.ok){
      const best = elev.sample;
      const pitchDegBest = best && best.theta ? elevationToWariumPitchDeg(best.theta, yawDeg) : NaN;
      return {
        ok:false,
        reason:elev.reason || "Unreachable.",
        bestEffort: best ? {
          yawDeg,
          elevationDeg: best.theta/DEG,
          pitchDeg: pitchDegBest,
          miss: best.missAbs,
          tofTicks: best.ticks,
          speed,
          horiz,
          dy
        } : null
      };
    }

    const theta = elev.theta; // true elevation
    const pitchDeg = elevationToWariumPitchDeg(theta, yawDeg);

    const pitchTag = Math.tan(pitchDeg * DEG);
    const yz = yawToTags(yawDeg, facing);

    return {
      ok:true,
      yawDeg,
      elevationDeg: theta/DEG,
      pitchDeg,
      pitchTag,
      xTag: yz.X,
      zTag: yz.Z,
      speed,
      miss: elev.sample.missAbs,
      tofTicks: elev.sample.ticks,
      horiz,
      dy
    };
  }

  document.getElementById("compute").addEventListener("click", () => {
    const weapon = document.getElementById("weapon").value;
    const facing = document.getElementById("facing").value;
    const tol = getNum("tol");
    const maxTicks = Math.max(50, Math.floor(getNum("maxt")));

    const shooter = { x:getNum("sx"), y:getNum("sy"), z:getNum("sz") };
    const target  = { x:getNum("tx"), y:getNum("ty"), z:getNum("tz") };

    statusEl.textContent = "";
    resultEl.textContent = "";
    copyEl.value = "";

    const mode = document.getElementById("barrelMode").value;

    if (mode === "FIXED"){
      const barrels = Math.max(0, Math.floor(getNum("barrels")));
      const useMuzzle = (document.getElementById("useMuzzle").value === "YES");

      const sol = computeOnce(weapon, facing, shooter, target, barrels, useMuzzle, tol, maxTicks);

      if (!sol.ok){
        statusEl.innerHTML = `<span class="bad">UNREACHABLE</span>\n${sol.reason}\n`;
        if (sol.bestEffort){
          const b = sol.bestEffort;
          resultEl.textContent =
            `Best effort:\n` +
            `  Yaw (Aimer):   ${b.yawDeg.toFixed(3)}°\n` +
            `  Pitch (Aimer): ${b.pitchDeg.toFixed(3)}°\n` +
            `  Miss:          ${b.miss.toFixed(2)} blocks\n` +
            `  TOF:           ${b.tofTicks.toFixed(0)} ticks (${(b.tofTicks/20).toFixed(2)}s)\n` +
            `  Speed:         ${b.speed.toFixed(3)} blocks/tick\n` +
            `  Horizontal:    ${b.horiz.toFixed(2)} blocks\n` +
            `  Vertical ΔY:   ${b.dy.toFixed(2)} blocks\n`;
          copyEl.value =
            `UNREACHABLE (best effort)\n` +
            `Yaw=${b.yawDeg.toFixed(3)} Pitch=${b.pitchDeg.toFixed(3)} ` +
            `Miss=${b.miss.toFixed(2)} Speed=${b.speed.toFixed(3)} TOF=${b.tofTicks.toFixed(0)}t\n`;
        }
        return;
      }

      statusEl.innerHTML = `<span class="ok">REACHABLE</span>\nWithin tolerance.\n`;
      resultEl.textContent =
        `Yaw (Aimer):   ${sol.yawDeg.toFixed(3)}°\n` +
        `Pitch (Aimer): ${sol.pitchDeg.toFixed(3)}°  (Warium stores tan(Pitch))\n` +
        `\nWarium BlockEntity tags:\n` +
        `  PitchTag = tan(PitchDeg) = ${sol.pitchTag.toFixed(6)}\n` +
        `  XTag = ${sol.xTag.toFixed(6)}\n` +
        `  ZTag = ${sol.zTag.toFixed(6)}\n` +
        `\nBallistics:\n` +
        `  Barrels:  ${barrels}\n` +
        `  Speed:    ${sol.speed.toFixed(3)} blocks/tick\n` +
        `  Miss:     ${sol.miss.toFixed(2)} blocks (≤ ${tol.toFixed(2)})\n` +
        `  TOF:      ${sol.tofTicks.toFixed(0)} ticks (${(sol.tofTicks/20).toFixed(2)}s)\n` +
        `  Horiz:    ${sol.horiz.toFixed(2)} blocks\n` +
        `  ΔY:       ${sol.dy.toFixed(2)} blocks\n`;

      copyEl.value =
        `REACHABLE\n` +
        `Yaw=${sol.yawDeg.toFixed(3)} Pitch=${sol.pitchDeg.toFixed(3)}\n` +
        `PitchTag=${sol.pitchTag.toFixed(6)} XTag=${sol.xTag.toFixed(6)} ZTag=${sol.zTag.toFixed(6)}\n` +
        `Barrels=${barrels} Speed=${sol.speed.toFixed(3)} TOF=${sol.tofTicks.toFixed(0)}t Miss=${sol.miss.toFixed(2)}\n`;

      return;
    }

    // SEARCH mode
    const maxB = Math.max(1, Math.floor(getNum("maxBarrels")));
    const useMuzzle = (document.getElementById("useMuzzle2").value === "YES");

    let best = null;
    for (let b=1; b<=maxB; b++){
      const sol = computeOnce(weapon, facing, shooter, target, b, useMuzzle, tol, maxTicks);
      if (sol.ok){
        best = { barrels:b, sol };
        break; // minimum barrels found
      }
      // track best effort
      if (sol.bestEffort){
        const be = sol.bestEffort;
        if (!best || (best.sol && be.miss < best.sol.miss)){
          best = { barrels:b, sol:be, bestEffort:true };
        }
      }
    }

    if (!best){
      statusEl.innerHTML = `<span class="bad">UNREACHABLE</span>\nNo solution found up to ${maxB} barrels.\n`;
      return;
    }

    if (best.bestEffort){
      statusEl.innerHTML = `<span class="bad">UNREACHABLE</span>\nNo solution within tolerance up to ${maxB} barrels.\n`;
      const b = best.sol;
      resultEl.textContent =
        `Best effort (barrels=${best.barrels}):\n` +
        `  Yaw (Aimer):   ${b.yawDeg.toFixed(3)}°\n` +
        `  Pitch (Aimer): ${b.pitchDeg.toFixed(3)}°\n` +
        `  Miss:          ${b.miss.toFixed(2)} blocks\n` +
        `  Speed:         ${b.speed.toFixed(3)} blocks/tick\n`;
      copyEl.value =
        `UNREACHABLE (best effort)\n` +
        `Barrels=${best.barrels} Yaw=${b.yawDeg.toFixed(3)} Pitch=${b.pitchDeg.toFixed(3)} Miss=${b.miss.toFixed(2)} Speed=${b.speed.toFixed(3)}\n`;
      return;
    }

    const sol = best.sol;
    statusEl.innerHTML = `<span class="ok">REACHABLE</span>\nMinimum barrels found.\n`;

    // derive tags for output (SEARCH ok path always returns full sol)
    resultEl.textContent =
      `Yaw (Aimer):   ${sol.yawDeg.toFixed(3)}°\n` +
      `Pitch (Aimer): ${sol.pitchDeg.toFixed(3)}°\n` +
      `\nWarium BlockEntity tags:\n` +
      `  PitchTag = ${sol.pitchTag.toFixed(6)}\n` +
      `  XTag = ${sol.xTag.toFixed(6)}\n` +
      `  ZTag = ${sol.zTag.toFixed(6)}\n` +
      `\nBallistics:\n` +
      `  Barrels needed: ${best.barrels}\n` +
      `  Speed:          ${sol.speed.toFixed(3)} blocks/tick\n` +
      `  Miss:           ${sol.miss.toFixed(2)} blocks\n` +
      `  TOF:            ${sol.tofTicks.toFixed(0)} ticks (${(sol.tofTicks/20).toFixed(2)}s)\n`;

    copyEl.value =
      `REACHABLE (min barrels)\n` +
      `Barrels=${best.barrels}\n` +
      `Yaw=${sol.yawDeg.toFixed(3)} Pitch=${sol.pitchDeg.toFixed(3)}\n` +
      `PitchTag=${sol.pitchTag.toFixed(6)} XTag=${sol.xTag.toFixed(6)} ZTag=${sol.zTag.toFixed(6)}\n` +
      `Speed=${sol.speed.toFixed(3)} TOF=${sol.tofTicks.toFixed(0)}t Miss=${sol.miss.toFixed(2)}\n`;
  });
</script>
</body>
</html>
