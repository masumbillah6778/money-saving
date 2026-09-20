const STORE_KEY = "money_saving_local_checked";
const ACCOUNTS_KEY = "money_saving_local_accounts";
const CURRENT_EMAIL_KEY = "money_saving_current_email";
const UNLOCKED_KEY = "money_saving_app_unlocked";
const MEMBER_SEQ_KEY = "money_saving_member_seq_checked";

const $ = id => document.getElementById(id);
const bn = n => String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);

function readAccounts(){
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}"); }
  catch(e){ return {}; }
}
function writeAccounts(a){ localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }

function migrateOldData(){
  const accounts=readAccounts();
  if(Object.keys(accounts).length) return accounts;
  const raw=localStorage.getItem(STORE_KEY);
  if(raw){
    try{
      const old=JSON.parse(raw);
      if(old && (old.name || old.memberId || old.deposits?.length)){
        const email=old.email || "localuser@gmail.com";
        accounts[email]={
          email,
          name:old.name||"",
          memberId:old.memberId||"",
          password:old.password && old.password!=="1234" ? old.password : "",
          deposits:Array.isArray(old.deposits)?old.deposits:[],
          status:"active"
        };
        writeAccounts(accounts);
        localStorage.setItem(CURRENT_EMAIL_KEY,email);
        return accounts;
      }
    }catch(e){}
  }
  return accounts;
}

function currentEmail(){ return localStorage.getItem(CURRENT_EMAIL_KEY) || ""; }
function currentAccount(){
  const a=readAccounts(), e=currentEmail();
  return e && a[e] ? a[e] : null;
}
function saveCurrentAccount(d){
  const a=readAccounts(), e=currentEmail();
  if(!e)return;
  a[e]=d; writeAccounts(a);
  // Keep the old key synchronized for compatibility with existing local backups.
  localStorage.setItem(STORE_KEY,JSON.stringify({...d,email:e}));
}
function ensureMemberId(d){
  if(!d.memberId){
    let next=Number(localStorage.getItem(MEMBER_SEQ_KEY)||"67781926")+1;
    localStorage.setItem(MEMBER_SEQ_KEY,String(next));
    d.memberId=String(next);
    saveCurrentAccount(d);
  }
  return d;
}

function login(){
  const email=($("loginEmail").value||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("সঠিক Gmail লিখুন।");
  const accounts=readAccounts();
  let d=accounts[email];
  if(!d){
    d={email,name:"",memberId:"",password:"",deposits:[],status:"active"};
    accounts[email]=d; writeAccounts(accounts);
  }
  if(d.status==="blocked") return alert("⛔ এই User বর্তমানে Block করা আছে। Admin-এর সঙ্গে যোগাযোগ করুন।");
  localStorage.setItem(CURRENT_EMAIL_KEY,email);
  localStorage.setItem(UNLOCKED_KEY,"0");
  d=ensureMemberId(d);
  $("login").classList.add("hidden");
  if($("passwordEmail"))$("passwordEmail").textContent="Gmail: "+d.email;
  if(!d.password){
    $("passwordGate").classList.add("hidden");
    $("setup").classList.remove("hidden");
    $("app").classList.add("hidden");
  }else{
    $("setup").classList.add("hidden");
    $("passwordGate").classList.remove("hidden");
    $("app").classList.add("hidden");
  }
}
window.login=login;

function saveName(){
  const d=currentAccount();
  if(!d)return alert("আগে Gmail Login করুন।");
  const name=($("name").value||"").trim();
  const p=$("setupPassword").value;
  const c=$("setupPasswordConfirm").value;
  if(!name)return alert("দয়া করে আপনার নাম লিখুন।");
  if(!p || p.length<4)return alert("ব্যক্তিগত পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দিন।");
  if(p!==c)return alert("পাসওয়ার্ড দুটি একই হতে হবে।");
  d.name=name; d.password=p; d.status=d.status||"active"; ensureMemberId(d); saveCurrentAccount(d);
  localStorage.setItem(UNLOCKED_KEY,"1");
  $("setup").classList.add("hidden"); $("passwordGate").classList.add("hidden"); $("app").classList.remove("hidden");
  $("sideLogin").classList.add("hidden");
  $("sideLogout").classList.remove("hidden");
  renderAll(); showSection("dash");
}
window.saveName=saveName;

function unlockApp(){
  const d=currentAccount();
  if(!d)return login();
  if(d.status==="blocked")return alert("⛔ এই User বর্তমানে Block করা আছে। Admin-এর সঙ্গে যোগাযোগ করুন।");
  if(($("appPassword").value||"")!==d.password)return alert("পাসওয়ার্ড সঠিক নয়।");
  localStorage.setItem(UNLOCKED_KEY,"1");
  $("appPassword").value="";
  $("passwordGate").classList.add("hidden"); $("app").classList.remove("hidden");
  $("sideLogin").classList.add("hidden");
  $("sideLogout").classList.remove("hidden");
  renderAll(); showSection("dash");
}
window.unlockApp=unlockApp;

function renderAll(){
  const d=ensureMemberId(currentAccount()||{});
  const list=d.deposits||[];
  $("showName").textContent=d.name||"User";
  $("showMemberId").textContent=d.memberId||"—";
  $("sideUserName").textContent=d.name||d.email||"User Panel";
  const total=list.reduce((s,x)=>s+Number(x.amount||0),0);
  $("totalAmount").textContent=bn(total.toLocaleString("en-US"));
  $("totalCount").textContent=bn(list.length);
  if($("settingsName"))$("settingsName").value=d.name||"";
  renderDeposits();
}

function prepareDepositForm(){
  const d=ensureMemberId(currentAccount());
  const list=d.deposits||[];
  $("serial").value=bn(list.length+1);
  $("memberId").value=d.memberId||"";
  $("memberName").value=d.name||"";
  if(!$("depositDate").value)$("depositDate").value=new Date().toISOString().slice(0,10);
}

function saveDeposit(){
  const d=ensureMemberId(currentAccount());
  if(!d || !d.name)return alert("আগে আপনার নাম ও Password সেট করুন।");
  const date=$("depositDate").value, amount=Number($("depositAmount").value), method=$("depositMethod").value;
  if(!date)return alert("জমার তারিখ নির্বাচন করুন।");
  if(!Number.isFinite(amount)||amount<=0)return alert("সঠিক জমার পরিমাণ লিখুন।");
  if(!method)return alert("জমার মাধ্যম নির্বাচন করুন।");
  d.deposits=d.deposits||[];
  const now=new Date();
  const time=now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
  d.deposits.push({serial:d.deposits.length+1,memberId:d.memberId,name:d.name,date,amount,method,time,createdAt:now.toISOString()});
  saveCurrentAccount(d);
  $("depositAmount").value=""; $("depositMethod").value="";
  renderAll(); prepareDepositForm();
  showSection("depositForm",false);
  alert("✅ টাকা জমার তথ্য সফলভাবে সংরক্ষণ হয়েছে।");
}
window.saveDeposit=saveDeposit;

function formatDate(v){
  const m=String(v||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${bn(m[3])}-${bn(m[2])}-${bn(m[1])}`:(v||"");
}

function renderDeposits(){
  const d=currentAccount(), list=d?.deposits||[], body=$("depositBody"); if(!body)return;
  body.innerHTML="";
  $("depositEmpty").classList.toggle("hidden",list.length>0);
  $("depositTableWrap").classList.toggle("hidden",list.length===0);
  list.forEach((x,i)=>{
    const tr=document.createElement("tr");
    [bn(i+1),x.memberId||d.memberId||"",x.name||d.name||"",formatDate(x.date),"৳ "+bn(Number(x.amount||0).toLocaleString("en-US")),x.method||""]
      .forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
    body.appendChild(tr);
  });
}

function changeName(){
  const n=($("settingsName").value||"").trim();
  if(!n)return alert("দয়া করে নাম লিখুন।");
  const d=currentAccount(); d.name=n; saveCurrentAccount(d); renderAll(); alert("✅ নাম পরিবর্তন হয়েছে।");
}
window.changeName=changeName;

function changePassword(){
  const d=currentAccount();
  const oldP=$("oldPassword").value,newP=$("newPassword").value,c=$("confirmPassword").value;
  if(oldP!==d.password)return alert("বর্তমান পাসওয়ার্ড সঠিক নয়।");
  if(!newP || newP.length<4)return alert("নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দিন।");
  if(newP!==c)return alert("নতুন পাসওয়ার্ড দুটি একই হতে হবে।");
  d.password=newP; saveCurrentAccount(d);
  $("oldPassword").value=$("newPassword").value=$("confirmPassword").value="";
  alert("✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।");
}
window.changePassword=changePassword;

function showSection(id,prepare=true){
  if(!currentAccount() || localStorage.getItem(UNLOCKED_KEY)!=="1")return;
  ["dash","depositForm","depositList","settings"].forEach(x=>$(x).classList.add("hidden"));
  ["sideDash","sideForm","sideList","sideSettings"].forEach(x=>{if($(x))$(x).classList.remove("active")});
  $(id).classList.remove("hidden");
  const side={dash:"sideDash",depositForm:"sideForm",depositList:"sideList",settings:"sideSettings"}[id];
  if(side&&$(side))$(side).classList.add("active");
  if(id==="depositForm"&&prepare)prepareDepositForm();
  if(id==="dash")renderAll();
  if(id==="depositList")renderDeposits();
  if(id==="settings")$("settingsName").value=currentAccount()?.name||"";
  closeSidebar();
}
window.showSection=showSection;

function toggleSidebar(){$("sidebar").classList.toggle("open");$("overlay").classList.toggle("show");}
function closeSidebar(){$("sidebar").classList.remove("open");$("overlay").classList.remove("show");}
window.toggleSidebar=toggleSidebar; window.closeSidebar=closeSidebar;

function showLogin(){
  logout();
}
window.showLogin=showLogin;

function logout(){
  localStorage.removeItem(CURRENT_EMAIL_KEY);
  localStorage.removeItem(UNLOCKED_KEY);
  $("app").classList.add("hidden");$("setup").classList.add("hidden");$("passwordGate").classList.add("hidden");
  $("login").classList.remove("hidden");$("loginEmail").value="";
  $("sideLogin").classList.remove("hidden");
  $("sideLogout").classList.add("hidden");
  closeSidebar();
}
window.logout=logout;

function init(){
  migrateOldData();
  const e=currentEmail();
  const d=currentAccount();
  $("login").classList.remove("hidden");$("setup").classList.add("hidden");$("passwordGate").classList.add("hidden");$("app").classList.add("hidden");
  $("sideLogin").classList.remove("hidden");
  $("sideLogout").classList.add("hidden");
  if(e&&d){
    $("login").classList.add("hidden");
    $("sideLogin").classList.add("hidden");
    $("sideLogout").classList.remove("hidden");
    if(d.status==="blocked"){alert("⛔ এই User বর্তমানে Block করা আছে। Admin-এর সঙ্গে যোগাযোগ করুন।");return;}
    if(!d.password){
      $("setup").classList.remove("hidden");
    }else{
      $("passwordGate").classList.remove("hidden");
      if($("passwordEmail"))$("passwordEmail").textContent="Gmail: "+d.email;
    }
  }
}
init();
