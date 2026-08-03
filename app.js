// ==========================================
// 📌 1. الإعدادات والمتغيرات العامة
// ==========================================
const OWNER_EMAIL = "mohammedabudayya2011@gmail.com";
window.DB_PATH = window.DB_PATH || "";

let screenHistory = ['home'];
let allUsers = [];
let dbWorlds = [];
let dbLevels = [];
let dbCrates = [
  { id: 'crate_bronze', name: 'الصندوق البرونزي', icon: '📦', cost: 10, rewardShards: 25 },
  { id: 'crate_silver', name: 'الصندوق الفضي', icon: '🎁', cost: 25, rewardShards: 70 },
  { id: 'crate_gold', name: 'الصندوق الذهبي الأسطوري', icon: '👑', cost: 50, rewardShards: 160 }
];

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
window.openChangeNameModal = function() { window.openModal('modal-change-name'); };

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
// 👑 3. أدوات المالك المطلوبة (الهدايا، الأكواد، التصميم، العداد)
// ==========================================

// إرسال هدية للجميع
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
    window.showToast("تم توزيع الهدايا على جميع اللاعبين بنجاح! 🎁", "✅", "success");
  } catch(e) {
    window.showToast("حدث خطأ أثناء إرسال الهدايا", "❌", "error");
  }
};

// إرسال هدية للاعب معين
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

// إنشاء كود هدية للجميع
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

// كبسة استخدام الكود من قبل اللاعبين
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

// حفظ التصميم وشاشة التحميل
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
    window.showToast("تم تحديث مظهر اللعبة وشاشة التحميل! 🎨", "✅", "success");
  } catch(e) {
    window.showToast("فشل حفظ المظهر", "❌", "error");
  }
};

// زر التحديث الفوري القوي للأحداث
window.adminTriggerEventUpdate = function() {
  window.showToast("تم إطلاق تحديث الأحداث الفوري لجميع الأجهزة! ⚡", "🚀", "success");
  window.setupRealtimeListeners();
};

// توليد 10 عوالم و 1000 مرحلة مع العداد المباشر
window.adminGenerateMassiveGameWithProgress = async function() {
  const progressBox = document.getElementById('admin-progress-box');
  const progressBar = document.getElementById('admin-progress-bar');
  const progressText = document.getElementById('admin-progress-text');
  const progressPercent = document.getElementById('admin-progress-percent');

  if (progressBox) progressBox.classList.remove('hidden');

  const worldIcons = ['🌲', '⏳', '❄️', '🔥', '🏰', '⚡', '🌌', '🐉', '💎', '👑'];
  const worldNames = ['عالم البداية', 'عالم الصحراء', 'عالم الجليد', 'عالم البركان', 'عالم القلعة', 'عالم العاصفة', 'عالم الفضاء', 'عالم التنين', 'عالم الألماسة', 'عالم الملوك'];

  try {
    // 1. توليد العوالم
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

    // 2. توليد 1000 مرحلة مع شريط التقدم
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

      // تحديث العداد المباشر
      const percent = Math.floor((l / totalLevels) * 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressPercent) progressPercent.innerText = `${percent}%`;
      if (progressText) progressText.innerText = `جاري إنشاء المرحلة ${l} من ${totalLevels}...`;
    }

    if (progressText) progressText.innerText = "تم اكتمال توليد 1000 مرحلة بنجاح! 🎉";
    window.showToast("تم توليد 10 عوالم و 1000 مرحلة بالكامل! 🚀", "✅", "success");
  } catch(e) {
    window.showToast("حدث خطأ أثناء التوليد", "❌", "error");
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
    if (appContainer) appContainer.style.backgroundImage = `url('${data.bgUrl}')`;
  }
}

// ==========================================
// 📱 4. التنقل والمزامنة
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
// 📦 5. عرض وفتح الصناديق
// ==========================================
function renderCrates() {
  const container = document.getElementById('crates-grid');
  if (!container) return;
  container.innerHTML = '';

  dbCrates.forEach(c => {
    container.innerHTML += `
      <div class="glass-card p-5 rounded-3xl border border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
        <div class="flex items-center gap-4">
          <span class="text-4xl animate-bounce">${c.icon}</span>
          <div>
            <h3 class="text-sm font-black text-white">${c.name}</h3>
            <span class="text-xs text-amber-400 font-bold">يعطي +${c.rewardShards} شظية 🧩</span>
          </div>
        </div>
        <button onclick="openCrate('${c.id}')" class="btn-3d-orange px-4 py-2.5 rounded-2xl text-xs font-black">
          فتح (${c.cost} 💎)
        </button>
      </div>
    `;
  });
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
  window.showToast(`مبروك! فتحت ${crate.name} وحصلت على +${crate.rewardShards} شظية 🎉`, "🎁", "success");
};

// ==========================================
// 🔎 6. البحث والبروفايل والمفضلة
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
// 🎮 7. اللعب وتحديث واجهة المستخدم
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
  if (!lvl) return window.showToast("أنت أسطورة! أنهيت جميع المراحل المتاحة.", "🚀", "info");
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

  dbWorlds.forEach(w => {
    const isUnlocked = player.currentLevel >= w.start;
    container.innerHTML += `
      <div class="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between ${isUnlocked ? 'opacity-100' : 'opacity-50'}">
        <div class="flex items-center gap-3">
          <span class="text-3xl">${w.icon}</span>
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
// 🚀 8. التشغيل التلقائي
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
