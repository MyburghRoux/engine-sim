// Mean-value engine torque model shared by the UI, dyno and AudioWorklet.
//
// The old model layered a hand-written normalized "tqCurve" with cam and boost
// multipliers, which made the result depend on stale tables and produced
// unrealistic top-end torque. This model instead builds a torque envelope from
// the engine's physical description:
//
//   * displacement / rotor count
//   * naturally aspirated, turbo, supercharged or diesel induction
//   * max boost, turbo size, cam timing, intake runner length
//   * rated peak torque and peak power at their rated rpm
//
// The envelope is a smooth mean-value torque curve. It has an explicit torque
// peak, a calibrated torque plateau (or fall) to the power peak, and an
// exponential top-end fall-off. The rated torque/power anchors pin the curve to
// the real engine, while the shape parameters are derived from the hardware.
//
// The worklet receives the resulting Nm table plus the corresponding friction
// and boost tables. During transients it scales indicated torque with throttle
// and actual boost, so the dyno curve is the steady-state WOT curve and the
// simulation uses the same curve at part throttle / partial boost.
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const VERSION = 2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  const smoothstep = (x) => {
    x = clamp(x, 0, 1);
    return x * x * (3 - 2 * x);
  };

  const cache = new Map();

  function stockDisplacement(car) {
    if (car.layout === 'rotary') {
      return Math.max(
        0.2,
        num(car.displacement, num(car.cylinders, 2) * 0.654),
      );
    }
    return Math.max(
      0.2,
      num(car.displacement, num(car.cylinders, 4) * 0.5),
    );
  }

  function uiDisplacement() {
    if (typeof document === 'undefined') return undefined;
    const el = document.getElementById('displacement');
    if (!el || !el.dataset || !el.dataset.touched) return undefined;
    const v = Number(el.value);
    return Number.isFinite(v) && v > 0.1 ? v : undefined;
  }

  // Values that define the engine, independent of the live tune.
  function stockSpec(car, sound) {
    const redline = clamp(num(car.redline, 7000), 1000, 25000);
    const idle = clamp(num(car.idleRpm, 800), 300, redline * 0.6);
    const disp = stockDisplacement(car);
    const induction =
      (sound && sound.induction) ||
      (car.sound && car.sound.induction) ||
      car.aspiration ||
      'na';
    const aspiration =
      induction === 'na'
        ? 'na'
        : car.aspiration === 'diesel'
          ? 'diesel'
          : induction;

    const boostMax =
      aspiration === 'na'
        ? 0
        : Math.max(
            0,
            num(
              sound && sound.boost,
              num(car.sound && car.sound.boost, num(car.boost, 0)),
            ),
          );

    // The rated torque/power were measured at the car's stock boost level.
    // Keep that reference so raising/lowering boost changes airflow sensibly.
    const stockInduction =
      car.aspiration || (car.sound && car.sound.induction) || 'na';
    const stockBoostMax =
      stockInduction === 'na'
        ? 0
        : Math.max(
            0,
            num(
              car.sound && car.sound.boost,
              num(car.boost, 0),
            ),
          );

    const nmRpm = clamp(
      num(car.nmRpm, redline * 0.55),
      idle * 1.1,
      redline * 0.985,
    );
    const kwRpm = clamp(
      num(car.kwRpm, redline * 0.85),
      nmRpm + 100,
      redline * 1.01,
    );
    const nm = Math.max(
      1,
      num(
        car.nm,
        num(
          car.peakTorque,
          disp * (aspiration === 'diesel' ? 150 : 100),
        ),
      ),
    );
    const kw = Math.max(0, num(car.kw, (nm * kwRpm * TAU) / 60 / 1000));
    const turboSize = clamp(num(car.turboSize, 0.5), 0, 1);
    const spoolStart = Math.max(
      idle * 1.05,
      redline * (0.1 + 0.16 * turboSize),
    );

    return {
      redline,
      idle,
      disp,
      aspiration,
      boostMax,
      stockBoostMax,
      nmRpm,
      kwRpm,
      nm,
      kw,
      turboSize,
      spoolStart,
      induction,
      // Specific output is a useful proxy for how wide/racy the cam is.
      kwPerL: kw / disp,
    };
  }

  function frictionTorque(car, spec, rpm) {
    // FMEP in bar. Race engines have much lower rubbing friction at high rpm;
    // diesels have higher compression/rotating losses.
    const race =
      spec.redline > 11500 ||
      spec.kwPerL > 140 ||
      /formula 1|ktm 450|yzf|panigale|ducati 1098|ninja h2/i.test(
        car.name || '',
      );
    let a, b, c;
    if (spec.aspiration === 'diesel') {
      a = 1.15;
      b = 0.12;
      c = 0.03;
    } else if (race) {
      a = 0.55;
      b = 0.075;
      c = 0.01;
    } else {
      a = 0.78;
      b = 0.11;
      c = 0.03;
    }
    const n = Math.max(0, rpm) / 1000;
    const fmep = a + b * n + c * n * n;
    return (
      (fmep * 1e5 * spec.disp) / 1000 / (car.layout === 'rotary' ? TAU : 4 * Math.PI)
    );
  }

  function boostAt(spec, rpm) {
    if (spec.boostMax <= 0 || spec.aspiration === 'na') return 0;
    const red = spec.redline;
    const idle = spec.idle;
    if (spec.aspiration === 'super') {
      // Positive-displacement blowers make boost almost linearly with rpm.
      return (
        spec.boostMax *
        (0.18 + 0.82 * Math.pow(clamp(rpm / red, 0, 1.1), 0.85))
      );
    }
    if (spec.aspiration === 'diesel') {
      const start = Math.max(idle * 1.05, red * 0.2);
      const full = Math.max(spec.nmRpm * 0.95, start + 250);
      const spool = smoothstep((rpm - start) / Math.max(1, full - start));
      const top = 1 - 0.06 * smoothstep((rpm - 0.85 * red) / (0.15 * red));
      return spec.boostMax * spool * top;
    }
    // Turbo: spool threshold from idle/turbo size, full boost by torque peak.
    const start = spec.spoolStart;
    const full = Math.max(spec.nmRpm, start + 350);
    const spool = smoothstep((rpm - start) / Math.max(1, full - start));
    const top =
      1 -
      (0.11 + 0.1 * (1 - spec.turboSize)) *
        smoothstep((rpm - 0.8 * red) / (0.2 * red));
    return spec.boostMax * spool * top;
  }

  function shapeSpec(car, sound, spec, opts) {
    const peakIn = Math.max(
      1,
      num(opts && opts.peakTorque, spec.nm),
    );
    const dispIn = Math.max(
      0.2,
      num(opts && opts.displacement, uiDisplacement() || spec.disp),
    );
    const dispScale = clamp(dispIn / spec.disp, 0.1, 8);

    // Changing induction/boost should change airflow (and therefore torque)
    // physically instead of only changing the shape.
    const prStock = 1 + spec.stockBoostMax / 1.01325;
    const prNow = 1 + spec.boostMax / 1.01325;
    const airScale =
      spec.aspiration === 'na' && spec.stockBoostMax <= 0
        ? 1
        : clamp(prNow / prStock, 0.4, 3.5);

    const targetNm = peakIn * dispScale * airScale;
    const targetKw = spec.kw * (targetNm / spec.nm);

    const nm = spec.nmRpm;
    const kwRpm = clamp(spec.kwRpm, nm + 100, spec.redline * 1.01);
    const red = spec.redline;
    const idle = spec.idle;
    const start = Math.max(50, idle * 0.95);
    const camDur = clamp(
      num(sound && sound.camDur, num(car.sound && car.sound.camDur, 0.35)),
      0,
      1,
    );
    const camLift = clamp(
      num(sound && sound.camLift, num(car.sound && car.sound.camLift, 0.3)),
      0,
      1,
    );
    const camOverlap = clamp(
      num(
        sound && sound.camOverlap,
        num(car.sound && car.sound.camOverlap, 0),
      ),
      0,
      1,
    );
    const camTop = clamp(num(car.camTop, 0), 0, 1.2);
    const vtec = Math.max(0, num(car.vtec, 0));

    // Low-end shape. Turbo engines have a much lower off-boost fraction and a
    // steeper rise; diesels are nearly flat from idle; superchargers build
    // progressively.
    let lowBase;
    if (spec.aspiration === 'diesel') lowBase = 0.6;
    else if (spec.aspiration === 'super') lowBase = 0.34;
    else if (spec.aspiration === 'turbo') lowBase = 0.17;
    else lowBase = 0.27;

    // Long intake runners fill the midrange; short runners favour top end.
    const runnerLength = Math.max(0.05, num(car.intakeLength, 0.35));
    const runnerRes = 2572.5 / runnerLength; // rpm of the 4-stroke quarter-wave
    const runnerBias = clamp((runnerRes - nm) / (0.6 * red), -0.6, 0.6);
    lowBase = clamp(lowBase + runnerBias * 0.06, 0.08, 0.78);

    lowBase *= 1 - camTop * 0.08;
    lowBase *= clamp(1 - Math.max(0, camDur - 0.35) * 0.3, 0.55, 1.1);
    lowBase = clamp(lowBase + camOverlap * 0.04, 0.06, 0.8);

    // Fit a smooth low-end curve through the off-idle torque fraction. The
    // beta-like shape u^a * exp(a*(1-u)) is 0 at 0, 1 at the torque peak and
    // has no flat shelf around idle.
    const uIdle = clamp(idle / Math.max(1, nm), 0.03, 0.95);
    let lowA = 1.2;
    if (lowBase > 0.005) {
      let lo = 0.35;
      let hi = 4;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const v = Math.pow(uIdle, mid) * Math.exp(mid * (1 - uIdle));
        if (v > lowBase) lo = mid;
        else hi = mid;
      }
      lowA = clamp((lo + hi) / 2, 0.5, 4);
    }

    // Torque at the power peak. If the rated figures demand more torque than
    // the rated torque peak (rounding / different test conditions), keep a
    // small fall so power still has a distinct peak.
    const xP = kwRpm / nm;
    let R = (targetKw * 60000) / (TAU * kwRpm) / targetNm;
    R = clamp(R, 0.02, 0.995);

    // Smooth fall from torque peak to the power peak. q is solved so that
    // d(power)/d(rpm) is zero exactly at kwRpm:
    //   h(u) = 1 - (1 - R) * u^q
    const q = clamp(
      (R * (xP - 1)) / (xP * Math.max(1e-6, 1 - R)),
      0.4,
      80,
    );

    // Torque after the power peak. Choose a plausible tail and then force the
    // exponential slope to be steep enough that power actually falls.
    let tail = 0.62 + 0.25 * clamp((kwRpm / red - 0.7) / 0.3, 0, 1);
    if (spec.aspiration === 'diesel') tail -= 0.07;
    else if (spec.aspiration === 'turbo') tail -= 0.02;
    else if (spec.aspiration === 'super') tail += 0.02;
    if (spec.redline > 11500 || spec.kwPerL > 140) tail += 0.05;
    tail = clamp(tail, 0.52, 0.95);
    const tailSpan = Math.max(1, red - kwRpm);
    let b = -Math.log(clamp(tail / Math.max(R, 1e-6), 0.05, 1));
    b = Math.max(b, (1.1 * tailSpan) / Math.max(1, kwRpm));
    tail = R * Math.exp(-b);

    const span = Math.max(100, kwRpm - nm);
    const shapeRaw = (rpm) => {
      const r = Math.max(0, rpm);
      let s;
      if (r < nm) {
        const u = clamp(r / Math.max(1, nm), 0, 1);
        s = Math.pow(u, lowA) * Math.exp(lowA * (1 - u));
      } else if (r <= kwRpm) {
        const u = clamp((r - nm) / span, 0, 1);
        s = 1 - (1 - R) * Math.pow(u, q);
      } else if (red <= kwRpm * 1.01) s = R;
      else {
        const v = clamp((r - kwRpm) / tailSpan, 0, 1);
        s = R * Math.exp(-b * v);
      }

      // Honda-style cam change. The shape is renormalized at the torque peak,
      // so this adds a step without moving the rated peak.
      if (vtec > 0) {
        s *= 1 + 0.045 * smoothstep((r - vtec + 160) / 500);
      }
      return clamp(s, 0, 1.2);
    };
    const atNm = Math.max(1e-6, shapeRaw(nm));
    const shape = (rpm) => shapeRaw(rpm) / atNm;

    return {
      targetNm,
      targetKw,
      nm,
      kwRpm,
      red,
      idle,
      start,
      lowBase,
      lowA,
      q,
      R,
      tail,
      b,
      disp: dispIn,
      dispScale,
      airScale,
      maxBoost: spec.boostMax,
      boostMax: spec.boostMax,
      spoolStart: spec.spoolStart,
      aspiration: spec.aspiration,
      shape,
      spec,
    };
  }

  function build(car, sound, opts) {
    sound = sound || {};
    const spec = stockSpec(car, sound);
    const shape = shapeSpec(car, sound, spec, opts || {});
    const N = 120;
    const rpm = new Array(N + 1);
    const nm = new Array(N + 1);
    const fric = new Array(N + 1);
    const boost = new Array(N + 1);
    const fricSpec = { ...spec, disp: shape.disp };
    for (let i = 0; i <= N; i++) {
      const r = (spec.redline * i) / N;
      rpm[i] = r;
      nm[i] = i === 0 ? 0 : shape.targetNm * shape.shape(r);
      fric[i] = frictionTorque(car, fricSpec, r);
      boost[i] = boostAt(spec, r);
    }
    let tqPeak = 0;
    let tqPeakRpm = 0;
    let pwrPeak = 0;
    let pwrPeakRpm = 0;
    for (let i = 1; i < nm.length; i++) {
      if (nm[i] > nm[tqPeak]) tqPeak = i;
      const pwr = (nm[i] * rpm[i] * TAU) / 60 / 1000;
      if (pwr > pwrPeak) {
        pwrPeak = pwr;
        pwrPeakRpm = rpm[i];
      }
    }
    return {
      version: VERSION,
      rpm,
      nm,
      fric,
      boost,
      peakNm: nm[tqPeak],
      peakTqRpm: rpm[tqPeak],
      peakKw: pwrPeak,
      peakKwRpm: pwrPeakRpm,
      targetNm: shape.targetNm,
      targetKw: shape.targetKw,
      maxBoost: shape.maxBoost,
      aspiration: shape.aspiration,
      displacement: shape.disp,
      redline: spec.redline,
      idleRpm: spec.idle,
      nmRpm: spec.nmRpm,
      kwRpm: spec.kwRpm,
      shape,
    };
  }

  function cacheKey(car, sound, opts) {
    return JSON.stringify([
      car.name,
      car.redline,
      car.idleRpm,
      car.displacement,
      car.cylinders,
      car.layout,
      car.aspiration,
      car.peakTorque,
      car.nm,
      car.nmRpm,
      car.kw,
      car.kwRpm,
      car.turboSize,
      car.camTop,
      car.vtec,
      car.intakeLength,
      sound && sound.induction,
      sound && sound.boost,
      sound && sound.camLift,
      sound && sound.camDur,
      sound && sound.camOverlap,
      opts && opts.peakTorque,
      opts && opts.displacement !== undefined
        ? opts.displacement
        : uiDisplacement(),
      opts && opts.kw,
    ]);
  }

  function cachedBuild(car, sound, opts) {
    const key = cacheKey(car, sound, opts);
    let curve = cache.get(key);
    if (!curve) {
      curve = build(car, sound, opts);
      if (cache.size > 80) cache.clear();
      cache.set(key, curve);
    }
    return curve;
  }

  function tableAt(rpm, rpms, vals) {
    if (!rpms || !vals || !rpms.length) return 0;
    const n = Math.min(rpms.length, vals.length);
    if (n < 2) return vals[0] || 0;
    if (rpm <= rpms[0]) return vals[0];
    if (rpm >= rpms[n - 1]) return vals[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (rpm >= rpms[mid]) lo = mid;
      else hi = mid;
    }
    const u = (rpm - rpms[lo]) / Math.max(1, rpms[hi] - rpms[lo]);
    return vals[lo] + (vals[hi] - vals[lo]) * u;
  }

  // Net crankshaft torque at any rpm/load/boost. At WOT and full boost it
  // returns exactly the dyno table value.
  function torqueAt(car, sound, rpm, load, boostBar, opts) {
    const curve = cachedBuild(car, sound, opts);
    const wot = tableAt(rpm, curve.rpm, curve.nm);
    const friction = tableAt(rpm, curve.rpm, curve.fric);
    const boostRef = tableAt(rpm, curve.rpm, curve.boost);
    const th = clamp(num(load, 1), 0, 1);
    const actualBoost = Math.max(0, num(boostBar, boostRef));
    let boostScale = 1;
    if (curve.maxBoost > 0 && boostRef > 0.01) {
      boostScale = clamp(
        (1 + actualBoost / 1.01325) /
          (1 + boostRef / 1.01325),
        0.03,
        2,
      );
    }
    const indWot = wot + friction;
    const indicated = indWot * Math.pow(th, 0.8) * boostScale;
    const frictionNow = friction * (1 + 0.3 * (1 - th));
    return indicated - frictionNow;
  }

  function powerAt(car, sound, rpm, load, boostBar, opts) {
    return (
      (torqueAt(car, sound, rpm, load, boostBar, opts) * rpm * TAU) / 60 / 1000
    );
  }

  function workletParams(car, sound, opts) {
    const curve = cachedBuild(car, sound, opts);
    return {
      version: VERSION,
      rpm: curve.rpm,
      nm: curve.nm,
      fric: curve.fric,
      boostCurve: curve.boost,
      peakTorque: curve.peakNm,
      maxBoost: curve.maxBoost,
    };
  }

  window.__mrEngineModel = {
    version: VERSION,
    build: (car, sound, opts) => cachedBuild(car, sound, opts),
    torqueAt,
    powerAt,
    workletParams,
    tableAt,
  };
})();
