/* Bản sao số đỗ xe trên đường — lõi mô phỏng (mạng lưới, nhu cầu, tổ chức đỗ xe, trụ sạc, bản sao số)
   © TS. Đặng Minh Tân — Bộ môn Đường bộ – Sân bay, Khoa Công trình và Môi trường, Trường ĐH Giao thông Vận tải */
const R=Math.random;
const g=(h,m,s)=>Math.exp(-((h-m)*(h-m))/(2*s*s));
const W=1000,H=690,CX=[60,280,500,720,940],RY=[60,250,440,630],LANE=8,BAYOFF=19,BAYLEN=24;
const START=6.5*3600,END=22*3600;
const HSTREET=['Phố Hoa Sữa','Đại lộ Sông Hồng','Phố Bằng Lăng','Phố Phượng Vĩ'],HCODE=['HS','SH','BL','PV'];
const VSTREET=['Phố Sấu','Phố Xà Cừ','Đường Vành Đai','Phố Lộc Vừng','Phố Hoa Gạo'],VCODE=['SA','XC','VD','LV','HG'];
const POIS=[[0,0,'res','Chung cư Hoa Sữa'],[1,0,'office','Tòa văn phòng Sao Mai'],[2,0,'mall','Trung tâm thương mại'],[3,0,'shops','Nhà phố & cửa hàng'],
 [0,1,'market','Chợ dân sinh'],[1,1,'food','Phố ẩm thực'],[2,1,'office','Ngân hàng & văn phòng'],[3,1,'hosp','Bệnh viện quận'],
 [0,2,'school','Trường tiểu học'],[1,2,'park','Công viên'],[2,2,'res','Chung cư Phượng Vĩ'],[3,2,'food','Cà phê & nhà hàng']];
const TYPES={
 res:{w:.35,dw:110,label:'Dân cư',prof:h=>.25+.9*g(h,19,1.6)+.3*g(h,7,1)},
 office:{w:.35,dw:110,label:'Công sở',prof:h=>1.5*g(h,8.2,.8)+.35*g(h,13.3,1.2)+.1},
 mall:{w:.7,dw:75,label:'Thương mại',prof:h=>.35*g(h,10.5,1.5)+.6*g(h,15,1.5)+1.1*g(h,19.3,1.3)},
 shops:{w:.45,dw:35,label:'Cửa hàng',prof:h=>.6*g(h,10,2)+.8*g(h,17.8,1.6)},
 market:{w:.8,dw:30,label:'Chợ',prof:h=>1.3*g(h,6.8,1)+1.0*g(h,17.2,1)},
 food:{w:.65,dw:55,label:'Ăn uống',prof:h=>.25*g(h,7,.8)+1.0*g(h,12,.8)+1.3*g(h,19,1.2)},
 hosp:{w:.4,dw:80,label:'Y tế',prof:h=>.35+.9*g(h,8.8,1.3)+.4*g(h,14.5,1.5)},
 school:{w:.7,dw:12,label:'Giáo dục',prof:h=>1.8*g(h,7.1,.35)+1.4*g(h,16.8,.4)+.08},
 park:{w:.3,dw:50,label:'Công viên',prof:h=>.7*g(h,6,.9)+.9*g(h,17.6,1.1)}};
const VAN_W={market:.45,shops:.35,food:.3,mall:.4,office:.12,hosp:.08};
const COMM=['mall','market','food','shops'],LONG=['office','res','hosp'];
const MODES={both:'Cho đỗ hai bên',one:'Chỉ đỗ một bên',oddeven:'Đỗ theo ngày chẵn lẻ',peak:'Cấm đỗ giờ cao điểm',none:'Cấm đỗ cả ngày'};
const PEAKS=[[7*3600,9*3600],[16.5*3600,19*3600]];
const CHG_KW=22,BATT=60,KWH_PRICE=3.9,IDLE_FEE=10,IDLE_GRACE=900;
const poiAt={};POIS.forEach((p,i)=>poiAt[p[0]+','+p[1]]=i);
const blkRect=(bx,by)=>[CX[bx]+30,RY[by]+30,CX[bx+1]-30,RY[by+1]-30];
const CARCOL=['#e8e6e1','#2b2f33','#9aa3a8','#7a1f22','#1f3c6b','#c9c4b6','#3f5e4a','#b8b9ba','#5a5f66','#8c6a3c'];

// ---- mạng lưới ----
const nodes=[];
for(let r=0;r<4;r++)for(let c=0;c<5;c++)nodes.push({id:r*5+c,x:CX[c],y:RY[r],gate:false});
const GATES=[[-40,250,5,2],[1040,250,9,2],[500,-40,2,2],[500,730,17,2],[-40,440,10,1],[1040,60,4,1],[280,730,16,1],[720,-40,3,1]];
const gateIds=[];GATES.forEach(G=>{const id=nodes.length;nodes.push({id,x:G[0],y:G[1],gate:true,w:G[3],bnd:G[2]});gateIds.push(id)});
const links=[];
function addLink(a,b,kind,street,code,sideBlk){const A=nodes[a],B=nodes[b];const L=Math.hypot(B.x-A.x,B.y-A.y),dx=(B.x-A.x)/L,dy=(B.y-A.y)/L;
  const l={id:links.length,a,b,L,dx,dy,nx:-dy,ny:dx,kind,street,code,sideBlk,bays:[],price:20,rule:null,def:null,occSum:0,occN:0,horiz:Math.abs(dx)>.5};links.push(l);return l}
for(let r=0;r<4;r++)for(let c=0;c<4;c++)addLink(r*5+c,r*5+c+1,r===1?'art':'local',HSTREET[r],HCODE[r]+(c+1),{1:r<3?[c,r]:null,'-1':r>0?[c,r-1]:null});
for(let c=0;c<5;c++)for(let r=0;r<3;r++)addLink(r*5+c,(r+1)*5+c,c===2?'art':'local',VSTREET[c],VCODE[c]+(r+1),{1:c>0?[c-1,r]:null,'-1':c<4?[c,r]:null});
gateIds.forEach(id=>{const G=nodes[id];addLink(id,G.bnd,'gate','Cửa ngõ','CN',{1:null,'-1':null})});
const bays=[];
links.forEach(l=>{
  if(l.kind!=='local')return;
  const n=Math.floor((l.L-56)/BAYLEN),off=(l.L-n*BAYLEN)/2;const A=nodes[l.a];
  [-1,1].forEach(side=>{for(let i=0;i<n;i++){const s=off+i*BAYLEN+BAYLEN/2;
    const sl=l.horiz?(side>0?'N':'B'):(side>0?'T':'Đ');
    bays.push({idx:bays.length,link:l,side,i,s,x:A.x+l.dx*s+l.nx*side*BAYOFF,y:A.y+l.dy*s+l.ny*side*BAYOFF,blk:l.sideBlk[side],
      code:l.code+'-'+sl+(i+1),kind:'std',fixedNp:false,buffer:false,charger:null,kindSince:0,wasBanned:false,banFrom:0,car:null,res:null,ok:true,faultAt:0,repairAt:0});
    l.bays.push(bays[bays.length-1])}});
});
// vùng cấm đỗ cố định có camera: cổng trường (BL1 lề Nam), cổng cấp cứu bệnh viện (BL4 lề Bắc)
bays.forEach(b=>{if(b.link.code==='BL1'&&b.side===1&&(b.i===2||b.i===3))b.fixedNp=true;if(b.link.code==='BL4'&&b.side===-1&&(b.i===2||b.i===3))b.fixedNp=true});
const N=nodes.length,edges=[],E=Array.from({length:N},()=>({}));
links.forEach(l=>{[1,-1].forEach(dir=>{const from=dir>0?l.a:l.b,to=dir>0?l.b:l.a,F=nodes[from];
  const e={id:edges.length,link:l,dir,from,to,L:l.L,dx:l.dx*dir,dy:l.dy*dir,nx:l.nx*dir,ny:l.ny*dir,x0:F.x,y0:F.y,bays:[]};edges.push(e);E[from][to]=e})});
bays.forEach(b=>{const l=b.link;const e=b.side>0?E[l.a][l.b]:E[l.b][l.a];b.edge=e;b.sp=b.side>0?b.s:l.L-b.s;e.bays.push(b)});
edges.forEach(e=>e.bays.sort((p,q)=>p.sp-q.sp));
const dist=Array.from({length:N},()=>new Array(N).fill(Infinity)),nxt=Array.from({length:N},()=>new Array(N).fill(-1));
for(let i=0;i<N;i++){dist[i][i]=0;nxt[i][i]=i}
edges.forEach(e=>{dist[e.from][e.to]=e.L;nxt[e.from][e.to]=e.to});
for(let k=0;k<N;k++)for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(dist[i][k]+dist[k][j]<dist[i][j]){dist[i][j]=dist[i][k]+dist[k][j];nxt[i][j]=nxt[i][k]}
const walkT=bays.map(b=>POIS.map(P=>{const[x1,y1,x2,y2]=blkRect(P[0],P[1]);return Math.hypot(Math.max(x1-b.x,0,b.x-x2),Math.max(y1-b.y,0,b.y-y2))}));
const poiLinks=POIS.map(P=>links.filter(l=>l.kind==='local'&&[l.sideBlk[1],l.sideBlk[-1]].some(b=>b&&b[0]===P[0]&&b[1]===P[1])));
const corners=([bx,by])=>[by*5+bx,by*5+bx+1,(by+1)*5+bx+1,(by+1)*5+bx];
function lanePos(e,s){return[e.x0+e.dx*s+e.nx*LANE,e.y0+e.dy*s+e.ny*LANE]}

// ---- quy tắc tổ chức đỗ xe ----
function linkTypes(l){return[l.sideBlk[1],l.sideBlk[-1]].filter(Boolean).map(b=>POIS[poiAt[b[0]+','+b[1]]][2])}
function isPeak(t){return PEAKS.some(p=>t>=p[0]&&t<p[1])}
function dayEven(){return!sim||sim.day%2===0}
function allowedSide(r){return dayEven()?r.evenSide:-r.evenSide}
function banned(b,t){if(t===undefined)t=sim?sim.t:START;if(b.fixedNp||b.buffer)return true;const r=b.link.rule;
  if(r.mode==='oddeven')return b.kind==='std'&&b.side!==allowedSide(r);
  return r.mode==='none'||(r.mode==='one'&&b.side===r.banSide)||(r.mode==='peak'&&isPeak(t))}
function banSoon(b,t,dur){const r=b.link.rule;return r.mode==='peak'&&PEAKS.some(p=>p[0]<t+dur&&p[1]>t)}
function assignKinds(l,t){
  const r=l.rule;l.bays.forEach(b=>{b.prevKind=b.kind;b.kind='std';b.buffer=r.pattern==='gap'&&!b.fixedNp&&(b.i%(r.grp+r.buf))>=r.grp;if(b.buffer&&b.res)b.res=null});
  const okSide=s=>!(r.mode==='one'&&s===r.banSide)&&r.mode!=='none';
  const evSide=okSide(1)?1:-1,ldSide=okSide(-1)?-1:1;
  const take=(side,n,fromEnd,kind)=>{let a=l.bays.filter(b=>b.side===side&&!b.fixedNp&&!b.buffer&&b.kind==='std');if(fromEnd)a.reverse();a.slice(0,n).forEach(b=>b.kind=kind)};
  take(evSide,r.ev,true,'ev');take(ldSide,r.load,false,'load');
  l.bays.forEach(b=>{if(b.kind!==b.prevKind){b.kindSince=t;b.charger=b.kind==='ev'?{ok:true,repairAt:0}:null;if(b.res)b.res=null}});
}
links.forEach(l=>{if(l.kind!=='local')return;const ty=linkTypes(l);
  l.def={mode:'both',banSide:-1,evenSide:1,pattern:'cont',grp:2,buf:1,base:ty.some(t=>COMM.includes(t))?30:20,limit:ty.some(t=>LONG.includes(t))?240:180,
    ev:(ty.includes('mall')||ty.includes('office'))?2:ty.includes('hosp')?1:0,load:ty.some(t=>['market','shops','food'].includes(t))?1:0};
  l.rule=Object.assign({},l.def);l.price=l.rule.base;assignKinds(l,START)});
const PRESETS=[
 {id:'def',name:'Hiện trạng',desc:'Đỗ hai bên mọi phố nội khu, giá 20–30k/h, trụ sạc cạnh TTTM, văn phòng, bệnh viện.',fn:()=>{}},
 {id:'peak',name:'Cấm đỗ giờ cao điểm',desc:'Các đoạn quanh trường, chợ, tòa văn phòng cấm đỗ 7:00–9:00 và 16:30–19:00.',fn:l=>{const t=linkTypes(l);if(t.includes('school')||t.includes('market')||t.includes('office'))l.rule.mode='peak'}},
 {id:'one',name:'Đỗ một bên hai phố biên',desc:'Phố Hoa Sữa và Phượng Vĩ bỏ đỗ lề ngoài khu phố, chỉ đỗ lề trong.',fn:l=>{if(l.street==='Phố Hoa Sữa'){l.rule.mode='one';l.rule.banSide=-1}if(l.street==='Phố Phượng Vĩ'){l.rule.mode='one';l.rule.banSide=1}}},
 {id:'oddeven',name:'Đỗ theo ngày chẵn lẻ',desc:'Phố nội khu đỗ lề Nam/Tây vào ngày chẵn, lề Bắc/Đông vào ngày lẻ. Ô có trụ sạc, ô bốc dỡ không áp dụng.',fn:l=>{l.rule.mode='oddeven';l.rule.evenSide=1}},
 {id:'gap',name:'Đỗ gián đoạn 2 ô + 1 đệm',desc:'Quanh trường, chợ, bệnh viện, TTTM: cứ 2 ô đỗ có 1 ô đệm để người đi bộ sang đường và xe tránh nhau.',fn:l=>{if(linkTypes(l).some(x=>['school','market','hosp','mall'].includes(x))){l.rule.pattern='gap';l.rule.grp=2;l.rule.buf=1}}},
 {id:'ev',name:'Điện hóa đỗ xe',desc:'3 ô có trụ sạc trên đoạn phố thương mại, văn phòng, bệnh viện; 1 ô trên các đoạn khác.',fn:l=>{const t=linkTypes(l);l.rule.ev=t.some(x=>COMM.includes(x)||x==='office'||x==='hosp')?3:1}},
 {id:'logi',name:'Ô bốc dỡ hàng',desc:'2 ô bốc dỡ hàng trên mọi đoạn phố có chợ, cửa hàng, nhà hàng, TTTM.',fn:l=>{if(linkTypes(l).some(x=>COMM.includes(x)))l.rule.load=2}},
 {id:'price',name:'Giá phân vùng',desc:'Đoạn thương mại 40k/h, giới hạn 2 giờ; các đoạn còn lại 15k/h.',fn:l=>{const t=linkTypes(l);if(t.some(x=>COMM.includes(x))){l.rule.base=40;l.rule.limit=120}else l.rule.base=15}}];

// ---- trạng thái ----
let sim=null,cars,twin,queue,logs,stats,samples,gateQ,nextId,logDirty=true,planName='Hiện trạng',planId='def';
function expR(){return -Math.log(1-R())}
function poisson(m){if(m<=0)return 0;let L=Math.exp(-m),k=0,p=1;do{k++;p*=R()}while(p>L);return k-1}
function vid(id){return'MP-'+String(id).padStart(4,'0')}
function log(msg,cls){logs.unshift({t:sim.t,msg,cls:cls||''});if(logs.length>90)logs.pop();logDirty=true}
function fmtT(t){t=Math.max(0,t);return String(Math.floor(t/3600)).padStart(2,'0')+':'+String(Math.floor(t%3600/60)).padStart(2,'0')}
function mkCar(type){const id=nextId++;return{id,vid:vid(id),type,col:CARCOL[R()*CARCOL.length|0],state:'drive',e:null,s:0,x:0,y:0,px:0,loops:0,nn:null,wait:0,ev:false,van:false}}
function canUse(c,b,t){if(banned(b,t))return false;if(b.kind==='load')return!!c.van;if(b.kind==='ev')return!!(c.ev&&c.need&&b.charger&&b.charger.ok);return true}

function init(o){
  cars=[];queue=[];logs=[];samples=[];nextId=1;gateQ=gateIds.map(()=>[]);
  sim=Object.assign({t:START,day:6,speed:30,running:true,demand:1,guide:true,adopt:.5,evShare:.2,dyn:false,enf:true,spikeUntil:0,nextPrice:START+900,nextSample:START,lat:[],peakOn:false},o||{});
  stats={revenue:0,chgRev:0,idleRev:0,parked:0,sg:[],sf:[],wg:[],wf:[],sSum:0,sN:0,wSum:0,aband:0,vDet:0,vDone:0,vType:{},msgs:0,reroute:0,cruisePx:0,kwh:0,evSessions:0,evUnserved:0,vans:0};
  links.forEach(l=>{if(l.rule)l.price=l.rule.base;l.occSum=0;l.occN=0});
  twin=bays.map(()=>({st:'free',id:'',since:0,upd:START,flag:null,lost:false,ev:false,chg:null,doneAt:0,nextFee:0}));
  bays.forEach(b=>{b.car=null;b.res=null;b.ok=true;b.kindSince=START;b.wasBanned=banned(b,START);b.banFrom=START;if(b.charger){b.charger.ok=true}
    if(banned(b,START)||b.kind==='load')return;
    const tw=twin[b.idx];
    if(b.kind==='ev'){if(R()<.4){const c=mkCar('leave');c.ev=true;c.need=true;c.soc=.3;c.state='parked';c.bay=b;c.parkStart=START-R()*2400;c.price=0;
      c.charging=true;c.needK=8+R()*20;c.kwh=0;c.leaveAt=START+c.needK/CHG_KW*3600+R()*1800;c.x=b.x;c.y=b.y;b.car=c;cars.push(c);
      tw.st='occ';tw.id=c.vid;tw.since=c.parkStart;tw.ev=true;tw.chg='charging'}return}
    const t=b.blk?POIS[poiAt[b.blk[0]+','+b.blk[1]]][2]:'res';
    if(R()<(t==='res'?.7:t==='office'?.15:.3)){const c=mkCar('leave');c.state='parked';c.bay=b;c.parkStart=START-R()*5400;c.price=b.link.price;
      c.leaveAt=c.parkStart+(t==='res'?2400+R()*14000:900+R()*6000);c.x=b.x;c.y=b.y;b.car=c;cars.push(c);
      tw.st='occ';tw.id=c.vid;tw.since=c.parkStart}});
  const nb=bays.filter(b=>b.kind==='std'&&!banned(b,START)).length,ne=bays.filter(b=>b.kind==='ev').length,nl=bays.filter(b=>b.kind==='load').length;
  log(`Khởi tạo bản sao số (${planName}): ${nb} ô đỗ thường, ${ne} ô có trụ sạc, ${nl} ô bốc dỡ hàng`,'act');
}

// ---- nhu cầu ----
function poiPriceF(i){const ls=poiLinks[i];if(!ls.length)return 1;let p=0,b=0;ls.forEach(l=>{p+=l.price;b+=l.def.base});return Math.pow(Math.max(p,1)/b,-.4)}
function pickGate(){let tot=0;gateIds.forEach(id=>tot+=nodes[id].w);let r=R()*tot;for(let k=0;k<gateIds.length;k++){r-=nodes[gateIds[k]].w;if(r<=0)return k}return 0}
function exitGate(n){let best=gateIds[0],bc=1e9;gateIds.forEach(id=>{const c=dist[n][id]+R()*260;if(c<bc){bc=c;best=id}});return best}
function setupSeek(c){c.phase='approach';const from=c.e.to;let best=null,bd=1e9;corners(c.blk).forEach(n=>{if(dist[from][n]<bd){bd=dist[from][n];best=n}});c.corner=best}
function twinFind(c){
  let best=null,bc=1e9;const pi=c.poi,dur=(c.dwm||30)*60,wmax=c.ev&&c.need?400:320;
  for(const b of bays){if(b.res||!b.ok)continue;if(twin[b.idx].st!=='free')continue;
    if(!canUse(c,b)||banSoon(b,sim.t,dur))continue;
    const pr=b.kind==='std'?b.link.price:0;if(pr>c.wtp)continue;
    const wk=walkT[b.idx][pi];if(wk>wmax)continue;
    let d;if(b.edge===c.e&&b.sp>c.s+14)d=b.sp-c.s;else d=(c.e.L-c.s)+dist[c.e.to][b.edge.from]+b.sp;
    let cost=wk+pr*4+d*.15;if(c.ev&&c.need&&b.kind!=='ev')cost+=260;if(c.van&&b.kind!=='load')cost+=60;
    if(cost<bc){bc=cost;best=b}}
  return best;
}
function spawnSeeker(pi,van){
  const P=POIS[pi],gi=pickGate(),gid=gateIds[gi];const c=mkCar('seek');
  c.poi=pi;c.blk=[P[0],P[1]];c.e=E[gid][nodes[gid].bnd];c.s=0;
  if(van){c.van=true;c.dwm=14;c.wtp=999;c.R=60;c.wantIllegal=false;c.col='#eeeee8'}
  else{c.dwm=TYPES[P[2]].dw;c.wtp=35+R()*45;c.R=80;c.wantIllegal=R()<.03;
    if(R()<sim.evShare){c.ev=true;c.soc=.12+R()*.7;c.need=c.soc<.5&&R()<.75}}
  c.direct=c.e.L+Math.min(...corners(c.blk).map(n=>dist[c.e.to][n]));
  if(sim.guide&&R()<sim.adopt){c.type='guided';c.guided=true;const b=twinFind(c);if(b){b.res=c.id;c.tB=b}else{c.type='seek';setupSeek(c)}}
  else setupSeek(c);
  gateQ[gi].push(c);
}
function spawnThrough(){const gi=pickGate(),gid=gateIds[gi];const c=mkCar('through');c.e=E[gid][nodes[gid].bnd];c.s=0;
  let go;do{go=gateIds[R()*gateIds.length|0]}while(go===gid);c.goal=go;gateQ[gi].push(c)}
function arrivals(sdt){
  const h=sim.t/3600;
  POIS.forEach((P,i)=>{const T=TYPES[P[2]];const lam=T.w/60*T.prof(h)*sim.demand*poiPriceF(i)*(i===2&&sim.t<sim.spikeUntil?3.5:1);
    for(let n=poisson(lam*sdt);n>0;n--)spawnSeeker(i,false);
    const vw=VAN_W[P[2]];if(vw)for(let n=poisson(vw/60*(g(h,8.5,1.4)+.6*g(h,14,1.3))*sim.demand*sdt);n>0;n--)spawnSeeker(i,true)});
  for(let n=poisson(.5/60*sdt*(.25+g(h,8,1.4)+g(h,17.6,1.4))*sim.demand);n>0;n--)spawnThrough();
}
function dwellFor(c){if(c.van)return 420+R()*900;return Math.min(6*3600,Math.max(240,c.dwm*60*(expR()+expR())/2))}

// ---- định tuyến ----
function nextNode(c,n){
  if(c.type==='through'||c.type==='leave'||c.type==='exit'){if(n===c.goal)return -1;return nxt[n][c.goal]}
  if(c.type==='guided'){if(n===c.tB.edge.from)return c.tB.edge.to;return nxt[n][c.tB.edge.from]}
  if(nodes[n].gate)return nodes[n].bnd;
  if(c.phase==='approach'){if(n!==c.corner)return nxt[n][c.corner];c.phase='circle';c.ci=corners(c.blk).indexOf(n);c.edges=0}
  c.edges++;
  if(c.edges>4){c.loops++;c.R+=160;c.edges=1;
    if(c.loops>3){c.type='exit';c.goal=exitGate(n);stats.aband++;stats.cruisePx+=Math.max(0,c.px-c.direct);log(`Xe ${c.vid} bỏ cuộc sau 4 vòng tìm chỗ quanh ${POIS[c.poi][3]}`,'warn');return nxt[n][c.goal]}
    const [bx,by]=c.blk;const nb=[[bx-1,by],[bx+1,by],[bx,by-1],[bx,by+1]].filter(([x,y])=>x>=0&&x<4&&y>=0&&y<3);
    const cand=nb.filter(b=>corners(b).includes(n));c.blk=(cand.length?cand:nb)[R()*(cand.length||nb.length)|0];
    const cs=corners(c.blk),k=cs.indexOf(n);
    if(k<0){c.phase='approach';let bd=1e9;cs.forEach(m=>{if(dist[n][m]<bd){bd=dist[n][m];c.corner=m}});return nxt[n][c.corner]}
    c.ci=k;
  }
  const cs=corners(c.blk);c.ci=(c.ci+1)%4;return cs[c.ci];
}

// ---- cảm biến, trụ sạc & bản sao ----
function sensor(b){stats.msgs++;if(!b.ok&&!b.fixedNp)return;const lat=b.fixedNp?3:5+R()*20;
  queue.push({b,at:sim.t+lat,st:b.car?'occ':'free',id:b.car?b.car.vid:'',t:sim.t,lat})}
function chgEvent(b,st){stats.msgs++;queue.push({b,at:sim.t+2,chg:st,t:sim.t,isChg:true})}
function processQueue(){for(let k=queue.length-1;k>=0;k--){const e=queue[k];if(sim.t<e.at)continue;const tw=twin[e.b.idx];
  if(e.isChg){tw.chg=e.chg;if(e.chg==='charging')tw.ev=true;if(e.chg==='done')tw.doneAt=e.t}
  else{tw.st=e.st;tw.id=e.id;tw.since=e.t;tw.lost=false;
    if(e.st==='free'){tw.flag=null;tw.ev=false;tw.chg=e.b.charger&&!e.b.charger.ok?'fault':null}
    sim.lat.push(e.lat);if(sim.lat.length>60)sim.lat.shift()}
  tw.upd=sim.t;queue.splice(k,1)}}
const VMSG={np:'đỗ trong khu vực hoặc thời gian cấm',ice:'không sạc nhưng chiếm ô có trụ sạc',load:'xe con chiếm ô bốc dỡ hàng',idle:'đã sạc đầy nhưng chưa rời trụ',over:'đỗ quá giới hạn thời gian'};
function flagIt(b,tw,type){
  tw.flag=type;stats.vDet++;stats.vType[type]=(stats.vType[type]||0)+1;const c=b.car;
  log(`Xe ${tw.id} tại ${b.code}: ${VMSG[type]}`,'warn');
  if(!sim.enf)return;stats.vDone++;
  if(type==='np'||type==='ice'||type==='load'){if(c&&c.state==='parked'){c.towAt=sim.t+600+R()*600;c.illegal=true}log(`Điều tổ cưỡng chế tới ${b.code}`,'act')}
  else if(type==='idle'){tw.nextFee=sim.t;log(`Báo qua ứng dụng cho xe ${tw.id}, tính phí chiếm trụ ${IDLE_FEE} nghìn đ/15 phút`,'act');if(c&&R()<.75)c.leaveAt=Math.min(c.leaveAt,sim.t+180+R()*720)}
  else{log(`Lập biên bản quá giờ tại ${b.code}`,'act');if(c&&R()<.5)c.leaveAt=Math.min(c.leaveAt,sim.t+300+R()*900)}
}
function twinLogic(){
  for(const b of bays){const tw=twin[b.idx],bn=banned(b);
    if(bn&&!b.wasBanned){b.banFrom=sim.t;const c=b.car;if(c&&c.state==='parked'&&!c.illegal&&R()<.65)c.leaveAt=Math.min(c.leaveAt,sim.t+R()*600)}
    b.wasBanned=bn;
    if(!b.ok){if(!tw.lost&&sim.t-b.faultAt>300){tw.lost=true;tw.st='unk';log(`Mất nhịp tín hiệu cảm biến ${b.code} → lệnh bảo trì`,'warn')}
      if(sim.t>=b.repairAt){b.ok=true;tw.lost=false;log(`Đã thay cảm biến ${b.code}, đồng bộ lại`,'act');sensor(b)}}
    if(b.charger&&!b.charger.ok&&sim.t>=b.charger.repairAt){b.charger.ok=true;log(`Đã sửa trụ sạc ${b.code}`,'act');
      const c=b.car;if(c&&c.ev&&c.needK&&!c.full&&c.state==='parked'){c.charging=true;chgEvent(b,'charging')}else chgEvent(b,null)}
    if(tw.flag==='idle'&&sim.enf&&sim.t>=tw.nextFee){stats.idleRev+=IDLE_FEE;tw.nextFee+=900}
    if(tw.st!=='occ'||tw.flag)continue;
    const age=sim.t-tw.since;
    if(bn&&sim.t-Math.max(tw.since,b.banFrom)>(b.fixedNp?0:300))flagIt(b,tw,'np');
    else if(b.kind==='ev'&&b.charger&&b.charger.ok&&!tw.ev&&age>300&&tw.since>=b.kindSince)flagIt(b,tw,'ice');
    else if(b.kind==='load'&&b.car&&!b.car.van&&age>300&&tw.since>=b.kindSince)flagIt(b,tw,'load');
    else if(b.kind==='ev'&&tw.chg==='done'&&sim.t-tw.doneAt>IDLE_GRACE)flagIt(b,tw,'idle');
    else if(b.kind!=='ev'&&age>(b.kind==='load'?1800:b.link.rule.limit*60))flagIt(b,tw,'over');
  }
}
function injectFault(n){const ok=bays.filter(b=>b.ok&&!b.fixedNp);for(let k=0;k<n&&ok.length;k++){const b=ok.splice(R()*ok.length|0,1)[0];b.ok=false;b.faultAt=sim.t;b.repairAt=sim.t+2400+R()*2400}}
function injectChargerFault(n){const ok=bays.filter(b=>b.kind==='ev'&&b.charger&&b.charger.ok);let k=0;
  for(;k<n&&ok.length;k++){const b=ok.splice(R()*ok.length|0,1)[0];b.charger.ok=false;b.charger.repairAt=sim.t+1800+R()*3600;
    if(b.car&&b.car.charging)b.car.charging=false;if(b.res)b.res=null;chgEvent(b,'fault');log(`Trụ sạc ${b.code} báo lỗi qua giao thức trụ sạc → lệnh sửa chữa`,'warn')}return k}
function linkOcc(l,truth){let o=0,n=0;for(const b of l.bays){if(b.kind!=='std'||banned(b))continue;
  if(truth){n++;if(b.car&&b.car.state!=='in')o++;continue}
  const s=twin[b.idx].st;if(s==='unk')continue;n++;if(s==='occ')o++}return n?o/n:null}
function totalOcc(){let o=0,n=0;bays.forEach(b=>{if(b.kind!=='std'||banned(b))return;const s=twin[b.idx].st;if(s==='unk')return;n++;if(s==='occ')o++});return n?o/n:0}
function evUtil(){let u=0,n=0;bays.forEach(b=>{if(b.kind!=='ev'||!b.charger||!b.charger.ok)return;n++;if(twin[b.idx].st==='occ')u++});return{u,n}}
function pricing(){
  if(sim.t<sim.nextPrice)return;sim.nextPrice+=900;if(!sim.dyn)return;
  let up=0,dn=0;links.forEach(l=>{if(!l.rule||l.rule.mode==='none')return;const o=linkOcc(l);if(o==null)return;const p0=l.price;
    if(o>.9)l.price=Math.min(60,p0+5);else if(o<.6)l.price=Math.max(10,p0-5);if(l.price>p0)up++;else if(l.price<p0)dn++});
  if(up||dn)log(`Cập nhật giá: ${up} đoạn tăng, ${dn} đoạn giảm`,'price');
}
function sample(){while(sim.t>=sim.nextSample){
  const cr=cars.filter(c=>(c.type==='seek'||c.type==='guided')&&c.state==='drive').length,ev=evUtil();
  samples.push({t:sim.nextSample,o:totalOcc(),cr,ev:ev.n?ev.u/ev.n:0});
  links.forEach(l=>{if(!l.rule)return;const o=linkOcc(l);if(o!=null){l.occSum+=o;l.occN++}});
  sim.nextSample+=300}}

// ---- áp dụng tổ chức ----
function setDay(d){if(sim.day===d)return;sim.day=d;const n=links.filter(l=>l.rule&&l.rule.mode==='oddeven').length;
  log(`Chuyển sang ngày ${d%2?'lẻ':'chẵn'} (${String(d).padStart(2,'0')}/11)`+(n?`: ${n} đoạn phố đổi lề được đỗ`:''),'act')}
function applyRule(l,rule){l.rule=Object.assign({},rule);l.price=l.rule.base;assignKinds(l,sim?sim.t:START)}
function applyPreset(id){const P=PRESETS.find(p=>p.id===id);if(!P)return;
  links.forEach(l=>{if(!l.def)return;l.rule=Object.assign({},l.def);P.fn(l);l.price=l.rule.base;assignKinds(l,sim?sim.t:START)});
  planName=P.name;planId=id;if(sim)log(`Áp dụng phương án tổ chức: ${P.name}`,'act')}
function summary(){const os=samples.map(s=>s.o),es=samples.map(s=>s.ev);const m=a=>a.length?a.reduce((x,y)=>x+y)/a.length:0;
  return{plan:planName,t:sim.t,occ:m(os),evu:m(es),parked:stats.parked,aband:stats.aband,km:stats.cruisePx/1000,search:stats.sN?stats.sSum/stats.sN:0,
    walk:stats.sN?stats.wSum/stats.sN:0,rev:stats.revenue+stats.chgRev+stats.idleRev,kwh:stats.kwh,evUn:stats.evUnserved,viol:stats.vDet,vans:stats.vans}}

// ---- chuyển động ----
function startPark(c,b){c.state='in';c.p=0;c.bay=b;b.car=c;[c.fx,c.fy]=lanePos(c.e,c.s);b.res=null;c.illegal=!canUse(c,b)}
function reroute(c){stats.reroute++;const old=c.tB;if(old&&old.res===c.id)old.res=null;
  const nb=twinFind(c);if(nb){nb.res=c.id;c.tB=nb;log(`Ô ${old.code} không còn dùng được, dẫn xe ${c.vid} tới ${nb.code}`,'act')}
  else{c.tB=null;c.type='seek';setupSeek(c);log(`Hết ô phù hợp, xe ${c.vid} chuyển sang tự tìm chỗ`,'warn')}}
function moveCars(dt,sdt){
  const k=Math.min(2.5,Math.max(.8,sim.speed/60)),v=48*k;
  const lists=new Map();const add=(e,s,c)=>{let a=lists.get(e.id);if(!a)lists.set(e.id,a=[]);a.push({s,c})};
  for(const c of cars){if(c.state==='drive')add(c.e,c.s,c);else if(c.state==='in'&&c.p<.6)add(c.e,c.s,c);else if(c.state==='out'&&c.p>.3)add(c.bay.edge,c.bay.sp+4,c)}
  const ahead=(e,s,self)=>{const a=lists.get(e.id);let m=Infinity;if(a)for(const o of a)if(o.c!==self&&o.s>=s&&o.s<m)m=o.s;return m};
  const minS=e=>{const a=lists.get(e.id);let m=Infinity;if(a)for(const o of a)m=Math.min(m,o.s);return m};
  gateQ.forEach(q=>{if(q.length){const c=q[0];if(minS(c.e)>24){q.shift();cars.push(c);add(c.e,0,c)}}});
  for(const c of cars){
    if(c.state==='drive'){
      const step=v*dt*(c.type==='seek'?.8:1);
      if(c.type==='seek'&&c.e.link.kind==='local'){let pick=null;
        for(const b of c.e.bays){if(b.sp<=c.s+.5)continue;if(b.sp>c.s+step+12)break;if(b.car)continue;
          if(walkT[b.idx][c.poi]>c.R)continue;
          const ok=canUse(c,b)&&!banSoon(b,sim.t,1200);
          if(!ok){if(c.loops>=1&&(c.wantIllegal||(c.van&&R()<.1))&&(b.kind!=='ev'||R()<.3)){pick=b;break}continue}
          if(b.kind==='std'){if(c.ev&&c.need&&c.loops===0)continue;if(c.van&&c.loops===0)continue;if(b.link.price>c.wtp)continue}
          if(b.res&&(c.id+b.idx)%3)continue;pick=b;break}
        if(pick){startPark(c,pick);continue}}
      if(c.type==='guided'&&c.tB&&c.e===c.tB.edge&&c.s+step+2>=c.tB.sp&&c.s<=c.tB.sp+2){
        if((c.tB.car&&c.tB.car!==c)||!canUse(c,c.tB))reroute(c);else{startPark(c,c.tB);continue}}
      const lim=ahead(c.e,c.s+.01,c)-20;let ns=Math.max(c.s,Math.min(c.s+step,lim));
      if(c.type==='seek'||c.type==='guided')c.px+=ns-c.s;
      if(ns>=c.e.L){
        if(c.nn==null)c.nn=nextNode(c,c.e.to);
        if(c.nn<0){c.gone=true;continue}
        const ne=E[c.e.to][c.nn];if(!ne){c.gone=true;continue}
        if(minS(ne)<20&&(c.wait+=dt)<3){c.s=c.e.L-.01;continue}
        const over=ns-c.e.L;c.e=ne;c.s=over;c.nn=null;c.wait=0;
      }else c.s=ns;
      [c.x,c.y]=lanePos(c.e,c.s);
    }else if(c.state==='in'){
      const b=c.bay;c.p+=dt*k/.8;const t=Math.min(1,c.p),e=t*t*(3-2*t);c.x=c.fx+(b.x-c.fx)*e;c.y=c.fy+(b.y-c.fy)*e;
      if(c.p>=1){c.state='parked';c.parkStart=sim.t;c.price=b.kind==='std'?b.link.price:0;
        c.leaveAt=c.illegal?sim.t+600+R()*1500:sim.t+dwellFor(c);
        if(b.kind==='ev'&&c.ev&&!c.illegal){c.charging=true;c.needK=Math.max(3,(.9-c.soc)*BATT);c.kwh=0;stats.evSessions++;
          const ct=c.needK/CHG_KW*3600;c.leaveAt=sim.t+(R()<.55?ct+R()*2400:ct*(.5+R()*.5));chgEvent(b,'charging')}
        if(c.van)stats.vans++;
        else if(!c.illegal){stats.parked++;const st=Math.max(0,c.px-c.direct)/5/60,wk=walkT[b.idx][c.poi];stats.cruisePx+=Math.max(0,c.px-c.direct);
          stats.sSum+=st;stats.sN++;stats.wSum+=wk;(c.guided?stats.sg:stats.sf).push(st);(c.guided?stats.wg:stats.wf).push(wk);
          ['sg','sf','wg','wf'].forEach(q=>{if(stats[q].length>60)stats[q].shift()});if(c.ev&&c.need&&b.kind!=='ev')stats.evUnserved++}
        sensor(b)}
    }else if(c.state==='parked'){
      if(c.charging){const b=c.bay;if(!b.charger||!b.charger.ok)c.charging=false;
        else{const e=Math.min(CHG_KW*sdt/3600,c.needK-c.kwh);c.kwh+=e;stats.kwh+=e;stats.chgRev+=e*KWH_PRICE;
          if(c.kwh>=c.needK-1e-6){c.charging=false;c.full=true;chgEvent(b,'done')}}}
      if(sim.t>=Math.min(c.towAt||Infinity,c.leaveAt)){c.towed=!!(c.towAt&&sim.t>=c.towAt);c.state='waitOut';c.wait=0}
    }else if(c.state==='waitOut'){
      const b=c.bay,a=lists.get(b.edge.id);let busy=false;if(a)for(const o of a)if(o.c!==c&&o.s>b.sp-30&&o.s<b.sp+14)busy=true;
      if(!busy||(c.wait+=dt)>4){
        const dur=sim.t-c.parkStart;if(!c.illegal&&b.kind==='std')stats.revenue+=c.price*Math.ceil(dur/1800)/2;
        if(c.towed)log(`Đã cẩu kéo xe ${c.vid} khỏi ${b.code}`,'act');
        c.charging=false;b.car=null;if(b.kind==='ev'&&b.charger&&b.charger.ok)chgEvent(b,null);sensor(b);c.state='out';c.p=0;c.fx=b.x;c.fy=b.y;add(b.edge,b.sp+4,c)}
    }else if(c.state==='out'){
      const b=c.bay;c.p+=dt*k/.8;const t=Math.min(1,c.p),e=t*t*(3-2*t);const[lx,ly]=lanePos(b.edge,b.sp+4);
      c.x=c.fx+(lx-c.fx)*e;c.y=c.fy+(ly-c.fy)*e;
      if(c.p>=1){c.state='drive';c.e=b.edge;c.s=b.sp+4;c.type='leave';c.goal=exitGate(c.e.to);c.nn=null;c.bay=null;c.wait=0}
    }
  }
  cars=cars.filter(c=>!c.gone);
}
function step(dt){
  const sdt=dt*sim.speed;sim.t+=sdt;
  if(sim.t>=END){sim.t=END;sim.running=false;log('Kết thúc ngày mô phỏng lúc 22:00','act')}
  const pk=isPeak(sim.t);if(pk!==sim.peakOn){sim.peakOn=pk;const n=links.filter(l=>l.rule&&l.rule.mode==='peak').length;
    if(n)log(pk?`Bắt đầu khung giờ cấm đỗ cao điểm trên ${n} đoạn phố`:`Hết khung giờ cấm đỗ, ${n} đoạn phố cho đỗ trở lại`,'act')}
  if(R()<sdt/5400)injectFault(1);
  if(R()<sdt/14400)injectChargerFault(1);
  arrivals(sdt);moveCars(dt,sdt);processQueue();twinLogic();pricing();sample();
}
