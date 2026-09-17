import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const $ = id => document.getElementById(id);
const bn = n => String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);
const currentUid = () => auth.currentUser?.uid;

function makeMemberId(uid) {
  let hash = 0;
  for (const c of uid) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return "6778" + String(hash % 10000).padStart(4, "0");
}

async function getUser() {
  const u = currentUid();
  if (!u) return null;
  const snap = await getDoc(doc(db, "users", u));
  return snap.exists() ? snap.data() : null;
}

async function login() {
  try { await signInWithPopup(auth, provider); }
  catch (e) { alert("Google Login হয়নি।\n" + e.message); }
}
window.login = login;

async function saveName() {
  const name = $("name").value.trim();
  if (!name) return alert("দয়া করে আপনার নাম লিখুন।");
  const old = await getUser();
  const u = auth.currentUser;
  if (!u) return;
  await setDoc(doc(db, "users", u.uid), {
    uid: u.uid,
    gmail: (u.email || "").toLowerCase(),
    memberId: old?.memberId || makeMemberId(u.uid),
    name,
    status: old?.status || "active",
    updatedAt: serverTimestamp()
  }, { merge: true });
  await showDashboard();
}
window.saveName = saveName;

async function getDeposits() {
  const u = currentUid();
  if (!u) return [];
  const snap = await getDocs(query(collection(db, "deposits"), where("userId", "==", u)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => {
    const date = (a.date || "").localeCompare(b.date || "");
    return date || String(a.createdAt?.seconds || 0).localeCompare(String(b.createdAt?.seconds || 0));
  });
}

async function showDashboard() {
  const u = await getUser();
  if (!u) return;
  if (u.status === "blocked") {
    alert("🔒 আপনার User ID বর্তমানে Block করা হয়েছে।");
    await signOut(auth);
    return;
  }
  $("login").classList.add("hidden");
  $("setup").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("showName").textContent = u.name || "User";
  $("showMemberId").textContent = u.memberId || "—";
  $("sideUserName").textContent = u.name || "User Panel";
  await renderDeposits();
}

async function openDepositForm() {
  const u = await getUser();
  if (!u || u.status === "blocked") return alert("আপনার Account Active নয়।");
  const d = await getDeposits();
  $("serial").value = d.length + 1;
  $("memberId").value = u.memberId || "";
  $("memberName").value = u.name || "";
  $("depositDate").value = new Date().toISOString().slice(0,10);
  $("depositAmount").value = "";
  $("depositMethod").value = "";
  showSection("depositForm");
}
window.openDepositForm = openDepositForm;

async function saveDeposit() {
  const u = await getUser();
  if (!u || u.status === "blocked") return alert("🔒 আপনার Account Block করা হয়েছে।");
  const date = $("depositDate").value;
  const amount = Number($("depositAmount").value);
  const method = $("depositMethod").value;
  if (!date) return alert("জমার তারিখ নির্বাচন করুন।");
  if (!Number.isFinite(amount) || amount <= 0) return alert("সঠিক জমার পরিমাণ লিখুন।");
  if (!method) return alert("জমার মাধ্যম নির্বাচন করুন।");
  const d = await getDeposits();
  await addDoc(collection(db, "deposits"), {
    userId: currentUid(), memberId: u.memberId, name: u.name,
    gmail: u.gmail, date, amount, method, serial: d.length + 1,
    createdAt: serverTimestamp()
  });
  $("depositAmount").value = "";
  $("depositMethod").value = "";
  await renderDeposits();
  showSection("depositList");
  alert("✅ টাকা জমার তথ্য সফলভাবে সংরক্ষণ হয়েছে।");
}
window.saveDeposit = saveDeposit;

async function renderDeposits() {
  const d = await getDeposits();
  const total = d.reduce((s,x) => s + Number(x.amount || 0), 0);
  $("totalAmount").textContent = bn(total.toLocaleString("en-US"));
  $("totalCount").textContent = bn(d.length);
  const body = $("depositBody");
  body.innerHTML = "";
  $("depositEmpty").classList.toggle("hidden", d.length > 0);
  $("depositTableWrap").classList.toggle("hidden", d.length === 0);
  d.forEach((x,i) => {
    const tr = document.createElement("tr");
    [bn(i+1), x.memberId || "", x.date || "", "৳ " + bn(Number(x.amount||0).toLocaleString("en-US")), x.method || ""].forEach(v => {
      const td = document.createElement("td"); td.textContent = v; tr.appendChild(td);
    });
    body.appendChild(tr);
  });
}

function showSection(id) {
  ["dash","depositForm","depositList"].forEach(x => $(x).classList.add("hidden"));
  ["sideDash","sideForm","sideList"].forEach(x => $(x).classList.remove("active"));
  $(id).classList.remove("hidden");
  const side = id === "dash" ? "sideDash" : id === "depositForm" ? "sideForm" : "sideList";
  $(side).classList.add("active");
  closeSidebar();
  if (id === "depositList") renderDeposits();
}
window.showSection = showSection;

function toggleSidebar(){ $("sidebar").classList.toggle("open"); $("overlay").classList.toggle("show"); }
function closeSidebar(){ $("sidebar").classList.remove("open"); $("overlay").classList.remove("show"); }
window.toggleSidebar = toggleSidebar; window.closeSidebar = closeSidebar;

async function logout(){ await signOut(auth); location.reload(); }
window.logout = logout;

onAuthStateChanged(auth, async user => {
  if (!user) {
    $("login").classList.remove("hidden");
    $("setup").classList.add("hidden");
    $("app").classList.add("hidden");
    return;
  }
  try {
    const data = await getUser();
    if (data?.status === "blocked") {
      alert("🔒 আপনার User ID বর্তমানে Block করা হয়েছে।");
      await signOut(auth); return;
    }
    if (data?.name) await showDashboard();
    else {
      $("login").classList.add("hidden");
      $("setup").classList.remove("hidden");
      $("app").classList.add("hidden");
    }
  } catch(e) { alert("ডাটা লোড হয়নি।\n" + e.message); }
});
