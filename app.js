// Six Pack 26/27 · the new season screens (24.10.2026, design/*.html). Loaded by app.html after season.js and news.js:
// the functions here replace their renderers; the data and the rules stay theirs (seasonState, ALR, toggleLock...).
// Colours (Nati, 24.10): you are orange, everyone else graphite, lime = act now, red/amber = injuries only.
// Lists and tables you read line by line are paper (.paper, light); the live state stays dark.

const PF = id => `https://sleepercdn.com/content/nba/players/${id}.jpg`;     // the larger cut-out
const XI = {
  check: '<path d="M20 6 9 17l-5-5"/>', ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  star: '<path d="M12 3.6l2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.6l-5.1 2.7.97-5.68L3.75 9.6l5.7-.83z"/>',
  news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  tv: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="m17 2-5 5-5-5"/>',
};
const xi = (n, s) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${s ? ` style="width:${s}px;height:${s}px"` : ""}>${XI[n] || RI[n] || ""}</svg>`;
const hsI = (id, s = 32) => `<img class="hs" src="${img(id)}" alt="" loading="lazy" style="width:${s}px;height:${s}px" onerror="this.style.visibility='hidden'">`;
const tlI = (t, s) => t && t !== "FA" ? `<img class="tl" src="${logo(t)}" alt="${esc(t)}" loading="lazy"${s ? ` style="width:${s}px;height:${s}px"` : ""}>` : "";
const uAvSrc = (D, uid) => { const u = uOf(D, uid) || {}, m = u.metadata || {}; return m.avatar || (u.avatar ? `https://sleepercdn.com/avatars/thumbs/${u.avatar}` : ""); };
const uAvI = (D, uid, s) => `<img src="${uAvSrc(D, uid)}" alt="" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;background:#25252b" onerror="this.style.visibility='hidden'">`;
const nn = v => v == null ? `<span class="dim">·</span>` : f1(v);
const lastName = n => String(n || "").split(" ").slice(-1)[0];
const PAGE_T = {week: "השבוע שלי", fa: "שוק חופשי", live: "הליגה שלנו", news: "חדשות ועדכונים", draft: "דראפט", teams: "קבוצות", plan: "תכנון", league: "עונה שעברה"};
// the colour of a manager: you orange, the others one graphite family told apart by shade
const GRAPH = ["#8a93a1", "#6d7684", "#a9b0bb", "#5c6470", "#c3c8d0"];
function mgrCol(D, uid){
  if (uid === MY_USER_ID) return "#d95926";
  const others = D.rosters.map(r => r.owner_id).filter(u => u !== MY_USER_ID).sort();
  return GRAPH[Math.max(0, others.indexOf(uid)) % GRAPH.length];
}
function xGate(out){
  if (SEA.d && SEA.sch) return false;
  out.innerHTML = SEA.err ? `<section class="blk s12"><div class="bh"><h2>לא הצלחתי למשוך נתונים מ-Sleeper</h2></div><p class="mut">${esc(SEA.err)}. בודקים חיבור לאינטרנט ולוחצים על רענון.</p><button class="btn" onclick="refreshAll()">רענון</button></section>`
    : `<section class="blk s12"><p class="mut">מושך את השבוע מ-Sleeper</p></section>`;
  maybeFetchSeason();
  return true;
}
// minutes to a tip-off, as the countdown in the lime card
const cdTxt = t => { const m = Math.max(0, Math.round((t - Date.now()) / 60000)); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`; };
setInterval(() => document.querySelectorAll("[data-cd]").forEach(el => { el.textContent = cdTxt(+el.dataset.cd); }), 30e3);
// the family name, also for "Jaime Jaquez Jr."
const surname = n => { const p = String(n || "").split(" "); return p.length > 2 && /^(Jr\.?|Sr\.?|II|III|IV)$/.test(p[p.length - 1]) ? p[p.length - 2] : p[p.length - 1]; };

// ---------- an alert as a row: "מה לעשות עכשיו" and the bell's popover draw the same rows (24.10.2026) ----------
const AGRP = a => ({lock: ["נעילות", "lock"], lineup: ["הרכב", "swap"], injury: ["פציעות", "shield"], fa: ["שוק", "userplus"], news: ["עדכונים", "news"]}[a.kind] || ["עוד", "list"]);
// a lineup change carries its players in its id (season.js): swap|week|date|in,in>out,out
const swapIds = a => { const m = /^swap\|\d+\|[\d-]+\|([^>]*)>(.*)$/.exec(a.id); return m ? {ins: m[1].split(",").filter(Boolean), outs: m[2].split(",").filter(Boolean)} : null; };
function aActs(a, cls){
  return a.act.map(x => `<button class="btn ${x.primary ? cls : "g"}" onclick="${x.ack ? `ackAlert('${esc(a.id)}')` : esc(x.fn)}">${x.primary ? xi("check", 14) : ""}${esc(x.t)}</button>`).join("");
}
function aWho(a){
  if (a.pid) return `<span class="pa">${hsI(a.pid, 32)}${tlI(teamOf(a.pid))}</span>`;
  const sw = swapIds(a), slot = /^empty\|\d+\|(\d+)$/.exec(a.id);
  if (sw && sw.ins.length) return `<span class="pa stk">${sw.ins.slice(0, 2).map(id => hsI(id, 26)).join("")}</span>`;
  if (slot) return `<span class="ico slot n">${SLOTS[+slot[1]]}</span>`;
  return `<span class="ico" style="background:var(--s3);color:var(--tx2)">${xi(a.ic === "target" ? "alert" : a.ic, 16)}</span>`;
}
function aRow(a){
  const sw = swapIds(a), nm = ids => ids.map(id => esc(surname(pOf(id).n))).join(", ");
  const small = sw ? `להכניס ${nm(sw.ins)} במקום ${sw.outs.length ? nm(sw.outs) : "המשבצת הריקה"}` : strip(a.body);
  const soon = a.due && a.due.t - Date.now() < 3 * 3600e3;
  return `<div class="it">${aWho(a)}<div class="tx" title="${esc(strip(a.body))}"><b>${strip(a.title)}</b><small>${small}</small></div>
    ${a.due ? `<span class="dl ${soon ? "now" : ""}">${xi("clock")}${a.due.live ? "משחק עכשיו" : esc(a.due.txt)}</span>` : ""}${aActs(a, "lime")}</div>`;
}
function aGroups(list){
  const groups = [];
  list.forEach(a => { const [g, ic] = AGRP(a); let G = groups.find(x => x.g === g); if (!G) groups.push(G = {g, ic, list: []}); G.list.push(a); });
  return groups.map(G => `<div class="grp">${xi(G.ic)}${G.g}${G.list.length > 1 ? ` · ${G.list.length}` : ""}</div>${G.list.map(aRow).join("")}`).join("");
}

// ---------- the bell's popover: the same list as "מה לעשות עכשיו", on paper (design/sketches-settings.html #b) ----------
// The actions stay season.js's (ackAlert, clearAllAlerts, undoClearAll, toggleLock), and so does closing on an outside click.
function renderAlertsPop(){
  const list = openAlerts(), n1 = list.filter(a => a.pri === 1).length, n2 = list.filter(a => a.pri === 2).length;
  const perm = window.Notification ? Notification.permission : "";
  const nt = !perm ? "" : perm === "granted" && S.sound ? `<span class="dim">התראות דפדפן פעילות</span>`
    : perm === "denied" ? `<span class="dim">התראות הדפדפן חסומות</span>`
    : `<button class="lnk" type="button" onclick="enableNotifications()">${xi("bell", 13)}הפעלת התראות דפדפן</button>`;
  if (list.length) lastCleared = null;   // the undo is for the clear that just emptied the list
  const clr = list.length > 1 ? `<button class="btn" type="button" onclick="clearAllAlerts()">ניקוי הכל</button>`
    : lastCleared && lastCleared.length ? `<button class="btn" type="button" onclick="undoClearAll()">ביטול הניקוי</button>` : "";
  $("alertsPop").innerHTML = `<div class="paper apw">
    <div class="bh"><h2>התראות</h2><span class="meta">${list.length ? `${list.length} פתוחות` : "אין התראות פתוחות"}</span>${n1 ? `<span class="chip red">${n1} דחופים</span>` : ""}${n2 ? `<span class="chip amb">${n2} לבדוק</span>` : ""}<span class="sp"></span>${clr}<button class="x" type="button" aria-label="סגירה" onclick="closeAlertsPop()">${IC.x}</button></div>
    <div class="apl">${list.length ? aGroups(list) : `<p class="mut ape">${SEA.d ? "הכל מסודר. כשיהיה משחק לנעול, שינוי להרכב או החתמה ששווה לעשות, זה יופיע כאן." : "מושך את השבוע מ-Sleeper…"}</p>`}</div>
    <div class="apf">${inSeason() ? lockSyncChip().replace(' id="lockSync"', "") : ""}${nt}<span class="sp"></span><button class="lnk" type="button" onclick="closeAlertsPop();setTab('week')">למסך "השבוע שלי"</button></div></div>`;
}
// the phone's state is drawn in three places now: "מה לעשות עכשיו", the popover and the settings
paintLockSync = function(){
  document.querySelectorAll(".lsync").forEach(b => { b.outerHTML = lockSyncChip().replace(b.id ? "" : ' id="lockSync"', ""); });
  if ($("settings").open) paintSettings();
};

// ---------- the settings: the parts that change while it is open (design/sketches-settings.html #a) ----------
function paintSettings(){
  const st = LSYNC.topic ? LSYNC.state : "off";
  const [dot, txt] = {on: ["", "מחובר"], busy: ["busy", "מתחבר…"], bad: ["bad", "החיבור נפל · מנסה שוב"], off: ["off", "לא מחובר"]}[st];
  $("phoneState").innerHTML = `<span class="chip"><i class="sdot ${dot}"></i>${txt}</span>`;
  const q = (S.lockOut || []).length;
  $("phoneQ").textContent = q ? `${q === 1 ? "נעילה אחת מחכה" : `${q} נעילות מחכות`} לשליחה לטלפון` : "";
  const perm = window.Notification ? Notification.permission : "";
  $("permState").innerHTML = perm === "granted" ? `<span class="chip">מותרת</span>`
    : perm === "denied" ? `<span class="chip">חסומה</span><span class="dim">פותחים בסמל המנעול שליד הכתובת</span>`
    : perm === "default" ? `<button class="btn" type="button" onclick="enableNotifications().then(paintSettings)">לאפשר</button><span class="dim">הדפדפן ישאל פעם אחת</span>`
    : `<span class="dim">הדפדפן הזה לא שולח התראות</span>`;
  $("riskLbl").textContent = $("riskRange").value + "%";
  // the model's date from board.js ("2026-10-22 18:59", Israel time on the laptop that ran refresh_data.bat)
  const gen = (window.BOARD && BOARD.generated) || "", gd = gen ? new Date(gen.replace(" ", "T")) : null;
  const days = gd ? Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(gd).setHours(0, 0, 0, 0)) / 864e5) : 0;
  const ago = SEA.at ? Math.round((Date.now() - SEA.at) / 60000) : 0, D = SEA.d;
  const rows = [
    ["Sleeper", SEA.err ? `<i class="sdot bad"></i>${esc(SEA.err)}` : SEA.at ? `<i class="sdot"></i>עודכן ${ago ? `לפני ${ago} דק'` : "עכשיו"}<span class="dim">· כל 2 דקות, וכל 5 כשהדף ברקע</span>` : `<i class="sdot busy"></i>עוד לא נמשך`],
    ["המודל", gd ? `<span class="n">${gd.getDate()}.${gd.getMonth() + 1} ${gen.slice(11, 16)}</span><span class="dim">· ${days === 0 ? "היום" : days === 1 ? "אתמול" : `לפני ${days} ימים`} · מתעדכן ב-<span dir="ltr">refresh_data.bat</span></span>` : `<span class="dim">אין <span dir="ltr">board.js</span></span>`],
    ["שיטת הניקוד", !D ? `<span class="dim">·</span>` : scoringChanged(D.lg) ? `<i class="sdot busy"></i>השתנתה ב-Sleeper. מריצים <span dir="ltr">refresh_data.bat</span>` : "תואמת ל-Sleeper"]];
  $("dataRows").innerHTML = rows.map(([k, v]) => `<div class="kv"><span class="k2">${k}</span><span class="v">${v}</span></div>`).join("");
  $("draftSum").textContent = `מיקום ${S.mySlot || "—"} · ${S.names.length} קבוצות${S.draftId ? ` · Draft ID …${S.draftId.slice(-4)}` : ""}`;
}

// ---------- the top bar ----------
let weekDatesMemo = {key: "", dates: []};
function weekDates(D){
  const key = `${D.season}|${D.week}|${SEA.schAt}`;
  if (weekDatesMemo.key !== key) weekDatesMemo = {key, dates: [...new Set((SEA.sch ? SEA.sch.games : []).filter(g => g.week === D.week).map(g => g.date))].sort()};
  return weekDatesMemo.dates;
}
function seasonHeader(){
  const clock = $("clock"), chip = $("syncChip"), D = SEA.d;
  $("pgTitle").textContent = PAGE_T[S.tab] || "";
  $("bellBtn").hidden = false;
  clock.className = "clock";
  chip.title = "לחיצה מושכת הכל עכשיו, כולל פציעות";
  if (!D) { $("pgSub").textContent = "עונה 26/27"; clock.innerHTML = ""; chip.innerHTML = `<i class="sdot ${SEA.err ? "bad" : "busy"}"></i>${SEA.err ? "Sleeper: שגיאה" : "טוען מ-Sleeper"}`; return; }
  const ds = weekDates(D), today = todayUS();
  $("pgSub").textContent = `שבוע ${D.week}${ds.length ? ` · ${dLbl(ds[0])} עד ${dLbl(ds[ds.length - 1])}` : ""} · היום ${WD[dObj(today).getUTCDay()]}'`;
  const myR = rosterOfUser(D, MY_USER_ID), mp = myR && D.matchups.find(m => m.roster_id === myR.roster_id);
  const op = mp && D.matchups.find(m => m.matchup_id === mp.matchup_id && m.roster_id !== mp.roster_id);
  const oppUid = op && (D.rosters.find(r => r.roster_id === op.roster_id) || {}).owner_id;
  clock.innerHTML = op ? `${uAvI(D, MY_USER_ID, 24)}<span>${esc(tName(D, MY_USER_ID))}</span><b class="n me">${f1(mp.points || 0)}</b><span>:</span><b class="n op">${f1(op.points || 0)}</b><span>${esc(tName(D, oppUid))}</span>${uAvI(D, oppUid, 24)}${SEA.win != null ? `<span class="pc">${Math.round(SEA.win * 100)}%</span>` : ""}` : "";
  const ago = Math.round((Date.now() - SEA.at) / 60000);
  chip.innerHTML = `<i class="sdot ${SEA.loading ? "busy" : SEA.err ? "bad" : ""}"></i>${SEA.loading ? "מעדכן" : ago ? `עודכן לפני ${ago} דק'` : "עודכן עכשיו"}`;
}

// ---------- "השבוע שלי" ----------
function renderWeek(){
  const out = $("xWeek");
  startSeasonTimer();
  if (xGate(out)) return;
  const X = seasonState();
  if (!X || !X.myR) { out.innerHTML = `<section class="blk s12"><p class="mut">לא מצאתי את הקבוצה שלך בליגה הזאת.</p></section>`; return; }
  const {D, Wm, me, op, oppR, myR, plan} = X;
  SEA.win = op ? winP(me, op) : null;
  const all = [...me.st.filter(Boolean), ...me.bench];
  const oppAll = op ? [...op.st.filter(Boolean), ...op.bench] : [];
  const stIds = new Set(me.st.filter(Boolean).map(x => x.id)), insIds = new Set(plan.ins.map(x => x.id)), outIds = new Set(plan.outs.map(x => x.id));
  const today = Wm.today, dates = Wm.dates;
  const countedOn = x => x ? (x.locked ? x.lockedOn : x.lastDate) : null;
  const html = [];

  // ---- the scoreboard: your side orange, his graphite; the days as a box score ----
  if (op) {
    const pw = SEA.win, live = [...me.st, ...op.st].some(x => x && x.g.some(g => g.live));
    const dots = T => T.st.map((x, i) => `<i class="dt ${x && x.locked ? "on" : ""}" title="${SLOTS[i]}${x ? ` · ${esc(x.p.n)}${x.locked ? ` · נעול ${f1(x.pts || 0)}` : ""}` : ""}"></i>`).join("");
    const team = (T, R, uid, mine) => `<div class="tm${mine ? "" : " op"}">
        <div class="tmh">${mine ? uAvI(D, uid, 44) : ""}<div><b>${esc(tName(D, uid))}</b><small>${mine ? "אתה · " : ""}${recOf(R)} · מקום ${rankOf(D, R.roster_id)}</small></div>${mine ? "" : uAvI(D, uid, 44)}</div>
        <div class="big n" title="אם השבוע היה נגמר עכשיו: הנעולים ועוד המשחק האחרון של כל פותח">${f1(T.prov)}</div>
        <div class="row" style="gap:10px">${mine ? `<div class="dots">${dots(T)}</div><span class="lockd">נעול <b>${f1(T.cur)}</b></span>` : `<span class="lockd">נעול <b>${f1(T.cur)}</b></span><div class="dots">${dots(T)}</div>`}</div></div>`;
    const dayCell = (T, d) => {
      const pts = T.st.filter(x => x && countedOn(x) === d).reduce((a, x) => a + (x.pts || 0), 0);
      if (d >= today) { const n = T.st.filter(x => x && !x.locked && x.g.some(g => g.date === d && !g.done)).length;
        if (n) return `<td class="gm${d === today ? " td" : ""}">${pts ? `<span class="n">${f1(pts)}</span> · ` : ""}${n} משחקים</td>`; }
      return `<td class="${pts ? "n" : "z"}${d === today ? " td" : ""}">${pts ? f1(pts) : "·"}</td>`;
    };
    const qrow = (T, uid) => `<tr><td><span class="tn"><i style="background:${uid === MY_USER_ID ? "var(--me-hi)" : "var(--op-hi)"}"></i>${esc(tName(D, uid))}</span></td>${dates.map(d => dayCell(T, d)).join("")}<td class="n tot">${f1(T.prov)}</td></tr>`;
    html.push(`<section class="blk s6 sbd" aria-label="המאץ'"><div class="in">
      <div class="bh"><h2>המאץ'</h2><span class="meta">שבוע ${D.week} · אם השבוע היה נגמר עכשיו</span><span class="sp"></span>${live ? `<span class="chip live"><i></i>חי</span>` : ""}</div>
      <div class="sb">${team(me, myR, MY_USER_ID, true)}
        <div class="mid"><div class="n">${Math.round(pw * 100)}%</div><small>סיכוי לנצח</small><div class="split"><i style="width:${(pw * 100).toFixed(1)}%"></i></div>
          <small>צפי לסוף השבוע</small><div class="pj"><bdi>${f1(me.exp)}</bdi> : <bdi>${f1(op.exp)}</bdi></div></div>
        ${team(op, oppR, op.uid, false)}</div></div>
      <div class="tsc"><table class="qt"><thead><tr><th>מאיפה הנקודות</th>${dates.map(d => `<th class="${d === today ? "td" : ""}">${WD[dObj(d).getUTCDay()]}' ${dObj(d).getUTCDate()}${d === today ? " · היום" : ""}</th>`).join("")}<th>סה"כ</th></tr></thead>
      <tbody>${qrow(me, MY_USER_ID)}${qrow(op, op.uid)}</tbody></table></div></section>`);

    // ---- who leads at the end of each day (the current starters), and the projection ----
    const valAt = (x, d) => { if (!x) return 0; if (x.locked && x.lockedOn && x.lockedOn <= d) return x.pts || 0; const g = x.played.filter(y => y.date <= d); return g.length ? g[g.length - 1].fp : 0; };
    const leadAt = d => me.st.reduce((a, x) => a + valAt(x, d), 0) - op.st.reduce((a, x) => a + valAt(x, d), 0);
    const past = dates.filter(d => d < today), pj = me.exp - op.exp, last = dates[dates.length - 1];
    const vals = past.map(leadAt), maxA = Math.max(10, ...vals.map(Math.abs), Math.abs(pj)), sc = 64 / maxA;
    const W = 300, base = 80, colW = W / Math.max(dates.length, 1), bw = Math.min(30, colW - 12);
    let svg = `<line x1="0" y1="${base}" x2="${W}" y2="${base}" style="stroke:var(--ln)"/>`;
    dates.forEach((d, i) => {
      const x = W - (i + 1) * colW + (colW - bw) / 2, cx = x + bw / 2;
      if (d < today) { const v = vals[past.indexOf(d)], h = Math.max(1.5, Math.abs(v) * sc), up = v >= 0;
        svg += `<rect x="${x}" y="${up ? base - h : base}" width="${bw}" height="${h}" rx="3" style="fill:${up ? "var(--me)" : "var(--op)"}"/>`;
        svg += `<text x="${cx}" y="${up ? base - h - 5 : base + h + 13}" text-anchor="middle" style="fill:${up ? "#f6a27e" : "var(--op-hi)"};font:600 12px 'Barlow Condensed';direction:ltr">${v > 0 ? "+" : v < 0 ? "−" : ""}${f1(Math.abs(v))}</text>`; }
      else if (d === today) svg += `<rect x="${x - 5}" y="6" width="${bw + 10}" height="124" rx="6" style="fill:#c6f43212;stroke:#c6f43288"/><text x="${cx}" y="${base - 6}" text-anchor="middle" style="fill:var(--now);font:700 10px Heebo">היום</text>`;
      else if (d === last) { const h = Math.max(1.5, Math.abs(pj) * sc), up = pj >= 0;
        svg += `<rect x="${x}" y="${up ? base - h : base}" width="${bw}" height="${h}" rx="3" style="fill:#ffffff0d;stroke:var(--tx3);stroke-dasharray:4 3"/><text x="${cx}" y="${up ? base - h - 5 : base + h + 13}" text-anchor="middle" style="fill:var(--tx2);font:600 12px 'Barlow Condensed';direction:ltr">${pj >= 0 ? "+" : "−"}${f1(Math.abs(pj))}</text>`; }
      svg += `<text x="${cx}" y="152" text-anchor="middle" style="fill:${d === today ? "var(--now)" : "var(--tx3)"};font:600 11px Heebo">${WD[dObj(d).getUTCDay()]}'</text>`;
    });
    const lastV = vals.length ? vals[vals.length - 1] : null;
    html.push(`<section class="blk s3 lead" aria-label="מי מוביל"><div class="bh"><h2>מי מוביל</h2><span class="meta">בסוף כל יום</span></div>
      <svg viewBox="0 0 300 158" role="img" aria-label="ההפרש בסוף כל יום והצפי לסוף השבוע">${svg}</svg>
      <div class="foot">${lastV != null ? `<span class="n" dir="ltr" style="color:${lastV >= 0 ? "var(--me-hi)" : "var(--op-hi)"}">${lastV >= 0 ? "+" : "−"}${f1(Math.abs(lastV))}</span><span class="mut" style="font-size:12.5px">${lastV >= 0 ? "מוביל" : "מפגר"} אחרי ${WD[dObj(past[past.length - 1]).getUTCDay()]}'</span>` : `<span class="mut" style="font-size:12.5px">עוד אין משחקים השבוע</span>`}<span style="flex:1"></span><span class="n" dir="ltr" style="font-size:16px;color:var(--tx2)">${pj >= 0 ? "+" : "−"}${f1(Math.abs(pj))}</span><span class="dim" style="font-size:12px">בצפי</span></div>
      <div class="lg"><span><i style="background:var(--me)"></i>אתה מוביל</span><span><i style="background:var(--op)"></i>${esc(tName(D, op.uid))} מוביל</span><span><i style="border:1.5px dashed var(--tx3)"></i>צפי</span></div></section>`);
  } else html.push(`<section class="blk s6"><div class="bh"><h2>המאץ'</h2></div><p class="mut">אין מאץ'אפ לשבוע ${D.week} עדיין.</p></section><section class="blk s3"></section>`);

  // ---- the next thing to do (lime) and the queue ----
  const alerts = openAlerts(), first = alerts[0];
  if (first) {
    const due = first.due, slot = /^empty\|\d+\|(\d+)$/.exec(first.id);
    // the picture says what kind of thing it is (24.10.2026): his cut-out, two-in-two-out for a lineup change, the slot
    // for an empty one, a warning for the scoring. Until then an alert without one player left an empty corner.
    let art = first.pid ? pfr(first.pid, 150, 128, teamOf(first.pid), "lime") : "", txt = strip(first.body).slice(0, 120), cls = "";
    if (swapIds(first) && plan.ins.length) {
      const r1 = v => Math.round(v * 10) / 10;
      const why = x => !plan.tonight.has(x.id) ? (x.left.length ? `לא משחק ${plan.slate === today ? "היום" : `ב-${dLbl(plan.slate)}`}` : "סיים את השבוע") : isOut(x.inj) ? "בחוץ" : `צפי ${f1(x.exp)}`;
      const pp = (x, v) => `<div class="pp">${hsI(x.id, 34)}<span><b>${esc(surname(x.p.n))}</b><small>${v}</small></span></div>`;
      // the gain only when every number it adds up is on the card: each one out plays in that slate and isn't out
      const sure = plan.outs.length && plan.outs.every(x => plan.tonight.has(x.id) && !isOut(x.inj));
      const gain = plan.ins.reduce((s, x) => s + r1(plan.worth(x)), 0) - plan.outs.reduce((s, x) => s + r1(x.exp), 0);
      txt = `${sure ? `${sg(gain)} בצפי. ` : ""}משחק מהספסל לא נספר ואי אפשר לנעול אותו.`;
      art = `<div class="swp"><div class="col"><span class="k">נכנסים</span>${plan.ins.slice(0, 3).map(x => pp(x, `צפי ${f1(plan.worth(x))}`)).join("")}</div>
        <span class="k mid">במקום</span><div class="col out"><span class="k">לספסל</span>${plan.outs.length ? plan.outs.slice(0, 3).map(x => pp(x, why(x))).join("") : `<div class="pp"><span><b>משבצת ריקה</b></span></div>`}</div></div>`;
      cls = " sw";
    } else if (slot) { art = `<div class="nx-art slot n">${SLOTS[+slot[1]]}</div>`; cls = " sw"; }
    else if (!first.pid) { art = `<div class="nx-art ic">${xi("alert", 40)}</div>`; cls = " sw"; }
    html.push(`<section class="blk s3 nx${cls}" aria-label="הדבר הבא"><div class="bh"><h2>הדבר הבא</h2><span class="sp"></span>${alerts.length > 1 ? `<a href="#q" onclick="document.getElementById('q').scrollIntoView({behavior:'smooth',block:'center'});return false">ועוד ${alerts.length - 1} בתור</a>` : ""}</div>
      <h3>${strip(first.title)}</h3><p>${txt}</p>
      ${(h => first.pid && !cls ? `<div class="nx-row">${art}${h}</div>` : `${art}${h}`)(`<div class="when">${due ? `<div><div class="k">${due.live ? "המשחק כבר התחיל" : "עד"}</div><div class="due n">${esc(due.txt)}</div></div>${!due.live && due.t > Date.now() ? `<div><div class="k">עוד</div><div class="cd n" data-cd="${due.t}">${cdTxt(due.t)}</div></div>` : ""}` : ""}</div>`)}
      <div class="acts">${aActs(first, "")}<a class="btn g" href="${SLEEPER_URL}" target="_blank" rel="noopener">Sleeper${xi("ext", 12)}</a></div></section>`);
  } else {
    const T = ALR.tonight, r0 = T && T.rows.find(r => r.tip);
    html.push(`<section class="blk s3 nx" aria-label="הדבר הבא"><div class="bh"><h2>הדבר הבא</h2></div><h3>הכל מסודר</h3>
      <p>${T ? `אין מה לנעול או להחליף כרגע. ${T.rows.length} שחקנים שלך משחקים ב-${dLbl(T.day)}.` : "אין לך עוד משחקים השבוע."}</p>
      ${r0 ? `<img class="cut" src="${PF(r0.x.id)}" alt="" onerror="this.remove()"><div class="when"><div><div class="k">המשחק הבא</div><div class="due n">${ilTime(r0.tip.t, false)}</div></div><div><div class="k">עוד</div><div class="cd n" data-cd="${r0.tip.t}">${cdTxt(r0.tip.t)}</div></div></div>` : ""}</section>`);
  }
  const n1 = alerts.filter(a => a.pri === 1).length, n2 = alerts.filter(a => a.pri === 2).length;
  html.push(`<section class="blk s5 paper" id="q" aria-label="מה לעשות עכשיו"><div class="bh"><h2>מה לעשות עכשיו</h2>${n1 ? `<span class="chip red">${n1} דחופים</span>` : ""}${n2 ? `<span class="chip amb">${n2} לבדוק</span>` : ""}<span class="sp"></span>${lockSyncChip()}</div>
    ${alerts.length > 1 ? aGroups(alerts.slice(1)) : `<p class="mut" style="margin:6px 0 0">${first ? "מעבר לדבר הבא אין עוד משימות." : "אין משימות פתוחות."}</p>`}</section>`);

  // ---- tonight: the next game day, by game, Israel time ----
  const T = ALR.tonight;
  if (T) {
    const idx = dates.indexOf(T.day), boxes = dates.slice(Math.max(0, idx - 1), idx + 3);
    const cnt = (list, d) => list.filter(x => x.g.some(g => g.date === d)).length;
    const nextW = SEA.sch.games.filter(g => g.week === D.week + 1).map(g => g.date).sort()[0];
    const games = {};
    const add = (x, mine) => { const g = x.g.find(y => y.date === T.day && !y.done); if (!g) return;
      const home = g.home ? x.team : g.opp, away = g.home ? g.opp : x.team, k = away + "@" + home;
      const G = games[k] || (games[k] = {away, home, tip: tipOf(x.team, T.day), me: [], op: []}); (mine ? G.me : G.op).push(x); };
    all.forEach(x => add(x, true)); oppAll.forEach(x => add(x, false));
    const note = x => x.locked ? `נעול על ${f1(x.pts || 0)}` : outIds.has(x.id) ? "לספסל הלילה" : insIds.has(x.id) ? "בספסל עכשיו · להכניס להלילה" : !stIds.has(x.id) ? "בספסל · לא נספר"
      : isOut(x.inj) ? injTxt(x.inj) : x.act === "lock" ? `לנעול לפני המשחק · ${f1(x.lastFp)}` : x.left.length >= 2 ? `אחרי המשחק: לנעול מעל ${f1(x.V[x.left.length - 1])}` : "המשחק האחרון שלו: הוא נספר";
    const rows = Object.values(games).sort((a, b) => ((a.tip ? a.tip.t : 9e15) - (b.tip ? b.tip.t : 9e15)) || (b.me.length - a.me.length));
    const myOn = T.rows.filter(r => r.start).length, opOn = op ? op.st.filter(x => x && x.g.some(g => g.date === T.day && !g.done)).length : 0;
    html.push(`<section class="blk s4" aria-label="הלילה"><div class="bh"><h2>${T.day === today ? "הלילה" : `המשחקים הבאים · ${dLbl(T.day)}`}</h2><span class="meta">שעון ישראל</span><span class="sp"></span><span class="meta">אצלך ${myOn} בהרכב · אצלו ${opOn}</span></div>
      <div class="days">${boxes.map(d => `<div class="day ${d === T.day ? "on" : ""}">${WD[dObj(d).getUTCDay()]}'<b>${dObj(d).getUTCDate()}</b><em>${cnt(all, d)} · ${cnt(oppAll, d)}</em></div>`).join("")}${boxes.length < 4 && nextW ? `<div class="day">${WD[dObj(nextW).getUTCDay()]}'<b>${dObj(nextW).getUTCDate()}</b><em>שבוע ${D.week + 1}</em></div>` : ""}</div>
      ${rows.map(G => `<div class="gr${G.me.length ? "" : " past"}"><span class="t n">${G.tip ? (G.tip.state === "in" ? "חי" : ilTime(G.tip.t, false)) : "·"}</span>
        <span class="tm2">${tlI(G.away)}<em>@</em>${tlI(G.home)}</span>
        <div class="who">${G.me.length ? `${hsI(G.me[0].id, 22)}<div style="min-width:0"><b>${G.me.map(x => esc(G.me.length > 1 ? lastName(x.p.n) : x.p.n)).join(" · ")}</b><small>${[...new Set(G.me.map(note))].map(esc).join(" · ")}</small></div>` : `<small class="dim" style="font-size:11px">אין לך שחקנים במשחק</small>`}</div>
        <div class="opp">${G.op.map(x => hsI(x.id, 20)).join("")}</div></div>`).join("")}</section>`);
  } else html.push(`<section class="blk s4" aria-label="הלילה"><div class="bh"><h2>הלילה</h2></div><p class="mut">אין לך עוד משחקים השבוע.</p></section>`);

  // ---- head to head: the projection of each slot ----
  if (op) {
    const mx = Math.max(1, ...SLOTS.map((_, i) => Math.max(me.st[i] ? me.st[i].exp : 0, op.st[i] ? op.st[i].exp : 0)));
    let wins = 0;
    const rows = SLOTS.map((s, i) => { const a = me.st[i] ? me.st[i].exp : 0, b = op.st[i] ? op.st[i].exp : 0; if (a > b) wins++;
      return `<div class="hh" title="${esc(me.st[i] ? me.st[i].p.n : "ריק")} מול ${esc(op.st[i] ? op.st[i].p.n : "ריק")}"><span class="v ${a > b ? "w" : "lo"}">${f1(a)}</span><span class="l"><i style="width:${(a / mx * 100).toFixed(1)}%"></i></span><span class="sl">${s}</span><span class="r"><i style="width:${(b / mx * 100).toFixed(1)}%"></i></span><span class="v ${b > a ? "w" : "lo"}">${f1(b)}</span></div>`; }).join("");
    const d = me.exp - op.exp;
    html.push(`<section class="blk s3" aria-label="ראש בראש"><div class="bh"><h2>ראש בראש</h2><span class="meta">צפי לכל משבצת</span></div>
      <div class="hh hd"><span style="text-align:center">אתה</span><span></span><span></span><span></span><span style="text-align:center">${esc(lastName(tName(D, op.uid)))}</span></div>${rows}
      <div class="hsum"><span class="n" style="color:${d >= 0 ? "var(--me-hi)" : "var(--op-hi)"}">${d >= 0 ? "+" : "−"}${f1(Math.abs(d))}</span><span>${d >= 0 ? "לטובתך" : "לטובתו"} · ${d >= 0 ? "מנצח" : "מנצח רק"} ב-${wins} משבצות מתוך ${SLOTS.length}</span></div></section>`);
  }

  // ---- the lock board ----
  const F = S.wkF || "all";
  const cnt2 = (list, d) => list.filter(x => x.g.some(g => g.date === d)).length;
  const ACT = x => {
    const bench = !stIds.has(x.id);
    if (bench) return insIds.has(x.id) ? ["in", "להכניס הלילה"] : x.left.length ? ["off", "ספסל"] : ["off", "סיים את השבוע"];
    if (x.locked) return ["done", `${xi("lock", 12)}נעול`];
    if (x.pending) return ["lock", "נעלתי?"];     // Sleeper counts an earlier game of his and nothing here confirms it yet
    if (outIds.has(x.id)) return ["out", "לספסל הלילה"];
    return {lock: ["lock", "לנעול"], wait: ["wait", "לחכות"], ahead: ["wait", "עוד לא שיחק"], final: ["off", "סיים את השבוע"], nogames: ["out", "אין משחקים"], out: ["out", "פצוע"]}[x.act] || ["off", ""];
  };
  const cell = (x, d) => {
    const g = x.g.find(y => y.date === d), td = d === today ? "td" : "";
    if (!g) return `<td class="${td}"></td>`;
    const opp = `${g.home ? "" : "@"}${g.opp}`;
    if (g.done && g.fp != null) {
      const cls = x.lockedOn === d ? "k" : (x.pending && x.pending.date === d) || (!x.locked && d !== x.lastDate && x.uncertain && x.uncertain.some(v => Math.abs(v - g.fp) < 0.05)) ? "pk" : countedOn(x) === d && !x.locked ? (stIds.has(x.id) ? "av" : "bn") : "";
      // Every scored game is selectable, including the latest when an earlier API score is pending.
      if (stIds.has(x.id) && x.played.length >= 1)
        return `<td class="${td}"><button type="button" class="sc ${cls} pick" onclick="toggleLock('${x.id}','${d}')" title="${x.lockedOn === d ? `נעול על המשחק הזה (${esc(opp)}). לחיצה מבטלת` : `${esc(opp)} · ${cls === "pk" ? "Sleeper החזיר את הציון הזה. " : ""}לחיצה: נעלתי על המשחק הזה`}">${f1(g.fp)}</button></td>`;
      return `<td class="${td}"><span class="sc ${cls}" title="${esc(opp)}">${f1(g.fp)}</span></td>`;
    }
    if (g.done) return `<td class="${td}"><span class="dim" style="font-size:11px">לא שיחק</span></td>`;
    return `<td class="${td}"><span class="up${d === today ? " now" : ""}">${tlI(g.opp)}${esc(opp)}</span></td>`;
  };
  const brow = (x, slot) => {
    const [cls, txt] = ACT(x), bench = !stIds.has(x.id);
    const bar = !bench && !x.locked && x.lastFp != null && x.thr ? x.thr : !bench && !x.locked ? x.thrNext : null;
    const pts = bench ? null : x.pts;
    const scale = Math.max(45, x.V[3] * 1.4);
    const bul = x.locked ? `<div class="bul"><i class="ok" style="width:${Math.min((x.pts || 0) / scale, 1) * 100}%"></i></div>`
      : pts != null && bar ? `<div class="bul"><i class="${pts >= bar ? "ok" : ""}" style="width:${Math.min(pts / scale, 1) * 100}%"></i><u style="right:${Math.min(bar / scale, 1) * 100}%"></u></div>` : "";
    const flag = x.inj ? `<span class="q">${esc(injTxt(x.inj))}</span>` : "";
    const btn = cls === "lock" || cls === "done" ? `<button class="act ${cls}" onclick="toggleLock('${x.id}')" title="${x.pending ? `Sleeper מראה ${f1(x.pending.fp)} מהמשחק ב-${dLbl(x.pending.date)}. אם נעלת אותו, לחיצה מאשרת` : cls === "lock" ? "לחיצה מסמנת שנעלת ב-Sleeper" : "לחיצה מבטלת את הסימון"}">${txt}</button>` : `<span class="act ${cls}">${txt}</span>`;
    return `<tr><td><div class="pl"><span class="sl${slot === "BN" || slot === "IR" ? " BN" : ""}">${slot}</span>${hsI(x.id, 26)}<b>${pName(x)}</b>${tlI(x.team)}${flag}</div></td>
      ${dates.map(d => cell(x, d)).join("")}<td class="num pj">${f1(x.m)}</td><td class="num b">${nn(pts)}</td><td class="num pj">${nn(x.locked ? null : bar)}</td><td>${bul}</td><td>${btn}</td></tr>`;
  };
  const stRows = me.st.map((x, i) => x ? brow(x, SLOTS[i]) : "").join(""), bnRows = me.bench.map(x => brow(x, "BN")).join(""), irRows = me.ir.map(x => brow(x, "IR")).join("");
  const cols = dates.length + 6;
  html.push(`<section class="blk s12 paper" aria-label="הלוח של השבוע" style="padding-bottom:6px">
    <div class="bh"><h2>הלוח של השבוע</h2><span class="meta">כל משחק, מה נספר, והרף לנעילה · נעלת על ציון ישן? לחיצה עליו מסמנת</span><span class="sp"></span>
      <div class="lgd"><span><span class="sc k" style="min-width:26px;line-height:16px;font-size:11px">40</span>נעול</span><span><span class="sc av" style="min-width:26px;line-height:16px;font-size:11px">21</span>נספר עכשיו, אפשר לנעול</span><span><span class="up" style="line-height:15px">TOR</span>משחק שיבוא</span><span><i style="display:inline-block;width:2px;height:12px;background:var(--tx2)"></i>רף</span></div>
      <div class="seg" style="margin-inline-start:12px">${[["all", "הכל"], ["st", "פותחים"], ["bn", "ספסל"]].map(([k, t]) => `<button class="${F === k ? "on" : ""}" onclick="S.wkF='${k}';save();renderWeek()">${t}</button>`).join("")}</div></div>
    <div class="tsc"><table class="tb"><thead><tr><th style="width:270px">שחקן</th>${dates.map(d => `<th class="${d === today ? "td" : ""}">${dLbl(d)}<b>${cnt2(all, d)} · ${cnt2(oppAll, d)}${d === today ? " · היום" : ""}</b></th>`).join("")}<th>למשחק</th><th>נספר</th><th>רף</th><th style="width:120px">נספר מול הרף</th><th style="width:104px">מה לעשות</th></tr></thead>
    <tbody>${F !== "bn" ? stRows : ""}${F !== "st" ? `<tr class="sec"><td colspan="${cols}">ספסל · ${me.bench.length}</td></tr>${bnRows}${irRows ? `<tr class="sec"><td colspan="${cols}">IR</td></tr>${irRows}` : ""}` : ""}</tbody></table></div></section>`);

  // ---- bottom row: your best game, swaps, injuries, the league this week ----
  let best = null;
  me.st.forEach(x => x && x.played.forEach(g => { if (!best || g.fp > best.g.fp) best = {x, g}; }));
  html.push(best ? `<section class="blk s3 hot" aria-label="היד החמה"><div class="bh"><h2>היד החמה</h2><span class="meta">המשחק הכי טוב שלך השבוע</span></div>
      <span class="acc"></span><div class="nm">${esc(best.x.p.n)}</div>
      <small>${esc(best.x.team)} · ${dLbl(best.g.date)} ${best.g.home ? "מול" : "ב-"}${esc(best.g.opp)} · ${best.x.lockedOn === best.g.date ? "נעול" : countedOn(best.x) === best.g.date ? "נספר עכשיו" : "לא נספר"}</small>
      <div class="hot-row">${pfr(best.x.id, 132, 112, best.x.team)}<div><div class="val n">${f1(best.g.fp)}</div><small>הממוצע שלו ${f1(best.x.m)} · <bdi dir="ltr">+${f1(best.g.fp - best.x.m)}</bdi> מעליו</small></div></div></section>`
    : `<section class="blk s3 hot" aria-label="היד החמה"><div class="bh"><h2>היד החמה</h2></div><p class="mut">עוד אין משחקים השבוע.</p></section>`);
  const sw = bestSwaps(X, 4), mxg = Math.max(1, ...sw.map(s => s.g));
  html.push(`<section class="blk s3 paper" aria-label="החלפות בשוק"><div class="bh"><h2>החלפות בשוק</h2><span class="meta">כל הסגל, עם העמדות</span><span class="sp"></span><a href="#" onclick="setTab('fa');return false">לכל השוק</a></div>
    ${sw.length ? sw.map(s => `<div class="fa">${tlI(s.c.team, 22)}<div class="tx"><b>${nameLink(s.c.p)}</b><small>${esc(s.c.team)} · ${(s.c.p.pos || []).join("/")} · במקום ${esc(s.d.p.n)}</small></div><span class="bar" style="width:64px"><i style="width:${(s.g / mxg * 100).toFixed(0)}%;background:var(--good-tx)"></i></span><span class="gain">+${f1(s.g)}</span></div>`).join("")
      : `<p class="mut">אין כרגע החלפה ששווה יותר מרבע נקודה לשבוע.</p>`}</section>`);
  const injRows = [...[...me.st, ...me.bench, ...me.ir].filter(Boolean).map(x => [x, true]), ...(op ? [...op.st, ...op.bench, ...op.ir].filter(Boolean).map(x => [x, false]) : [])].filter(([x]) => x.inj);
  const where = (x, mine) => { const T2 = mine ? me : op, i = T2.st.indexOf(x);
    return `${i >= 0 ? `${mine ? "בהרכב שלך" : "בהרכב שלו"} (${SLOTS[i]})` : T2.ir.includes(x) ? "IR" : "ספסל"}${x.locked ? ` · נעול ${f1(x.pts || 0)}` : ""} · ${esc(x.team)}`; };
  const myInj = injRows.filter(r => r[1]).length;
  html.push(`<section class="blk s3 paper" aria-label="פציעות"><div class="bh"><h2>פציעות</h2><span class="meta">${myInj} אצלך · ${injRows.length - myInj} אצל היריב</span></div>
    ${injRows.map(([x, mine]) => `<div class="fa"><span class="pa" style="width:28px;height:28px">${hsI(x.id, 28)}</span><div class="tx"><b>${pName(x)}</b><small>${where(x, mine)}${x.inj.part ? ` · ${esc(x.inj.part)}` : ""}</small></div><span class="chip ${isOut(x.inj) ? "red" : "amb"}">${esc(injTxt(x.inj))}</span></div>`).join("") || `<p class="mut">אין פצועים אצלך או אצל היריב.</p>`}
    <div class="note">הסטטוסים מ-Sleeper, מתעדכנים פעם בשעה.</div></section>`);
  const lg = D.rosters.map(r => ({uid: r.owner_id, e: teamWeek(D, Wm, r).exp})).sort((a, b) => b.e - a.e);
  const lo = Math.min(...lg.map(t => t.e)) * 0.9, hi = Math.max(...lg.map(t => t.e)) || 1;
  html.push(`<section class="blk s3 paper" aria-label="הליגה השבוע"><div class="bh"><h2>הליגה השבוע</h2><span class="meta">צפי לסוף השבוע</span></div>
    ${lg.map(t => { const w = t.uid === MY_USER_ID ? "me" : op && t.uid === op.uid ? "op" : "";
      return `<div class="lw ${w}">${uAvI(D, t.uid, 20)}<b>${esc(tName(D, t.uid))}</b><span class="bar" style="height:9px"><i style="width:${((t.e - lo) / (hi - lo || 1) * 100).toFixed(1)}%;background:${w === "me" ? "var(--me)" : w === "op" ? "var(--op-tx)" : "var(--s4)"}"></i></span><span class="n">${f1(t.e)}</span></div>`; }).join("")}
    <div class="note">אתה בכתום, היריב שלך באפור כהה.</div></section>`);
  out.innerHTML = html.join("");
  seasonHeader();
}

// ---------- "שוק חופשי" ----------
function faSearch(el){ SEA.fa.q = el.value; SEA.fa.focus = el.selectionStart; renderFA(); }
function faNext(n){ SEA.fa.swI = ((SEA.fa.swI || 0) + 1) % n; renderFA(); }
function renderFA(){
  const out = $("xFa");
  startSeasonTimer();
  if (xGate(out)) return;
  const X = seasonState(), F = SEA.fa;
  if (!X || !X.myR) { out.innerHTML = `<section class="blk s12"><p class="mut">לא מצאתי את הקבוצה שלך בליגה הזאת.</p></section>`; return; }
  const {fa} = X, watch = new Set(S.faWatch || []), html = [];
  const avgTxt = id => { const s = seasonSum(id); return s ? `${f1(s.avg)} <em>(${s.gp})</em>` : `<span class="dim">·</span>`; };
  const avgPlain = id => { const s = seasonSum(id); return s ? `${f1(s.avg)} (${s.gp})` : "עוד לא שיחק"; };
  const minTxt = x => x.wkMin ? `${Math.round(x.wkMin)}${Math.abs(x.dMin) >= 1 ? ` <em class="${x.dMin < 0 ? "dn" : "upn"}">(${x.dMin > 0 ? "+" : "−"}${Math.round(Math.abs(x.dMin))})</em>` : ""}` : `<span class="dim">·</span>`;
  const gapTxt = v => `${v >= 0 ? "+" : "−"}${f1(Math.abs(v))}`;
  const sw = bestSwaps(X, 4);

  // ---- the best swap, then the others and my weakest ----
  if (sw.length) {
    const i = (F.swI || 0) % sw.length, s = sw[i], c = s.c, d = s.d, nm = String(c.p.n).split(" ");
    html.push(`<section class="blk s6 swap" aria-label="ההחלפה הכי טובה"><div class="bh"><h2>ההחלפה הכי טובה</h2><span class="meta">לשבוע הזה</span><span class="sp"></span>${sw.length > 1 ? `<a href="#" onclick="faNext(${sw.length});return false">החלפה ${i + 1} מתוך ${sw.length}</a>` : ""}</div>
      <div class="sw-top">${pfr(c.p.id, 200, 184, c.team)}
        <div class="who"><div class="tag"><span class="pill">להחתים</span>${tlI(c.team)}${esc(c.team)} · ${(c.p.pos || []).join("/")}${c.p.age ? ` · גיל ${c.p.age}` : ""}</div>
          <div class="name">${esc(nm[0])}<br>${esc(nm.slice(1).join(" "))}</div>
          <div class="strip"><div><small>ערך שבועי</small><span class="n">${f1(c.val)}</span></div><div><small>תחזית</small><span class="n">${f1(c.p.fpg)}</span></div><div><small>בפועל</small><span class="n">${avgTxt(c.p.id)}</span></div></div></div></div>
      <div class="sw-band">
        <div class="gain"><small>לשבוע, לסגל</small><div class="n big2">+${f1(s.g)}</div><div class="vg">פער בערך <b>${gapTxt(c.val - adj(d.p))}</b></div></div>
        <div class="out">${pfr(d.id, 64, 64, d.team)}<div class="ot"><span class="rel">לשחרר</span><b>${esc(d.p.n)}</b><small>${esc(d.team)} · ${f1(adj(d.p))} · בפועל ${avgPlain(d.id)}</small></div></div>
        <div class="strip"><div><small>דקות</small><span class="n">${minTxt(c)}</span></div><div><small>השבוע</small><span class="n">${c.left}<em>/${c.games}</em></span></div><div><small>שבוע הבא</small><span class="n">${c.next || "·"}</span></div></div></div>
      <div class="acts"><a class="btn w" href="${SLEEPER_URL}" target="_blank" rel="noopener">להחתים ב-Sleeper ${xi("ext", 13)}</a><button class="btn" onclick="openCard('${c.p.id}')">כרטיס שחקן</button></div></section>`);
    const others = sw.filter((_, k) => k !== i);
    html.push(`<section class="blk s3 paper" aria-label="עוד החלפות"><div class="bh"><h2>${others.length > 1 ? `עוד ${others.length} החלפות` : "עוד החלפה"}</h2></div>
      ${others.length ? others.map(o => `<div class="alt"><div class="row">${hsI(o.c.p.id, 40)}<div class="tx"><b>${nameLink(o.c.p)}</b><small>${esc(o.c.team)} · ${(o.c.p.pos || []).join("/")} · ערך ${f1(o.c.val)}</small></div><div style="text-align:left"><div class="n v">+${f1(o.g)}</div><small>לסגל</small></div></div>
        <small>במקום ${esc(o.d.p.n)} · פער בערך ${gapTxt(o.c.val - adj(o.d.p))} · ${o.c.left ? `${o.c.left} משחקים השבוע` : "בלי משחקים השבוע"}</small></div>`).join("") : `<p class="mut">אין עוד החלפה ששווה משהו.</p>`}</section>`);
  } else html.push(`<section class="blk s9 paper"><div class="bh"><h2>אין החלפה ששווה עכשיו</h2></div><p class="mut">אין שחקן פנוי שמשפר את הסגל שלך ביותר מרבע נקודה לשבוע. כשמישהו ישתחרר או שתפקיד יגדל, הוא יופיע כאן.</p></section>`);
  const weak = fa.mineAll.filter(x => !x.p.stub).sort((a, b) => adj(a.p) - adj(b.p)).slice(0, 6);
  const bestFree = fa.list.filter(x => !isOut(x.inj)).reduce((a, x) => (!a || x.val > a.val ? x : a), null);
  const vals = [...weak.map(x => adj(x.p)), bestFree ? bestFree.val : 0], lo = Math.min(...vals) * 0.8, hi = Math.max(...vals) * 1.05, pos = v => (v - lo) / (hi - lo || 1) * 100;
  html.push(`<section class="blk s3 paper" aria-label="הכי חלשים אצלך"><div class="bh"><h2>הכי חלשים אצלך</h2><span class="meta">מי הולך לשוק אם מחתימים</span></div>
    ${weak.map(x => { const v = adj(x.p); return `<div class="wk">${hsI(x.id, 26)}<div><div class="nm">${pName(x)}</div><div class="tr"><i style="width:${pos(v).toFixed(1)}%;${bestFree && v >= bestFree.val ? "background:var(--tx3)" : ""}"></i>${bestFree ? `<u style="right:${pos(bestFree.val).toFixed(1)}%"></u>` : ""}</div></div><span class="n">${f1(v)}</span></div>`; }).join("")}
    ${bestFree ? `<div class="note" style="display:flex;align-items:center;gap:7px"><i style="display:inline-block;width:12px;height:2px;background:var(--now-tx)"></i>${f1(bestFree.val)} · ${esc(bestFree.p.n)}, הכי טוב שפנוי. מי שמתחת לקו שווה החלפה.</div>` : ""}</section>`);

  // ---- the table, with its sort rail ----
  const q = (F.q || "").trim().toLowerCase();
  const posOk = x => F.pos === "ALL" || (x.p.pos || []).some(p => (ELIG[F.pos] || [F.pos]).includes(p));
  const list = fa.list.filter(x => posOk(x) && (!F.healthy || !isOut(x.inj)) && (!F.watch || watch.has(x.p.id)) && (!q || x.p.n.toLowerCase().includes(q)));
  const actual = x => { const s = seasonSum(x.p.id); return s ? s.avg : -1; };
  const SORTS = [["val", "ערך שבועי", x => x.val], ["gain", fa.worst ? `פער מ-${lastName(fa.worst.p.n)}` : "פער", x => x.gain], ["avg", "בפועל", actual], ["fpg", "תחזית", x => x.p.fpg || 0], ["left", "השבוע", x => x.left * 100 + x.val], ["min", "דקות", x => x.dMin], ["trend", "מוסיפים", x => x.trend]];
  const so = SORTS.find(s => s[0] === F.sort) || SORTS[1];
  list.sort((a, b) => (F.dir || -1) * (so[2](a) - so[2](b)));
  const total = list.length, shown = list.slice(0, F.more ? 120 : 15);   // 15 = the height of the side column (design/fa.html), so the row has no dead space
  const mxg = Math.max(1, ...shown.map(x => x.gain));
  const lastTwo = id => { const s = seasonSum(id); return s && s.last.length ? `<span class="lg2">${s.last.slice(-2).map(v => `<span>${f1(v)}</span>`).join("")}</span>` : `<span class="dim" style="font-size:11.5px">עוד לא שיחק</span>`; };
  const row = x => `<tr class="${watch.has(x.p.id) ? "hl" : ""}">
    <td><button class="star${watch.has(x.p.id) ? " on" : ""}" onclick="toggleWatch('${x.p.id}')" aria-label="מעקב" title="${watch.has(x.p.id) ? "להוריד ממעקב" : "למעקב"}">${xi("star", 15)}</button></td>
    <td style="text-align:right"><div class="pl">${hsI(x.p.id, 26)}<div><b>${nameLink(x.p)}</b>${x.inj ? ` <span class="chip ${isOut(x.inj) ? "red" : "amb"}" style="margin-inline-start:4px">${esc(injTxt(x.inj))}</span>` : ""}${x.waiverUntil ? ` <span class="chip" style="margin-inline-start:4px">waivers</span>` : ""}<small>${esc(x.team)} · ${(x.p.pos || []).join("/")}${x.p.age ? ` · גיל ${x.p.age}` : ""}${x.trend ? ` · ${x.trend.toLocaleString("en-US")} מוסיפים` : ""}</small></div></div></td>
    <td class="num b">${f1(x.val)}</td>
    <td>${x.gain > 0 ? `<span class="gp"><span class="bar"><i style="width:${(x.gain / mxg * 100).toFixed(0)}%;background:var(--good-tx)"></i></span><b>+${f1(x.gain)}</b></span>` : `<span class="dim num">${gapTxt(x.gain)}</span>`}</td>
    <td class="num">${avgTxt(x.p.id)}</td><td>${lastTwo(x.p.id)}</td><td class="num pj">${f1(x.p.fpg)}</td>
    <td class="num">${x.left}<span class="dim">/${x.games}</span></td><td class="num">${x.next || "·"}</td><td class="num mn">${minTxt(x)}</td></tr>`;
  html.push(`<section class="blk s9 paper" aria-label="שחקנים פנויים" style="padding-bottom:8px"><div class="bh"><h2>שחקנים פנויים</h2><span class="meta">${total}</span><span class="sp"></span><a href="${SLEEPER_URL}" target="_blank" rel="noopener">Sleeper ${xi("ext", 12)}</a></div>
    <div class="tw"><div class="vr" role="tablist" aria-label="מיון">${SORTS.map(([k, t]) => `<button class="${so[0] === k ? "on" : ""}" onclick="sortFA('${k}')" role="tab" aria-selected="${so[0] === k}">${esc(t)}</button>`).join("")}
        <small>ערך שבועי = נקודות לשבוע ב-Lock-in לפי המודל, אחרי סיכון פציעה. פער = מול השחקן הכי חלש אצלך.</small></div>
      <div style="min-width:0"><div class="flt"><div class="seg">${["ALL", "G", "F", "C"].map(k => `<button class="${F.pos === k ? "on" : ""}" onclick="SEA.fa.pos='${k}';renderFA()">${k === "ALL" ? "הכל" : k}</button>`).join("")}</div>
          <button class="tog${F.healthy ? " on" : ""}" onclick="SEA.fa.healthy=!SEA.fa.healthy;renderFA()"><span class="bx">${F.healthy ? xi("check", 10) : ""}</span>בלי פצועים</button>
          <button class="tog${F.watch ? " on" : ""}" onclick="SEA.fa.watch=!SEA.fa.watch;renderFA()"><span class="bx">${F.watch ? xi("check", 10) : ""}</span>רק במעקב (${watch.size})</button>
          <label class="srch">${xi("search", 14)}<input id="faQ" value="${esc(F.q || "")}" placeholder="חיפוש שחקן" oninput="faSearch(this)" aria-label="חיפוש שחקן"></label></div>
        <div class="tsc"><table class="tb ft"><thead><tr><th></th><th style="text-align:right">שחקן</th><th>ערך</th><th>פער</th><th>בפועל</th><th>שני האחרונים</th><th>תחזית</th><th>השבוע</th><th>הבא</th><th>דקות</th></tr></thead>
        <tbody>${shown.map(row).join("") || `<tr><td colspan="10" class="dim" style="height:44px;text-align:center">אין שחקנים שמתאימים לסינון</td></tr>`}
        ${total > shown.length ? `<tr><td colspan="10" style="height:40px;text-align:center"><button class="btn" onclick="SEA.fa.more=true;renderFA()">עוד ${total - shown.length} שחקנים</button></td></tr>` : ""}</tbody></table></div></div></div></section>`);

  // ---- side: injury openings and Sleeper adds ----
  const opps = [];
  Object.entries(SEA.pl || {}).forEach(([id, x]) => {
    if (!x.team || !isOut(injOf(id))) return;
    const p = PMAP.get(id); if (!p || (p.min || 0) < 26) return;
    const mates = fa.list.filter(f => f.team === x.team && !isOut(f.inj) && (f.p.pos || []).some(q2 => (p.pos || []).includes(q2))).sort((a, b) => (b.dMin - a.dMin) || (b.val - a.val)).slice(0, 2);
    if (mates.length) opps.push({p, team: x.team, mates, ret: (espnInjOf(id) || {}).ret});
  });
  const tr = (X.D.trend || []).filter(t => !fa.rostered.has(t.player_id)).slice(0, 6), mxt = Math.max(1, ...tr.map(t => t.count));
  html.push(`<div class="s3 side">
    <section class="blk paper" aria-label="הזדמנויות מפציעות"><div class="bh"><h2>הזדמנויות מפציעות</h2></div>
      ${opps.sort((a, b) => b.p.min - a.p.min).slice(0, 5).map(o => `<div class="it op2"><span class="pa">${hsI(o.p.id, 32)}${tlI(o.team)}</span><div class="tx"><b>${esc(o.p.n)} <span class="chip red" style="margin-inline-start:4px">בחוץ</span></b><small>${o.mates.map(m => `${esc(m.p.n)}${m.dMin >= 2 ? ` +${Math.round(m.dMin)} דק'` : ""}`).join(", ")}</small></div>${o.ret ? `<span class="dl">${xi("clock")}${esc(retTxt(o.ret).replace("חזרה משוערת ", ""))}</span>` : ""}</div>`).join("") || `<p class="mut">אין כרגע שחקן רוטציה בחוץ עם מחליף פנוי.</p>`}
      <div class="note">שחקן עם 26+ דקות שמסומן בחוץ, ופנויים מאותה קבוצה ועמדה.</div></section>
    <section class="blk paper" aria-label="מה מוסיפים ב-Sleeper"><div class="bh"><h2>מה מוסיפים ב-Sleeper</h2><span class="meta">24 שעות · רק פנויים</span></div>
      ${tr.map(t => { const p = pOf(t.player_id); return `<div class="ad">${hsI(t.player_id, 26)}<div style="min-width:0"><b style="font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.stub ? esc(p.n) : nameLink(p)}</b><small class="dim" style="font-size:11.5px">${esc(teamOf(t.player_id))}</small></div><span class="bar"><i style="width:${(t.count / mxt * 100).toFixed(0)}%;background:var(--tx3)"></i></span><span class="n">${t.count.toLocaleString("en-US")}</span></div>`; }).join("") || `<p class="mut">אין נתונים מ-Sleeper כרגע.</p>`}</section></div>`);
  out.innerHTML = html.join("");
  if (F.focus != null) { const el = $("faQ"); if (el) { el.focus(); el.setSelectionRange(F.focus, F.focus); } F.focus = null; }
}

// ---------- "הליגה שלנו" ----------
function lgPick(rid){ S.lgSel = rid; save(); renderLive(); }
// a matchup card opens that matchup slot by slot under the cards (Nati, 24.10.2026); a second click closes it
function muPick(mid){ LIVE.muSel = LIVE.muSel === mid ? null : mid; renderLive(); }
function renderLive(){
  const out = $("xLive");
  clearInterval(LIVE.timer);
  LIVE.timer = setInterval(() => { if (S.tab === "live" && !document.hidden) fetchLive(); }, 60000);
  if (!LIVE.data) {
    out.innerHTML = LIVE.err ? `<section class="blk s12"><div class="bh"><h2>לא הצלחתי למשוך את הליגה מ-Sleeper</h2></div><p class="mut">${esc(LIVE.err)}</p><button class="btn" onclick="fetchLive()">רענון</button></section>`
      : `<section class="blk s12"><p class="mut">טוען את הליגה מ-Sleeper</p></section>`;
    fetchLive(); return;
  }
  if (!SEA.d) maybeFetchSeason();
  const L = LIVE.data, lg = L.lg, Mo = liveModel(L), html = [];
  const X = SEA.d && SEA.sch ? seasonState() : null, TW = {};
  if (X && X.D.week === L.week) X.D.rosters.forEach(r => { TW[r.roster_id] = teamWeek(X.D, X.Wm, r); });
  const D = {users: L.users, rosters: L.rosters};
  const col = uid => mgrCol(D, uid), av = (uid, s) => uAvI(D, uid, s), nm = uid => esc(tName(D, uid));
  const userOf = uid => (L.users.find(u => u.user_id === uid) || {}).display_name || "";
  const reg = L.reg, tdl = lg.settings.trade_deadline, pws = lg.settings.playoff_week_start, ptm = lg.settings.playoff_teams, wk = Math.max(1, L.week);
  const myRid = (Mo.teams.find(t => t.uid === MY_USER_ID) || {}).rid;
  const rankOfRid = rid => (Mo.teams.find(t => t.rid === rid) || {}).rank || "";

  // ---- the season on one axis ----
  const pct = w => Math.min(100, Math.max(0, w / reg * 100));
  html.push(`<section class="blk s3 ssn" aria-label="העונה"><div class="bh"><h2>העונה</h2><span class="meta">עודכן ${LIVE.at ? (Math.round((Date.now() - LIVE.at) / 60000) ? `לפני ${Math.round((Date.now() - LIVE.at) / 60000)} דק'` : "עכשיו") : ""}</span></div>
    <div class="row" style="align-items:baseline;gap:8px"><span class="big3 n">${Math.min(wk, reg)}</span><span class="of n">/ ${reg}</span><span class="mut" style="font-size:12.5px">שבועות בעונה הסדירה</span></div>
    <div class="axis"><div class="tr"><i style="width:${pct(Mo.regDone + 0.5).toFixed(1)}%"></i></div><span class="mk" style="right:${pct(tdl).toFixed(1)}%;background:var(--warn)"></span><span class="mk" style="right:calc(100% - 2px);background:var(--tx)"></span></div>
    <div class="cells"><div><small><i style="display:inline-block;width:7px;height:7px;border-radius:2px;background:var(--warn);margin-inline-end:5px"></i>דדליין טריידים</small><span class="n">שבוע ${tdl}</span><em>${wk <= tdl ? `עוד ${tdl - wk + 1} שבועות` : "עבר"}</em></div>
      <div><small><i style="display:inline-block;width:7px;height:7px;border-radius:2px;background:var(--tx);margin-inline-end:5px"></i>פלייאוף</small><span class="n">שבוע ${pws}</span><em>${wk < pws ? `עוד ${pws - wk} שבועות` : "עכשיו"}</em></div>
      <div><small>עולות</small><span class="n">${ptm} מ-${L.rosters.length}</span><em>הקו בטבלה</em></div></div></section>`);

  // ---- this week's three matchups ----
  const ms = L.matchups[wk - 1] || [], pairs = {};
  ms.forEach(m => (pairs[m.matchup_id] = pairs[m.matchup_id] || []).push(m));
  const ordered = Object.values(pairs).filter(p => p.length === 2).sort((a, b) => b.some(m => m.roster_id === myRid) - a.some(m => m.roster_id === myRid));
  const muCards = ordered.map(([a, b]) => {
    const ta = TW[a.roster_id], tb = TW[b.roster_id], ua = Mo.byRid[a.roster_id].uid, ub = Mo.byRid[b.roster_id].uid;
    const pa = ta && tb ? winP(ta, tb) : null, mine = a.roster_id === myRid || b.roster_id === myRid;
    const live = ta && tb && [...ta.st, ...tb.st].some(x => x && x.g.some(g => g.live));
    const row = (m, T, uid, p) => `<div class="mr${p == null || p >= 0.5 ? "" : " lose"}" style="--c:${col(uid)}">${av(uid, 30)}<div><b>${nm(uid)}</b><small>מקום ${rankOfRid(m.roster_id)}${T ? ` · נעול ${f1(T.cur)}` : ""}</small></div>${p != null ? `<span class="pc2">${Math.round(p * 100)}%</span>` : ""}<span class="sc2">${f1(m.points || 0)}</span></div>`;
    const pair = (k, fa) => ta && tb ? `${fa(tb)} : ${fa(ta)}` : "·";
    const on = LIVE.muSel === a.matchup_id;
    return `<section class="blk mu${mine ? " mine" : ""}${on ? " sel" : ""}" style="--a:${col(ua)};--b:${col(ub)}" aria-label="${nm(ua)} מול ${nm(ub)}" role="button" tabindex="0" aria-expanded="${on}" title="${on ? "לסגור את המאץ'" : "לראות את המאץ' שחקן מול שחקן"}" onclick="muPick(${a.matchup_id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();muPick(${a.matchup_id})}">
      <div class="bh"><h2>${mine ? "המאץ' שלך" : "מאץ'"}</h2><span class="sp"></span>${live ? `<span class="chip live"><i></i>חי</span>` : ta && tb ? `<span class="meta" style="color:#ffffffa0">צפי <bdi>${f1(ta.exp)}</bdi> : <bdi>${f1(tb.exp)}</bdi></span>` : ""}</div>
      ${row(a, ta, ua, pa)}${row(b, tb, ub, pa == null ? null : 1 - pa)}
      <div class="pb"><i style="width:${((pa == null ? 0.5 : pa) * 100).toFixed(1)}%;background:${col(ua)}"></i><i style="flex:1;background:${col(ub)}"></i></div>
      <div class="mf"><span>נעולים <b>${pair(0, T => T.nLocked)}</b></span><span>נשארו <b>${pair(0, T => T.nLeft)}</b></span><span>היום <b>${pair(0, T => T.nToday)}</b></span><span class="go">${on ? "סגירה" : "פרטים"}</span></div></section>`;
  });
  html.push(`<div class="s9 mus">${muCards.join("") || `<section class="blk"><p class="mut">אין מאצ'אפים לשבוע ${wk} עדיין.</p></section>`}</div>`);

  // ---- the open matchup, slot by slot: the right team's player, the slot, the left team's player ----
  const opened = ordered.find(([a]) => a.matchup_id === LIVE.muSel);
  // another team's player: there is no way to know what he locked (Sleeper shows the counted score, not the lock), so a
  // number is solid only for a player who is locked or done; otherwise it is what counts now, muted (Nati, 25.10.2026)
  const solid = x => x.locked || (!x.left.length && !x.g.some(g => g.live));
  const nCls = x => solid(x) ? "" : " pv";
  const pend = x => x.pending ? `<span class="left pk" title="Sleeper מראה את המשחק מ-${dLbl(x.pending.date)}. אין אישור שזו נעילה, ולכן נספר המשחק האחרון">Sleeper: ${f1(x.pending.fp)}?</span>` : "";
  if (opened) {
    const [a, b] = opened, ta = TW[a.roster_id], tb = TW[b.roster_id], ua = Mo.byRid[a.roster_id].uid, ub = Mo.byRid[b.roster_id].uid;
    const state = x => x.locked ? `<span class="act done">${xi("lock", 12)}נעול</span>`
      : x.g.some(g => g.live) ? `<span class="chip live"><i></i>משחק עכשיו</span>`
      : `<span class="left">${x.left.length ? (x.left.length === 1 ? "משחק אחד נשאר" : `${x.left.length} משחקים נשארו`) : x.g.length ? "סיים" : "אין משחקים"}</span>${pend(x)}`;
    const who = x => `<div class="pl">${hsI(x.id, 26)}<div><b>${pName(x)}</b><small>${esc(x.team)}${x.inj ? ` · ${esc(injTxt(x.inj))}` : ""}</small></div></div>`;
    const empty = `<td colspan="3" class="dim" style="text-align:center">משבצת ריקה</td>`;
    const rowsH = ta && tb ? SLOTS.map((sl, i) => { const x = ta.st[i], y = tb.st[i];
      return `<tr>${x ? `<td style="text-align:right">${who(x)}</td><td class="num b${nCls(x)}">${nn(x.pts)}</td><td>${state(x)}</td>` : empty}
        <td class="slc"><span class="sl">${sl}</span></td>
        ${y ? `<td>${state(y)}</td><td class="num b${nCls(y)}">${nn(y.pts)}</td><td class="lf">${who(y)}</td>` : empty}</tr>`; }).join("")
      + `<tr class="sec"><td colspan="3">ספסל · ${ta.bench.map(x => esc(lastName(x.p.n))).join(", ") || "ריק"}</td><td></td><td colspan="3" style="text-align:left">ספסל · ${tb.bench.map(x => esc(lastName(x.p.n))).join(", ") || "ריק"}</td></tr>` : "";
    const head = (m, T, uid) => `<div class="mh" style="--c:${col(uid)}">${av(uid, 36)}<div><b>${nm(uid)}</b><small>מקום ${rankOfRid(m.roster_id)}${T ? ` · נעול ${f1(T.cur)} · צפי ${f1(T.exp)}` : ""}</small></div><span class="n">${f1(m.points || 0)}</span></div>`;
    html.push(`<section class="blk s12 paper mud" aria-label="${nm(ua)} מול ${nm(ub)}, שחקן מול שחקן"><div class="bh"><h2>${nm(ua)} מול ${nm(ub)}</h2><span class="meta">שבוע ${wk} · שחקן מול שחקן, ונספר = מה ש-Sleeper סופר עכשיו</span><span class="sp"></span><button class="btn" onclick="muPick(${a.matchup_id})">סגירה</button></div>
      <div class="mhs">${head(a, ta, ua)}<span class="vs">מול</span>${head(b, tb, ub)}</div>
      ${rowsH ? `<div class="tsc"><table class="tb h2h"><tbody>${rowsH}</tbody></table></div><div class="note">מספר מעומעם = מה שנספר עכשיו, והוא יכול להשתנות במשחק הבא. אי אפשר לדעת מה שחקן של מישהו אחר נעל, אז רק "נעול" ו"סיים" סופיים.</div>` : `<p class="mut">טוען את השבוע מ-Sleeper</p>`}</section>`);
  }

  // ---- the standings ----
  const closed = Mo.regDone > 0;
  const rows = [...Mo.teams].sort((a, b) => closed ? a.rank - b.rank : ((TW[b.rid] || {}).cur || 0) - ((TW[a.rid] || {}).cur || 0));
  const moves = rid => { const r = L.rosters.find(x => x.roster_id === rid); return (r && r.settings && (r.settings.total_moves || 0)) || 0; };
  html.push(`<section class="blk s5 paper" aria-label="טבלת הליגה"><div class="bh"><h2>טבלת הליגה</h2><span class="meta">${closed ? `אחרי ${Mo.regDone} שבועות` : "עוד אין שבוע סגור, הסדר לפי הנעולים של השבוע"}</span></div>
    <div class="tsc"><table class="tb st"><thead><tr><th style="width:34px">#</th><th style="text-align:right">קבוצה</th><th>מאזן</th><th>בעד</th><th>נגד</th><th>נעול</th><th>צפי</th><th>רצף</th><th>מהלכים</th></tr></thead>
    <tbody>${rows.map((t, i) => { const T = TW[t.rid];
      return `<tr class="${t.uid === MY_USER_ID ? "me" : ""}${i === ptm - 1 ? " cut" : ""}" onclick="lgPick(${t.rid})" style="cursor:pointer"><td class="rk">${i + 1}</td>
        <td><div class="tm3" style="--c:${col(t.uid)}">${av(t.uid, 26)}<div><b>${esc(t.name)}</b><small>${t.uid === MY_USER_ID ? "אתה" : esc(userOf(t.uid))}</small></div></div></td>
        <td class="num"><bdi>${t.wins}-${t.losses}</bdi></td><td class="num ${closed ? "" : "dim"}">${closed ? f1(t.pf) : "·"}</td><td class="num ${closed ? "" : "dim"}">${closed ? f1(t.pa) : "·"}</td>
        <td class="num b">${T ? f1(T.cur) : "·"}</td><td class="num pj">${T ? f1(T.exp) : "·"}</td><td class="num ${t.streak ? "" : "dim"}">${t.streak || "·"}</td><td class="num">${moves(t.rid)}</td></tr>`; }).join("")}</tbody></table></div>
    <div class="note">הקו המודגש = קו הפלייאוף (${ptm} הראשונות). לחיצה על קבוצה מציגה את הסגל שלה.</div></section>`);

  // ---- one roster at a time ----
  const selRid = Mo.byRid[S.lgSel] ? S.lgSel : myRid, sel = Mo.byRid[selRid], ST = TW[selRid];
  const opPair = ms.find(m => m.roster_id === selRid), opM = opPair && ms.find(m => m.matchup_id === opPair.matchup_id && m.roster_id !== selRid);
  const opT = opM && TW[opM.roster_id], vs = opM ? `מול ${esc(Mo.byRid[opM.roster_id].name)}${ST && opT ? `, ${Math.round(winP(ST, opT) * 100)}%` : ""}` : "";
  const roRows = ST ? ST.st.map((x, i) => x ? `<tr><td style="text-align:right"><div class="pl"><span class="sl">${SLOTS[i]}</span>${hsI(x.id, 24)}<b>${pName(x)}</b>${tlI(x.team)}</div></td>
      <td class="num b${nCls(x)}" style="width:56px">${nn(x.pts)}</td><td style="width:104px">${x.locked ? `<span class="act done">${xi("lock", 12)}נעול</span>` : `<span class="left">${x.left.length ? (x.left.length === 1 ? "משחק אחד נשאר" : `${x.left.length} משחקים נשארו`) : x.g.length ? "סיים" : "אין משחקים"}</span>${pend(x)}`}</td></tr>` : "").join("")
    + `<tr class="sec"><td colspan="3">ספסל · ${ST.bench.length} · ${ST.bench.map(x => esc(lastName(x.p.n))).join(", ")}</td></tr>`
    : sel.players.slice(0, 14).map(p => `<tr><td style="text-align:right"><div class="pl">${hsI(p.id, 24)}<b>${nameLink(p)}</b>${tlI(p.t)}</div></td><td class="num pj">${f1(adj(p))}</td><td></td></tr>`).join("");
  html.push(`<section class="blk s4 paper" aria-label="הסגלים"><div class="bh"><h2>הסגלים</h2></div>
    <div class="avs">${Mo.teams.map(t => `<button class="${t.rid === selRid ? "on" : ""}" style="--c:${col(t.uid)}" title="${esc(t.name)}" onclick="lgPick(${t.rid})">${av(t.uid, 34)}</button>`).join("")}</div>
    <div class="thd"><div><b>${esc(sel.name)}</b><br><small>${esc(userOf(sel.uid))}${sel.uid === MY_USER_ID ? " · אתה" : ""} · <bdi>${sel.wins}-${sel.losses}</bdi> · מקום ${rankOfRid(selRid)}${vs ? ` · ${vs}` : ""}</small></div><span class="n">${ST ? f1(ST.cur) : ""}</span></div>
    <div class="tsc"><table class="tb ro"><tbody>${roRows}</tbody></table></div>
    <div class="note" style="display:flex;justify-content:space-between"><span>כוח הסגל לפי המודל: ${f1(sel.strength)}</span><span>מהלכים העונה: ${moves(selRid)}</span></div></section>`);

  // ---- roster strength ----
  const pw = [...Mo.teams].sort((a, b) => b.strength - a.strength), pLo = Math.floor(Math.min(...pw.map(t => t.strength)) / 10) * 10 - 5, pHi = Math.max(...pw.map(t => t.strength));
  html.push(`<section class="blk s3" aria-label="כוח הסגלים"><div class="bh"><h2>כוח הסגלים</h2></div><div class="mut" style="font-size:12px;margin:-6px 0 12px">צפי שבועי של 9 הפותחים הכי טובים בכל סגל</div>
    ${pw.map(t => `<div class="pw${t.uid === MY_USER_ID ? " me" : ""}" style="--c:${col(t.uid)}">${av(t.uid, 26)}<div><div class="nm">${esc(t.name)}</div><span class="bar"><i style="width:${((t.strength - pLo) / (pHi - pLo || 1) * 100).toFixed(1)}%;background:${col(t.uid)}"></i></span></div><span class="n">${f1(t.strength)}</span></div>`).join("")}
    <div class="note">הפסים מתחילים ב-${pLo}, כדי שיהיה אפשר לראות את ההבדלים הקטנים.</div></section>`);

  // ---- recent moves ----
  const tx = [...L.tx].filter(t => t.status === "complete").sort((a, b) => b.created - a.created).slice(0, 8);
  const ownerOf = t => { const rid = (Object.values(t.adds || {})[0]) || (Object.values(t.drops || {})[0]) || (t.roster_ids || [])[0]; return Mo.byRid[rid]; };
  const TT = {free_agent: "החתמה", waiver: "waivers", trade: "טרייד"};
  html.push(`<section class="blk s6 paper" aria-label="מהלכים אחרונים"><div class="bh"><h2>מהלכים אחרונים</h2><span class="meta">כל הליגה, שבועיים</span></div>
    ${tx.map(t => { const o = ownerOf(t) || {}; const d = new Date(t.created);
      const adds = Object.keys(t.adds || {}), drops = Object.keys(t.drops || {});
      return `<div class="mv" style="--c:${col(o.uid)}"><span class="dt2">${d.getDate()}.${d.getMonth() + 1}</span>${av(o.uid, 26)}<div><b style="font-size:13px;display:block;margin-bottom:4px">${esc(o.name || "")}</b>
        <div class="swp">${adds.map(id => `<span>${hsI(id, 20)}<span class="add">+</span>${esc(pOf(id).n)}</span>`).join("")}${drops.map(id => `<span>${hsI(id, 20)}<span class="drop">−</span>${esc(pOf(id).n)}</span>`).join("")}</div></div>
        <span class="chip">${TT[t.type] || esc(t.type)}</span></div>`; }).join("") || `<p class="mut">אין מהלכים בשבועיים האחרונים.</p>`}
    <div class="note">ב-Lock-in שוק פעיל הוא עוד הזדמנויות לנעילה.</div></section>`);

  // ---- the season, week by week ----
  let chart;
  if (Mo.regDone > 0) {
    const n = Mo.regDone, all = Mo.teams.flatMap(t => Mo.pts[t.rid].slice(0, n)), lo = Math.min(...all) * 0.95, hi = Math.max(...all) * 1.03;
    const x = i => n === 1 ? 300 : 580 - i * (560 / (n - 1)), y = v => 165 - (v - lo) / (hi - lo || 1) * 150;
    chart = `<svg viewBox="0 0 600 178" role="img" aria-label="נקודות בכל שבוע">${Mo.teams.slice().sort((a, b) => (a.uid === MY_USER_ID) - (b.uid === MY_USER_ID)).map(t => {
      const pts = Mo.pts[t.rid].slice(0, n).map((v, i) => `${x(i).toFixed(1)},${y(v || 0).toFixed(1)}`).join(" ");
      return `<polyline points="${pts}" fill="none" style="stroke:${col(t.uid)};stroke-width:${t.uid === MY_USER_ID ? 3 : 1.8};opacity:${t.uid === MY_USER_ID ? 1 : .85}"/>${Mo.pts[t.rid].slice(0, n).map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v || 0).toFixed(1)}" r="${t.uid === MY_USER_ID ? 3.5 : 2.5}" style="fill:${col(t.uid)}"><title>${esc(t.name)} · שבוע ${i + 1} · ${f1(v || 0)}</title></circle>`).join("")}`; }).join("")}</svg>`;
  } else {
    const d1 = SEA.sch ? SEA.sch.games.filter(g => g.week === wk + 1).map(g => g.date).sort()[0] : null;
    chart = `<div class="ghost"><svg viewBox="0 0 600 178" preserveAspectRatio="none" aria-hidden="true">${Mo.teams.map((t, i) => `<polyline points="${Array.from({length: 9}, (_, k) => `${k * 75},${60 + ((i * 37 + k * 23) % 70)}`).join(" ")}" fill="none" style="stroke:${col(t.uid)};stroke-width:2.5;opacity:.22"/>`).join("")}</svg>
      <div class="msg"><div><b>מתמלא אחרי שבוע ${wk}${d1 ? `, ב-${dObj(d1).getUTCDate()}.${dObj(d1).getUTCMonth() + 1}` : ""}</b><span>קו לכל קבוצה. אתה בכתום.</span></div></div></div>`;
  }
  html.push(`<section class="blk s6" aria-label="לאורך העונה"><div class="bh"><h2>לאורך העונה</h2><span class="meta">נקודות בכל שבוע</span></div>${chart}</section>`);
  out.innerHTML = html.join("");
}

// ---------- "חדשות ועדכונים" ----------
function newsDay(d){ NEWS.day = d; if (!TIP[d]) loadDay(d, 10 * 60e3).then(() => { if (S.tab === "news") renderNews(); }); renderNews(); }
function renderNews(){
  const out = $("xNews");
  startSeasonTimer();
  if (xGate(out)) return;
  if (Date.now() - NEWS.newsAt > 10 * 60e3) loadNews();
  const X = seasonState();
  if (!X || !X.myR) { out.innerHTML = `<section class="blk s12"><p class="mut">לא מצאתי את הקבוצה שלך בליגה הזאת.</p></section>`; return; }
  const {D} = X, own = ownerMap(X), today = todayUS(), oppU = X.op ? X.op.uid : null, html = [];
  const col = uid => uid ? mgrCol(D, uid) : "var(--tx3)";
  const who = id => { const u = own.get(id); return u === MY_USER_ID ? "me" : u && u === oppU ? "opp" : u ? "lg" : PMAP.has(id) ? "fa" : ""; };

  // ---- games by day (ESPN for the times, Sleeper for the count), with the league's players ----
  const tD = TIP[today], nextUS = usDate(dObj(today).getTime() + DAY);
  const dflt = tD && tD.games.length && !tD.games.every(g => g.done) ? today : nextUS;
  const day = NEWS.day || dflt, dayT = TIP[day];
  const schDates = [...new Set(SEA.sch.games.map(g => g.date))].sort();
  const i0 = Math.max(0, schDates.indexOf(dflt)), tabs = schDates.slice(Math.max(0, i0 - 1), i0 + 3);
  const cntOn = d => SEA.sch.games.filter(g => g.date === d).length, wkOf = d => (SEA.sch.games.find(g => g.date === d) || {}).week;
  const byTeam = {};
  own.forEach((u, id) => { const t = teamOf(id); (byTeam[t] = byTeam[t] || []).push({id, u}); });
  const card = g => {
    const ps = [...(byTeam[g.away.team] || []), ...(byTeam[g.home.team] || [])].sort((a, b) => ((b.u === MY_USER_ID) - (a.u === MY_USER_ID)) || ((b.u === oppU) - (a.u === oppU)));
    const mine = ps.filter(p => p.u === MY_USER_ID).length, opp = ps.filter(p => p.u === oppU).length;
    const st = g.state === "in" ? `<span class="n" style="color:var(--now)">${esc(g.detail || "חי")}</span>` : g.done ? `<span class="n">סיום</span>` : `<span class="n">${ilTime(g.t, false)}</span>`;
    const side = s => `<div class="tr2">${tlI(s.team)}${esc(s.team)}<small>${g.state === "pre" ? esc(s.rec || "") : s.score ?? ""}</small></div>`;
    return `<div class="gc${mine ? " mine" : ""}"><div class="hd">${st}${g.tv && g.tv.length ? `<span>${xi("tv", 13)}${esc(g.tv[0])}</span>` : ""}</div>${side(g.away)}${side(g.home)}
      <div class="ps"><div class="stk">${ps.slice(0, 6).map(p => `<img class="${p.u === MY_USER_ID ? "me" : ""}" style="--c:${col(p.u)}" src="${img(p.id)}" alt="" title="${esc(pOf(p.id).n)} · ${esc(tName(D, p.u))}" loading="lazy">`).join("")}${ps.length > 6 ? `<span class="more">+${ps.length - 6}</span>` : ""}</div>
      <span class="mn2">${mine ? `שלך <b>${mine}</b>` : ""}${mine && opp ? " · " : ""}${opp ? `יריב ${opp}` : ""}${!mine && !opp ? (ps.length ? "שאר הליגה" : "אף שחקן מהליגה") : ""}</span></div></div>`;
  };
  html.push(`<section class="blk s12" aria-label="המשחקים"><div class="bh"><h2>${day === today ? "המשחקים הלילה" : `המשחקים · ${dLbl(day)}`}</h2><span class="meta">שעון ישראל · השחקנים של הליגה בכל משחק, בטבעת בצבע של המנג'ר</span><span class="sp"></span><a href="#" onclick="refreshAll();return false">${ric("repeat")}רענון</a></div>
    <div class="tn2"><div class="dtab">${tabs.map(d => `<button class="${d === day ? "on" : ""}" onclick="newsDay('${d}')">${dLbl(d)}${d === today ? " · הלילה" : wkOf(d) !== D.week ? ` · שבוע ${wkOf(d)}` : ""}<b>${cntOn(d)}</b></button>`).join("")}<small>המספר = משחקים באותו יום. משחק אחרי חצות שייך ליום של ארה"ב.</small></div>
      <div>${dayT && dayT.games.length ? `<div class="gms" data-r="${dayT.games.length % 4}">${dayT.games.map(card).join("")}</div>` : `<p class="mut">${dayT && dayT.err ? "לא הצלחתי למשוך את לוח המשחקים מ-ESPN." : dayT ? "אין משחקים ביום הזה." : "טוען את המשחקים מ-ESPN"}</p>`}
        <div class="own">${D.rosters.map(r => `<span style="--c:${col(r.owner_id)}"><i></i>${esc(tName(D, r.owner_id))}${r.owner_id === MY_USER_ID ? " (אתה)" : r.owner_id === oppU ? " (היריב)" : ""}</span>`).join("")}</div></div></div></section>`);

  // ---- ESPN news, tagged with whose players they mention ----
  const arts = (NEWS.news || []).map(a => {
    const names = (a.categories || []).filter(c => c.type === "athlete").map(c => c.description || (c.athlete || {}).description).filter(Boolean);
    const ids = [...new Set(names.map(idByName).filter(Boolean))].filter(id => who(id));
    return {a, ids, ks: new Set(ids.map(who))};
  });
  const F = NEWS.f || "all", count = k => arts.filter(x => k === "all" || x.ks.has(k)).length;
  const shown = arts.filter(x => F === "all" || x.ks.has(F)).sort((p, q) => (q.ks.has("me") - p.ks.has("me")) || (new Date(q.a.published) - new Date(p.a.published)));
  const tag = id => { const k = who(id), u = own.get(id);
    return `<span class="tg" style="--c:${k === "fa" ? "var(--good-tx)" : col(u)}"><img src="${img(id)}" alt="">${esc(lastName(pOf(id).n))}<em class="${k === "fa" ? "free" : ""}">${k === "me" ? "שלך" : k === "fa" ? "פנוי" : esc(tName(D, u))}</em></span>`; };
  const imgOf = a => ((a.images || []).find(i => i.url) || {}).url, href = a => ((a.links || {}).web || {}).href || "#";
  const feat = shown.find(x => imgOf(x.a)) || null, rest = shown.filter(x => x !== feat).slice(0, NEWS.more ? 30 : 6);
  html.push(`<section class="blk s6 paper" aria-label="חדשות"><div class="bh"><h2>חדשות</h2><span class="meta">ESPN · ${NEWS.newsAt ? `עודכן ${agoTxt(new Date(NEWS.newsAt).toISOString())}` : "טוען"}</span></div>
    <div class="chips" style="margin-bottom:16px">${[["all", "הכל"], ["me", "השחקנים שלך"], ["opp", "היריב"], ["lg", "שאר הליגה"], ["fa", "פנויים"]].map(([k, t]) => `<button class="${F === k ? "on" : ""}" onclick="NEWS.f='${k}';renderNews()">${t}<b>${count(k)}</b></button>`).join("")}</div>
    ${!NEWS.news ? `<p class="mut">${NEWS.err ? `לא הצלחתי למשוך חדשות מ-ESPN (${esc(NEWS.err)}).` : "טוען חדשות מ-ESPN"}</p>`
      : !shown.length ? `<p class="mut">אין כרגע כתבות בסינון הזה. הפיד מתעדכן כל 10 דקות.</p>`
      : `${feat ? `<div class="feat"><img src="${esc(imgOf(feat.a))}" alt="" loading="lazy"><div><div class="when2">${agoTxt(feat.a.published)} · ESPN</div><h3 dir="auto"><a href="${esc(href(feat.a))}" target="_blank" rel="noopener">${esc(feat.a.headline)}</a></h3>${feat.a.description ? `<p dir="auto">${esc(feat.a.description)}</p>` : ""}<div class="tags">${feat.ids.map(tag).join("")}</div></div></div>` : ""}
        ${rest.map(({a, ids}) => `<div class="nw">${imgOf(a) ? `<img src="${esc(imgOf(a))}" alt="" loading="lazy">` : `<span></span>`}<div><b dir="auto"><a href="${esc(href(a))}" target="_blank" rel="noopener">${esc(a.headline)}</a></b><div class="when2" style="margin-top:3px">${agoTxt(a.published)}</div><div class="tags">${ids.map(tag).join("")}</div></div></div>`).join("")}
        ${shown.length > 7 ? `<div style="text-align:center;margin-top:10px"><button class="btn" onclick="NEWS.more=!NEWS.more;renderNews()">${NEWS.more ? "פחות כתבות" : `עוד ${Math.min(30, shown.length) - 7} כתבות`}</button></div>` : ""}`}</section>`);

  // ---- the injury report: league players only, mine first ----
  const injRows = [];
  Object.entries(ESPN.inj || {}).forEach(([n, e]) => { const id = idByName(n); if (id && own.has(id)) injRows.push({id, e, k: who(id)}); });
  const ord = {me: 0, opp: 1, lg: 2};
  injRows.sort((a, b) => (ord[a.k] - ord[b.k]) || (new Date(b.e.date) - new Date(a.e.date)));
  html.push(`<section class="blk s3 paper" aria-label="פציעות בליגה"><div class="bh"><h2>פציעות בליגה</h2><span class="meta">${injRows.length} שחקנים</span></div>
    ${injRows.slice(0, NEWS.injMore ? 40 : 7).map(({id, e, k}) => { const s = ESPN_ST[e.status] || [e.status, "q"], u = own.get(id);
      return `<div class="ij">${hsI(id, 30)}<div style="min-width:0"><b>${nameLink(pOf(id))}</b><div class="ow" style="--c:${col(u)}"><i></i>${esc(tName(D, u))}${k === "me" ? " · שלך" : k === "opp" ? " · היריב" : ""}</div><p dir="auto">${esc(e.short || "")}</p>${e.ret ? `<div class="bk">${retTxt(e.ret)}</div>` : ""}</div><span class="chip ${s[1] === "out" ? "red" : s[1] === "ok" ? "" : "amb"}">${esc(s[0])}</span></div>`; }).join("")
      || `<p class="mut">${ESPN.inj ? "אין פצועים בסגלים של הליגה." : "טוען את דוח הפציעות"}</p>`}
    ${injRows.length > 7 ? `<div style="text-align:center;margin-top:10px"><button class="btn" onclick="NEWS.injMore=!NEWS.injMore;renderNews()">${NEWS.injMore ? "פחות" : `עוד ${injRows.length - 7} פצועים`}</button></div>` : ""}</section>`);

  // ---- moves: the league (Sleeper) or the NBA (ESPN) ----
  const TF = NEWS.txF || "nba";   // NBA first, as in design/news.html: the league moves are a short list, and they also have their own block in "הליגה שלנו"
  const rOwner = rid => (D.rosters.find(r => r.roster_id === rid) || {}).owner_id;
  const lgTx = [...D.tx].filter(t => t.status === "complete").sort((a, b) => b.created - a.created).slice(0, 10), nbaTx = (NEWS.tx || []).slice(0, 14);
  const lgRows = lgTx.map(t => { const adds = Object.entries(t.adds || {}), drops = Object.entries(t.drops || {}), u = rOwner((adds[0] || drops[0] || [])[1] || (t.roster_ids || [])[0]), d = new Date(t.created);
    return `<div class="tx2">${uAvI(D, u, 20)}<span><b>${esc(tName(D, u))}</b> ${adds.map(([p]) => `+${esc(pOf(p).n)}`).join(", ")}${drops.length ? ` <span class="dim">${drops.map(([p]) => `−${esc(pOf(p).n)}`).join(", ")}</span>` : ""}</span><em>${d.getDate()}.${d.getMonth() + 1}</em></div>`; }).join("");
  const nbaRows = nbaTx.map(t => { const tm = t.team || {}, ab = ESPN_TEAM[tm.abbreviation] || tm.abbreviation || "";
    return `<div class="tx2">${tlI(ab)}<span dir="ltr" style="text-align:right">${esc(t.description)}</span><em>${agoTxt(t.date)}</em></div>`; }).join("");
  html.push(`<section class="blk s3 paper" aria-label="מהלכים"><div class="bh"><h2>מהלכים</h2><span class="sp"></span><div class="seg"><button class="${TF === "lg" ? "on" : ""}" onclick="NEWS.txF='lg';renderNews()">ליגה <span class="dim">${lgTx.length}</span></button><button class="${TF === "nba" ? "on" : ""}" onclick="NEWS.txF='nba';renderNews()">NBA <span class="dim">${nbaTx.length}</span></button></div></div>
    ${(TF === "lg" ? lgRows : nbaRows) || `<p class="mut">${TF === "lg" ? "אין מהלכים בשבועיים האחרונים." : NEWS.tx ? "אין עסקאות אחרונות." : "טוען"}</p>`}</section>`);

  // ---- next week: who plays four times ----
  const nw = D.week + 1, ng = SEA.sch.games.filter(g => g.week === nw);
  if (ng.length) {
    const cnt = {}; ng.forEach(g => [g.home.team, g.away.team].forEach(t => { cnt[t] = (cnt[t] || 0) + 1; }));
    const mine = [...X.me.st.filter(Boolean), ...X.me.bench].map(x => ({x, n: cnt[x.team] || 0})).sort((a, b) => b.n - a.n || b.x.m - a.x.m);
    const four = Object.entries(cnt).filter(([, n]) => n >= 4).map(([t]) => t).sort();
    const faFour = X.fa.list.filter(f => four.includes(f.team) && !isOut(f.inj)).sort((a, b) => b.gain - a.gain).slice(0, 4);
    const dates = [...new Set(ng.map(g => g.date))].sort(), hist = [1, 2, 3, 4].map(k => mine.filter(m => m.n === k).length), mxH = Math.max(1, ...hist);
    const byN = [4, 3, 2, 1].map(k => [k, Object.values(cnt).filter(n => n === k).length]).filter(([, n]) => n), mxF = Math.max(0.1, ...faFour.map(f => f.gain));
    html.push(`<section class="blk s4 paper" aria-label="השבוע הבא: הסגל שלך"><div class="bh"><h2>השבוע הבא: הסגל שלך</h2><span class="meta">שבוע ${nw} · <bdi dir="ltr">${fmtShort(dObj(dates[0]))}–${fmtShort(dObj(dates[dates.length - 1]))}</bdi></span></div>
      <div class="hist">${hist.map((n, k) => `<div><span class="n${n ? "" : " dim"}"${k === 3 && n ? ` style="color:var(--me-tx)"` : ""}>${n}</span><i style="height:${n ? Math.max(6, n / mxH * 104) : 3}px;background:${k === 3 ? "var(--me)" : n ? "var(--tx3)" : "var(--s4)"}"></i></div>`).join("")}</div>
      <div class="hl2"><span>משחק אחד</span><span>2 משחקים</span><span>3 משחקים</span><span>4 משחקים</span></div>
      <div class="faces">${mine.map(m => `<span class="${m.n >= 4 ? "four" : ""}" title="${esc(m.x.p.n)} · ${esc(m.x.team)}"><img src="${img(m.x.id)}" alt="">${m.n}</span>`).join("")}</div>
      <div class="note">ב-Lock-in כל משחק נוסף הוא עוד הזדמנות לנעילה טובה.</div></section>`);
    html.push(`<section class="blk s4 paper" aria-label="משחקים לכל קבוצה"><div class="bh"><h2>קבוצות עם 4 משחקים</h2><span class="meta">שבוע ${nw}</span></div>
      ${four.length ? `<div class="lgs">${four.map(t => `<div>${tlI(t)}${esc(t)}</div>`).join("")}</div>` : `<p class="mut">אין קבוצה עם 4 משחקים.</p>`}
      <div class="cnts">${byN.map(([k, n]) => `<div class="${k === 4 ? "on" : ""}"><span class="n">${n}</span><small>${n === 1 ? "קבוצה" : "קבוצות"} עם ${k}</small></div>`).join("")}</div></section>`);
    html.push(`<section class="blk s4 paper" aria-label="פנויים מהקבוצות עם 4"><div class="bh"><h2>פנויים מהקבוצות עם 4</h2><span class="meta">${X.fa.worst ? `מול ${esc(X.fa.worst.p.n)}` : ""}</span></div>
      ${faFour.map(f => `<div class="fa"><span class="pa">${hsI(f.p.id, 32)}${tlI(f.team)}</span><div class="tx"><b>${nameLink(f.p)}</b><small>${esc(f.team)} · ${f1(f.val)} לשבוע · 4 משחקים</small></div><span class="bar" style="width:64px"><i style="width:${(Math.max(0, f.gain) / mxF * 100).toFixed(0)}%;background:var(--good-tx)"></i></span><span class="gain">${f.gain >= 0 ? "+" : "−"}${f1(Math.abs(f.gain))}</span></div>`).join("") || `<p class="mut">אין שחקן פנוי שמשתלם מהקבוצות האלה.</p>`}
      <div class="note">פער = ערך שבועי מעל השחקן הכי חלש אצלך.</div></section>`);
  }
  out.innerHTML = html.join("");
}

// QA only (?diag=1): writes the overflow measurements into the page, read back with chrome --dump-dom. Removed after QA.
if (SQ.get("diag")) setTimeout(() => {
  const de = document.documentElement, W = de.clientWidth, out = [];
  document.querySelectorAll(".sx:not([hidden]) *").forEach(el => { const cw = el.clientWidth;
    if (cw > 0 && el.scrollWidth > cw + 4 && getComputedStyle(el).overflowX === "visible") out.push(`${el.tagName}.${typeof el.className === "string" ? el.className : ""} sw${el.scrollWidth} cw${cw}`); });
  const v = document.querySelector(".sx:not([hidden]) .cnt");
  const big = []; document.querySelectorAll(".sx:not([hidden]) .cnt *").forEach(el => { const r = el.getBoundingClientRect(), pr = el.parentElement.getBoundingClientRect(); if (r.width > pr.width + 6 && pr.width > 0) big.push(`${el.tagName}.${typeof el.className === "string" ? el.className : ""} w${Math.round(r.width)} parent ${el.parentElement.tagName}.${el.parentElement.className} w${Math.round(pr.width)}`); });
  const res = {big: big.slice(0, 12), sw: de.scrollWidth, cw: W, cols: v && getComputedStyle(v).gridTemplateColumns, blocks: v ? [...v.children].map(b => `${b.getAttribute("aria-label") || b.className} ${Math.round(b.getBoundingClientRect().width)}`) : [], wide: out.slice(0, 14)};
  document.body.insertAdjacentHTML("beforeend", `<pre id="diag">${esc(JSON.stringify(res))}</pre>`);
}, 12000);


// ---------- the player card in season (25.10.2026, design/sketches-card.html, tidied the same evening) ----------
// A dark band on top (photo, name, the weekly value as the hero, six numbers), a paper body below (games and points breakdown,
// like the lists on the other screens), and the actions at the bottom. No page scroll. On a phone three tabs (summary, games,
// forecast). The accent follows whose player it is: lime for a free agent, orange for yours, white for another team's.
// The draft keeps its old card: openCard in app.html calls this one only in season.
let CARDT = "sum";
// a player's photo (the 300x201 cut-out) in a rounded frame; the team's logo in its corner
const pfr = (id, w, h, team, cls = "") => `<span class="pf ${cls}" style="width:${w}px;height:${h}px"><img src="${PF(id)}" alt="" onerror="this.style.visibility='hidden'">${team ? tlI(team, Math.min(22, Math.max(14, Math.round(Math.min(w, h) / 5)))) : ""}</span>`;
function cardTab(k){
  CARDT = k; $("card").dataset.tab = k;
  document.querySelectorAll("#card .cd-tabs button").forEach(b => b.classList.toggle("on", b.dataset.k === k));
}
function openCardSeason(id){
  const p = PMAP.get(id); if (!p) return;
  const dlg = $("card"), X = seasonState(), D = X && X.D, team = teamOf(id) || p.t;
  const mine = X && X.me ? [...X.me.st, ...X.me.bench, ...X.me.ir].some(x => x && x.id === id) : false;
  const owner = D && !mine ? D.rosters.find(r => (r.players || []).includes(id) || (r.reserve || []).includes(id)) : null;
  const fa = X && X.fa && !mine && !owner ? X.fa.list.find(x => x.p.id === id) : null, worst = X && X.fa && X.fa.worst;
  dlg.classList.add("sx", "cd2"); dlg.dataset.tab = CARDT; dlg.dataset.who = mine ? "mine" : fa ? "fa" : "other";
  const inj = injOf(id), G = X && X.Wm.byTeam[team] ? X.Wm.byTeam[team] : [], val = adj(p);
  const chips = [mine ? `<span class="chip me">בסגל שלך</span>` : owner ? `<span class="chip">אצל ${esc(tName(D, owner.owner_id))}</span>` : X ? `<span class="chip fa">שחקן פנוי</span>` : "",
    inj ? `<span class="chip ${isOut(inj) ? "red" : "amb"}">${esc(injTxt(inj))}</span>` : "",
    D && G.length ? `<span class="chip">שבוע ${D.week}: ${G.length} משחקים</span>` : ""].join("");
  const diff = fa && worst ? val - adj(worst.p) : null;
  const gap = diff != null ? `<div class="gap ${diff >= 0 ? "gup" : "gdn"}">פער ${sg(diff)} מול ${esc(worst.p.n)}</div>` : `<div class="gap"></div>`;
  const parts = p.pl ? CAT.map(([k, nm]) => [nm, (p.pl[k] || 0) * (SC[k] || 0)]) : [];
  const toPts = p.pl ? (p.pl.to || 0) * (SC.to || 0) : 0, pos = parts.reduce((a, x) => a + x[1], 0), other = Math.max(0, p.fpg - pos - toPts);
  if (other > 0.5) parts.push(["בונוסים", other]);
  const sum = parts.reduce((a, x) => a + x[1], 0) || 1, top = Math.max(...parts.map(x => x[1]), 1);
  const bd = parts.sort((a, b) => b[1] - a[1]).map(([nm, v]) => `<div class="cd-bd"><span>${nm}</span><span class="bar"><i style="width:${(v / top * 100).toFixed(1)}%"></i></span><span class="v">${Math.round(v / sum * 100)}%</span></div>`).join("")
    + (toPts ? `<div class="cd-bd neg"><span>איבודים</span><span class="bar"><i style="width:${Math.min(100, Math.abs(toPts) / top * 100).toFixed(1)}%"></i></span><span class="v">−${f1(Math.abs(toPts))}</span></div>` : "");
  const line = (lbl, l, dim) => l ? `<tr><td class="${dim ? "dim" : ""}">${lbl}</td>${["pts", "reb", "ast", "stl", "blk", "to", "tpm", "min"].map(k => `<td class="num ${dim ? "dim" : ""}">${f1(l[k] || 0)}</td>`).join("")}</tr>` : "";
  const sub = [`<span>${esc(team || "FA")}</span>`, (p.pos || []).length ? `<span class="pos">${esc(p.pos.join("/"))}</span>` : "",
    p.num != null ? `#${esc(p.num)}` : "", p.age ? `גיל ${p.age}` : "", p.ht ? `<span class="n">${esc(p.ht)}</span> מ'` : "", p.wt ? `<span class="n">${esc(p.wt)}</span> ק"ג` : ""].filter(Boolean).join(" · ");
  // this week's games of his team: played (his score against the forecast), live, or still to come
  const mst = (X && X.Wm.st[id]) || {};
  const wk = G.map(g => { const fp = mst[g.date];
    const body = g.done ? (fp != null ? `<b class="n ${fp >= p.fpg * 1.15 ? "hi" : fp <= p.fpg * 0.8 ? "lo" : ""}">${f1(fp)}</b>` : `<span class="dim">לא שיחק</span>`) : g.live ? `<b class="lv">חי</b>` : `<span class="dim">עוד לא</span>`;
    return `<div class="${g.today ? "td" : ""}"><small>${dLbl(g.date)}</small><span dir="ltr">${g.home ? "" : "@"}${esc(g.opp)}</span>${body}</div>`; }).join("");
  const wkBox = wk ? `<h6>המשחקים השבוע <span>הציון מול התחזית</span></h6><div class="cd-wk">${wk}</div>` : "";
  const av = Math.round((p.av ?? 0.85) * 100), avc = av >= 85 ? "good" : av >= 70 ? "amb" : "bad";
  $("cardBody").innerHTML = `
    <div class="cd-top">
      <div class="cd-h">${pfr(id, 112, 112, team)}
        <div class="cd-t"><div class="cd-nm">${esc(p.n)}<span class="cd-vmini n">${f1(val)}</span></div>
          <div class="cd-meta">${team && team !== "FA" ? tlI(team) : ""}${sub}</div><div class="cd-chips">${chips}</div></div>
        <button class="cd-x" type="button" aria-label="סגירה" onclick="$('card').close()">${IC.x}</button></div>
      <div class="cd-hero">
        <div class="cd-hv"><small>ערך שבועי</small><span class="n">${f1(val)}</span>${gap}</div>
        <div class="cd-strip">
          <div><small>תחזית למשחק</small><span class="n">${f1(p.fpg)}</span></div>
          <div><small>תקרה (10% הטובים)</small><span class="n">${p.p90 ? f1(p.p90) : "—"}</span></div>
          <div><small>זמינות צפויה</small><span class="n ${avc}">${av}%</span></div>
          <div><small>דקות צפויות</small><span class="n">${p.min ? f1(p.min) : "—"}</span></div>
          <div><small>עונה שעברה</small><span class="n">${p.fpgL ? f1(p.fpgL) : "—"}</span><em>${p.gpL || 0} משחקים</em></div>
          <div><small>ADP · דירוג מודל</small><span class="n"><bdi dir="ltr">${p.adp ? f1(p.adp) : "—"} · ${p.rk ?? "—"}</bdi></span></div></div></div></div>
    <div class="cd-tabs" role="tablist">${[["sum", "סיכום"], ["games", "משחקים"], ["proj", "תחזית"]].map(([k, t]) => `<button role="tab" data-k="${k}" class="${k === CARDT ? "on" : ""}" onclick="cardTab('${k}')">${t}</button>`).join("")}</div>
    <div class="cd-sumwrap">${wkBox}<div id="cdSum"></div></div>
    <div class="cd-body paper">
      <section class="cd-c" data-p="games"><div id="cdHist"></div></section>
      <section class="cd-c" data-p="proj">
        <div class="cd-wkd">${wkBox}</div>
        ${parts.length ? `<h6>מאיפה הנקודות <span>תחזית למשחק</span></h6><div>${bd}</div>` : ""}
        <h6>שורה סטטיסטית למשחק</h6>
        <table class="cd-t"><tr><th></th><th class="num">נק'</th><th class="num">ריב'</th><th class="num">אס'</th><th class="num">חט'</th><th class="num">חס'</th><th class="num">איב'</th><th class="num">3</th><th class="num">דק'</th></tr>${line("תחזית", p.pl)}${line("עונה שעברה", p.ll, true)}</table>
        ${calcHtml(p)}</section></div>
    <div class="cd-f paper"><button class="btn lt" type="button" onclick="toggleStar('${id}')">${xi("star", 14)}${isStar(id) ? "ברשימת המעקב" : "לרשימת המעקב"}</button><span class="sp"></span>
      <a class="btn ${fa ? "lime" : ""}" href="${SLEEPER_URL}" target="_blank" rel="noopener">${fa ? "להחתים ב-Sleeper" : "Sleeper"} ${xi("ext", 13)}</a></div>`;
  if (!dlg.open) dlg.showModal();
  dlg.setAttribute("tabindex", "-1"); dlg.focus({preventScroll: true});     // the first button would take the focus ring
  cardLog(p);
}
// the game log, pulled from Sleeper when the card opens: this season or last
async function cardLog(p, season){
  const box = $("cdHist"), sumBox = $("cdSum");
  if (!box) return;
  const cur = String((SEA.d && SEA.d.season) || new Date().getFullYear()), prev = String(+cur - 1);
  CARDH.pid = p.id;
  box.innerHTML = `<div class="cd-skel"></div>`;
  let logs;
  try { logs = await Promise.all([playerLog(p.id, cur), playerLog(p.id, prev)]); }
  catch (e) { if (CARDH.pid === p.id) box.innerHTML = `<p class="dim">לא הצלחתי למשוך את המשחקים מ-Sleeper (${esc(String(e.message || e))}).</p>`; return; }
  if (CARDH.pid !== p.id || !$("card").open) return;
  const [now, last] = logs;
  const sel = season || (now.length ? cur : prev), games = sel === cur ? now : last;
  CARDH.season = sel;
  const head = `<h6>היסטוריית נקודות <span>בניקוד של הליגה</span><span class="sp"></span><span class="seg">${[[cur, `העונה (${now.length})`], [prev, `עונה שעברה (${last.length})`]].map(([s, t]) =>
    `<button class="${s === sel ? "on" : ""}" onclick="cardLog(PMAP.get('${p.id}'), '${s}')">${t}</button>`).join("")}</span></h6>`;
  if (!games.length) { box.innerHTML = `${head}<p class="dim" style="margin:10px 0 0">${sel === cur ? "עוד לא שיחק העונה." : "לא שיחק בעונה הזאת."}</p>`; if (sumBox) sumBox.innerHTML = ""; return; }
  const fps = games.map(g => g.fp), avg = mean(fps), isCur = sel === cur && p.fpg, ref = isCur ? p.fpg : avg;
  const tp = Math.max(...fps, ref) || 1, best = Math.max(...fps), above = fps.filter(v => v >= ref).length;
  const wd = s => `${WD[dObj(s).getUTCDay()]}' ${dObj(s).getUTCDate()}.${dObj(s).getUTCMonth() + 1}`;
  // orange: at or above the forecast (the best game darker), grey: below it
  const bars = games.map(g => `<i class="${g.fp === best ? "top" : g.fp >= ref ? "up" : ""}" style="height:${Math.max(3, g.fp / tp * 100).toFixed(1)}%" title="${wd(g.date)} · ${g.away ? "@" : "vs "}${esc(g.opp)} · ${f1(g.fp)}"></i>`).join("");
  const refTxt = isCur ? `התחזית למשחק (${f1(ref)})` : `הממוצע (${f1(ref)})`;
  const chart = `<div class="cd-chart" style="--g:${games.length > 12 ? 4 : games.length > 6 ? 10 : 24}px"><div class="cd-bars">${bars}</div><span class="cd-ref" style="bottom:calc(22px + (100% - 28px) * ${(ref / tp).toFixed(3)})" title="${refTxt}"><span>קו מקווקו = ${refTxt}</span></span>
    <div class="cd-ax"><span>${wd(games[0].date)}</span><span>${wd(games[games.length - 1].date)}</span></div></div>`;
  const strip = `<div class="cd-sum"><div><small>ממוצע</small><span class="n">${f1(avg)}</span></div><div><small>הכי טוב</small><span class="n">${f1(best)}</span></div><div><small>משחקים</small><span class="n">${games.length}</span></div><div><small>${isCur ? "מעל התחזית" : "מעל הממוצע"}</small><span class="n ${above / games.length >= 0.5 ? "good" : "amb"}">${above}/${games.length}</span></div></div>`;
  const rows = games.slice(-8).reverse().map(g => { const st = g.s, c = g.fp >= ref * 1.15 ? "hi" : g.fp <= ref * 0.8 ? "lo" : "";
    return `<tr><td>${wd(g.date)}</td><td dir="ltr">${g.away ? "@" : ""}${esc(g.opp)}</td><td class="num">${Math.round(g.min)}</td>${["pts", "reb", "ast"].map(k => `<td class="num">${st[k] || 0}</td>`).join("")}<td class="num hide-sm">${st.stl || 0}</td><td class="num hide-sm">${st.blk || 0}</td><td class="num hide-sm">${st.to || 0}</td><td class="num sc2 ${c}"><b>${f1(g.fp)}</b></td></tr>`; }).join("");
  box.innerHTML = `${head}${chart}${strip}
    <div class="cd-log"><table class="cd-t"><tr><th>תאריך</th><th>יריב</th><th class="num">דק'</th><th class="num">נק'</th><th class="num">ריב'</th><th class="num">אס'</th><th class="num hide-sm">חט'</th><th class="num hide-sm">חס'</th><th class="num hide-sm">איב'</th><th class="num">ניקוד</th></tr>${rows}</table></div>
    ${games.length > 8 ? `<p class="note">8 המשחקים האחרונים בטבלה. בגרף כל ${games.length}.</p>` : ""}`;
  // the phone's summary tab: the same numbers without the table
  if (sumBox) sumBox.innerHTML = `${strip.replace("cd-sum", "cd-sum cd-sum3")}${chart.replace("cd-chart", "cd-chart cd-mini")}`;
}
