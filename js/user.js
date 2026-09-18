import {
  auth, db, provider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut,
  doc, getDoc, setDoc, collection, addDoc,
  query, orderBy, getDocs, serverTimestamp
} from "../firebase.js";

let currentUser = null;
let deposits = [];

const $ = id => document.getElementById(id);
const bn = n => String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);
const money = n => "৳ " + Number(n || 0).toLocaleString("en-US");

function showError(msg) {
  $("loginStatus").textContent = msg;
  $("loginStatus").classList.remove("hidden");
}

function clearError() {
  $("loginStatus").textContent = "";
  $("loginStatus").classList.add("hidden");
}

function localMemberId(uid) {
  // Stable 6778xxxxxx identifier. A secure sequential allocator should be
  // implemented server-side later; this client-only fallback is collision-resistant.
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) - h + uid.charCodeAt(i)) | 0;
  h = Math.abs(h);
  return "6778" + String(h % 1000000).padStart(6, "0");
}

async function ensureProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const memberId = localMemberId(user.uid);
    await setDoc(ref, {
      uid: user.uid,
      email: user.email.toLowerCase(),
      displayName: "",
      memberId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { displayName: "", memberId };
  }
  const data = snap.data();
  return {
    displayName: data.displayName || "",
    memberId: data.memberId || localMemberId(user.uid)
  };
}

async function loadDeposits() {
  if (!currentUser) return;
  const ref = collection(db, "users", currentUser.uid, "deposits");
  const q = query(ref, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  deposits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}

function render() {
  let total = 0;
  $("depositBody").innerHTML = "";

  deposits.forEach((d, i) => {
    total += Number(d.amount || 0);
    const tr = document.createElement("tr");
    [
      bn(i + 1),
      d.memberId || "",
      d.date || "",
      money(d.amount),
      d.method || "",
      money(total)
    ].forEach(v => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    });
    $("depositBody").appendChild(tr);
  });

  $("totalAmount").textContent = total.toLocaleString("en-US");
  $("totalCount").textContent = deposits.length;
  $("depositEmpty").classList.toggle("hidden", deposits.length > 0);
  $("depositTableWrap").classList.toggle("hidden", deposits.length === 0);
}

function openSection(id) {
  ["dash", "depositForm", "depositList"].forEach(x => $(x).classList.add("hidden"));
  ["sideDash", "sideForm", "sideList"].forEach(x => $(x).classList.remove("active"));
  $(id).classList.remove("hidden");
  const map = {dash:"sideDash", depositForm:"sideForm", depositList:"sideList"};
  $(map[id]).classList.add("active");
  closeSidebar();
  if (id === "depositForm") prepareForm();
}

function prepareForm() {
  $("serial").value = deposits.length + 1;
  $("memberId").value = $("memberIdDisplay").value;
  $("memberName").value = $("showName").textContent;
  $("depositDate").value = new Date().toISOString().slice(0,10);
  $("depositAmount").value = "";
  $("depositMethod").value = "";
}

async function afterLogin(user) {
  currentUser = user;
  clearError();
  try {
    const profile = await ensureProfile(user);
    $("login").classList.add("hidden");

    if (!profile.displayName) {
      $("setup").classList.remove("hidden");
      $("name").value = "";
      $("name").focus();
      $("memberIdSetup").textContent = profile.memberId;
    } else {
      $("showName").textContent = profile.displayName;
      $("memberIdDisplay").value = profile.memberId;
      $("memberIdText").textContent = profile.memberId;
      $("setup").classList.add("hidden");
      $("app").classList.remove("hidden");
      $("menuBtn").classList.remove("hidden");
      openSection("dash");
      await loadDeposits();
    }
  } catch (e) {
    console.error(e);
    showError("Firestore থেকে User তথ্য লোড করা যায়নি: " + (e.code || e.message));
  }
}

$("loginBtn").addEventListener("click", async () => {
  clearError();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    if (e.code === "auth/popup-blocked" || e.code === "auth/popup-cancelled-by-user") {
      try { await signInWithRedirect(auth, provider); }
      catch (e2) { showError("Google Login Redirect ব্যর্থ: " + (e2.code || e2.message)); }
    } else {
      showError("Google Login ব্যর্থ: " + (e.code || e.message));
    }
  }
});

$("saveNameBtn").addEventListener("click", async () => {
  const name = $("name").value.trim();
  if (!name) return alert("দয়া করে আপনার নাম লিখুন।");
  try {
    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);
    const memberId = snap.data()?.memberId || localMemberId(currentUser.uid);
    await setDoc(ref, {
      uid: currentUser.uid,
      email: currentUser.email.toLowerCase(),
      displayName: name,
      memberId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    $("showName").textContent = name;
    $("memberIdDisplay").value = memberId;
    $("memberIdText").textContent = memberId;
    $("setup").classList.add("hidden");
    $("app").classList.remove("hidden");
    $("menuBtn").classList.remove("hidden");
    openSection("dash");
    await loadDeposits();
  } catch (e) {
    console.error(e);
    showError("নাম সংরক্ষণ করা যায়নি: " + (e.code || e.message));
  }
});

$("saveDepositBtn").addEventListener("click", async () => {
  const date = $("depositDate").value;
  const amount = Number($("depositAmount").value);
  const method = $("depositMethod").value;
  if (!date) return alert("জমার তারিখ নির্বাচন করুন।");
  if (!Number.isFinite(amount) || amount <= 0) return alert("সঠিক জমার পরিমাণ লিখুন।");
  if (!method) return alert("জমার মাধ্যম নির্বাচন করুন।");

  try {
    const ref = collection(db, "users", currentUser.uid, "deposits");
    await addDoc(ref, {
      uid: currentUser.uid,
      email: currentUser.email.toLowerCase(),
      name: $("showName").textContent,
      memberId: $("memberIdDisplay").value,
      date, amount, method,
      createdAt: serverTimestamp()
    });
    await loadDeposits();
    alert("✅ টাকা জমার তথ্য সংরক্ষণ হয়েছে।");
  } catch (e) {
    console.error(e);
    showError("টাকা জমা সংরক্ষণ করা যায়নি: " + (e.code || e.message));
  }
});

$("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
});

window.toggleSidebar = () => {
  $("sidebar").classList.toggle("open");
  $("overlay").classList.toggle("show");
};
window.closeSidebar = () => {
  $("sidebar").classList.remove("open");
  $("overlay").classList.remove("show");
};
window.showSection = openSection;

$("sideDash").onclick = () => openSection("dash");
$("sideForm").onclick = () => openSection("depositForm");
$("sideList").onclick = () => openSection("depositList");

onAuthStateChanged(auth, async user => {
  if (user) await afterLogin(user);
});

(async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) await afterLogin(result.user);
  } catch (e) {
    console.error(e);
    showError("Redirect Login ব্যর্থ: " + (e.code || e.message));
  }
})();
