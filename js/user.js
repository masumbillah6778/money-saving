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
      d.method || ""
    ].forEach(value => {
      const td = document.createElement("td");
      td.textContent = value;
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
  ["dash", "depositForm", "depositList", "settings"].forEach(x => $(x).classList.add("hidden"));
  ["sideDash", "sideForm", "sideList", "sideSettings"].forEach(x => $(x).classList.remove("active"));

  $(id).classList.remove("hidden");

  const map = {
    dash: "sideDash",
    depositForm: "sideForm",
    depositList: "sideList",
    settings: "sideSettings"
  };

  if (map[id] && $(map[id])) $(map[id]).classList.add("active");
  closeSidebar();

  if (id === "depositForm") prepareForm();
}

function prepareForm() {
  $("serial").value = deposits.length + 1;
  $("memberId").value = $("memberIdDisplay").value;
  $("memberName").value = $("showName").textContent;
  $("depositDate").value = new Date().toISOString().slice(0, 10);
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
      if ($("sideUserName")) $("sideUserName").textContent = profile.displayName;
      if ($("settingsName")) $("settingsName").textContent = profile.displayName;
      if ($("settingsEmail")) $("settingsEmail").textContent = user.email || "—";
      if ($("settingsMemberId")) $("settingsMemberId").textContent = profile.memberId;
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

async function login() {
  clearError();

  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);

    if (e.code === "auth/popup-blocked" || e.code === "auth/popup-cancelled-by-user") {
      try {
        await signInWithRedirect(auth, provider);
      } catch (e2) {
        showError("Google Login Redirect ব্যর্থ: " + (e2.code || e2.message));
      }
    } else {
      showError("Google Login ব্যর্থ: " + (e.code || e.message));
    }
  }
}

if ($("loginBtn")) $("loginBtn").addEventListener("click", login);


async function saveName() {
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
    if ($("sideUserName")) $("sideUserName").textContent = name;
    if ($("settingsName")) $("settingsName").textContent = name;
    if ($("settingsEmail")) $("settingsEmail").textContent = currentUser.email || "—";
    if ($("settingsMemberId")) $("settingsMemberId").textContent = memberId;
    $("setup").classList.add("hidden");
    $("app").classList.remove("hidden");
    $("menuBtn").classList.remove("hidden");
    openSection("dash");
    await loadDeposits();
  } catch (e) {
    console.error(e);
    showError("নাম সংরক্ষণ করা যায়নি: " + (e.code || e.message));
  }
}

if ($("saveNameBtn")) $("saveNameBtn").addEventListener("click", saveName);


async function saveDeposit() {
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
      date,
      amount,
      method,
      createdAt: serverTimestamp()
    });

    await loadDeposits();

    // Save-এর পর তালিকায় যাবে না; নতুন এন্ট্রির জন্য form reset হবে।
    prepareForm();

    alert("✅ টাকা জমার তথ্য সংরক্ষণ হয়েছে.");
  } catch (e) {
    console.error(e);
    showError("টাকা জমা সংরক্ষণ করা যায়নি: " + (e.code || e.message));
  }
}

if ($("saveDepositBtn")) $("saveDepositBtn").addEventListener("click", saveDeposit);


async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    deposits = [];
    $("app").classList.add("hidden");
    $("setup").classList.add("hidden");
    $("login").classList.remove("hidden");
    $("menuBtn").classList.add("hidden");
    closeSidebar();
    clearError();
  } catch (e) {
    console.error(e);
    showError("Logout ব্যর্থ: " + (e.code || e.message));
  }
}

if ($("logoutBtn")) $("logoutBtn").addEventListener("click", logout);


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


window.login = login;
window.saveName = saveName;
window.saveDeposit = saveDeposit;
window.logout = logout;
window.showSection = openSection;

if ($("sideDash")) $("sideDash").onclick = () => openSection("dash");
if ($("sideForm")) $("sideForm").onclick = () => openSection("depositForm");
if ($("sideList")) $("sideList").onclick = () => openSection("depositList");
if ($("sideSettings")) $("sideSettings").onclick = () => openSection("settings");

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
