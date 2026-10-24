"use strict";
/* Last-season post-mortem (window.SEASON, built by engine/season_report.py)
   and the live league tab (fetched from the Sleeper API in the browser).
   Loaded before the main script; helpers like esc/f1/av/$/lineup come from it at call time. */

// Manager identity colors: validated categorical palette for the dark surface (dataviz validator, all checks pass).
const MCOL = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"];
const GRAY = "#5b6b88";
function ucol(id){
  const ids = ((window.BOARD && window.BOARD.members) || []).map(m => m.id);
  const i = ids.indexOf(id);
  return MCOL[(i < 0 ? ids.length : i) % MCOL.length];
}
// line icons for rule tiles (one stroke family)
const RI = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  star: '<path d="M12 3.6l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.6l-5.1 2.7.97-5.68L3.75 9.6l5.7-.83z"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  ball: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5v19"/><path d="M5.3 5.3c3.2 2.9 3.2 10.5 0 13.4M18.7 5.3c-3.2 2.9-3.2 10.5 0 13.4"/>',
};
const ric = name => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${RI[name]}</svg>`;
const mdot = id => `<span class="mdot" style="background:${ucol(id)}"></span>`;
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const pctS = v => Math.round(v * 100) + "%";
const daysTxt = d => { d = Math.max(1, Math.round(d)); return d === 1 ? "יום" : d === 2 ? "יומיים" : `${d} ימים`; };
const sgn = v => (v > 0 ? "+" : v < 0 ? "−" : "") + f1(Math.abs(v));
const CHECK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const CROSS = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const avId = (id, size) => `<img class="av" style="width:${size}px;height:${size}px" src="https://sleepercdn.com/content/nba/players/thumb/${id}.jpg" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`;

// ---------- charts (inline SVG, LTR time axis) ----------
function niceTicks(lo, hi, n = 4){
  const span = (hi - lo) || 1, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(x => x * mag).find(s => s >= raw);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
  for (let v = a; v <= b + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

function lineChart(el, cfg){
  const W = Math.max(300, Math.floor(el.clientWidth || 600)), H = cfg.h || 240, m = {t: 14, r: 42, b: 26, l: 18};
  const vals = cfg.series.flatMap(s => s.vals).concat(cfg.band ? cfg.band.lo.concat(cfg.band.hi) : []).filter(v => v != null && isFinite(v));
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals), 4), lo = ticks[0], hi = ticks[ticks.length - 1];
  const n = cfg.x.length, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const X = i => (W - m.r) - (n <= 1 ? iw / 2 : i * iw / (n - 1)), Y = v => m.t + (1 - (v - lo) / ((hi - lo) || 1)) * ih;
  let s = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.label)}">`;
  for (const t of ticks) s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${W - m.r + 8}" y="${Y(t) + 4}" text-anchor="start">${t}</text>`;
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 34))));
  cfg.x.forEach((lb, i) => { if (i % every === 0 || i === n - 1) s += `<text class="ax" x="${X(i)}" y="${H - 6}" text-anchor="middle">${lb}</text>`; });
  if (cfg.band) {
    const top = cfg.band.hi.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
    const bot = cfg.band.lo.map((v, i) => `${X(i)},${Y(v)}`).reverse().join(" ");
    s += `<polygon points="${top} ${bot}" fill="#8194b1" opacity=".13"/>`;
  }
  for (const sr of cfg.series) {
    let d = "", pen = false;
    sr.vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1); pen = true; });
    s += `<path d="${d}" fill="none" stroke="${sr.color}" stroke-width="${sr.w || 2}" stroke-linejoin="round" stroke-linecap="round" opacity="${sr.op ?? 1}"/>`;
    (sr.marks || []).forEach(i => { if (sr.vals[i] != null) s += `<circle cx="${X(i)}" cy="${Y(sr.vals[i])}" r="4.5" fill="${sr.color}" stroke="#111a2e" stroke-width="2"/>`; });
  }
  s += `<line class="xh" y1="${m.t}" y2="${H - m.b}" x1="0" x2="0" visibility="hidden"/></svg>`;
  el.innerHTML = `<div class="chart-wrap">${s}<div class="tip" hidden></div></div>`;
  const svg = el.querySelector("svg"), xh = svg.querySelector(".xh"), tip = el.querySelector(".tip");
  svg.addEventListener("pointermove", ev => {
    const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * (W / r.width);
    const i = Math.max(0, Math.min(n - 1, Math.round(((W - m.r) - x) / (iw / Math.max(1, n - 1)))));
    xh.setAttribute("x1", X(i)); xh.setAttribute("x2", X(i)); xh.setAttribute("visibility", "visible");
    tip.innerHTML = cfg.tip(i); tip.hidden = false;
    const px = X(i) * r.width / W, tw = tip.offsetWidth;
    tip.style.left = (px - tw - 14 >= 0 ? px - tw - 14 : Math.min(r.width - tw, px + 14)) + "px"; tip.style.top = "6px";
  });
  svg.addEventListener("pointerleave", () => { xh.setAttribute("visibility", "hidden"); tip.hidden = true; });
}

function dotChart(el, cfg){
  const W = Math.max(300, Math.floor(el.clientWidth || 600)), H = cfg.h || 230, m = {t: 12, r: 42, b: 26, l: 16};
  const ys = cfg.pts.map(p => p.y).concat(cfg.line ? cfg.line.map(p => p.y) : []);
  const ticks = niceTicks(0, Math.max(...ys), 4), hi = ticks[ticks.length - 1];
  const x0 = cfg.xmin, x1 = cfg.xmax, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const X = v => (W - m.r) - (v - x0) / ((x1 - x0) || 1) * iw, Y = v => m.t + (1 - v / hi) * ih;
  let s = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.label)}">`;
  for (const t of ticks) s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${W - m.r + 8}" y="${Y(t) + 4}" text-anchor="start">${t}</text>`;
  (cfg.xticks || []).forEach(t => { s += `<text class="ax" x="${X(t)}" y="${H - 6}" text-anchor="middle">${t}</text>`; });
  if (cfg.line) s += `<path d="${cfg.line.map((p, i) => (i ? "L" : "M") + X(p.x).toFixed(1) + "," + Y(p.y).toFixed(1)).join("")}" fill="none" stroke="${GRAY}" stroke-width="1.5"/>`;
  const order = [...cfg.pts].sort((a, b) => (a.hl ? 1 : 0) - (b.hl ? 1 : 0));
  for (const p of order) s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.hl ? 5.5 : 4}" fill="${p.color}" stroke="#111a2e" stroke-width="2" opacity="${p.hl ? 1 : .7}"/>`;
  s += `<circle class="hov" r="9" fill="none" stroke="#e7eef9" stroke-width="1.5" visibility="hidden"/></svg>`;
  el.innerHTML = `<div class="chart-wrap">${s}<div class="tip" hidden></div></div>`;
  const svg = el.querySelector("svg"), hov = svg.querySelector(".hov"), tip = el.querySelector(".tip");
  svg.addEventListener("pointermove", ev => {
    const r = svg.getBoundingClientRect(), sx = W / r.width, x = (ev.clientX - r.left) * sx, y = (ev.clientY - r.top) * sx;
    let best = null, bd = 28 * 28;
    for (const p of cfg.pts) { const d = (X(p.x) - x) ** 2 + (Y(p.y) - y) ** 2; if (d < bd) { bd = d; best = p; } }
    if (!best) { hov.setAttribute("visibility", "hidden"); tip.hidden = true; return; }
    hov.setAttribute("cx", X(best.x)); hov.setAttribute("cy", Y(best.y)); hov.setAttribute("visibility", "visible");
    tip.innerHTML = best.tip; tip.hidden = false;
    const px = X(best.x) / sx, tw = tip.offsetWidth;
    tip.style.left = (px - tw - 14 >= 0 ? px - tw - 14 : Math.min(r.width - tw, px + 14)) + "px"; tip.style.top = Math.max(0, Y(best.y) / sx - 40) + "px";
  });
  svg.addEventListener("pointerleave", () => { hov.setAttribute("visibility", "hidden"); tip.hidden = true; });
}
const tipRow = (color, label, value) => `<div class="row"><span><span class="key" style="background:${color}"></span> ${label}</span><b>${value}</b></div>`;

// ---------- last season ----------
function renderSeason(){
  const D = window.SEASON, out = $("seasonOut");
  if (!D) { out.innerHTML = `<div class="card empty-card"><p>חסר קובץ הנתונים של העונה שעברה (draft/season2025.js). מריצים refresh_data.bat.</p></div>`; return; }
  const me = D.me, M = Object.fromEntries(D.managers.map(m => [m.id, m])), mine = M[me], top = M[D.gap.to];
  const regChamp = [...D.managers].sort((a, b) => (b.wins - a.wins) || (b.pf - a.pf))[0];
  const nm = id => esc(D.users[id]), who = id => `<span class="who">${mdot(id)}${nm(id)}</span>`;
  const n = D.managers.length, REG = D.reg_weeks;
  const avgPF = mean(D.managers.map(m => m.pf)), avgCap = mean(D.managers.map(m => m.capture)), avgGap = mean(D.managers.map(m => m.lineup_gap));
  const maxPA = Math.max(...D.managers.map(m => m.pa));
  const myPicks = D.draft.filter(d => d.user === me);
  const g = D.gap, parts = [["roster", "איכות הסגל", "var(--accent)", Math.max(0, g.roster)], ["locks", "תזמון נעילות", "var(--pos-g)", Math.max(0, g.locks)], ["lineup", "מי פתח", "#8194b1", Math.max(0, g.lineup)]];
  const psum = parts.reduce((a, p) => a + p[3], 0) || 1;
  const altBy = {}; myPicks.forEach(p => { const u = (p.alt.how.match(/ע"י (.+)$/) || [])[1]; if (u) altBy[u] = (altBy[u] || 0) + 1; });
  const [altUser, altCount] = Object.entries(altBy).sort((a, b) => b[1] - a[1])[0] || ["", 0];
  const verdictTxt = {hit: "פגיעה", ok: "סביר", miss: "החטאה"};
  const maxV = Math.max(...myPicks.map(p => Math.max(p.v, p.exp, p.alt.v)));
  const drops = []; D.my_drops.forEach(d => { const e = drops.find(x => x.id === d.id); if (e) e.times++; else drops.push({...d, times: 1}); });
  const hits = myPicks.filter(p => p.verdict === "hit"), misses = myPicks.filter(p => p.verdict === "miss");
  const passed = myPicks.filter(p => p.alt.how.includes(altUser)).map(p => p.alt.n).filter((v, i, a) => a.indexOf(v) === i);

  out.innerHTML = `
  <div class="card verdict-card c7">
    <div class="hero-fig"><bdi>−${Math.round(g.total)}</bdi><small>נקודות בשבוע מתחת ל-${nm(top.id)}, המוביל של העונה הסדירה</small></div>
    <div>
      <h2>מקום ${mine.place} מתוך ${n} · <bdi>${mine.wins}-${mine.losses}</bdi></h2>
      <p class="lead">הסיבה העיקרית היא <b>הסגל</b>. ב-${mine.weeks_lowest} מתוך ${REG} שבועות היה לך ההרכב עם הפוטנציאל הנמוך בליגה, ורק ב-${pctS(mine.pot_allplay)} מההשוואות השבועיות ההרכב שלך היה חזק יותר משל קבוצה אחרת. הנעילות ובחירת הפותחים עלו לך פחות.</p>
      <div class="cq"><div class="tiles">
        <div class="tile bad"><span>מאזן</span><b><bdi>${mine.wins}-${mine.losses}</bdi></b><em>מקום ${mine.place} מתוך ${n}</em></div>
        <div class="tile"><span>נקודות לשבוע</span><b>${f1(mine.pf)}</b><em>ממוצע הליגה ${f1(avgPF)}</em></div>
        <div class="tile"><span>נקודות נגדך לשבוע</span><b>${f1(mine.pa)}</b><em>${mine.pa === maxPA ? "הכי הרבה בליגה" : "ממוצע " + f1(mean(D.managers.map(m => m.pa)))}</em></div>
        <div class="tile"><span>ניצול בנעילות</span><b>${pctS(mine.capture)}</b><em>ממוצע הליגה ${pctS(avgCap)}</em></div>
      </div></div>
    </div>
  </div>

  <div class="card c5">
    <h2>הטבלה הסופית</h2>
    <div class="tablewrap" style="border:0"><table class="std">
      <tr><th>מקום</th><th>מנג'ר</th><th>מאזן</th><th>נק' לשבוע</th><th class="hide-sm hide-n">נגד</th><th title="סך המשחק הטוב של 9 הפותחים בשבוע">פוטנציאל</th><th class="hide-sm" title="כמה מהפוטנציאל נכנס לניקוד">ניצול</th><th class="hide-sm hide-n">מהשוק</th></tr>
      ${D.managers.map(m => `<tr class="${m.id === me ? "me" : ""}"><td class="r">${m.place}${m.place === 1 ? ' <span class="rv-tag gold">אלוף הפלייאוף</span>' : ""}${m.id === regChamp.id ? ' <span class="rv-tag gold">אלוף העונה הסדירה</span>' : ""}</td><td>${who(m.id)}</td><td class="num"><bdi>${m.wins}-${m.losses}</bdi></td><td class="num"><span class="dbar"><i style="width:${(m.pf / Math.max(...D.managers.map(x => x.pf)) * 100).toFixed(1)}%;background:${ucol(m.id)}"></i></span>${f1(m.pf)}</td><td class="num hide-sm hide-n">${f1(m.pa)}</td><td class="num">${f1(m.pool)}</td><td class="num hide-sm">${pctS(m.capture)}</td><td class="num hide-sm hide-n">${f1(m.from_waivers)}</td></tr>`).join("")}
    </table></div>
    <p class="hint">בליגה יש שני תארים: ${nm(regChamp.id)} זכה בעונה הסדירה (<bdi>${regChamp.wins}-${regChamp.losses}</bdi>), ו-${nm(D.managers.find(m => m.place === 1).id)} זכה בפלייאוף. הטבלה מסודרת לפי המקום הסופי אחרי הפלייאוף.</p>
  </div>

  <div class="card c5">
    <h2>לאן הלכו ${Math.round(g.total)} הנקודות בשבוע</h2>
    <p class="lead">${who(top.id)} קלע ${f1(top.pf)} בשבוע, אתה ${f1(mine.pf)}. ככה מתחלק ההפרש:</p>
    <div class="wf">
      <div class="wf-row total"><span class="wf-l">ההפרש כולו</span><div class="wf-t"><i style="margin-inline-start:0;width:100%"></i></div><b>${f1(g.total)}</b></div>
      ${(() => { let at = 0; return parts.map(p => { const row = `<div class="wf-row"><span class="wf-l">${p[1]}</span><div class="wf-t"><i style="margin-inline-start:${(at / psum * 100).toFixed(1)}%;width:${(p[3] / psum * 100).toFixed(1)}%;background:${p[2]}"></i></div><b>${f1(p[3])}</b></div>
        <p class="wf-why">${{roster: `פוטנציאל ההרכב שלך ${f1(mine.pool)} בשבוע, מול ${f1(top.pool)} אצלו. היו לו שחקנים שמגיעים למשחקים גבוהים יותר.`, locks: `נעלת ${pctS(mine.capture)} מהפוטנציאל, הוא ${pctS(top.capture)}. כלל האצבע של המערכת נועד לסגור את זה.`, lineup: `${f1(mine.lineup_gap)} נקודות בשבוע נשארו על הספסל (ממוצע הליגה ${f1(avgGap)}). כאן היית כמו כולם.`}[p[0]]}</p>`; at += p[3]; return row; }).join(""); })()}
    </div>
  </div>

  <div class="card c7">
    <h2>פוטנציאל ההרכב שלך, שבוע אחרי שבוע</h2>
    <p class="lead">הקו שלך מול הטווח של הליגה (האזור האפור) והחציון. פוטנציאל = סך המשחק הכי טוב של כל אחד מ-9 הפותחים באותו שבוע. הנקודות המודגשות הן השבועות שבהם היית הכי נמוך בליגה.</p>
    <div id="chWeekly"></div>
    <div class="legend-row"><span><i class="ln" style="background:${ucol(me)}"></i>${nm(me)}</span><span><i class="ln" style="background:${GRAY}"></i>חציון הליגה</span><span><i class="bx" style="background:rgba(129,148,177,.3)"></i>טווח הליגה</span></div>
    <details class="tv"><summary>טבלת נתונים</summary><div class="tablewrap" style="border:0"><table class="std"><tr><th>שבוע</th><th>שלך</th><th>חציון</th><th>היריב</th></tr>
      ${D.weekly.map(r => `<tr><td>${r.w}</td><td class="num">${f1(r.pot[me])}</td><td class="num">${f1(r.median)}</td><td class="num">${f1(r.pot[r.opp[me]])} · ${nm(r.opp[me])}</td></tr>`).join("")}</table></div></details>
  </div>

  <div class="sec-h c12"><h2>הדראפט</h2><p>הערך = הממוצע של המשחק הכי טוב של השחקן בכל שבוע בעונה הסדירה. שבוע שבו לא שיחק נספר כ-0.</p></div>
  <div class="card c7">
    <h2>כל ${D.draft.length} הבחירות</h2>
    <div id="chDraft"></div>
    <div class="legend-row"><span><i class="bx" style="background:${ucol(me)}"></i>הבחירות שלך</span><span><i class="bx" style="background:${GRAY}"></i>בחירות של אחרים</span><span><i class="ln" style="background:${GRAY}"></i>מה צפוי בכל שלב</span></div>
  </div>
  <div class="card c5"><h2>הדראפט שלך במבט אחד</h2>
    <div class="tiles t3">
      <div class="tile good"><span>פגיעות</span><b>${hits.length}</b><em>${hits.map(p => esc(p.n.split(" ").slice(-1)[0])).join(", ") || "—"}</em></div>
      <div class="tile"><span>סבירות</span><b>${myPicks.length - hits.length - misses.length}</b><em>בערך כמו המצופה</em></div>
      <div class="tile bad"><span>החטאות</span><b>${misses.length}</b><em>${misses.map(p => esc(p.n.split(" ").slice(-1)[0])).join(", ") || "—"}</em></div>
    </div>
    <div class="callout warn" style="margin-top:12px"><div>ב-<b>${altCount} מתוך ${myPicks.length}</b> הבחירות שלך, את החלופה הטובה יותר לקח <b>${esc(altUser)}</b> כמה בחירות אחריך: ${passed.slice(0, 5).map(esc).join(", ")}. והגניבה של הדראפט: <b>${esc(D.steal.n)}</b> בבחירה #${D.steal.no} של ${nm(D.steal.user)}, עם ${f1(D.steal.v)} לשבוע.</div></div></div>
  <div class="card c12"><h2>דו"ח הבחירות שלך</h2>
    <div class="report">
      <div class="rp rp-h"><span>בחירה</span><span>שחקן ומה נתן מול המצופה</span><span>לשבוע</span><span>במקומו היה זמין</span></div>
      <div class="rp rp-h rp-h2"><span>בחירה</span><span>שחקן ומה נתן מול המצופה</span><span>לשבוע</span><span>במקומו היה זמין</span></div>
      ${myPicks.map(p => { const m = p.alt.how.match(/#(\d+) ע"י (.+)$/); return `
      <div class="rp">
        <div class="rp-no"><b>#${p.no}</b><span>סיבוב ${p.rd}</span></div>
        <div class="rp-p">${avId(p.id, 32)}<div class="rp-m"><div class="rp-n"><span class="pname">${esc(p.n)}</span><span class="vp ${p.verdict}">${verdictTxt[p.verdict]}</span></div>
          <div class="bullet" title="הערך שלו מול מה שצפוי בשלב הזה"><i style="width:${(p.v / maxV * 100).toFixed(1)}%;background:${p.verdict === "miss" ? "var(--bad)" : p.verdict === "hit" ? "var(--good)" : "#8194b1"}"></i><b style="inset-inline-start:${(p.exp / maxV * 100).toFixed(1)}%"></b></div></div></div>
        <div class="rp-v"><b>${f1(p.v)}</b><span>צפוי ${f1(p.exp)}</span></div>
        <div class="rp-alt">${avId(p.alt.id, 26)}<div><b>${esc(p.alt.n)}</b> <span class="num">${f1(p.alt.v)}</span><span class="rp-how">${m ? `#${m[1]} · ${esc(m[2])}` : esc(p.alt.how)}</span></div></div>
      </div>`; }).join("")}
    </div>
    <p class="hint">הקו האנכי בפס = מה שצפוי בשלב הזה של הדראפט. "במקומו" = הכי טוב מבין 8 הבחירות הבאות של אחרים. הכל במבט לאחור.</p>
  </div>

  <div class="sec-h c12"><h2>השוק החופשי</h2><p>כמה מהפוטנציאל השבועי הגיע משחקנים מהדראפט, וכמה משחקנים שהוחתמו במהלך העונה.</p></div>
  <div class="card c4">
    <h2>מאיפה הגיע ההרכב של כל אחד</h2>
    <div class="hbars">${D.managers.map(m => `<div class="hb"><span class="who">${mdot(m.id)}${nm(m.id)}</span><div class="track"><i style="width:${(m.from_draft / Math.max(...D.managers.map(x => x.pool)) * 100).toFixed(1)}%;background:${ucol(m.id)}"></i><i style="width:${(m.from_waivers / Math.max(...D.managers.map(x => x.pool)) * 100).toFixed(1)}%;background:${ucol(m.id)};opacity:.45"></i></div><span class="v">${f1(m.pool)}</span></div>`).join("")}</div>
    <div class="legend-row"><span><i class="bx" style="background:#8194b1"></i>מהדראפט</span><span><i class="bx" style="background:#8194b1;opacity:.45"></i>מהשוק החופשי</span></div>
    <table class="std mini-std"><tr><th>מנג'ר</th><th>החתמות</th><th>סטרימים</th></tr>${D.managers.map(m => `<tr class="${m.id === me ? "me" : ""}"><td>${who(m.id)}</td><td class="num">${m.adds}</td><td class="num">${m.streams}</td></tr>`).join("")}</table>
  </div>
  <div class="card c4"><h2>שחררת מוקדם מדי</h2><div class="people" style="grid-template-columns:1fr">${drops.map(d => `
      <div class="person">${avId(d.id, 40)}<div class="meta"><b>${esc(d.n)}</b><span>${d.drafted ? "בחירת דראפט ששוחררה" : d.held != null ? `הוחזק ${daysTxt(d.held)}` : ""} · שוחרר בשבוע ${d.wk}${d.times > 1 ? ` · ${d.times} פעמים` : ""}</span></div><span class="num-big">${f1(d.v)}</span></div>`).join("")}</div>
      <p class="hint">המספר = מה שהשחקן נתן בשבוע מאז ששחררת אותו.</p></div>
    <div class="card c4"><h2>מציאות שאחרים הרימו</h2><div class="people" style="grid-template-columns:1fr">${D.gems.slice(0, 5).map(x => `
      <div class="person">${avId(x.id, 40)}<div class="meta"><b>${esc(x.n)}</b><span>${nm(x.by)} הרים בשבוע ${x.wk}</span></div><span class="num-big">${f1(x.v)}</span></div>`).join("")}</div>
      <p class="hint">המספר = מה שהשחקן נתן בשבוע מאז שהוחתם.</p></div>

  <div class="card c8">
    <h2>ההחלטות שלך: מה עבד ומה לא</h2>
    <div class="dec">
      <div class="yes"><h3><span class="ico">${CHECK}</span>עבד</h3><ul>
        <li><span class="ico">${CHECK}</span><span><b>${esc(myPicks[0].n)}</b> בבחירה ${myPicks[0].no}: ${f1(myPicks[0].v)} לשבוע, השחקן הכי מועיל בסגל שלך.</span></li>
        ${hits.length ? `<li><span class="ico">${CHECK}</span><span>${hits.map(p => `<b>${esc(p.n)}</b> ב-#${p.no} (${f1(p.v)} מול ${f1(p.exp)} צפוי)`).join(" ו-")}: בחירות מאוחרות שהחזירו הרבה מעבר למצופה.</span></li>` : ""}
        <li><span class="ico">${CHECK}</span><span>פעיל בשוק החופשי: <b>${mine.adds} החתמות</b> ו-${mine.streams} סטרימים. ב-Lock-in זה הכיוון הנכון.</span></li>
        <li><span class="ico">${CHECK}</span><span>בחירת הפותחים הייתה סבירה: ${f1(mine.lineup_gap)} נקודות בשבוע על הספסל, ממוצע הליגה ${f1(avgGap)}.</span></li>
      </ul></div>
      <div class="no"><h3><span class="ico">${CROSS}</span>לא עבד</h3><ul>
        ${misses.length ? `<li><span class="ico">${CROSS}</span><span>${misses.map(p => `<b>${esc(p.n)}</b> ב-#${p.no} (${f1(p.v)} מול ${f1(p.exp)} צפוי${p.wk < REG / 2 ? ", כמעט לא שיחק" : ""})`).join(", ")}.</span></li>` : ""}
        ${drops.length ? `<li><span class="ico">${CROSS}</span><span>שחרורים מהירים מדי: ${drops.slice(0, 3).map(d => `<b>${esc(d.n)}</b>${d.held != null ? ` אחרי ${daysTxt(d.held)}` : ""}${d.times > 1 ? " (פעמיים)" : ""}`).join(", ")}. ${esc(drops[0].n)} נתן אחר כך ${f1(drops[0].v)} לשבוע.</span></li>` : ""}
        <li><span class="ico">${CROSS}</span><span>נעלת ${pctS(mine.capture)} מהפוטנציאל, מול ${pctS(top.capture)} של ${nm(top.id)}. זה בערך <b>${f1(g.locks)} נקודות בשבוע</b>.</span></li>
        <li><span class="ico">${CROSS}</span><span>ויתרת על ${passed.slice(0, 4).map(esc).join(", ")}, ש-${esc(altUser)} לקח אחריך.</span></li>
      </ul></div>
    </div>
  </div>

  <div class="card c4">
    <h2>מה לוקחים לעונה הזאת</h2>
    <div class="lessons">${[
      ["target", "בוחרים לפי ערך שבועי ב-Lock-in", "מה שקובע זה המשחק הגבוה של השחקן, לא כמה משחקים הוא משחק."],
      ["shield", "לא בוחרים פצוע בסיבובים המוקדמים", "ואם כבר לקחת פצוע, הוא הולך ל-IR ולא משוחרר."],
      ["clock", "נותנים לשחקן שבוע–שבועיים", "במיוחד לגבוהים צעירים שהדקות שלהם עולות, כמו Clingan."],
      ["lock", "נועלים לפי הכלל", "3 משחקים נשארו: פי 1.14 מהממוצע. 2: פי 1.09. 1: כל משחק מעל הממוצע."],
    ].map(([ic, t, p]) => `<div class="ls"><span class="rb-ic">${ric(ic)}</span><h4>${t}</h4><p>${p}</p></div>`).join("")}</div>
  </div>
  <p class="hint c12">על הנתונים: המספרים בסולם של העונה שעברה, שבו הניקוד היה חצי מהעונה הזאת. אחרי שהעונה נסגרה, Sleeper חישב מחדש את הנקודות השבועיות שלה, וחלק מהנעילות מופיעות עכשיו כ-0. לכן כל מה שכאן מבוסס על הסיכומים הרשמיים של הטבלה ועל הפוטנציאל של ההרכבים, שלא נפגעו.</p>`;

  const wk = D.weekly;
  lineChart($("chWeekly"), {
    label: "פוטנציאל ההרכב שבוע אחרי שבוע", x: wk.map(r => r.w), h: 250,
    band: {lo: wk.map(r => r.lo), hi: wk.map(r => r.hi)},
    series: [{color: GRAY, w: 1.5, vals: wk.map(r => r.median)},
             {color: ucol(me), w: 2.5, vals: wk.map(r => r.pot[me]), marks: wk.map((r, i) => r.lo === r.pot[me] ? i : -1).filter(i => i >= 0)}],
    tip: i => { const r = wk[i]; return `<div class="t">שבוע ${r.w}${r.lo === r.pot[me] ? " · הכי נמוך בליגה" : ""}</div>` +
      tipRow(ucol(me), nm(me), f1(r.pot[me])) + tipRow(GRAY, "חציון", f1(r.median)) + tipRow(ucol(r.opp[me]), "היריב · " + nm(r.opp[me]), f1(r.pot[r.opp[me]])); }
  });
  const exp = D.draft.map(d => ({x: d.no, y: d.exp}));
  dotChart($("chDraft"), {
    label: "ערך לשבוע לפי מספר בחירה", xmin: 1, xmax: D.draft.length, h: 240,
    xticks: Array.from({length: Math.ceil(D.draft.length / n)}, (_, i) => i * n + 1),
    line: exp,
    pts: D.draft.map(d => ({x: d.no, y: d.v, hl: d.user === me, color: d.user === me ? ucol(me) : GRAY,
      tip: `<div class="t">#${d.no} · סיבוב ${d.rd} · ${nm(d.user)}</div>` + tipRow(d.user === me ? ucol(me) : GRAY, esc(d.n), f1(d.v)) + tipRow(GRAY, "צפוי בשלב הזה", f1(d.exp))}))
  });
}

// ---------- live league ----------
const LIVE_LEAGUE = new URLSearchParams(location.search).get("league") || "1411664354171969536";
const LIVE = {data: null, err: null, at: null, loading: false, timer: null};
const API = "https://api.sleeper.app/v1";

async function fetchLive(){
  if (LIVE.loading) return;
  LIVE.loading = true;
  try {
    const [state, lg, users, rosters] = await Promise.all([getJSON(`${API}/state/nba`), getJSON(`${API}/league/${LIVE_LEAGUE}`),
      getJSON(`${API}/league/${LIVE_LEAGUE}/users`), getJSON(`${API}/league/${LIVE_LEAGUE}/rosters`)]);
    const reg = lg.settings.playoff_week_start - 1;
    let week = 0;
    if (lg.status === "in_season" || lg.status === "post_season") week = state.league_season === lg.season ? (state.display_week || state.week) : (lg.settings.last_scored_leg || 0);
    if (lg.status === "complete") week = lg.settings.last_scored_leg || reg;
    const weeks = Array.from({length: Math.min(week, 26)}, (_, i) => i + 1);
    const matchups = await Promise.all(weeks.map(w => getJSON(`${API}/league/${LIVE_LEAGUE}/matchups/${w}`).catch(() => [])));
    const tx = week ? (await Promise.all([week, week - 1].filter(w => w >= 1).map(w => getJSON(`${API}/league/${LIVE_LEAGUE}/transactions/${w}`).catch(() => [])))).flat() : [];
    const draft = lg.draft_id ? await getJSON(`${API}/draft/${lg.draft_id}`).catch(() => null) : null;
    LIVE.data = {state, lg, users, rosters, week, reg, matchups, tx, draft};
    LIVE.at = Date.now(); LIVE.err = null;
  } catch (e) { LIVE.err = String(e.message || e); }
  LIVE.loading = false;
  if (S.tab === "live") renderLive();
}

function liveModel(L){
  const uname = id => { const u = L.users.find(x => x.user_id === id); return u ? ((u.metadata && u.metadata.team_name) || u.display_name) : "—"; };
  const teams = L.rosters.map(r => ({rid: r.roster_id, uid: r.owner_id, name: uname(r.owner_id),
    owner: (L.users.find(x => x.user_id === r.owner_id) || {}).display_name || "",
    wins: r.settings.wins || 0, losses: r.settings.losses || 0, ties: r.settings.ties || 0,
    players: (r.players || []).map(id => PMAP.get(id)).filter(Boolean), reserve: r.reserve || []}));
  const byRid = Object.fromEntries(teams.map(t => [t.rid, t]));
  const done = L.lg.status === "in_season" ? L.week - 1 : L.week;
  const regDone = Math.min(done, L.reg);
  const pts = {}, opp = {}, res = {};
  teams.forEach(t => { pts[t.rid] = []; opp[t.rid] = []; res[t.rid] = []; });
  L.matchups.forEach((ms, wi) => {
    const pair = {};
    ms.forEach(m => { if (pts[m.roster_id]) pts[m.roster_id][wi] = m.points || 0; (pair[m.matchup_id] = pair[m.matchup_id] || []).push(m.roster_id); });
    Object.values(pair).forEach(([a, b]) => { if (b == null) return; opp[a][wi] = b; opp[b][wi] = a;
      if (wi < regDone) { const pa = pts[a][wi], pb = pts[b][wi]; res[a][wi] = pa > pb ? "W" : pa < pb ? "L" : "T"; res[b][wi] = pb > pa ? "W" : pb < pa ? "L" : "T"; } });
  });
  teams.forEach(t => {
    const w = [...Array(regDone).keys()];
    t.pf = w.length ? mean(w.map(i => pts[t.rid][i] || 0)) : 0;
    t.pa = w.length ? mean(w.map(i => pts[opp[t.rid][i]] ? pts[opp[t.rid][i]][i] || 0 : 0)) : 0;
    let beat = 0;
    w.forEach(i => teams.forEach(o => { if (o.rid !== t.rid && (pts[t.rid][i] || 0) > (pts[o.rid][i] || 0)) beat++; }));
    t.allplay = w.length ? beat / (w.length * (teams.length - 1)) : 0;
    t.xwins = w.length ? beat / (teams.length - 1) : 0;
    t.luck = t.wins - t.xwins;
    const rs = res[t.rid].slice(0, regDone).filter(Boolean);
    let k = rs.length - 1, streak = "";
    if (k >= 0) { const c = rs[k]; let len = 0; while (k >= 0 && rs[k] === c) { len++; k--; } streak = (c === "W" ? "נ" : c === "L" ? "ה" : "ת") + len; }
    t.streak = streak;
    t.strength = lineup(t.players).startTotal;
  });
  teams.sort((a, b) => (b.wins - a.wins) || (b.pf - a.pf));
  teams.forEach((t, i) => t.rank = i + 1);
  return {teams, byRid, pts, opp, done, regDone};
}

const STATUS_TXT = {pre_draft: "לפני הדראפט", drafting: "הדראפט מתקיים עכשיו", in_season: "העונה בעיצומה", post_season: "פלייאוף", complete: "העונה הסתיימה"};
const SCORE_TXT = {pts: "נקודה", reb: "ריבאונד", ast: "אסיסט", stl: "חטיפה", blk: "חסימה", tpm: "שלשה", to: "איבוד", dd: "דאבל-דאבל", td: "טריפל-דאבל", bonus_pt_40p: "40+ נקודות", bonus_pt_50p: "50+ נקודות", bonus_ast_15p: "15+ אסיסטים", bonus_reb_20p: "20+ ריבאונדים", tf: "טכנית", ff: "פלגרנט"};

const DAY = 864e5;
// dates are calendar days: compute and print them in UTC so daylight-saving changes can't shift them
const fmtD = d => d.toLocaleDateString("he-IL", {day: "numeric", month: "numeric", timeZone: "UTC"});
function seasonStart(L){
  const sd = L.state.league_season === L.lg.season ? L.state.season_start_date : null;
  if (!sd) return null;
  const [y, m, d] = sd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
// Sleeper NBA weeks run Monday to Sunday from the opening week; later dates are approximate (All-Star break can stretch a week)
function weekStart(L, n){
  const s = seasonStart(L);
  if (!s) return null;
  const mon = new Date(s.getTime() - ((s.getUTCDay() + 6) % 7) * DAY);
  return new Date(mon.getTime() + (n - 1) * 7 * DAY);
}
function uAvatar(u, size){
  const name = u ? ((u.metadata && u.metadata.team_name) || u.display_name || "?") : "?";
  return `<span class="uav" style="width:${size}px;height:${size}px;--c:${ucol(u && u.user_id)}"><b>${esc(name.slice(0, 1).toUpperCase())}</b>${u && u.avatar ? `<img src="https://sleepercdn.com/avatars/thumbs/${esc(u.avatar)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>`;
}
const POS_GROUP = x => x === "C" ? "c" : ["SF", "PF", "F"].includes(x) ? "f" : ["PG", "SG", "G"].includes(x) ? "g" : "u";

function rivalTags(id){
  const D = window.SEASON;
  const m = D && D.managers.find(x => x.id === id);
  if (!m) return {line: "חדש בליגה · אין היסטוריה ב-Sleeper", tags: []};
  const tags = [], by = k => D.managers.reduce((a, b) => (b[k] > a[k] ? b : a));
  const regChamp = [...D.managers].sort((a, b) => (b.wins - a.wins) || (b.pf - a.pf))[0];
  if (m.place === 1) tags.push(["gold", "אלוף הפלייאוף 2025"]);
  if (regChamp.id === id) tags.push(["gold", "אלוף העונה הסדירה 2025"]);
  else if (by("pf").id === id) tags.push(["", "הכי הרבה נקודות בעונה הסדירה"]);
  if (by("adds").id === id) tags.push(["", `הכי פעיל בשוק החופשי (${m.adds})`]);
  else if (by("from_waivers").id === id) tags.push(["", "בנה את הסגל מהשוק החופשי"]);
  const hurt = D.draft.filter(d => d.user === id && d.wk < D.reg_weeks / 2).length;
  if (hurt >= 3) tags.push(["warn", `מהמר על פצועים: ${hurt} בחירות פספסו חצי עונה`]);
  if (m.place === D.managers.length) tags.push(["bad", "מקום אחרון ב-2025"]);
  return {line: `2025: מקום ${m.place} · <bdi>${m.wins}-${m.losses}</bdi> · ${f1(m.pf)} נק' לשבוע`, tags};
}

function renderLive(){
  const out = $("liveOut");
  clearInterval(LIVE.timer);
  LIVE.timer = setInterval(() => { if (S.tab === "live" && !document.hidden) fetchLive(); }, 60000);
  if (!LIVE.data) {
    out.innerHTML = LIVE.err ? `<div class="card empty-card c12"><p>לא הצלחתי למשוך נתונים מ-Sleeper (${esc(LIVE.err)}). בודקים חיבור לאינטרנט ולוחצים על רענון.</p><button class="btn" onclick="fetchLive()">רענון</button></div>`
      : `<div class="card empty-card c12"><p>טוען את הליגה מ-Sleeper…</p></div>`;
    fetchLive();
    return;
  }
  const L = LIVE.data, lg = L.lg, Mo = liveModel(L), me = Mo.teams.find(t => t.uid === MY_USER_ID);
  const reg = L.reg, pws = lg.settings.playoff_week_start, ptm = lg.settings.playoff_teams, tdl = lg.settings.trade_deadline;
  const order = ["pre_draft", "drafting", "in_season", "post_season", "complete"], si = order.indexOf(lg.status);
  const inSeason = si >= 2;
  const ago = Math.max(0, Math.round((Date.now() - LIVE.at) / 60000));
  const userOf = id => L.users.find(u => u.user_id === id);

  // ---------- timeline ----------
  const open = seasonStart(L), tdDate = weekStart(L, tdl + 1), poDate = weekStart(L, pws);
  const draftAt = L.draft && L.draft.start_time ? new Date(L.draft.start_time) : null;
  const ms = [
    {t: "הצטרפות", s: `${L.users.length} מתוך ${lg.total_rosters}`, done: L.users.length >= lg.total_rosters},
    {t: "דראפט", s: draftAt ? draftAt.toLocaleString("he-IL", {day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit"}) : "מועד לא נקבע", done: si >= 2},
    {t: "פתיחת העונה", s: open ? fmtD(open) : "", done: inSeason && L.week >= 1},
    {t: "דדליין טריידים", s: `סוף שבוע ${tdl}${tdDate ? ` · בערך ${fmtD(new Date(tdDate.getTime() - DAY))}` : ""}`, done: inSeason && L.week > tdl},
    {t: "פלייאוף", s: `שבוע ${pws}${poDate ? ` · בערך ${fmtD(poDate)}` : ""} · ${ptm} קבוצות`, done: si >= 3},
  ];
  const nowIdx = ms.findIndex(m => !m.done);
  const order6 = L.draft && L.draft.draft_order ? Object.entries(L.draft.draft_order).sort((a, b) => a[1] - b[1]) : null;
  const timeline = `<div class="card c${inSeason ? 12 : 8}"><div class="tl-head"><h2>${STATUS_TXT[lg.status] || esc(lg.status)}</h2><span class="live-meta">${esc(lg.name)} · עודכן ${ago ? `לפני ${ago} דק'` : "עכשיו"} <button class="btn" onclick="fetchLive()">רענון</button></span></div>
    <ol class="tl">${ms.map((m, i) => `<li class="${m.done ? "done" : i === nowIdx ? "now" : ""}"><span class="tl-dot">${m.done ? CHECK : ""}</span><b>${m.t}</b><span>${esc(m.s)}</span>${i === nowIdx ? `<em>אנחנו כאן</em>` : ""}</li>`).join("")}</ol>
    ${order6 ? `<h3>סדר הדראפט</h3><div class="d-order">${order6.map(([uid, slot]) => `<span class="${uid === MY_USER_ID ? "me" : ""}"><b>${slot}</b>${uAvatar(userOf(uid), 22)}${esc(((userOf(uid) || {}).metadata || {}).team_name || (userOf(uid) || {}).display_name || "")}</span>`).join("")}</div>`
      : si === 0 ? `<p class="hint" style="margin:10px 0 0">סדר הדראפט עוד לא נקבע. כשהקומישנר יקבע אותו, הוא יופיע כאן והמיקום שלך יתעדכן לבד בטאב "דראפט".</p>` : ""}</div>`;
  const today = new Date(), todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = open ? Math.round((open.getTime() - todayUTC) / DAY) : null;
  const big = inSeason
    ? `<div class="card c12 big-card in-season-banner"><span class="bc-k">השבוע בליגה</span><b class="bc-v">${Math.min(L.week, 99)}</b><span class="bc-s">${L.week <= reg ? `מתוך ${reg} בעונה הסדירה` : "פלייאוף"}</span><div class="bc-bar"><i style="width:${Math.min(100, Mo.regDone / reg * 100).toFixed(1)}%"></i></div><span class="bc-s2">עודכן ${ago ? `לפני ${ago} דק׳` : "עכשיו"}</span></div>`
    : `<div class="card c4 big-card"><span class="bc-k">לפתיחת העונה</span><b class="bc-v">${days != null && days > 0 ? days : "—"}</b><span class="bc-s">${days != null && days > 0 ? `ימים · ${fmtD(open)}` : ""}</span><span class="bc-s2">${draftAt ? `הדראפט ב-${fmtD(draftAt)}` : "מועד הדראפט עוד לא נקבע"}</span></div>`;

  if (inSeason) { out.innerHTML = leagueSeasonHtml(L, Mo, timeline); drawLeagueCharts(L, Mo); return; }
  let html = inSeason ? big : timeline + big;
  let summaryTiles = "";

  // ---------- in season ----------
  if (Mo.regDone > 0 && me) {
    const playoffLine = Mo.teams[ptm - 1];
    const gb = me.rank <= ptm ? null : playoffLine.wins - me.wins;
    const pfRank = [...Mo.teams].sort((a, b) => b.pf - a.pf).findIndex(t => t.rid === me.rid) + 1;
    summaryTiles = `<div class="tiles c12">
      <div class="tile ${me.rank <= ptm ? "good" : "bad"}"><span>מקום</span><b>${me.rank} מתוך ${Mo.teams.length}</b><em>${gb == null ? "בתוך הפלייאוף" : `${gb} ניצחונות מהפלייאוף`}</em></div>
      <div class="tile"><span>מאזן</span><b><bdi>${me.wins}-${me.losses}</bdi></b><em>${me.streak ? "רצף " + me.streak : ""}</em></div>
      <div class="tile"><span>נקודות לשבוע</span><b>${f1(me.pf)}</b><em>מקום ${pfRank} בליגה</em></div>
      <div class="tile ${me.luck < -0.9 ? "bad" : me.luck > 0.9 ? "good" : ""}"><span>מזל</span><b><bdi>${sgn(me.luck)}</bdi></b><em>ניצחונות מעל או מתחת לצפוי</em></div>
    </div>`;
  }
  if (inSeason && L.week >= 1 && L.matchups[L.week - 1] && L.matchups[L.week - 1].length) {
    const wi = L.week - 1, seen = new Set(), cards = [];
    Mo.teams.slice().sort((a, b) => (b.uid === MY_USER_ID) - (a.uid === MY_USER_ID)).forEach(t => {
      if (seen.has(t.rid)) return; const o = Mo.opp[t.rid][wi]; seen.add(t.rid); seen.add(o);
      if (o == null) return; const ot = Mo.byRid[o], pa = Mo.pts[t.rid][wi] || 0, pb = Mo.pts[o][wi] || 0, tot = (pa + pb) || 1;
      cards.push(`<div class="mc ${t.uid === MY_USER_ID || ot.uid === MY_USER_ID ? "me" : ""}">
        <div class="side ${pa > pb ? "lead" : ""}"><span class="who">${uAvatar(userOf(t.uid), 26)}${esc(t.name)}</span><b>${f1(pa)}</b></div>
        <div class="tug"><i style="width:${pa / tot * 100}%;background:${ucol(t.uid)}"></i><i style="width:${pb / tot * 100}%;background:${ucol(ot.uid)}"></i></div>
        <div class="side ${pb > pa ? "lead" : ""}"><span class="who">${uAvatar(userOf(ot.uid), 26)}${esc(ot.name)}</span><b>${f1(pb)}</b></div></div>`);
    });
    html += `<div class="card c12"><h2>שבוע ${L.week}${lg.status === "in_season" ? " · חי" : ""}</h2><div class="mu">${cards.join("")}</div><p class="hint">ב-Lock-in הנקודות עולות רק כשנועלים משחק, אז באמצע השבוע הפער עוד יכול להתהפך.</p></div>`;
  }
  html += summaryTiles;
  if (Mo.regDone > 0) {
    const maxPF = Math.max(...Mo.teams.map(t => t.pf)) || 1;
    html += `<div class="card c7"><h2>טבלת הליגה</h2><div class="tablewrap" style="border:0"><table class="std">
      <tr><th>#</th><th>קבוצה</th><th>מאזן</th><th>נק' לשבוע</th><th class="hide-sm hide-n">נגד</th><th title="אחוז הניצחונות אם היית משחק כל שבוע מול כולם">מול כולם</th><th class="hide-sm hide-n">רצף</th></tr>
      ${Mo.teams.map((t, i) => `<tr class="${t.uid === MY_USER_ID ? "me" : ""}${i === ptm ? " cut" : ""}"><td class="r">${t.rank}</td><td><span class="who">${uAvatar(userOf(t.uid), 22)}${esc(t.name)}</span></td><td class="num"><bdi>${t.wins}-${t.losses}</bdi></td><td class="num"><span class="dbar"><i style="width:${(t.pf / maxPF * 100).toFixed(1)}%;background:${ucol(t.uid)}"></i></span>${f1(t.pf)}</td><td class="num hide-sm hide-n">${f1(t.pa)}</td><td class="num">${pctS(t.allplay)}</td><td class="hide-sm hide-n">${t.streak}</td></tr>`).join("")}
    </table></div><p class="hint"><span class="cut-lbl">הקו הטורקיז</span> = קו הפלייאוף (${ptm} הראשונות).</p></div>
    <div class="card c5"><h2>נקודות בכל שבוע</h2><div id="chLive"></div>
      <div class="legend-row">${Mo.teams.map(t => `<span><i class="ln" style="background:${ucol(t.uid)}"></i>${esc(t.name)}</span>`).join("")}</div>
      <details class="tv"><summary>טבלת נתונים</summary><div class="tablewrap" style="border:0"><table class="std"><tr><th>שבוע</th>${Mo.teams.map(t => `<th>${esc(t.name)}</th>`).join("")}</tr>
      ${[...Array(Mo.regDone).keys()].map(i => `<tr><td>${i + 1}</td>${Mo.teams.map(t => `<td class="num">${f1(Mo.pts[t.rid][i] || 0)}</td>`).join("")}</tr>`).join("")}</table></div></details></div>`;
    const lk = [...Mo.teams].sort((a, b) => b.luck - a.luck), maxW = Math.max(1, ...Mo.teams.map(t => Math.max(t.wins, t.xwins)));
    html += `<div class="card c4"><h2>מזל</h2><p class="lead" style="margin-bottom:8px">הנקודה האפורה = כמה ניצחונות הנקודות הצדיקו. הנקודה הצבעונית = כמה ניצחונות היו בפועל.</p><div class="dumb">
      ${lk.map(t => { const a = t.xwins / maxW * 100, b = t.wins / maxW * 100; return `<div class="db-row ${t.uid === MY_USER_ID ? "me" : ""}"><span class="who">${uAvatar(userOf(t.uid), 20)}${esc(t.name)}</span><div class="db-t"><i class="db-l" style="right:${Math.min(a, b)}%;width:${Math.abs(b - a)}%;background:${t.luck >= 0 ? "var(--good)" : "var(--bad)"}"></i><i class="db-x" style="right:${a}%"></i><i class="db-w" style="right:${b}%;background:${ucol(t.uid)}"></i></div><b><bdi>${sgn(t.luck)}</bdi></b></div>`; }).join("")}
    </div></div>`;
  }
  const anyPlayers = Mo.teams.some(t => t.players.length);
  if (anyPlayers) {
    const pfz = Mo.teams.map(t => t.pf), maxS = Math.max(...Mo.teams.map(t => t.strength)) || 1;
    const norm = (v, arr) => { const lo = Math.min(...arr), hi = Math.max(...arr); return hi > lo ? (v - lo) / (hi - lo) : 0.5; };
    const power = Mo.teams.map(t => ({t, p: Mo.regDone ? 0.5 * norm(t.pf, pfz) + 0.3 * norm(t.strength, Mo.teams.map(x => x.strength)) + 0.2 * t.allplay : t.strength / maxS})).sort((a, b) => b.p - a.p);
    const span = Mo.regDone ? "c4" : "c6";
    html += `<div class="card ${span}"><h2>${Mo.regDone ? "דירוג כוח" : "כוח הסגלים אחרי הדראפט"}</h2><div class="hbars">
      ${power.map(({t, p}) => `<div class="hb"><span class="who">${uAvatar(userOf(t.uid), 20)}${esc(t.name)}</span><div class="track"><i style="width:${(p / power[0].p * 100).toFixed(1)}%;background:${ucol(t.uid)}"></i></div><span class="v">${Mo.regDone ? Math.round(p * 100) : f1(t.strength)}</span></div>`).join("")}</div>
      <p class="hint">${Mo.regDone ? "50% נקודות לשבוע, 30% כוח הסגל לפי המודל, 20% מאזן מול כולם." : "צפי שבועי של 9 הפותחים הכי טובים בכל סגל, לפי המודל."}</p></div>
      <div class="card ${span}"><h2>מהלכים אחרונים</h2>${feedHtml(L, Mo)}</div>`;
  }

  // ---------- pre-season: know the league ----------
  if (!Mo.regDone && !inSeason) {
    html += `<div class="sec-h c12"><h2>היריבים</h2><p>מה אנחנו יודעים על כל אחד מהעונה שעברה.</p></div>
      <div class="rivals c12">${L.users.map(u => { const r = rivalTags(u.user_id), mine = u.user_id === MY_USER_ID; return `
        <div class="rival ${mine ? "me" : ""}" style="--c:${ucol(u.user_id)}">
          <div class="rv-top">${uAvatar(u, 44)}<div><b>${esc((u.metadata && u.metadata.team_name) || u.display_name)}</b><span>${esc(u.display_name)}${mine ? " · אתה" : ""}</span></div></div>
          <p>${r.line}</p>
          <div class="rv-tags">${r.tags.map(([c, t]) => `<span class="rv-tag ${c}">${esc(t)}</span>`).join("")}</div>
        </div>`; }).join("")}</div>`;
    const sc = lg.scoring_settings || {}, keys = Object.keys(SCORE_TXT).filter(k => sc[k]).sort((a, b) => sc[b] - sc[a]);
    const smax = Math.max(...keys.map(k => Math.abs(sc[k]))) || 1;
    const rp = lg.roster_positions || [], starters = rp.filter(p => p !== "BN" && p !== "IR"), bench = rp.filter(p => p === "BN").length, ir = lg.settings.reserve_slots || 0;
    const ds = (L.draft && L.draft.settings) || {};
    html += `<div class="sec-h c12"><h2>הליגה במבט אחד</h2><p>החוקים שקובעים איך בונים קבוצה כאן.</p></div>
      <div class="card c5"><h2>מה שווה כל פעולה</h2><div class="dv">${keys.map(k => { const v = sc[k], w = (Math.abs(v) / smax * 50).toFixed(1); return `
        <div class="dv-row"><span>${SCORE_TXT[k]}</span><div class="dv-t"><i class="dv-mid"></i><i class="dv-b ${v < 0 ? "neg" : "pos"}" style="${v < 0 ? `left:50%` : `right:50%`};width:${w}%"></i></div><b><bdi>${v > 0 ? "+" : "−"}${Math.abs(v)}</bdi></b></div>`; }).join("")}</div>
        <p class="hint">ריבאונד שווה כמו 2 נקודות, וחטיפה או חסימה כמו 4. לכן גבוהים ושחקני הגנה שווים כאן יותר מקלעים.</p></div>
      <div class="stack c7"><div class="card"><h2>ההרכב</h2>
        <div class="lu lu-inline"><div><span class="lu-k">${starters.length} פותחים</span><div class="lu-row">${starters.map(p => `<span class="lu-s ${POS_GROUP(p)}">${p}</span>`).join("")}</div></div>
          <div><span class="lu-k">${bench} ספסל${ir ? ` · ${ir} IR` : ""}</span><div class="lu-row">${Array.from({length: bench}, () => `<span class="lu-s bn">BN</span>`).join("")}${ir ? `<span class="lu-s ir">IR</span>` : ""}</div></div></div>
        <p class="hint">G = PG או SG · F = SF או PF · UTIL = כל עמדה. ב-Lock-in כל פותח נותן משחק אחד בשבוע, וכל שחקן בספסל הוא עוד אפשרות לנעול.</p></div>
      <div class="card"><h2>חוקים</h2><div class="facts5">
        <div class="fx">${`<span class="rb-ic">${ric("lock")}</span>`}<span class="fx-k">מצב משחק</span><b>Lock-in</b><span class="fx-s">משחק אחד לכל שחקן בשבוע</span></div>
        <div class="fx"><span class="rb-ic">${ric("list")}</span><span class="fx-k">דראפט</span><b>${ds.rounds || rp.length} סיבובים · Snake</b><span class="fx-s">${Math.round((ds.pick_timer || 300) / 60)} דקות לבחירה</span></div>
        <div class="fx"><span class="rb-ic">${ric("users")}</span><span class="fx-k">שוק חופשי</span><b>${lg.settings.waiver_clear_days || 2} ימים ב-waivers</b><span class="fx-s">לשחקן ששוחרר</span></div>
        <div class="fx"><span class="rb-ic">${ric("swap")}</span><span class="fx-k">טריידים</span><b>עד שבוע ${tdl}</b><span class="fx-s">${lg.settings.pick_trading ? "מותר לסחור גם בבחירות" : "בלי סחר בבחירות"}</span></div>
        <div class="fx"><span class="rb-ic">${ric("trophy")}</span><span class="fx-k">פלייאוף</span><b>${ptm} קבוצות</b><span class="fx-s">משבוע ${pws}</span></div>
      </div></div></div>
      <p class="hint c12">מהשבוע הראשון יופיעו כאן: המצב שלך, תוצאות השבוע בזמן אמת, טבלה עם קו פלייאוף, גרף נקודות, מדד מזל, דירוג כוח ומהלכים אחרונים.${anyPlayers ? "" : " אחרי הדראפט יופיע גם כוח הסגלים לפי המודל."}</p>`;
  }
  if (inSeason) html += timeline;
  out.innerHTML = html;

  if (Mo.regDone > 0) {
    lineChart($("chLive"), {
      label: "נקודות בכל שבוע", x: [...Array(Mo.regDone).keys()].map(i => i + 1), h: 260,
      series: Mo.teams.slice().sort((a, b) => (a.uid === MY_USER_ID) - (b.uid === MY_USER_ID)).map(t => ({color: ucol(t.uid), w: t.uid === MY_USER_ID ? 2.75 : 1.75, op: t.uid === MY_USER_ID ? 1 : .85, vals: [...Array(Mo.regDone).keys()].map(i => Mo.pts[t.rid][i] || 0)})),
      tip: i => `<div class="t">שבוע ${i + 1}</div>` + Mo.teams.slice().sort((a, b) => (Mo.pts[b.rid][i] || 0) - (Mo.pts[a.rid][i] || 0)).map(t => tipRow(ucol(t.uid), esc(t.name), f1(Mo.pts[t.rid][i] || 0))).join("")
    });
  }
}

// ---------- the league in season: every matchup, the table, and any team's roster ----------
// Records and totals come from the league pull (LIVE); this week's projections, locks and games left from the season pull (SEA).
function selectTeam(rid){ LIVE.sel = rid; renderLive(); }
function leagueSeasonHtml(L, Mo, timeline){
  const lg = L.lg, reg = L.reg, ptm = lg.settings.playoff_teams, tdl = lg.settings.trade_deadline, pws = lg.settings.playoff_week_start;
  const userOf = id => L.users.find(u => u.user_id === id);
  const X = SEA.d ? seasonState() : null;
  if (!SEA.d) maybeFetchSeason();
  const TW = {};
  if (X && X.D && X.D.week === L.week) X.D.rosters.forEach(r => { TW[r.roster_id] = teamWeek(X.D, X.Wm, r); });
  const wi = L.week - 1, ago = Math.max(0, Math.round((Date.now() - LIVE.at) / 60000));
  const rosterOf = rid => L.rosters.find(r => r.roster_id === rid);
  const pf = rid => { const s = rosterOf(rid).settings; return (s.fpts || 0) + (s.fpts_decimal || 0) / 100; };
  const pa = rid => { const s = rosterOf(rid).settings; return (s.fpts_against || 0) + (s.fpts_against_decimal || 0) / 100; };
  const live = t => TW[t.rid] ? TW[t.rid].cur : ((Mo.pts[t.rid] || [])[wi] || 0);
  const table = [...Mo.teams].sort((a, b) => (b.wins - a.wins) || (pf(b.rid) - pf(a.rid)) || (live(b) - live(a)));
  const rank = {}; table.forEach((t, i) => { rank[t.rid] = i + 1; });
  const me = table.find(t => t.uid === MY_USER_ID), sel = Mo.byRid[LIVE.sel] || me || table[0];
  const recB = t => `<bdi dir="ltr">${t.wins}-${t.losses}${t.ties ? "-" + t.ties : ""}</bdi>`;
  const played = Mo.regDone > 0;

  // ---- where the season is ----
  const nRounds = Math.max(1, Math.ceil(Math.log2(ptm || 4))), total = pws - 1 + nRounds;
  const at = w => Math.min(100, Math.max(0, w / total * 100)).toFixed(1);
  const tdLeft = tdl - L.week, poLeft = pws - L.week;
  const strip = `<section class="panel b-season"><div class="ph"><h2>העונה</h2><span class="meta">עודכן ${ago ? `לפני ${ago} דק'` : "עכשיו"}</span>
      <span class="ph-act"><button class="btn sm" onclick="fetchLive();refreshAll()" title="הכל עכשיו, כולל פציעות">${ric("repeat")}רענון</button></span></div>
    <div class="ss-wk"><b class="fig">${Math.min(L.week, 99)}</b><span>${L.week <= reg ? `שבוע מתוך ${reg} בעונה הסדירה` : "פלייאוף"}</span></div>
    <div class="ls-track" role="img" aria-label="התקדמות העונה: שבוע ${L.week} מתוך ${total}"><div class="ls-bar"><i style="width:${at(L.week - 0.5)}%"></i></div>
      <span class="ls-m" style="inset-inline-start:${at(tdl)}%" title="דדליין טריידים: סוף שבוע ${tdl}"></span><span class="ls-m po" style="inset-inline-start:${at(pws - 1)}%" title="פלייאוף: משבוע ${pws}"></span></div>
    <dl class="ss-f"><div><dt><i class="ls-key"></i>דדליין טריידים</dt><dd>${tdLeft > 0 ? `עוד ${tdLeft} שבועות` : tdLeft === 0 ? "השבוע" : "עבר"}<small>שבוע ${tdl}</small></dd></div>
      <div><dt><i class="ls-key po"></i>פלייאוף</dt><dd>${poLeft > 0 ? `עוד ${poLeft} שבועות` : "עכשיו"}<small>שבוע ${pws} · ${ptm} קבוצות</small></dd></div></dl></section>`;

  // ---- this week's matchups ----
  const seen = new Set(), pairs = [];
  [...table].sort((a, b) => (b.uid === MY_USER_ID) - (a.uid === MY_USER_ID)).forEach(t => {
    if (seen.has(t.rid)) return; const o = (Mo.opp[t.rid] || [])[wi]; seen.add(t.rid);
    if (o == null || !Mo.byRid[o]) return; seen.add(o); pairs.push([t, Mo.byRid[o]]);
  });
  const mCard = ([a, b]) => {
    const wa = TW[a.rid], wb = TW[b.rid], la = live(a), lb = live(b), pw = wa && wb ? winP(wa, wb) : null;
    const share = pw != null ? pw : (la + lb ? la / (la + lb) : 0.5);
    const row = (t, w, x, y, p) => `<button class="lm-r ${x > y ? "lead" : ""} ${t.rid === sel.rid ? "sel" : ""}" onclick="selectTeam(${t.rid})">${uAvatar(userOf(t.uid), 34)}
      <span class="lm-n"><b>${esc(t.name)}</b><span>${recB(t)} · מקום ${rank[t.rid]}</span></span>
      <span class="lm-s"><b class="num" title="נעול (נעילות מזוהות)">${f1(x)}</b>${w ? `<span>צפי <span class="num">${f1(w.exp)}</span></span>` : ""}</span>
      ${p != null ? `<span class="lm-p num ${p >= 0.5 ? "good" : ""}">${Math.round(p * 100)}%</span>` : ""}</button>`;
    return `<section class="panel b-lm ${a.uid === MY_USER_ID || b.uid === MY_USER_ID ? "me" : ""}"><div class="ph"><h2>${a.uid === MY_USER_ID || b.uid === MY_USER_ID ? "המאץ' שלך" : "מאץ'"}</h2><span class="meta">נעול · צפי · סיכוי</span></div><div class="lm">
      ${row(a, wa, la, lb, pw)}${row(b, wb, lb, la, pw != null ? 1 - pw : null)}
      <div class="tug"><i style="width:${(share * 100).toFixed(1)}%;background:${ucol(a.uid)}"></i><i style="width:${((1 - share) * 100).toFixed(1)}%;background:${ucol(b.uid)}"></i></div>
      ${wa && wb ? `<div class="lm-f"><span>נעולים <b class="num">${wa.nLocked} : ${wb.nLocked}</b></span><span>משחקים שנשארו <b class="num">${wa.nLeft} : ${wb.nLeft}</b></span><span>היום <b class="num">${wa.nToday} : ${wb.nToday}</b></span></div>` : ""}</div></section>`;
  };
  const mus = pairs.map(mCard).join("");

  // ---- the table ----
  const line = table[ptm - 1];
  const gb = t => rank[t.rid] <= ptm || !line ? "" : ((line.wins - t.wins) + (t.losses - line.losses)) / 2;
  const maxPF = Math.max(1, ...table.map(t => pf(t.rid)));
  const std = `<section class="panel lgt"><div class="ph"><h2>טבלת הליגה</h2><span class="meta">${played ? `אחרי ${Mo.regDone} שבועות` : "עוד אין שבוע סגור: הסדר לפי הניקוד של השבוע"} · לחיצה על קבוצה מציגה את הסגל שלה</span></div>
    <div class="tablewrap"><table class="std dt">
    <thead><tr><th>#</th><th>קבוצה</th><th>מאזן</th><th title="סך הנקודות בעונה">בעד</th><th class="hide-sm" title="סך הנקודות נגד">נגד</th><th title="הניקוד הנעול של השבוע עד עכשיו (נעילות של קבוצות אחרות מזוהות רק אחרי משחק נוסף)">נעול</th><th class="hide-sm" title="צפי לסוף השבוע">צפי</th><th class="hide-sm">רצף</th>${played ? `<th class="hide-sm" title="ניצחונות מקו הפלייאוף">פער</th>` : ""}<th class="hide-sm" title="החתמות ושחרורים העונה">מהלכים</th></tr></thead>
    <tbody>${table.map((t, i) => { const w = TW[t.rid]; return `<tr class="${t.uid === MY_USER_ID ? "me" : ""} ${t.rid === sel.rid ? "sel" : ""} ${i === ptm ? "cut" : ""}" onclick="selectTeam(${t.rid})" tabindex="0" onkeydown="if(event.key==='Enter')selectTeam(${t.rid})">
      <td class="r">${rank[t.rid]}</td><td><span class="who">${uAvatar(userOf(t.uid), 24)}${esc(t.name)}</span></td><td class="num"><b>${recB(t)}</b></td>
      <td class="num">${played ? `<span class="dbar"><i style="width:${(pf(t.rid) / maxPF * 100).toFixed(1)}%;background:${ucol(t.uid)}"></i></span>${f1(pf(t.rid))}` : "—"}</td>
      <td class="num hide-sm">${played ? f1(pa(t.rid)) : "—"}</td><td class="num"><b>${f1(live(t))}</b></td><td class="num hide-sm">${w ? f1(w.exp) : "—"}</td>
      <td class="hide-sm">${t.streak || "—"}</td>${played ? `<td class="num hide-sm">${gb(t) === "" ? "" : gb(t)}</td>` : ""}<td class="num hide-sm">${rosterOf(t.rid).settings.total_moves || 0}</td></tr>`; }).join("")}</tbody></table></div>
    <p class="hint"><span class="cut-lbl">הקו</span> = קו הפלייאוף (${ptm} הראשונות). ${played ? "פער = כמה ניצחונות חסרים כדי להיכנס." : ""}</p></section>`;

  // ---- one team up close ----
  const w = TW[sel.rid], r = rosterOf(sel.rid), su = userOf(sel.uid);
  const oRid = (Mo.opp[sel.rid] || [])[wi], ot = oRid != null ? Mo.byRid[oRid] : null, ow = ot ? TW[ot.rid] : null;
  const status = x => x.locked ? `<span class="tag2 ok">נעול</span>` : isOut(x.inj) && x.lastFp == null ? `<span class="tag2 bad">${esc(injTxt(x.inj))}</span>`
    : x.left.length ? `<span class="tag2">${x.left.length} נשארו</span>` : x.g.length ? `<span class="tag2 bn">סיים</span>` : `<span class="tag2 bad">אין משחקים</span>`;
  const pRow = (x, slot) => `<div class="ti-r ${slot ? "" : "bn"}"><span class="pos ${slot ? posGroup(slot) : "bn"}">${slot || "BN"}</span>${av(x.p, 26)}
    <span class="ti-n">${pName(x)} ${injBadge(x.inj)}<small>${esc(x.team)}</small></span><b class="num ${x.locked ? "" : "prov"}" title="${x.locked ? "נעול" : "לא נעול: המשחק האחרון שלו"}">${x.pts != null ? f1(x.pts) : "—"}</b>${status(x)}</div>`;
  const moves = [...L.tx].filter(t => t.status === "complete" && (t.roster_ids || []).includes(sel.rid)).sort((a, b) => b.created - a.created).slice(0, 4);
  const pn = id => (PMAP.get(id) || pOf(id)).n;
  const ins = `<section class="panel ti"><div class="ti-sw" role="tablist" aria-label="בחירת קבוצה">${table.map(t => `<button role="tab" aria-selected="${t.rid === sel.rid}" class="${t.rid === sel.rid ? "on" : ""}" onclick="selectTeam(${t.rid})" title="${esc(t.name)}">${uAvatar(userOf(t.uid), 30)}</button>`).join("")}</div>
    <div class="ti-h">${uAvatar(su, 44)}<div><b>${esc(sel.name)}</b><span>${esc(sel.owner)}${sel.uid === MY_USER_ID ? " · אתה" : ""} · ${recB(sel)} · מקום ${rank[sel.rid]}</span></div>
      ${w ? `<div class="ti-k"><b class="num">${f1(w.cur)}</b><span>צפי ${f1(w.exp)}</span></div>` : ""}</div>
    ${ot ? `<p class="ti-vs">השבוע מול <b>${esc(ot.name)}</b> · <span class="num">${f1(live(sel))} : ${f1(live(ot))}</span>${w && ow ? ` · סיכוי <b class="num">${Math.round(winP(w, ow) * 100)}%</b> · נעולים ${w.nLocked}/${SLOTS.length}` : ""}</p>` : ""}
    ${w ? `<div class="ti-l">${w.st.map((x, i) => x ? pRow(x, SLOTS[i]) : `<div class="ti-r empty"><span class="pos ${posGroup(SLOTS[i])}">${SLOTS[i]}</span><span class="muted">ריק</span></div>`).join("")}
        <div class="ti-sep">ספסל${w.ir.length ? " ו-IR" : ""}</div>${w.bench.map(x => pRow(x, null)).join("")}${w.ir.map(x => pRow(x, "IR")).join("")}</div>`
      : `<p class="empty-note">טוען את השבוע מ-Sleeper…</p>`}
    <div class="ti-f"><span>כוח הסגל לפי המודל: <b class="num">${f1(sel.strength)}</b></span><span>מהלכים העונה: <b class="num">${r.settings.total_moves || 0}</b></span></div>
    ${moves.length ? `<div class="ti-mv">${moves.map(t => `<div><span class="muted">${new Date(t.created).toLocaleDateString("he-IL", {day: "numeric", month: "numeric"})}</span>${t.type === "trade" ? `<span class="tag trade">טרייד</span>` : ""}${Object.keys(t.adds || {}).filter(p => t.adds[p] === sel.rid).map(p => `<span class="good">+${esc(pn(p))}</span>`).join(" ")} ${Object.keys(t.drops || {}).filter(p => t.drops[p] === sel.rid).map(p => `<span class="muted">−${esc(pn(p))}</span>`).join(" ")}</div>`).join("")}</div>` : ""}</section>`;

  // ---- form, luck, power, moves ----
  const pfz = Mo.teams.map(t => t.pf), maxS = Math.max(...Mo.teams.map(t => t.strength)) || 1;
  const norm = (v, arr) => { const lo = Math.min(...arr), hi = Math.max(...arr); return hi > lo ? (v - lo) / (hi - lo) : 0.5; };
  const power = Mo.teams.map(t => ({t, p: played ? 0.5 * norm(t.pf, pfz) + 0.3 * norm(t.strength, Mo.teams.map(x => x.strength)) + 0.2 * t.allplay : t.strength / maxS})).sort((a, b) => b.p - a.p);
  const powerHtml = `<section class="panel"><div class="ph"><h2>${played ? "דירוג כוח" : "כוח הסגלים"}</h2><span class="meta">${played ? "50% נקודות, 30% כוח הסגל, 20% מול כולם" : "צפי שבועי של 9 הפותחים הכי טובים בכל סגל, לפי המודל"}</span></div><div class="hbars">
    ${power.map(({t, p}) => `<div class="hb"><span class="who">${uAvatar(userOf(t.uid), 20)}${esc(t.name)}</span><div class="track"><i style="width:${(p / power[0].p * 100).toFixed(1)}%;background:${ucol(t.uid)}"></i></div><span class="v">${played ? Math.round(p * 100) : f1(t.strength)}</span></div>`).join("")}</div></section>`;
  const feed = `<section class="panel"><div class="ph"><h2>מהלכים אחרונים</h2><span class="meta">כל הליגה, שבועיים אחרונים</span></div>${feedHtml(L, Mo)}</section>`;
  let charts = "";
  if (played) {
    const lk = [...Mo.teams].sort((a, b) => b.luck - a.luck), maxW = Math.max(1, ...Mo.teams.map(t => Math.max(t.wins, t.xwins)));
    charts = `<section class="panel"><div class="ph"><h2>נקודות בכל שבוע</h2></div><div id="chLive"></div>
      <div class="legend-row">${Mo.teams.map(t => `<span><i class="ln" style="background:${ucol(t.uid)}"></i>${esc(t.name)}</span>`).join("")}</div></section>
      <section class="panel"><div class="ph"><h2>מזל</h2></div><p class="hint" style="margin:0 0 10px">אפור = כמה ניצחונות הנקודות הצדיקו. צבעוני = כמה היו בפועל.</p><div class="dumb">
      ${lk.map(t => { const a = t.xwins / maxW * 100, b = t.wins / maxW * 100; return `<div class="db-row ${t.uid === MY_USER_ID ? "me" : ""}"><span class="who">${uAvatar(userOf(t.uid), 20)}${esc(t.name)}</span><div class="db-t"><i class="db-l" style="right:${Math.min(a, b)}%;width:${Math.abs(b - a)}%;background:${t.luck >= 0 ? "var(--good)" : "var(--bad)"}"></i><i class="db-x" style="right:${a}%"></i><i class="db-w" style="right:${b}%;background:${ucol(t.uid)}"></i></div><b><bdi>${sgn(t.luck)}</bdi></b></div>`; }).join("")}
      </div></section>`;
  }
  // moves per team this season: who works the market
  const mvT = [...table].sort((a, b) => (rosterOf(b.rid).settings.total_moves || 0) - (rosterOf(a.rid).settings.total_moves || 0));
  const mxM = Math.max(1, ...mvT.map(t => rosterOf(t.rid).settings.total_moves || 0));
  const movesHtml = `<section class="panel"><div class="ph"><h2>מהלכים לפי קבוצה</h2><span class="meta">החתמות ושחרורים העונה</span></div><div class="hbars">
    ${mvT.map(t => { const n = rosterOf(t.rid).settings.total_moves || 0; return `<div class="hb"><span class="who">${uAvatar(userOf(t.uid), 20)}${esc(t.name)}</span><div class="track"><i style="width:${Math.max(n ? 3 : 0, n / mxM * 100).toFixed(1)}%;background:${ucol(t.uid)}"></i></div><span class="v">${n}</span></div>`; }).join("")}</div>
    <p class="hint">ב-Lock-in שוק פעיל הוא עוד הזדמנויות לנעילה. מי שלמעלה עובד הכי הרבה על הסגל.</p></section>`;
  // three columns that end together: the table over the power ranking, the chosen roster, the market over the feed
  return `<div class="dgrid"><div class="row r${1 + pairs.length}">${strip}${mus}</div>
    <div class="row w543"><div class="stack">${std}${powerHtml}</div>${ins}<div class="stack">${movesHtml}${feed}</div></div>
    ${charts ? `<div class="row r2">${charts}</div>` : ""}</div>`;
}
function drawLeagueCharts(L, Mo){
  if (!(Mo.regDone > 0) || !$("chLive")) return;
  lineChart($("chLive"), {
    label: "נקודות בכל שבוע", x: [...Array(Mo.regDone).keys()].map(i => i + 1), h: 240,
    series: Mo.teams.slice().sort((a, b) => (a.uid === MY_USER_ID) - (b.uid === MY_USER_ID)).map(t => ({color: ucol(t.uid), w: t.uid === MY_USER_ID ? 2.75 : 1.75, op: t.uid === MY_USER_ID ? 1 : .85, vals: [...Array(Mo.regDone).keys()].map(i => Mo.pts[t.rid][i] || 0)})),
    tip: i => `<div class="t">שבוע ${i + 1}</div>` + Mo.teams.slice().sort((a, b) => (Mo.pts[b.rid][i] || 0) - (Mo.pts[a.rid][i] || 0)).map(t => tipRow(ucol(t.uid), esc(t.name), f1(Mo.pts[t.rid][i] || 0))).join("")
  });
}

function feedHtml(L, Mo){
  const items = [...L.tx].filter(t => t.status === "complete").sort((a, b) => b.created - a.created).slice(0, 8);
  if (!items.length) return `<p class="empty-note">עוד אין מהלכים${L.week ? " בשבועיים האחרונים" : ""}.</p>`;
  const pn = id => (PMAP.get(id) || {}).n || "שחקן";
  const tname = rid => { const t = Mo.byRid[rid]; return t ? `<span class="who">${mdot(t.uid)}${esc(t.name)}</span>` : ""; };
  return `<div class="feed">${items.map(t => {
    const adds = Object.entries(t.adds || {}), drops = Object.entries(t.drops || {});
    const when = new Date(t.created).toLocaleDateString("he-IL", {day: "numeric", month: "numeric"});
    if (t.type === "trade") return `<div class="fi"><span class="tag trade">טרייד</span><span>${t.roster_ids.map(tname).join(" ↔ ")}: ${adds.map(([p]) => esc(pn(p))).join(", ")}</span><span class="when">${when}</span></div>`;
    return `<div class="fi"><span class="tag ${adds.length ? "add" : "drop"}">${adds.length ? "הוסיף" : "שחרר"}</span><span>${tname((adds[0] || drops[0] || [])[1])} ${adds.map(([p]) => `+${esc(pn(p))}`).join(" ")} ${drops.map(([p]) => `<span class="muted">−${esc(pn(p))}</span>`).join(" ")}</span><span class="when">${when}</span></div>`;
  }).join("")}</div>`;
}

let resizeT;
window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (S.tab === "league") renderSeason(); if (S.tab === "live" && LIVE.data) renderLive(); }, 200); });
