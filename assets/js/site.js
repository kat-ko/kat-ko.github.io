/* Kathrin Korte · site script
   1. layout distortion  (seeded offsets for .frame, .strike, spines)
   2. background glitch  (canvas #fx)
   3. small behaviours   (email, copy buttons, shelf, click-to-load embeds)
   4. dev panel          (only with ?dev in the URL; settings are then kept in localStorage)
   Live settings come from _data/design.json (window.GLITCH).                                   */
(() => {
  "use strict";

  /* ---------------- settings ---------------- */
  const FALLBACK = { d: .5, seed: 1, fxOn: false, fxI: .2, fxS: .5, fxP: 8,
    fx: { edges: true, dead: true, blobs: true, lines: false, band: false, tear: false },
    w:  { edges: 1, dead: .5, blobs: .5, lines: .5, band: .5, tear: .5 } };
  const clone = o => JSON.parse(JSON.stringify(o));
  const BASE = Object.assign(clone(FALLBACK), window.GLITCH || {});
  BASE.fx = Object.assign({}, FALLBACK.fx, (window.GLITCH || {}).fx);
  BASE.w  = Object.assign({}, FALLBACK.w,  (window.GLITCH || {}).w);

  const DEV = /[?&]dev\b/.test(location.search);
  const KEY = "kk-design-dev";
  let S = clone(BASE);
  if (DEV) {
    try { const st = JSON.parse(localStorage.getItem(KEY) || "null");
      if (st) { S = Object.assign(S, st); S.fx = Object.assign({}, BASE.fx, st.fx); S.w = Object.assign({}, BASE.w, st.w); } } catch (e) {}
  }
  const save = () => { if (DEV) try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const plain = () => document.documentElement.dataset.mode === "plain";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------------- 1. layout distortion ---------------- */
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const span = (r, a, b) => a + (b - a) * r();
  const set = (el, k, v) => el.style.setProperty(k, v);

  function applySeed() {
    document.documentElement.style.setProperty("--d", S.d);
    $$(".frame").forEach(el => {
      const r = rng(hash(S.seed + ":" + (el.dataset.seed || el.textContent.trim().slice(0, 20))));
      const damp = parseFloat(el.dataset.damp || 1), amp = parseFloat(el.dataset.amp || 1);
      const dx = span(r, -80, 80) * damp * amp, dy = span(r, -30, 30) * damp * amp;
      set(el, "--t", (dy + span(r, -12, 12) * damp).toFixed(1));
      set(el, "--b", (-dy + span(r, -12, 12) * damp).toFixed(1));
      set(el, "--l", (dx + span(r, -18, 18) * damp).toFixed(1));
      set(el, "--r", (-dx + span(r, -18, 18) * damp).toFixed(1));
      set(el, "--rot", (span(r, -1.2, 1.2) * damp).toFixed(2));
      set(el, "--ind", span(r, -10, 50).toFixed(1));
    });
    $$(".strike").forEach(el => {
      const r = rng(hash(S.seed + ":" + (el.dataset.seed || el.textContent)));
      set(el, "--sl", span(r, 0, 14).toFixed(1));
      set(el, "--sr", span(r, 30, 120).toFixed(1));
      set(el, "--srot", span(r, -2, 2).toFixed(2));
    });
    $$(".spine").forEach(el => { // book proportions from the title, so the shelf is uneven without curation
      const r = rng(hash(S.seed + ":spine:" + el.dataset.key));
      const len = el.dataset.key.length;
      set(el, "--sh", Math.round(Math.min(270, 165 + len * 1.6 + span(r, -18, 18))) + "px");
      set(el, "--sw", Math.round(span(r, 34, 54)) + "px");
      set(el, "--lean", (r() < .18 ? span(r, -7, 7) : 0).toFixed(1));
    });
  }

  /* ---------------- 2. background glitch ----------------
     strength(k) = weight_k * (0.25 + intensity); each element draws its own tempo (0.3x..2.5x of speed). */
  const cv = $("#fx"), cx = cv && cv.getContext("2d");
  let W = 0, H = 0, raf = 0, last = 0;
  const resize = () => { if (!cv) return; const DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px"; cx.setTransform(DPR, 0, 0, DPR, 0, 0); };
  addEventListener("resize", resize); resize();

  const R = Math.random;
  const RGB = ["#ff0040", "#00e060", "#0050ff", "#00f0ff", "#ff00d0", "#ffe000"];
  const pick = a => a[(R() * a.length) | 0];
  const str = k => S.w[k] * (.25 + S.fxI);
  const tempo = () => S.fxS * Math.exp(Math.log(.3) + R() * (Math.log(2.5) - Math.log(.3)));
  let dead = [], blobs = [], edges = [], cols = [], band = null;

  function spawnDead() {
    const p = S.fxP, v = tempo();
    return { x: Math.floor(R() * W / p) * p, y: Math.floor(R() * H / p) * p,
      c: R() < .5 ? "#000" : pick(RGB), hz: R() < .5 ? 0 : Math.min(1.5, (.1 + R() * .6) * v), ph: R() * 6.28,
      life: (10 + R() * 25) / v, fade: 2 / v, age: 0 };
  }
  function spawnBlob() {
    const v = tempo(), s = str("blobs");
    return { cells: [[0, 0]], set: new Set(["0,0"]), x: R() * W, y: R() * H,
      vx: (R() - .5) * 10 * v, vy: ((R() - .5) * 6 - 2) * v, rate: (3 + R() * 15) * v, acc: 0,
      target: 12 + (R() * 120 * Math.min(1.5, s)) | 0, phase: "grow", hold: (1.5 + R() * 4) / v,
      c: R() < .8 ? "#000" : pick(RGB) };
  }
  function spawnEdge(side) {
    const k = Math.min(1, W / 1100); // hug the edges tighter on narrow screens
    return { side, off: R() * 90 * k, w: (3 + R() * 16) * (.5 + .5 * k), c: pick(RGB), a: .35 + R() * .55,
      drift: (R() - .5) * 14, t: R() * 10, v: tempo() };
  }
  function spawnCol() { const v = tempo(); return { x: Math.floor(R() * W), c: pick(RGB), a: .25 + R() * .4, life: (4 + R() * 12) / v, age: 0 }; }

  function reseedFx() {
    dead  = Array.from({ length: Math.round(2 + 40 * str("dead")) }, spawnDead);
    blobs = Array.from({ length: Math.max(1, Math.round(6 * str("blobs"))) }, spawnBlob);
    const ne = Math.round(2 + 5 * str("edges"));
    edges = [...Array.from({ length: ne }, () => spawnEdge("l")), ...Array.from({ length: ne }, () => spawnEdge("r"))];
    cols  = Array.from({ length: Math.round(1 + 4 * str("lines")) }, spawnCol);
    band  = { y: -100, h: 30 + R() * 60, v: (20 + R() * 40) * S.fxS, wait: 1 + R() * 4 };
  }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function step(now) {
    raf = requestAnimationFrame(step);
    if (now - last < 33) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    const t = now / 1000, p = S.fxP;
    cx.clearRect(0, 0, W, H);

    if (S.fx.edges) {
      const s = str("edges");
      cx.save(); cx.filter = `blur(${5 + 8 * Math.min(s, 1.5)}px)`;
      for (const e of edges) {
        e.t += dt * e.v; const wob = Math.sin(e.t * .7) * e.drift;
        const x = e.side === "l" ? e.off + wob : W - e.off - e.w + wob;
        cx.globalAlpha = Math.min(1, e.a * (.65 + .35 * Math.sin(e.t * 1.3)) * (.3 + 1.1 * s)) * (W < 680 ? .5 : 1); // calmer on phones, where text sits near the edge
        cx.fillStyle = e.c; cx.fillRect(x, -20, e.w, H + 40);
      }
      cx.restore();
    }
    if (S.fx.lines) {
      for (let i = 0; i < cols.length; i++) { const c = cols[i]; c.age += dt;
        if (c.age > c.life) { cols[i] = spawnCol(); continue; }
        cx.globalAlpha = c.a; cx.fillStyle = c.c; cx.fillRect(c.x, 0, 1, H); }
    }
    if (S.fx.dead) {
      for (let i = 0; i < dead.length; i++) { const d = dead[i]; d.age += dt;
        if (d.age > d.life) { dead[i] = spawnDead(); continue; }
        if (d.hz && Math.sin(t * 6.28 * d.hz + d.ph) <= 0) continue;   // blinking stays ≤ 1.5 Hz
        cx.globalAlpha = Math.max(0, Math.min(1, d.age / d.fade, (d.life - d.age) / d.fade));
        cx.fillStyle = d.c; cx.fillRect(d.x, d.y, p, p); }
    }
    if (S.fx.blobs) {
      const a = Math.min(.9, .35 + .5 * str("blobs"));
      for (let i = 0; i < blobs.length; i++) { const b = blobs[i];
        b.x += b.vx * dt; b.y += b.vy * dt; b.acc += b.rate * dt;
        const n = b.acc | 0; b.acc -= n;
        if (b.phase === "grow") {
          for (let k = 0; k < n; k++) { const [x0, y0] = pick(b.cells); const [ax, ay] = pick(DIRS);
            const key = (x0 + ax) + "," + (y0 + ay); if (!b.set.has(key)) { b.set.add(key); b.cells.push([x0 + ax, y0 + ay]); } }
          if (b.cells.length >= b.target) b.phase = "hold";
        } else if (b.phase === "hold") { b.hold -= dt; if (b.hold <= 0) b.phase = "die"; }
        else { for (let k = 0; k < n && b.cells.length; k++) b.cells.splice((R() * b.cells.length) | 0, 1);
          if (!b.cells.length) { blobs[i] = spawnBlob(); continue; } }
        cx.globalAlpha = a; cx.fillStyle = b.c;
        const ox = Math.round(b.x / p) * p, oy = Math.round(b.y / p) * p;
        for (const [gx, gy] of b.cells) cx.fillRect(ox + gx * p, oy + gy * p, p, p);
      }
    }
    if (S.fx.band) {
      const s = str("band");
      if (band.wait > 0) band.wait -= dt;
      else { band.y += band.v * dt;
        cx.globalAlpha = Math.min(.6, .1 + .3 * s);
        for (let y = band.y; y < band.y + band.h; y += 2)
          for (let x = 0; x < W; x += 3 + (R() * 9 | 0)) if (R() < .35) { cx.fillStyle = R() < .85 ? "#000" : pick(RGB); cx.fillRect(x, y, 2 + R() * 6, 1); }
        if (band.y > H) band = { y: -100, h: 30 + R() * 60, v: (20 + R() * 40) * S.fxS, wait: (2 + R() * 8) / (.3 + s) };
      }
    }
    cx.globalAlpha = 1;
    if (S.fx.tear && R() < .012 * str("tear") * dt * 30) tearOnce();
  }
  function tearOnce() {
    if (plain()) return;
    const el = pick($$(".frame")); if (!el) return;
    set(el, "--tear", ((R() < .5 ? -1 : 1) * (6 + R() * 30)).toFixed(0));
    el.classList.add("tear"); setTimeout(() => el.classList.remove("tear"), 80 + R() * 160);
  }
  function runFx() {
    if (!cv) return;
    cancelAnimationFrame(raf); cx.clearRect(0, 0, W, H);
    if (S.fxOn && !reduceMotion && !plain()) { reseedFx(); last = performance.now(); raf = requestAnimationFrame(step); }
  }

  /* ---------------- 3. behaviours ---------------- */
  // email: assembled here so the address is not plain text in the HTML
  $$("a.email").forEach(a => { a.href = "mailto:" + a.dataset.u + "@" + a.dataset.d; }); // label stays "email"; address only in the link target

  function copyText(txt, btn) {
    const done = ok => { const old = btn.dataset.label || btn.textContent; btn.dataset.label = old;
      btn.textContent = ok ? "copied" : "select + copy"; setTimeout(() => btn.textContent = old, 1400); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(() => done(true), () => fallback());
    else fallback();
    function fallback() { const ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) {} ta.remove(); done(ok); }
  }
  document.addEventListener("click", e => {
    const b = e.target.closest(".copy"); if (!b) return;
    const txt = b.hasAttribute("data-copy-prev") ? b.previousElementSibling.textContent : b.dataset.copy;
    copyText(txt, b);
  });

  // shelf: one open card per shelf
  $$("[data-shelf]").forEach(shelf => {
    const spines = $$(".spine", shelf);
    spines.forEach(sp => sp.addEventListener("click", () => {
      const open = sp.getAttribute("aria-expanded") === "true";
      spines.forEach(o => { o.setAttribute("aria-expanded", "false"); const c = document.getElementById(o.getAttribute("aria-controls")); if (c) c.hidden = true; });
      if (!open) { sp.setAttribute("aria-expanded", "true"); const c = document.getElementById(sp.getAttribute("aria-controls")); if (c) c.hidden = false; }
    }));
  });

  // embeds: nothing third-party loads until the visitor clicks
  document.addEventListener("click", e => {
    const b = e.target.closest(".embed-load"); if (!b) return;
    const box = b.parentElement, f = document.createElement("iframe");
    f.src = b.dataset.src; f.title = b.dataset.title || "embedded content";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.loading = "lazy";
    box.innerHTML = ""; box.style.display = "block"; box.appendChild(f);
  });

  // view toggle: designed version (default for everyone) or plain black-and-white; remembered per browser
  const mt = $(".mode-toggle");
  const syncToggle = () => { if (!mt) return; const p = plain();
    mt.textContent = p ? "glitch view" : "plain view"; mt.setAttribute("aria-pressed", String(p)); };
  if (mt) mt.addEventListener("click", () => {
    const next = plain() ? "glitch" : "plain";
    document.documentElement.dataset.mode = next;
    try { next === "plain" ? localStorage.setItem("kk-mode", "plain") : localStorage.removeItem("kk-mode"); } catch (e) {}
    syncToggle(); runFx();
  });
  syncToggle();

  /* ---------------- 4. dev panel ---------------- */
  function devPanel() {
    const EFFECTS = [["edges", "blurry colour bleed at edges"], ["dead", "dead / stuck pixels"], ["blobs", "growing pixel clusters"],
      ["lines", "dead columns"], ["band", "tracking band"], ["tear", "frame tear (boxes jump)"]];
    const el = document.createElement("aside"); el.id = "dev"; el.setAttribute("aria-label", "Design controls");
    el.innerHTML = `<header><span>design controls</span><span data-t>[–]</span></header><div class="body">
      <label>distortion <output data-o="d"></output><input data-k="d" type="range" min="0" max="1" step=".01"></label>
      <div class="row">seed <input data-seed type="number" min="0" step="1"><button data-reroll>reroll</button></div>
      <fieldset><legend><label class="chk"><input data-on type="checkbox"> background glitch</label></legend>
        <label>intensity <output data-o="fxI"></output><input data-k="fxI" type="range" min="0" max="1" step=".01"></label>
        <label>speed <output data-o="fxS"></output><input data-k="fxS" type="range" min=".05" max="2" step=".05"></label>
        <label>pixel size <output data-o="fxP"></output><input data-k="fxP" type="range" min="2" max="16" step="1"></label>
        ${EFFECTS.map(([k, n]) => `<div style="margin-top:6px"><label class="chk"><input type="checkbox" data-fx="${k}"> ${n}</label>
          <label>weight <output data-wo="${k}"></output><input type="range" min="0" max="2" step=".05" data-w="${k}"></label></div>`).join("")}
      </fieldset>
      <div class="row"><button data-copycfg>copy config</button><button data-reset>reset to design.json</button></div>
      <textarea rows="5" readonly hidden></textarea>
      <div class="note">Paste the config into _data/design.json to make it live. Key [D] hides this panel.</div></div>`;
    document.body.appendChild(el);
    const q = s => el.querySelector(s), qa = s => [...el.querySelectorAll(s)];
    const render = () => {
      qa("[data-k]").forEach(i => i.value = S[i.dataset.k]);
      qa("[data-o]").forEach(o => { const v = +S[o.dataset.o]; o.value = o.dataset.o === "fxP" ? v + "px" : o.dataset.o === "fxS" ? v.toFixed(2) + "×" : v.toFixed(2); });
      q("[data-seed]").value = S.seed; q("[data-on]").checked = S.fxOn;
      qa("[data-fx]").forEach(c => c.checked = !!S.fx[c.dataset.fx]);
      qa("[data-w]").forEach(r => r.value = S.w[r.dataset.w]);
      qa("[data-wo]").forEach(o => o.value = (+S.w[o.dataset.wo]).toFixed(2));
    };
    qa("[data-k]").forEach(i => { i.oninput = () => { S[i.dataset.k] = +i.value; render(); save(); if (i.dataset.k === "d") applySeed(); };
      if (i.dataset.k !== "d") i.onchange = runFx; });
    q("[data-seed]").onchange = e => { S.seed = +e.target.value | 0; applySeed(); save(); };
    q("[data-reroll]").onclick = () => { S.seed = (Math.random() * 9999) | 0; render(); applySeed(); save(); };
    q("[data-on]").onchange = e => { S.fxOn = e.target.checked; save(); runFx(); };
    qa("[data-fx]").forEach(c => c.onchange = () => { S.fx[c.dataset.fx] = c.checked; save(); });
    qa("[data-w]").forEach(r => { r.oninput = () => { S.w[r.dataset.w] = +r.value; render(); save(); }; r.onchange = runFx; });
    q("[data-copycfg]").onclick = e => { const ta = q("textarea"); ta.hidden = false; ta.value = JSON.stringify(S); ta.select(); copyText(ta.value, e.target); };
    q("[data-reset]").onclick = () => { S = clone(BASE); try { localStorage.removeItem(KEY); } catch (e) {} render(); applySeed(); runFx(); };
    q("header").onclick = () => { el.classList.toggle("collapsed"); q("[data-t]").textContent = el.classList.contains("collapsed") ? "[+]" : "[–]"; };
    addEventListener("keydown", e => { if ((e.key === "d" || e.key === "D") && !/input|textarea/i.test(e.target.tagName)) el.hidden = !el.hidden; });
    render();
  }

  applySeed(); runFx();
  if (DEV) devPanel();
})();
