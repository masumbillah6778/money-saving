import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const $ = id => document.getElementById(id);
const bn = n => String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);
const isAdmin = () => auth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

async function adminLogin(){
  try { await signInWithPopup(auth, provider); }
  catch(e){ alert("Admin Login হয়নি।\n" + e.message); }
}
window.adminLogin = adminLogin;

async function getUsers(){
  const s = await getDocs(collection(db,"users"));
  return s.docs.map(d => ({id:d.id,...d.data()}));
}
async function getDeposits(){
  const s = await getDocs(collection(db,"deposits"));
  return s.docs.map(d => ({id:d.id,...d.data()}));
}

let cacheUsers = [], cacheDeposits = [];

async function refreshData(){
  [cacheUsers, cacheDeposits] = await Promise.all([getUsers(), getDeposits()]);
  renderDashboard(); renderMonthly(); renderUsers();
}

function renderDashboard(){
  const active = cacheUsers.filter(u => u.status !== "blocked").length;
  const blocked = cacheUsers.filter(u => u.status === "blocked").length;
  const total = cacheDeposits.reduce((s,d)=>s+Number(d.amount||0),0);
  $("adminUserCount").textContent = bn(cacheUsers.length);
  $("adminActiveCount").textContent = bn(active);
  $("adminBlockedCount").textContent = bn(blocked);
  $("adminGrandTotal").textContent = bn(total.toLocaleString("en-US"));
}

function renderMonthly(){
  const map = {};
  cacheDeposits.forEach(d=>{
    const m=(d.date||"").slice(0,7); if(!m) return;
    if(!map[m]) map[m]={count:0,total:0};
    map[m].count++; map[m].total += Number(d.amount||0);
  });
  const body=$("adminMonthlyBody"); body.innerHTML="";
  const months=Object.keys(map).sort().reverse();
  $("monthlyEmpty").classList.toggle("hidden", months.length>0);
  $("monthlyWrap").classList.toggle("hidden", months.length===0);
  months.forEach(m=>{
    const tr=document.createElement("tr");
    [m,bn(map[m].count),"৳ "+bn(map[m].total.toLocaleString("en-US"))].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
    body.appendChild(tr);
  });
}

function renderUsers(){
  const body=$("usersBody"); body.innerHTML="";
  $("usersEmpty").classList.toggle("hidden", cacheUsers.length>0);
  $("usersWrap").classList.toggle("hidden", cacheUsers.length===0);
  cacheUsers.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  cacheUsers.forEach((u,i)=>{
    const deposits=cacheDeposits.filter(d=>d.userId===u.uid);
    const total=deposits.reduce((s,d)=>s+Number(d.amount||0),0);
    const tr=document.createElement("tr");
    [bn(i+1),u.name||"—",u.memberId||"—",u.gmail||"—","৳ "+bn(total.toLocaleString("en-US")),u.status==="blocked"?"Blocked":"Active"].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});
    const action=document.createElement("td");
    const detail=document.createElement("button"); detail.className="small-btn"; detail.textContent="বিস্তারিত"; detail.onclick=()=>showUserDetails(u.uid);
    const block=document.createElement("button"); block.className="small-btn"; block.textContent=u.status==="blocked"?"Unblock":"Block"; block.onclick=()=>toggleUser(u.uid,u.status);
    action.append(detail,block); tr.appendChild(action); body.appendChild(tr);
  });
}

function showUserDetails(uid){
  const u=cacheUsers.find(x=>x.uid===uid); if(!u)return;
  const d=cacheDeposits.filter(x=>x.userId===uid).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  $("detailCard").classList.remove("hidden");
  $("selectedUser").textContent=`${u.name||"—"} — ${u.memberId||"—"} — ${u.gmail||"—"}`;
  const body=$("detailBody"); body.innerHTML=""; let run=0;
  d.forEach((x,i)=>{
    run+=Number(x.amount||0); const tr=document.createElement("tr");
    [bn(i+1),x.date||"—","৳ "+bn(Number(x.amount||0).toLocaleString("en-US")),x.method||"—","৳ "+bn(run.toLocaleString("en-US"))].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);}); body.appendChild(tr);
  });
  showSection("users");
  setTimeout(()=>$("detailCard").scrollIntoView({behavior:"smooth",block:"start"}),100);
}
window.showUserDetails=showUserDetails;

async function toggleUser(uid,status){
  if(!isAdmin()) return;
  const next=status==="blocked"?"active":"blocked";
  if(!confirm(`এই User-কে ${next==="blocked"?"Block":"Unblock"} করবেন?`)) return;
  await updateDoc(doc(db,"users",uid),{status:next,updatedAt:serverTimestamp()});
  await refreshData();
}
window.toggleUser=toggleUser;

async function logout(){await signOut(auth);location.reload();}
window.logout=logout;

function showSection(id){
  ["dash","monthly","users"].forEach(x=>$(x).classList.add("hidden"));
  ["sideDash","sideMonthly","sideUsers"].forEach(x=>$(x).classList.remove("active"));
  $(id).classList.remove("hidden");
  const side=id==="dash"?"sideDash":id==="monthly"?"sideMonthly":"sideUsers";
  $(side).classList.add("active"); closeSidebar();
}
window.showSection=showSection;
function toggleSidebar(){ $("sidebar").classList.toggle("open"); $("overlay").classList.toggle("show"); }
function closeSidebar(){ $("sidebar").classList.remove("open"); $("overlay").classList.remove("show"); }
window.toggleSidebar=toggleSidebar; window.closeSidebar=closeSidebar;

onAuthStateChanged(auth,async user=>{
  if(!user){$("login").classList.remove("hidden");$("app").classList.add("hidden");$("menuBtn").classList.add("hidden");return;}
  if(!isAdmin()){
    alert("⛔ এই Gmail-এর Admin Access নেই।");
    await signOut(auth); return;
  }
  $("login").classList.add("hidden"); $("app").classList.remove("hidden"); $("menuBtn").classList.remove("hidden");
  try{await refreshData();showSection("dash");}catch(e){alert("Admin data load হয়নি।\n"+e.message);}
});
