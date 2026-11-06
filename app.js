// Six Pack 26/27 · the new season screens (24.10.2026, design/*.html). Loaded by app.html after season.js and news.js:
// the functions here replace their renderers; the data and the rules stay theirs (seasonState, ALR, toggleLock...).
// Colours (Nati, 24.10): you are orange, everyone else graphite, lime = act now, red/amber = injuries only.
// The look is app-light.css (02.11.2026, design/*-light.html): light by default, a dark switch in the rail, indigo = the model's numbers.

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
  // the same score as the match card (teamWeek's prov: the locks resolved here, the opponent's marks included)
  const X = op && SEA.sch ? seasonState() : null, pa = X && X.op ? X.me.prov : mp && mp.points || 0, pb = X && X.op ? X.op.prov : op && op.points || 0;
  clock.innerHTML = op ? `${uAvI(D, MY_USER_ID, 24)}<span>${esc(tName(D, MY_USER_ID))}</span><b class="n me">${f1(pa)}</b><span>:</span><b class="n op">${f1(pb)}</b><span>${esc(tName(D, oppUid))}</span>${uAvI(D, oppUid, 24)}${SEA.win != null ? `<span class="pc">${Math.round(SEA.win * 100)}%</span>` : ""}` : "";
  const ago = Math.round((Date.now() - SEA.at) / 60000);
  chip.innerHTML = `<i class="sdot ${SEA.loading ? "busy" : SEA.err ? "bad" : ""}"></i>${SEA.loading ? "מעדכן" : SEA.err ? `הרענון נכשל · מוצגים נתונים מלפני ${ago} דק׳` : ago ? `עודכן לפני ${ago} דק'` : "עודכן עכשיו"}`;
}

// a lock of another team's player, marked by hand: the date of the game he locked, a second press takes it back. A lock
// Sleeper already counts (not marked here) is cancelled with false, as for your own players. This browser only, no phone.
function toggleOppLock(id, date){
  const X = seasonState(), w = X && X.myR && X.D.week; if (!w) return;
  const x = X.D.rosters.filter(r => r.owner_id !== MY_USER_ID).map(r => teamWeek(X.D, X.Wm, r))
    .flatMap(T => [...T.st, ...T.bench, ...T.ir]).filter(Boolean).find(y => y.id === id);
  if (!x || !x.played.some(g => g.date === date)) return;
  S.locks = S.locks || {}; const wk = S.locks[w] = S.locks[w] || {};
  if (wk[id] === date) delete wk[id];
  else if (x.locked && x.lockedOn === date) wk[id] = false;
  else wk[id] = date;
  save(); refreshAlerts(); rerenderSeason();
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

  // ---- the match: before the first game the big number is the projection (0.0 says nothing), after it what counts now ----
  if (op) {
    const pw = SEA.win, live = [...me.st, ...op.st].some(x => x && x.g.some(g => g.live));
    const started = [...me.st, ...op.st].some(x => x && x.played.length);
    const dots = T => T.st.map((x, i) => `<i class="${x && x.locked ? "on" : ""}" title="${SLOTS[i]}${x ? ` · ${esc(x.p.n)}${x.locked ? ` · נעול ${f1(x.pts || 0)}` : ""}` : ""}"></i>`).join("");
    const team = (T, R, uid, mine) => `<div class="lt ${mine ? "me" : "op"}">
        <div class="lth">${mine ? uAvI(D, uid, 60) : ""}<div><b>${esc(tName(D, uid))}</b><small>${mine ? "אתה · " : ""}${recOf(R)} · מקום ${rankOf(D, R.roster_id)}</small></div>${mine ? "" : uAvI(D, uid, 60)}</div>
        <div class="lbig n${started ? "" : " model"}" title="${started ? "אם השבוע היה נגמר עכשיו: הנעולים ועוד המשחק האחרון של כל פותח" : "צפי לסוף השבוע"}">${f1(started ? T.prov : T.exp)}</div>
        <div class="ldots">${dots(T)}<small>נעול ${T.nLocked} מתוך ${SLOTS.length}</small></div></div>`;
    const dayCell = (T, d) => {
      const pts = T.st.filter(x => x && countedOn(x) === d).reduce((a, x) => a + (x.pts || 0), 0);
      if (d >= today) { const n = T.st.filter(x => x && !x.locked && x.g.some(g => g.date === d && !g.done)).length;
        if (n) return `<td class="gm${d === today ? " td" : ""}">${pts ? `<span class="n">${f1(pts)}</span> · ` : ""}${n} משחקים</td>`; }
      return `<td class="${pts ? "n" : "z"}${d === today ? " td" : ""}">${pts ? f1(pts) : "·"}</td>`;
    };
    const qrow = (T, uid) => `<tr><td><span class="tn"><i style="background:${uid === MY_USER_ID ? "var(--me)" : "var(--op)"}"></i>${esc(tName(D, uid))}</span></td>${dates.map(d => dayCell(T, d)).join("")}<td class="n tot">${f1(T.prov)}</td></tr>`;
    const gap = me.exp - op.exp;
    html.push(`<section class="blk lm" aria-label="המאץ'"><div class="bh"><h2>המאץ'</h2><span class="meta">שבוע ${D.week} · מול ${esc(tName(D, op.uid))} · ${started ? "אם השבוע היה נגמר עכשיו" : "צפי לסוף השבוע"}</span><span class="sp"></span>${live ? `<span class="chip live"><i></i>חי</span>` : started ? "" : `<span class="chip">עוד לא התחיל</span>`}</div>
      <div class="lsb">${team(me, myR, MY_USER_ID, true)}
        <div class="lmid"><small>סיכוי לנצח</small><span class="n lpct">${Math.round(pw * 100)}%</span><div class="lsplit"><i style="width:${(pw * 100).toFixed(1)}%"></i></div>
          ${started ? `<small>צפי לסוף השבוע</small><small class="d"><span class="n" style="color:var(--model)">${f1(me.exp)} : ${f1(op.exp)}</span></small>` : `<small>צפי לסוף השבוע</small><small class="d">בינתיים <span class="n">${f1(me.prov)} : ${f1(op.prov)}</span></small>`}</div>
        ${team(op, oppR, op.uid, false)}</div>
      <div class="lstrip"><div><small>פער בצפי</small><span class="n ${gap >= 0 ? "pos" : "neg"}">${gap >= 0 ? "+" : "−"}${f1(Math.abs(gap))}</span></div><div><small>משחקים שנשארו</small><span class="n">${me.nLeft} : ${op.nLeft}</span></div><div><small>משחקים היום</small><span class="n">${me.nToday} : ${op.nToday}</span></div><div><small>נעולים</small><span class="n">${me.nLocked} : ${op.nLocked}</span></div></div>
      ${started ? `<div class="tsc lq"><table class="qt"><thead><tr><th>מאיפה הנקודות</th>${dates.map(d => `<th class="${d === today ? "td" : ""}">${WD[dObj(d).getUTCDay()]}' ${dObj(d).getUTCDate()}${d === today ? " · היום" : ""}</th>`).join("")}<th>סה"כ</th></tr></thead><tbody>${qrow(me, MY_USER_ID)}${qrow(op, op.uid)}</tbody></table></div>` : ""}</section>`);
  } else html.push(`<section class="blk lm"><div class="bh"><h2>המאץ'</h2></div><p class="mut">אין מאץ'אפ לשבוע ${D.week} עדיין.</p></section>`);

  // ---- the next thing to do (lime) ----
  const alerts = openAlerts(), first = alerts[0];
  if (first) {
    const due = first.due, slot = /^empty\|\d+\|(\d+)$/.exec(first.id);
    let art = "", txt = strip(first.body).slice(0, 120), cls = "";
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
    const when = due ? `<div class="lwhen"><div><div class="k">${due.live ? "המשחק כבר התחיל" : "עד"}</div><div class="n">${esc(due.txt)}</div></div>${!due.live && due.t > Date.now() ? `<div><div class="k">עוד</div><div class="n" data-cd="${due.t}">${cdTxt(due.t)}</div></div>` : ""}</div>` : "";
    const acts = `<div class="acts">${aActs(first, "")}<a class="btn g" href="${SLEEPER_URL}" target="_blank" rel="noopener">Sleeper${xi("ext", 12)}</a></div>`;
    html.push(`<section class="blk nx${cls}" aria-label="הדבר הבא"><div class="bh"><h2>הדבר הבא</h2><span class="sp"></span>${alerts.length > 1 ? `<a href="#q" onclick="document.getElementById('q').scrollIntoView({behavior:'smooth',block:'center'});return false">ועוד ${alerts.length - 1} בתור</a>` : ""}</div>
      ${first.pid && !cls ? `<div class="lnxr"><div><h3>${strip(first.title)}</h3><p>${txt}</p>${when}${acts}</div><img src="${PF(first.pid)}" alt="" onerror="this.remove()"></div>` : `<h3>${strip(first.title)}</h3><p>${txt}</p>${art}${when}${acts}`}</section>`);
  } else {
    const T = ALR.tonight, r0 = T && T.rows.find(r => r.tip);
    html.push(`<section class="blk nx" aria-label="הדבר הבא"><div class="bh"><h2>הדבר הבא</h2></div><div class="lnxr"><div><h3>הכל מסודר</h3>
      <p>${T ? `אין מה לנעול או להחליף כרגע. ${T.rows.length} שחקנים שלך משחקים ב-${dLbl(T.day)}.` : "אין לך עוד משחקים השבוע."}</p>
      ${r0 ? `<div class="lwhen"><div><div class="k">המשחק הבא</div><div class="n">${ilTime(r0.tip.t, false)}</div></div><div><div class="k">עוד</div><div class="n" data-cd="${r0.tip.t}">${cdTxt(r0.tip.t)}</div></div></div>` : ""}</div>${r0 ? `<img src="${PF(r0.x.id)}" alt="" onerror="this.remove()">` : ""}</div></section>`);
  }
  // the queue stands alone only when there is one: an empty block of 599×848 was the first finding of the redesign
  if (alerts.length > 1) {
    const n1 = alerts.filter(a => a.pri === 1).length, n2 = alerts.filter(a => a.pri === 2).length;
    html.push(`<section class="blk s12" id="q" aria-label="מה לעשות עכשיו"><div class="bh"><h2>מה לעשות עכשיו</h2>${n1 ? `<span class="chip red">${n1} דחופים</span>` : ""}${n2 ? `<span class="chip amb">${n2} לבדוק</span>` : ""}<span class="sp"></span>${lockSyncChip()}</div>${aGroups(alerts.slice(1))}</section>`);
  }

  // ---- tonight: a card for each game with your players, Israel time ----
  const T = ALR.tonight;
  if (T) {
    const games = {};
    const add = (x, mine) => { const g = x.g.find(y => y.date === T.day && !y.done); if (!g) return;
      const home = g.home ? x.team : g.opp, away = g.home ? g.opp : x.team, k = away + "@" + home;
      const G = games[k] || (games[k] = {away, home, tip: tipOf(x.team, T.day), me: [], op: []}); (mine ? G.me : G.op).push(x); };
    all.forEach(x => add(x, true)); oppAll.forEach(x => add(x, false));
    const note = x => x.locked ? `נעול על ${f1(x.pts || 0)}` : outIds.has(x.id) ? "לספסל הלילה" : insIds.has(x.id) ? "להכניס להלילה" : !stIds.has(x.id) ? (isOut(x.inj) ? injTxt(x.inj) : "לא נספר")
      : isOut(x.inj) ? injTxt(x.inj) : x.act === "lock" ? `לנעול לפני המשחק · ${f1(x.lastFp)}` : x.left.length >= 2 ? `לנעול מעל <span class="n" style="font-weight:700;color:var(--tx)">${f1(x.V[x.left.length - 1])}</span>` : "המשחק האחרון: הוא נספר";
    const rows = Object.values(games).sort((a, b) => ((a.tip ? a.tip.t : 9e15) - (b.tip ? b.tip.t : 9e15)) || (b.me.length - a.me.length));
    const mineR = rows.filter(G => G.me.length), firstG = mineR.find(G => !G.tip || G.tip.state !== "in");
    const shown = SEA.wkAllG ? mineR : mineR.slice(0, 5);
    const myOn = T.rows.filter(r => r.start).length, opOn = op ? op.st.filter(x => x && x.g.some(g => g.date === T.day && !g.done)).length : 0;
    const startedG = rows.filter(G => G.me.some(x => stIds.has(x.id))).length;
    const espn = TIP[T.day] ? TIP[T.day].games : [];
    const rec = (team) => { const g = espn.find(y => y.away.team === team || y.home.team === team); return g ? ((g.away.team === team ? g.away : g.home).rec || "") : ""; };
    const mineRow = x => { const i = me.st.indexOf(x), sl = i >= 0 ? SLOTS[i] : me.ir.includes(x) ? "IR" : "ספסל", bench = i < 0;
      return `<div class="lmine${bench ? " bn" : ""}${isOut(x.inj) ? " out" : ""}">${hsI(x.id, 40)}<div><b>${esc(surname(x.p.n))} · ${sl}</b><small>${note(x)}</small></div></div>`; };
    const card = G => { const isLive = G.tip && G.tip.state === "in", nxt = G === firstG;
      return `<article class="lgc${nxt || isLive ? " next" : ""}"><header><span class="t n">${G.tip ? (isLive ? "חי" : ilTime(G.tip.t, false)) : "·"}</span>${isLive ? `<span class="chip live"><i></i>משחק עכשיו</span>` : nxt ? `<span class="chip now">הראשון שלך</span>` : ""}</header>
        <div class="lvs"><div class="ltt">${tlI(G.away)}<b>${esc(G.away)}</b><small class="n">${esc(rec(G.away))}</small></div><span class="at">@</span><div class="ltt">${tlI(G.home)}<b>${esc(G.home)}</b><small class="n">${esc(rec(G.home))}</small></div></div>
        ${G.me.map(mineRow).join("")}${G.op.length ? `<div class="lop"><span>יריב</span>${G.op.map(x => hsI(x.id, 24)).join("")}</div>` : ""}</article>`; };
    html.push(`<section class="blk s12" aria-label="הלילה"><div class="bh"><h2>${T.day === today ? "הלילה" : `המשחקים הבאים · ${dLbl(T.day)}`}</h2><span class="meta">שעון ישראל · ${startedG} משחקים עם מתחילים שלך · אצלך ${myOn} בהרכב, אצלו ${opOn}</span><span class="sp"></span><a href="#" onclick="setTab('news');return false">כל המשחקים ←</a></div>
      ${shown.length ? `<div class="lgcs">${shown.map(card).join("")}</div>` : `<p class="mut">אין לך שחקנים במשחקים של ${dLbl(T.day)}.</p>`}
      ${mineR.length > 5 ? `<div style="text-align:center;margin-top:12px"><button class="btn" onclick="SEA.wkAllG=!SEA.wkAllG;renderWeek()">${SEA.wkAllG ? "פחות" : `עוד ${mineR.length - 5} משחקים עם שחקנים שלך`}</button></div>` : ""}</section>`);
  } else html.push(`<section class="blk s12" aria-label="הלילה"><div class="bh"><h2>הלילה</h2></div><p class="mut">אין לך עוד משחקים השבוע.</p></section>`);

  // ---- the lock board ----
  const F = S.wkF || "st";
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
    if (g.done) return `<td class="${td}"><span class="dim" style="font-size:12px">לא שיחק</span></td>`;
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
    return `<tr><td><div class="pl"><span class="sl${slot === "BN" || slot === "IR" ? " BN" : ""}">${slot}</span>${hsI(x.id, 40)}<div><b>${pName(x)}</b> ${flag}<small>${esc(x.team)}</small></div></div></td>
      ${dates.map(d => cell(x, d)).join("")}<td class="num">${f1(x.m)}</td><td class="num b">${nn(pts)}</td><td class="num pj">${nn(x.locked ? null : bar)}</td><td>${bul}</td><td>${btn}</td></tr>`;
  };
  const stRows = me.st.map((x, i) => x ? brow(x, SLOTS[i]) : "").join(""), bnRows = me.bench.map(x => brow(x, "BN")).join(""), irRows = me.ir.map(x => brow(x, "IR")).join("");
  const cols = dates.length + 6;
  html.push(`<section class="blk s12 lboard" aria-label="הלוח של השבוע">
    <div class="bh"><h2>הלוח של השבוע</h2><span class="meta">נעלת על ציון ישן? לחיצה עליו מסמנת</span><span class="sp"></span>
      <div class="lgd"><span><span class="sc k" style="min-width:26px;line-height:18px;font-size:11.5px">40</span>נעול</span><span><span class="sc av" style="min-width:26px;line-height:18px;font-size:11.5px">21</span>נספר, אפשר לנעול</span><span><i style="display:inline-block;width:2px;height:12px;background:var(--model)"></i>רף</span></div>
      <div class="seg">${[["st", "מתחילים"], ["bn", "ספסל ו-IR"], ["all", "הכל"]].map(([k, t]) => `<button class="${F === k ? "on" : ""}" onclick="S.wkF='${k}';save();renderWeek()">${t}</button>`).join("")}</div></div>
    <div class="tsc"><table class="tb"><thead><tr><th style="width:250px">שחקן</th>${dates.map(d => `<th class="${d === today ? "td" : ""}">${d === today ? `היום · ${dLbl(d)}` : dLbl(d)}<b>${cnt2(all, d)} · ${cnt2(oppAll, d)}</b></th>`).join("")}<th>למשחק</th><th>נספר</th><th>רף</th><th style="width:84px">מול הרף</th><th style="width:96px">מה לעשות</th></tr></thead>
    <tbody>${F !== "bn" ? stRows : ""}${F !== "st" ? `<tr class="sec"><td colspan="${cols}">ספסל · ${me.bench.length}</td></tr>${bnRows}${irRows ? `<tr class="sec"><td colspan="${cols}">IR</td></tr>${irRows}` : ""}` : ""}</tbody></table></div></section>`);
  // ---- the opponent's locks (06.11.2026): Sleeper's API shows his lock only once the player plays again, so a game he
  // locked is marked here by hand (toggleOppLock). Same S.locks as yours, but nothing goes to the phone ----
  if (op) {
    const oc = (x, d) => {
      const g = x.g.find(y => y.date === d), td = d === today ? "td" : "";
      if (!g) return `<td class="${td}"></td>`;
      const opp = `${g.home ? "" : "@"}${g.opp}`;
      if (g.done && g.fp != null) {
        const cls = x.lockedOn === d ? "k" : x.pending && x.pending.date === d ? "pk" : countedOn(x) === d && !x.locked ? "av" : "";
        return `<td class="${td}"><button type="button" class="sc ${cls} pick" onclick="toggleOppLock('${x.id}','${d}')" title="${x.lockedOn === d ? `נעול על המשחק הזה (${esc(opp)}). לחיצה מבטלת` : `${esc(opp)} · לחיצה: הוא נעל על המשחק הזה`}">${f1(g.fp)}</button></td>`;
      }
      if (g.done) return `<td class="${td}"><span class="dim" style="font-size:12px">לא שיחק</span></td>`;
      return `<td class="${td}"><span class="up${d === today ? " now" : ""}">${tlI(g.opp)}${esc(opp)}</span></td>`;
    };
    const orow = (x, slot) => `<tr><td><div class="pl"><span class="sl">${slot}</span>${hsI(x.id, 40)}<div><b>${pName(x)}</b> ${x.inj ? `<span class="q">${esc(injTxt(x.inj))}</span>` : ""}<small>${esc(x.team)}</small></div></div></td>
      ${dates.map(d => oc(x, d)).join("")}<td class="num b">${nn(x.pts)}</td><td>${x.locked ? `<button class="act done" onclick="toggleOppLock('${x.id}','${x.lockedOn}')" title="לחיצה מבטלת את הסימון">${xi("lock", 12)}נעול</button>` : `<span class="act off">${x.left.length ? `נשארו ${x.left.length}` : "סיים"}</span>`}</td></tr>`;
    html.push(`<section class="blk s12 lboard" aria-label="הנעילות של היריב">
      <div class="bh"><h2>הנעילות של ${esc(tName(D, op.uid))}</h2><span class="meta">Sleeper לא מראה נעילה שלו עד שהשחקן משחק שוב. ראית ב-Sleeper שהוא נעל? לחיצה על הציון מסמנת</span></div>
      <div class="tsc"><table class="tb"><thead><tr><th style="width:250px">שחקן</th>${dates.map(d => `<th class="${d === today ? "td" : ""}">${d === today ? `היום · ${dLbl(d)}` : dLbl(d)}</th>`).join("")}<th>נספר</th><th style="width:96px">מצב</th></tr></thead>
      <tbody>${op.st.map((x, i) => x ? orow(x, SLOTS[i]) : "").join("")}</tbody></table></div></section>`);
  }

  // ---- bottom row: where you lose, swaps, injuries ----
  if (op) {
    const gaps = SLOTS.map((s, i) => { const a = me.st[i] ? me.st[i].exp : 0, b = op.st[i] ? op.st[i].exp : 0; return {s, a, b, d: a - b, i}; });
    const list = SEA.wkHH ? gaps : [...gaps].sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 4);
    const tot = me.exp - op.exp;
    html.push(`<section class="blk s4" aria-label="איפה אתה מפסיד"><div class="bh"><h2>איפה אתה מפסיד</h2><span class="meta">${SEA.wkHH ? "כל המשבצות" : "הפערים הגדולים"} מול ${esc(tName(D, op.uid))}</span></div>
      <div class="lgap head"><span></span><span>הוא</span><span>אתה</span><span class="ds">הפרש</span></div>
      ${list.map(g => `<div class="lgap" title="${esc(me.st[g.i] ? me.st[g.i].p.n : "ריק")} מול ${esc(op.st[g.i] ? op.st[g.i].p.n : "ריק")}"><span class="sl">${g.s}</span><span class="n opv">${f1(g.b)}</span><span class="n">${f1(g.a)}</span><span class="n d ${g.d >= 0 ? "pos" : "neg"}">${g.d >= 0 ? "+" : "−"}${f1(Math.abs(g.d))}</span></div>`).join("")}
      <div class="note" style="display:flex;justify-content:space-between;gap:8px"><span>הפער הכולל <span class="n" style="font-weight:700">${tot >= 0 ? "+" : "−"}${f1(Math.abs(tot))}</span></span><a href="#" class="lnk" onclick="SEA.wkHH=!SEA.wkHH;renderWeek();return false">${SEA.wkHH ? "רק הגדולים" : `כל ${SLOTS.length} המשבצות`}</a></div></section>`);
  }
  const sw = bestSwaps(X, 3);
  html.push(`<section class="blk s4" aria-label="החלפות בשוק"><div class="bh"><h2>החלפות בשוק</h2><span class="meta">כמה מרוויח הסגל</span><span class="sp"></span><a href="#" onclick="setTab('fa');return false">לכל השוק ←</a></div>
    <div class="lls">${sw.length ? sw.map(s => `<div class="lli"><span class="pa">${hsI(s.c.p.id, 52)}${tlI(s.c.team)}</span><div><b>${nameLink(s.c.p)}</b><small>במקום ${esc(surname(s.d.p.n))} · ${(s.c.p.pos || []).join("/")}</small></div><span class="n lval">+${f1(s.g)}</span></div>`).join("")
      : `<p class="mut">אין כרגע הרמה ששווה ${SWAP_MIN} נקודות למשחק.</p>`}</div></section>`);
  const injRows = [...[...me.st, ...me.bench, ...me.ir].filter(Boolean).map(x => [x, true]), ...(op ? [...op.st, ...op.bench, ...op.ir].filter(Boolean).map(x => [x, false]) : [])].filter(([x]) => x.inj);
  const where = (x, mine) => { const T2 = mine ? me : op, i = T2.st.indexOf(x);
    return `${i >= 0 ? `${mine ? "בהרכב שלך" : "בהרכב שלו"} (${SLOTS[i]})` : T2.ir.includes(x) ? "IR" : "ספסל"}${x.locked ? ` · נעול ${f1(x.pts || 0)}` : ""}`; };
  const myInj = injRows.filter(r => r[1]).length;
  html.push(`<section class="blk s4" aria-label="פציעות"><div class="bh"><h2>פציעות</h2><span class="meta">${myInj} אצלך · ${injRows.length - myInj} אצל היריב</span></div>
    <div class="lls">${injRows.map(([x, mine]) => `<div class="lli"><span class="pa">${hsI(x.id, 52)}${tlI(x.team)}</span><div><b>${pName(x)}</b><small>${where(x, mine)}${x.inj.part ? ` · ${esc(x.inj.part)}` : ""}</small></div><span class="chip ${isOut(x.inj) ? "red" : "amb"}">${esc(injTxt(x.inj))}</span></div>`).join("") || `<p class="mut">אין פצועים אצלך או אצל היריב.</p>`}</div>
    <div class="note">הסטטוסים מ-Sleeper, מתעדכנים פעם בשעה.</div></section>`);
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
  const playedMinTxt = x => { const m = x.actualMin; if (!m || m.average == null) return `<span class="dim">·</span>`;
    const tip = `ממוצע דקות בפועל ב-${m.games} המשחקים האחרונים${m.baseline != null ? `; תחזית קדם העונה ${f1(m.baseline)}` : ""}. משחקי היום אינם נכללים.${m.partial ? " חסרים משחקים משבועות קודמים." : ""} חץ: עלייה של 5 דקות ומעלה אחרי 3 משחקים; לא שינוי בדירוג`;
    const diff = m.delta != null && Math.abs(m.delta) >= 1 ? ` <em class="${m.delta < 0 ? "dn" : "upn"}">(${m.delta > 0 ? "+" : "−"}${Math.round(Math.abs(m.delta))})</em>` : "";
    return `<span title="${esc(tip)}" dir="ltr">${Math.round(m.average)}${m.partial ? "*" : ""}${diff}${m.rising ? ` <em class="upn">↑</em>` : ""}</span>`; };
  const gapTxt = v => `${v >= 0 ? "+" : "−"}${f1(Math.abs(v))}`;
  const sw = bestSwaps(X, 4);
  const main = [];

  // ---- the best swap: one hero, the other swaps behind its numbers ----
  if (sw.length) {
    const i = (F.swI || 0) % sw.length, s = sw[i], c = s.c, d = s.d;
    main.push(`<section class="blk" aria-label="ההחלפה הכי טובה"><div class="bh"><h2>ההחלפה הכי טובה</h2><span class="meta">לשבוע הזה · מי נכנס ומי יוצא</span><span class="sp"></span>${sw.length > 1 ? `<div class="seg">${sw.map((_, k) => `<button class="${k === i ? "on" : ""}" onclick="SEA.fa.swI=${k};renderFA()" aria-label="החלפה ${k + 1}">${k + 1}</button>`).join("")}</div>` : ""}</div>
      <div class="lswap"><div class="lcut"><img src="${PF(c.p.id)}" alt="" onerror="this.style.visibility='hidden'">${tlI(c.team)}</div>
        <div class="linfo"><div class="lname"><b>${esc(c.p.n)}</b><span class="chip">${esc(c.team)} · ${(c.p.pos || []).join("/")}${c.p.age ? ` · גיל ${c.p.age}` : ""}</span></div>
          <div class="lstrip" style="margin-top:0"><div><small>ערך שבועי</small><span class="n mdl">${f1(c.val)}</span></div><div><small>תחזית למשחק</small><span class="n mdl">${f1(c.fc)}</span></div><div><small>בפועל</small><span class="n">${avgTxt(c.p.id)}</span></div><div><small>דקות</small><span class="n">${minTxt(c)}</span></div><div><small>השבוע</small><span class="n">${c.left}<em style="font-size:14px;color:var(--tx3)">/${c.games}</em></span></div><div><small>שבוע הבא</small><span class="n">${c.next || "·"}</span></div></div>
          <div class="lout">${hsI(d.id, 52)}<div class="tx"><small>יוצא</small><b>${esc(d.p.n)}</b><small>${esc(d.team)} · ערך ${f1(adjL(d.p))} · בפועל ${avgPlain(d.id)}</small></div><div class="lgain"><span class="n">+${f1(s.g)}</span><small>לסגל · פער בערך <span class="n" style="display:inline;font-size:13px;color:var(--tx2);font-weight:700">${gapTxt(c.val - adjL(d.p))}</span></small></div></div>
          <div class="lacts"><a class="btn w" href="${SLEEPER_URL}" target="_blank" rel="noopener">להחתים ב-Sleeper ${xi("ext", 13)}</a><button class="btn" onclick="openCard('${c.p.id}')">כרטיס שחקן</button></div></div></div></section>`);
  } else main.push(`<section class="blk"><div class="bh"><h2>אין הרמה ששווה עכשיו</h2></div><p class="mut">אף שחקן פנוי לא עדיף ב-${SWAP_MIN} נקודות למשחק על מי שהוא יחליף.${nearSwap() ? ` הכי קרוב: ${esc(nearSwap().c.p.n)}, ${gapTxt(nearSwap().gap)} למשחק מול ${esc(nearSwap().d.p.n)}.` : ""} כשמישהו ישתחרר או שתפקיד יגדל, הוא יופיע כאן.</p></section>`);

  // ---- the table: the headers sort it ----
  const q = (F.q || "").trim().toLowerCase();
  const posOk = x => F.pos === "ALL" || (x.p.pos || []).some(p => (ELIG[F.pos] || [F.pos]).includes(p));
  const list = fa.list.filter(x => posOk(x) && (!F.healthy || !isOut(x.inj)) && (!F.watch || watch.has(x.p.id)) && (!q || x.p.n.toLowerCase().includes(q)));
  const actual = x => { const s = seasonSum(x.p.id); return s ? s.avg : -1; };
  const SORTS = [["val", "ערך", x => x.val], ["gain", fa.worst ? `פער מ-${lastName(fa.worst.p.n)}` : "פער", x => x.gain], ["avg", "בפועל", actual], ["fpg", "תחזית", x => x.fc], ["left", "השבוע", x => x.left * 100 + x.val], ["min", "דקות תחזית", x => x.dMin], ["actualMin", "דקות בפועל", x => x.actualMin.partial ? -999 : (x.actualMin.delta ?? -999)], ["trend", "מוסיפים", x => x.trend]];
  const so = SORTS.find(s => s[0] === F.sort) || SORTS[1];
  // value and gap rank only players with games behind them (form.ok): one who hasn't played has no number of his own yet
  list.sort((a, b) => ((so[0] === "val" || so[0] === "gain") && b.form.ok - a.form.ok) || (F.dir || -1) * (so[2](a) - so[2](b)));
  const total = list.length, shown = list.slice(0, F.more ? 120 : 15);
  const lastTwo = id => { const s = seasonSum(id); return s && s.last.length ? `<span class="lg2">${s.last.slice(-2).map(v => `<span>${f1(v)}</span>`).join("")}</span>` : `<span class="dim" style="font-size:12px">עוד לא שיחק</span>`; };
  const star = x => `<button class="star${watch.has(x.p.id) ? " on" : ""}" onclick="toggleWatch('${x.p.id}')" aria-label="מעקב" title="${watch.has(x.p.id) ? "להוריד ממעקב" : "למעקב"}">${xi("star", 15)}</button>`;
  const pcell = x => `<div class="pl">${hsI(x.p.id, 40)}<div><b>${nameLink(x.p)}</b>${x.inj ? ` <span class="chip ${isOut(x.inj) ? "red" : "amb"}" style="line-height:18px">${esc(injTxt(x.inj))}</span>` : ""}${x.waiverUntil ? ` <span class="chip" style="line-height:18px">waivers</span>` : ""}${faWhy(x).map(t => ` <span class="chip" style="line-height:18px">${esc(t)}</span>`).join("")}<small>${esc(x.team)} · ${(x.p.pos || []).join("/")}${x.p.age ? ` · גיל ${x.p.age}` : ""}${x.trend ? ` · ${x.trend.toLocaleString("en-US")} מוסיפים` : ""}</small></div></div>`;
  const gapCell = x => x.gain > 0 ? `<span class="gpv">+${f1(x.gain)}</span>` : `<span class="gpv lo">${gapTxt(x.gain)}</span>`;
  const row = x => `<tr class="${watch.has(x.p.id) ? "hl" : ""}"><td>${star(x)}</td><td style="text-align:right">${pcell(x)}</td>
    <td class="num b">${f1(x.val)}</td><td class="num">${gapCell(x)}</td><td class="num">${avgTxt(x.p.id)}</td><td>${lastTwo(x.p.id)}</td><td class="num pj">${f1(x.fc)}</td>
    <td class="num">${x.left}<span class="dim">/${x.games}</span></td><td class="num">${x.next || "·"}</td><td class="num">${minTxt(x)}</td><td class="num">${playedMinTxt(x)}</td></tr>`;
  const th = (k, t, title) => `<th class="srt"${so[0] === k ? ` data-dir="${(F.dir || -1) < 0 ? "desc" : "asc"}"` : ""} onclick="sortFA('${k}')"${title ? ` title="${esc(title)}"` : ""}>${esc(t)}</th>`;
  const V = F.view || "t";
  const cardV = x => `<article class="lcard"><div class="hdr">${pcell(x)}${star(x)}</div><div class="r2"><span class="n">${f1(x.val)}</span><small>ערך · ${gapCell(x)} מול ${esc(fa.worst ? lastName(fa.worst.p.n) : "החלש")}</small></div><div class="r3"><span>תחזית<b>${f1(x.fc)}</b></span><span>בפועל<b>${seasonSum(x.p.id) ? f1(seasonSum(x.p.id).avg) : "·"}</b></span><span>השבוע<b>${x.left}/${x.games}</b></span><span>דקות<b>${x.wkMin ? Math.round(x.wkMin) : "·"}</b></span></div></article>`;
  main.push(`<section class="blk" aria-label="שחקנים פנויים" style="padding-bottom:10px"><div class="bh"><h2>שחקנים פנויים</h2><span class="meta"><span class="n">${total}</span>${V === "t" ? " · לחיצה על כותרת ממיינת" : ""}</span><span class="sp"></span><a href="${SLEEPER_URL}" target="_blank" rel="noopener">Sleeper ${xi("ext", 12)}</a><div class="seg"><button class="${V === "t" ? "on" : ""}" onclick="SEA.fa.view='t';renderFA()">טבלה</button><button class="${V === "c" ? "on" : ""}" onclick="SEA.fa.view='c';renderFA()">כרטיסים</button></div></div>
    <div class="ltools"><label class="lsrch">${xi("search", 15)}<input id="faQ" value="${esc(F.q || "")}" placeholder="חיפוש שחקן" oninput="faSearch(this)" aria-label="חיפוש שחקן"></label>
      <div class="seg">${["ALL", "G", "F", "C"].map(k => `<button class="${F.pos === k ? "on" : ""}" onclick="SEA.fa.pos='${k}';renderFA()">${k === "ALL" ? "הכל" : k}</button>`).join("")}</div>
      <button class="ltog${F.healthy ? " on" : ""}" onclick="SEA.fa.healthy=!SEA.fa.healthy;renderFA()">בלי פצועים</button>
      <button class="ltog${F.watch ? " on" : ""}" onclick="SEA.fa.watch=!SEA.fa.watch;renderFA()">${xi("star", 14)}רק במעקב (${watch.size})</button>
      <button class="ltog${so[0] === "trend" ? " on" : ""}" onclick="sortFA('trend')">הכי מוסיפים</button></div>
    ${V === "t" ? `<div class="tsc"><table class="tb lfa"><thead><tr><th style="width:26px"></th><th style="text-align:right">שחקן</th>${th("val", "ערך")}${th("gain", "פער", SORTS[1][1])}${th("avg", "בפועל")}<th>שני האחרונים</th>${th("fpg", "תחזית")}${th("left", "השבוע")}<th>הבא</th>${th("min", "דקות תחזית", "תחזית שבועית מול תחזית קדם העונה")}${th("actualMin", "דקות בפועל", "ממוצע עד שלושת המשחקים האחרונים. חץ מסמן עלייה של 5 דקות אחרי 3 משחקים")}</tr></thead>
      <tbody>${shown.map(row).join("") || `<tr><td colspan="11" class="dim" style="height:44px;text-align:center">אין שחקנים שמתאימים לסינון</td></tr>`}</tbody></table></div>`
      : `<div class="lcards">${shown.map(cardV).join("") || `<p class="mut">אין שחקנים שמתאימים לסינון</p>`}</div>`}
    ${total > shown.length ? `<div style="text-align:center;margin-top:10px"><button class="btn" onclick="SEA.fa.more=true;renderFA()">עוד ${total - shown.length} שחקנים</button></div>` : ""}
    <p class="note">ערך שבועי = נקודות לשבוע ב-Lock-in, מתעדכן מהמשחקים של העונה ומהדקות האחרונות, אחרי סיכון פציעה. פער = מול השחקן הכי חלש אצלך. דקות בפועל: ממוצע עד שלושת המשחקים האחרונים, ללא משחקי היום; בסוגריים ההפרש מתחזית קדם העונה. ↑ = עלייה של 5 דקות ומעלה אחרי 3 משחקים. * = נתוני עבר חסרים. הסימון אינו משנה את הדירוג.</p></section>`);
  html.push(`<div class="lstack">${main.join("")}</div>`);

  // ---- my roster, weakest first: stays beside the table while it scrolls ----
  const weak = fa.mineAll.filter(x => !x.p.stub).map(x => Object.assign(x, {form_fc: formOf(x.p).fc})).sort((a, b) => a.form_fc - b.form_fc).slice(0, 6);
  const bestFree = fa.list.filter(x => !isOut(x.inj) && x.form.ok).reduce((a, x) => (!a || x.val > a.val ? x : a), null);
  const vals = [...weak.map(x => adjL(x.p)), bestFree ? bestFree.val : 0], lo = Math.min(...vals) * 0.8, hi = Math.max(...vals) * 1.05, pos = v => (v - lo) / (hi - lo || 1) * 100;
  html.push(`<aside class="lside s3"><section class="blk" aria-label="הסגל שלי"><div class="bh"><h2>הסגל שלי</h2><span class="meta">מהחלש לחזק</span></div>
    <div class="lls">${weak.map(x => { const v = adjL(x.p); return `<div class="lli lwk">${hsI(x.id, 40)}<div><b>${esc(surname(x.p.n))}</b><span class="ltr"><i style="width:${pos(v).toFixed(1)}%;${bestFree && v >= bestFree.val ? "background:var(--tx3)" : ""}"></i>${bestFree ? `<u style="right:${pos(bestFree.val).toFixed(1)}%"></u>` : ""}</span></div><span class="n">${f1(v)}</span></div>`; }).join("")}</div>
    ${bestFree ? `<div class="note">הקו הסגול: <span class="n" style="font-weight:700">${f1(bestFree.val)}</span>, ${esc(bestFree.p.n)}, הכי טוב שפנוי. מי שהפס שלו לא מגיע לקו שווה בדיקה.</div>` : ""}</section></aside>`);

  // ---- injury openings and Sleeper adds ----
  const opps = [];
  Object.entries(SEA.pl || {}).forEach(([id, x]) => {
    if (!x.team || !isOut(injOf(id))) return;
    const p = PMAP.get(id); if (!p || (p.min || 0) < 26) return;
    const mates = fa.list.filter(f => f.team === x.team && !isOut(f.inj) && (f.p.pos || []).some(q2 => (p.pos || []).includes(q2))).sort((a, b) => (b.dMin - a.dMin) || (b.val - a.val)).slice(0, 2);
    if (mates.length) opps.push({p, team: x.team, mates, ret: (espnInjOf(id) || {}).ret});
  });
  const tr = (X.D.trend || []).filter(t => !fa.rostered.has(t.player_id)).slice(0, 5), mxt = Math.max(1, ...tr.map(t => t.count));
  html.push(`<section class="blk s7" aria-label="הזדמנויות מפציעות"><div class="bh"><h2>הזדמנויות מפציעות</h2><span class="meta">שחקן 26+ דקות בחוץ, ופנויים מאותה קבוצה ועמדה</span></div>
      <div class="lls">${opps.sort((a, b) => b.p.min - a.p.min).slice(0, 5).map(o => `<div class="lli"><span class="pa">${hsI(o.p.id, 52)}${tlI(o.team)}</span><div><b>${esc(o.p.n)}</b><small dir="auto">${o.mates.map(m => `${esc(m.p.n)}${m.dMin >= 2 ? ` +${Math.round(m.dMin)} דק'` : ""}`).join(", ")}</small></div>${o.ret ? `<span class="lwhen2">${xi("clock")}${esc(retTxt(o.ret).replace("חזרה משוערת ", ""))}</span>` : ""}</div>`).join("") || `<p class="mut">אין כרגע שחקן רוטציה בחוץ עם מחליף פנוי.</p>`}</div></section>
    <section class="blk s5 ltrend" aria-label="מה מוסיפים ב-Sleeper"><div class="bh"><h2>מה מוסיפים ב-Sleeper</h2><span class="meta">24 שעות · רק פנויים</span></div>
      <div class="lls">${tr.map(t => { const p = pOf(t.player_id); return `<div class="lli" style="min-height:58px">${hsI(t.player_id, 44)}<div><b>${p.stub ? esc(p.n) : nameLink(p)}</b><small>${esc(teamOf(t.player_id))}</small></div><span class="ltrb"><i style="width:${(t.count / mxt * 100).toFixed(0)}%"></i></span><span class="n">${t.count.toLocaleString("en-US")}</span></div>`; }).join("") || `<p class="mut">אין נתונים מ-Sleeper כרגע.</p>`}</div></section>`);
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

  // ---- the season on one line ----
  const pct = w => Math.min(100, Math.max(0, w / reg * 100));
  html.push(`<div class="lssn" aria-label="העונה"><span><b>שבוע ${Math.min(wk, reg)}</b> מתוך ${reg} בעונה הסדירה</span><span class="ax"><i style="width:${pct(Mo.regDone + 0.5).toFixed(1)}%"></i><u style="right:${pct(tdl).toFixed(1)}%"></u></span>
    <span>דדליין טריידים: <b>שבוע ${tdl}</b>${wk <= tdl ? `, עוד ${tdl - wk + 1} שבועות` : ", עבר"}</span><span>פלייאוף: <b>שבוע ${pws}</b>${wk < pws ? `, עוד ${pws - wk} שבועות` : ", עכשיו"} · ${ptm} מתוך ${L.rosters.length} עולות</span></div>`);

  // ---- this week's three matchups: before the games the chance is the big number, after them the score ----
  const ms = L.matchups[wk - 1] || [], pairs = {};
  ms.forEach(m => (pairs[m.matchup_id] = pairs[m.matchup_id] || []).push(m));
  const ordered = Object.values(pairs).filter(p => p.length === 2).sort((a, b) => b.some(m => m.roster_id === myRid) - a.some(m => m.roster_id === myRid));
  const muCards = ordered.map(([a, b]) => {
    const ta = TW[a.roster_id], tb = TW[b.roster_id], ua = Mo.byRid[a.roster_id].uid, ub = Mo.byRid[b.roster_id].uid;
    // yours on top, so the bar reads from your side
    const swap = b.roster_id === myRid;
    const A = swap ? b : a, B = swap ? a : b, TA = swap ? tb : ta, TB = swap ? ta : tb, UA = swap ? ub : ua, UB = swap ? ua : ub;
    const pa = TA && TB ? winP(TA, TB) : null, mine = A.roster_id === myRid;
    const live = TA && TB && [...TA.st, ...TB.st].some(x => x && x.g.some(g => g.live));
    const on2 = (A.points || 0) + (B.points || 0) > 0;
    // the score from the resolved locks (teamWeek's prov), the opponent's marks included; Sleeper's points without the week's model
    const sc = m => { const T = TW[m.roster_id]; return T ? T.prov : m.points || 0; };
    const row = (m, T, uid, p, oth) => { const big = on2 ? f1(sc(m)) : p != null ? `${Math.round(p * 100)}%` : "·", lose = on2 ? sc(m) < sc(oth) : p != null && p < 0.5;
      return `<div class="lms${lose ? " lo" : ""}">${av(uid, 52)}<div><b>${nm(uid)}</b><small>${recOfRid(m.roster_id)} · מקום ${rankOfRid(m.roster_id)}${on2 && p != null ? ` · ${Math.round(p * 100)}%` : ""}</small></div><span class="n pc">${big}</span></div>`; };
    const pair = fa => TA && TB ? `${fa(TA)} : ${fa(TB)}` : "·";
    const on = LIVE.muSel === a.matchup_id;
    return `<section class="blk lmc${mine ? " mine" : ""}${on ? " sel" : ""}" aria-label="${nm(UA)} מול ${nm(UB)}" role="button" tabindex="0" aria-expanded="${on}" title="${on ? "לסגור את המאץ'" : "לראות את המאץ' שחקן מול שחקן"}" onclick="muPick(${a.matchup_id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();muPick(${a.matchup_id})}">
      <div class="bh"><h2>${mine ? "המאץ' שלך" : "מאץ'"}</h2><span class="sp"></span>${live ? `<span class="chip live"><i></i>חי</span>` : on2 ? "" : `<span class="chip">עוד לא התחיל</span>`}</div>
      ${row(A, TA, UA, pa, B)}${row(B, TB, UB, pa == null ? null : 1 - pa, A)}
      <div class="pb"><i style="width:${((pa == null ? 0.5 : pa) * 100).toFixed(1)}%"></i></div>
      <div class="lmf"><span>צפי <span class="n mdl">${TA && TB ? `${f1(TA.exp)} : ${f1(TB.exp)}` : "·"}</span></span><span>נשארו <span class="n">${pair(T => T.nLeft)}</span></span><span>היום <span class="n">${pair(T => T.nToday)}</span></span><span>נעולים <span class="n">${pair(T => T.nLocked)}</span></span><span class="go">${on ? "סגירה" : "פרטים"}</span></div></section>`;
  });
  html.push(muCards.join("") || `<section class="blk s12"><p class="mut">אין מאצ'אפים לשבוע ${wk} עדיין.</p></section>`);

  // ---- the open matchup, slot by slot: the right team's player, the slot, the left team's player ----
  const opened = ordered.find(([a]) => a.matchup_id === LIVE.muSel);
  // another team's player: there is no way to know what he locked (Sleeper shows the counted score, not the lock), so a
  // number is solid only for a player who is locked or done; otherwise it is what counts now, muted (Nati, 25.10.2026)
  const solid = x => x.locked || (!x.left.length && !x.g.some(g => g.live));
  const nCls = x => solid(x) ? "" : " pv";
  const pend = x => x.pending ? `<span class="left pk" title="Sleeper מראה את המשחק מ-${dLbl(x.pending.date)}. אין אישור שזו נעילה, ולכן נספר המשחק האחרון">Sleeper: ${f1(x.pending.fp)}?</span>` : "";
  if (opened) {
    const [a, b] = opened, ta = TW[a.roster_id], tb = TW[b.roster_id], ua = Mo.byRid[a.roster_id].uid, ub = Mo.byRid[b.roster_id].uid;
    // another team's player (06.11.2026): each game he played is a button, "he locked this one" (toggleOppLock)
    const myIds = new Set([...(TW[myRid] || {st: []}).st, ...((TW[myRid] || {}).bench || [])].filter(Boolean).map(x => x.id));
    const lockBtns = x => myIds.has(x.id) || !x.played.length || !x.left.length ? "" : `<span class="olk" style="display:inline-flex;gap:4px;margin-inline-start:8px;vertical-align:middle">${x.played.map(g => `<button type="button" class="sc pick${x.lockedOn === g.date ? " k" : ""}" onclick="event.stopPropagation();toggleOppLock('${x.id}','${g.date}')" title="${x.lockedOn === g.date ? "לחיצה מבטלת את הנעילה" : `נעל על המשחק מ-${dLbl(g.date)}`}">${f1(g.fp)}</button>`).join("")}</span>`;
    const state = x => x.locked ? `<span class="act done"${myIds.has(x.id) ? "" : ` role="button" style="cursor:pointer" title="לחיצה מבטלת" onclick="toggleOppLock('${x.id}','${x.lockedOn}')"`}>${xi("lock", 12)}נעול</span>`
      : x.g.some(g => g.live) ? `<span class="chip live"><i></i>משחק עכשיו</span>`
      : `<span class="left">${x.left.length ? (x.left.length === 1 ? "משחק אחד נשאר" : `${x.left.length} משחקים נשארו`) : x.g.length ? "סיים" : "אין משחקים"}</span>${pend(x)}${lockBtns(x)}`;
    const who = x => `<div class="pl">${hsI(x.id, 40)}<div><b>${pName(x)}</b><small>${esc(x.team)}${x.inj ? ` · ${esc(injTxt(x.inj))}` : ""}</small></div></div>`;
    const empty = `<td colspan="3" class="dim" style="text-align:center">משבצת ריקה</td>`;
    const rowsH = ta && tb ? SLOTS.map((sl, i) => { const x = ta.st[i], y = tb.st[i];
      return `<tr>${x ? `<td style="text-align:right">${who(x)}</td><td class="num b${nCls(x)}">${nn(x.pts)}</td><td>${state(x)}</td>` : empty}
        <td class="slc"><span class="sl">${sl}</span></td>
        ${y ? `<td>${state(y)}</td><td class="num b${nCls(y)}">${nn(y.pts)}</td><td class="lf">${who(y)}</td>` : empty}</tr>`; }).join("")
      + `<tr class="sec"><td colspan="3">ספסל · ${ta.bench.map(x => esc(lastName(x.p.n))).join(", ") || "ריק"}</td><td></td><td colspan="3" style="text-align:left">ספסל · ${tb.bench.map(x => esc(lastName(x.p.n))).join(", ") || "ריק"}</td></tr>` : "";
    const head = (m, T, uid) => `<div class="mh" style="--c:${col(uid)}">${av(uid, 36)}<div><b>${nm(uid)}</b><small>מקום ${rankOfRid(m.roster_id)}${T ? ` · נעול ${f1(T.cur)} · צפי ${f1(T.exp)}` : ""}</small></div><span class="n">${f1(T ? T.prov : m.points || 0)}</span></div>`;
    html.push(`<section class="blk s12 mud" aria-label="${nm(ua)} מול ${nm(ub)}, שחקן מול שחקן"><div class="bh"><h2>${nm(ua)} מול ${nm(ub)}</h2><span class="meta">שבוע ${wk} · שחקן מול שחקן, ונספר = מה ש-Sleeper סופר עכשיו</span><span class="sp"></span><button class="btn" onclick="muPick(${a.matchup_id})">סגירה</button></div>
      <div class="mhs">${head(a, ta, ua)}<span class="vs">מול</span>${head(b, tb, ub)}</div>
      ${rowsH ? `<div class="tsc"><table class="tb h2h"><tbody>${rowsH}</tbody></table></div><div class="note">מספר מעומעם = מה שנספר עכשיו, והוא יכול להשתנות במשחק הבא. ראית ב-Sleeper שהיריב נעל? לחיצה על הציון של המשחק שהוא נעל עליו (מתחת ל"משחקים נשארו") מסמנת אותו כנעול.</div>` : `<p class="mut">טוען את השבוע מ-Sleeper</p>`}</section>`);
  }

  // ---- the standings, with each roster's strength: the headers sort it, the playoff line only in the league's own order ----
  const closed = Mo.regDone > 0;
  const base = [...Mo.teams].sort((a, b) => closed ? a.rank - b.rank : ((TW[b.rid] || {}).cur || 0) - ((TW[a.rid] || {}).cur || 0));
  const place = new Map(base.map((t, i) => [t.rid, i + 1]));
  const SO = LIVE.stSort || {k: "rk", dir: 1};
  const key = {rk: t => place.get(t.rid), pf: t => t.pf, pa: t => t.pa, cur: t => (TW[t.rid] || {}).cur || 0, exp: t => (TW[t.rid] || {}).exp || 0, pw: t => t.strength};
  const rows = [...base].sort((a, b) => SO.dir * (key[SO.k](a) - key[SO.k](b)));
  const pwMin = Math.min(...Mo.teams.map(t => t.strength)), pwMax = Math.max(...Mo.teams.map(t => t.strength)), pLo = Math.floor(pwMin / 10) * 10 - 5;
  const moves = rid => { const r = L.rosters.find(x => x.roster_id === rid); return (r && r.settings && (r.settings.total_moves || 0)) || 0; };
  const hd = (k, t) => `<th class="srt"${SO.k === k ? ` data-dir="${SO.dir < 0 ? "desc" : "asc"}"` : ""} onclick="stSort('${k}')">${t}</th>`;
  html.push(`<section class="blk s8" aria-label="טבלת הליגה" style="padding-bottom:10px"><div class="bh"><h2>טבלת הליגה</h2><span class="meta">${closed ? `אחרי ${Mo.regDone} שבועות` : "עוד אין שבוע סגור, הסדר לפי הנעולים של השבוע"} · הקו = פלייאוף · לחיצה על קבוצה מציגה את הסגל שלה</span></div>
    <div class="tsc"><table class="tb lst"><thead><tr>${hd("rk", "#")}<th style="text-align:right">קבוצה</th><th>מאזן</th>${hd("pf", "בעד")}${hd("pa", "נגד")}${hd("cur", "נעול")}${hd("exp", "צפי")}${hd("pw", "כוח הסגל")}<th>רצף</th></tr></thead>
    <tbody>${rows.map(t => { const T = TW[t.rid], me = t.uid === MY_USER_ID;
      return `<tr class="${me ? "me" : ""}${SO.k === "rk" && SO.dir === 1 && place.get(t.rid) === ptm ? " cut" : ""}" onclick="lgPick(${t.rid})"><td class="n dim">${place.get(t.rid)}</td>
        <td><div class="pl">${av(t.uid, 44)}<div><b>${esc(t.name)}</b>${me ? `<span class="yo">אתה</span>` : ""}<small>${esc(me ? "" : userOf(t.uid))}</small></div></div></td>
        <td class="num"><bdi>${t.wins}-${t.losses}</bdi></td><td class="num ${closed ? "" : "dim"}">${closed ? f1(t.pf) : "·"}</td><td class="num ${closed ? "" : "dim"}">${closed ? f1(t.pa) : "·"}</td>
        <td class="num b">${T ? f1(T.cur) : "·"}</td><td class="num pj">${T ? f1(T.exp) : "·"}</td><td class="num"><span class="lpw"><span class="n">${f1(t.strength)}</span><span class="bar2"><i style="width:${((t.strength - pLo) / (pwMax - pLo || 1) * 100).toFixed(0)}%"></i></span></span></td><td class="num ${t.streak ? "" : "dim"}">${t.streak || "·"}</td></tr>`; }).join("")}</tbody></table></div></section>`);

  // ---- one roster at a time: stays beside the table ----
  const selRid = Mo.byRid[S.lgSel] ? S.lgSel : myRid, sel = Mo.byRid[selRid], ST = TW[selRid];
  const opPair = ms.find(m => m.roster_id === selRid), opM = opPair && ms.find(m => m.matchup_id === opPair.matchup_id && m.roster_id !== selRid);
  const opT = opM && TW[opM.roster_id], vs = opM ? `מול ${esc(Mo.byRid[opM.roster_id].name)}${ST && opT ? `, ${Math.round(winP(ST, opT) * 100)}%` : ""}` : "";
  const roRows = ST ? ST.st.map((x, i) => x ? `<tr><td style="text-align:right"><div class="pl"><span class="sl">${SLOTS[i]}</span>${hsI(x.id, 34)}<b>${pName(x)}</b></div></td>
      <td class="num b${nCls(x)}" style="width:50px">${nn(x.pts)}</td><td style="width:92px">${x.locked ? `<span class="act done">${xi("lock", 12)}נעול</span>` : `<span class="left">${x.left.length ? (x.left.length === 1 ? "משחק אחד" : `${x.left.length} נשארו`) : x.g.length ? "סיים" : "אין משחקים"}</span>${pend(x)}`}</td></tr>` : "").join("")
    + `<tr class="sec"><td colspan="3">ספסל · ${ST.bench.length} · ${ST.bench.map(x => esc(lastName(x.p.n))).join(", ")}</td></tr>`
    : sel.players.slice(0, 14).map(p => `<tr><td style="text-align:right"><div class="pl">${hsI(p.id, 34)}<b>${nameLink(p)}</b>${tlI(p.t)}</div></td><td class="num pj">${f1(adj(p))}</td><td></td></tr>`).join("");
  html.push(`<aside class="lside s4"><section class="blk" aria-label="הסגלים"><div class="bh"><h2>הסגלים</h2><span class="meta">כוח הסגל <span class="n">${f1(sel.strength)}</span> · מהלכים ${moves(selRid)}</span></div>
    <div class="lavs">${Mo.teams.map(t => `<button class="${t.rid === selRid ? "on" : ""}" style="--c:${col(t.uid)}" title="${esc(t.name)}" onclick="lgPick(${t.rid})">${av(t.uid, 40)}</button>`).join("")}</div>
    <div class="lthd"><div><b>${esc(sel.name)}</b><small>${esc(userOf(sel.uid))}${sel.uid === MY_USER_ID ? " · אתה" : ""} · <bdi>${sel.wins}-${sel.losses}</bdi> · מקום ${rankOfRid(selRid)}${vs ? ` · ${vs}` : ""}</small></div><span class="n">${ST ? f1(ST.cur) : ""}</span></div>
    <div class="tsc"><table class="tb lro"><tbody>${roRows}</tbody></table></div></section></aside>`);

  // ---- recent moves ----
  const tx = [...L.tx].filter(t => t.status === "complete").sort((a, b) => b.created - a.created).slice(0, 8);
  const ownerOf = t => { const rid = (Object.values(t.adds || {})[0]) || (Object.values(t.drops || {})[0]) || (t.roster_ids || [])[0]; return Mo.byRid[rid]; };
  html.push(`<section class="blk s6" aria-label="מהלכים אחרונים"><div class="bh"><h2>מהלכים אחרונים</h2><span class="meta">כל הליגה, שבועיים</span></div>
    ${tx.map(t => { const o = ownerOf(t) || {}, d = new Date(t.created), adds = Object.keys(t.adds || {}), drops = Object.keys(t.drops || {});
      return `<div class="lmv">${av(o.uid, 38)}<div><b>${esc(o.name || "")}</b>${adds.map(id => `<span class="ch"><span class="add">+</span>${esc(pOf(id).n)}</span>`).join("")}${drops.map(id => `<span class="ch"><span class="rem">−</span>${esc(pOf(id).n)}</span>`).join("")}</div><time>${d.getDate()}.${d.getMonth() + 1}</time></div>`; }).join("") || `<p class="mut">אין מהלכים בשבועיים האחרונים.</p>`}
    <div class="note">ב-Lock-in שוק פעיל הוא עוד הזדמנויות לנעילה.</div></section>`);

  // ---- the season, week by week ----
  let chart;
  if (Mo.regDone > 0) {
    const n = Mo.regDone, all = Mo.teams.flatMap(t => Mo.pts[t.rid].slice(0, n)), lo = Math.min(...all) * 0.95, hi = Math.max(...all) * 1.03;
    const x = i => n === 1 ? 300 : 570 - i * (540 / (n - 1)), y = v => 250 - (v - lo) / (hi - lo || 1) * 230;
    const ticks = Array.from({length: n}, (_, i) => i).filter(i => n <= 10 || i % 2 === 0 || i === n - 1);
    chart = `<svg viewBox="0 0 600 290" role="img" aria-label="נקודות בכל שבוע">${ticks.map(i => `<line x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="14" y2="258" style="stroke:var(--ln2)"/><text x="${x(i).toFixed(1)}" y="282" text-anchor="middle">${n <= 4 ? "שבוע " : ""}${i + 1}</text>`).join("")}${Mo.teams.slice().sort((a, b) => (a.uid === MY_USER_ID) - (b.uid === MY_USER_ID)).map(t => {
      const me = t.uid === MY_USER_ID, c = me ? "var(--me)" : "var(--ln3)", pts = Mo.pts[t.rid].slice(0, n).map((v, i) => `${x(i).toFixed(1)},${y(v || 0).toFixed(1)}`).join(" ");
      return `<polyline points="${pts}" fill="none" style="stroke:${c};stroke-width:${me ? 3.5 : 2}"/>${Mo.pts[t.rid].slice(0, n).map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v || 0).toFixed(1)}" r="${me ? 5 : 3.5}" style="fill:${c}"><title>${esc(t.name)} · שבוע ${i + 1} · ${f1(v || 0)}</title></circle>`).join("")}`; }).join("")}</svg>`;
  } else {
    const d1 = SEA.sch ? SEA.sch.games.filter(g => g.week === wk + 1).map(g => g.date).sort()[0] : null;
    chart = `<div class="ghost"><svg viewBox="0 0 600 178" preserveAspectRatio="none" aria-hidden="true">${Mo.teams.map((t, i) => `<polyline points="${Array.from({length: 9}, (_, k) => `${k * 75},${60 + ((i * 37 + k * 23) % 70)}`).join(" ")}" fill="none" style="stroke:${col(t.uid)};stroke-width:2.5;opacity:.22"/>`).join("")}</svg>
      <div class="msg"><div><b>מתמלא אחרי שבוע ${wk}${d1 ? `, ב-${dObj(d1).getUTCDate()}.${dObj(d1).getUTCMonth() + 1}` : ""}</b><span>קו לכל קבוצה. אתה בכתום.</span></div></div></div>`;
  }
  html.push(`<section class="blk s6 lchart" aria-label="לאורך העונה"><div class="bh"><h2>לאורך העונה</h2><span class="meta">נקודות בכל שבוע · אתה בכתום · ריחוף על נקודה מראה את הקבוצה והמספר</span></div>${chart}</section>`);
  out.innerHTML = html.join("");
  function recOfRid(rid){ const t = Mo.byRid[rid]; return t ? `${t.wins}-${t.losses}` : ""; }
}
function stSort(k){ const s = LIVE.stSort || {k: "rk", dir: 1}; LIVE.stSort = s.k === k ? {k, dir: -s.dir} : {k, dir: k === "rk" ? 1 : -1}; renderLive(); }

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

  // ---- games by day (ESPN for the times, Sleeper for the count): your heads and how many are in your matchup ----
  const tD = TIP[today], nextUS = usDate(dObj(today).getTime() + DAY);
  const dflt = tD && tD.games.length && !tD.games.every(g => g.done) ? today : nextUS;
  const day = NEWS.day || dflt, dayT = TIP[day];
  const schDates = [...new Set(SEA.sch.games.map(g => g.date))].sort();
  const i0 = Math.max(0, schDates.indexOf(dflt)), tabs = schDates.slice(Math.max(0, i0 - 1), i0 + 3);
  const cntOn = d => SEA.sch.games.filter(g => g.date === d).length, wkOf = d => (SEA.sch.games.find(g => g.date === d) || {}).week;
  const byTeam = {};
  own.forEach((u, id) => { const t = teamOf(id); (byTeam[t] = byTeam[t] || []).push({id, u}); });
  const peopleOf = g => { const ps = [...(byTeam[g.away.team] || []), ...(byTeam[g.home.team] || [])]; return {ps, mine: ps.filter(p => p.u === MY_USER_ID), opp: ps.filter(p => p.u === oppU)}; };
  const games = dayT && dayT.games.length ? [...dayT.games].sort((a, b) => a.t - b.t) : [];
  const firstMine = games.find(g => !g.done && g.state !== "in" && peopleOf(g).mine.length);
  const stateOf = g => g.state === "in" ? (g.detail || "חי") : g.done ? "סיום" : ilTime(g.t, false);
  const countsTxt = (m, o, n) => [m ? `<b>${m} שלך</b>` : "", o ? `${o} יריב` : ""].filter(Boolean).join(" · ") || (n ? "שאר הליגה" : "אף שחקן מהליגה");
  const card = g => { const {ps, mine, opp} = peopleOf(g), isLive = g.state === "in", nxt = g === firstMine;
    const side = s => `<div class="ltt">${tlI(s.team)}<b>${esc(s.team)}</b><small class="n">${g.state === "pre" ? esc(s.rec || "") : s.score ?? ""}</small></div>`;
    return `<article class="lgc lgc2${nxt || isLive ? " next" : ""}${mine.length ? "" : " other"}"><header><span class="t n">${esc(stateOf(g))}</span>${isLive ? `<span class="chip live"><i></i>חי</span>` : nxt ? `<span class="chip now">הראשון שלך</span>` : g.tv && g.tv.length ? `<span class="tv">${esc(g.tv[0])}</span>` : ""}</header>
      <div class="lvs">${side(g.away)}<span class="at">@</span>${side(g.home)}</div>
      <div class="lwho">${mine.length ? `<span class="hd">${mine.slice(0, 3).map(p => `<img class="hs" src="${img(p.id)}" alt="" title="${esc(pOf(p.id).n)}" loading="lazy">`).join("")}</span>` : ""}<small>${countsTxt(mine.length, opp.length, ps.length)}</small></div></article>`; };
  const GF = NEWS.gf || "a", GV = NEWS.gv || "c";
  const gShown = games.filter(g => GF === "a" || peopleOf(g).mine.length);
  const gRow = g => { const {mine, opp} = peopleOf(g);
    return `<tr><td class="n" style="font-size:17px;font-weight:700;text-align:right">${esc(stateOf(g))}</td><td><div class="pl">${tlI(g.away.team, 30)}<b>${esc(g.away.team)}</b><span class="dim">@</span>${tlI(g.home.team, 30)}<b>${esc(g.home.team)}</b></div></td><td><div class="lwho" style="border:0;padding:0;margin:0;justify-content:center"><span class="hd">${mine.slice(0, 4).map(p => `<img class="hs" src="${img(p.id)}" alt="" title="${esc(pOf(p.id).n)}" loading="lazy">`).join("")}</span></div></td><td class="num">${mine.length || "·"}</td><td class="num">${opp.length || "·"}</td><td class="dim" style="font-size:12.5px">${g.tv && g.tv.length ? esc(g.tv[0]) : "·"}</td></tr>`; };
  html.push(`<section class="blk s12" aria-label="המשחקים"><div class="bh"><h2>${day === today ? "המשחקים הלילה" : `המשחקים · ${dLbl(day)}`}</h2><span class="meta">שעון ישראל · מי מהמאץ' שלך בכל משחק</span><span class="sp"></span><a href="#" onclick="refreshAll();return false">${ric("repeat")}רענון</a>
      <div class="seg"><button class="${GF === "a" ? "on" : ""}" onclick="NEWS.gf='a';renderNews()">הכל</button><button class="${GF === "m" ? "on" : ""}" onclick="NEWS.gf='m';renderNews()">עם השחקנים שלי</button></div>
      <div class="seg"><button class="${GV === "c" ? "on" : ""}" onclick="NEWS.gv='c';renderNews()">כרטיסים</button><button class="${GV === "t" ? "on" : ""}" onclick="NEWS.gv='t';renderNews()">טבלה</button></div></div>
    <div class="ldays">${tabs.map(d => `<button class="${d === day ? "on" : ""}" onclick="newsDay('${d}')"><span>${dLbl(d)}${d === today ? " · הלילה" : wkOf(d) !== D.week ? ` · שבוע ${wkOf(d)}` : ""}</span><b>${cntOn(d)}</b></button>`).join("")}</div>
    ${!(dayT && dayT.games.length) ? `<p class="mut">${dayT && dayT.err ? "לא הצלחתי למשוך את לוח המשחקים מ-ESPN." : dayT ? "אין משחקים ביום הזה." : "טוען את המשחקים מ-ESPN"}</p>`
      : GV === "c" ? `<div class="lgcs lgm">${gShown.map(card).join("") || `<p class="mut">אין לך שחקנים במשחקים של היום הזה.</p>`}</div>`
      : `<div class="tsc"><table class="tb"><thead><tr><th style="width:90px">שעה</th><th style="text-align:right">משחק</th><th>השחקנים שלי</th><th>שלי</th><th>יריב</th><th>שידור</th></tr></thead><tbody>${gShown.map(gRow).join("")}</tbody></table></div>`}
    <div class="note">הספרה בכל יום היא מספר המשחקים. משחק אחרי חצות שייך ליום של ארה"ב.</div></section>`);

  // ---- ESPN news, tagged with whose players they mention ----
  const arts = (NEWS.news || []).map(a => {
    const names = (a.categories || []).filter(c => c.type === "athlete").map(c => c.description || (c.athlete || {}).description).filter(Boolean);
    const ids = [...new Set(names.map(idByName).filter(Boolean))].filter(id => who(id));
    return {a, ids, ks: new Set(ids.map(who))};
  });
  const F = NEWS.f || "all", count = k => arts.filter(x => k === "all" || x.ks.has(k)).length;
  const shown = arts.filter(x => F === "all" || x.ks.has(F)).sort((p, q) => (q.ks.has("me") - p.ks.has("me")) || (new Date(q.a.published) - new Date(p.a.published)));
  const ORD = {me: 0, opp: 1, fa: 2, lg: 3};
  const tag = id => { const k = who(id), u = own.get(id); return `<span class="ltag ${k}">${esc(lastName(pOf(id).n))}<small>${k === "me" ? "שלך" : k === "fa" ? "פנוי" : esc(tName(D, u))}</small></span>`; };
  const tags = ids => { const s = [...ids].sort((a, b) => ORD[who(a)] - ORD[who(b)]), n = s.length - 8; return `<div class="ltags">${s.slice(0, 8).map(tag).join("")}${n > 0 ? `<span class="ltag">+${n}</span>` : ""}</div>`; };
  const imgOf = a => ((a.images || []).find(i => i.url) || {}).url, href = a => ((a.links || {}).web || {}).href || "#";
  const list = shown.slice(0, NEWS.more ? 30 : 5);
  html.push(`<section class="blk s7" aria-label="חדשות"><div class="bh"><h2>חדשות</h2><span class="meta">ESPN · ${NEWS.newsAt ? `עודכן ${agoTxt(new Date(NEWS.newsAt).toISOString())}` : "טוען"}</span><span class="sp"></span><div class="seg">${[["all", "הכל"], ["me", "השחקנים שלך"], ["opp", "היריב"], ["fa", "פנויים"], ["lg", "הליגה"]].map(([k, t]) => `<button class="${F === k ? "on" : ""}" onclick="NEWS.f='${k}';renderNews()">${t} <span class="n" style="font-size:12px">${count(k)}</span></button>`).join("")}</div></div>
    ${!NEWS.news ? `<p class="mut">${NEWS.err ? `לא הצלחתי למשוך חדשות מ-ESPN (${esc(NEWS.err)}).` : "טוען חדשות מ-ESPN"}</p>`
      : !shown.length ? `<p class="mut">אין כרגע כתבות בסינון הזה. הפיד מתעדכן כל 10 דקות.</p>`
      : `${list.map(({a, ids}) => `<div class="lnws">${imgOf(a) ? `<img src="${esc(imgOf(a))}" alt="" loading="lazy">` : `<span></span>`}<div><h3 dir="auto"><a href="${esc(href(a))}" target="_blank" rel="noopener">${esc(a.headline)}</a></h3><time>${agoTxt(a.published)}</time>${tags(ids)}</div></div>`).join("")}
        ${shown.length > 5 ? `<div style="text-align:center;margin-top:12px"><button class="btn" onclick="NEWS.more=!NEWS.more;renderNews()">${NEWS.more ? "פחות כתבות" : `עוד ${Math.min(30, shown.length) - 5} כתבות`}</button></div>` : ""}`}</section>`);

  // ---- the injury report: league players only, mine first; beside the news, and scrolls with the page like it (03.11) ----
  const injRows = [];
  Object.entries(ESPN.inj || {}).forEach(([n, e]) => { const id = idByName(n); if (id && own.has(id)) injRows.push({id, e, k: who(id)}); });
  const ord = {me: 0, opp: 1, lg: 2};
  injRows.sort((a, b) => (ord[a.k] - ord[b.k]) || (new Date(b.e.date) - new Date(a.e.date)));
  const nMe = injRows.filter(r => r.k === "me").length, nOp = injRows.filter(r => r.k === "opp").length;
  html.push(`<section class="blk s5" aria-label="פציעות בליגה"><div class="bh"><h2>פציעות בליגה</h2><span class="meta"><span class="n">${injRows.length}</span> שחקנים · ${nMe} אצלך · ${nOp} אצל היריב</span></div>
    <div class="lls">${injRows.slice(0, NEWS.injMore ? 40 : 6).map(({id, e, k}) => { const s = ESPN_ST[e.status] || [e.status, "q"], u = own.get(id);
      return `<div class="lli lij"><span class="pa">${hsI(id, 52)}${tlI(teamOf(id))}</span><div><b>${nameLink(pOf(id))}</b><div class="ow" style="--c:${col(u)}"><i></i>${esc(tName(D, u))}${k === "me" ? " · שלך" : k === "opp" ? " · היריב" : ""}</div><p dir="auto">${esc(e.short || "")}</p>${e.ret ? `<div class="bk">${retTxt(e.ret)}</div>` : ""}</div><span class="chip ${s[1] === "out" ? "red" : s[1] === "ok" ? "" : "amb"}">${esc(s[0])}</span></div>`; }).join("")
      || `<p class="mut">${ESPN.inj ? "אין פצועים בסגלים של הליגה." : "טוען את דוח הפציעות"}</p>`}</div>
    ${injRows.length > 6 ? `<div style="text-align:center;margin-top:10px"><button class="btn" onclick="NEWS.injMore=!NEWS.injMore;renderNews()">${NEWS.injMore ? "פחות" : `עוד ${injRows.length - 6} פצועים`}</button></div>` : ""}</section>`);

  // ---- moves: the NBA (ESPN) or the league (Sleeper) ----
  const TF = NEWS.txF || "nba";
  const rOwner = rid => (D.rosters.find(r => r.roster_id === rid) || {}).owner_id;
  const lgTx = [...D.tx].filter(t => t.status === "complete").sort((a, b) => b.created - a.created).slice(0, 10), nbaTx = (NEWS.tx || []).slice(0, 14);
  const lgRows = lgTx.map(t => { const adds = Object.entries(t.adds || {}), drops = Object.entries(t.drops || {}), u = rOwner((adds[0] || drops[0] || [])[1] || (t.roster_ids || [])[0]), d = new Date(t.created);
    return `<div>${uAvI(D, u, 38)}<div style="min-width:0"><time>${d.getDate()}.${d.getMonth() + 1}</time><p><b>${esc(tName(D, u))}</b> ${adds.map(([p]) => `+${esc(pOf(p).n)}`).join(", ")}${drops.length ? ` <span class="dim">${drops.map(([p]) => `−${esc(pOf(p).n)}`).join(", ")}</span>` : ""}</p></div></div>`; });
  const nbaRows = nbaTx.map(t => { const tm = t.team || {}, ab = ESPN_TEAM[tm.abbreviation] || tm.abbreviation || "";
    return `<div>${tlI(ab)}<div style="min-width:0"><time>${agoTxt(t.date)}</time><p dir="auto">${esc(t.description)}</p></div></div>`; });
  const mvRows = TF === "lg" ? lgRows : nbaRows, mvShow = NEWS.txMore ? mvRows : mvRows.slice(0, 6);
  html.push(`<section class="blk s12" aria-label="מהלכים"><div class="bh"><h2>מהלכים</h2><span class="meta">בנבחרות ובליגה שלנו</span><span class="sp"></span><div class="seg"><button class="${TF === "nba" ? "on" : ""}" onclick="NEWS.txF='nba';renderNews()">NBA <span class="n" style="font-size:12px">${nbaTx.length}</span></button><button class="${TF === "lg" ? "on" : ""}" onclick="NEWS.txF='lg';renderNews()">הליגה <span class="n" style="font-size:12px">${lgTx.length}</span></button></div></div>
    ${mvShow.length ? `<div class="lmvc">${mvShow.join("")}</div>` : `<p class="mut">${TF === "lg" ? "אין מהלכים בשבועיים האחרונים." : NEWS.tx ? "אין עסקאות אחרונות." : "טוען"}</p>`}
    ${mvRows.length > 6 ? `<div style="text-align:center;margin-top:12px"><button class="btn" onclick="NEWS.txMore=!NEWS.txMore;renderNews()">${NEWS.txMore ? "פחות" : `עוד ${mvRows.length - 6} מהלכים`}</button></div>` : ""}</section>`);

  // ---- next week: who plays four times ----
  const nw = D.week + 1, ng = SEA.sch.games.filter(g => g.week === nw);
  if (ng.length) {
    const cnt = {}; ng.forEach(g => [g.home.team, g.away.team].forEach(t => { cnt[t] = (cnt[t] || 0) + 1; }));
    const mine = [...X.me.st.filter(Boolean), ...X.me.bench].map(x => ({x, n: cnt[x.team] || 0})).sort((a, b) => b.n - a.n || b.x.m - a.x.m);
    const four = Object.entries(cnt).filter(([, n]) => n >= 4).map(([t]) => t).sort();
    const faFour = X.fa.list.filter(f => four.includes(f.team) && !isOut(f.inj)).sort((a, b) => b.gain - a.gain).slice(0, 4);
    const dates = [...new Set(ng.map(g => g.date))].sort(), hist = [1, 2, 3, 4].map(k => mine.filter(m => m.n === k).length), mxH = Math.max(1, ...hist);
    html.push(`<section class="blk s12" aria-label="השבוע הבא"><div class="bh"><h2>השבוע הבא</h2><span class="meta">שבוע ${nw} · <bdi dir="ltr">${fmtShort(dObj(dates[0]))}–${fmtShort(dObj(dates[dates.length - 1]))}</bdi></span></div><div class="lnw">
      <div><h3>הסגל שלך לפי מספר משחקים</h3><div class="lbars">${hist.map((n, k) => `<div class="${k === 3 ? "hi" : ""}"><span class="n${n ? "" : " dim"}">${n}</span><i style="height:${n ? Math.max(6, n / mxH * 84) : 3}px"></i><small>${k ? `${k + 1} משחקים` : "משחק אחד"}</small></div>`).join("")}</div>
        <div class="lfaces">${mine.map(m => `<span class="${m.n >= 4 ? "four" : ""}" title="${esc(m.x.p.n)} · ${esc(m.x.team)}"><img src="${img(m.x.id)}" alt="">${m.n}</span>`).join("")}</div></div>
      <div><h3>${four.length} קבוצות עם 4 משחקים</h3>${four.length ? `<div class="llogos">${four.map(t => `<div>${tlI(t)}${esc(t)}</div>`).join("")}</div>` : `<p class="mut">אין קבוצה עם 4 משחקים.</p>`}</div>
      <div><h3>פנויים מהקבוצות עם 4</h3><div class="lls">${faFour.map(f => `<div class="lli">${hsI(f.p.id, 40)}<div><b>${nameLink(f.p)}</b><small>${esc(f.team)} · ערך ${f1(f.val)}</small></div><span class="n lval" style="font-size:18px">${f.gain >= 0 ? "+" : "−"}${f1(Math.abs(f.gain))}</span></div>`).join("") || `<p class="mut">אין שחקן פנוי שמשתלם מהקבוצות האלה.</p>`}</div></div></div></section>`);
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
  const inj = injOf(id), G = X && X.Wm.byTeam[team] ? X.Wm.byTeam[team] : [], val = adjL(p);
  const chips = [mine ? `<span class="chip me">בסגל שלך</span>` : owner ? `<span class="chip">אצל ${esc(tName(D, owner.owner_id))}</span>` : X ? `<span class="chip fa">שחקן פנוי</span>` : "",
    inj ? `<span class="chip ${isOut(inj) ? "red" : "amb"}">${esc(injTxt(inj))}</span>` : "",
    D && G.length ? `<span class="chip">שבוע ${D.week}: ${G.length} משחקים</span>` : ""].join("");
  const diff = fa && worst ? val - adjL(worst.p) : null;
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
let cardLogRequest = 0;
async function cardLog(p, season){
  const request = ++cardLogRequest;
  const box = $("cdHist"), sumBox = $("cdSum");
  if (!box) return;
  const cur = String((SEA.d && SEA.d.season) || new Date().getFullYear()), prev = String(+cur - 1);
  CARDH.pid = p.id;
  box.innerHTML = `<div class="cd-skel"></div>`;
  const logs = await Promise.allSettled([playerLog(p.id, cur), playerLog(p.id, prev)]);
  if (request !== cardLogRequest || CARDH.pid !== p.id || !$("card").open) return;
  const [now, last] = logs.map(r => r.status === "fulfilled" ? r.value.filter(g => !ASOF || g.date < ASOF) : null);
  const sel = season || (now?.length || !last?.length ? cur : prev), games = sel === cur ? now : last;
  CARDH.season = sel;
  const head = `<h6>היסטוריית נקודות <span>בניקוד של הליגה</span><span class="sp"></span><span class="seg">${[[cur, `העונה (${now?.length ?? "?"})`], [prev, `עונה שעברה (${last?.length ?? "?"})`]].map(([s, t]) =>
    `<button class="${s === sel ? "on" : ""}" onclick="cardLog(PMAP.get('${p.id}'), '${s}')">${t}</button>`).join("")}</span></h6>`;
  if (!games) { box.innerHTML = head + '<p class="dim">נתוני העונה הזו לא התקבלו מ־Sleeper.</p>'; if (sumBox) sumBox.textContent = "נתוני העונה הזו לא התקבלו"; return; }
  if (!games.length) { box.innerHTML = `${head}<p class="dim" style="margin:10px 0 0">${sel === cur ? "עוד לא שיחק העונה." : "לא שיחק בעונה הזאת."}</p>`; if (sumBox) sumBox.innerHTML = ""; return; }
  const fps = games.map(g => g.fp), avg = mean(fps), isCur = sel === cur && p.fpg, ref = isCur ? p.fpg : avg;
  const tp = Math.max(...fps, ref) || 1, best = Math.max(...fps), above = fps.filter(v => v >= ref).length;
  const wd = s => `${WD[dObj(s).getUTCDay()]}' ${dObj(s).getUTCDate()}.${dObj(s).getUTCMonth() + 1}`;
  // orange: at or above the forecast (the best game darker), grey: below it
  const bars = games.map(g => `<i class="${g.fp === best ? "top" : g.fp >= ref ? "up" : ""}" style="height:${Math.max(3, g.fp / tp * 100).toFixed(1)}%" title="${wd(g.date)} · ${g.away ? "@" : "vs "}${esc(g.opp)} · ${f1(g.fp)}"></i>`).join("");
  const refTxt = isCur ? `תחזית קדם־העונה (${f1(ref)})` : `הממוצע (${f1(ref)})`;
  const chart = `<div class="cd-chart" style="--g:${games.length > 12 ? 4 : games.length > 6 ? 10 : 24}px"><div class="cd-bars">${bars}</div><span class="cd-ref" style="bottom:calc(22px + (100% - 28px) * ${(ref / tp).toFixed(3)})" title="${refTxt}"><span>קו מקווקו = ${refTxt}</span></span>
    <div class="cd-ax"><span>${wd(games[0].date)}</span><span>${wd(games[games.length - 1].date)}</span></div></div>`;
  const strip = `<div class="cd-sum"><div><small>ממוצע</small><span class="n">${f1(avg)}</span></div><div><small>הכי טוב</small><span class="n">${f1(best)}</span></div><div><small>משחקים</small><span class="n">${games.length}</span></div><div><small>${isCur ? "ברף קדם־העונה ומעלה" : "מעל הממוצע"}</small><span class="n ${above / games.length >= 0.5 ? "good" : "amb"}">${above}/${games.length}</span></div></div>`;
  const predictions = new Map();
  let review = "";
  if (isCur) {
    const history = [];
    let modelError = 0, baselineError = 0;
    for (const g of games) {
      if (g.date >= todayUS()) continue;
      const {m} = blendM(p.fpg, p.sd || 4, p.pl, history);
      predictions.set(g, m);
      modelError += Math.abs(m - g.fp);
      baselineError += Math.abs(p.fpg - g.fp);
      history.push(gameOf(g.fp, g.s.sp, g.s));
    }
    if (predictions.size) review = `<div class="cd-review"><b>דיוק בנקודות פנטזי</b><p>טעות ממוצעת במשחק · מודל לומד <strong>${f1(modelError / predictions.size)}</strong> · קדם־עונה <strong>${f1(baselineError / predictions.size)}</strong></p><small>שחזור על ${predictions.size} משחקים עד אתמול. לכל משחק חושבה תחזית לפי המשחקים שקדמו לו ובסיס התחזית שזמין היום.</small></div>`;
  }
  const rows = games.slice(-8).reverse().map(g => { const st = g.s, c = g.fp >= ref * 1.15 ? "hi" : g.fp <= ref * 0.8 ? "lo" : "";
    return `<tr><td>${wd(g.date)}</td><td dir="ltr">${g.away ? "@" : ""}${esc(g.opp)}</td><td class="num">${Math.round(g.min)}</td>${["pts", "reb", "ast"].map(k => `<td class="num">${st[k] || 0}</td>`).join("")}<td class="num hide-sm">${st.stl || 0}</td><td class="num hide-sm">${st.blk || 0}</td><td class="num hide-sm">${st.to || 0}</td>${isCur ? `<td class="num">${predictions.has(g) ? f1(predictions.get(g)) : "—"}</td>` : ""}<td class="num sc2 ${c}"><b>${f1(g.fp)}</b></td></tr>`; }).join("");
  box.innerHTML = `${head}${chart}${strip}${review}
    <div class="cd-log"><table class="cd-t"><tr><th>תאריך</th><th>יריב</th><th class="num">דק'</th><th class="num">נק'</th><th class="num">ריב'</th><th class="num">אס'</th><th class="num hide-sm">חט'</th><th class="num hide-sm">חס'</th><th class="num hide-sm">איב'</th>${isCur ? '<th class="num">צפי משוחזר</th>' : ""}<th class="num">בפועל</th></tr>${rows}</table></div>
    ${games.length > 8 ? `<p class="note">8 המשחקים האחרונים בטבלה. בגרף כל ${games.length}.</p>` : ""}`;
  // the phone's summary tab: the same numbers without the table
  if (sumBox) sumBox.innerHTML = `${strip.replace("cd-sum", "cd-sum cd-sum3")}${review}${chart.replace("cd-chart", "cd-chart cd-mini")}`;
}
