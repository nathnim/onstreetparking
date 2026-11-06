/* Bản sao số đỗ xe trên đường — phần điều khiển (chỉ nạp sau khi đăng nhập, được mã hóa khi triển khai)
   © TS. Đặng Minh Tân — Bộ môn Đường bộ – Sân bay, Khoa Công trình và Môi trường, Trường ĐH Giao thông Vận tải */
(()=>{
let rows=[];
// ---- biểu mẫu tổ chức đoạn phố ----
function renderForm(){
  formFor=selLink;const f=$('#dform'),l=selLink;
  if(!l||!l.rule){f.innerHTML='';return}
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
  $('#presets').innerHTML=PRESETS.map(p=>`<button type="button" class="preset" data-p="${p.id}" aria-pressed="${p.id===planId}"><b>${p.name}</b><span>${p.desc}</span></button>`).join('');
  const nEv=bays.filter(b=>b.kind==='ev').length,nL=bays.filter(b=>b.kind==='load').length,cnt={both:0,one:0,oddeven:0,peak:0,none:0};let gp=0;links.forEach(l=>{if(l.rule){cnt[l.rule.mode]++;if(l.rule.pattern==='gap')gp++}});
  $('#curplan').innerHTML=`Đang áp dụng: <b>${planName}</b> · ${cnt.both} đoạn đỗ hai bên, ${cnt.one} một bên, ${cnt.oddeven} chẵn lẻ, ${cnt.peak} cấm giờ cao điểm, ${cnt.none} cấm cả ngày, ${gp} đỗ gián đoạn · ${bays.filter(b=>b.buffer).length} ô đệm · ${nEv} ô có trụ sạc · ${nL} ô bốc dỡ`;
}
$('#presets').addEventListener('click',e=>{const b=e.target.closest('.preset');if(!b)return;applyPreset(b.dataset.p);buildBg();formFor=undefined;
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
$('#ff').onclick=()=>{if(ff||sim.t>=END)return;ff=true;const sp=sim.speed;sim.speed=30;sim.running=true;const btn=$('#ff');btn.disabled=true;
  const chunk=()=>{if(!ff){sim.speed=sp;btn.disabled=false;btn.textContent='Chạy nhanh tới 22:00';return}const t0=performance.now();while(performance.now()-t0<45&&sim.t<END)step(1/30);
    btn.textContent='Đang chạy nhanh… '+fmtT(sim.t);ui();if(sim.t<END)setTimeout(chunk,0);else{ff=false;sim.speed=sp;btn.disabled=false;btn.textContent='Chạy nhanh tới 22:00';playBtn()}};chunk()};

// ---- đồng bộ bảng điều khiển với trạng thái mô phỏng đang chạy ----
$('#speed').value=String(sim.speed);
$('#demand').value=Math.round(sim.demand*100);$('#demandO').textContent=$('#demand').value+'%';
$('#evs').value=Math.round(sim.evShare*100);$('#evsO').textContent=$('#evs').value+'%';
$('#adopt').value=Math.round(sim.adopt*100);$('#adoptO').textContent=$('#adopt').value+'%';
$('#guide').checked=sim.guide;$('#dyn').checked=sim.dyn;$('#enf').checked=sim.enf;
$('#dEven').setAttribute('aria-pressed',sim.day===6);$('#dOdd').setAttribute('aria-pressed',sim.day===7);
window.ADM={tick(){if(formFor!==selLink)renderForm()},playBtn};
formFor=undefined;playBtn();renderPresets();renderRows();log('Đã đăng nhập bảng điều khiển','act');ui();
})();
