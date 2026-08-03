(function () {
    "use strict";

    const B = window.WariumBallistics;
    const form = document.getElementById("calculator-form");
    const weaponSelect = document.getElementById("weapon");
    const shellSelect = document.getElementById("shell");
    const barrelsInput = document.getElementById("barrels");
    const barrelsRow = document.getElementById("barrels-row");
    const referenceMode = document.getElementById("reference-mode");
    const runtimeState = document.getElementById("runtime-state");
    const runtimeNote = document.getElementById("runtime-note");
    const referenceNote = document.getElementById("reference-note");
    const status = document.getElementById("status");
    const solutionList = document.getElementById("solution-list");
    const canvas = document.getElementById("trajectory");
    const context = canvas.getContext("2d");

    const summary = {
        range: document.getElementById("summary-range"),
        height: document.getElementById("summary-height"),
        speed: document.getElementById("summary-speed"),
        spread: document.getElementById("summary-spread")
    };

    function option(value, label) {
        const element = document.createElement("option");
        element.value = value;
        element.textContent = label;
        return element;
    }

    function populateWeapons() {
        for (const [id, weapon] of Object.entries(B.WEAPONS)) {
            weaponSelect.appendChild(option(id, weapon.name));
        }
        weaponSelect.value = "artillery";
        populateShells();
    }

    function populateShells() {
        const previous = shellSelect.value;
        shellSelect.replaceChildren();
        const weapon = B.WEAPONS[weaponSelect.value];
        for (const [id, shell] of Object.entries(weapon.shells)) {
            shellSelect.appendChild(option(id, shell.name));
        }
        if ([...shellSelect.options].some((item) => item.value === previous)) shellSelect.value = previous;
        barrelsRow.hidden = !weapon.usesBarrels;
        updateNotes();
    }

    function selectedRuntime() {
        return form.elements.runtime.value === "rpl";
    }

    function updateNotes() {
        const weapon = B.WEAPONS[weaponSelect.value];
        const rpl = selectedRuntime();
        runtimeState.textContent = rpl ? "RPL 2.1.1 profile" : "No-RPL slower profile";
        runtimeNote.textContent = weapon.usesBarrels
            ? (rpl
                ? "Warium applies its 2x launch-speed multiplier to this weapon."
                : "Uses Warium's slower base launch speed.")
            : "Mortar speed is fixed; Warium does not apply the RPL multiplier.";

        if (referenceMode.value === "muzzle") {
            referenceNote.textContent = "Use the projectile spawn point at the muzzle for maximum accuracy.";
        } else if (weaponSelect.value === "mortar") {
            referenceNote.textContent = "Enter the mortar block coordinates. The calculator applies Warium's +0.5 X/Z and +3 Y spawn offset.";
        } else {
            referenceNote.textContent = "Enter the breech block coordinates. The calculator applies block-center and barrel-length muzzle offsets.";
        }
    }

    function numberValue(id) {
        const value = Number(document.getElementById(id).value);
        if (!Number.isFinite(value)) throw new Error("Every coordinate must be a valid number.");
        return value;
    }

    function format(value, digits) {
        return Number(value).toFixed(digits).replace("-0.00", "0.00").replace("-0.0", "0.0");
    }

    function signed(value, digits) {
        const rounded = format(value, digits);
        return value > 0 ? `+${rounded}` : rounded;
    }

    function solutionName(type) {
        if (type === "low") return "Low-angle solution";
        if (type === "high") return "High-angle solution";
        return "Firing solution";
    }

    function renderSolutions(result) {
        solutionList.replaceChildren();
        for (const solution of result.solutions) {
            const card = document.createElement("article");
            card.className = `solution-card ${solution.type}`;
            const pitchRows = result.weaponId === "mortar"
                ? `
                    <div><dt>Mortar aimer pitch</dt><dd>${signed(solution.mortarPitch, 2)} deg</dd></div>
                    <div><dt>True launch elevation</dt><dd>${signed(solution.elevation, 2)} deg</dd></div>`
                : `<div><dt>Minecraft pitch</dt><dd>${signed(solution.minecraftPitch, 2)} deg</dd></div>`;
            card.innerHTML = `
                <header>
                    <h3>${solutionName(solution.type)}</h3>
                    <span>${result.weaponId === "mortar"
                        ? `${signed(solution.mortarPitch, 2)} deg mortar setting`
                        : `${format(solution.elevation, 2)} deg elevation`}</span>
                </header>
                <dl>
                    ${pitchRows}
                    <div><dt>Minecraft yaw</dt><dd>${signed(solution.yaw, 2)} deg</dd></div>
                    <div><dt>Compass bearing</dt><dd>${format(solution.bearing, 2)} deg</dd></div>
                    <div><dt>Flight time</dt><dd>${format(solution.timeSeconds, 2)} s</dd></div>
                    <div><dt>Apex altitude</dt><dd>Y ${format(solution.apexWorldY, 1)}</dd></div>
                    <div><dt>Impact speed</dt><dd>${format(solution.impactSpeedBlocksPerSecond, 1)} m/s</dd></div>
                    <div><dt>Expected error (CEP50)</dt><dd>${format(solution.dispersion.medianMeters, 1)} m / ${format(solution.dispersion.percentError, 2)}%</dd></div>
                    <div><dt>90% miss radius</dt><dd>${format(solution.dispersion.p90Meters, 1)} m</dd></div>
                </dl>`;
            solutionList.appendChild(card);
        }
    }

    function resizeCanvas() {
        const rectangle = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(rectangle.width * ratio));
        canvas.height = Math.max(1, Math.round(rectangle.height * ratio));
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        return { width: rectangle.width, height: rectangle.height };
    }

    function drawEmpty(message) {
        const size = resizeCanvas();
        context.clearRect(0, 0, size.width, size.height);
        context.fillStyle = "#737b70";
        context.font = "13px Consolas, monospace";
        context.textAlign = "center";
        context.fillText(message, size.width / 2, size.height / 2);
    }

    function drawTrajectory(result) {
        if (!result || result.solutions.length === 0) {
            drawEmpty("NO TRAJECTORY");
            return;
        }

        const size = resizeCanvas();
        const width = size.width;
        const height = size.height;
        const padding = { left: 58, right: 24, top: 22, bottom: 42 };
        const allPoints = result.solutions.flatMap((solution) => solution.points);
        allPoints.push({ x: result.geometry.horizontalRange, y: result.geometry.dy });
        const minY = Math.min(0, result.geometry.dy, ...allPoints.map((point) => point.y));
        const maxY = Math.max(1, ...allPoints.map((point) => point.y));
        const range = Math.max(1, result.geometry.horizontalRange);
        const ySpan = Math.max(1, maxY - minY);

        const projectX = (x) => padding.left + (x / range) * (width - padding.left - padding.right);
        const projectY = (y) => padding.top + ((maxY - y) / ySpan) * (height - padding.top - padding.bottom);

        context.clearRect(0, 0, width, height);
        context.lineWidth = 1;
        context.strokeStyle = "#272c27";
        context.fillStyle = "#788075";
        context.font = "11px Consolas, monospace";
        context.textAlign = "center";

        for (let i = 0; i <= 5; i += 1) {
            const x = range * i / 5;
            const px = projectX(x);
            context.beginPath();
            context.moveTo(px, padding.top);
            context.lineTo(px, height - padding.bottom);
            context.stroke();
            context.fillText(`${Math.round(x)} m`, px, height - 17);
        }

        context.textAlign = "right";
        for (let i = 0; i <= 4; i += 1) {
            const y = minY + ySpan * i / 4;
            const py = projectY(y);
            context.beginPath();
            context.moveTo(padding.left, py);
            context.lineTo(width - padding.right, py);
            context.stroke();
            context.fillText(`${Math.round(y)} m`, padding.left - 8, py + 4);
        }

        const targetX = projectX(result.geometry.horizontalRange);
        const targetY = projectY(result.geometry.dy);
        context.strokeStyle = "#ef786d";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(targetX - 6, targetY - 6);
        context.lineTo(targetX + 6, targetY + 6);
        context.moveTo(targetX + 6, targetY - 6);
        context.lineTo(targetX - 6, targetY + 6);
        context.stroke();

        for (const solution of result.solutions) {
            context.strokeStyle = solution.type === "high" ? "#efb95d" : "#9bda55";
            context.lineWidth = 2.5;
            context.beginPath();
            solution.points.forEach((point, index) => {
                const px = projectX(point.x);
                const py = projectY(point.y);
                if (index === 0) context.moveTo(px, py);
                else context.lineTo(px, py);
            });
            context.stroke();
        }
    }

    function calculate() {
        try {
            const weaponId = weaponSelect.value;
            const barrels = Number(barrelsInput.value);
            if (B.WEAPONS[weaponId].usesBarrels && (!Number.isInteger(barrels) || barrels < 1 || barrels > 11)) {
                throw new Error("Barrel blocks must be a whole number from 1 to 11.");
            }

            const inputPosition = {
                x: numberValue("origin-x"),
                y: numberValue("origin-y"),
                z: numberValue("origin-z"),
                referenceMode: referenceMode.value,
                weaponId,
                barrels
            };
            const target = {
                x: numberValue("target-x"),
                y: numberValue("target-y"),
                z: numberValue("target-z")
            };
            const profile = B.getProfile(weaponId, shellSelect.value, barrels, selectedRuntime());
            const reference = B.resolveReferencePosition(inputPosition);
            const result = B.solveTarget({
                origin: reference.origin,
                target,
                speed: profile.speed,
                launchOffset: reference.launchOffset,
                profile
            });

            summary.range.textContent = `${format(result.geometry.horizontalRange, 1)} m`;
            summary.height.textContent = `${signed(result.geometry.dy, 1)} m`;
            summary.speed.textContent = `${format(profile.speed, 2)} blk/t (${format(profile.speedBlocksPerSecond, 0)} m/s)`;
            summary.spread.textContent = format(profile.inaccuracy, 2);

            if (result.solutions.length === 0) {
                status.className = "status-message error";
                status.textContent = result.reason;
            } else {
                status.className = "status-message";
                const countText = result.solutions.length === 2 ? "Low and high arcs found." : "One valid arc found.";
                const mortarNote = weaponId === "mortar"
                    ? " Orient the mortar to the listed yaw first; its pitch setting accounts for Warium's transformed launch vector."
                    : "";
                status.textContent = `${countText}${mortarNote} Error estimates model Warium's random launch inaccuracy.`;
            }

            renderSolutions(result);
            drawTrajectory(result);
            window.lastBallisticResult = result;
            localStorage.setItem("warium-ballistics-inputs", JSON.stringify(Object.fromEntries(new FormData(form))));
        } catch (error) {
            status.className = "status-message error";
            status.textContent = error.message;
            solutionList.replaceChildren();
            drawEmpty("INVALID INPUT");
        }
    }

    function restoreInputs() {
        try {
            const saved = JSON.parse(localStorage.getItem("warium-ballistics-inputs"));
            if (!saved) return;
            for (const [name, value] of Object.entries(saved)) {
                const control = form.elements[name];
                if (!control) continue;
                if (control instanceof RadioNodeList) control.value = value;
                else control.value = value;
            }
        } catch (ignored) {
            // Invalid local state should never prevent the calculator from loading.
        }
    }

    populateWeapons();
    restoreInputs();
    populateShells();
    updateNotes();

    weaponSelect.addEventListener("change", () => {
        populateShells();
        calculate();
    });
    shellSelect.addEventListener("change", calculate);
    referenceMode.addEventListener("change", () => {
        updateNotes();
        calculate();
    });
    form.elements.runtime.forEach((radio) => radio.addEventListener("change", () => {
        updateNotes();
        calculate();
    }));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        calculate();
    });
    window.addEventListener("resize", () => drawTrajectory(window.lastBallisticResult));

    calculate();
})();
