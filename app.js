// ==========================================
// 📌 1. المتغيرات والإعدادات العامة
// ==========================================
const OWNER_EMAIL = "mohammedabudayya2011@gmail.com";
window.DB_PATH = window.DB_PATH || "";

let screenHistory = ['home'];
let allUsers = [];
let dbWorlds = [];
let dbLevels = [];
let dbCrates = [];

let inspectedUser = null;
window.listenersActive = false;

const defaultPlayer = {
  uid: '', 
  email: '', 
  name: 'زائر', 
  currentLevel: 1, 
  accLevel: 1, 
  shards: 0, 
  gems: 0, 
  equippedAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak',
  favorites: [],
  isOwner: false
};

let player = JSON.parse(JSON.stringify(defaultPlayer));
let currentLevelObj = null;
let currentSlots = [];
let availableLetters = [];

// ==========================================
// 🛠️ 2. الدوال المساعدة وتفقد المالك
// ==========================================
window.isOwnerEmail = function(email) {
  return (email || '').toLowerCase().trim() === OWNER_EMAIL.toLowerCase().trim();
};

window.isOwner = function() {
  return window.isOwnerEmail(player.email);
};

window.getDisplayGems = function() { return window.isOwner() ? "∞" : player.gems; };
window.getDisplayShards = function() { return window.isOwner() ? "∞" : player.shards; };

window.openModal = function(id) { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); };
window.closeModal = function(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); };
window.openAuthModal = function() { window.openModal('modal-auth'); };
window.openChangeNameModal = function() { 
  const nameInput = document.getElementById('new-name-input');
  if (nameInput) nameInput.value = player.name;
  window.openModal('modal-change-name'); 
};

window.showToast = function(msg, icon = '✨', type = 'info') {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  document.getElementById('toast-text').innerText = msg; 
  document.getElementById('toast-icon').innerText = icon;
  
  toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white border px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transition-all duration-300 pointer-events-none z-50';
  if (type === 'error') toast.classList.add('border-red-500');
  else if (type === 'success') toast.classList.add('border-green-500');
  else toast.classList.add('border-cyan-500');
  
  toast.classList.remove('-translate-y-10', 'opacity-0');
  setTimeout(() => { toast.classList.add('-translate-y-10', 'opacity-0'); }, 3500);
};

// ==========================================
// 🔐 3. تسجيل الدخول والتسجيل وتعديل الاسم
// ==========================================

// تسجيل الدخول / إنشاء الحساب بالبريد وكلمة السر
window.handleEmailLogin = async function() {
  const emailInput = document.getElementById('auth-email-input');
  const passInput = document.getElementById('auth-pass-input');
  
  const email = emailInput ? emailInput.value.trim() : '';
  const pass = passInput ? passInput.value.trim() : '';

  if (!email || !pass) {
    return window.showToast("يرجى كتابة البريد الإلكتروني وكلمة المرور", "⚠️", "error");
  }
  if (pass.length < 6) {
    return window.showToast("كلمة المرور يجب أن تكون 6 خانات على الأقل", "⚠️", "error");
  }

  window.showToast("جاري تسجيل الدخول...", "⏳", "info");

  try {
    // محاولة الدخول أولاً
    await window.signInWithEmailAndPassword(window.firebaseAuth, email, pass);
    window.showToast("تم الدخول بنجاح! 🚀", "✅", "success");
    window.closeModal('modal-auth');
  } catch(e) {
    // إذا كان الحساب غير موجود، يتم إنشاؤه تلقائياً
    try {
      await window.createUserWithEmailAndPassword(window.firebaseAuth, email, pass);
      window.showToast("تم إنشاء الحساب والدخول بنجاح! 🎉", "✅", "success");
      window.closeModal('modal-auth');
    } catch(err) {
      window.showToast("خطأ في الدخول/الإنشاء: " + err.message, "❌", "error");
    }
  }
};

// الدخول بـ Google
window.handleGoogleLogin = async function() {
  try {
    const provider = new window.GoogleAuthProvider();
    await window.signInWithPopup(window.firebaseAuth, provider);
    window.showToast("تم الدخول بحساب Google! 🚀", "✅", "success");
    window.closeModal('modal-auth');
  } catch(e) {
    window.showToast("فشل الدخول بـ Google: " + e.message, "❌", "error");
  }
};

// حفظ اسم المستخدم الجديد
window.saveNewUsername = async function() {
  const nameInput = document.getElementById('new-name-input');
  const newName = nameInput ? nameInput.value.trim() : '';

  if (!newName) {
    return window.showToast("أدخل اسماً صالحاً!", "⚠️", "error");
  }

  player.name = newName;
  await savePlayer();
  updateUI();
  window.closeModal('modal-change-name');
  window.showToast("تم تحديث الاسم بنجاح! ✨", "✅", "success");
};

// ==========================================
// 👑 4. أدوات المالك المطلوبة (المتجر، المراحل، الخلفية)
// ==========================================

// أ) إدارة المتجر والصناديق (إضافة وحذف)
window.adminAddCrate = async function() {
  const name = document.getElementById('adm-crate-name').value.trim();
  const icon = document.getElementById('adm-crate-icon').value.trim() || '📦';
  const cost = parseInt(document.getElementById('adm-crate-cost').value) || 0;
  const reward = parseInt(document.getElementById('adm-crate-reward').value) || 0;

  if (!name || cost <= 0) {
    return window.showToast("يرجى إدخال اسم وسعر المنتج", "⚠️", "error");
  }

  const crateId = 'crate_' + Date.now();
  try {
    await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'crates', crateId), {
      id: crateId,
      name: name,
      icon: icon,
      cost: cost,
      rewardShards: reward
    });
    window.showToast("تمت إضافة المنتج للمتجر! 🎉", "✅", "success");
  } catch(e) {
    window.showToast("فشل إضافة المنتج للمتجر", "❌", "error");
  }
};

window.adminDeleteCrate = async function(crateId) {
  try {
    await window.deleteDoc(window.doc(window.firebaseDb, window.DB_PATH + 'crates', crateId));
    window.showToast("تم حذف المنتج من المتجر", "🗑️", "info");
  } catch(e) {
    window.showToast("فشل حذف المنتج", "❌", "error");
  }
};

// ب) إضافة وحذف العوالم والمراحل
window.adminAddWorld = async function() {
  const num = parseInt(document.getElementById('adm-world-num').value);
  const name = document.getElementById('adm-world-name').value.trim();
  const icon = document.getElementById('adm-world-icon').value.trim() || '🌲';

  if (!num || !name) return window.showToast("أدخل رقم واسم العالم", "⚠️", "error");

  try {
    await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', `world_${num}`), {
      num: num,
      name: name,
      icon: icon,
      start: ((num - 1) * 100) + 1,
      end: num * 100
    });
    window.showToast(`تمت إضافة العالم ${num} بنجاح! 🌍`, "✅", "success");
  } catch(e) {
    window.showToast("فشل إضافة العالم", "❌", "error");
  }
};

window.adminAddLevel = async function() {
  const num = parseInt(document.getElementById('adm-level-num').value);
  const q = document.getElementById('adm-level-q').value.trim();
  const a = document.getElementById('adm-level-a').value.trim();

  if (!num || !q || !a) return window.showToast("أدخل رقم المرحلة والسؤال والإجابة", "⚠️", "error");

  try {
    await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'levels', `lvl_${num}`), {
      num: num, q: q, a: a
    });
    window.showToast(`تمت إضافة المرحلة رقم ${num}! 🧩`, "✅", "success");
  } catch(e) {
    window.showToast("فشل إضافة المرحلة", "❌", "error");
  }
};

window.adminDeleteAllWorlds = async function() {
  if (!confirm("هل أنت تأكد من مسح جميع العوالم؟")) return;
  try {
    const snap = await window.getDocs(window.collection(window.firebaseDb, window.DB_PATH + 'worlds'));
    for (const d of snap.docs) {
      await window.deleteDoc(d.ref);
    }
    window.showToast("تم مسح كافة العوالم بنجاح", "🗑️", "success");
  } catch(e) {
    window.showToast("حدث خطأ أثناء المسح", "❌", "error");
  }
};

window.adminDeleteAllLevels = async function() {
  if (!confirm("هل أنت تأكد من مسح جميع المراحل؟")) return;
  try {
    const snap = await window.getDocs(window.collection(window.firebaseDb, window.DB_PATH + 'levels'));
    for (const d of snap.docs) {
      await window.deleteDoc(d.ref);
    }
    window.showToast("تم مسح كافة المراحل بنجاح", "🗑️", "success");
  } catch(e) {
    window.showToast("حدث خطأ أثناء المسح", "❌", "error");
  }
};

// ج) توليد 10 عوالم و 1000 مرحلة مع شريط العداد التفاعلي (بدون تجميد)
window.adminGenerateMassiveGameWithProgress = async function() {
  const progressBox = document.getElementById('admin-progress-box');
  const progressBar = document.getElementById('admin-progress-bar');
  const progressText = document.getElementById('admin-progress-text');
  const progressPercent = document.getElementById('admin-progress-percent');

  if (progressBox) progressBox.classList.remove('hidden');

  const worldIcons = ['🌲', '⏳', '❄️', '🔥', '🏰', '⚡', '🌌', '🐉', '💎', '👑'];
  const worldNames = ['عالم البداية', 'عالم الصحراء', 'عالم الجليد', 'عالم البركان', 'عالم القلعة', 'عالم العاصفة', 'عالم الفضاء', 'عالم التنين', 'عالم الألماسة', 'عالم الملوك'];

  try {
    // 1. توليد العوالم العشرة
    for (let i = 0; i < 10; i++) {
      const wNum = i + 1;
      const wData = {
        num: wNum,
        name: worldNames[i],
        icon: worldIcons[i],
        start: (i * 100) + 1,
        end: (i + 1) * 100
      };
      await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', `world_${wNum}`), wData);
    }

    // 2. توليد 1000 مرحلة مع العداد المباشر
    const totalLevels = 1000;
    const arabicWords = ["بيت", "شمس", "قمر", "نجم", "جبل", "بحر", "نهر", "ورد", "سيف", "قلم"];

    for (let l = 1; l <= totalLevels; l++) {
      const word = arabicWords[(l - 1) % arabicWords.length];
      const levelData = {
        num: l,
        q: `ما هي الكلمة المعبرة عن الصورة أو الرمز رقم (${l})؟`,
        a: word
      };

      await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'levels', `lvl_${l}`), levelData);

      // تحديث واجهة المستخدم بالعداد عبر مهلة تسمح بالرسم
      if (l % 10 === 0 || l === totalLevels) {
        const percent = Math.floor((l / totalLevels) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.innerText = `${percent}%`;
        if (progressText) progressText.innerText = `جاري إنشاء المرحلة ${l} من ${totalLevels}...`;
        await new Promise(res => setTimeout(res, 5));
      }
    }

    if (progressText) progressText.innerText = "تم اكتمال توليد 10 عوالم و 1000 مرحلة بنجاح! 🎉";
    window.showToast("تم توليد 10 عوالم و 1000 مرحلة بالكامل! 🚀", "✅", "success");
  } catch(e) {
    console.error(e);
    window.showToast("حدث خطأ أثناء التوليد: " + e.message, "❌", "error");
  }
};

// د) حفظ وتغيير خلفية التطبيق والمظهر
window.adminSaveDesignAndSplash = async function() {
  const title = document.getElementById('adm-splash-title-input').value.trim();
  const splashImg = document.getElementById('adm-splash-img-input').value.trim();
  const bgUrl = document.getElementById('adm-bg-url-input').value.trim();

  try {
    await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'settings', 'global'), {
      splashTitle: title || 'لغزك',
      splashImgUrl: splashImg || '',
      bgUrl: bgUrl || ''
    }, { merge: true });

    applyGlobalSettings({ splashTitle: title, splashImgUrl: splashImg, bgUrl: bgUrl });
    window.showToast("تم حفظ خلفية التطبيق والمظهر للجميع! 🎨", "✅", "success");
  } catch(e) {
    window.showToast("فشل حفظ المظهر", "❌", "error");
  }
};

// هـ) إرسال الهدايا والأكواد
window.adminSendGiftToAll = async function() {
  const shards = parseInt(document.getElementById('adm-gift-shards').value) || 0;
  const gems = parseInt(document.getElementById('adm-gift-gems').value) || 0;

  if (shards <= 0 && gems <= 0) return window.showToast("أدخل عدد الشظايا أو الجواهر", "⚠️", "error");

  window.showToast("جاري إرسال الهدايا للجميع...", "⏳", "info");
  try {
    for (const u of allUsers) {
      if (!window.isOwnerEmail(u.email)) {
        const uRef = window.doc(window.firebaseDb, window.DB_PATH + 'users', u.uid);
        await window.updateDoc(uRef, {
          shards: (u.shards || 0) + shards,
          gems: (u.gems || 0) + gems
        });
      }
    }
    window.showToast("تم توزيع الهدايا للجميع بنجاح! 🎁", "✅", "success");
  } catch(e) {
    window.showToast("حدث خطأ أثناء الإرسال", "❌", "error");
  }
};

window.adminSendGiftToSpecificUser = async function() {
  const targetVal = document.getElementById('adm-gift-target-uid').value.trim();
  const shards = parseInt(document.getElementById('adm-gift-shards').value) || 0;
  const gems = parseInt(document.getElementById('adm-gift-gems').value) || 0;

  if (!targetVal) return window.showToast("أدخل الـ UID أو اسم اللاعب", "⚠️", "error");

  const target = allUsers.find(u => u.uid === targetVal || u.name === targetVal);
  if (!target) return window.showToast("لم يتم العثور على اللاعب!", "❌", "error");

  try {
    const uRef = window.doc(window.firebaseDb, window.DB_PATH + 'users', target.uid);
    await window.updateDoc(uRef, {
      shards: (target.shards || 0) + shards,
      gems: (target.gems || 0) + gems
    });
    window.showToast(`تم إرسال الهدية للاعب (${target.name}) بنجاح 🎉`, "✅", "success");
  } catch(e) {
    window.showToast("حدث خطأ أثناء التحديث", "❌", "error");
  }
};

window.adminCreatePromoCode = async function() {
  const code = document.getElementById('adm-code-text').value.trim().toUpperCase();
  const shards = parseInt(document.getElementById('adm-code-shards').value) || 0;

  if (!code || shards <= 0) return window.showToast("أدخل كود وعدد الشظايا", "⚠️", "error");

  try {
    await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'codes', code), {
      code: code,
      shards: shards,
      createdAt: new Date().toISOString()
    });
    window.showToast(`تم إنشاء الكود (${code}) بنجاح! 🎉`, "✅", "success");
  } catch(e) {
    window.showToast("فشل إنشاء الكود", "❌", "error");
  }
};

window.redeemCode = async function() {
  const input = document.getElementById('redeem-code-input');
  if (!input) return;
  const codeVal = input.value.trim().toUpperCase();

  if (!codeVal) return window.showToast("أدخل الكود أولاً", "⚠️", "error");

  try {
    const codeRef = window.doc(window.firebaseDb, window.DB_PATH + 'codes', codeVal);
    const snap = await window.getDoc(codeRef);

    if (snap.exists()) {
      const data = snap.data();
      player.shards += (data.shards || 0);
      await savePlayer();
      updateUI();
      input.value = '';
      window.showToast(`مبروك! حصلت على +${data.shards} شظية 🧩`, "🎁", "success");
    } else {
      window.showToast("هذا الكود غير صحيح أو منتهي!", "❌", "error");
    }
  } catch(e) {
    window.showToast("حدث خطأ في تفعيل الكود", "❌", "error");
  }
};

function applyGlobalSettings(data) {
  if (!data) return;
  if (data.splashTitle) {
    const t = document.getElementById('splash-title');
    if (t) t.innerText = data.splashTitle;
  }
  if (data.splashImgUrl) {
    const img = document.getElementById('splash-img');
    const defaultIcon = document.getElementById('splash-default-icon');
    if (img && data.splashImgUrl) {
      img.src = data.splashImgUrl;
      img.classList.remove('hidden');
      if (defaultIcon) defaultIcon.classList.add('hidden');
    }
  }
  if (data.bgUrl) {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.style.backgroundImage = `url('${data.bgUrl}')`;
      appContainer.style.backgroundSize = 'cover';
      appContainer.style.backgroundPosition = 'center';
    }
    document.body.style.backgroundImage = `url('${data.bgUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  }
}

// ==========================================
// 📱 5. التنقل واللوحة
// ==========================================
window.navigateTo = function(screenId) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) targetScreen.classList.remove('hidden');
  
  if (screenHistory[screenHistory.length - 1] !== screenId && screenId !== 'splash') {
    screenHistory.push(screenId);
  }
  
  updateNavStyles(screenId);
  
  if (screenId === 'worlds') renderWorldsGrid();
  if (screenId === 'crates') renderCrates();
  if (screenId === 'leaderboard') renderLeaderboard();
  if (screenId === 'search') handleSearchPlayers();
  if (screenId === 'profile') { renderFavoritesList(); updateUI(); window.updateUIForAuth(); }
  if (screenId === 'home') window.updateUIForAuth();
};

window.goBack = function() {
  if (screenHistory.length > 1) { 
    screenHistory.pop(); 
    window.navigateTo(screenHistory.pop()); 
  } else { 
    window.navigateTo('home'); 
  }
};

function updateNavStyles(activeScreen) {
  document.querySelectorAll('#bottom-nav button').forEach(btn => { 
    btn.classList.remove('text-cyan-500'); 
    btn.classList.add('text-gray-400'); 
  });
  
  const activeBtn = document.getElementById(`nav-${activeScreen}`);
  if (activeBtn) { 
    activeBtn.classList.remove('text-gray-400'); 
    activeBtn.classList.add('text-cyan-500'); 
  }
  
  const bottomNav = document.getElementById('bottom-nav');
  const topBar = document.getElementById('top-bar');
  if (['splash', 'game', 'admin'].includes(activeScreen)) { 
     if (bottomNav) bottomNav.classList.add('hidden'); 
     if (topBar) topBar.classList.add('hidden'); 
  } else { 
     if (bottomNav) bottomNav.classList.remove('hidden'); 
     if (topBar) topBar.classList.remove('hidden'); 
  }
}

// ==========================================
// 📦 6. عرض وفتح المنتجات والمتجر
// ==========================================
function renderCrates() {
  const container = document.getElementById('crates-grid');
  if (!container) return;
  container.innerHTML = '';

  if (dbCrates.length === 0) {
    container.innerHTML = `<div class="text-center text-xs text-gray-400 py-8">المتجر فارغ حالياً.</div>`;
    return;
  }

  dbCrates.forEach(c => {
    container.innerHTML += `
      <div class="glass-card p-5 rounded-3xl border border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
        <div class="flex items-center gap-4">
          <span class="text-4xl animate-bounce">${c.icon || '📦'}</span>
          <div>
            <h3 class="text-sm font-black text-white">${c.name}</h3>
            <span class="text-xs text-amber-400 font-bold">يعطي +${c.rewardShards} شظية 🧩</span>
          </div>
        </div>
        <button onclick="openCrate('${c.id}')" class="btn-3d-orange px-4 py-2.5 rounded-2xl text-xs font-black">
          شراء (${c.cost} 💎)
        </button>
      </div>
    `;
  });

  // قائمة الإدارة في لوحة المالك
  const adminManageList = document.getElementById('adm-crates-manage-list');
  if (adminManageList && window.isOwner()) {
    adminManageList.innerHTML = '';
    dbCrates.forEach(c => {
      adminManageList.innerHTML += `
        <div class="bg-black/40 p-2 rounded-xl flex items-center justify-between text-xs border border-white/5">
          <span>${c.icon} ${c.name} (${c.cost} 💎)</span>
          <button onclick="adminDeleteCrate('${c.id}')" class="text-red-400 font-bold px-2 py-1">حذف 🗑️</button>
        </div>
      `;
    });
  }
}

window.openCrate = async function(crateId) {
  const crate = dbCrates.find(c => c.id === crateId);
  if (!crate) return;

  if (!window.isOwner() && player.gems < crate.cost) {
    return window.showToast("لا تملك جواهر كافية لفتح الصندوق!", "⚠️", "error");
  }

  if (!window.isOwner()) {
    player.gems -= crate.cost;
    player.shards += crate.rewardShards;
  } else {
    player.shards += crate.rewardShards;
  }

  await savePlayer();
  updateUI();
  confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
  window.showToast(`مبروك! حصلت على +${crate.rewardShards} شظية 🎉`, "🎁", "success");
};

// ==========================================
// 🔎 7. البحث والبروفايل والمفضلة
// ==========================================
window.handleSearchPlayers = function() {
  const searchInput = document.getElementById('player-search-input');
  const container = document.getElementById('search-results-list');
  if (!container) return;

  const queryText = (searchInput ? searchInput.value : '').trim().toLowerCase();
  container.innerHTML = '';

  const results = allUsers.filter(u => u.uid !== player.uid && (u.name || '').toLowerCase().includes(queryText));

  if (results.length === 0) {
    container.innerHTML = `<div class="text-center text-xs text-gray-400 py-8">${queryText ? 'لم يتم العثور على أي لاعب.' : 'ابحث باسم اللاعب...'}</div>`;
    return;
  }

  results.forEach(u => {
    const isUserOwner = window.isOwnerEmail(u.email);
    const isFav = (player.favorites || []).includes(u.uid);

    container.innerHTML += `
      <div class="glass-card p-3 rounded-2xl border ${isUserOwner ? 'border-amber-500/60 bg-amber-500/10' : 'border-white/10'} flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <img src="${u.equippedAvatar || defaultPlayer.equippedAvatar}" class="w-10 h-10 rounded-full border ${isUserOwner ? 'border-amber-400' : 'border-cyan-500/50'} object-cover">
            ${isUserOwner ? `<span class="absolute -top-2 -right-1 text-xs">👑</span>` : ''}
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h4 class="text-xs font-bold text-white">${u.name}</h4>
              ${isUserOwner ? `<span class="owner-tag text-[8px] px-1 rounded">OWNER</span>` : ''}
            </div>
            <span class="text-[10px] text-gray-400">مرحلة ${u.currentLevel || 1}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button onclick="toggleFavorite('${u.uid}')" class="px-2.5 py-1.5 rounded-xl text-xs ${isFav ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-gray-300'}">
            ${isFav ? '⭐ مفضلة' : '☆ إضافه'}
          </button>
          <button onclick="inspectUserProfile('${u.uid}')" class="bg-cyan-500 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs">عرض</button>
        </div>
      </div>
    `;
  });
};

window.inspectUserProfile = function(uid) {
  const target = allUsers.find(u => u.uid === uid);
  if (!target) return;
  inspectedUser = target;

  const isUserOwner = window.isOwnerEmail(target.email);
  const cardBox = document.getElementById('inspect-card-box');
  const avatar = document.getElementById('inspect-avatar');
  const name = document.getElementById('inspect-name');
  const crown = document.getElementById('inspect-owner-crown');
  const badge = document.getElementById('inspect-owner-badge');
  const level = document.getElementById('inspect-level');
  const shards = document.getElementById('inspect-shards');

  if (avatar) avatar.src = target.equippedAvatar || defaultPlayer.equippedAvatar;
  if (name) name.innerText = target.name;
  if (level) level.innerText = target.currentLevel || 1;
  if (shards) shards.innerText = isUserOwner ? '∞' : (target.shards || 0);

  if (isUserOwner) {
    if (cardBox) cardBox.classList.add('owner-card-gold');
    if (crown) crown.classList.remove('hidden');
    if (badge) badge.classList.remove('hidden');
  } else {
    if (cardBox) cardBox.classList.remove('owner-card-gold');
    if (crown) crown.classList.add('hidden');
    if (badge) badge.classList.add('hidden');
  }

  updateInspectFavBtn();
  window.openModal('modal-user-profile');
};

function updateInspectFavBtn() {
  if (!inspectedUser) return;
  const isFav = (player.favorites || []).includes(inspectedUser.uid);
  const favBtn = document.getElementById('inspect-fav-btn');
  if (favBtn) {
    favBtn.innerText = isFav ? '⭐ إزالة من المفضلة' : '⭐ إضافة إلى المفضلة';
  }
}

window.toggleFavoriteCurrentInspected = function() {
  if (inspectedUser) {
    window.toggleFavorite(inspectedUser.uid);
    updateInspectFavBtn();
  }
};

window.toggleFavorite = async function(targetUid) {
  if (!player.favorites) player.favorites = [];
  const index = player.favorites.indexOf(targetUid);

  if (index > -1) {
    player.favorites.splice(index, 1);
    window.showToast("تمت الإزالة من المفضلة", "ℹ️", "info");
  } else {
    player.favorites.push(targetUid);
    window.showToast("تمت الإضافة للمفضلة ⭐", "✅", "success");
  }

  await savePlayer();
  if (screenHistory[screenHistory.length - 1] === 'search') handleSearchPlayers();
  if (screenHistory[screenHistory.length - 1] === 'profile') renderFavoritesList();
};

function renderFavoritesList() {
  const container = document.getElementById('favorites-list-container');
  if (!container) return;
  container.innerHTML = '';

  const favUsers = allUsers.filter(u => (player.favorites || []).includes(u.uid));

  if (favUsers.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-gray-400 text-center py-2">لا يوجد لاعبين في المفضلة</p>`;
    return;
  }

  favUsers.forEach(u => {
    const isUserOwner = window.isOwnerEmail(u.email);
    container.innerHTML += `
      <div class="bg-black/30 p-2.5 rounded-2xl border border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" onclick="inspectUserProfile('${u.uid}')">
          <img src="${u.equippedAvatar || defaultPlayer.equippedAvatar}" class="w-8 h-8 rounded-full border border-amber-500/50 object-cover">
          <div>
            <span class="text-xs font-bold text-white block">${u.name} ${isUserOwner ? '👑' : ''}</span>
            <span class="text-[9px] text-gray-400">مرحلة ${u.currentLevel || 1}</span>
          </div>
        </div>
        <button onclick="toggleFavorite('${u.uid}')" class="text-xs text-red-400 p-1">✕</button>
      </div>
    `;
  });
}

// ==========================================
// 🎮 8. اللعب وتحديث واجهة المستخدم
// ==========================================
window.loadPlayerData = async (user) => {
  try {
    const userRef = window.doc(window.firebaseDb, window.DB_PATH + 'users', user.uid);
    const snap = await window.getDoc(userRef);
    
    if (snap.exists()) { 
       const data = snap.data();
       player = { ...defaultPlayer, ...data, uid: user.uid, email: user.email || '' };
    } else {
       player = { ...defaultPlayer, uid: user.uid, email: user.email || '', name: 'لاعب_' + Math.floor(1000 + Math.random() * 9000) };
       await window.setDoc(userRef, player);
    }
  } catch (error) { 
    player.uid = user.uid; player.email = user.email || '';
  }
  
  player.isOwner = window.isOwner();
  updateUI(); 
  window.updateUIForAuth();
};

window.setupRealtimeListeners = () => {
  if (window.listenersActive) return;
  window.listenersActive = true;

  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'worlds'), (snap) => {
    dbWorlds = snap.docs.map(d => d.data()).sort((a,b) => a.num - b.num);
  });

  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'levels'), (snap) => {
    dbLevels = snap.docs.map(d => d.data()).sort((a,b) => a.num - b.num);
  });

  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'crates'), (snap) => {
    dbCrates = snap.docs.map(d => d.data());
    if (screenHistory[screenHistory.length - 1] === 'crates' || screenHistory[screenHistory.length - 1] === 'admin') {
      renderCrates();
    }
  });

  window.onSnapshot(window.doc(window.firebaseDb, window.DB_PATH + 'settings', 'global'), (snap) => {
    if (snap.exists()) applyGlobalSettings(snap.data());
  });

  const topUsersQuery = window.query(
      window.collection(window.firebaseDb, window.DB_PATH + 'users'), 
      window.orderBy('currentLevel', 'desc'), 
      window.limit(100)
  );
  
  window.onSnapshot(topUsersQuery, (snap) => {
    allUsers = snap.docs.map(d => d.data());
    if (screenHistory[screenHistory.length-1] === 'leaderboard') renderLeaderboard();
  });
};

function updateUI() {
  const isOwnerAcc = window.isOwner();
  document.getElementById('currency-shards').innerText = window.getDisplayShards(); 
  document.getElementById('currency-gems').innerText = window.getDisplayGems();
  
  document.getElementById('header-name').innerText = player.name; 
  document.getElementById('header-avatar').src = player.equippedAvatar;

  const hOwnerBadge = document.getElementById('header-owner-badge');
  const hOwnerCrown = document.getElementById('header-owner-crown');
  if (hOwnerBadge) hOwnerBadge.classList.toggle('hidden', !isOwnerAcc);
  if (hOwnerCrown) hOwnerCrown.classList.toggle('hidden', !isOwnerAcc);

  const profName = document.getElementById('profile-display-name');
  const profLevel = document.getElementById('profile-stat-level');
  const profCard = document.getElementById('profile-card-container');
  const profOwnerTag = document.getElementById('profile-owner-tag');
  const profOwnerCrown = document.getElementById('profile-owner-crown');

  if (profName) profName.innerText = player.name;
  if (profLevel) profLevel.innerText = player.currentLevel;

  if (profCard) profCard.classList.toggle('owner-card-gold', isOwnerAcc);
  if (profOwnerTag) profOwnerTag.classList.toggle('hidden', !isOwnerAcc);
  if (profOwnerCrown) profOwnerCrown.classList.toggle('hidden', !isOwnerAcc);
}

async function savePlayer() {
  if (!player.uid) return;
  try { 
    await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), { 
      name: player.name, 
      currentLevel: player.currentLevel, 
      shards: window.isOwner() ? 0 : player.shards, 
      gems: window.isOwner() ? 0 : player.gems,
      favorites: player.favorites || []
    }); 
  } catch(e) {}
}

window.updateUIForAuth = () => {
  const guestSec = document.getElementById('auth-guest-section');
  const loggedSec = document.getElementById('auth-logged-section');
  const emailText = document.getElementById('profile-email-text');
  const adminBtn = document.getElementById('owner-admin-btn-container');
  
  const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
  const isLogged = currentUser && !currentUser.isAnonymous;
  
  if (isLogged) {
      if (guestSec) guestSec.classList.add('hidden');
      if (loggedSec) loggedSec.classList.remove('hidden');
      if (emailText) emailText.innerText = currentUser.email || player.name;
      if (adminBtn) adminBtn.classList.toggle('hidden', !window.isOwnerEmail(currentUser.email));
  } else {
      if (guestSec) guestSec.classList.remove('hidden');
      if (loggedSec) loggedSec.classList.add('hidden');
      if (emailText) emailText.innerText = 'غير مسجل (زائر)';
      if (adminBtn) adminBtn.classList.add('hidden');
  }
};

window.playCurrentLevel = function() {
  const lvl = dbLevels.find(l => l.num == player.currentLevel);
  if (!lvl) return window.showToast("لا توجد مراحل مضافة حالياً أو أنهيت اللعبة بالكامل!", "🚀", "info");
  loadLevel(lvl); 
  window.navigateTo('game');
};

function loadLevel(lvl) {
  currentLevelObj = lvl; 
  document.getElementById('game-level-num').innerText = `مرحلة ${lvl.num}`; 
  document.getElementById('game-question-text').innerText = lvl.q;
  
  currentSlots = Array(lvl.a.length).fill(null);
  const arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'; 
  availableLetters = lvl.a.split('');
  
  while (availableLetters.length < 14) {
    availableLetters.push(arabicLetters[Math.floor(Math.random() * arabicLetters.length)]);
  }
  
  availableLetters = availableLetters
    .sort(() => Math.random() - 0.5)
    .map((char, index) => ({ id: index, char: char, used: false }));
    
  renderGameUI();
}

function renderGameUI() {
  const slotsContainer = document.getElementById('answer-slots-container'); 
  slotsContainer.innerHTML = '';
  currentSlots.forEach((slot, index) => { 
    slotsContainer.innerHTML += `<div onclick="removeLetterFromSlot(${index})" class="letter-slot">${slot ? slot.char : ''}</div>`; 
  });
  
  const poolContainer = document.getElementById('letters-pool-container'); 
  poolContainer.innerHTML = '';
  availableLetters.forEach(l => { 
    poolContainer.innerHTML += `<button onclick="addLetterToSlot(${l.id})" class="letter-btn ${l.used ? 'hidden-letter' : ''}">${l.char}</button>`; 
  });
  
  checkWin();
}

window.addLetterToSlot = function(letterId) { 
  const emptyIndex = currentSlots.findIndex(s => s === null); 
  if (emptyIndex !== -1) { 
    const l = availableLetters.find(x => x.id === letterId); 
    if (l && !l.used) { 
      l.used = true; 
      currentSlots[emptyIndex] = l; 
      renderGameUI(); 
    } 
  } 
};

window.removeLetterFromSlot = function(slotIndex) { 
  const slot = currentSlots[slotIndex]; 
  if (slot) { 
    const l = availableLetters.find(x => x.id === slot.id); 
    if (l) l.used = false; 
    currentSlots[slotIndex] = null; 
    renderGameUI(); 
  } 
};

function checkWin() {
  const currentWord = currentSlots.map(s => s ? s.char : '').join('');
  if (currentWord === currentLevelObj.a) {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => { window.openModal('modal-win'); }, 400);
  }
}

window.nextLevelFromWinModal = async function() {
  window.closeModal('modal-win');
  if (player.currentLevel === currentLevelObj.num) {
     if (!window.isOwner()) player.shards += 5;
     player.currentLevel += 1; 
     await savePlayer();
  }
  window.playCurrentLevel();
};

function renderWorldsGrid() {
  const container = document.getElementById('worlds-grid-container');
  if (!container) return;
  container.innerHTML = '';

  if (dbWorlds.length === 0) {
    container.innerHTML = `<div class="text-center text-xs text-gray-400 py-8">لا توجد عوالم مضافة.</div>`;
    return;
  }

  dbWorlds.forEach(w => {
    const isUnlocked = player.currentLevel >= w.start;
    container.innerHTML += `
      <div class="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between ${isUnlocked ? 'opacity-100' : 'opacity-50'}">
        <div class="flex items-center gap-3">
          <span class="text-3xl">${w.icon || '🌲'}</span>
          <div>
            <h3 class="text-xs font-black text-white">${w.name}</h3>
            <span class="text-[10px] text-gray-400">المراحل: ${w.start} - ${w.end}</span>
          </div>
        </div>
        <div>
          ${isUnlocked 
            ? `<span class="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-xl font-bold">مفتوح</span>` 
            : `<span class="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-xl font-bold">مغلق 🔒</span>`
          }
        </div>
      </div>
    `;
  });
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;
  container.innerHTML = '';

  allUsers.forEach((u, idx) => {
    const rank = idx + 1;
    const isUserOwner = window.isOwnerEmail(u.email);
    let badge = `#${rank}`;
    if (rank === 1) badge = '🥇';
    if (rank === 2) badge = '🥈';
    if (rank === 3) badge = '🥉';

    container.innerHTML += `
      <div onclick="inspectUserProfile('${u.uid}')" class="glass-card p-3 rounded-2xl border ${isUserOwner ? 'border-amber-500/60 bg-amber-500/10' : 'border-white/5'} flex items-center justify-between cursor-pointer">
        <div class="flex items-center gap-3">
          <span class="text-sm font-black w-6 text-center">${badge}</span>
          <div class="relative">
            <img src="${u.equippedAvatar || defaultPlayer.equippedAvatar}" class="w-8 h-8 rounded-full border ${isUserOwner ? 'border-amber-400' : 'border-cyan-500/50'} object-cover">
            ${isUserOwner ? `<span class="absolute -top-2 -right-1 text-[10px]">👑</span>` : ''}
          </div>
          <div>
            <div class="flex items-center gap-1">
              <h4 class="text-xs font-bold text-white">${u.name}</h4>
              ${isUserOwner ? `<span class="owner-tag text-[7px] px-1 rounded">OWNER</span>` : ''}
            </div>
            <span class="text-[9px] text-gray-400">مرحلة ${u.currentLevel || 1}</span>
          </div>
        </div>
        <span class="text-xs font-black text-cyan-400">مرحلة ${u.currentLevel || 1}</span>
      </div>
    `;
  });
}

// ==========================================
// 🚀 9. التشغيل التلقائي
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  window.navigateTo('splash');
  
  const checkInterval = setInterval(() => {
    if (window.firebaseAuth && window.firebaseDb) {
      clearInterval(checkInterval);
      
      window.onAuthStateChanged(window.firebaseAuth, async (user) => {
        if (user) {
          await window.loadPlayerData(user);
        } else {
          try {
            const cred = await window.signInAnonymously(window.firebaseAuth);
            await window.loadPlayerData(cred.user);
          } catch (e) {
            updateUI();
          }
        }
        window.setupRealtimeListeners();
      });
    }
  }, 100);
});
