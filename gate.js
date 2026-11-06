/* Đăng nhập bảng điều khiển: sinh khóa từ mật khẩu (PBKDF2-SHA256), giải mã phần điều khiển (AES-256-GCM) rồi nạp vào trang. */
(()=>{
const P=window.__DTP,$=s=>document.getElementById(s),K='dt-parking-k';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const tob64=u=>btoa(String.fromCharCode(...new Uint8Array(u)));
const m=$('login'),pw=$('loginPw'),err=$('loginErr'),btn=$('loginBtn');
let fails=0,lockUntil=0,opened=false;
const ok=!!(P&&window.crypto&&crypto.subtle);
async function derive(p){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(P.s),iterations:P.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},true,['decrypt'])}
async function unlock(key){
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(P.i)},key,b64(P.d));
  const o=JSON.parse(new TextDecoder().decode(pt));
  $('secCtrl').outerHTML=o.ctrl;$('plansSlot').outerHTML=o.plans;
  for(const js of o.js){const sc=document.createElement('script');sc.textContent=js;document.body.appendChild(sc)}
  opened=true;$('adminState').hidden=false;$('adminBtn').textContent='Đăng xuất';
}
function open(){if(opened)return;m.hidden=false;pw.value='';
  err.textContent=ok?'':!P?'Không tải được gói điều khiển đã mã hóa (payload.js).':'Trình duyệt chặn chức năng giải mã. Hãy mở trang qua địa chỉ https.';
  btn.disabled=!ok;setTimeout(()=>pw.focus(),0)}
function close(){m.hidden=true;$('adminBtn').focus()}
$('adminBtn').onclick=()=>{if(opened){try{sessionStorage.removeItem(K)}catch(e){}location.reload()}else open()};
document.addEventListener('click',e=>{if(e.target.closest('[data-login]'))open()});
$('loginCancel').onclick=close;
m.addEventListener('click',e=>{if(e.target===m)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)close()});
$('loginShow').onchange=e=>{pw.type=e.target.checked?'text':'password'};
$('loginF').addEventListener('submit',async e=>{e.preventDefault();if(!ok)return;
  if(Date.now()<lockUntil){err.textContent=`Nhập sai quá nhiều lần. Thử lại sau ${Math.ceil((lockUntil-Date.now())/1000)} giây.`;return}
  btn.disabled=true;btn.textContent='Đang kiểm tra…';err.textContent='';
  try{const key=await derive(pw.value);await unlock(key);try{sessionStorage.setItem(K,tob64(await crypto.subtle.exportKey('raw',key)))}catch(x){}close()}
  catch(x){fails++;pw.select();
    if(fails>=5){fails=0;lockUntil=Date.now()+30000;err.textContent='Sai mật khẩu 5 lần. Tạm khóa 30 giây.'}
    else err.textContent=`Mật khẩu không đúng. Còn ${5-fails} lần thử trước khi bị khóa tạm.`}
  btn.disabled=false;btn.textContent='Đăng nhập'});
(async()=>{if(!ok)return;let raw=null;try{raw=sessionStorage.getItem(K)}catch(e){}
  if(raw){try{await unlock(await crypto.subtle.importKey('raw',b64(raw),{name:'AES-GCM'},false,['decrypt']))}catch(e){try{sessionStorage.removeItem(K)}catch(x){}}}})();
})();
