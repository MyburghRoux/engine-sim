// Live dyno for the revving page.
// The curve comes from the shared mean-value engine model, not from the old
// normalized tqCurve table. That means every engine gets a real WOT torque
// curve (Nm) and power is always derived from it:
//
//   P(kW) = T(Nm) * rpm * 2*pi / 60 / 1000
//
// The worklet uses the same table for the simulation.
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

  function model() {
    return window.__mrEngineModel;
  }

  function buildSeries(car, sound) {
    const M = model();
    if (!M) {
      return {
        points: [{ rpm: 0, tq: 0, kw: 0 }],
        maxT: 50,
        maxP: 25,
        red: Math.max(1000, Number(car.redline) || 7000),
        peak: { tq: 0, kw: 0 },
        maxBoost: 0,
      };
    }
    const curve = M.build(car, sound, { peakTorque: car.peakTorque });
    const points = curve.rpm.map((rpm, i) => ({
      rpm,
      tq: curve.nm[i],
      kw: (curve.nm[i] * rpm * TAU) / 60 / 1000,
    }));
    let maxT = 1;
    let maxP = 1;
    let pT = points[0];
    let pP = points[0];
    for (const p of points) {
      if (p.tq > maxT) maxT = p.tq;
      if (p.kw > maxP) maxP = p.kw;
      if (p.tq > pT.tq) pT = p;
      if (p.kw > pP.kw) pP = p;
    }
    return {
      points,
      maxT: Math.ceil(maxT / 50) * 50,
      maxP: Math.ceil(maxP / 25) * 25,
      red: Math.max(1000, curve.redline || car.redline || 7000),
      peak: { tq: pT.tq, kw: pP.kw, tqRpm: pT.rpm, kwRpm: pP.rpm },
      maxBoost: curve.maxBoost || 0,
    };
  }

  function css() {
    const s = document.createElement('style');
    s.id = 'mr-dyno-css';
    s.textContent = `
      #mr-dyno-fixed{position:fixed;right:18px;top:196px;width:340px;z-index:6;
        background:linear-gradient(180deg,rgba(10,12,16,.96),rgba(4,6,9,.96));
        border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 50px rgba(0,0,0,.55);
        color:#e9eef6;font:10px/1.25 ui-monospace,Menlo,Consolas,monospace;padding:10px 12px 8px}
      #mr-dyno-fixed .mr-head,.mr-dyno-inline .mr-head{display:flex;justify-content:space-between;align-items:center;
        gap:8px;text-transform:uppercase;letter-spacing:.12em;color:#7e8da2;font-size:9px;margin-bottom:6px}
      #mr-dyno-fixed .mr-head b,.mr-dyno-inline .mr-head b{color:#ff7a1f;font-weight:600;letter-spacing:.03em;font-size:10px}
      #mr-dyno-fixed canvas,#mr-dyno-tune-canvas{display:block;width:100%;height:190px}
      #mr-dyno-fixed .mr-foot,.mr-dyno-inline .mr-foot{display:flex;justify-content:space-between;gap:8px;
        color:#536176;font-size:8px;letter-spacing:.06em;margin-top:4px}
      #mr-dyno-fixed .mr-key i,.mr-dyno-inline .mr-key i{display:inline-block;width:9px;height:3px;margin-right:4px;vertical-align:middle}
      .revving_root__xicTM.tuning ~ #mr-dyno-fixed{display:none}
      .mr-dyno-inline{margin:0 0 14px;padding:0 0 12px;border-bottom:1px solid rgba(255,255,255,.14)}
      @media(max-width:1000px){#mr-dyno-fixed{width:280px;top:180px}#mr-dyno-fixed canvas{height:160px}}
    `;
    document.head.appendChild(s);
  }

  function panel(fixed) {
    const el = document.createElement('div');
    el.id = fixed ? 'mr-dyno-fixed' : 'mr-dyno-tune';
    if (!fixed) el.className = 'mr-dyno-inline';
    el.innerHTML = `
      <div class="mr-head"><span>Dyno · WOT</span><b id="${fixed ? 'mr-dyno-fixed-peak' : 'mr-dyno-tune-peak'}">—</b></div>
      <canvas id="${fixed ? 'mr-dyno-fixed-canvas' : 'mr-dyno-tune-canvas'}"></canvas>
      <div class="mr-foot"><span class="mr-key"><i style="background:#ff7a1f"></i>torque Nm</span>
        <span class="mr-key"><i style="background:#39b6ff"></i>power kW</span><span class="mr-rpm">—</span></div>`;
    return el;
  }

  function fit(canvas) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return null;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function draw(canvas, data, car, sound) {
    const f = fit(canvas);
    if (!f) return;
    const { ctx, w, h } = f;
    const pad = { l: 34, r: 34, t: 14, b: 18 };
    const x0 = pad.l;
    const x1 = w - pad.r;
    const y0 = pad.t;
    const y1 = h - pad.b;
    ctx.clearRect(0, 0, w, h);
    const P = data.points;
    const maxRpm = data.red;
    const maxT = data.maxT;
    const maxP = data.maxP;
    const X = (rpm) => x0 + ((x1 - x0) * rpm) / maxRpm;
    const YT = (tq) => y1 - ((y1 - y0) * clamp(tq / maxT, 0, 1));
    const YP = (kw) => y1 - ((y1 - y0) * clamp(kw / maxP, 0, 1));

    // grid
    ctx.strokeStyle = 'rgba(126,141,162,.16)';
    ctx.lineWidth = 1;
    ctx.font = '8px ui-monospace,Menlo,Consolas,monospace';
    ctx.fillStyle = '#536176';
    for (let i = 0; i <= 4; i++) {
      const y = y0 + ((y1 - y0) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxT * (1 - i / 4))), x0 - 4, y + 3);
      ctx.textAlign = 'left';
      ctx.fillText(String(Math.round(maxP * (1 - i / 4))), x1 + 4, y + 3);
    }
    const step = maxRpm > 12000 ? 2000 : maxRpm > 7000 ? 2000 : 1000;
    for (let r = 0; r <= maxRpm; r += step) {
      const x = X(r);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(String(r / 1000), x, y1 + 12);
    }
    ctx.fillStyle = '#536176';
    ctx.textAlign = 'left';
    ctx.fillText('Nm', 2, y0 - 3);
    ctx.textAlign = 'right';
    ctx.fillText('kW', w - 2, y0 - 3);
    ctx.textAlign = 'center';
    ctx.fillText('rpm ×1000', (x0 + x1) / 2, y1 + 15);

    // curves
    const path = (getY, color, fill) => {
      ctx.beginPath();
      P.forEach((p, i) => {
        const x = X(p.rpm);
        const y = getY(p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.7;
      ctx.stroke();
      if (fill) {
        ctx.lineTo(x1, y1);
        ctx.lineTo(x0, y1);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, fill);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fill();
      }
    };
    path((p) => YT(p.tq), '#ff7a1f', 'rgba(255,90,31,.13)');
    path((p) => YP(p.kw), '#39b6ff', null);

    // redline marker
    if (maxRpm > 0) {
      ctx.strokeStyle = 'rgba(255,90,31,.35)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(X(maxRpm), y0);
      ctx.lineTo(X(maxRpm), y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const head = canvas.parentElement && canvas.parentElement.querySelector('.mr-head span');
    if (head) {
      head.textContent =
        data.maxBoost > 0
          ? `Dyno · WOT · ${data.maxBoost.toFixed(2)} bar`
          : 'Dyno · WOT';
    }

    // peak labels
    const el =
      document.getElementById(`${canvas.id}-peak`) ||
      (canvas.id.includes('fixed')
        ? document.getElementById('mr-dyno-fixed-peak')
        : document.getElementById('mr-dyno-tune-peak'));
    if (el) {
      el.textContent = `${Math.round(data.peak.kw)} kW · ${Math.round(
        data.peak.tq,
      )} Nm`;
      el.title = `${Math.round(data.peak.tq)} Nm @ ${Math.round(
        data.peak.tqRpm || 0,
      )} rpm · ${Math.round(data.peak.kw)} kW @ ${Math.round(
        data.peak.kwRpm || 0,
      )} rpm`;
    }

    // live rpm dot, using the same load/boost the worklet currently has
    const st = window.__mrState;
    const rpm = st && st.running ? st.rpm : 0;
    if (rpm > 0 && rpm <= maxRpm) {
      const M = model();
      let liveTq = 0;
      if (M) {
        liveTq = Math.max(
          0,
          M.torqueAt(
            car,
            sound,
            rpm,
            st.load || 0,
            st.boost || 0,
            { peakTorque: car.peakTorque },
          ),
        );
      }
      const x = X(rpm);
      ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff7a1f';
      ctx.shadowColor = '#ff7a1f';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, YT(liveTq), 3, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    const rpmEl =
      canvas.parentElement && canvas.parentElement.querySelector('.mr-rpm');
    if (rpmEl)
      rpmEl.textContent = st && st.running ? `${Math.round(rpm)} rpm` : 'engine off';
  }

  function boot() {
    css();
    const fixed = panel(true);
    document.body.appendChild(fixed);
    const tune = panel(false);
    const tunePanel = document.getElementById('tunepanel');
    if (tunePanel) tunePanel.prepend(tune);

    const canvases = [fixed.querySelector('canvas'), tune.querySelector('canvas')];
    let lastDraw = 0;

    function tick(now) {
      const car = window.__mrCar;
      if (!car) {
        requestAnimationFrame(tick);
        return;
      }
      if (!fixed.isConnected) document.body.appendChild(fixed);
      if (!tune.isConnected) {
        const tp = document.getElementById('tunepanel');
        if (tp) tp.prepend(tune);
      }
      const sound = window.__mrSound || car.sound || {};
      const root = document.querySelector('.revving_root__xicTM');
      if (root) fixed.style.display = root.classList.contains('tuning') ? 'none' : '';
      if (now - lastDraw > 80) {
        lastDraw = now;
        const data = buildSeries(car, sound);
        for (const cv of canvases) {
          if (!cv || !cv.offsetParent) continue;
          draw(cv, data, car, sound);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Move the curve immediately on any tune field edit.
    document.addEventListener(
      'input',
      () => {
        const car = window.__mrCar;
        if (!car) return;
        const sound = window.__mrSound || car.sound || {};
        const data = buildSeries(car, sound);
        for (const cv of canvases) if (cv && cv.offsetParent) draw(cv, data, car, sound);
      },
      true,
    );
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
