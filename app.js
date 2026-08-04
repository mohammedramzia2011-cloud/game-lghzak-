const OWNER_EMAIL = "mohammedabudayya2011@gmail.com";
let screenHistory = ['home'], allUsers = [], dbWorlds = [], dbLevels = [], dbShopItems = [], dbCodes = [], dbCrates = [];
window.appSettings = {}; 
window.isUserBannedLocally = false;

let defaultPlayer = {
  uid: '', email: '', name: 'زائر', 
  currentLevel: 1, accLevel: 1, shards: 0, gems: 0,
  titles: ['مستكشف الألغاز'], equippedTitle: 'مستكشف الألغاز',
  avatars: ['https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak'], equippedAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak',
  frames: ['بدون إطار'], equippedFrame: 'بدون إطار',
  banners: ['بدون بنر'], equippedBanner: 'بدون بنر',
  badges: [], lastDaily: '', isOwner: false
};
let player = JSON.parse(JSON.stringify(defaultPlayer));

function isOwner() { return player.email === OWNER_EMAIL; }

function navigateTo(screenId) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById(`screen-${screenId}`);
  if(target) target.classList.remove('hidden');
  if (screenHistory[screenHistory.length - 1] !== screenId) screenHistory.push(screenId);
  
  if(screenId === 'home') checkDailyReward();
}

function goBack() {
  if (screenHistory.length > 1) { 
      screenHistory.pop(); 
      navigateTo(screenHistory.pop()); 
  } else { navigateTo('home'); }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openAuthModal() { openModal('modal-auth'); }

function showToast(msg, icon = '✨', type = 'info') {
  const toast = document.getElementById('toast-msg');
  document.getElementById('toast-text').innerText = msg; 
  document.getElementById('toast-icon').innerText = icon;
  toast.classList.remove('hidden', '-translate-y-10', 'opacity-0');
  setTimeout(() => { 
      toast.classList.add('-translate-y-10', 'opacity-0'); 
      setTimeout(()=> toast.classList.add('hidden'), 300);
  }, 3000);
}

// 1. حل مشكلة تسجيل الدخول (التعليق والانتظار الطويل)
async function handleEmailLogin() {
  const email = document.getElementById('auth-email-input').value.trim();
  const pass = document.getElementById('auth-pass-input').value;
  if(!email || !pass) return showToast("أدخل البيانات كاملة", "⚠️", "error");
  
  const btn = document.getElementById('login-submit-btn');
  let origText = "دخول";
  if(btn) { origText = btn.innerText; btn.innerText = "جاري الدخول ⏳..."; btn.disabled = true; }
  
  try { 
      // محاولة تسجيل الدخول
      const cred = await window.signInWithEmailAndPassword(window.firebaseAuth, email, pass); 
      await window.loadPlayerData(cred.user);
      closeModal('modal-auth'); 
      showToast("تم تسجيل الدخول بنجاح", "✅", "success"); 
  } catch (e) {
      try { 
          // إذا فشل، محاولة إنشاء حساب جديد
          const cred = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, pass); 
          await window.loadPlayerData(cred.user);
          closeModal('modal-auth'); 
          showToast("تم إنشاء حساب جديد بنجاح", "✅", "success"); 
      } catch(err) { 
          showToast("الرقم السري خاطئ أو البريد مستخدم", "❌", "error"); 
      }
  } finally {
      if(btn) { btn.innerText = origText; btn.disabled = false; }
  }
}

// 2. حل مشكلة زر المكافأة اليومية (لم يكن يُستجاب للضغط)
function checkDailyReward() {
   const today = new Date().toDateString();
   const banner = document.getElementById('daily-reward-banner');
   if(banner) {
       // يتم إظهار الزر إذا لم يستلم اللاعب المكافأة اليوم
       if(player.lastDaily !== today) { banner.classList.remove('hidden'); }
       else { banner.classList.add('hidden'); }
   }
}

async function claimDailyReward() {
   const today = new Date().toDateString();
   if(player.lastDaily === today) return showToast("لقد استلمت مكافأتك مسبقاً", "⚠️", "error");
   
   player.gems += 15;
   player.shards += 50;
   player.lastDaily = today;
   
   // إخفاء البنر وحفظ البيانات
   document.getElementById('daily-reward-banner').classList.add('hidden');
   showToast(`تم الاستلام: +15 💎 و +50 🧩`, "🎉", "success");
   
   try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch(e){}
   await savePlayerSafe();
}

async function savePlayerSafe() {
   if(player.uid && window.firebaseDb) {
       try { await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), player); } catch(e){}
   }
}

// 3. إدارة المالك - حل مشكلة إضافة العوالم
function switchAdminTab(tab) {
   document.getElementById('admin-sec-worlds').classList.add('hidden');
   document.getElementById('admin-sec-crates').classList.add('hidden');
   document.getElementById('admin-sec-codes').classList.add('hidden');
   document.getElementById(`admin-sec-${tab}`).classList.remove('hidden');
}

async function adminSaveWorld() {
    if(!isOwner()) return showToast("غير مصرح", "🚫", "error");
    const id = document.getElementById('adm-world-id').value.trim();
    const name = document.getElementById('adm-world-name').value.trim();
    const icon = document.getElementById('adm-world-icon').value.trim();
    const start = parseInt(document.getElementById('adm-world-start').value);
    const end = parseInt(document.getElementById('adm-world-end').value);
    
    if(!id || !name || !start || !end) return showToast("أكمل جميع الحقول", "⚠️", "error");
    
    try {
        await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', id), {
            id, name, icon, start, end, finishersCount: 0
        });
        showToast("تمت إضافة العالم بنجاح", "✅", "success");
        document.getElementById('adm-world-name').value = '';
    } catch(e) { showToast("خطأ في حفظ العالم", "❌", "error"); }
}

// 4. إدارة المالك - التحكم الكامل بمحتويات الصناديق
async function adminSaveCrateUI() {
    if(!isOwner()) return showToast("غير مصرح", "🚫", "error");
    const name = document.getElementById('adm-crate-name').value.trim();
    const price = parseInt(document.getElementById('adm-crate-price').value);
    const currency = document.getElementById('adm-crate-currency').value;
    
    const type1 = document.getElementById('adm-crate-type1').value;
    const val1 = document.getElementById('adm-crate-val1').value.trim();
    const chance1 = parseInt(document.getElementById('adm-crate-chance1').value);
    
    if(!name || !price || !val1 || !chance1) return showToast("أدخل بيانات الصندوق والمحتوى الأساسي", "⚠️", "error");
    
    const drops = [{
        type: type1, 
        amount: (type1==='shards'||type1==='gems') ? parseInt(val1) : null,
        value: (type1==='title') ? val1 : null,
        chance: chance1
    }];
    
    const id = 'crate_' + Date.now();
    try { 
        await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'crates', id), { 
            id, name, icon: '📦', price, currency, minLevel: 1, drops 
        }); 
        showToast("تم إنشاء الصندوق بنجاح والمحتوى جاهز", "📦", "success"); 
    } catch(e) { showToast("خطأ أثناء الإنشاء", "❌", "error"); }
}

// 5. إدارة المالك - إنشاء كود عالمي متاح لجميع الحسابات
async function adminCreateGlobalCode() {
   if(!isOwner()) return showToast("غير مصرح", "🚫", "error");
   const code = document.getElementById('adm-code-name').value.trim().toUpperCase();
   const gems = parseInt(document.getElementById('adm-code-gems').value) || 0;
   const shards = parseInt(document.getElementById('adm-code-shards').value) || 0;
   
   if(!code) return showToast("أدخل الرمز الترويجي", "⚠️", "error");
   
   try { 
       // استخدام المسار المباشر للأكواد لضمان وصول جميع الحسابات إليه
       await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'codes', code), { 
           code, gems, shards, itemType: 'none', itemValue: '', active: true 
       }); 
       showToast("تم تفعيل الكود لجميع اللاعبين", "🎁", "success"); 
       document.getElementById('adm-code-name').value = '';
   } catch(e) { showToast("خطأ في تفعيل الكود", "❌", "error"); }
}

// 6. استرداد الأكواد من قبل اللاعبين العاديين
async function claimPromoCode() {
   const codeInput = document.getElementById('redeem-code-input').value.trim().toUpperCase();
   if(!codeInput) return showToast("يرجى إدخال الكود", "⚠️", "error"); 
   if(!player.uid) return showToast("يجب تسجيل الدخول أولاً", "🔒", "error");
   
   try {
      const codeRef = window.doc(window.firebaseDb, window.DB_PATH + 'codes', codeInput); 
      const snap = await window.getDoc(codeRef);
      if(!snap.exists() || !snap.data().active) return showToast("كود غير صالح أو منتهي", "❌", "error");
      
      const claimedRef = window.doc(window.firebaseDb, window.DB_PATH + `users/${player.uid}/claimedCodes`, codeInput);
      const claimedSnap = await window.getDoc(claimedRef);
      if(claimedSnap.exists()) return showToast("استخدمت هذا الكود مسبقاً", "⚠️", "error");
      
      const data = snap.data(); let msg = "حصلت على: ";
      if(data.gems > 0) { player.gems += data.gems; msg += `${data.gems}💎 `; }
      if(data.shards > 0) { player.shards += data.shards; msg += `${data.shards}🧩 `; }
      
      await savePlayerSafe(); 
      await window.setDoc(claimedRef, { claimedAt: new Date().toISOString() });
      
      closeModal('modal-redeem'); 
      showToast(msg, "🎉", "success"); 
      document.getElementById('redeem-code-input').value = ''; 
      try{ confetti(); } catch(e){}
   } catch(e) { showToast("حدث خطأ غير متوقع", "❌", "error"); }
}
