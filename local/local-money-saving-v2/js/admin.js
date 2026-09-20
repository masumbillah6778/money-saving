const ACCOUNTS_KEY="money_saving_local_accounts";
const ADMIN_SESSION_KEY="money_saving_local_admin";
const $=id=>document.getElementById(id);
const bn=n=>String(n).replace(/[0-9]/g,d=>"০১২৩৪৫৬৭৮৯"[d]);
const money=n=>"৳ "+bn(Number(n||0).toLocaleString("en-US"));
const months=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
let users=[],deposits=[],selectedUid=null;

function readAccounts(){
  try{return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)||"{}")}catch(e){return {}}
}
function writeAccounts(a){localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(a))}
function migrateLegacy(){
  const a=readAccounts();
  if(Object.keys(a).length)return a;
  const old=localStorage.getItem("money_saving_local_checked");
  if(old){
    try{
      const d=JSON.parse(old);
      if(d && (d.name||d.memberId||d.deposits?.length)){
        const email=d.email||"localuser@gmail.com";
        a[email]={email,name:d.name||"",memberId:d.memberId||"",password:d.password&&d.password!=="1234"?d.password:"",deposits:d.deposits||[],status:"active"};
        writeAccounts(a);
      }
    }catch(e){}
  }
  return a;
}
function syncData(){
  const a=migrateLegacy();
  users=Object.values(a).map((u,i)=>({uid:u.email||String(i),...u}));
  deposits=[];
  users.forEach(u=>(u.deposits||[]).forEach((d,i)=>deposits.push({...d,id:`${u.uid}__${i}`,userId:u.uid})));
}
function isAdmin(){return localStorage.getItem(ADMIN_SESSION_KEY)==="1"}
function adminLogin(){
  localStorage.setItem(ADMIN_SESSION_KEY,"1");
  $("login").classList.add("hidden");$("app").classList.remove("hidden");$("menuBtn").classList.remove("hidden");
  syncData();renderAll();showSection("dash");
}
window.adminLogin=adminLogin;

function adminGuard(){if(!isAdmin()){alert("আগে Admin Login করুন।");return false}return true}
function userDeposits(uid){
  const u=users.find(x=>x.uid===uid);
  return (u?.deposits||[]).map((d,i)=>({...d,_index:i})).sort((a,b)=>{
    const da=String(a.date||"")+" "+String(a.time||"");
    const db=String(b.date||"")+" "+String(b.time||"");
    return da.localeCompare(db);
  });
}
function userTotal(uid){return userDeposits(uid).reduce((s,d)=>s+Number(d.amount||0),0)}
function renderAll(){syncData();renderDashboard();renderUsers();renderMonthly();if(selectedUid)renderDetails(selectedUid)}
function renderDashboard(){
  const active=users.filter(u=>u.status!=="blocked").length,blocked=users.length-active;
  const total=deposits.reduce((s,d)=>s+Number(d.amount||0),0), now=new Date(),ym=now.toISOString().slice(0,7);
  const month=deposits.filter(d=>(d.date||"").slice(0,7)===ym).reduce((s,d)=>s+Number(d.amount||0),0);
  $("totalUsers").textContent=bn(users.length);$("activeUsers").textContent=bn(active);$("blockedUsers").textContent=bn(blocked);
  $("totalSavings").textContent=money(total);$("totalDeposits").textContent=bn(deposits.length);$("currentMonth").textContent=money(month);
}
function renderUsers(){
  const body=$("usersBody"),q=($("userSearch")?.value||"").toLowerCase().trim();
  body.innerHTML="";
  const list=users.filter(u=>[u.name,u.email,u.gmail,u.memberId,u.uid].some(v=>String(v||"").toLowerCase().includes(q)))
    .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"bn"));
  $("usersEmpty").classList.toggle("hidden",list.length>0);$("usersWrap").classList.toggle("hidden",list.length===0);
  list.forEach((u,i)=>{
    const tr=document.createElement("tr");
    [bn(i+1),u.memberId||"—",u.name||"—",u.email||u.gmail||"—",money(userTotal(u.uid)),u.status==="blocked"?"🔴 Blocked":"🟢 Active"]
      .forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});
    const a=document.createElement("td");
    const actions=[
      ["📊 বিস্তারিত",()=>showUserDetails(u.uid)],
      ["✏️ Edit",()=>editUser(u.uid)],
      [u.status==="blocked"?"🔓 Unblock":"🔒 Block",()=>toggleUser(u.uid)],
      ["🔄 Reset",()=>resetUserPassword(u.uid)],
      ["🗑️ Delete",()=>deleteUser(u.uid)]
    ];
    actions.forEach(([t,fn])=>{const b=document.createElement("button");b.className="small-btn";b.textContent=t;b.onclick=fn;a.appendChild(b)});
    tr.appendChild(a);body.appendChild(tr);
  });
}
window.renderUsers=renderUsers;

function formatMonthBn(ym){
  const m=String(ym||"").match(/^(\d{4})-(\d{2})$/);
  return m?`${months[Number(m[2])-1]||m[2]} ${bn(m[1])}`:(ym||"—");
}
function renderMonthly(){
  const map={};
  deposits.forEach(d=>{const m=(d.date||"").slice(0,7);if(!m)return;(map[m]??={count:0,total:0}).count++;map[m].total+=Number(d.amount||0)});
  const body=$("monthlyBody");body.innerHTML="";
  const keys=Object.keys(map).sort().reverse();
  $("monthlyEmpty").classList.toggle("hidden",keys.length>0);$("monthlyWrap").classList.toggle("hidden",keys.length===0);
  keys.forEach(m=>{const tr=document.createElement("tr");[formatMonthBn(m),bn(map[m].count),money(map[m].total)].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});body.appendChild(tr)});
}

function showUserDetails(uid){selectedUid=uid;showSection("users");renderDetails(uid)}
window.showUserDetails=showUserDetails;
function esc(s){const d=document.createElement("div");d.textContent=s??"";return d.innerHTML}
function formatDate(v){
  const m=String(v||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${bn(m[3])}-${bn(m[2])}-${bn(m[1])}`:(v||"—");
}
function formatMonthHeadline(ym){
  const m=String(ym||"").match(/^(\d{4})-(\d{2})$/);
  return m?`${months[Number(m[2])-1]||m[2]} - ${bn(m[1])}`:(ym||"—");
}
function depositMonthKey(d){return String(d?.date||"").slice(0,7)}
function renderDetails(uid){
  const u=users.find(x=>x.uid===uid);if(!u)return;
  $("detailCard").classList.remove("hidden");
  $("selectedUser").innerHTML=`নাম: <b>${esc(u.name||"—")}</b><br>সদস্য ID: <b>${esc(u.memberId||"—")}</b>`;
  const body=$("detailBody");body.innerHTML="";let run=0;
  userDeposits(uid).forEach((d,i)=>{
    run+=Number(d.amount||0);
    const tr=document.createElement("tr");
    [bn(i+1),formatDate(d.date),d.time||"—",money(d.amount),d.method||"—",money(run)].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});
    const action=document.createElement("td");action.className="deposit-actions-col";
    const b=document.createElement("button");b.className="small-btn danger-btn";b.textContent="🗑️ Delete";b.onclick=()=>deleteDeposit(uid,d._index);
    action.appendChild(b);tr.appendChild(action);body.appendChild(tr);
  });
  $("detailTotal").textContent=money(run);
}
function deleteDeposit(uid, depositId){
  if(!adminGuard())return;
  const a=readAccounts(),u=a[uid];if(!u)return;
  const list=u.deposits||[]; const idx=typeof depositId==="number"?depositId:list.findIndex((d)=>String(d.id||"")===String(depositId));
  if(idx<0)return;
  const d=list[idx];
  if(!confirm(`${u.name||u.email}\n\n${formatDate(d.date)} | ${money(d.amount)}\nএই জমার তথ্য Delete করবেন?`))return;
  list.splice(idx,1);
  list.forEach((x,i)=>x.serial=i+1);
  u.deposits=list;a[uid]=u;writeAccounts(a);syncData();renderAll();renderDetails(uid);
  alert("🗑️ জমার তথ্য Delete হয়েছে।");
}
window.deleteDeposit=deleteDeposit;

function editUser(uid){
  if(!adminGuard())return;
  const u=users.find(x=>x.uid===uid);if(!u)return;
  selectedUid=uid;$("editUid").value=u.uid;$("editMemberId").value=u.memberId||"";$("editName").value=u.name||"";
  $("editGmail").value=u.email||u.gmail||"";$("editStatus").value=u.status==="blocked"?"blocked":"active";
  $("editPassword").value="";$("editModal").classList.add("show");
}
window.editUser=editUser;
window.closeEdit=()=>$("editModal").classList.remove("show");

$("editForm")?.addEventListener("submit",e=>{
  e.preventDefault();if(!adminGuard())return;
  const uid=$("editUid").value,a=readAccounts(),u=a[uid];if(!u)return;
  const p=$("editPassword").value;
  u.name=$("editName").value.trim();u.memberId=$("editMemberId").value.trim();u.status=$("editStatus").value;
  if(p){if(p.length<4)return alert("Password কমপক্ষে ৪ অক্ষরের দিন।");u.password=p}
  a[uid]=u;writeAccounts(a);syncData();renderAll();closeEdit();
  alert("✅ User তথ্য আপডেট হয়েছে।");
});

function toggleUser(uid){
  if(!adminGuard())return;
  const a=readAccounts(),u=a[uid];if(!u)return;
  const next=u.status==="blocked"?"active":"blocked";
  if(!confirm(`${u.name||u.email}\n\n${next==="blocked"?"Block":"Unblock"} করবেন?`))return;
  u.status=next;a[uid]=u;writeAccounts(a);syncData();renderAll();
  alert(next==="blocked"?"🔒 User Block করা হয়েছে।":"✅ User Unblock হয়েছে।");
}
window.toggleUser=toggleUser;

function resetUserPassword(uid){
  if(!adminGuard())return;
  const a=readAccounts(),u=a[uid];if(!u)return;
  const first=prompt(`User: ${u.name||u.email}\n\nনতুন ব্যক্তিগত পাসওয়ার্ড দিন (কমপক্ষে ৪ অক্ষর):`);
  if(first===null)return;
  if(first.length<4)return alert("Password কমপক্ষে ৪ অক্ষরের দিন।");
  const second=prompt("নতুন Password আবার লিখুন:");
  if(second!==first)return alert("Password দুটি একই হয়নি।");
  u.password=first;a[uid]=u;writeAccounts(a);syncData();renderAll();
  alert("🔄 User-এর Personal Password Reset করা হয়েছে। এখন User এই নতুন Password দিয়ে Login করতে পারবেন।");
}
window.resetUserPassword=resetUserPassword;

function deleteUser(uid){
  if(!adminGuard())return;
  const a=readAccounts(),u=a[uid];if(!u)return;
  const count=(u.deposits||[]).length;
  if(!confirm(`${u.name||u.email}\n\nএই User এবং তার ${count}টি জমার তথ্য স্থায়ীভাবে Delete করবেন?\nএই কাজ Undo করা যাবে না।`))return;
  delete a[uid];writeAccounts(a);selectedUid=null;$("detailCard").classList.add("hidden");syncData();renderAll();
  alert("🗑️ User এবং তার জমার তথ্য Delete হয়েছে।");
}
window.deleteUser=deleteUser;

function exportBackup(){
  if(!adminGuard())return;
  syncData();
  const payload={version:2,type:"money-saving-local",exportedAt:new Date().toISOString(),accounts:readAccounts(),users,deposits};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`money-saving-local-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
}
window.exportBackup=exportBackup;

async function restoreBackup(file){
  if(!adminGuard()||!file)return;
  try{
    const data=JSON.parse(await file.text());
    let accounts=data.accounts;
    if(!accounts && Array.isArray(data.users)){
      accounts={};
      data.users.forEach(u=>{const email=u.email||u.gmail||u.uid;if(email)accounts[email]={...u,email,deposits:(data.deposits||[]).filter(d=>d.userId===u.uid||d.userId===email),status:u.status||"active",password:u.password||""}});
    }
    if(!accounts || typeof accounts!=="object")throw Error("সঠিক Money-Saving Local backup নয়।");
    if(!confirm(`Backup-এ ${Object.keys(accounts).length} User আছে। Restore করবেন?`))return;
    writeAccounts(accounts);syncData();renderAll();alert("✅ Backup Restore সম্পন্ন হয়েছে।");
  }catch(e){alert("❌ Restore হয়নি।\n"+e.message)}
}
window.restoreBackup=restoreBackup;

function printMonthly(){
  if(!$("monthlyBody").children.length)return alert("প্রিন্ট করার মতো কোনো মাসিক হিসাব নেই।");
  showSection("monthly");
  const latestMonth=deposits.map(depositMonthKey).filter(Boolean).sort().pop()||new Date().toISOString().slice(0,7);
  $("monthlyPrintMonth").textContent=formatMonthHeadline(latestMonth);
  window.print();
}
window.printMonthly=printMonthly;
function printUserList(){
  if(!$("usersBody").children.length)return alert("প্রিন্ট করার মতো কোনো User নেই。");
  showSection("users");
  const rows=[...$("usersBody").querySelectorAll("tr")];
  const keys=[]; rows.forEach(r=>{});
  const latestMonth=deposits.map(depositMonthKey).filter(Boolean).sort().pop()||new Date().toISOString().slice(0,7);
  $("userListPrintTitle").textContent="ইউজারে তালিকা";
  $("userListPrintMonth").textContent=formatMonthHeadline(latestMonth);
  window.print();
}
window.printUserList=printUserList;
function printSelectedUser(){
  if(!selectedUid)return alert("আগে একজন User-এর বিস্তারিত খুলুন।");
  window.print();
}
window.printSelectedUser=printSelectedUser;
function printReport(){window.print()}window.printReport=printReport;

function showSection(id){
  ["dash","monthly","users"].forEach(x=>$(x).classList.add("hidden"));
  ["sideDash","sideMonthly","sideUsers"].forEach(x=>$(x).classList.remove("active"));
  $(id).classList.remove("hidden");
  $(id==="dash"?"sideDash":id==="monthly"?"sideMonthly":"sideUsers").classList.add("active");
  if(id!=="users"){$("detailCard").classList.add("hidden");selectedUid=null}
  closeSidebar();
}
window.showSection=showSection;
function toggleSidebar(){$("sidebar").classList.toggle("open");$("overlay").classList.toggle("show")}
function closeSidebar(){$("sidebar").classList.remove("open");$("overlay").classList.remove("show")}
window.toggleSidebar=toggleSidebar;window.closeSidebar=closeSidebar;

function logout(){localStorage.removeItem(ADMIN_SESSION_KEY);location.reload()}
window.logout=logout;

function init(){
  if(isAdmin()){
    $("login").classList.add("hidden");$("app").classList.remove("hidden");$("menuBtn").classList.remove("hidden");
    syncData();renderAll();showSection("dash");
  }else{
    $("login").classList.remove("hidden");$("app").classList.add("hidden");$("menuBtn").classList.add("hidden");
  }
}
init();
