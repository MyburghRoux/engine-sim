"use strict";
(() => {
  var Hs = Object.defineProperty;
  var Gs = (l, i, e) =>
    i in l
      ? Hs(l, i, { enumerable: !0, configurable: !0, writable: !0, value: e })
      : (l[i] = e);
  var s = (l, i, e) => Gs(l, typeof i != "symbol" ? i + "" : i, e);
  function ds(l, i, e) {
    if (l <= 0) return 0;
    if (l < i.idleRpm) return (l * e.idleRpm) / i.idleRpm;
    let t = (l - i.idleRpm) / Math.max(1, i.redline - i.idleRpm);
    return e.idleRpm + t * (e.redline - e.idleRpm);
  }
  var Lt = Math.PI / 180,
    Vt = 343,
    Qt = 200,
    ws = 60,
    Xt = 2 * Qt + 2 * Math.PI * ws;
  function qs(l) {
    let i = Qt,
      e = ws,
      t = i / 2,
      r = Math.PI * e,
      n = l % Xt;
    if ((n < 0 && (n += Xt), n < i)) return { x: -t + n, y: 0, h: 0 };
    if (((n -= i), n < r)) {
      let a = n / e;
      return { x: t + e * Math.sin(a), y: -e + e * Math.cos(a), h: -a };
    }
    if (((n -= r), n < i)) return { x: t - n, y: -2 * e, h: Math.PI };
    n -= i;
    let o = n / e;
    return { x: -t - e * Math.sin(o), y: -e - e * Math.cos(o), h: Math.PI - o };
  }
  var ks = 135,
    _s = 112,
    Ms = 375,
    dt = 345,
    Ys = 600,
    zs = 1.8,
    js = 1,
    Vs = 0.3,
    Xs = 0.25,
    Ks = 0.9,
    Us = 0.3,
    Js = 0.62,
    gs = 250,
    Qs = 1.7,
    jt = 3.5,
    Zs = 3,
    $s = 5e-4,
    ti = (Math.pow(10, 8 / 20) - 1) / (Math.pow(10, 8 / 20) + 1);
  function b(l, i, e) {
    return l < i ? i : l > e ? e : l;
  }
  function si(l, i, e) {
    if (l < i || l >= e) return 0;
    let t = Math.sin((Math.PI * (l - i)) / (e - i));
    return t * t;
  }
  function ii(l, i = 14, e = ks) {
    if (l < e || l >= Ms) return 0;
    let t = (l - e) / i;
    if (t < 1) return t * t * (3 - 2 * t);
    let r = (Ms - l) / 70;
    return r < 1 ? r * r * (3 - 2 * r) : 1;
  }
  function Pt(l) {
    return Math.pow(1 + 4.5 * (1 - Math.cos(l * Lt)), -1.3);
  }
  function tableAt(rpm, rpms, vals) {
    if (!rpms || !vals || !rpms.length) return 0;
    let n = Math.min(rpms.length, vals.length);
    if (n < 2) return vals[0] || 0;
    if (rpm <= rpms[0]) return vals[0];
    if (rpm >= rpms[n - 1]) return vals[n - 1];
    let lo = 0,
      hi = n - 1;
    while (hi - lo > 1) {
      let mid = (lo + hi) >> 1;
      rpm >= rpms[mid] ? (lo = mid) : (hi = mid);
    }
    let u = (rpm - rpms[lo]) / Math.max(1, rpms[hi] - rpms[lo]);
    return vals[lo] + (vals[hi] - vals[lo]) * u;
  }
  var ei = (() => {
      let l = 0;
      for (let i = 0; i < 180; i++) l += Pt(i + 0.5) * Math.sin((i + 0.5) * Lt);
      return l / 720;
    })(),
    nt = class {
      constructor() {
        s(this, "buf", new Float32Array(8192));
        s(this, "w", 0);
        s(this, "len", 100);
        s(this, "delay", 100);
        s(this, "fb", -0.5);
        s(this, "lp", 0);
        s(this, "lpCoef", 0.5);
      }
      set(i, e, t) {
        (this.len = b(i, 2, 8e3)),
          (this.delay = this.len),
          (this.fb = e),
          (this.lpCoef = t);
      }
      stretch(i) {
        this.delay = b(this.len * i, 2, 8e3);
      }
      process(i) {
        let e = this.w - this.delay,
          t = Math.floor(e),
          r = e - t,
          n = this.buf[(t + 8192) & 8191],
          o = this.buf[(t + 8193) & 8191],
          a = n + (o - n) * r;
        return (
          (this.lp += this.lpCoef * (a - this.lp)),
          (this.buf[this.w] = i + this.fb * this.lp),
          (this.w = (this.w + 1) & 8191),
          a
        );
      }
    },
    xt = class {
      constructor() {
        s(this, "s", 2654435769);
      }
      next() {
        let i = this.s;
        return (
          (i ^= i << 13),
          (i ^= i >>> 17),
          (i ^= i << 5),
          (this.s = i >>> 0),
          (this.s / 4294967296) * 2 - 1
        );
      }
    },
    G = class {
      constructor() {
        s(this, "b0", 1);
        s(this, "b1", 0);
        s(this, "b2", 0);
        s(this, "a1", 0);
        s(this, "a2", 0);
        s(this, "z1", 0);
        s(this, "z2", 0);
      }
      setLowpass(i, e, t) {
        let r = (2 * Math.PI * e) / i,
          n = Math.cos(r),
          o = Math.sin(r) / (2 * t),
          a = 1 + o;
        (this.b0 = (1 - n) / 2 / a),
          (this.b1 = (1 - n) / a),
          (this.b2 = this.b0),
          (this.a1 = (-2 * n) / a),
          (this.a2 = (1 - o) / a);
      }
      setPeak(i, e, t, r) {
        let n = Math.pow(10, r / 40),
          o = (2 * Math.PI * e) / i,
          a = Math.cos(o),
          P = Math.sin(o) / (2 * t),
          w = 1 + P / n;
        (this.b0 = (1 + P * n) / w),
          (this.b1 = (-2 * a) / w),
          (this.b2 = (1 - P * n) / w),
          (this.a1 = (-2 * a) / w),
          (this.a2 = (1 - P / n) / w);
      }
      setBandpass(i, e, t) {
        let r = (2 * Math.PI * e) / i,
          n = Math.cos(r),
          o = Math.sin(r) / (2 * t),
          a = 1 + o;
        (this.b0 = o / a),
          (this.b1 = 0),
          (this.b2 = -o / a),
          (this.a1 = (-2 * n) / a),
          (this.a2 = (1 - o) / a);
      }
      process(i) {
        let e = this.b0 * i + this.z1;
        return (
          (this.z1 = this.b1 * i - this.a1 * e + this.z2),
          (this.z2 = this.b2 * i - this.a2 * e),
          e
        );
      }
    },
    Kt = class {
      constructor() {
        s(this, "active", !1);
        s(this, "bank", 0);
        s(this, "t", 0);
        s(this, "n", 0);
        s(this, "at", []);
        s(this, "amp", []);
        s(this, "kr", []);
        s(this, "kf", []);
        s(this, "sr", []);
        s(this, "sf", []);
        s(this, "sh", []);
        s(this, "kh", []);
        s(this, "hiss", []);
        s(this, "rng", new xt());
        s(this, "end", 0);
        s(this, "justLit", 0);
        s(this, "size", 0);
      }
      start(i, e, t, r, n, o) {
        (this.active = !0), (this.t = 0), (this.size = e);
        let a = Math.max(
          1,
          Math.min(6, Math.round(r.popSub * (0.4 + e + 0.4 * n()))),
        );
        this.n = a;
        let P = r.popSpread * 0.001 * i * (0.5 + e);
        this.at = [o];
        for (let S = 1; S < a; S++) this.at.push(o + Math.round(P * n()));
        this.at.sort((S, D) => S - D),
          (this.amp = []),
          (this.kr = []),
          (this.kf = []),
          (this.sr = []),
          (this.sf = []),
          (this.sh = []),
          (this.kh = []),
          (this.hiss = []);
        let w = Math.pow(0.5 + 0.5 * n(), 2);
        for (let S = 0; S < a; S++) {
          let D = t * (S === 0 ? 1 : 0.45 + 0.55 * n()) * (0.8 + 0.4 * n()),
            z = e * (0.6 + 0.8 * n()),
            u = Math.max(0.2, r.popPitch),
            N = ((12e-5 + 5e-4 * z) * (2.2 - 1.2 * w)) / u,
            c = ((0.0012 + 0.006 * z) * (1.5 - 0.5 * w)) / u;
          (N /= 1 + 2.5 * D * r.popCrack * (0.5 + w)),
            this.amp.push(D),
            this.hiss.push(
              D *
                (0.1 + 2.6 * w) *
                r.popBright *
                Math.min(1, 0.4 + D * r.popCrack),
            ),
            this.kh.push(Math.exp(-1 / ((0.0012 + 0.0025 * w) * i))),
            this.sh.push(0),
            this.kr.push(1 - Math.exp(-1 / (N * i))),
            this.kf.push(1 - Math.exp(-1 / (c * i))),
            this.sr.push(0),
            this.sf.push(0);
        }
        (this.bank = n() < 0.5 ? 0 : 1),
          (this.end = this.at[a - 1] + Math.round(0.08 * i));
      }
      process() {
        let i = this.t++,
          e = 0;
        this.justLit = 0;
        for (let t = 0; t < this.n; t++) {
          if (i < this.at[t]) continue;
          let r = i === this.at[t] ? this.amp[t] : 0;
          (this.sf[t] += r + this.kf[t] * (0 - this.sf[t])),
            (this.sr[t] += r + this.kr[t] * (0 - this.sr[t])),
            i === this.at[t]
              ? ((this.sh[t] = this.hiss[t]),
                (this.justLit = Math.max(this.justLit, this.amp[t])))
              : (this.sh[t] *= this.kh[t]),
            (e +=
              this.sf[t] - this.sr[t] + this.sh[t] * this.rng.next() * 0.35);
        }
        return i > this.end && (this.active = !1), e;
      }
    },
    At = class {
      constructor() {
        s(this, "collector", new nt());
        s(this, "mufflerTube", new nt());
        s(this, "tail", new nt());
        s(this, "mufLp", 0);
        s(this, "mufLpCoef", 0.1);
        s(this, "prev", 0);
        s(this, "muffler", 0.5);
        s(this, "air", 0);
        s(this, "airCoef", 0.5);
        s(this, "radLp", 0);
        s(this, "radCoef", 0.02);
        s(this, "tailLen", 100);
        s(this, "chamberGain", 0.5);
      }
      set(i, e, t) {
        let r = (o) => (2 * o * i) / Vt,
          n = (o) => 1 - Math.exp((-2 * Math.PI * o) / i);
        this.collector.set(r(e.collectorLength * t), -0.45, n(4500)),
          this.mufflerTube.set(r(e.chamber * t), 0.6, n(2500)),
          (this.airCoef = n(5e3)),
          (this.radCoef = n(150)),
          (this.tailLen = r(e.tailLength * t)),
          (this.chamberGain = e.chamberGain),
          this.setMuffler(i, e.muffler);
      }
      stretch(i) {
        this.collector.stretch(i),
          this.mufflerTube.stretch(i),
          this.tail.stretch(i);
      }
      setMuffler(i, e) {
        let t = (r) => 1 - Math.exp((-2 * Math.PI * r) / i);
        this.tail.set(this.tailLen, -0.38, t(5e3 - 2500 * e)),
          (this.mufLpCoef = t(1e4 - 7500 * e)),
          (this.muffler = e);
      }
      process(i, e) {
        let t = this.collector.process(i);
        this.mufLp += this.mufLpCoef * (t - this.mufLp);
        let r = this.mufflerTube.process(this.mufLp),
          n = t + this.chamberGain * r + this.muffler * (0.5 * this.mufLp - t),
          o = this.tail.process(n),
          a = o + (1.4 + 2 * e) * (o - this.prev);
        this.prev = o;
        let P = 1.6 + 1.4 * (1 - this.muffler),
          w = a * P,
          S = 2.2,
          D =
            w > 0 ? S * Math.tanh(w / S) : (S * Math.tanh((w * 0.7) / S)) / 0.7;
        return (
          (this.air += this.airCoef * (D - this.air)),
          (this.radLp += this.radCoef * (this.air - this.radLp)),
          (this.air - this.radLp) *
            (0.55 - 0.22 * this.muffler) *
            (1 - 0.55 * this.muffler)
        );
      }
    },
    st = class {
      constructor(i, e, t = 8192) {
        s(this, "len", i);
        s(this, "k", e);
        s(this, "buf");
        s(this, "w", 0);
        this.buf = new Float32Array(t);
      }
      process(i) {
        let e = (this.w - this.len + this.buf.length) % this.buf.length,
          t = this.buf[e],
          r = i - this.k * t;
        return (
          (this.buf[this.w] = r),
          (this.w = (this.w + 1) % this.buf.length),
          t + this.k * r
        );
      }
    },
    it = class {
      constructor(i, e, t, r, n) {
        s(this, "len", i);
        s(this, "depth", e);
        s(this, "rate", t);
        s(this, "fs", n);
        s(this, "buf", new Float32Array(16384));
        s(this, "w", 0);
        s(this, "ph");
        this.ph = r;
      }
      write(i) {
        (this.buf[this.w] = i), (this.w = (this.w + 1) & 16383);
      }
      tap(i) {
        let e = this.w - i,
          t = Math.floor(e),
          r = e - t,
          n = this.buf[(t + 16384) & 16383],
          o = this.buf[(t + 16385) & 16383];
        return n + (o - n) * r;
      }
      read() {
        return (
          (this.ph += (this.rate / this.fs) * 2 * Math.PI),
          this.ph > Math.PI && (this.ph -= 2 * Math.PI),
          this.tap(this.len + this.depth * Math.sin(this.ph))
        );
      }
    },
    Ut = class {
      constructor(i) {
        s(this, "preLen");
        s(this, "pre");
        s(this, "in1");
        s(this, "in2");
        s(this, "apA");
        s(this, "apB");
        s(this, "dA");
        s(this, "dB");
        s(this, "ap2A");
        s(this, "ap2B");
        s(this, "d2A");
        s(this, "d2B");
        s(this, "lpA", 0);
        s(this, "lpB", 0);
        s(this, "lpCoef");
        s(this, "decay", 0.78);
        s(this, "flutter");
        s(this, "flLp", 0);
        s(this, "flCoef");
        s(this, "slap");
        s(this, "tapsL");
        s(this, "tapsR");
        s(this, "out", [0, 0]);
        let e = (t) => (t * i) / 1e3;
        (this.preLen = Math.round(e(12))),
          (this.pre = new it(this.preLen, 0, 0, 0, i)),
          (this.in1 = new st(Math.round(e(4.77)), 0.5)),
          (this.in2 = new st(Math.round(e(3.6)), 0.5)),
          (this.apA = new st(Math.round(e(22.6)), -0.6)),
          (this.apB = new st(Math.round(e(30.5)), -0.6)),
          (this.dA = new it(e(149.6), e(0.6), 0.7, 0, i)),
          (this.dB = new it(e(125), e(0.6), 0.9, 2.1, i)),
          (this.ap2A = new st(Math.round(e(60.5)), 0.5)),
          (this.ap2B = new st(Math.round(e(89.2)), 0.5)),
          (this.d2A = new it(e(106.3), e(0.4), 1.1, 1, i)),
          (this.d2B = new it(e(141.7), e(0.4), 0.55, 3.3, i)),
          (this.lpCoef = 1 - Math.exp((-2 * Math.PI * 4200) / i)),
          (this.flutter = new it(e(26.4), e(0.15), 0.3, 0.5, i)),
          (this.flCoef = 1 - Math.exp((-2 * Math.PI * 1800) / i)),
          (this.slap = [e(17), e(31), e(44)].map(Math.round)),
          (this.tapsL = [e(8.9), e(99.8), e(64.2), e(67), e(6.3), e(35.8)].map(
            Math.round,
          )),
          (this.tapsR = [
            e(11.8),
            e(121.7),
            e(41.3),
            e(89.7),
            e(70.9),
            e(11.2),
          ].map(Math.round));
      }
      process(i, e) {
        this.pre.write(i);
        let t = this.pre.tap(this.preLen),
          r = this.flutter.read();
        (this.flLp += this.flCoef * (r - this.flLp)),
          this.flutter.write(t * 0.6 + this.flLp * 0.62);
        let n = 0,
          o = 0;
        for (let W = 0; W < 3; W++) {
          let rt = this.pre.tap(this.slap[W]);
          (n += rt * (W === 1 ? 0.3 : 0.45)),
            (o += rt * (W === 1 ? 0.45 : 0.3));
        }
        let a = this.in2.process(this.in1.process(t + this.flLp * 0.5)),
          P = a + this.d2B.read() * this.decay,
          w = a + this.d2A.read() * this.decay,
          S = this.apA.process(P);
        this.dA.write(S),
          (this.lpA += this.lpCoef * (this.dA.read() - this.lpA));
        let D = this.ap2A.process(this.lpA * this.decay);
        this.d2A.write(D);
        let z = this.apB.process(w);
        this.dB.write(z),
          (this.lpB += this.lpCoef * (this.dB.read() - this.lpB));
        let u = this.ap2B.process(this.lpB * this.decay);
        this.d2B.write(u);
        let N =
            this.dA.tap(this.tapsL[0]) +
            this.dA.tap(this.tapsL[1]) -
            this.d2A.tap(this.tapsL[2]) +
            this.dB.tap(this.tapsL[3]) -
            this.d2B.tap(this.tapsL[4]) -
            this.d2B.tap(this.tapsL[5]),
          c =
            this.dB.tap(this.tapsR[0]) +
            this.dB.tap(this.tapsR[1]) -
            this.d2B.tap(this.tapsR[2]) +
            this.dA.tap(this.tapsR[3]) -
            this.d2A.tap(this.tapsR[4]) -
            this.d2A.tap(this.tapsR[5]);
        (e[0] = n * 0.9 + this.flLp * 0.8 + N * 0.6),
          (e[1] = o * 0.9 + this.flLp * 0.8 + c * 0.6);
      }
    },
    Jt = class {
      constructor(i) {
        s(this, "buf", new Float32Array(4096));
        s(this, "idx", 0);
        s(
          this,
          "fb",
          Array.from({ length: 6 }, () => new Float32Array(8192)),
        );
        s(this, "fbLen", [2e3, 2300, 2600, 2100, 2400, 2700]);
        s(this, "lp", new Float64Array(6));
        s(this, "fi", 0);
        s(this, "apL", new Float32Array(1024));
        s(this, "apR", new Float32Array(1024));
        s(this, "apLen", [241, 307]);
        s(this, "ai", 0);
        s(this, "tapsL", []);
        s(this, "tapsR", []);
        s(this, "gains", [0.4, 0.28, 0.2, 0.14]);
        s(this, "lpCoef", 0.2);
        s(this, "g", 0.35);
        s(this, "tailGain", 0.6);
        s(this, "fs");
        (this.fs = i), this.setTunnel(!1);
      }
      setTunnel(i) {
        let e = this.fs,
          t = (r) => Math.round((r * e) / 1e3);
        i
          ? ((this.tapsL = [19.3, 41.7, 63.1, 84.9].map(t)),
            (this.tapsR = [27.1, 49.3, 70.7, 92.3].map(t)),
            (this.gains = [0.9, 0.8, 0.7, 0.6]),
            (this.fbLen = [61.7, 83.3, 109.1, 71.3, 97.9, 127.7].map(t)),
            (this.g = 0.72),
            (this.tailGain = 1.6),
            (this.lpCoef = 1 - Math.exp((-2 * Math.PI * 3800) / e)))
          : ((this.tapsL = [7.1, 17.3, 29.9, 43.7].map(t)),
            (this.tapsR = [10.3, 21.1, 34.3, 51.9].map(t)),
            (this.gains = [0.4, 0.28, 0.2, 0.14]),
            (this.fbLen = [41.3, 61.3, 79.9, 47.7, 74.9, 91.1].map(t)),
            (this.g = 0.42),
            (this.tailGain = 0.6),
            (this.lpCoef = 1 - Math.exp((-2 * Math.PI * 2500) / e)));
      }
      process(i, e) {
        this.buf[this.idx] = i;
        let t = 0,
          r = 0;
        for (let u = 0; u < 4; u++)
          (t +=
            this.gains[u] * this.buf[(this.idx - this.tapsL[u] + 4096) & 4095]),
            (r +=
              this.gains[u] *
              this.buf[(this.idx - this.tapsR[u] + 4096) & 4095]);
        this.idx = (this.idx + 1) & 4095;
        let n = 0,
          o = 0;
        for (let u = 0; u < 6; u++) {
          let N = this.fb[u][(this.fi - this.fbLen[u] + 8192) & 8191];
          (this.lp[u] += this.lpCoef * (N - this.lp[u])),
            u < 3 ? (n += this.lp[u]) : (o += this.lp[u]);
        }
        for (let u = 0; u < 6; u++)
          this.fb[u][this.fi] =
            (u < 3 ? t + (this.g * o) / 3 : r + (this.g * n) / 3) *
            (u % 3 === 1 ? -1 : 1);
        this.fi = (this.fi + 1) & 8191;
        let a = (n * this.tailGain) / 3,
          P = (o * this.tailGain) / 3,
          w = this.apL[(this.ai - this.apLen[0] + 1024) & 1023],
          S = this.apR[(this.ai - this.apLen[1] + 1024) & 1023],
          D = a - 0.5 * w,
          z = P - 0.5 * S;
        (this.apL[this.ai] = D),
          (this.apR[this.ai] = z),
          (this.ai = (this.ai + 1) & 1023),
          (e[0] = t + w + 0.5 * D),
          (e[1] = r + S + 0.5 * z);
      }
    },
    Rt = class Rt {
      constructor(i, e) {
        s(this, "fs");
        s(this, "dt");
        s(this, "p");
        s(this, "c", {
          throttle: 0,
          clutch: 1,
          brake: 0,
          gear: 0,
          ignition: !1,
          starter: !1,
          launch: 0,
        });
        s(this, "n", 0);
        s(this, "phi", new Float64Array(16));
        s(this, "bank", new Int8Array(16));
        s(this, "prevPsi", new Float64Array(16));
        s(this, "p0", new Float64Array(16));
        s(this, "pe", new Float64Array(16));
        s(this, "crack", new Float64Array(16));
        s(this, "evoJit", new Float64Array(16));
        s(this, "wet", new Float64Array(16));
        s(this, "plenum", 0);
        s(this, "huntN", 0);
        s(this, "missMask", 0);
        s(this, "huff", 0);
        s(this, "isc", 0);
        s(this, "missing", !1);
        s(this, "fired", 0);
        s(this, "theta", 0);
        s(this, "omega", 0);
        s(this, "omegaIn", 0);
        s(this, "speed", 0);
        s(this, "locked", !1);
        s(this, "twist", 0);
        s(this, "lastRatio", 0);
        s(this, "shaftT", 0);
        s(this, "meshPhase", 0);
        s(this, "meshWob", 0);
        s(this, "meshPhase2", 0);
        s(this, "meshPhaseIn", 0);
        s(this, "shaftPhO", 0);
        s(this, "shaftPhI", 0);
        s(this, "cabin1", new G());
        s(this, "fmt", [[], []]);
        s(this, "fmtLp", [0, 0]);
        s(this, "fmtCabin", -1);
        s(this, "meshNz", new G());
        s(this, "meshNzN", 0);
        s(this, "cabin2", new G());
        s(this, "cabinBuf", new Float32Array(1));
        s(this, "cabinI", 0);
        s(this, "cabinLp", 0);
        s(this, "whineAm", 0);
        s(this, "whineOut", 0);
        s(this, "tcMaxLoad", 1);
        s(this, "tcCut", 0);
        s(this, "tcFuelCut", 0);
        s(this, "tyreSlid", !1);
        s(this, "popCount", 0);
        s(this, "popMax", 0);
        s(this, "driven", 0);
        s(this, "prevSpeed", 0);
        s(this, "cut", !1);
        s(this, "cutT", 0);
        s(this, "throttleS", 0);
        s(this, "clutchS", 1);
        s(this, "loadS", 0);
        s(this, "afterglow", 0);
        s(this, "hiCam", !1);
        s(this, "aliveFor", 0);
        s(this, "stillFor", 0);
        s(this, "wasAlive", !1);
        s(this, "windLp", 0);
        s(this, "windLo", new G());
        s(this, "windMid", new G());
        s(this, "windHi", new G());
        s(this, "windGlass", new G());
        s(this, "windRum", 0);
        s(this, "wk0", 0);
        s(this, "wk1", 0);
        s(this, "wk2", 0);
        s(this, "wkA", 0);
        s(this, "wkL", 0);
        s(this, "wkR", 0);
        s(this, "gust", 0);
        s(this, "pk0", 0);
        s(this, "pk1", 0);
        s(this, "pk2", 0);
        s(this, "pk3", 0);
        s(this, "pk4", 0);
        s(this, "pk5", 0);
        s(this, "pk6", 0);
        s(this, "tyreBp", new G());
        s(this, "tyreHum", 0);
        s(this, "windN", 0);
        s(this, "thumpEnv", 0);
        s(this, "popLp", [0, 0]);
        s(this, "thumpPh", 0);
        s(this, "thumpF", 80);
        s(this, "driftN", 0);
        s(this, "driftA", 0);
        s(this, "driftB", 0);
        s(this, "driftPh", 0);
        s(this, "charge", 1);
        s(this, "running", !1);
        s(this, "valveOpen", !0);
        s(this, "valveCold", 0);
        s(this, "mufEff", -1);
        s(this, "crankTime", 0);
        s(this, "rng", new xt());
        s(
          this,
          "header",
          Array.from({ length: 16 }, () => new nt()),
        );
        s(this, "chains", [new At(), new At()]);
        s(this, "body", new G());
        s(this, "body2", new G());
        s(this, "room");
        s(this, "tunnelRoom");
        s(this, "tunnelOut", new Float32Array(2));
        s(this, "tunnelS", 0);
        s(this, "roomOut", new Float32Array(2));
        s(this, "sceneS", 0);
        s(this, "sceneOn", "none");
        s(this, "carX", 0);
        s(this, "carY", 0);
        s(this, "carH", 0);
        s(this, "flyBuf", new Float32Array(65536));
        s(this, "flyFilled", 0);
        s(this, "flyW", 0);
        s(this, "flyLp", 0);
        s(this, "flyShadow", 0);
        s(this, "intakeTube", new nt());
        s(this, "headerOut", new Float64Array(2));
        s(this, "intakeLp", 0);
        s(this, "intakeLpCoef", 0.1);
        s(this, "blockLp", 0);
        s(this, "blockLpCoef", 0.01);
        s(
          this,
          "bangs",
          Array.from({ length: 12 }, () => new Kt()),
        );
        s(this, "bangOut", new Float64Array(2));
        s(this, "bangRefractory", 0);
        s(this, "popCluster", 0);
        s(this, "cutBurst", 0);
        s(this, "throttlePrev", 0);
        s(this, "liftTime", 0);
        s(this, "boost", 0);
        s(this, "turbo", 0);
        s(this, "bovEnv", 0);
        s(this, "bovStart", 1);
        s(this, "bovPhase", 0);
        s(this, "bovGate", 0);
        s(this, "bovBp", new G());
        s(this, "bovBp2", new G());
        s(this, "surgeT", 0);
        s(this, "surgeN0", 1);
        s(this, "surgePh", 0);
        s(this, "surgeFade", 0);
        s(this, "ventP", 0);
        s(this, "ventV", 0);
        s(this, "jetS", 0);
        s(this, "sFlow", 0);
        s(this, "sPress", 0);
        s(this, "revS", 0);
        s(this, "bovTick", 0);
        s(this, "whinePhase", 0);
        s(this, "whinePhase2", 0);
        s(this, "t51rPhase", 0);
        s(this, "t51rPhase2", 0);
        s(this, "t51rBp", new G());
        s(this, "t51rBp2", new G());
        s(this, "t51rTick", 0);
        s(this, "nSurgePh", 0);
        s(this, "nSurgeEnv", 0);
        s(this, "nSurgeBp", new G());
        s(this, "nSurgeTick", 0);
        s(this, "scrPhase", 0);
        s(this, "scrPhase2", 0);
        s(this, "scrEnv", 0);
        s(this, "scrBp", new G());
        s(this, "scrBp2", new G());
        s(this, "scrBp3", new G());
        s(this, "scrBp4", new G());
        s(this, "scrForm1", new G());
        s(this, "scrForm2", new G());
        s(this, "scrForm3", new G());
        s(this, "scrForm4", new G());
        s(this, "scrBreath", new G());
        s(this, "scrBody", new G());
        s(this, "scrForm5", new G());
        s(this, "scrMetal", new G());
        s(this, "scrHiss", new G());
        s(this, "scrFlutterPh", 0);
        s(this, "scrShimmer", 0);
        s(this, "scrTick", 0);
        s(this, "scrLp", 0);
        s(this, "scrBuf", new Float32Array(256));
        s(this, "scrIdx", 0);
        s(this, "scrFb", 0);
        s(this, "scrJit", 0);
        s(this, "scrFire", 0);
        s(this, "scrFlap", 0);
        s(this, "scrCrack", 0);
        s(this, "scrWas", 0);
        s(this, "scrBurst", 0);
        s(this, "brapFlip", 0);
        s(this, "brapW", new Uint8Array(16));
        s(this, "brapHunt", 0);
        s(this, "brapBangRef", 0);
        s(this, "brapP", {});
        s(this, "brapN", 0);
        s(this, "ersPhase", 0);
        s(this, "ersLevel", 0);
        s(this, "whooshLp", 0);
        s(this, "turboLp", new Float64Array(2));
        s(this, "turboLpCoef", 0.3);
        s(this, "tick", 0);
        s(this, "tickDecay", 0.99);
        s(this, "dcX", new Float64Array(2));
        s(this, "dcY", new Float64Array(2));
        s(this, "kBlow", 0.01);
        s(this, "crackDecay", 0.9);
        s(this, "clipEnv", [0, 0]);
        (this.fs = i),
          (this.dt = 1 / i),
          (this.p = e),
          (this.room = new Jt(i)),
          (this.tunnelRoom = new Ut(i)),
          this.cabin1.setBandpass(i, 820, 2.5),
          this.cabin2.setBandpass(i, 1650, 3),
          (this.cabinBuf = new Float32Array(Math.round(i * 0.0043))),
          this.body.setLowpass(i, 110, 0.75),
          this.body2.setLowpass(i, 240, 0.7),
          (this.kBlow = 1 / (0.0015 * i)),
          (this.crackDecay = Math.exp(-1 / ($s * i))),
          (this.turboLpCoef = 1 - Math.exp((-2 * Math.PI * 2200) / i)),
          (this.tickDecay = Math.exp(-1 / (7e-4 * i))),
          this.setParams(e);
      }
      placeCar() {
        if (this.sceneOn === "flyby")
          (this.carX = -150 + this.sceneS), (this.carY = 0), (this.carH = 0);
        else if (this.sceneOn === "oval") {
          let i = qs(this.sceneS - Qt / 2);
          (this.carX = i.x), (this.carY = i.y), (this.carH = i.h);
        }
      }
      reset() {
        (this.omega = 0),
          (this.omegaIn = 0),
          (this.speed = 0),
          (this.boost = 0),
          (this.turbo = 0),
          (this.locked = !1),
          (this.twist = 0),
          (this.shaftT = 0),
          (this.theta = 0),
          (this.loadS = 0),
          (this.throttleS = 0),
          (this.clutchS = 1),
          (this.running = !1),
          (this.crankTime = 0),
          (this.cut = !1),
          (this.cutT = 0),
          (this.afterglow = 0),
          (this.stillFor = 0),
          (this.tcMaxLoad = 1),
          (this.tcCut = 0),
          (this.tcFuelCut = 0),
          (this.tyreSlid = !1),
          (this.driven = 0),
          (this.charge = 1),
          (this.wasAlive = !1),
          (this.aliveFor = 0),
          (this.scrEnv = 0),
          (this.scrBurst = 0),
          (this.scrCrack = 0),
          (this.bovEnv = 0),
          (this.brapHunt = 0),
          (this.brapFlip = 0),
          (this.brapN = 0),
          (this.popCount = 0),
          (this.popMax = 0),
          (this.missMask = 0),
          (this.fired = 0),
          (this.lastRatio = 0),
          (this.huff = 0),
          (this.plenum = 0),
          (this.huntN = 0),
          (this.missing = !1),
          (this.isc = 0),
          (this.throttlePrev = 0),
          (this.liftTime = 0),
          (this.popCluster = 0),
          (this.cutBurst = 0),
          (this.c.gear = 0),
          this.p0.fill(0),
          this.pe.fill(0),
          this.crack.fill(0),
          this.prevPsi.fill(0),
          this.headerOut.fill(0),
          this.brapW.fill(0),
          this.wet.fill(0);
      }
      setParams(i, e = !1) {
        let t = this.p;
        if (i.engineModel) {
          let m = i.engineModel;
          (i.tqRpm = m.rpm),
            (i.tqCurve = m.nm),
            (i.tqFric = m.fric),
            (i.tqBoost = m.boostCurve),
            (i.tqActual = !0),
            (i.peakTorque = m.peakTorque),
            (i.maxBoost = m.maxBoost),
            delete i.engineModel;
        }
        this.brapP = Object.assign({}, i, {
          popSub: 2,
          popSpread: 6,
          popCrack: 0.55,
          popBright: 1,
          popPitch: 0.88,
          popThump: void 0 !== i.popThump ? i.popThump : 1,
          popWhump: void 0 !== i.popWhump ? i.popWhump : 0.1,
        });
        if (((this.p = i), e)) {
          let a = (this.omega * 60) / (2 * Math.PI);
          this.omega = (ds(a, t, i) * 2 * Math.PI) / 60;
          let P = i.gears[i.gears.length - 1] * i.finalDrive,
            w = ((i.redline * 2 * Math.PI) / 60 / P) * i.wheelRadius;
          this.speed > w && (this.speed = w), (this.locked = !1);
        }
        this.n = Math.min(i.firing.length, 16);
        for (let a = 0; a < this.n; a++)
          (this.phi[a] = i.firing[a].angle),
            (this.bank[a] = i.firing[a].collector ?? i.firing[a].bank);
        let r = this.fs,
          n = (a) => (2 * a * r) / Vt,
          o = (a) => 1 - Math.exp((-2 * Math.PI * a) / r);
        for (let a = 0; a < this.n; a++) {
          let P = ((a * 7919) % 97) / 97 - 0.5;
          this.header[a].set(n(i.headerLength * (1 + 0.2 * P)), -0.55, o(5500));
        }
        this.chains[0].set(r, i, 1),
          this.chains[1].set(r, i, 1.035),
          this.intakeTube.set(n(i.intakeLength), -0.5, o(2500)),
          i.scene !== this.sceneOn &&
            ((this.sceneS = 0),
            this.flyBuf.fill(0),
            (this.flyW = 0),
            (this.flyLp = 0),
            (this.flyFilled = 0),
            (this.sceneOn = i.scene),
            this.placeCar()),
          (this.intakeLpCoef = o(900)),
          (this.blockLpCoef = o(140)),
          this.c.gear > i.gears.length && (this.c.gear = i.gears.length);
      }
      setControls(i) {
        i.gear !== void 0 && i.gear !== this.c.gear && (this.locked = !1),
          Object.assign(this.c, i),
          this.c.gear > this.p.gears.length &&
            (this.c.gear = this.p.gears.length);
      }
      getState() {
        let i = {
          rpm: (this.omega * 60) / (2 * Math.PI),
          speed: this.speed,
          scene: this.sceneOn,
          carX: this.carX,
          carY: this.carY,
          carH: this.carH,
          lap: Math.floor(this.sceneS / Xt),
          gear: this.c.gear,
          load: this.loadS,
          running: this.running,
          cut: this.cut,
          slip: this.omega - this.omegaIn,
          shaftT: this.shaftT,
          tq: this.lastTq || 0,
          twist: this.twist,
          clutch: this.clutchS,
          crank: this.theta,
          fired: this.fired,
          boost: this.boost,
          turbo: this.turbo,
          brapHunt: this.brapHunt,
          brapN: this.brapN,
          screamer: this.scrEnv,
          bov: this.bovEnv,
          pops: this.popCount,
          popSize: this.popMax,
          tc: !!this.tcActive,
          wheelspin: this.tyreSlid,
          tcs: this.tcSlip || 0,
          ers: this.ersLevel,
          valveOpen: this.valveOpen,
          hiCam: this.hiCam,
          missed: this.missMask,
        };
        return (
          (this.fired = 0),
          (this.missMask = 0),
          (this.popCount = 0),
          (this.popMax = 0),
          i
        );
      }
      setCabin(i) {
        for (let e = 0; e < 2; e++)
          this.fmt[e] = Rt.FORMANTS.map(([t, r, n]) => {
            let o = new G();
            return o.setPeak(this.fs, t, r, n * i), o;
          });
        this.fmtCabin = i;
      }
      throughCabin(i, e, t) {
        let r = i;
        for (let n of this.fmt[e]) r = n.process(r);
        return (
          (this.fmtLp[e] += (r - this.fmtLp[e]) * 0.3),
          (this.fmtLp[e] + (r - this.fmtLp[e]) * (1 - 0.45 * t)) / (1 + 0.2 * t)
        );
      }
      out(i, e, t) {
        if (t.clip <= 0) return Math.tanh(i * t.master * jt);
        let r = Math.abs(i),
          n = this.clipEnv[e];
        this.clipEnv[e] = r > n ? n + (r - n) * 0.02 : n + (r - n) * 3e-4;
        let o = Math.max(0.001, this.clipEnv[e]),
          a = o * (1 - 0.8 * t.clip),
          P = b(i, -a, a) * Math.pow(o / a, 0.8);
        return Math.tanh(P * t.master * jt);
      }
      process(i, e = i) {
        let t = this.p,
          r = () => (this.rng.next() + 1) * 0.5,
          n = this.c,
          o = this.fs,
          a = this.dt,
          P = this.n,
          w = 1 - Math.exp(-1 / (0.05 * o)),
          S = 1 - Math.exp(-1 / (0.012 * o)),
          D = 1 - Math.exp(-1 / (0.03 * o)),
          z = 1 - Math.exp(-1 / (0.004 * o));
        let cq = t.tqPeak || 0.85,
          ck = void 0 !== t.tqKw ? Math.max(cq + 0.03, t.tqKw) : 1,
          ce = void 0 !== t.tqEnd ? b(t.tqEnd, 0.3, 1.05) : 0.72,
          cr = void 0 !== t.tqRed ? b(t.tqRed, 0.3, ce) : ce * 0.78;
        let alsSet =
          n.alsRpm > 0
            ? b(n.alsRpm, 3000, Math.max(3000, Math.min(6500, t.redline - 300)))
            : 0;
        if ((this.driftN++, (this.driftN & 3) === 0)) {
          let u = (4 * i.length) / o;
          (this.driftA += ((this.rng.next() - this.driftA) * u) / 0.6),
            (this.driftB += ((this.rng.next() - this.driftB) * u) / 2.5),
            (this.driftPh += u * 0.23);
          let N =
            1 +
            0.006 * this.driftA +
            0.01 * this.driftB +
            0.004 * Math.sin(this.driftPh * 2 * Math.PI);
          for (let c = 0; c < this.n; c++) this.header[c].stretch(N);
          this.chains[0].stretch(N),
            this.chains[1].stretch(1 / N),
            this.intakeTube.stretch(1 + 0.008 * this.driftB);
        }
        for (let u = 0; u < i.length; u++) {
          (this.throttleS +=
            (n.throttle < this.throttleS ? S : w) *
            (n.throttle - this.throttleS)),
            (this.clutchS +=
              (n.clutch < this.clutchS ? z : D) * (n.clutch - this.clutchS)),
            (this.driven +=
              ((n.gear > 0 && this.clutchS > 0.5 ? 1 : 0) - this.driven) *
              (a / 0.15));
          this.tcCut > 0 && (this.tcCut -= a),
            this.tcFuelCut > 0 && (this.tcFuelCut -= a);
          let N = this.throttleS,
            tqCut = b(n.torqueCut || 0, 0, 1),
            boostHold = b(n.boostHold || 0, 0, 1),
            tcOn =
              t.tractionControl &&
              this.speed * 3.6 >= (void 0 !== t.tcMinSpeed ? t.tcMinSpeed : 0);
          if (tcOn) {
            let md = t.tcMode || "soft",
              tg = b(void 0 !== t.tcSlip ? t.tcSlip : 12, 1, 40) / 100,
              sl = this.tcSlip || 0,
              ov = Math.max(0, (sl - tg) / Math.max(tg, 0.02)),
              cut = b(void 0 !== t.tcMaxCut ? t.tcMaxCut : 60, 0, 100) / 100;
            if (ov > 0) {
              if ("aggressive" === md) {
                if (this.tcFuelCut <= 0)
                  this.tcFuelCut =
                    b(void 0 !== t.tcCutTime ? t.tcCutTime : 80, 10, 500) /
                    1000;
                this.cutBurst = Math.max(this.cutBurst, 0.25);
                N = this.throttleS * (1 - 0.55 * Math.min(1, ov));
              } else if ("hard" === md) {
                N = this.throttleS * (1 - cut * Math.min(1, ov * 1.5));
              } else {
                N =
                  this.throttleS *
                  (1 -
                    0.55 *
                      cut *
                      Math.min(1, ov * (void 0 !== t.tcGain ? t.tcGain : 1)));
              }
              N = Math.max(0, N);
            }
            this.tcActive = ov > 0;
          } else {
            this.tcActive = !1;
          }
          let c = (this.omega * 60) / (2 * Math.PI),
            W = Math.max(0, c) / t.redline,
            offAls = !!t.antilag && this.throttleS < 0.15,
            rollAls = !!n.rollingAls && this.running,
            alsOn =
              "turbo" === t.induction &&
              this.running &&
              c > (offAls ? 1800 : 800) &&
              (offAls || rollAls),
            alsLvl = alsOn
              ? b(void 0 !== t.antilagLvl ? t.antilagLvl : 0, 0, 1)
              : 0,
            rollCut = rollAls ? 0.18 : 0,
            rt = n.launch > 0,
            J = rt ? n.launch : rollAls && alsSet > 0 ? alsSet : t.redline,
            It = rt ? t.launchLimiter || "bang" : t.limiter,
            St =
              alsSet > 0 && rollAls
                ? alsSet * (0.02 + 0.09 * (1 - b(this.throttleS, 0, 1)))
                : rt && It === "hold"
                  ? J * 0.12
                  : Math.max(
                      60,
                      J *
                        (0.005 +
                          0.04 *
                            (void 0 !== t.limSoft ? b(t.limSoft, 0, 1) : 0.5)),
                    ),
            alsBst =
              alsSet > 0 && rollAls
                ? b((t.boost || 0) * b(this.throttleS, 0, 1), 0, 1.9)
                : 0,
            Bt = 0;
          It === "bang" && !(alsSet > 0 && rollAls)
            ? c > J
              ? (this.cut || (this.cutT = 0), (this.cut = !0))
              : this.cut &&
                ((this.cutT += a),
                this.cutT >=
                  t.limCut *
                    (0.4 +
                      0.6 *
                        (void 0 !== t.limDepth ? b(t.limDepth, 0, 1) : 1)) &&
                  c <
                    J -
                      Math.max(
                        20,
                        J *
                          (void 0 !== t.limHyst
                            ? b(t.limHyst, 0.0005, 0.08)
                            : 0.005),
                      ) &&
                  (this.cut = !1))
            : ((Bt =
                b((c - (J - St)) / St, 0, 1) *
                (void 0 !== t.limDepth ? b(t.limDepth, 0, 1) : 1)),
              (this.cut = Bt > 0.05));
          let limiterCut = It === "bang" ? this.cut : c > J;
          // Keep the rolling-ALS crackle at part throttle, but fade it out
          // near full throttle so a 100% pull is clean.
          let alsPopScale = b(
            (0.99 - this.throttleS) / 0.09,
            0,
            1,
          );
          c < 50
              ? (this.crankTime = 0)
              : this.running || (this.crankTime += a);
          let j = n.ignition && c > gs && this.crankTime > 0.3;
          j
            ? (this.afterglow = 0.35)
            : this.afterglow > 0 && (this.afterglow -= a);
          let Ot = !j && this.afterglow > 0 && c > gs,
            $t = (j || Ot) && c < J + St;
          if (t.cycle > 720) {
            let h = b((1.5 * (t.idleRpm - c)) / t.idleRpm, -0.08, 0.3);
            this.isc += (h - this.isc) * Math.min(1, a / 0.22);
          } else this.isc = 0;
          let idleT =
              t.idleRpm *
              (1 +
                (t.camIdle
                  ? t.camIdle *
                    (0.16 * Math.sin(this.theta * Lt) + 0.1 * this.brapHunt)
                  : 0)),
            ys = b(
              (t.cycle > 720
                ? (0.4 * (idleT - c)) / idleT + this.isc
                : (1.3 * (idleT - c)) / idleT) + 0.06,
              0,
              0.4,
            ),
            g = $t
              ? Math.min(
                  Math.max(alsSet > 0 && rollAls ? N : ys, N),
                  alsSet > 0 && rollAls ? 1 - 0.05 * Bt : 1 - Bt,
                )
              : N;
          this.loadS = g;
          // Rolling anti-lag holds rpm with a torque cut, not by closing the
          // throttle. Keep airflow/exhaust energy alive so the turbo keeps
          // climbing and the bangs keep firing.
          let alsTorqueCut = alsSet > 0 && rollAls ? b(Bt, 0, 1) : 0;
          let Mt = N < 0.03 && c > t.idleRpm * 1.4;
          N > 0.1 ? (this.liftTime = 0) : (this.liftTime += a),
            this.throttlePrev > 0.3 &&
              n.throttle < 0.05 &&
              c > t.idleRpm * 1.6 &&
              (this.cutBurst = 1),
            (this.throttlePrev +=
              (n.throttle - this.throttlePrev) * Math.min(1, a / 0.08)),
            (this.cutBurst *= 1 - a / 0.22),
            (this.popCluster *= 1 - a / 0.18),
            this.bangRefractory > 0 && this.bangRefractory--,
            this.brapBangRef > 0 && this.brapBangRef--;
          let ot = Mt || Ot;
          this.aliveFor = j ? this.aliveFor + a : 0;
          let ts = j && this.aliveFor < 0.5;
          (this.charge +=
            ((ot ? 0 : 1) - this.charge) *
            (a / (ot ? (Ot ? 0.3 : 0.1) : ts ? 0.35 : 0.05))),
            j && !this.wasAlive && (this.charge = Math.min(this.charge, 0.15)),
            (this.wasAlive = j);
          let Tt = $t && this.tcFuelCut <= 0 && (!ot || this.charge > 0.03),
            et = 0.3 + 0.7 * g,
            ft = Math.min(1, c / 2500),
            Q = t.cycle,
            Ft = 720 / Q,
            Ps =
              Q > 720 ? Math.pow(b(1 - g / 0.2, 0, 1), 1.5) : (1 - g) * (1 - g),
            X =
              t.camOverlap > 0
                ? t.camOverlap *
                  Ps *
                  b(1 - (c - 1.3 * t.idleRpm) / (1.3 * t.idleRpm), 0, 1) *
                  (0.7 + 0.45 * this.huntN)
                : 0;
          if (this.plenum > 1e-4) {
            let h = 120 / (Math.max(300, c) * P * Ft);
            Q === 720
              ? (this.plenum *= 1 - a / (zs * h))
              : X <= 0 && (this.plenum *= 1 - a / 0.1);
          } else this.plenum = 0;
          this.huff *= 1 - a / 0.012;
          let brapPort =
              t.cycle > 720
                ? b(
                    ((void 0 !== t.camOverlap ? t.camOverlap : 0) - 0.12) /
                      0.83,
                    0,
                    1,
                  )
                : 0,
            brapLow = b(
              (t.redline * 0.34 - c) /
                Math.max(1, t.redline * 0.34 - t.idleRpm * 1.15),
              0,
              1,
            ),
            brapLvl =
              brapPort *
              brapLow *
              (0.35 + 0.65 * (1 - Math.min(1, this.throttleS * 1.5))) *
              (this.speed < 1 && n.gear === 0
                ? 0.3 +
                  0.7 *
                    b(
                      (c - t.idleRpm * 1.15) / Math.max(1, t.idleRpm * 0.6),
                      0,
                      1,
                    )
                : 1),
            camDur = b(void 0 !== t.camDur ? t.camDur : 0.35, 0, 1),
            camLift = b(void 0 !== t.camLift ? t.camLift : 0.3, 0, 1),
            portTop =
              t.cycle > 720
                ? brapPort *
                  b((c / t.redline - 0.18) / 0.82, 0, 1) *
                  b(g * 1.4, 0, 1)
                : 0,
            Et = b(
              t.blowdownSharp * b((g - 0.12) / 0.88, 0, 1) + 0.28 * portTop,
              0,
              1.6,
            ),
            Ls = Math.min(
              14 / (1 + 1.33 * Et),
              (0.001 * 6 * Math.max(300, c)) / (1 + 2 * Et),
            ),
            xs = Zs * Math.sqrt(Et);
          t.vtecRpm > 0
            ? !this.hiCam && c > t.vtecRpm && N > 0.35
              ? (this.hiCam = !0)
              : this.hiCam &&
                (c < t.vtecRpm - 250 || N < 0.15) &&
                (this.hiCam = !1)
            : (this.hiCam = !1);
          let Nt = this.hiCam ? 18 : 0,
            ht = (Q > 720 ? _s : ks) - Nt,
            As = this.hiCam ? 1.7 : 1,
            Cs = this.running;
          (this.running = j && c > Math.max(t.idleRpm * 0.45, 350)),
            this.running && !Cs && (this.valveCold = t.valveCold),
            this.valveCold > 0 && (this.valveCold -= a),
            t.valve === "open"
              ? (this.valveOpen = !0)
              : t.valve === "closed"
                ? (this.valveOpen = !1)
                : this.valveCold > 0
                  ? (this.valveOpen = !0)
                  : c > t.valveRpm
                    ? (this.valveOpen = !0)
                    : c < t.valveRpm - 500 && (this.valveOpen = !1);
          let Wt = this.valveOpen ? t.muffler : Math.min(1, t.muffler + 0.55);
          if (
            (this.mufEff < 0 && (this.mufEff = Wt),
            Math.abs(Wt - this.mufEff) > 0.002)
          ) {
            this.mufEff += (Wt - this.mufEff) * Math.min(1, a / 0.25);
            for (let h of this.chains) h.setMuffler(o, this.mufEff);
          }
          (this.theta += c * 6 * a), this.theta >= Q && (this.theta -= Q);
          let Rs = this.theta;
          (this.headerOut[0] = 0), (this.headerOut[1] = 0);
          let Dt = 0,
            Ht = 0,
            ss = 0,
            is = 0;
          for (let h = 0; h < P; h++) {
            let p = Rs - this.phi[h];
            p < 0 && (p += Q), (p *= Ft);
            let v = this.prevPsi[h];
            this.prevPsi[h] = p;
            let y = Math.sin(p * Lt);
            if (p < v - 360) {
              (this.fired |= 1 << h),
                (this.evoJit[h] = 3 * this.rng.next()),
                (this.brapW[h] = 0);
              let brapWeak = !1;
              if (brapLvl > 0.02) {
                (this.brapFlip ^= 1),
                  (brapWeak = 0 === this.brapFlip || r() < 0.06 * brapLvl),
                  (this.brapHunt += (r() * 2 - 1 - this.brapHunt) * 0.12);
              }
              if (
                rollAls &&
                alsSet > 0 &&
                this.throttleS > 0.65 &&
                this.boost >=
                  (alsBst > 0 ? alsBst * 0.88 : (t.boost || 1.9) * 0.97) &&
                this.bangRefractory <= 0 &&
                r() < 0.7 * alsPopScale
              ) {
                let af = 0.55 + 0.35 * r(),
                  aR = this.bangs.find((I) => !I.active) ?? this.bangs[0],
                  aA = Math.round(((ht / 360) * 60 * o) / Math.max(300, c));
                aR.start(o, af, (0.8 + 4.5 * af) * t.popThump, t, r, aA),
                  this.popCount++,
                  af > this.popMax && (this.popMax = af),
                  (this.bangRefractory = Math.round(0.035 * o));
              }
              let L = It === "bang" ? this.cut : c > J,
                O = ot ? this.charge : 1,
                d = Q > 720 ? Math.floor(h / 3) : -1,
                F = X > 0 ? b(1 - this.plenum * (1.1 + 0.4 * r()), 0, 1) : 1,
                x;
              if (d >= 0) {
                let f = 1 - this.plenum * 1.25;
                (x =
                  X > 0 &&
                  this.wet[h] < 0.5 &&
                  F < 0.55 &&
                  r() < 0.1 + 0.22 * X),
                  X > 0 && (this.plenum *= Ks);
              } else x = X > 0 && this.wet[h] < 0.5 && F < Vs + 0.2 * r();
              if (
                (X > 0 &&
                  (this.huntN += (1.5 * this.rng.next() - this.huntN) * 0.025),
                Tt && !L && !x && r() < (Mt ? 0.3 * O : 1))
              ) {
                let f =
                    0.08 +
                    0.22 * t.idleRough * (1 - g) * (1 - g) +
                    0.5 * (1 - O),
                  R = ot
                    ? 0.1 + 0.35 * this.charge
                    : et * (0.35 + 0.65 * this.charge),
                  A =
                    (0.3 + 0.7 * F) *
                    (1 + 0.6 * this.wet[h]) *
                    (d >= 0 && this.wet[h] > 0.5 ? 1.4 : 1);
                if (
                  ((this.wet[h] = 0),
                  (this.p0[h] = R * A * (1 + f * this.rng.next())),
                  brapLvl > 0.02 &&
                    ((this.brapW[h] = brapWeak ? 1 : 0),
                    (this.p0[h] *=
                      Math.max(
                        0,
                        1 -
                          (brapWeak ? 0.45 + 0.18 * this.rng.next() : 0.04) *
                            brapLvl,
                      ) *
                      (1 + 0.08 * this.brapHunt * brapLvl)),
                    brapWeak &&
                      this.rng.next() < 0.06 * brapLvl &&
                      (this.p0[h] *= 0.1)),
                  X > 0)
                ) {
                  let I = X * Math.min(1.6, this.p0[h] / et);
                  (this.plenum = Math.min(
                    1.2,
                    this.plenum + (d >= 0 ? Xs : js) * I,
                  )),
                    (this.huff = Math.max(this.huff, I));
                }
              } else if (x && Tt && !L) {
                this.brapW[h] = brapLvl > 0.02 ? 1 : 0;
                if (
                  ((this.p0[h] = 0),
                  (this.wet[h] = 1),
                  (this.missMask |= 1 << h),
                  d < 0)
                )
                  this.plenum *= 0.5;
                else for (let f = d * 3; f < d * 3 + 3; f++) this.wet[f] = 1;
                if (
                  d >= 0 &&
                  rollAls &&
                  alsSet > 0 &&
                  this.throttleS > 0.65 &&
                  this.boost >=
                    (alsBst > 0 ? alsBst * 0.88 : (t.boost || 1.9) * 0.97) &&
                  this.bangRefractory <= 0 &&
                  r() <
                    0.7 *
                      (0.5 + 0.5 * b(this.throttleS, 0, 1)) *
                      alsPopScale
                ) {
                  let bf = 0.55 + 0.4 * r(),
                    bR = this.bangs.find((I) => !I.active) ?? this.bangs[0],
                    bA = Math.round(((ht / 360) * 60 * o) / Math.max(300, c));
                  bR.start(o, bf, (0.8 + 4.5 * bf) * t.popThump, t, r, bA),
                    this.popCount++,
                    bf > this.popMax && (this.popMax = bf),
                    (this.bangRefractory = Math.round(0.02 * o));
                }
                if (
                  d >= 0 &&
                  t.pops > 0 &&
                  this.bangRefractory <= 0 &&
                  r() < 0.12 * t.pops
                ) {
                  let f = 0.15 + 0.2 * r(),
                    R = this.bangs.find((I) => !I.active) ?? this.bangs[0],
                    A = Math.round(((ht / 360) * 60 * o) / Math.max(300, c));
                  R.start(o, f, (0.7 + 4.5 * f) * t.popThump * 0.7, t, r, A),
                    this.popCount++,
                    f > this.popMax && (this.popMax = f),
                    (this.bangRefractory = Math.round(0.03 * o));
                }
              } else if (
                ((this.p0[h] = 0),
                L &&
                  !(alsSet > 0 && rollAls) &&
                  ((n.launch > 0 && t.twoStep) ||
                    ("bang" === It && (t.limBang || 0) > 0)) &&
                  this.bangRefractory <= 0 &&
                  r() <
                    0.6 *
                      (n.launch > 0 && t.twoStep
                        ? 1
                        : Math.min(1, (t.limBang || 0) * 1.5)))
              ) {
                let f = 0.75 + 0.25 * r(),
                  R = this.bangs.find((I) => !I.active) ?? this.bangs[0],
                  A = Math.round(((ht / 360) * 60 * o) / Math.max(300, c)),
                  gg = 0.7 + 4.5 * f;
                R.start(
                  o,
                  f,
                  gg *
                    1.3 *
                    (n.launch > 0 && t.twoStep
                      ? 1
                      : 0.45 + 0.55 * (t.limBang || 0)),
                  t,
                  r,
                  A,
                ),
                  this.popCount++,
                  (this.popMax = 1),
                  (this.bangRefractory = Math.round((0.035 + 0.03 * r()) * o));
              } else if (
                Mt &&
                c > t.idleRpm * 1.5 &&
                t.pops > 0 &&
                this.bangRefractory <= 0 &&
                !(alsSet > 0 && rollAls) &&
                !(this.speed < 1 && n.gear === 0 && this.liftTime > 1.2)
              ) {
                let f = Math.exp(-this.liftTime / 0.7) + 0.012 * W,
                  R =
                    t.pops *
                    t.popRate *
                    (1 + 1.5 * t.popBang) *
                    ((0.03 + 0.09 * W) * f * (1 + 4 * this.popCluster) +
                      0.35 * this.cutBurst +
                      alsLvl * 0.55);
                if (r() < R) {
                  let A = Math.min(
                      1,
                      Math.pow(r(), 1.6) +
                        0.35 * this.cutBurst +
                        t.popBang * (0.5 + 0.5 * r()),
                    ),
                    I =
                      (0.7 + 4.5 * A) *
                      t.popThump *
                      (0.6 + 0.4 * t.pops) *
                      (1 + 0.6 * t.popBang),
                    Y = this.bangs.find((q) => !q.active) ?? this.bangs[0],
                    H = Math.round(((ht / 360) * 60 * o) / Math.max(300, c));
                  Y.start(o, A, I, t, r, H),
                    this.popCount++,
                    A > this.popMax && (this.popMax = A),
                    (this.popCluster = Math.min(1, this.popCluster + 0.35)),
                    (this.bangRefractory = Math.round(
                      (0.004 + 0.01 * r()) * (1 + 3 * t.popBang) * o,
                    ));
                }
              }
            }
            let m = this.evoJit[h];
            v < ht + m &&
              p >= ht + m &&
              ((this.pe[h] =
                this.p0[h] > 0 ? this.p0[h] * Pt(ht) : -0.02 * (1 - 0.6 * et)),
              (this.crack[h] = xs * this.pe[h]),
              (this.tick += 0.5)),
              v < dt &&
                p >= dt &&
                ((this.tick += 0.3),
                this.brapW[h] &&
                  brapLvl > 0.03 &&
                  this.brapBangRef <= 0 &&
                  ((this.brapBangRef = Math.round(
                    (0.01 + 0.014 * this.rng.next()) * o,
                  )),
                  (this.brapW[h] = 0),
                  (() => {
                    let Bp = this.bangs.find((q) => !q.active) ?? this.bangs[0],
                      sz = 0.3 + 0.4 * this.rng.next(),
                      amp =
                        (0.55 + 1.1 * sz) *
                        brapLvl *
                        (0.75 + 0.45 * this.rng.next());
                    Bp.start(
                      o,
                      sz,
                      amp,
                      this.brapP,
                      this.rng,
                      Math.round(((ht / 360) * 60 * o) / Math.max(300, c)),
                    ),
                      this.popCount++,
                      this.brapN++;
                  })()));
            let M = ii(p - m, Ls, ht),
              B = this.pe[h] * M;
            this.pe[h] -= B * this.kBlow;
            let k = p > 180 && p < 360 ? M * -y * (0.004 + 0.01 * et) * ft : 0,
              T = B + k + this.crack[h] * M;
            this.crack[h] *= this.crackDecay;
            let C =
              T +
              this.rng.next() *
                M *
                (B * 0.22 + 3e-4 * et * ft + 0.0015 * portTop);
            if (
              ((this.headerOut[this.bank[h]] += this.header[h].process(
                C * 9 * (1 + 0.35 * portTop + 0.18 * camLift + 0.06 * camDur),
              )),
              this.huff > 0.002 &&
                p > dt - 20 &&
                p < dt + 40 &&
                (Dt += this.huff * (0.6 + 0.5 * this.rng.next()) * 0.012),
              (Dt +=
                si(p, dt - Nt * 0.7, Ys + Nt * 0.7) *
                (y > 0 ? y : 0) *
                (0.3 + 0.7 * g) *
                ft *
                As),
              p < 180)
            ) {
              let L = this.p0[h] * Pt(p);
              (Ht += L), (ss += L * y);
            }
            if (p >= 540 || p < 180) {
              let L = 0.3 * et * Pt(p >= 540 ? 720 - p : p);
              (is += L * y), p >= 540 && (Ht += L);
            }
          }
          let es =
            (0.5 + 0.5 * Math.sin(Math.PI * b((W - 0.1) / 0.9, 0, 1))) *
            (t.vtecRpm > 0
              ? 0.94 +
                0.18 * Math.max(0, Math.min(1, (c - t.vtecRpm + 300) / 600))
              : 1);
          if (t.induction === "super")
            (this.boost = t.boost * Math.min(1.1, 0.45 + W * 1.1) * g),
              (this.turbo = 0);
          else if (t.induction === "turbo") {
            let sz = b(void 0 !== t.turboSize ? t.turboSize : 0.5, 0, 1),
              inert = 0.18 + 1.6 * sz,
              thr = 0.08 + 0.22 * sz,
              drv =
                Math.max(0, W - thr) *
                  g *
                  (1.2 + 0.8 * W) *
                  (1 + 0.35 * g) *
                  b(void 0 !== t.lag ? t.lag : 1, 0.3, 2) +
                alsLvl *
                  b(this.throttleS, 0, 1) *
                  (1.1 + 1.1 * b(this.throttleS, 0, 1)) *
                  (0.45 + 0.55 * W) +
                boostHold * 1.35 * (0.45 + 0.55 * W),
              drag = this.turbo * (0.25 + 0.9 * sz) * (1 - 0.35 * boostHold);
            this.turbo = b(
              this.turbo + ((drv * 1.6 - drag) * a) / inert,
              0,
              1.4,
            );
            let y =
              t.boost *
              this.turbo *
              b(alsLvl > 0 ? Math.max(g * 3, 0.72 * alsLvl) : g * 3, 0, 1) *
              (alsBst > 0
                ? b(0.12 + 0.88 * Math.pow(this.throttleS, 1.6), 0, 1)
                : 1);
            if (
              y < this.boost - 0.15 &&
              this.boost > 0.25 &&
              t.bov !== "none" &&
              this.bovEnv < 0.3 * this.boost
            ) {
              (this.bovEnv = this.boost),
                (this.bovStart = this.boost),
                (this.bovPhase = 0),
                (this.surgeT = 0),
                (this.surgeN0 = Math.max(0.05, this.turbo));
              let m = Math.max(0.1, this.turbo);
              (this.sFlow = 1 * m),
                (this.sPress = 0.15 * m * m + 1.9 * 0.6 * m * m),
                (this.surgeFade = 0),
                (this.revS = 0),
                (this.ventP = this.boost),
                (this.ventV = 0),
                (this.jetS = 0);
            }
            alsSet > 0 && rollAls
              ? (this.boost +=
                  (alsBst - this.boost) *
                  (alsBst > this.boost ? a / 0.12 : a / 0.25))
              : (this.boost +=
                  (y - this.boost) * (y > this.boost ? a / 0.08 : a / 0.03)),
              (this.boost = b(this.boost, 0, (t.boost || 1.9) * 1.02));
          } else (this.boost = 0), (this.turbo = 0);
          let rot = t.cycle > 720,
            disp =
              void 0 !== t.displacement
                ? b(t.displacement, 0.3, 12)
                : rot
                  ? P * 0.654
                  : P * 0.5,
            bmep = rot ? 16 : 18,
            maxNA =
              (bmep * 1e5 * disp) / 1000 / (rot ? 2 * Math.PI : 4 * Math.PI),
            rpmN = Math.min(1.1, c / t.redline),
            curve = (function () {
              if (t.tqCurve && t.tqRpm && t.tqCurve.length > 1) {
                let rp = Math.max(0, c),
                  lo = 0,
                  hi = t.tqCurve.length - 1;
                if (rp <= t.tqRpm[0]) return t.tqCurve[0];
                if (rp >= t.tqRpm[hi]) return t.tqCurve[hi];
                while (hi - lo > 1) {
                  let md = (lo + hi) >> 1;
                  rp >= t.tqRpm[md] ? (lo = md) : (hi = md);
                }
                let u =
                  (rp - t.tqRpm[lo]) / Math.max(1, t.tqRpm[hi] - t.tqRpm[lo]);
                return t.tqCurve[lo] + (t.tqCurve[hi] - t.tqCurve[lo]) * u;
              }
              return (curve =
                rpmN <= cq
                  ? 0.72 +
                    0.28 *
                      Math.sin(
                        0.5 * Math.PI * Math.min(1, rpmN / Math.max(0.08, cq)),
                      )
                  : rpmN <= ck
                    ? Math.max(
                        0.3,
                        1 -
                          (1 - ce) *
                            Math.min(
                              1.6,
                              ((rpmN - cq) / Math.max(0.01, ck - cq)) *
                                Math.sqrt(
                                  (rpmN - cq) / Math.max(0.01, ck - cq),
                                ),
                            ),
                      )
                    : Math.max(
                        0.3,
                        ce -
                          (ce - cr) *
                            Math.min(
                              1.25,
                              (rpmN - ck) / Math.max(0.01, 1 - ck),
                            ),
                      ));
            })();
          let camC = void 0 !== t.camTop ? b(t.camTop, 0, 1.2) : 0,
            peakT =
              Math.min(t.peakTorque, maxNA) *
              curve *
              b(1 + camC * (c / t.redline - 0.42) * 0.35, 0.35, 1.95) *
              b(
                0.84 +
                  0.12 * camLift +
                  0.08 * camDur -
                  0.22 *
                    (void 0 !== t.camOverlap ? t.camOverlap : 0) *
                    (1 - Math.min(1, c / t.redline)),
                0.6,
                1.18,
              ),
            pt;
          if (t.tqActual && t.tqRpm && t.tqCurve) {
            let wot = tableAt(c, t.tqRpm, t.tqCurve),
              fric = tableAt(c, t.tqRpm, t.tqFric || []),
              boostRef = tableAt(c, t.tqRpm, t.tqBoost || []),
              load = b(g, 0, 1),
              boostScale =
                t.boost > 0 && boostRef > 0.01
                  ? b(
                      (1 + Math.max(0, this.boost) / 1.01325) /
                        (1 + boostRef / 1.01325),
                      0.03,
                      2,
                    )
                  : 1,
              indWot = wot + fric,
              indicated =
                Tt && !limiterCut
                  ? indWot *
                    Math.pow(load, 0.8) *
                    boostScale *
                    (ot || ts ? this.charge : 1)
                  : 0,
              fricNow = fric * (1 + 0.3 * (1 - load)),
              starterT = n.starter
                ? Math.max(t.peakTorque * 0.4, t.inertia * 80) *
                  Math.max(0, 1 - c / Math.max(350, t.idleRpm * 0.9))
                : 0;
            peakT = Math.max(1e-3, t.peakTorque);
            pt =
              (indicated * (1 - alsTorqueCut) - fricNow) *
                (1 - 0.92 * tqCut) *
                (1 - rollCut) +
              starterT -
              (t.dyno
                ? b(t.dynoLoad || 0, 0, 1) *
                  peakT *
                  0.9 *
                  b(c / t.redline, 0, 1) *
                  b((g - 0.05) / 0.5, 0, 1)
                : 0) -
              (t.camIdle
                ? t.camIdle * peakT * 0.1 * Math.sin(this.theta * Lt)
                : 0);
          } else {
            let Is = Tt
                ? Math.pow(g, 0.8) *
                  es *
                  peakT *
                  (1 + 0.9 * this.boost) *
                  (ot || ts ? this.charge : 1)
                : 0,
              Ss = P > 0 ? Is * (ss / (P * Ft * et * ei)) : 0,
              hs =
                peakT *
                (0.05 + 0.1 * W + 0.12 * W * W * (1 - g)) *
                (!j && !n.starter && c < 250
                  ? 0.12 + 0.88 * (c / 250)
                  : 1),
              Bs = n.starter
                ? Math.max(peakT * 0.4, t.inertia * 80) *
                  Math.max(0, 1 - c / Math.max(350, t.idleRpm * 0.9))
                : 0;
            pt =
              (Ss + is * peakT * 0.5) * (1 - alsTorqueCut) -
              hs * (this.omega < 0 ? -2 : 1) +
              Bs -
              (t.dyno
                ? b(t.dynoLoad || 0, 0, 1) *
                  peakT *
                  0.9 *
                  b(c / t.redline, 0, 1) *
                  b((g - 0.05) / 0.5, 0, 1)
                : 0) -
              (t.camIdle
                ? t.camIdle * peakT * 0.1 * Math.sin(this.theta * Lt)
                : 0);
          }
          this.lastTq = pt;
          let K = t.wheelRadius,
            E = n.gear > 0 ? t.gears[n.gear - 1] * t.finalDrive : 0,
            _ = this.speed,
            Gt =
              _ > 0.02
                ? t.drag * _ * _ +
                  0.012 * t.mass * 9.81 +
                  Math.min(
                    t.brakeG * t.mass * 9.81,
                    t.grip * (t.mass * 9.81 + t.downforce * _ * _) * 0.9,
                  ) *
                    n.brake
                : 0;
          if (
            (E !== this.lastRatio && ((this.twist = 0), (this.lastRatio = E)),
            E > 0)
          ) {
            let dvIe = Math.max(0.05, t.inertia),
              dvId = 2.4 / (E * E) + 0.004,
              dvSlip = this.omega - this.omegaIn,
              dvCap =
                t.clutchTorque > 0
                  ? t.clutchTorque
                  : Qs *
                    t.peakTorque *
                    (t.tqActual || t.induction === "na"
                      ? 1
                      : 1 + 0.9 * this.boost),
              dvTc,
              dvTcOut,
              dvV = _,
              dvAx = (this.speed - this.prevSpeed) / Math.max(a, 1e-4);
            this.prevSpeed = this.speed;
            let dvMg = t.mass * 9.81,
              dvTr = (dvAx * t.mass * 0.5) / 2.7,
              dvN =
                t.drive === "awd"
                  ? dvMg
                  : t.drive === "fwd"
                    ? dvMg * 0.62 - dvTr
                    : dvMg * 0.48 + dvTr,
              dvFmax = t.grip * (Math.max(0, dvN) + t.downforce * dvV * dvV);
            if ("auto" === t.gearbox) {
              let dvRpm = (this.omega * 60) / (2 * Math.PI),
                dvStall = Math.max(
                  1600,
                  (void 0 !== t.stallRpm ? t.stallRpm : 0) || t.redline * 0.45,
                ),
                dvF = b(
                  (dvRpm - t.idleRpm * 0.85) / (dvStall - t.idleRpm * 0.85),
                  0,
                  1.05,
                ),
                dvSr = b(this.omegaIn / Math.max(1, this.omega), 0, 1),
                dvLock =
                  b((dvSr - 0.9) / 0.08, 0, 1) *
                  b((this.speed * 3.6 - 20) / 10, 0, 1);
              dvTc = dvCap * dvF * dvF;
              if (dvLock > 0.5) {
                let dvTgt = (this.speed / K) * E;
                dvTc = b((this.omega - dvTgt) * 20, -dvCap, dvCap);
                dvTcOut = dvTc;
              } else dvTcOut = dvTc * (1 + 1.9 * (1 - dvSr) * (1 - dvSr));
            } else {
              let dvAnti = 1;
              if ("dct" === t.gearbox || "seq" === t.gearbox) {
                let dvRpm2 = (this.omega * 60) / (2 * Math.PI);
                dvAnti = b(
                  (dvRpm2 - t.idleRpm * 1.15) / (t.idleRpm * 0.5),
                  0,
                  1,
                );
                this.throttleS > 0.35 && (dvAnti = Math.max(dvAnti, 0.75));
              }
              dvTc = dvCap * this.clutchS * dvAnti * Math.tanh(dvSlip / 3);
              dvTcOut = dvTc;
            }
            let dvS =
                ((this.omegaIn / E) * K - dvV) / Math.max(Math.abs(dvV), 1.5),
              dvBs = 10 * dvS,
              dvFw =
                dvFmax *
                Math.sin(
                  1.6 * Math.atan(dvBs - 0.9 * (dvBs - Math.atan(dvBs))),
                ),
              dvTsh = (dvFw * K) / E;
            this.omega = Math.max(0, this.omega + ((pt - dvTc) / dvIe) * a);
            this.omegaIn += ((dvTcOut - dvTsh) / dvId) * a;
            this.speed = Math.max(0, dvV + ((dvFw - Gt) / t.mass) * a);
            this.shaftT = dvTsh;
            this.locked = !1;
            this.twist = 0;
            this.tyreSlid = Math.abs(dvS) > 0.1;
            this.tcSlip = Math.abs(dvS);
            this.tcMaxLoad +=
              (Math.min(1, Math.abs(dvFw) / Math.max(1, dvFmax)) -
                this.tcMaxLoad) *
              (a /
                ("aggressive" === t.tcMode
                  ? 0.025
                  : "soft" === t.tcMode
                    ? 0.09
                    : 0.05));
          } else
            (this.locked = !1),
              (this.tyreSlid = !1),
              (this.tcMaxLoad += (1 - this.tcMaxLoad) * (a / 0.05)),
              (this.omega += (pt / t.inertia) * a),
              (this.speed = Math.max(0, _ - (Gt / t.mass) * a)),
              (this.omegaIn = this.omega),
              (this.twist *= 1 - a * 20),
              (this.shaftT = 0);
          (Number.isFinite(this.omega) &&
            Number.isFinite(this.speed) &&
            Number.isFinite(this.boost)) ||
            ((this.omega = 0),
            (this.speed = 0),
            (this.boost = 0),
            (this.turbo = 0),
            (this.tcSlip = 0),
            (this.omegaIn = 0)),
            this.omega < 0 && (j || n.starter) && (this.omega = 0),
            this.omega < -4 && (this.omega = -4),
            Math.abs(this.omega) < 0.4 && !n.starter
              ? ((this.stillFor += a), this.stillFor > 0.15 && (this.omega = 0))
              : (this.stillFor = 0);
          let ct = 0,
            bt = 0;
          for (let h of this.bangs) {
            if (!h.active) continue;
            let p = h.process();
            if (
              (h.bank === 0 || t.banks === 1 ? (ct += p) : (bt += p),
              h.justLit > 0)
            ) {
              let v =
                h.justLit * (0.3 + 0.7 * h.size) * t.popThump * t.popWhump;
              (this.thumpEnv = Math.min(this.thumpEnv + v * 0.07, 0.6)),
                (this.thumpF =
                  (55 + 50 * (1 - h.size) + 20 * this.meshWob) *
                  Math.sqrt(t.popPitch));
            }
          }
          (this.thumpPh += this.thumpF * a),
            this.thumpPh >= 1 && (this.thumpPh -= 1),
            (this.thumpEnv *= 1 - a / 0.045);
          let Os = this.thumpEnv * Math.sin(this.thumpPh * 2 * Math.PI);
          if (t.popTone !== 0) {
            (this.popLp[0] += (ct - this.popLp[0]) * 0.1),
              (this.popLp[1] += (bt - this.popLp[1]) * 0.1);
            let h = 1 + 1.5 * t.popTone;
            (ct = this.popLp[0] * (2 - h) + (ct - this.popLp[0]) * h),
              (bt = this.popLp[1] * (2 - h) + (bt - this.popLp[1]) * h);
          }
          let V = this.headerOut[0],
            Z = t.banks > 1 ? this.headerOut[1] : V,
            as = V + Z;
          if (t.induction === "turbo") {
            let h = this.turboLp;
            t.banks > 1
              ? ((h[0] += this.turboLpCoef * (V - h[0])),
                (h[1] += this.turboLpCoef * (Z - h[1])),
                (V = h[0] * 0.55),
                (Z = h[1] * 0.55))
              : ((h[0] += this.turboLpCoef * (as - h[0])),
                (V = h[0] * 0.45),
                (Z = V));
          }
          if (
            ((V += ct),
            (Z += t.banks > 1 ? bt : ct),
            t.banks > 1 && t.bankBalance !== 0)
          ) {
            let h = b(t.bankBalance, -1, 1) * ti,
              p = 1 / Math.sqrt(1 + h * h);
            (V *= (1 + h) * p), (Z *= (1 - h) * p);
          }
          let qt = this.chains[0].process(V, g),
            _t = this.chains[1].process(Z, g),
            Yt = this.body2.process(this.body.process(as)) * 0.55 * t.body,
            U = this.rng.next();
          this.intakeLp += this.intakeLpCoef * (U * Dt - this.intakeLp);
          let Ts =
            (this.intakeTube.process(this.intakeLp) + this.intakeLp) * 0.08;
          this.blockLp += this.blockLpCoef * (Ht - this.blockLp);
          let Fs = this.blockLp * 1.2,
            Es = this.tick * U * 0.012 * (1 - ft) * (1 - ft);
          this.tick *= this.tickDecay;
          let lt = 0;
          if (
            ((this.whineOut = 0), t.gearWhine > 0 && E > 0 && this.omegaIn > 1)
          ) {
            let h = t.gears[n.gear - 1],
              p = this.omegaIn / h / (2 * Math.PI),
              v = this.omegaIn / (2 * Math.PI),
              y = p * t.gearWhineOrder;
            (this.shaftPhO += p * a),
              this.shaftPhO >= 1 && (this.shaftPhO -= 1),
              (this.shaftPhI += v * a),
              this.shaftPhI >= 1 && (this.shaftPhI -= 1);
            let m = this.shaftPhO * 2 * Math.PI,
              M = this.shaftPhI * 2 * Math.PI,
              B =
                0.3 * Math.sin(m) +
                0.15 * Math.sin(2 * m + 1.3) +
                0.12 * Math.sin(M + 0.5);
            (this.meshWob += (U - this.meshWob) * 0.002),
              (this.meshPhase +=
                y * (1 + 0.003 * this.meshWob + 0.004 * Math.sin(m + 2)) * a),
              this.meshPhase >= 1 && (this.meshPhase -= 1),
              (this.meshPhase2 += y * 1.12 * (1 + 0.003 * Math.sin(M)) * a),
              this.meshPhase2 >= 1 && (this.meshPhase2 -= 1);
            let k = this.meshPhase * 2 * Math.PI,
              T = this.meshPhase2 * 2 * Math.PI,
              C = b(Math.abs(this.shaftT) / t.peakTorque, 0, 1.5),
              L = this.shaftT > 0 ? 1 : 0.45;
            this.whineAm += (U * 0.5 - this.whineAm) * 7e-4;
            let O = b(1 + 9 * this.whineAm, 0.3, 1.8) * (1 + B),
              d = Math.min(1.4, Math.pow(p / 68, p < 68 ? 3 : 1.3)),
              F = b(1 - y / 1e3, 0, 1),
              x = t.gearWhine * d * (0.03 + 0.36 * Math.pow(C, 0.7) * L) * O;
            (this.meshNzN++ & 63) === 0 &&
              this.meshNz.setBandpass(o, Math.min(y, o * 0.4), 6);
            let f =
                this.meshNz.process(U) *
                t.gearWhine *
                d *
                (0.08 + 0.1 * F + 0.25 * Math.pow(1 - Math.min(1, C), 2)) *
                b(O, 0.5, 1.5),
              R = v * (t.gearWhineTeeth?.[n.gear - 1] ?? t.gearWhineOrderIn);
            (this.meshPhaseIn += R * (1 + 0.003 * Math.sin(M + 1.7)) * a),
              this.meshPhaseIn >= 1 && (this.meshPhaseIn -= 1);
            let A = this.meshPhaseIn * 2 * Math.PI,
              I = Math.min(1.4, Math.pow(R / 1500, 1.3)),
              Y =
                t.gearWhine *
                t.gearWhineIn *
                I *
                Math.min(1, d) *
                (0.03 + 0.36 * Math.pow(C, 0.7) * L) *
                (1 + 0.25 * Math.sin(M)) *
                b(O, 0.5, 1.5),
              H =
                x *
                  (Math.sin(k) +
                    (0.08 + 0.45 * F) * Math.sin(2 * k + 0.4) +
                    (0.035 + 0.35 * F) * Math.sin(3 * k + 1.1) +
                    (0.05 + 0.25 * F) * Math.sin(4 * k + 2) +
                    0.2 * F * Math.sin(5 * k + 2.6) +
                    0.25 * Math.sin(T)) +
                Y * (Math.sin(A) + 0.1 * Math.sin(2 * A + 0.9)) +
                f,
              q = this.cabin1.process(H) * 2.2 + this.cabin2.process(H) * 1.6,
              vt = this.cabinBuf[this.cabinI],
              mt = H * 0.6 + q + vt * 0.45;
            (this.cabinBuf[this.cabinI] =
              this.cabinLp + (mt - this.cabinLp) * 0.35),
              (this.cabinLp = this.cabinBuf[this.cabinI]),
              (this.cabinI = (this.cabinI + 1) % this.cabinBuf.length),
              (this.whineOut = mt * 0.36);
          }
          if (t.induction === "super" && t.whine > 0) {
            let h = (c / 60) * 2.8 * 4 * t.whinePitch;
            (this.whinePhase += h * a),
              this.whinePhase >= 1 && (this.whinePhase -= 1),
              (this.whinePhase2 += h * 1.004 * a),
              this.whinePhase2 >= 1 && (this.whinePhase2 -= 1);
            let p = this.whinePhase * 2 * Math.PI,
              v = this.whinePhase2 * 2 * Math.PI,
              y =
                Math.sin(p) +
                g *
                  (0.6 * Math.sin(2 * v) +
                    0.35 * Math.sin(3 * p) +
                    0.25 * Math.sin(4 * v)),
              m = b((g - 0.08) / 0.25, 0, 1) * this.driven;
            lt +=
              y *
              t.whine *
              m *
              Math.pow(g, 1.2) *
              Math.pow(Math.min(1, W * 1.1), 2.2) *
              0.16;
          } else if (t.induction === "turbo") {
            let h = this.turbo;
            if (t.whine > 0 && h > 0.02) {
              let m = (200 + 3200 * h) * t.whinePitch;
              (this.whinePhase += m * a),
                this.whinePhase >= 1 && (this.whinePhase -= 1);
              let M = this.whinePhase * 2 * Math.PI;
              lt +=
                (Math.sin(M) +
                  0.3 * Math.sin(2 * M) +
                  0.14 * Math.sin(3 * M + 1.2)) *
                t.whine *
                h *
                h *
                0.055;
            }
            if (t.t51r && h > 0.01) {
              let tl = b(void 0 !== t.t51rLvl ? t.t51rLvl : 0.7, 0, 1),
                sp = b(h, 0, 1.2),
                dr = b(
                  (this.boost + 0.04) / Math.max(0.15, t.boost || 1),
                  0,
                  1,
                );
              if (tl > 0) {
                let f =
                  (900 + 4600 * Math.pow(sp, 0.8)) *
                  (1 + 0.018 * Math.sin(this.theta * 0.021));
                (this.t51rPhase += f * a),
                  this.t51rPhase >= 1 && (this.t51rPhase -= 1),
                  (this.t51rPhase2 += f * 1.011 * a),
                  this.t51rPhase2 >= 1 && (this.t51rPhase2 -= 1);
                if ((this.t51rTick++ & 63) === 0)
                  this.t51rBp.setBandpass(o, 1800 + 4000 * sp, 2.2),
                    this.t51rBp2.setBandpass(o, 3200 + 5000 * sp, 3.4);
                let p1 = this.t51rPhase * 2 * Math.PI,
                  p2 = this.t51rPhase2 * 2 * Math.PI,
                  whistle =
                    Math.sin(p1) +
                    0.35 * Math.sin(2 * p1 + 0.6) +
                    0.18 * Math.sin(3 * p2 + 1.3),
                  jet =
                    this.t51rBp.process(U) * 0.9 +
                    this.t51rBp2.process(U) * 0.7,
                  env = b((h - 0.01) / 0.35, 0, 1) * (0.35 + 0.65 * dr);
                lt +=
                  (whistle * 0.06 + jet * 0.05) *
                  tl *
                  env *
                  (0.9 + 0.1 * Math.sin(this.theta * 0.07));
              }
            }
            this.whooshLp += 0.25 * (U - this.whooshLp);
            let p = 0.3 + 0.7 * Math.min(1, g * 1.5),
              v = 0;
            if (this.bovEnv > 0.002 && t.bov === "flutter") {
              let m = b(h, 0, 1.2),
                M = 0.5 * m + 0.02,
                B = 0.6 * m * m,
                k = 0.15 * m * m,
                T = this.sFlow / M - 1,
                C =
                  this.sFlow >= 0
                    ? k + B * (1 + 1.5 * T - 0.5 * T * T * T)
                    : k + 0.5 * B * (this.sFlow / M) * (this.sFlow / M),
                L = 1.5 * (0.5 + 0.5 * m),
                O = 2 * Math.PI * t.flRate * 1.25 * (0.35 + 0.65 * m) * a,
                d = (0.06 + 3 * g) * Math.sqrt(Math.max(0, this.sPress)),
                F = L * (C - this.sPress) * O,
                x = ((this.sFlow - d) / L) * O;
              (this.sFlow = b(this.sFlow + F, -3, 3)),
                (this.sPress = b(this.sPress + x, -0.5, 3));
              let f = Math.max(0, -this.sFlow),
                R = Math.max(0, this.sFlow);
              this.revS +=
                (f - this.revS) *
                Math.min(1, a / (f > this.revS ? 0.009 : 0.014));
              let A = g > 0.2 || h < 0.06;
              this.surgeFade +=
                ((A ? 0 : 1) - this.surgeFade) *
                Math.min(1, a / (A ? 0.06 : 0.01));
              let I = this.surgeFade;
              p = p + (0.35 + this.revS * 1 + R * 0.3 - p) * I;
              let Y = t.flPitch * (0.3 + 0.7 * h);
              (this.bovTick++ & 63) === 0 &&
                (this.bovBp.setBandpass(o, Y, 5),
                this.bovBp2.setBandpass(o, t.flPitchEnd, 4)),
                (this.surgePh += Y * a),
                this.surgePh >= 1 && (this.surgePh -= 1);
              let H = this.surgePh * 2 * Math.PI,
                q =
                  Math.sin(H) +
                  0.45 * Math.sin(2 * H) +
                  0.2 * Math.sin(3 * H) +
                  0.1 * Math.sin(4 * H),
                vt = (this.whooshLp * 0.6 + q * 0.25 * this.revS) * p * h * h,
                mt = this.bovBp.process(vt) * 4,
                kt = (U - this.whooshLp) * p * h * h * 0.6 * t.flHiss,
                at = this.bovBp2.process(Math.max(0, -x) * 25 * h);
              (v =
                (mt + kt + at) *
                Math.min(1, this.bovStart / 0.6) *
                1.8 *
                I *
                t.flLevel),
                (this.turbo *= 1 - a / (1 + 0.6 * (1 - Math.min(1, f)))),
                A && I < 0.02 && (this.bovEnv = 0);
            } else if (this.bovEnv > 0.002) {
              let m = t.boost * h * h * 1.1,
                M = 2.5 * h * Math.max(0, 1 - this.ventP / Math.max(0.05, m)),
                B = Math.sqrt(Math.max(0, this.ventP)),
                k = 6 * this.ventV * B,
                T = 8 * g * B;
              this.ventP = b(this.ventP + (M - k - T) * a, 0, 3);
              let C = g < 0.12 && this.ventP > 0.04 ? 1 : 0;
              this.ventV +=
                (C - this.ventV) *
                Math.min(1, a / (C > this.ventV ? 0.025 : 0.05));
              let L = this.ventV * Math.pow(this.ventP, 0.75);
              (this.jetS += (L - this.jetS) * Math.min(1, a / 0.004)),
                (this.bovTick++ & 63) === 0 &&
                  this.bovBp.setBandpass(
                    o,
                    1200 +
                      3500 *
                        Math.sqrt(
                          Math.min(1, this.ventP / Math.max(0.1, t.boost)),
                        ),
                    0.6,
                  );
              let O = U - this.whooshLp;
              (lt +=
                (this.bovBp.process(U) * 2.2 + O * 0.35) *
                this.jetS *
                0.62 *
                t.flLevel),
                this.ventV < 0.01 && this.ventP < 0.02 && (this.bovEnv = 0);
            } else this.revS = 0;
            if (t.bov === "none" && Mt && h > 0.08 && this.boost > 0.03) {
              let dr = b((this.boost - 0.03) / 0.5, 0, 1) * b(h, 0, 1);
              this.nSurgeEnv +=
                (dr - this.nSurgeEnv) *
                Math.min(1, a / (dr > this.nSurgeEnv ? 0.012 : 0.08));
              if ((this.nSurgeTick++ & 63) === 0)
                this.nSurgeBp.setBandpass(o, 300 + 450 * h, 1.2);
              (this.nSurgePh += (18 + 22 * b(h, 0, 1)) * a),
                this.nSurgePh >= 1 && (this.nSurgePh -= 1);
              let chop = 0.5 + 0.5 * Math.sin(this.nSurgePh * 2 * Math.PI);
              lt += this.nSurgeBp.process(U) * this.nSurgeEnv * chop * 0.12;
            } else this.nSurgeEnv *= 1 - a / 0.12;
            lt += this.whooshLp * p * h * h * 0.06 + v;
          }
          if (t.induction === "turbo" && t.wastegate === "external") {
            let scrLvl = void 0 !== t.screamer ? b(t.screamer, 0, 1) : 0.7;
            if (scrLvl > 0) {
              let target = Math.max(0.08, t.boost || 0.08),
                ratio = this.boost / target,
                gateOpen = b((ratio - 0.6) / 0.4, 0, 1),
                gasFlow =
                  b((this.turbo - 0.03) / 0.9, 0, 1) *
                  b((this.throttleS - 0.04) / 0.55, 0, 1),
                lvl = gateOpen * gasFlow;
              this.scrEnv +=
                (lvl - this.scrEnv) *
                Math.min(1, a / (lvl > this.scrEnv ? 0.008 : 0.13));
              if (gateOpen > 0.12 && this.scrWas <= 0.12) this.scrBurst = 1;
              (this.scrWas = gateOpen), (this.scrBurst *= 1 - a / 0.06);
              if (this.scrEnv > 0.0005) {
                let heat = b(ratio, 0, 1.5),
                  flowN = b(gasFlow, 0, 1),
                  jit = (this.scrJit += (U - this.scrJit) * 0.02),
                  shim = (this.scrShimmer +=
                    (this.rng.next() - this.scrShimmer) * 0.06),
                  ppr = (P * 360) / (t.cycle || 720),
                  fireHz = Math.max(8, (c / 60) * ppr);
                (this.scrFire += fireHz * a),
                  this.scrFire >= 1 && (this.scrFire -= 1),
                  (this.scrPhase += fireHz * 3 * a),
                  this.scrPhase >= 1 && (this.scrPhase -= 1);
                let pulse =
                    this.scrFire < 0.2
                      ? Math.pow(1 - this.scrFire / 0.2, 2)
                      : 0,
                  flutter =
                    1 -
                    (0.04 + 0.15 * flowN) *
                      (0.5 + 0.5 * Math.sin(this.scrFire * 2 * Math.PI)),
                  ex = b(V + Z, -3, 3);
                this.scrLp += (ex - this.scrLp) * 0.02;
                let blast = ex - this.scrLp;
                if ((this.scrTick++ & 7) === 0) {
                  let f1 =
                      480 +
                      120 * Math.min(1.2, heat) +
                      14 * Math.sin(this.theta * 0.019),
                    f2 =
                      1450 +
                      260 * Math.min(1.2, heat) +
                      32 * Math.sin(this.theta * 0.031),
                    f3 =
                      2450 +
                      400 * Math.min(1.2, heat) +
                      54 * Math.sin(this.theta * 0.047),
                    f4 =
                      3550 +
                      500 * Math.min(1.2, heat) +
                      70 * Math.sin(this.theta * 0.061),
                    f5 =
                      4700 +
                      700 * Math.min(1.2, heat) +
                      100 * Math.sin(this.theta * 0.083);
                  this.scrForm1.setBandpass(o, Math.min(o * 0.42, f1), 7),
                    this.scrForm2.setBandpass(o, Math.min(o * 0.42, f2), 9),
                    this.scrForm3.setBandpass(o, Math.min(o * 0.44, f3), 11),
                    this.scrForm4.setBandpass(o, Math.min(o * 0.45, f4), 10),
                    this.scrForm5.setBandpass(o, Math.min(o * 0.46, f5), 9),
                    this.scrMetal.setBandpass(
                      o,
                      Math.min(o * 0.46, 3000 + 900 * Math.min(1.2, heat)),
                      10,
                    ),
                    this.scrHiss.setBandpass(
                      o,
                      Math.min(o * 0.47, 5000 + 1000 * Math.min(1.2, heat)),
                      1,
                    ),
                    this.scrBody.setBandpass(
                      o,
                      Math.max(90, 180 + 100 * Math.min(1.2, heat)),
                      1.1,
                    );
                }
                let tone =
                    Math.sin(this.scrPhase * 2 * Math.PI) +
                    0.35 * Math.sin(this.scrPhase * 4 * Math.PI + 1.1),
                  src =
                    blast * 1.25 +
                    tone * (0.22 + 0.3 * flowN) +
                    U * (0.18 + 0.35 * flowN),
                  fm1 = this.scrForm1.process(src),
                  fm2 = this.scrForm2.process(src),
                  fm3 = this.scrForm3.process(src),
                  fm4 = this.scrForm4.process(src),
                  fm5 = this.scrForm5.process(src),
                  core = Math.tanh(
                    (fm1 * 1.2 +
                      fm2 * 0.95 +
                      fm3 * 0.7 +
                      fm4 * 0.45 +
                      fm5 * 0.28) *
                      (1.6 + 2.4 * flowN),
                  ),
                  metal = this.scrMetal.process(src * 0.7 + U * 0.3) * 0.9,
                  hiss = this.scrHiss.process(U) * (1 + 2 * flowN),
                  body =
                    Math.tanh(ex * 3) * 0.1 +
                    this.scrBody.process(ex + U * 0.3) * 0.13,
                  crack = this.scrCrack * U * 3.5,
                  burst = this.scrBurst * U * 0.7;
                (this.scrCrack *= 1 - a / 0.0045),
                  this.rng.next() > 0.999 &&
                    this.scrEnv > 0.12 &&
                    (this.scrCrack = 0.18 + 0.35 * this.rng.next());
                let scream = Math.tanh(
                    (core * 0.85 +
                      metal * 0.22 +
                      hiss * 0.18 +
                      body * 0.1 +
                      crack * 0.04 +
                      burst * 0.06) *
                      (1.15 + 1.1 * flowN),
                  ),
                  out =
                    Math.tanh(
                      scream *
                        this.scrEnv *
                        scrLvl *
                        (0.55 + 0.45 * pulse) *
                        flutter *
                        (0.95 + 0.05 * shim) *
                        1.3,
                    ) * 0.58;
                lt += out;
              }
            }
          }
          if (t.mguk > 0) {
            let h = c * 0.16;
            (this.ersPhase += h * a),
              this.ersPhase >= 1 && (this.ersPhase -= 1);
            let p = this.ersPhase * 2 * Math.PI,
              v = Mt ? 0.6 : g > 0.5 ? g * g : 0.03;
            (this.ersLevel += ((v - this.ersLevel) * a) / 0.15),
              (lt +=
                (Math.sin(p) + 0.12 * Math.sin(2 * p)) *
                t.mguk *
                this.ersLevel *
                Math.min(1, W * 1.5) *
                0.022);
          }
          let gt = Fs + Ts + Es + (V + Z) * 0.02 + lt;
          if (t.scene !== "none") {
            (this.sceneS += this.speed * a), this.placeCar();
            let h = -this.carX,
              p = 20 - this.carY,
              v = Math.min(450, Math.sqrt(h * h + p * p)),
              m =
                0.5 -
                0.5 * ((Math.cos(this.carH) * h + Math.sin(this.carH) * p) / v),
              M = (qt + _t) * 0.5;
            this.flyShadow +=
              (M - this.flyShadow) * (1 - Math.exp((-2 * Math.PI * 1200) / o));
            let B =
              (gt * 0.9 + this.flyShadow * 0.4) * (1 - m) +
              (M * 1.1 + gt * 0.25) * m +
              Yt * 0.3;
            this.flyBuf[this.flyW] = B;
            let k = (v / Vt) * o,
              T = this.flyW - k,
              C = Math.floor(T),
              L = T - C,
              O = this.flyBuf.length - 1,
              d = this.flyBuf[(C + this.flyBuf.length) & O],
              F = this.flyBuf[(C + 1 + this.flyBuf.length) & O];
            this.flyW = (this.flyW + 1) & O;
            let x = d + (F - d) * L;
            if (this.flyFilled < k) {
              let q = this.flyFilled / k;
              x = x * q + B * (1 - q);
            }
            this.flyFilled < 1e7 && this.flyFilled++;
            let f = 14e3 / (1 + v / 20);
            (this.flyLp +=
              (x - this.flyLp) * (1 - Math.exp((-2 * Math.PI * f) / o))),
              (x = this.flyLp * Math.pow(Math.min(1, 20 / v), 0.8) * 2.8);
            let R = (Math.atan2(this.carX, Math.max(1, p)) + Math.PI / 2) / 2,
              A = x * Math.cos(R),
              I = x * Math.sin(R);
            this.room.process(x * 0.5, this.roomOut),
              (A += this.roomOut[0] * 0.12),
              (I += this.roomOut[1] * 0.12);
            let Y = A - this.dcX[0] + 0.995 * this.dcY[0];
            (this.dcX[0] = A), (this.dcY[0] = Y);
            let H = I - this.dcX[1] + 0.995 * this.dcY[1];
            (this.dcX[1] = I),
              (this.dcY[1] = H),
              (i[u] = this.out(Y, 0, t)),
              (e[u] = this.out(H, 1, t));
            continue;
          }
          let zt = t.mic,
            ns = 0,
            rs = 0;
          if (t.wind > 0 && this.speed > 0.5) {
            let h = this.speed * 3.6,
              p = this.rng.next();
            (this.pk0 = 0.99886 * this.pk0 + p * 0.0555179),
              (this.pk1 = 0.99332 * this.pk1 + p * 0.0750759),
              (this.pk2 = 0.969 * this.pk2 + p * 0.153852),
              (this.pk3 = 0.8665 * this.pk3 + p * 0.3104856),
              (this.pk4 = 0.55 * this.pk4 + p * 0.5329522),
              (this.pk5 = -0.7616 * this.pk5 - p * 0.016898);
            let v =
              (this.pk0 +
                this.pk1 +
                this.pk2 +
                this.pk3 +
                this.pk4 +
                this.pk5 +
                this.pk6 +
                p * 0.5362) *
              0.11;
            if (((this.pk6 = p * 0.115926), (this.windN++ & 63) === 0)) {
              let d = 64 / o;
              (this.wk0 += ((this.rng.next() - this.wk0) * d) / 0.35),
                (this.wk1 += ((this.rng.next() - this.wk1) * d) / 0.8),
                (this.wk2 += ((this.rng.next() - this.wk2) * d) / 1.6),
                (this.wkA += ((this.rng.next() - this.wkA) * d) / 0.5),
                (this.wkL += ((this.rng.next() - this.wkL) * d) / 0.9),
                (this.wkR += ((this.rng.next() - this.wkR) * d) / 0.9),
                (this.gust *= 1 - d / 0.6),
                this.rng.next() > 0.985 - 0.01 * Math.min(1, h / 200) &&
                  (this.gust = Math.min(
                    1,
                    this.gust + 0.5 + 0.5 * Math.abs(this.rng.next()),
                  ));
              let F = Math.sqrt(Math.max(0.2, h / 120)),
                x = b(170 * F * (1 + 0.18 * this.wk2), 100, 600),
                f = b(520 * F * (1 + 0.22 * this.wk1), 250, 1600),
                R = b(
                  1250 * F * (1 + 0.3 * this.wk0 + 0.15 * this.gust),
                  500,
                  4200,
                );
              this.windLo.setBandpass(o, x, 2.2),
                this.windMid.setBandpass(o, f, 3.5),
                this.windHi.setBandpass(o, R, 6),
                this.windGlass.setBandpass(o, 240 + 60 * this.wk2, 1.8),
                this.tyreBp.setBandpass(o, b(110 + 1.2 * h, 110, 420), 1.2);
            }
            let y = t.openAir,
              m = Math.pow(Math.min(1, h / 320), 3),
              M = t.wind * m * (0.75 + 0.25 * this.wkA + 0.6 * this.gust),
              B = this.windLo.process(v),
              k = this.windMid.process(v),
              T = this.windHi.process(v),
              C;
            if (y) {
              this.windRum += (v - this.windRum) * 0.012;
              let d = Math.tanh(this.windRum * 6) * 0.5;
              C =
                (B * 2.6 + k * 2.2 + T * 1.3 * (0.6 + 0.4 * this.gust) + d) *
                M *
                1.1;
            } else {
              let d = B * 2.2 + k * 1.2 + this.windGlass.process(v) * 2.5;
              (this.windLp += (d - this.windLp) * 0.09),
                (C = (this.windLp * 1.4 + k * 0.25) * M * 0.9);
            }
            (this.tyreHum += (b(30 + 0.6 * h, 30, 150) / o) * 2 * Math.PI),
              this.tyreHum > Math.PI && (this.tyreHum -= 2 * Math.PI);
            let L =
                t.wind *
                Math.min(1, h / 220) *
                (y ? 0.45 : 0.4) *
                (0.85 + 0.15 * this.wkA),
              O =
                (this.tyreBp.process(v) * 2 + 0.12 * Math.sin(this.tyreHum)) *
                L *
                0.4;
            (ns = C * (1 + 0.25 * this.wkL) + O),
              (rs = C * (1 + 0.25 * this.wkR) + O);
          }
          let os = 1 - 0.75 * zt,
            ps = 0.35 + 0.65 * zt,
            wt = t.banks > 1 ? 0.7 : 0.6,
            cs = this.whineOut * (0.45 + 0.55 * zt),
            $ = (qt * wt + _t * (1 - wt)) * os + gt * ps + Yt + cs + ns,
            tt = (_t * wt + qt * (1 - wt)) * os + gt * ps + Yt + cs + rs;
          t.cabin > 0 &&
            (t.cabin !== this.fmtCabin && this.setCabin(t.cabin),
            ($ = this.throughCabin($, 0, t.cabin)),
            (tt = this.throughCabin(tt, 1, t.cabin))),
            (this.tunnelS += ((t.tunnel ? 1 : 0) - this.tunnelS) * (a / 0.45));
          let ls = ($ + tt) * 0.5;
          this.room.process(ls, this.roomOut);
          let ut = this.tunnelS;
          if (ut > 0.002) {
            this.tunnelRoom.process(ls, this.tunnelOut);
            let h = 1 + 0.8 * ut;
            ($ =
              $ * h +
              this.roomOut[0] * t.room * (1 - 0.5 * ut) +
              this.tunnelOut[0] * t.room * 3 * ut),
              (tt =
                tt * h +
                this.roomOut[1] * t.room * (1 - 0.5 * ut) +
                this.tunnelOut[1] * t.room * 3 * ut);
          } else
            ($ += this.roomOut[0] * t.room), (tt += this.roomOut[1] * t.room);
          let us = $ - this.dcX[0] + 0.995 * this.dcY[0];
          (this.dcX[0] = $), (this.dcY[0] = us);
          let ms = tt - this.dcX[1] + 0.995 * this.dcY[1];
          (this.dcX[1] = tt), (this.dcY[1] = ms);
          let fs = Os * (0.5 + 0.5 * (1 - t.mic)) * t.master * jt;
          (i[u] = Math.tanh(this.out(us, 0, t) + fs)),
            (e[u] = Math.tanh(this.out(ms, 1, t) + fs));
        }
      }
    };
  s(Rt, "FORMANTS", [
    [42, 1.8, 6],
    [205, 2.6, 8],
    [400, 3.5, 7],
    [550, 4.5, 6],
    [750, 4.5, 6],
  ]);
  var Ct = Rt;
  var Zt = class extends AudioWorkletProcessor {
    constructor() {
      super();
      s(this, "synth", null);
      s(this, "blocks", 0);
      this.port.onmessage = (e) => {
        let t = e.data;
        t.type === "reset"
          ? this.synth && this.synth.reset()
          : t.type === "params"
            ? this.synth
              ? this.synth.setParams(t.params, t.swap)
              : (this.synth = new Ct(sampleRate, t.params))
            : t.type === "controls" &&
              this.synth &&
              this.synth.setControls(t.controls);
      };
    }
    process(e, t) {
      let r = t[0];
      if (!r || r.length === 0) return !0;
      if (!this.synth) {
        for (let n of r) n.fill(0);
        return !0;
      }
      try {
        this.synth.process(r[0], r[1] ?? r[0]);
      } catch (err) {
        (this.errN = (this.errN || 0) + 1),
          this.errN < 4 &&
            console.error("engine synth error", err && err.message);
      }
      for (let n = 2; n < r.length; n++) r[n].set(r[n & 1]);
      return (
        ++this.blocks % 4 === 0 &&
          this.port.postMessage({
            type: "state",
            state: this.synth.getState(),
          }),
        !0
      );
    }
  };
  registerProcessor("engine", Zt);
})();
