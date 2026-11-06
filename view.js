/* Bản sao số đỗ xe trên đường — phần xem công khai (bản đồ, chỉ số, biểu đồ, hồ sơ đoạn phố, nhật ký)
   © TS. Đặng Minh Tân — Bộ môn Đường bộ – Sân bay, Khoa Công trình và Môi trường, Trường ĐH Giao thông Vận tải */
const $=s=>document.querySelector(s);
let C={},selLink=null,selBay=null,mode='occ',formFor=undefined,ff=false;
const pc=$('#phys'),tc=$('#twin'),cc=$('#chart');
const bgP=document.createElement('canvas'),bgT=document.createElement('canvas');
let scP=1,scT=1;
const TOK=['bg','panel','ink','muted','line','asphalt','asphalt2','walk','bldg','bldg2','park','mark','yellow','tbg','tgrid','amber','teal','free','occ','res','unk','viol','mid'];
function readTokens(){const cs=getComputedStyle(document.documentElement);TOK.forEach(k=>C[k]=cs.getPropertyValue('--'+k).trim());buildBg();drawChart();legend()}
function hex(c){c=(c||'#888').replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]}
function mix(a,b,t){const A=hex(a),B=hex(b);return`rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`}
function occColor(o){if(o==null)return C.unk;return o<.7?mix(C.free,C.mid,o/.7):mix(C.mid,C.occ,Math.min(1,(o-.7)/.25))}
function priceColor(p){return mix(C.line,C.teal,Math.max(0,Math.min(1,(p-10)/50)))}
function ruleColor(r){return r.mode==='none'?C.occ:r.mode==='peak'?C.amber:r.mode==='one'?C.res:r.mode==='oddeven'?C.teal:C.free}
function sizeCv(cv){const w=cv.clientWidth;const d=window.devicePixelRatio||1;cv.width=Math.round(w*d);cv.height=Math.round(w*H/W*d);cv.style.height=w*H/W+'px';return cv.width/W}
function resize(){scP=sizeCv(pc);scT=sizeCv(tc);const w=cc.clientWidth,d=window.devicePixelRatio||1,h=Math.max(200,w*.36);cc.width=w*d;cc.height=h*d;cc.style.height=h+'px';buildBg();drawChart()}
function rr(x,a,b,w,h,r){x.beginPath();if(x.roundRect)x.roundRect(a,b,w,h,r);else x.rect(a,b,w,h)}
function hash(n){n=Math.sin(n*127.1)*43758.5453;return n-Math.floor(n)}
function bolt(x,cx,cy,s,col){x.fillStyle=col;x.beginPath();x.moveTo(cx+1*s,cy-5*s);x.lineTo(cx-3*s,cy+1*s);x.lineTo(cx,cy+1*s);x.lineTo(cx-1*s,cy+5*s);x.lineTo(cx+3*s,cy-1*s);x.lineTo(cx,cy-1*s);x.closePath();x.fill()}
function roadRect(x,l,hw,ext){const A=nodes[l.a];x.save();x.translate(A.x,A.y);x.rotate(Math.atan2(l.dy,l.dx));x.fillRect(-ext,-hw,l.L+2*ext,2*hw);x.restore()}
const sideName=(l,s)=>l.horiz?(s>0?'Lề Nam':'Lề Bắc'):(s>0?'Lề Tây':'Lề Đông');

function buildBg(){
  if(!pc.width||!C.bg)return;
  bgP.width=pc.width;bgP.height=pc.height;let x=bgP.getContext('2d');x.setTransform(scP,0,0,scP,0,0);
  x.fillStyle=C.walk;x.fillRect(0,0,W,H);
  POIS.forEach((P,i)=>{const[x1,y1,x2,y2]=blkRect(P[0],P[1]);x.fillStyle=P[2]==='park'?C.park:C.bldg;x.fillRect(x1,y1,x2-x1,y2-y1);
    if(P[2]!=='park'){x.fillStyle=C.bldg2;for(let k=0;k<7;k++){const w=24+hash(i*31+k)*40,h=18+hash(i*17+k*3)*30;
      x.fillRect(x1+8+hash(i*7+k*11)*(x2-x1-w-16),y1+8+hash(i*5+k*13)*(y2-y1-h-16),w,h)}}
    else{x.fillStyle=C.free;x.globalAlpha=.25;for(let k=0;k<26;k++){x.beginPath();x.arc(x1+10+hash(k*3.1)*(x2-x1-20),y1+10+hash(k*7.7)*(y2-y1-20),5+hash(k)*5,0,7);x.fill()}x.globalAlpha=1}
    x.textAlign='center';x.font='600 12px "Be Vietnam Pro",sans-serif';const cx=(x1+x2)/2,cy=(y1+y2)/2;
    x.fillStyle=C.walk;x.globalAlpha=.85;const tw=x.measureText(P[3]).width;rr(x,cx-tw/2-6,cy-14,tw+12,30,5);x.fill();x.globalAlpha=1;
    x.fillStyle=C.ink;x.fillText(P[3],cx,cy);x.font='10.5px "Be Vietnam Pro",sans-serif';x.fillStyle=C.muted;x.fillText(TYPES[P[2]].label,cx,cy+12)});
  x.fillStyle=C.asphalt;links.forEach(l=>roadRect(x,l,l.kind==='local'?30:22,l.kind==='gate'?0:2));
  nodes.forEach(n=>{if(!n.gate)x.fillRect(n.x-30,n.y-30,60,60)});
  links.forEach(l=>{const A=nodes[l.a];x.save();x.translate(A.x,A.y);x.rotate(Math.atan2(l.dy,l.dx));
    if(l.kind==='art'){x.strokeStyle=C.yellow;x.lineWidth=1.3;x.beginPath();x.moveTo(32,-1.6);x.lineTo(l.L-32,-1.6);x.moveTo(32,1.6);x.lineTo(l.L-32,1.6);x.stroke()}
    else if(l.kind==='local'){x.strokeStyle=C.mark;x.globalAlpha=.6;x.lineWidth=1;x.setLineDash([9,8]);x.beginPath();x.moveTo(34,0);x.lineTo(l.L-34,0);x.stroke();x.setLineDash([]);x.globalAlpha=1}
    if(l.kind!=='gate'){x.fillStyle=C.mark;x.globalAlpha=.4;const hw=l.kind==='local'?28:20;for(const s0 of[33,l.L-41])for(let y=-hw;y<hw;y+=6)x.fillRect(s0,y,8,3.5);x.globalAlpha=1}
    x.restore()});
  bays.forEach(b=>{x.save();x.translate(b.x,b.y);x.rotate(Math.atan2(b.link.dy,b.link.dx));
    if(b.fixedNp){x.strokeStyle=C.occ;x.lineWidth=1.4;x.beginPath();for(let k=-12;k<12;k+=6){x.moveTo(k,-7);x.lineTo(k+6,7)}x.stroke();x.strokeRect(-11.5,-7.5,23,15)}
    else if(b.buffer){x.strokeStyle=C.mark;x.globalAlpha=.8;x.lineWidth=1.1;x.strokeRect(-11.5,-7.5,23,15);x.beginPath();x.rect(-11.5,-7.5,23,15);x.clip();x.beginPath();for(let k=-26;k<12;k+=5){x.moveTo(k,7.5);x.lineTo(k+15,-7.5)}x.stroke();x.globalAlpha=1}
    else if(b.kind==='ev'){x.fillStyle=C.free;x.globalAlpha=.3;x.fillRect(-11.5,-7.5,23,15);x.globalAlpha=1;x.strokeStyle=C.free;x.lineWidth=1.3;x.strokeRect(-11.5,-7.5,23,15);bolt(x,0,0,1,C.free)}
    else if(b.kind==='load'){x.strokeStyle=C.yellow;x.lineWidth=1.4;x.strokeRect(-11.5,-7.5,23,15);x.beginPath();x.moveTo(-11.5,-7.5);x.lineTo(11.5,7.5);x.moveTo(11.5,-7.5);x.lineTo(-11.5,7.5);x.stroke()}
    else{x.strokeStyle=C.mark;x.globalAlpha=.55;x.lineWidth=1;x.strokeRect(-11.5,-7.5,23,15);x.globalAlpha=1}x.restore()});
  const cams=bays.filter(b=>b.fixedNp&&b.i===2).map(b=>[b.x-16*b.link.dx,b.y-16*b.link.dy-14*b.side]);
  gateIds.forEach(id=>{const G=nodes[id],B=nodes[G.bnd];cams.push([B.x+(G.x-B.x)*.12+18,B.y+(G.y-B.y)*.12-24])});
  cams.forEach(([cx,cy])=>{x.fillStyle=C.ink;rr(x,cx-6,cy-3.5,12,7,2);x.fill();x.fillStyle=C.teal;x.beginPath();x.arc(cx+3,cy,1.6,0,7);x.fill()});
  // bản sao
  bgT.width=tc.width;bgT.height=tc.height;x=bgT.getContext('2d');x.setTransform(scT,0,0,scT,0,0);
  x.fillStyle=C.tbg;x.fillRect(0,0,W,H);x.strokeStyle=C.tgrid;x.lineWidth=1;
  for(let gx=0;gx<=W;gx+=25){x.beginPath();x.moveTo(gx+.5,0);x.lineTo(gx+.5,H);x.stroke()}for(let gy=0;gy<=H;gy+=25){x.beginPath();x.moveTo(0,gy+.5);x.lineTo(W,gy+.5);x.stroke()}
  POIS.forEach(P=>{const[x1,y1,x2,y2]=blkRect(P[0],P[1]);x.strokeStyle=C.line;x.setLineDash([3,4]);x.strokeRect(x1+8,y1+8,x2-x1-16,y2-y1-16);x.setLineDash([]);
    x.textAlign='center';x.fillStyle=C.muted;x.font='500 11.5px "Be Vietnam Pro",sans-serif';x.fillText(P[3],(x1+x2)/2,(y1+y2)/2+4)});
  x.font='600 10px "JetBrains Mono",monospace';x.fillStyle=C.muted;x.textAlign='left';
  [0,1,2,3].forEach(r=>x.fillText(HSTREET[r].toUpperCase(),CX[0]+40,RY[r]-24));
  [0,1,2,3,4].forEach(c=>{x.save();x.translate(CX[c]+(c===4?-24:30),RY[0]+40);x.rotate(Math.PI/2);x.fillText(VSTREET[c].toUpperCase(),0,0);x.restore()});
}
function curbBan(l,s){const r=l.rule;if(!r)return null;if(r.mode==='oddeven')return s!==allowedSide(r)?'ban':null;if(r.mode==='none'||(r.mode==='one'&&s===r.banSide))return'ban';if(r.mode==='peak')return isPeak(sim.t)?'ban':'time';return null}
function drawPhys(){
  const x=pc.getContext('2d');x.setTransform(1,0,0,1,0,0);x.drawImage(bgP,0,0);x.setTransform(scP,0,0,scP,0,0);
  const now=performance.now(),blink=(now/350|0)%2;
  links.forEach(l=>{if(!l.rule)return;[-1,1].forEach(s=>{const st=curbBan(l,s);if(!st)return;const A=nodes[l.a],o=s*28.5;
    x.strokeStyle=st==='ban'?C.occ:C.amber;x.lineWidth=2.4;x.setLineDash(st==='ban'?[]:[6,5]);x.beginPath();
    x.moveTo(A.x+l.dx*32+l.nx*o,A.y+l.dy*32+l.ny*o);x.lineTo(A.x+l.dx*(l.L-32)+l.nx*o,A.y+l.dy*(l.L-32)+l.ny*o);x.stroke();x.setLineDash([])})});
  bays.forEach(b=>{if(b.fixedNp)return;const l=b.link;
    if(b.kind==='ev'){const px=b.x+l.nx*b.side*12,py=b.y+l.ny*b.side*12;x.fillStyle=b.charger&&b.charger.ok?C.teal:(blink?C.occ:C.asphalt);x.fillRect(px-2.5,py-2.5,5,5);return}
    const sx=b.x-l.nx*b.side*8,sy=b.y-l.ny*b.side*8;x.beginPath();x.arc(sx,sy,1.7,0,7);x.fillStyle=b.ok?C.teal:(blink?C.occ:C.asphalt);x.fill()});
  if(selLink){const l=selLink,A=nodes[l.a];x.save();x.translate(A.x,A.y);x.rotate(Math.atan2(l.dy,l.dx));x.strokeStyle=C.ink;x.lineWidth=2;x.setLineDash([6,4]);const hw=l.kind==='local'?32:24;x.strokeRect(30,-hw,l.L-60,2*hw);x.setLineDash([]);x.restore()}
  for(const c of cars){
    let e=c.state==='parked'||c.state==='waitOut'||c.state==='out'?c.bay.edge:c.e;const ang=Math.atan2(e.dy,e.dx);
    if(c.charging&&c.bay){const b=c.bay,l=b.link;x.strokeStyle=C.teal;x.lineWidth=1.2;x.beginPath();x.moveTo(c.x,c.y);x.lineTo(b.x+l.nx*b.side*12,b.y+l.ny*b.side*12);x.stroke()}
    x.save();x.translate(c.x,c.y);x.rotate(ang);
    if(c.state==='drive'||c.state==='in'){const ring=c.type==='seek'?C.amber:c.type==='guided'?C.teal:null;
      if(ring){x.strokeStyle=ring;x.lineWidth=2;rr(x,c.van?-15.5:-12.5,-7.5,c.van?31:25,15,5);x.stroke()}}
    if(c.van){x.fillStyle=c.col;rr(x,-13,-5.5,26,11,2);x.fill();x.fillStyle=C.muted;x.fillRect(-13,-5.5,17,1.4);x.fillRect(-13,4.1,17,1.4);x.fillStyle='rgba(20,28,32,.55)';x.fillRect(6,-4,3.5,8)}
    else{x.fillStyle=c.col;rr(x,-10,-4.8,20,9.6,2.5);x.fill();x.fillStyle='rgba(20,28,32,.55)';x.fillRect(2,-3.6,3.5,7.2);x.fillRect(-6.5,-3.6,2.6,7.2);
      if(c.ev){x.fillStyle=C.free;x.beginPath();x.arc(-2,0,2.3,0,7);x.fill()}}
    x.restore();
    if(c.charging){x.fillStyle=C.teal;x.globalAlpha=.5+.5*Math.sin(now/220);x.beginPath();x.arc(c.x,c.y-10,2.6,0,7);x.fill();x.globalAlpha=1}
    if(c.illegal&&c.state==='parked'){x.fillStyle=C.viol;x.beginPath();x.arc(c.x,c.y-10,3,0,7);x.fill()}
  }
}
function guidedPath(c){const pts=[[c.x,c.y]];if(!c.tB)return pts;let n=c.e.to;if(c.e!==c.tB.edge||c.s>c.tB.sp){pts.push([nodes[n].x,nodes[n].y]);let k=0;while(n!==c.tB.edge.from&&k++<30){n=nxt[n][c.tB.edge.from];if(n<0)break;pts.push([nodes[n].x,nodes[n].y])}}pts.push([c.tB.x,c.tB.y]);return pts}
function vis(b){const tw=twin[b.idx];
  if(b.buffer&&tw.st!=='occ')return{x:C.muted,c:'buf'};
  if(tw.st==='unk')return{f:C.unk,c:'unk'};
  if(b.kind==='ev'){if(tw.chg==='fault')return{f:C.unk,c:'unk'};
    if(tw.st==='occ'){if(tw.flag)return{f:C.viol,c:'viol'};if(tw.chg==='charging')return{f:C.teal,c:'chg'};if(tw.chg==='done')return{f:C.amber,c:'done'};return{f:C.occ,c:'occ'}}
    if(banned(b))return{r:C.occ,c:'ban'};return b.res?{f:C.res,c:'res'}:{r:C.free,c:'ring'}}
  if(tw.st==='occ')return tw.flag?{f:C.viol,c:'viol'}:b.kind==='load'?{f:C.yellow,c:'ldo'}:{f:C.occ,c:'occ'};
  if(banned(b))return{r:C.occ,c:'ban'};
  if(b.res)return{f:C.res,c:'res'};
  return b.kind==='load'?{r:C.yellow,c:'ldr'}:{f:C.free,c:''};
}
function misOf(b){const truth=b.car&&b.car.state!=='in'?'occ':'free',tv=twin[b.idx].st;return tv!=='unk'&&tv!==truth}
function drawTwin(){
  const x=tc.getContext('2d');x.setTransform(1,0,0,1,0,0);x.drawImage(bgT,0,0);x.setTransform(scT,0,0,scT,0,0);
  links.forEach(l=>{const A=nodes[l.a],B=nodes[l.b];
    if(l.kind!=='local'){x.strokeStyle=C.line;x.lineWidth=l.kind==='art'?14:6}
    else{x.strokeStyle=mode==='occ'?occColor(linkOcc(l)):mode==='price'?priceColor(l.price):ruleColor(l.rule);x.lineWidth=10}
    x.beginPath();x.moveTo(A.x+l.dx*(l.kind==='gate'?0:14),A.y+l.dy*(l.kind==='gate'?0:14));x.lineTo(B.x-l.dx*14,B.y-l.dy*14);x.stroke();
    if(l.kind==='local'&&mode!=='occ'){const r=l.rule,t=mode==='price'?l.price+' nghìn đ/h':({both:'đỗ 2 bên',one:'đỗ 1 bên',oddeven:'chẵn lẻ',peak:'cấm giờ cao điểm',none:'cấm đỗ'})[r.mode]+(r.pattern==='gap'&&r.mode!=='none'?` · ${r.grp}+${r.buf}`:'')+(r.ev?' · '+r.ev+' trụ':'');
      x.save();x.translate((A.x+B.x)/2,(A.y+B.y)/2);if(!l.horiz)x.rotate(-Math.PI/2);
      x.font='600 9.5px "JetBrains Mono",monospace';x.textAlign='center';const tw=x.measureText(t).width;
      x.fillStyle=C.tbg;rr(x,-tw/2-5,-7,tw+10,14,7);x.fill();x.strokeStyle=x.fillStyle=C.ink;x.lineWidth=.6;x.stroke();x.fillText(t,0,3.5);x.restore()}});
  nodes.forEach(n=>{if(n.gate)return;x.fillStyle=C.tbg;x.strokeStyle=C.muted;x.lineWidth=1.2;x.beginPath();x.arc(n.x,n.y,6,0,7);x.fill();x.stroke()});
  bays.forEach(b=>{const l=b.link,v=vis(b);const px=nodes[l.a].x+l.dx*b.s+l.nx*b.side*13,py=nodes[l.a].y+l.dy*b.s+l.ny*b.side*13;
    if(v.x){x.strokeStyle=v.x;x.lineWidth=1.1;x.beginPath();x.moveTo(px-2.5,py-2.5);x.lineTo(px+2.5,py+2.5);x.moveTo(px+2.5,py-2.5);x.lineTo(px-2.5,py+2.5);x.stroke();return}
    x.beginPath();if(b.kind==='ev')x.arc(px,py,3.8,0,7);else if(b.kind==='load'){x.moveTo(px,py-4.4);x.lineTo(px+4.4,py);x.lineTo(px,py+4.4);x.lineTo(px-4.4,py);x.closePath()}else x.rect(px-3,py-3,6,6);
    if(v.f){x.fillStyle=v.f;x.fill()}else{x.strokeStyle=v.r;x.lineWidth=1.4;x.stroke()}
    if(misOf(b)){x.fillStyle=C.ink;x.beginPath();x.arc(px+l.nx*b.side*7,py+l.ny*b.side*7,2,0,7);x.fill()}
    if(selBay===b){x.strokeStyle=C.ink;x.lineWidth=1.5;x.strokeRect(px-5.5,py-5.5,11,11)}});
  cars.forEach(c=>{if(c.type!=='guided'||c.state!=='drive')return;const pts=guidedPath(c);
    x.strokeStyle=C.teal;x.globalAlpha=.55;x.lineWidth=1.3;x.setLineDash([4,4]);x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();x.setLineDash([]);x.globalAlpha=1;
    x.fillStyle=c.ev?C.free:C.teal;x.beginPath();x.arc(c.x,c.y,4,0,7);x.fill();x.strokeStyle=C.tbg;x.lineWidth=1.2;x.stroke()});
  if(selLink){const l=selLink,A=nodes[l.a],B=nodes[l.b];x.strokeStyle=C.ink;x.lineWidth=1.5;x.setLineDash([5,3]);
    const o=l.kind==='local'?20:12;x.beginPath();x.moveTo(A.x+l.dx*14+l.nx*o,A.y+l.dy*14+l.ny*o);x.lineTo(B.x-l.dx*14+l.nx*o,B.y-l.dy*14+l.ny*o);
    x.moveTo(A.x+l.dx*14-l.nx*o,A.y+l.dy*14-l.ny*o);x.lineTo(B.x-l.dx*14-l.nx*o,B.y-l.dy*14-l.ny*o);x.stroke();x.setLineDash([])}
}
function legend(){const el=$('#tlegend');
  const head=mode==='occ'?`<span>Đoạn phố <span class="grad" style="background:linear-gradient(90deg,${C.free},${C.mid},${C.occ})"></span> 0 → 70% → 95%+</span>`
    :mode==='price'?`<span>Giá <span class="grad" style="background:linear-gradient(90deg,${C.line},${C.teal})"></span> 10 → 60 nghìn đ/h</span>`
    :`<span><i class="line" style="background:var(--free)"></i>Hai bên</span><span><i class="line" style="background:var(--res)"></i>Một bên</span><span><i class="line" style="background:var(--teal)"></i>Chẵn lẻ</span><span><i class="line" style="background:var(--amber)"></i>Cấm giờ cao điểm</span><span><i class="line" style="background:var(--occ)"></i>Cấm cả ngày</span>`;
  el.innerHTML=head+`<span><i style="background:var(--free)"></i>Trống</span><span><i style="background:var(--occ)"></i>Có xe</span><span><i style="background:var(--res)"></i>Đã giữ chỗ</span><span><i style="background:var(--viol)"></i>Vi phạm</span><span><i style="background:var(--unk)"></i>Mất tín hiệu</span><span><i class="ring" style="border-color:var(--occ)"></i>Đang cấm đỗ</span><span>× Ô đệm</span>`
   +`<span><i class="dot" style="background:var(--teal)"></i>Trụ: đang sạc</span><span><i class="dot" style="background:var(--amber)"></i>Trụ: sạc xong, xe chưa đi</span><span><i class="dot ring" style="border-color:var(--free)"></i>Trụ trống</span><span><i style="background:var(--yellow);transform:rotate(45deg) scale(.8)"></i>Ô bốc dỡ</span><span>● Sai lệch với thực tế</span>`}

// ---- tương tác bản đồ ----
function pick(ev,cv){const r=cv.getBoundingClientRect();const px=(ev.clientX-r.left)/r.width*W,py=(ev.clientY-r.top)/r.height*H;
  let best=null,bd=34;links.forEach(l=>{if(l.kind==='gate')return;const A=nodes[l.a];const t=Math.max(0,Math.min(l.L,(px-A.x)*l.dx+(py-A.y)*l.dy));
    const d=Math.hypot(A.x+l.dx*t-px,A.y+l.dy*t-py);if(d<bd){bd=d;best=l}});
  if(best){if(best!==selLink)selBay=null;selLink=best;
    if(best.kind==='local'){let bb=null,bdd=14;best.bays.forEach(b=>{const d=Math.hypot(b.x-px,b.y-py);if(d<bdd){bdd=d;bb=b}});if(bb)selBay=bb}
    ui()}}
pc.addEventListener('click',e=>pick(e,pc));tc.addEventListener('click',e=>pick(e,tc));
$('#dinfo').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){selBay=bays[+b.dataset.i];ui()}});

// ---- chỉ số ----
function avg(a){return a.length?a.reduce((x,y)=>x+y)/a.length:null}
function setBar(id,v,mx,txt){$('#'+id).style.width=(v!=null?v/mx*100:0)+'%';$('#'+id+'v').textContent=v!=null?txt(v):'–'}
const vn=(v,d)=>v.toFixed(d).replace('.',',');
const KIND={buf:'Ô đệm, không được đỗ',std:'Ô đỗ thường',ev:'Ô có trụ sạc 22 kW',load:'Ô bốc dỡ hàng'};
function ui(){
  document.querySelectorAll('.simclock').forEach(e=>e.textContent=fmtT(sim.t));
  $('#sDay').textContent=(sim.day%2?'Thứ Bảy 07/11 · ngày lẻ':'Thứ Sáu 06/11 · ngày chẵn');
  $('#sRun').textContent=sim.t>=END?'đã kết thúc ngày':ff?'đang chạy nhanh':sim.running?'đang chạy':'tạm dừng';
  $('#sPlan').textContent=planName;
  let mis=0;bays.forEach(b=>{if(misOf(b))mis++});
  const cruising=cars.filter(c=>(c.type==='seek'||c.type==='guided')&&c.state==='drive').length;
  const km=stats.cruisePx/1000,eu=evUtil(),nEv=bays.filter(b=>b.kind==='ev').length;
  $('#k1').innerHTML=`${Math.round(totalOcc()*100)}<small>%</small>`;
  $('#k2').innerHTML=`${cruising}<small>xe</small>`;
  $('#k3').innerHTML=`${vn(km,1)}<small>km</small>`;
  $('#k4').innerHTML=`${vn(km*.18,1)}<small>kg</small>`;
  $('#k5').innerHTML=`${vn((stats.revenue+stats.chgRev+stats.idleRev)/1000,2)}<small>triệu đ</small>`;
  $('#k6').innerHTML=`${stats.parked}<small>·</small> ${stats.vans}`;
  $('#k7').innerHTML=`${stats.vDet}<small>/</small> ${stats.vDone}`;$('#k7w').classList.toggle('warn',stats.vDet-stats.vDone>2);
  $('#k8').innerHTML=`${mis}<small>ô</small>`;
  $('#k9').innerHTML=`${eu.u}<small>/ ${nEv} trụ${eu.n<nEv?' · '+(nEv-eu.n)+' lỗi':''}</small>`;
  $('#k10').innerHTML=`${Math.round(stats.kwh).toLocaleString('vi-VN')}<small>kWh</small>`;
  const sg=avg(stats.sg),sf=avg(stats.sf),wg=avg(stats.wg),wf=avg(stats.wf);
  const ms=Math.max(sg||0,sf||0,3),mw=Math.max(wg||0,wf||0,100);
  setBar('cg',sg,ms,v=>vn(v,1)+' ph');setBar('cf',sf,ms,v=>vn(v,1)+' ph');
  setBar('wg',wg,mw,v=>Math.round(v)+' m');setBar('wf',wf,mw,v=>Math.round(v)+' m');
  $('#aband').textContent=`${stats.aband} xe bỏ cuộc · ${stats.reroute} lần điều hướng lại · ${stats.evUnserved} xe điện cần sạc nhưng không có trụ`;
  const okN=bays.filter(b=>b.ok&&!b.fixedNp).length,lat=avg(sim.lat)||0;
  $('#a1').textContent=`${cars.filter(c=>c.state==='drive').length} xe chạy · ${cars.filter(c=>c.state==='parked'||c.state==='waitOut').length} xe đỗ`;
  $('#a2').textContent=`${okN}/${bays.length-4} cảm biến · ${eu.n}/${nEv} trụ`;
  $('#a3').textContent=`${stats.msgs.toLocaleString('vi-VN')} bản tin · trễ ${Math.round(lat)} s`;
  $('#a4').textContent=`${mis} ô sai lệch · ${cars.filter(c=>c.charging).length} phiên sạc`;
  $('#a5').textContent=planName+' · '+([sim.guide?'điều hướng':null,sim.dyn?'giá động':null,sim.enf?'cưỡng chế':null].filter(Boolean).join(', ')||'chỉ giám sát');
  detail();
  if(window.ADM)ADM.tick();
  if(logDirty){logDirty=false;$('#log').innerHTML=logs.slice(0,60).map(l=>`<li class="${l.cls}"><time>${fmtT(l.t)}</time><span>${l.msg}</span></li>`).join('');$('#logc').textContent=logs.length+' sự kiện gần nhất'}
  drawChart();
}
function detail(){
  const el=$('#dinfo'),l=selLink;if(!l){el.innerHTML='<p class="muted">Bấm vào một đoạn phố trên bản đồ để xem hồ sơ số của đoạn đó.</p>';return}
  const near=[l.sideBlk[1],l.sideBlk[-1]].filter(Boolean).map(b=>POIS[poiAt[b[0]+','+b[1]]][3]).join(' · ')||'–';
  let h=`<div class="dhead"><h3>${l.street} · đoạn ${l.code}</h3><span class="tag">${l.kind==='art'?'Trục chính':'Phố nội khu'} · ${Math.round(l.L)} m</span></div>`;
  if(l.kind!=='local'){el.innerHTML=h+`<p class="muted" style="margin:10px 0 0">Trục chính hai chiều, cấm dừng đỗ để giữ năng lực thông hành. Bản sao số chỉ theo dõi lưu lượng qua camera ở cửa ngõ. Hai bên: ${near}.</p>`;return}
  const r=l.rule,ot=linkOcc(l),or=linkOcc(l,true),faults=l.bays.filter(b=>!b.ok).length,viol=l.bays.filter(b=>twin[b.idx].flag).length,avgO=l.occN?l.occSum/l.occN:null;
  const evb=l.bays.filter(b=>b.kind==='ev'),evc=evb.filter(b=>b.car&&b.car.charging).length;
  const modeTxt=MODES[r.mode]+(r.mode==='one'?` (cấm ${sideName(l,r.banSide).toLowerCase()})`:r.mode==='oddeven'?` · hôm nay ngày ${dayEven()?'chẵn':'lẻ'}, đỗ ${sideName(l,allowedSide(r)).toLowerCase()}`:r.mode==='peak'?(isPeak(sim.t)?' · đang cấm':' · ngoài giờ cấm'):'')
    +(r.pattern==='gap'?` · gián đoạn ${r.grp} ô + ${r.buf} ô đệm`:'');
  h+=`<div class="dgrid">
    <div style="grid-column:1/-1"><span>Quy tắc đang áp dụng</span><b style="font-family:var(--f-body)">${modeTxt}</b></div>
    <div><span>Chiếm dụng (số)</span><b>${ot==null?'–':Math.round(ot*100)+'%'}</b></div>
    <div><span>Chiếm dụng (thực)</span><b>${or==null?'–':Math.round(or*100)+'%'}</b></div>
    <div><span>TB từ đầu ngày</span><b>${avgO==null?'–':Math.round(avgO*100)+'%'}</b></div>
    <div><span>Giá hiện tại</span><b>${l.price} nghìn đ/h</b></div>
    <div><span>Giới hạn thời gian</span><b>${r.limit/60} giờ</b></div>
    <div><span>Trụ sạc đang sạc</span><b>${evc}/${evb.length}</b></div>
    <div><span>Ô bốc dỡ hàng</span><b>${l.bays.filter(b=>b.kind==='load').length}</b></div>
    <div><span>Cảm biến lỗi · vi phạm</span><b>${faults} · ${viol}</b></div>
    <div style="grid-column:1/-1"><span>Điểm thu hút hai bên</span><b style="font-family:var(--f-body)">${near}</b></div></div>`;
  [-1,1].forEach(s=>{const bs=l.bays.filter(b=>b.side===s);
    h+=`<div class="side"><span>${sideName(l,s)}</span><div class="chips">${bs.map(b=>{const v=vis(b);
      return`<button type="button" class="chip k-${b.kind} ${v.c}${misOf(b)?' mis':''}${selBay===b?' sel':''}" data-i="${b.idx}" aria-label="Ô ${b.code}">${b.kind==='ev'?'⚡':b.i+1}</button>`}).join('')}</div></div>`});
  if(selBay&&selBay.link===l){const b=selBay,tw=twin[b.idx],c=b.car;
    const fl=tw.flag?' · '+VMSG[tw.flag]:'';
    const stTxt=tw.st==='unk'?'Mất tín hiệu':tw.st==='occ'?'Có xe'+fl:(banned(b)?'Trống · đang cấm đỗ':'Trống')+(b.res&&tw.st==='free'?' · đã giữ chỗ':'');
    const dur=tw.st==='occ'?sim.t-tw.since:0,fee=tw.st==='occ'&&b.kind==='std'&&!banned(b)?l.price*Math.ceil(dur/1800)/2:0;
    const chgTxt=b.kind!=='ev'?null:!b.charger.ok?'Lỗi · sửa lúc '+fmtT(b.charger.repairAt):tw.chg==='charging'?`Đang sạc${c&&c.needK?` · ${vn(c.kwh,1)}/${vn(c.needK,1)} kWh`:''}`:tw.chg==='done'?'Sạc xong lúc '+fmtT(tw.doneAt):'Sẵn sàng';
    const rows=[['Loại ô',KIND[b.buffer?'buf':b.kind]+(b.fixedNp?' · vùng cấm có camera':'')],['Trạng thái số',stTxt],['Thực tế',c&&c.state!=='in'?'Có xe':'Trống'],
      ['Mã xe (giả lập)',tw.st==='occ'?tw.id:'–'],['Đến lúc',tw.st==='occ'?fmtT(tw.since):'–'],['Thời gian đỗ',tw.st==='occ'?Math.round(dur/60)+' phút':'–'],
      ['Phí đỗ tạm tính',fee?Math.round(fee)+' nghìn đ':'–']];
    if(chgTxt)rows.push(['Trụ sạc',chgTxt]);
    rows.push(['Cảm biến',b.fixedNp?'Camera':b.ok?'Hoạt động':'Lỗi · thay lúc '+fmtT(b.repairAt)],['Cập nhật cuối',fmtT(tw.upd)]);
    h+=`<div class="baybox"><b>Ô ${b.code}</b><div class="dgrid">${rows.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>`}
  else h+=`<p class="hint">Bấm vào một ô để xem hồ sơ ô.</p>`;
  el.innerHTML=h;
}
// ---- biểu đồ ----
function drawChart(){
  if(!cc.width||!sim||!C.bg)return;const x=cc.getContext('2d'),d=window.devicePixelRatio||1,w=cc.width/d,h=cc.height/d;x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);
  const L=38,Rr=36,T=10,B=24,pw=w-L-Rr,ph=h-T-B,t0=6*3600,t1=22*3600;const X=t=>L+(t-t0)/(t1-t0)*pw,Y=v=>T+(1-v)*ph;
  x.fillStyle=C.line;x.globalAlpha=.45;PEAKS.forEach(([a,b])=>x.fillRect(X(a),T,X(b)-X(a),ph));x.globalAlpha=1;
  const crMax=Math.max(20,Math.ceil(Math.max(0,...samples.map(s=>s.cr))*1.2/10)*10);
  x.font='11px "JetBrains Mono",monospace';x.strokeStyle=C.line;x.lineWidth=1;x.fillStyle=C.muted;
  [0,.25,.5,.75,1].forEach(v=>{x.beginPath();x.moveTo(L,Y(v)+.5);x.lineTo(L+pw,Y(v)+.5);x.stroke();x.textAlign='right';x.fillText(v*100+'%',L-5,Y(v)+4);x.textAlign='left';x.fillText(Math.round(v*crMax),L+pw+5,Y(v)+4)});
  x.textAlign='center';for(let hh=6;hh<=22;hh+=2)x.fillText(hh+'h',X(hh*3600),h-6);
  const bw=Math.max(1,pw/192-1);x.fillStyle=C.amber;x.globalAlpha=.45;samples.forEach(s=>{const v=s.cr/crMax;x.fillRect(X(s.t)-bw/2,Y(v),bw,v*ph)});x.globalAlpha=1;
  x.setLineDash([5,4]);x.strokeStyle=C.muted;x.beginPath();x.moveTo(L,Y(.85));x.lineTo(L+pw,Y(.85));x.stroke();x.setLineDash([]);
  x.textAlign='left';x.fillStyle=C.muted;x.fillText('85%',L+4,Y(.85)-4);
  if(samples.length){
    x.strokeStyle=C.free;x.lineWidth=1.6;x.beginPath();samples.forEach((s,i)=>i?x.lineTo(X(s.t),Y(s.ev)):x.moveTo(X(s.t),Y(s.ev)));x.stroke();
    x.strokeStyle=C.teal;x.lineWidth=2.2;x.beginPath();samples.forEach((s,i)=>i?x.lineTo(X(s.t),Y(s.o)):x.moveTo(X(s.t),Y(s.o)));x.stroke();
    const lt=samples[samples.length-1];
    if(samples.length>=4&&sim.t<END){const s=samples.slice(-6),n=s.length,mt=s.reduce((a,q)=>a+q.t,0)/n,mo=s.reduce((a,q)=>a+q.o,0)/n;let num=0,den=0;s.forEach(q=>{num+=(q.t-mt)*(q.o-mo);den+=(q.t-mt)**2});
      const k=den?num/den:0,ft=Math.min(t1,lt.t+1800),fv=Math.max(0,Math.min(1,lt.o+k*(ft-lt.t)));
      x.setLineDash([4,4]);x.beginPath();x.moveTo(X(lt.t),Y(lt.o));x.lineTo(X(ft),Y(fv));x.stroke();x.setLineDash([]);
      x.fillStyle=C.ink;x.font='600 11px "JetBrains Mono",monospace';x.fillText(Math.round(fv*100)+'%',Math.min(X(ft)+4,L+pw-30),Y(fv)-6)}
    x.fillStyle=C.teal;x.beginPath();x.arc(X(lt.t),Y(lt.o),3.5,0,7);x.fill()}
}
function setMode(m){mode=m;['Occ','Price','Rule'].forEach(k=>$('#m'+k).setAttribute('aria-pressed',m===k.toLowerCase()));legend()}
$('#mOcc').onclick=()=>setMode('occ');$('#mPrice').onclick=()=>setMode('price');$('#mRule').onclick=()=>setMode('rule');

// ---- điều hướng theo 5 lớp kiến trúc ----
document.querySelectorAll('.node[data-go]').forEach(n=>n.addEventListener('click',()=>{
  const t=document.getElementById(n.dataset.go);if(!t)return;
  document.querySelectorAll('.node[data-go]').forEach(m=>m.removeAttribute('aria-current'));n.setAttribute('aria-current','true');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash');setTimeout(()=>t.classList.remove('flash'),1600)}));

// ---- vòng chạy ----
let last=performance.now(),acc=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(sim.running&&!ff){step(dt);if(!sim.running&&window.ADM)ADM.playBtn()}
  drawPhys();drawTwin();acc+=dt;if(acc>.3&&!ff){acc=0;ui()}requestAnimationFrame(frame)}

init({});selLink=links.find(l=>l.code==='BL2');selBay=null;
resize();readTokens();
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readTokens)}catch(e){}
new MutationObserver(readTokens).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
addEventListener('resize',resize);
if(document.fonts)document.fonts.ready.then(()=>readTokens());
for(let i=0;i<1200;i++)step(1/30);
ui();requestAnimationFrame(frame);
