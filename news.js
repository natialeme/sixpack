// ---------- "חדשות ועדכונים": games tonight, NBA news, injury report, moves in the league and in the NBA ----------
// ESPN's public site API (no key, CORS *): news, scoreboard, injuries, transactions. Unofficial endpoints: they can change.
// Players are matched to Sleeper by name (Sleeper's player file has no ESPN id for the NBA).

const NEWS = {news: null, newsAt: 0, tx: null, txAt: 0, tryAt: 0, loading: false, err: null, f: "all"};
// at most one pull a minute, success or failure: the screen re-renders after a pull, and must not ask again in a loop
async function loadNews(force){
  if (NEWS.loading || (!force && Date.now() - NEWS.tryAt < 60e3)) return;
  NEWS.loading = true; NEWS.tryAt = Date.now();
  const today = todayUS(), next = usDate(dObj(today).getTime() + DAY);
  const stale = (at, age) => force || !at || Date.now() - at > age;
  await Promise.all([
    stale(NEWS.newsAt, 10 * 60e3) ? getEspn(`${ESPN_API}/news?limit=50`).then(j => { NEWS.news = j.articles || []; NEWS.newsAt = Date.now(); NEWS.err = null; }).catch(e => { NEWS.err = String(e.message || e); }) : null,
    stale(NEWS.txAt, 30 * 60e3) ? getEspn(`${ESPN_API}/transactions`).then(j => { NEWS.tx = j.transactions || []; NEWS.txAt = Date.now(); }).catch(() => {}) : null,
    loadDay(today, force ? 0 : 90e3), loadDay(next, 10 * 60e3), loadEspnInjuries(),
  ]);
  NEWS.loading = false;
  if (S.tab === "news") renderNews();
}

// who owns a player in the league: me, this week's opponent, another team, or a free agent the model knows
function ownerMap(X){
  const m = new Map();
  X.D.rosters.forEach(r => [...(r.players || []), ...(r.reserve || [])].forEach(id => m.set(id, r.owner_id)));
  return m;
}
function ownTag(X, own, id){
  const u = own.get(id), oppU = X.op ? X.op.uid : null;
  if (u === MY_USER_ID) return {k: "me", html: `<span class="otag me">שלך</span>`};
  if (u && u === oppU) return {k: "opp", html: `<span class="otag opp" style="--c:${ucol(u)}">${esc(tName(X.D, u))} · יריב</span>`};
  if (u) return {k: "lg", html: `<span class="otag lg" style="--c:${ucol(u)}">${esc(tName(X.D, u))}</span>`};
  if (PMAP.has(id)) return {k: "fa", html: `<span class="otag fa">פנוי</span>`};
  return {k: "", html: ""};
}
const agoTxt = iso => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return m <= 1 ? "עכשיו" : `לפני ${m} דק'`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "לפני שעה" : h === 2 ? "לפני שעתיים" : `לפני ${h} שעות`;
  const d = new Date(iso); return `${d.getDate()}.${d.getMonth() + 1}`;
};
const ESPN_ST = {"Out": ["בחוץ", "out"], "Day-To-Day": ["יום-יום", "q"], "Questionable": ["בספק", "q"], "Doubtful": ["כנראה לא ישחק", "out"], "Probable": ["כנראה ישחק", "ok"], "Suspension": ["מושעה", "out"]};

function renderNews(){
  const out = $("newsOut");
  startSeasonTimer();
  if (seasonGate(out)) return;
  if (Date.now() - NEWS.newsAt > 10 * 60e3) loadNews();
  const X = seasonState();
  if (!X || !X.myR) { out.innerHTML = `<div class="panel empty-panel"><p>לא מצאתי את הקבוצה שלך בליגה הזאת.</p></div>`; return; }
  const {D, Wm} = X, own = ownerMap(X);
  const today = todayUS();

  // ---- games strip: tonight (or the next day with games), with the league's players in each game ----
  const tD = TIP[today], nD = TIP[usDate(dObj(today).getTime() + DAY)];
  const showNext = !tD || !tD.games.length || tD.games.every(g => g.done);
  const day = showNext && nD && nD.games.length ? nD : tD;
  const byTeam = {};
  own.forEach((u, id) => { const t = teamOf(id); (byTeam[t] = byTeam[t] || []).push({id, u}); });
  const ring = u => u === MY_USER_ID ? "var(--accent)" : ucol(u);
  const gameCard = g => {
    const ps = [...(byTeam[g.away.team] || []), ...(byTeam[g.home.team] || [])].sort((a, b) => ((b.u === MY_USER_ID) - (a.u === MY_USER_ID)) || ((b.u === (X.op && X.op.uid)) - (a.u === (X.op && X.op.uid))));
    const mine = ps.filter(p => p.u === MY_USER_ID).length;
    const st = g.state === "in" ? `<span class="gm-st live">${esc(g.detail)}</span>` : g.done ? `<span class="gm-st">סיום</span>` : `<span class="gm-st">${ilTime(g.t, showNext)}</span>`;
    const side = s => `<div class="gm-t ${g.done && s.score != null && s.score === Math.max(g.home.score, g.away.score) ? "win" : ""}">${s.logo ? `<img src="${esc(s.logo)}" alt="" loading="lazy" width="22" height="22">` : ""}<b>${esc(s.team)}</b><span class="muted">${esc(s.rec)}</span><span class="num gm-sc">${g.state === "pre" ? "" : s.score ?? ""}</span></div>`;
    return `<div class="gm ${mine ? "has-me" : ""}">${st}${side(g.away)}${side(g.home)}
      <div class="gm-ps">${ps.slice(0, 7).map(p => `<span class="gm-p" title="${esc(pOf(p.id).n)} · ${esc(tName(D, p.u))}" style="--r:${ring(p.u)}">${av(pOf(p.id), 22)}</span>`).join("")}${ps.length > 7 ? `<span class="gm-more">+${ps.length - 7}</span>` : ""}${!ps.length ? `<span class="muted gm-none">אף שחקן מהליגה</span>` : ""}</div>
      ${g.tv.length ? `<span class="gm-tv">${esc(g.tv[0])}</span>` : ""}</div>`;
  };
  const games = `<section class="panel games"><div class="ph"><h2>${showNext ? "המשחקים הבאים" : "המשחקים הלילה"}</h2><span class="meta">${day && day.games.length ? `${day.games.length} משחקים · שעון ישראל · הטבעת = של מי השחקן (שלך מודגש)` : ""}</span>
      <span class="ph-act"><button class="btn sm" onclick="refreshAll()" title="חדשות, משחקים ופציעות, עכשיו">${ric("repeat")}רענון</button></span></div>
    ${day && day.games.length ? `<div class="gm-strip">${day.games.map(gameCard).join("")}</div>` : `<p class="empty-note">${day && day.err ? "לא הצלחתי למשוך את לוח המשחקים מ-ESPN." : "אין משחקים היום ומחר."}</p>`}</section>`;

  // ---- news feed ----
  const arts = (NEWS.news || []).map(a => {
    const ath = (a.categories || []).filter(c => c.type === "athlete").map(c => c.description || (c.athlete || {}).description).filter(Boolean);
    const ids = [...new Set(ath.map(idByName).filter(Boolean))];
    const tags = ids.map(id => ({id, ...ownTag(X, own, id)})).filter(t => t.k);
    return {a, tags, ks: new Set(tags.map(t => t.k))};
  });
  const F = NEWS.f, count = k => arts.filter(x => k === "all" || x.ks.has(k)).length;
  const filt = [["all", "הכל"], ["me", "השחקנים שלך"], ["opp", "היריב"], ["lg", "שאר הליגה"], ["fa", "פנויים"]];
  const shown = arts.filter(x => F === "all" || x.ks.has(F)).sort((p, q) => ((q.ks.has("me")) - (p.ks.has("me"))) || (new Date(q.a.published) - new Date(p.a.published)));
  const art = ({a, tags}) => {
    const img = (a.images || []).find(i => i.url), href = ((a.links || {}).web || {}).href || "#";
    // the story is in English, so the row reads left to right; the Hebrew labels inside it keep their own direction
    return `<article class="nw ${tags.some(t => t.k === "me") ? "me" : ""}" dir="ltr">
      ${img ? `<img class="nw-img" src="${esc(img.url)}" alt="" loading="lazy">` : `<span class="nw-img ph">${ric("news")}</span>`}
      <div class="nw-b"><a class="nw-h" href="${esc(href)}" target="_blank" rel="noopener">${esc(a.headline)}</a>
        ${a.description ? `<p>${esc(a.description)}</p>` : ""}
        <div class="nw-m">${tags.map(t => `<span class="nw-tag" dir="rtl">${nameLink(pOf(t.id))}${t.html}</span>`).join("")}<span class="muted" dir="rtl">${agoTxt(a.published)}</span>${a.byline ? `<span class="muted">${esc(a.byline)}</span>` : ""}</div></div></article>`;
  };
  const feed = `<section class="panel feed2"><div class="ph"><h2>חדשות</h2><span class="meta">ESPN · ${NEWS.newsAt ? `עודכן ${agoTxt(new Date(NEWS.newsAt).toISOString())}` : "טוען…"}</span></div>
    <div class="seg-pos nw-f">${filt.map(([k, t]) => `<button class="${F === k ? "sel" : ""}" onclick="NEWS.f='${k}';renderNews()">${t}<span class="num">${count(k)}</span></button>`).join("")}</div>
    ${!NEWS.news ? (NEWS.err ? `<p class="empty-note">לא הצלחתי למשוך חדשות מ-ESPN (${esc(NEWS.err)}). ניסיון נוסף בעוד דקה, או בכפתור הרענון למעלה.</p>` : `<div class="nw-skel">${[1, 2, 3, 4].map(() => `<div class="skel"></div>`).join("")}</div>`)
      : shown.length ? `<div class="nws">${shown.slice(0, NEWS.more ? 30 : 5).map(art).join("")}</div>${shown.length > 5 ? `<button class="btn sm nw-more" onclick="NEWS.more=!NEWS.more;renderNews()">${NEWS.more ? "פחות כתבות" : `עוד ${Math.min(30, shown.length) - 5} כתבות`}</button>` : ""}`
      : `<p class="empty-note">אין כרגע כתבות על ${F === "me" ? "השחקנים שלך" : F === "opp" ? "השחקנים של היריב" : F === "fa" ? "שחקנים פנויים" : "שחקנים מהליגה"}. הפיד מתעדכן כל 10 דקות.</p>`}
    ${NEWS.news && NEWS.err ? `<p class="hint bad">הרענון האחרון מ-ESPN נכשל (${esc(NEWS.err)}). מוצגות החדשות מהמשיכה הקודמת.</p>` : ""}</section>`;

  // ---- injury report: league players only, mine first ----
  const injRows = [];
  Object.entries(ESPN.inj || {}).forEach(([n, e]) => {
    const id = idByName(n) || null; if (!id || !own.has(id)) return;
    const t = ownTag(X, own, id); injRows.push({id, e, t});
  });
  const ord = {me: 0, opp: 1, lg: 2};
  injRows.sort((a, b) => (ord[a.t.k] - ord[b.t.k]) || (new Date(b.e.date) - new Date(a.e.date)));
  const injHtml = `<section class="panel"><div class="ph"><h2>דו"ח פציעות בליגה</h2><span class="meta">${injRows.length} שחקנים</span></div>
    ${injRows.length ? `<div class="irp">${injRows.slice(0, 12).map(({id, e, t}) => { const s = ESPN_ST[e.status] || [e.status, "q"];
      return `<div class="ir-r">${av(pOf(id), 30)}<div class="ir-t"><div class="ir-n"><b>${nameLink(pOf(id))}</b><span class="ib ${s[1]}">${esc(s[0])}</span>${t.html}</div>
        <p dir="ltr" title="${esc(e.long || e.short)}">${esc(e.short)}</p><span class="muted">${e.ret ? `${retTxt(e.ret)} · ` : ""}עודכן ${agoTxt(e.date)}</span></div></div>`; }).join("")}</div>`
      : `<p class="empty-note">${ESPN.inj ? "אין פצועים בסגלים של הליגה." : "טוען את דו\"ח הפציעות…"}</p>`}</section>`;

  // ---- moves in the league (Sleeper) ----
  const pn = id => pOf(id).n;
  const rOwner = rid => (D.rosters.find(r => r.roster_id === rid) || {}).owner_id;
  const lgTx = [...D.tx].filter(t => t.status === "complete").sort((a, b) => b.created - a.created).slice(0, 8);
  const lgHtml = `<section class="panel"><div class="ph"><h2>מהלכים בליגה</h2><span class="meta">שבועיים אחרונים</span></div>
    ${lgTx.length ? `<div class="mv">${lgTx.map(t => { const adds = Object.entries(t.adds || {}), drops = Object.entries(t.drops || {}), u = rOwner((adds[0] || drops[0] || [])[1] || (t.roster_ids || [])[0]);
      return `<div class="mv-r"><span class="mdot" style="background:${ucol(u)}"></span><div><b>${esc(tName(D, u))}</b>${t.type === "trade" ? ` <span class="tag trade">טרייד</span>` : ""}
        <span class="mv-p">${adds.map(([p]) => `<span class="good">+${esc(pn(p))}</span>`).join(" ")} ${drops.map(([p]) => `<span class="muted">−${esc(pn(p))}</span>`).join(" ")}</span></div><span class="muted">${new Date(t.created).toLocaleDateString("he-IL", {day: "numeric", month: "numeric"})}</span></div>`; }).join("")}</div>`
      : `<p class="empty-note">עוד אין מהלכים בשבועיים האחרונים.</p>`}</section>`;

  // ---- NBA transactions (signings, waivers): roles change here ----
  const nbaTx = (NEWS.tx || []).slice(0, 10);
  const nbaHtml = `<section class="panel"><div class="ph"><h2>עסקאות ב-NBA</h2><span class="meta">החתמות ושחרורים</span></div>
    ${nbaTx.length ? `<div class="mv">${nbaTx.map(t => { const tm = t.team || {}, logo = ((tm.logos || [])[0] || {}).href;
      return `<div class="mv-r">${logo ? `<img src="${esc(logo)}" alt="" width="22" height="22" loading="lazy">` : ""}<div><b>${esc(ESPN_TEAM[tm.abbreviation] || tm.abbreviation || "")}</b> <span class="mv-p" dir="ltr">${esc(t.description)}</span></div><span class="muted">${agoTxt(t.date)}</span></div>`; }).join("")}</div>`
      : `<p class="empty-note">${NEWS.tx ? "אין עסקאות אחרונות." : "טוען…"}</p>`}</section>`;

  // ---- next week: who plays four times (more chances to lock) ----
  const nw = D.week + 1, ng = SEA.sch.games.filter(g => g.week === nw);
  let nextHtml = "";
  if (ng.length) {
    const cnt = {}; ng.forEach(g => [g.home.team, g.away.team].forEach(t => { cnt[t] = (cnt[t] || 0) + 1; }));
    const mine = [...X.me.st.filter(Boolean), ...X.me.bench].map(x => ({x, n: cnt[x.team] || 0})).sort((a, b) => b.n - a.n || b.x.m - a.x.m);
    const four = Object.entries(cnt).filter(([, n]) => n >= 4).map(([t]) => t).sort();
    const faFour = X.fa.list.filter(f => four.includes(f.team) && !isOut(f.inj)).sort((a, b) => b.gain - a.gain).slice(0, 4);
    const dates = [...new Set(ng.map(g => g.date))].sort();
    const hist = [1, 2, 3, 4].map(k => mine.filter(m => m.n === k).length);
    const span = `<bdi dir="ltr">${fmtShort(dObj(dates[0]))}–${fmtShort(dObj(dates[dates.length - 1]))}</bdi>`;
    const byN = [4, 3, 2, 1].map(k => [k, Object.values(cnt).filter(n => n === k).length]);
    const mxH = Math.max(1, ...hist), mxF = Math.max(0.1, ...faFour.map(f => f.gain));
    nextHtml = `<div class="row r3">
      <section class="panel nx-a"><div class="ph"><h2>השבוע הבא: הסגל שלך</h2><span class="meta">שבוע ${nw} · ${span}</span></div>
        <div class="nx-hist">${[1, 2, 3, 4].map(k => `<div class="nx-c ${k === 4 ? "top" : ""}"><b>${hist[k - 1]}</b><span class="nx-bar" style="--h:${(hist[k - 1] / mxH * 100).toFixed(1)}%"></span><small>${k} משחקים</small></div>`).join("")}</div>
        <div class="nxt-l">${mine.map(m => `<span class="nxt-p n${Math.min(m.n, 4)}" title="${esc(m.x.p.n)} · ${esc(m.x.team)} · ${m.n} משחקים">${av(m.x.p, 22)}<b class="num">${m.n}</b></span>`).join("")}</div>
        <p class="hint">ב-Lock-in כל משחק נוסף הוא עוד הזדמנות לנעילה טובה.</p></section>
      <section class="panel nx-b"><div class="ph"><h2>משחקים לכל קבוצה ב-NBA</h2><span class="meta">שבוע ${nw}</span></div>
        <div class="nx-split">${byN.filter(([, n]) => n).map(([k, n]) => `<div class="nx-s ${k === 4 ? "top" : ""}"><b>${n}</b><span>קבוצות עם ${k}</span></div>`).join("")}</div>
        <h3>עם 4 משחקים</h3>${four.length ? `<p class="nxt-tm" dir="ltr">${four.map(esc).join(" · ")}</p>` : `<p class="empty-note">אין קבוצה עם 4 משחקים.</p>`}</section>
      <section class="panel nx-c3"><div class="ph"><h2>פנויים מהקבוצות עם 4</h2><span class="meta">מול הכי חלש אצלך</span></div>
        ${faFour.length ? `<div class="swl">${faFour.map(f => `<div class="swr g">${av(f.p, 26)}<div class="swr-t"><b>${nameLink(f.p)}</b><span>${esc(f.team)} · ${f1(f.val)} לשבוע</span></div><span class="gbar"><i style="width:${(Math.max(0, f.gain) / mxF * 100).toFixed(1)}%"></i></span><b class="num ${f.gain > 0 ? "good" : "muted"}">${sg(f.gain)}</b></div>`).join("")}</div>` : `<p class="empty-note">אין שחקן פנוי שמשתלם מהקבוצות האלה.</p>`}</section></div>`;
  }
  out.innerHTML = `<div class="dgrid"><div class="row r1">${games}</div><div class="row w633">${feed}<div class="stack">${injHtml}${lgHtml}</div>${nbaHtml}</div>${nextHtml}</div>`;
}
