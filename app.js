/* Bản sao số đỗ xe trên đường — giao diện (vẽ bản đồ, chỉ số, tổ chức đỗ xe, so sánh phương án)
   © TS. Đặng Minh Tân — Bộ môn Đường bộ – Sân bay, Khoa Công trình và Môi trường, Trường ĐH Giao thông Vận tải */
(()=>{
const $=s=>document.querySelector(s);
let C={},selLink=null,selBay=null,mode='occ',formFor=undefined,ff=false,rows=[];
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
  $('#clock').textContent=fmtT(sim.t);
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
  if(formFor!==selLink)renderForm();
  if(logDirty){logDirty=false;$('#log').innerHTML=logs.slice(0,60).map(l=>`<li class="${l.cls}"><time>${fmtT(l.t)}</time><span>${l.msg}</span></li>`).join('');$('#logc').textContent=logs.length+' sự kiện gần nhất'}
  drawChart();
}
function detail(){
  const el=$('#dinfo'),l=selLink;if(!l){el.innerHTML='<p class="muted">Bấm vào một đoạn phố trên bản đồ để xem hồ sơ số và điều chỉnh tổ chức đỗ xe.</p>';return}
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


// ---- đăng nhập quản trị ----
// Chỉ lưu mã băm SHA-256 của (muối + mật khẩu); kiểm tra phía trình duyệt nên chỉ mang tính phân quyền giao diện.
const AUTH_H='4e0ce1e2a5169b35df071b9c42e93a4a2b425a5b6a5d3bebc3436db1e43af50c',AUTH_S='dtp-parking:';
function sha256(str){const K=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
  const b=Array.from(new TextEncoder().encode(str)),l=b.length*8;b.push(128);while(b.length%64!==56)b.push(0);for(let i=7;i>=0;i--)b.push(Math.floor(l/2**(i*8))&255);
  let h=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];const r=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<b.length;o+=64){const w=new Array(64);for(let i=0;i<16;i++)w[i]=(b[o+i*4]<<24)|(b[o+i*4+1]<<16)|(b[o+i*4+2]<<8)|b[o+i*4+3];
    for(let i=16;i<64;i++){const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
    let[a,bb,c,d,e,f,g2,hh]=h;
    for(let i=0;i<64;i++){const t1=(hh+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g2))+K[i]+w[i])|0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&bb)^(a&c)^(bb&c)))|0;hh=g2;g2=f;f=e;e=(d+t1)|0;d=c;c=bb;bb=a;a=(t1+t2)|0}
    h=h.map((v,i)=>(v+[a,bb,c,d,e,f,g2,hh][i])|0)}
  return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('')}
let isAdmin=false,fails=0,lockUntil=0;
try{isAdmin=sessionStorage.getItem('dt-parking-admin')===AUTH_H}catch(e){}
const ADMIN_CTRL=['dyn','enf','fault','cfault','spike','autoRestart'];
function applyLock(){
  ADMIN_CTRL.forEach(id=>{const e=$('#'+id);if(e)e.disabled=!isAdmin});
  document.documentElement.classList.toggle('is-admin',isAdmin);
  $('#adminBtn').textContent=isAdmin?'Đăng xuất':'Đăng nhập quản trị';
  $('#adminState').hidden=!isAdmin;
  formFor=undefined;if(typeof renderPresets==='function'&&sim){renderPresets();ui()}
}
function openLogin(){const m=$('#login');m.hidden=false;$('#loginErr').textContent='';$('#loginPw').value='';setTimeout(()=>$('#loginPw').focus(),0)}
function closeLogin(){$('#login').hidden=true;$('#adminBtn').focus()}
$('#adminBtn').onclick=()=>{if(isAdmin){isAdmin=false;try{sessionStorage.removeItem('dt-parking-admin')}catch(e){}log('Quản trị viên đã đăng xuất','act');applyLock()}else openLogin()};
$('#loginCancel').onclick=closeLogin;
$('#login').addEventListener('click',e=>{if(e.target.id==='login')closeLogin()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#login').hidden)closeLogin()});
document.addEventListener('click',e=>{if(e.target.closest('[data-login]'))openLogin()});
$('#loginShow').onchange=e=>{$('#loginPw').type=e.target.checked?'text':'password'};
$('#loginF').addEventListener('submit',e=>{e.preventDefault();const err=$('#loginErr');
  if(Date.now()<lockUntil){err.textContent=`Nhập sai quá nhiều lần. Thử lại sau ${Math.ceil((lockUntil-Date.now())/1000)} giây.`;return}
  if(sha256(AUTH_S+$('#loginPw').value)===AUTH_H){isAdmin=true;fails=0;try{sessionStorage.setItem('dt-parking-admin',AUTH_H)}catch(x){}
    log('Quản trị viên đã đăng nhập','act');closeLogin();applyLock()}
  else{fails++;$('#loginPw').select();if(fails>=5){lockUntil=Date.now()+30000;fails=0;err.textContent='Sai mật khẩu 5 lần. Biểu mẫu tạm khóa 30 giây.'}
    else err.textContent=`Mật khẩu không đúng. Còn ${5-fails} lần thử trước khi bị khóa tạm.`}});

// ---- biểu mẫu tổ chức đoạn phố ----
function renderForm(){
  formFor=selLink;const f=$('#dform'),l=selLink;
  if(!l||!l.rule){f.innerHTML='';return}
  if(!isAdmin){f.innerHTML=`<div class="locked"><div><h3>Tổ chức đỗ xe trên đoạn ${l.code}</h3><p class="hint">Thay đổi chế độ đỗ, giá, giới hạn thời gian, trụ sạc, ô bốc dỡ, ô đệm cần quyền quản trị.</p></div><button type="button" class="b pri" data-login>Đăng nhập quản trị</button></div>`;return}
  const r=l.rule,nAll=l.bays.filter(b=>!b.fixedNp).length;
  f.innerHTML=`<h3>Tổ chức đỗ xe trên đoạn ${l.code}</h3>
  <div class="fgrid">
    <div class="field"><label for="r-mode">Chế độ đỗ</label><select id="r-mode">${Object.entries(MODES).map(([k,v])=>`<option value="${k}"${k===r.mode?' selected':''}>${v}${k==='peak'?' (7–9h, 16:30–19h)':''}</option>`).join('')}</select></div>
    <div class="field" id="r-sidew"><label for="r-side" id="r-sidel">Lề cấm đỗ</label><select id="r-side"><option value="-1">${sideName(l,-1)}</option><option value="1">${sideName(l,1)}</option></select></div>
    <div class="field"><label for="r-pat">Bố trí ô đỗ</label><select id="r-pat"><option value="cont"${r.pattern==='cont'?' selected':''}>Liên tục</option><option value="gap"${r.pattern==='gap'?' selected':''}>Gián đoạn: nhóm ô + ô đệm</option></select></div>
    <div class="field" id="r-grpw"><label for="r-grp">Số ô liên tiếp mỗi nhóm <output id="r-grpO">${r.grp}</output></label><input type="range" id="r-grp" min="1" max="4" step="1" value="${r.grp}"></div>
    <div class="field" id="r-bufw"><label for="r-buf">Số ô đệm giữa hai nhóm <output id="r-bufO">${r.buf}</output></label><input type="range" id="r-buf" min="1" max="2" step="1" value="${r.buf}"></div>
    <div class="field"><label for="r-price">Giá cơ sở <output id="r-priceO">${r.base} nghìn đ/h</output></label><input type="range" id="r-price" min="0" max="60" step="5" value="${r.base}"></div>
    <div class="field"><label for="r-limit">Giới hạn thời gian đỗ</label><select id="r-limit">${[60,120,180,240].map(m=>`<option value="${m}"${m===r.limit?' selected':''}>${m/60} giờ</option>`).join('')}</select></div>
    <div class="field"><label for="r-ev">Ô có trụ sạc xe điện <output id="r-evO">${r.ev}</output></label><input type="range" id="r-ev" min="0" max="6" step="1" value="${r.ev}"></div>
    <div class="field"><label for="r-load">Ô bốc dỡ hàng <output id="r-loadO">${r.load}</output></label><input type="range" id="r-load" min="0" max="3" step="1" value="${r.load}"></div>
  </div>
  <div class="btns"><button type="button" class="b pri" id="r-apply">Áp dụng cho đoạn ${l.code}</button><button type="button" class="b" id="r-street">Áp dụng cho cả ${l.street}</button><button type="button" class="b" id="r-def">Về hiện trạng</button></div>
  <p class="hint" id="r-hint"></p>`;
  let lastM=null;
  const upd=()=>{const m=$('#r-mode').value,pat=$('#r-pat').value;$('#r-sidew').hidden=m!=='one'&&m!=='oddeven';
    if(m!==lastM){$('#r-sidel').textContent=m==='oddeven'?'Lề được đỗ vào ngày chẵn':'Lề cấm đỗ';$('#r-side').value=String(m==='oddeven'?r.evenSide:r.banSide);lastM=m}
    $('#r-grpw').hidden=$('#r-bufw').hidden=pat!=='gap';$('#r-grpO').textContent=$('#r-grp').value;$('#r-bufO').textContent=$('#r-buf').value;$('#r-priceO').textContent=$('#r-price').value+' nghìn đ/h';$('#r-evO').textContent=$('#r-ev').value;$('#r-loadO').textContent=$('#r-load').value;
    const ev=+$('#r-ev').value,ld=+$('#r-load').value,gp=+$('#r-grp').value,bf=+$('#r-buf').value;
    const keep=pat==='gap'?gp/(gp+bf):1,sides=m==='one'||m==='oddeven'?1:2,std=Math.max(0,Math.round(nAll*keep*sides/2)-ev-ld);
    $('#r-hint').textContent=m==='none'?`Đoạn này sẽ mất toàn bộ ${nAll} ô đỗ.`:`Còn khoảng ${std} ô đỗ thường${m==='oddeven'?' mỗi ngày (đổi lề theo ngày chẵn lẻ)':''}, ${ev} ô có trụ sạc, ${ld} ô bốc dỡ${pat==='gap'?`, ${Math.round(nAll*(1-keep))} ô đệm`:''}${m==='peak'?'; trong giờ cao điểm mọi ô đều cấm':''}. Có hiệu lực ngay khi áp dụng.`};
  ['r-mode','r-side','r-pat','r-grp','r-buf','r-price','r-limit','r-ev','r-load'].forEach(id=>$('#'+id).addEventListener('input',upd));upd();
  const read=()=>{const m=$('#r-mode').value,sd=+$('#r-side').value;return{mode:m,banSide:m==='one'?sd:r.banSide,evenSide:m==='oddeven'?sd:r.evenSide,pattern:$('#r-pat').value,grp:+$('#r-grp').value,buf:+$('#r-buf').value,base:+$('#r-price').value,limit:+$('#r-limit').value,ev:+$('#r-ev').value,load:+$('#r-load').value}};
  const after=msg=>{planName='Tùy chỉnh';planId=null;log(msg,'act');buildBg();renderPresets();formFor=undefined;ui()};
  $('#r-apply').onclick=()=>{const r2=read();applyRule(l,r2);after(`Đoạn ${l.code}: ${MODES[r2.mode].toLowerCase()}${r2.pattern==='gap'?`, gián đoạn ${r2.grp}+${r2.buf}`:''}, ${r2.base}k/h, ${r2.limit/60} giờ, ${r2.ev} trụ sạc, ${r2.load} ô bốc dỡ`)};
  $('#r-street').onclick=()=>{const r2=read();const ls=links.filter(m=>m.street===l.street&&m.rule);ls.forEach(m=>applyRule(m,r2));after(`${l.street} (${ls.length} đoạn): ${MODES[r2.mode].toLowerCase()}, ${r2.base}k/h, ${r2.ev} trụ sạc/đoạn`)};
  $('#r-def').onclick=()=>{applyRule(l,l.def);after(`Đoạn ${l.code} trở về quy tắc hiện trạng`)};
}

// ---- phương án & so sánh ----
function renderPresets(){
  $('#presets').innerHTML=PRESETS.map(p=>`<button type="button" class="preset" data-p="${p.id}" aria-pressed="${p.id===planId}"${isAdmin?'':' disabled'}><b>${p.name}</b><span>${p.desc}</span></button>`).join('');
  const nEv=bays.filter(b=>b.kind==='ev').length,nL=bays.filter(b=>b.kind==='load').length,cnt={both:0,one:0,oddeven:0,peak:0,none:0};let gp=0;links.forEach(l=>{if(l.rule){cnt[l.rule.mode]++;if(l.rule.pattern==='gap')gp++}});
  $('#curplan').innerHTML=`Đang áp dụng: <b>${planName}</b> · ${cnt.both} đoạn đỗ hai bên, ${cnt.one} một bên, ${cnt.oddeven} chẵn lẻ, ${cnt.peak} cấm giờ cao điểm, ${cnt.none} cấm cả ngày, ${gp} đỗ gián đoạn · ${bays.filter(b=>b.buffer).length} ô đệm · ${nEv} ô có trụ sạc · ${nL} ô bốc dỡ`;
}
$('#presets').addEventListener('click',e=>{const b=e.target.closest('.preset');if(!b||!isAdmin)return;applyPreset(b.dataset.p);buildBg();formFor=undefined;
  if($('#autoRestart').checked){ff=false;init(opts());playBtn()}renderPresets();ui()});
const COLS=[['occ',v=>Math.round(v*100)+'%',0],['parked',v=>v,1],['aband',v=>v,-1],['km',v=>vn(v,0)+' km',-1],['search',v=>vn(v,2)+' ph',-1],['walk',v=>Math.round(v)+' m',-1],['rev',v=>vn(v/1000,1)+' tr đ',1],['kwh',v=>Math.round(v).toLocaleString('vi-VN')+' kWh',1],['evUn',v=>v,-1],['viol',v=>v,-1]];
function renderRows(){
  const tb=$('#cmpBody');if(!rows.length){tb.innerHTML='<tr class="empty"><td colspan="12">Chưa có kết quả nào được ghi.</td></tr>';return}
  const best={};COLS.forEach(([k,,d])=>{if(!d)return;const vs=rows.map(r=>r[k]);best[k]=d>0?Math.max(...vs):Math.min(...vs)});
  tb.innerHTML=rows.map(r=>`<tr><td>${r.plan}</td><td>${fmtT(r.t)}</td>${COLS.map(([k,f,d])=>`<td class="${rows.length>1&&d&&r[k]===best[k]?'best':''}">${f(r[k])}</td>`).join('')}</tr>`).join('');
}
function saveRows(){try{localStorage.setItem('dt-parking-rows',JSON.stringify(rows))}catch(e){}}
try{rows=JSON.parse(localStorage.getItem('dt-parking-rows')||'[]')||[]}catch(e){rows=[]}
$('#snap').onclick=()=>{const s=summary();if(!sim.guide)s.plan+=' · không điều hướng';if(sim.dyn)s.plan+=' · giá động';rows.push(s);saveRows();renderRows();log(`Ghi kết quả phương án "${s.plan}" lúc ${fmtT(s.t)}`,'act');ui()};
$('#clearSnap').onclick=()=>{rows=[];saveRows();renderRows()};

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

// ---- điều khiển ----
function playBtn(){$('#play').textContent=sim.running?'Tạm dừng':'Tiếp tục'}
function opts(){return{day:$('#dOdd').getAttribute('aria-pressed')==='true'?7:6,speed:+$('#speed').value,demand:$('#demand').value/100,evShare:$('#evs').value/100,guide:$('#guide').checked,adopt:$('#adopt').value/100,dyn:$('#dyn').checked,enf:$('#enf').checked}}
$('#play').onclick=()=>{if(sim.t>=END||ff)return;sim.running=!sim.running;playBtn()};
$('#reset').onclick=()=>{ff=false;init(opts());selBay=null;playBtn();ui()};
$('#speed').onchange=e=>{sim.speed=+e.target.value};
$('#demand').oninput=e=>{sim.demand=e.target.value/100;$('#demandO').textContent=e.target.value+'%'};
$('#evs').oninput=e=>{sim.evShare=e.target.value/100;$('#evsO').textContent=e.target.value+'%'};
$('#adopt').oninput=e=>{sim.adopt=e.target.value/100;$('#adoptO').textContent=e.target.value+'%'};
$('#guide').onchange=e=>{sim.guide=e.target.checked;log(sim.guide?'Bật điều hướng chỗ trống':'Tắt điều hướng chỗ trống','act');if(!sim.guide)bays.forEach(b=>b.res=null);ui()};
$('#dyn').onchange=e=>{sim.dyn=e.target.checked;if(!sim.dyn){links.forEach(l=>{if(l.rule)l.price=l.rule.base});log('Tắt giá động, trở về giá cơ sở','price')}else{log('Bật giá động theo đoạn phố','price');sim.nextPrice=sim.t+60}ui()};
$('#enf').onchange=e=>{sim.enf=e.target.checked;log(sim.enf?'Bật cưỡng chế tự động':'Tắt cưỡng chế, chỉ ghi nhận vi phạm','act');ui()};
$('#fault').onclick=()=>{injectFault(8);log('Kịch bản: 8 cảm biến ngừng gửi tín hiệu','warn');ui()};
$('#cfault').onclick=()=>{const n=injectChargerFault(3);if(!n)log('Không còn trụ sạc hoạt động để gây lỗi','warn');ui()};
$('#spike').onclick=()=>{sim.spikeUntil=sim.t+3600;log('Kịch bản: sự kiện ở Trung tâm thương mại, nhu cầu tới TTTM tăng 3,5 lần trong 60 phút','warn');ui()};
function pickDay(d){$('#dEven').setAttribute('aria-pressed',d===6);$('#dOdd').setAttribute('aria-pressed',d===7);setDay(d);ui()}
$('#dEven').onclick=()=>pickDay(6);$('#dOdd').onclick=()=>pickDay(7);
function setMode(m){mode=m;['Occ','Price','Rule'].forEach(k=>$('#m'+k).setAttribute('aria-pressed',m===k.toLowerCase()));legend()}
$('#mOcc').onclick=()=>setMode('occ');$('#mPrice').onclick=()=>setMode('price');$('#mRule').onclick=()=>setMode('rule');
$('#ff').onclick=()=>{if(ff||sim.t>=END)return;ff=true;const sp=sim.speed;sim.speed=30;sim.running=true;const btn=$('#ff');btn.disabled=true;
  const chunk=()=>{if(!ff){sim.speed=sp;btn.disabled=false;btn.textContent='Chạy nhanh tới 22:00';return}const t0=performance.now();while(performance.now()-t0<45&&sim.t<END)step(1/30);
    btn.textContent='Đang chạy nhanh… '+fmtT(sim.t);ui();if(sim.t<END)setTimeout(chunk,0);else{ff=false;sim.speed=sp;btn.disabled=false;btn.textContent='Chạy nhanh tới 22:00';playBtn()}};chunk()};

let last=performance.now(),acc=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
  if(sim.running&&!ff){step(dt);if(!sim.running)playBtn()}
  drawPhys();drawTwin();acc+=dt;if(acc>.3&&!ff){acc=0;ui()}requestAnimationFrame(frame)}

init(opts());selLink=links.find(l=>l.code==='BL2');selBay=null;applyLock();
resize();readTokens();renderPresets();renderRows();
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readTokens)}catch(e){}
new MutationObserver(readTokens).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
addEventListener('resize',resize);
if(document.fonts)document.fonts.ready.then(()=>readTokens());
for(let i=0;i<1200;i++)step(1/30);
ui();requestAnimationFrame(frame);
})();
