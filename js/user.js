import {auth,db,provider,signInWithPopup,signOut,onAuthStateChanged,doc,getDoc,setDoc,collection,addDoc,getDocs,query,orderBy,serverTimestamp} from "../firebase.js";

let currentUser=null, profile=null, deposits=[];
const $=id=>document.getElementById(id);
const bn=n=>String(n).replace(/[0-9]/g,d=>"০১২৩৪৫৬৭৮৯"[d]);

function setStatus(msg, error=false){ const el=$('status'); if(el){el.textContent=msg||''; el.className='status'+(error?' error':'');} }
function closeSidebar(){ $('sidebar')?.classList.remove('open'); $('overlay')?.classList.remove('open'); }
window.closeSidebar=closeSidebar;
window.toggleSidebar=()=>{ $('sidebar')?.classList.toggle('open'); $('overlay')?.classList.toggle('open'); };

window.showSection=id=>{
  document.querySelectorAll('.page-section').forEach(x=>x.classList.add('hidden'));
  document.querySelectorAll('.side-link').forEach(x=>x.classList.remove('active'));
  $(id)?.classList.remove('hidden');
  const map={dash:'sideDash',depositForm:'sideForm',depositList:'sideList'};
  if(map[id]) $(map[id])?.classList.add('active');
  if(id==='depositForm') openDepositForm();
  if(id==='depositList') renderTable();
  closeSidebar(); window.scrollTo({top:0,behavior:'smooth'});
};

async function login(){
  const btn=$('googleBtn');
  try{
    if(!auth || !provider) throw new Error('Firebase Authentication প্রস্তুত হয়নি।');
    if(btn){btn.disabled=true;btn.textContent='⏳ Google Login হচ্ছে...';}
    setStatus('Google account নির্বাচন করার window আসছে...');
    const result=await signInWithPopup(auth,provider);
    if(!result?.user) throw new Error('Google account পাওয়া যায়নি।');
    setStatus('✅ Login সফল হয়েছে।');
  }catch(e){
    console.error('Google Login Error:',e);
    const code=e?.code||'';
    let msg=e?.message||String(e);
    if(code==='auth/popup-blocked') msg='Browser popup বন্ধ করে দিয়েছে। Chrome-এ popup অনুমতি দিয়ে আবার চেষ্টা করুন।';
    else if(code==='auth/popup-closed-by-user') msg='Google Login window বন্ধ হয়ে গেছে। আবার চেষ্টা করুন।';
    else if(code==='auth/unauthorized-domain') msg='এই website domain Firebase Authentication-এ Authorized Domain হিসেবে যোগ করা হয়নি।';
    else if(code==='auth/operation-not-allowed') msg='Firebase Console-এ Google Sign-in provider চালু করা হয়নি।';
    else if(code==='auth/network-request-failed') msg='ইন্টারনেট সংযোগ পরীক্ষা করুন।';
    setStatus('❌ '+msg,true);
    if(btn){btn.disabled=false;btn.textContent='🔵 Google দিয়ে Login';}
  }
}
window.login=login;

async function ensureProfile(){
  const ref=doc(db,'users',currentUser.uid); const snap=await getDoc(ref);
  if(snap.exists()) profile=snap.data();
  else { const id=await makeMemberId(); profile={memberId:id,displayName:'',email:(currentUser.email||'').toLowerCase(),uid:currentUser.uid,active:true,createdAt:serverTimestamp()}; await setDoc(ref,profile); }
  if(profile.active===false) throw new Error('এই User বর্তমানে Block করা হয়েছে।');
}
async function makeMemberId(){
  const ref=doc(db,'counters','member'); const snap=await getDoc(ref);
  let next=snap.exists()?Number(snap.data().next||1):1;
  const id='6778'+String(next).padStart(4,'0');
  await setDoc(ref,{next:next+1},{merge:true}); return id;
}
async function loadDeposits(){
  const q=query(collection(db,'users',currentUser.uid,'deposits'),orderBy('createdAt','asc'));
  const snap=await getDocs(q); deposits=snap.docs.map(d=>({id:d.id,...d.data()})); renderTable(); updateDashboard();
}
function updateDashboard(){ const total=deposits.reduce((s,x)=>s+Number(x.amount||0),0); $('totalAmount').textContent=bn(total.toLocaleString('en-US')); $('totalCount').textContent=bn(deposits.length); }
function renderTable(){
  const body=$('tbody'); if(!body)return; body.innerHTML='';
  $('empty')?.classList.toggle('hidden',deposits.length>0); $('tableWrap')?.classList.toggle('hidden',deposits.length===0);
  deposits.forEach((x,i)=>{const tr=document.createElement('tr'); [bn(i+1),x.memberId||profile.memberId,x.date||'','৳ '+Number(x.amount||0).toLocaleString('en-US'),x.method||''].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});body.appendChild(tr);});
}
function openDepositForm(){ $('serial').value=bn(deposits.length+1); $('memberId').value=profile.memberId; $('memberName').value=profile.displayName; $('depositDate').value=new Date().toISOString().slice(0,10); $('depositAmount').value=''; $('depositMethod').value=''; }
window.openDepositForm=openDepositForm;
window.saveName=async()=>{try{const name=$('name').value.trim();if(!name)return alert('দয়া করে আপনার নাম লিখুন।');profile.displayName=name;await setDoc(doc(db,'users',currentUser.uid),{displayName:name},{merge:true});await showApp();}catch(e){alert('নাম সংরক্ষণ করা যায়নি:\n\n'+e.message);}};
async function saveDeposit(){
 const date=$('depositDate').value,amount=Number($('depositAmount').value),method=$('depositMethod').value;
 if(!date)return alert('জমার তারিখ নির্বাচন করুন।'); if(!Number.isFinite(amount)||amount<=0)return alert('সঠিক জমার পরিমাণ লিখুন।'); if(!method)return alert('জমার মাধ্যম নির্বাচন করুন।');
 const previous=deposits.reduce((s,x)=>s+Number(x.amount||0),0);
 try{await addDoc(collection(db,'users',currentUser.uid,'deposits'),{memberId:profile.memberId,name:profile.displayName,date,amount,method,runningTotal:previous+amount,ownerUid:currentUser.uid,ownerEmail:(currentUser.email||'').toLowerCase(),createdAt:serverTimestamp()}); await loadDeposits(); $('depositAmount').value='';$('depositMethod').value=''; alert('✅ টাকা অনলাইনে সফলভাবে সংরক্ষণ হয়েছে।'); showSection('dash');}catch(e){alert('তথ্য সংরক্ষণ করা যায়নি:\n\n'+e.message);}
}
window.saveDeposit=saveDeposit;
async function showApp(){ $('login').classList.add('hidden');$('setup').classList.add('hidden');$('app').classList.remove('hidden');$('menuBtn').classList.remove('hidden');$('showName').textContent=profile.displayName;$('memberIdShow').textContent=profile.memberId;await loadDeposits();showSection('dash'); }
function showSetup(){ $('login').classList.add('hidden');$('setup').classList.remove('hidden');$('name').value=profile.displayName||'';$('name').focus(); }
window.logout=async()=>{try{await signOut(auth);}catch(e){console.error(e);}};

// Bind the button from the module itself as well as the inline onclick.
window.addEventListener('DOMContentLoaded',()=>{ $('googleBtn')?.addEventListener('click',login); setStatus('Firebase Login প্রস্তুত আছে।'); });

onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){$('app').classList.add('hidden');$('setup').classList.add('hidden');$('login').classList.remove('hidden');$('menuBtn').classList.add('hidden');closeSidebar();return;}
 try{await ensureProfile();if(!profile.displayName)showSetup();else await showApp();}
 catch(e){console.error(e);setStatus('❌ '+e.message,true);alert(e.message);await signOut(auth);}
});
