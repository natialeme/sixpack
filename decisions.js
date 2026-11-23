/* Shared by the dashboard and the weekly report. */
const SixDecisions = (() => {
  function role(minutes, prior, nextMinutes) {
    for (const width of [2, 1]) {
      if (minutes.length < width) continue;
      const history = minutes.slice(0, -width).slice(-5);
      const base = history.length ? history.reduce((a,b)=>a+b,0)/history.length : prior;
      if (!(base > 0)) continue;
      const recent = minutes.slice(-width);
      if (recent.every(m => m >= base + 6)) return {games:width,base,
        delta:recent.reduce((a,b)=>a+b,0)/width-base, confirmed:nextMinutes >= base+4};
    }
    return null;
  }
  function starters(rows, slots, week) {
    // Maximum-weight assignment. An unlocked starter keeps his previous score only
    // in his present slot; moving him uses his remaining games, just like a bench player.
    const held = week === 0 ? rows.filter(r=>r.keep && r.fixed >= 0) : [];
    const open = slots.map((slot,i)=>({slot,i})).filter(s=>!held.some(r=>r.fixed===s.i));
    const players = rows.filter(r=>!held.includes(r) && !(week===0 && r.keep && r.fixed<0));
    const weights = open.map(({slot,i})=>players.map(r=>{
      const pos = r.pos;
      const fits = slot==="UTIL" || pos.includes(slot) || slot==="G" && pos.some(p=>["PG","SG"].includes(p)) ||
        slot==="F" && pos.some(p=>["PF","SF"].includes(p));
      if (!fits) return -1e6;
      return week === 0 && r.fixed >= 0 && r.fixed !== i ? r.remaining ?? r.score[0] : r.score[week];
    }).concat(open.map(()=>0)));
    // Rectangular Hungarian algorithm, with an empty-player column per open slot.
    const count = players.length+open.length;
    const u = Array(open.length+1).fill(0), v = Array(count+1).fill(0);
    const owner = Array(count+1).fill(0), previous = Array(count+1).fill(0);
    for (let i=1;i<=open.length;i++) {
      owner[0]=i;
      let column=0;
      const costs=Array(count+1).fill(Infinity), seen=Array(count+1).fill(false);
      do {
        seen[column]=true;
        const row=owner[column];
        let step=Infinity, next=0;
        for(let j=1;j<=count;j++) if(!seen[j]) {
          const cost=-weights[row-1][j-1]-u[row]-v[j];
          if(cost<costs[j]) {costs[j]=cost;previous[j]=column;}
          if(costs[j]<step) {step=costs[j];next=j;}
        }
        for(let j=0;j<=count;j++) {
          if(seen[j]) {u[owner[j]]+=step;v[j]-=step;} else costs[j]-=step;
        }
        column=next;
      } while(owner[column]);
      do {
        const next=previous[column]; owner[column]=owner[next]; column=next;
      } while(column);
    }
    const ids=held.map(r=>r.id), retained=ids.slice();
    let total=held.reduce((a,r)=>a+r.score[0],0);
    for(let j=1;j<=players.length;j++) if(owner[j]) {
      const i=owner[j]-1, points=weights[i][j-1];
      if(points<=0) continue;
      const r=players[j-1]; ids.push(r.id); total+=points;
      if(week===0 && r.fixed===open[i].i) retained.push(r.id);
    }
    return {ids,total,retained};
  }
  function swaps(pool, candidates, slots) {
    const base = [0,1].map(i => starters(pool,slots,i)), pairs = [];
    for (const c of candidates) {
      let best = null;
      for (const d of pool) {
        if (d.keep || d.protect || (c.actual != null && d.actual != null && c.actual <= d.actual)) continue;
        const roster = pool.filter(r=>r!==d).concat(c);
        const after = [0,1].map(i=>starters(roster,slots,i));
        const gains = after.map((v,i)=>v.total-base[i].total), total = gains[0]+gains[1];
        if (total < 1 || best && total <= best.total) continue;
        best = {add:c.id,drop:d.id,gains,total,baseline:base.map(x=>x.ids),after:after.map(x=>x.ids),retainedBefore:base[0].retained,retainedAfter:after[0].retained};
      }
      if (best) pairs.push(best);
    }
    return pairs.sort((a,b)=>b.total-a.total || b.gains[0]-a.gains[0]);
  }
  return {role,swaps,starters};
})();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SixDecisions;
  if (require.main === module) {
    const input = JSON.parse(require('node:fs').readFileSync(0,'utf8'));
    const roles = Object.fromEntries(input.signals.map(s=>[s.id,SixDecisions.role(s.minutes,s.prior,s.next)]));
    process.stdout.write(JSON.stringify({roles,swaps:SixDecisions.swaps(input.pool,input.candidates,input.slots)}));
  }
}
