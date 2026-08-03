// ==========================================
// 📌 1. الإعدادات والمتغيرات العامة
// ==========================================
const OWNER_EMAIL = "mohammedabudayya2011@gmail.com";
window.DB_PATH = window.DB_PATH || "";

let screenHistory = ['home'];
let allUsers = [];
let dbWorlds = [];
let dbLevels = [];
let dbShopItems = [];
let dbCrates = [];
let inspectedUser = null;

window.appSettings = {}; 
window.listenersActive = false;

const defaultPlayer = {
  uid: '', 
  email: '', 
  name: 'زائر', 
  currentLevel: 1, 
  accLevel: 1, 
  shards: 0, 
  gems: 0, 
  xp: 0,
  titles: ['مستكشف الألغاز'], 
  equippedTitle: 'مستكشف الألغاز',
  avatars: ['https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak'], 
  equippedAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak',
  favorites: [], // قائمة المعرفات UID للمفضلة
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
window.calcAccLevel = function(puzzleStage) { return Math.floor((puzzleStage - 1) / 10) + 1; };

window.openModal = function(id) { 
  const el = document.getElementById(id); 
  if (el) el.classList.remove('hidden'); 
};

window.closeModal = function(id) { 
  const el = document.getElementById(id); 
  if (el) el.classList.add('hidden'); 
};

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
// 🛡️ 3. منع تكرار الأسماء + توليد اسم فريد
// ==========================================
function isUsernameTaken(name, currentUid = '') {
  const cleanName = name.trim().toLowerCase();
  return allUsers.some(u => u.uid !== currentUid && (u.name || '').trim().toLowerCase() === cleanName);
}

function getUniqueName(baseName) {
  let newName = baseName.trim();
  let counter = 1;
  while (isUsernameTaken(newName)) { 
    newName = `${baseName}_${Math.floor(1000 + Math.random() * 9000)}`; 
  }
  return newName;
}

window.saveNewUsername = async function() {
  const input = document.getElementById('new-name-input');
  if (!input) return;
  const newName = input.value.trim();

  if (!newName) return window.showToast("أدخل اسماً صحيحاً", "⚠️", "error");
  if (newName.length < 3) return window.showToast("الاسم قصير جداً (3 حروف على الأقل)", "⚠️", "error");

  if (isUsernameTaken(newName, player.uid)) {
    return window.showToast("هذا الاسم مستخدم بالفعل من قبل لاعب آخر!", "❌", "error");
  }

  player.name = newName;
  await savePlayer();
  updateUI();
  window.closeModal('modal-change-name');
  window.showToast("تم تغيير اسم المستخدم بنجاح 🎉", "✅", "success");
};

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
  if (screenId === 'leaderboard') renderLeaderboard();
  if (screenId === 'search') handleSearchPlayers();
  if (screenId === 'profile') { calculateProfileRank(); renderFavoritesList(); updateUI(); window.updateUIForAuth(); }
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
// 🔄 5. تحميل وربط بيانات الفايربيس
// ==========================================
window.loadPlayerData = async (user) => {
  try {
    const userRef = window.doc(window.firebaseDb, window.DB_PATH + 'users', user.uid);
    const snap = await window.getDoc(userRef);
    
    if (snap.exists()) { 
       const data = snap.data();
       player = { ...defaultPlayer, ...data, uid: user.uid, email: user.email || '' };
       player.favorites = data.favorites || [];
    } else {
       let defaultName = user.displayName || 'لاعب';
       let newName = getUniqueName(defaultName);
       player = { ...defaultPlayer, uid: user.uid, email: user.email || '', name: newName, favorites: [] };
       await window.setDoc(userRef, player);
    }
  } catch (error) { 
    player.uid = user.uid; 
    player.email = user.email || '';
  }
  
  player.isOwner = window.isOwner();
  updateUI(); 
  window.updateUIForAuth();
};

window.setupRealtimeListeners = () => {
  if (window.listenersActive) return;
  window.listenersActive = true;

  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'worlds'), (snap) => {
    dbWorlds = snap.docs.map(d => d.data()).sort((a,b) => a.start - b.start);
  });

  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'levels'), (snap) => {
    dbLevels = snap.docs.map(d => d.data()).sort((a,b) => a.num - b.num);
  });

  const topUsersQuery = window.query(
      window.collection(window.firebaseDb, window.DB_PATH + 'users'), 
      window.orderBy('currentLevel', 'desc'), 
      window.limit(100)
  );
  
  window.onSnapshot(topUsersQuery, (snap) => {
    allUsers = snap.docs.map(d => d.data());
    if (screenHistory[screenHistory.length-1] === 'leaderboard') renderLeaderboard();
    if (screenHistory[screenHistory.length-1] === 'search') handleSearchPlayers();
    if (screenHistory[screenHistory.length-1] === 'profile') renderFavoritesList();
  });
};

function updateUI() {
  const isOwnerAcc = window.isOwner();
  
  // تحديث العملات
  document.getElementById('currency-shards').innerText = window.getDisplayShards(); 
  document.getElementById('currency-gems').innerText = window.getDisplayGems();
  
  // تحديث الهيدر العلوي والتاج المالك
  document.getElementById('header-name').innerText = player.name; 
  document.getElementById('header-avatar').src = player.equippedAvatar;

  const hOwnerBadge = document.getElementById('header-owner-badge');
  const hOwnerCrown = document.getElementById('header-owner-crown');
  const hAvatarImg = document.getElementById('header-avatar');

  if (isOwnerAcc) {
    if (hOwnerBadge) hOwnerBadge.classList.remove('hidden');
    if (hOwnerCrown) hOwnerCrown.classList.remove('hidden');
    if (hAvatarImg) hAvatarImg.classList.add('owner-avatar-border');
  } else {
    if (hOwnerBadge) hOwnerBadge.classList.add('hidden');
    if (hOwnerCrown) hOwnerCrown.classList.add('hidden');
    if (hAvatarImg) hAvatarImg.classList.remove('owner-avatar-border');
  }

  // تحديث البروفايل الخاص بالمالك
  const profName = document.getElementById('profile-display-name');
  const profAvatar = document.getElementById('profile-avatar-img');
  const profLevel = document.getElementById('profile-stat-level');
  const profCard = document.getElementById('profile-card-container');
  const profOwnerTag = document.getElementById('profile-owner-tag');
  const profOwnerCrown = document.getElementById('profile-owner-crown');

  if (profName) profName.innerText = player.name;
  if (profAvatar) profAvatar.src = player.equippedAvatar;
  if (profLevel) profLevel.innerText = player.currentLevel;

  if (isOwnerAcc) {
    if (profCard) profCard.classList.add('owner-card-gold');
    if (profOwnerTag) profOwnerTag.classList.remove('hidden');
    if (profOwnerCrown) profOwnerCrown.classList.remove('hidden');
    if (profAvatar) profAvatar.classList.add('owner-avatar-border');
  } else {
    if (profCard) profCard.classList.remove('owner-card-gold');
    if (profOwnerTag) profOwnerTag.classList.add('hidden');
    if (profOwnerCrown) profOwnerCrown.classList.add('hidden');
    if (profAvatar) profAvatar.classList.remove('owner-avatar-border');
  }
}

async function savePlayer() {
  if (!player.uid) return;
  try { 
    await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), { 
      name: player.name, 
      currentLevel: player.currentLevel, 
      shards: window.isOwner() ? 0 : player.shards, 
      gems: window.isOwner() ? 0 : player.gems, 
      equippedTitle: player.equippedTitle, 
      equippedAvatar: player.equippedAvatar,
      favorites: player.favorites || []
    }); 
  } catch(e) {}
}

window.updateUIForAuth = () => {
  const guestSec = document.getElementById('auth-guest-section');
  const loggedSec = document.getElementById('auth-logged-section');
  const emailText = document.getElementById('profile-email-text');
  const adminBtn = document.getElementById('owner-admin-btn-container');
  const homeLoginBanner = document.getElementById('home-login-banner');
  
  const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
  const isLogged = currentUser && !currentUser.isAnonymous;
  
  if (isLogged) {
      if (guestSec) guestSec.classList.add('hidden');
      if (loggedSec) loggedSec.classList.remove('hidden');
      if (emailText) emailText.innerText = currentUser.email || player.name;
      if (homeLoginBanner) homeLoginBanner.classList.add('hidden');
      
      if (window.isOwnerEmail(currentUser.email)) {
          if (adminBtn) adminBtn.classList.remove('hidden');
      } else {
          if (adminBtn) adminBtn.classList.add('hidden');
      }
  } else {
      if (guestSec) guestSec.classList.remove('hidden');
      if (loggedSec) loggedSec.classList.add('hidden');
      if (emailText) emailText.innerText = 'غير مسجل (زائر)';
      if (homeLoginBanner) homeLoginBanner.classList.remove('hidden');
      if (adminBtn) adminBtn.classList.add('hidden');
  }
};

// ==========================================
// 🔎 6. ميزة البحث عن اللاعبين وعرض البروفايل
// ==========================================
window.handleSearchPlayers = function() {
  const searchInput = document.getElementById('player-search-input');
  const container = document.getElementById('search-results-list');
  if (!container) return;

  const queryText = (searchInput ? searchInput.value : '').trim().toLowerCase();
  container.innerHTML = '';

  const results = allUsers.filter(u => u.uid !== player.uid && (u.name || '').toLowerCase().includes(queryText));

  if (results.length === 0) {
    container.innerHTML = `<div class="text-center text-xs text-gray-400 py-8">${queryText ? 'لم يتم العثور على أي لاعب بهذا الاسم.' : 'ابحث باسم اللاعب...'}</div>`;
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
          <button onclick="inspectUserProfile('${u.uid}')" class="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs">
            عرض
          </button>
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
  const favBtn = document.getElementById('inspect-fav-btn');

  if (avatar) avatar.src = target.equippedAvatar || defaultPlayer.equippedAvatar;
  if (name) name.innerText = target.name;
  if (level) level.innerText = target.currentLevel || 1;
  if (shards) shards.innerText = isUserOwner ? '∞' : (target.shards || 0);

  if (isUserOwner) {
    if (cardBox) cardBox.classList.add('owner-card-gold');
    if (crown) crown.classList.remove('hidden');
    if (badge) badge.classList.remove('hidden');
    if (avatar) avatar.classList.add('owner-avatar-border');
  } else {
    if (cardBox) cardBox.classList.remove('owner-card-gold');
    if (crown) crown.classList.add('hidden');
    if (badge) badge.classList.add('hidden');
    if (avatar) avatar.classList.remove('owner-avatar-border');
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
    favBtn.className = isFav ? 'w-full bg-amber-500/20 text-amber-400 border border-amber-500/40 py-3 rounded-2xl text-xs font-black' : 'w-full btn-3d-orange py-3 rounded-2xl text-xs font-black';
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
    container.innerHTML = `<p class="text-[11px] text-gray-400 text-center py-2">لا يوجد لاعبين في المفضلة حالياً</p>`;
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
// 🔑 7. التسجيل والدخول
// ==========================================
window.handleEmailLogin = async function() {
  const emailInput = document.getElementById('auth-email-input').value.trim().toLowerCase();
  const pass = document.getElementById('auth-pass-input').value.trim();

  if (!emailInput || !pass) return window.showToast("أدخل البريد وكلمة المرور كامليْن", "⚠️", "error");
  if (pass.length < 6) return window.showToast("كلمة المرور 6 خانات على الأقل", "⚠️", "error");

  window.showToast("جاري فحص الحساب...", "⏳", "info");

  try { 
      const cred = await window.signInWithEmailAndPassword(window.firebaseAuth, emailInput, pass); 
      await window.loadPlayerData(cred.user);
      window.updateUIForAuth();
      window.closeModal('modal-auth'); 
      window.showToast("أهلاً بك! تم الدخول بنجاح 🎉", "✅", "success"); 
  } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          try { 
              const cred = await window.createUserWithEmailAndPassword(window.firebaseAuth, emailInput, pass); 
              await window.loadPlayerData(cred.user);
              window.updateUIForAuth();
              window.closeModal('modal-auth'); 
              window.showToast("تم إنشاء حساب جديد بنجاح 🚀", "✅", "success"); 
          } catch(createErr) {
              window.showToast("حدث خطأ أثناء الإنشاء", "❌", "error"); 
          }
      } else {
          window.showToast("كلمة المرور أو البريد خاطئ", "❌", "error"); 
      }
  }
};

window.handleGoogleLogin = async function() { 
  try { 
      const provider = new window.GoogleAuthProvider(); 
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await window.signInWithPopup(window.firebaseAuth, provider); 
      await window.loadPlayerData(cred.user);
      window.updateUIForAuth();
      window.closeModal('modal-auth'); 
      window.showToast("تم الدخول بحساب Google بنجاح 🎉", "✅", "success"); 
  } catch(e) { 
      window.showToast("فشل الدخول بـ Google", "❌", "error"); 
  } 
};

// ==========================================
// 🎮 8. نظام اللعب
// ==========================================
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
     if (!window.isOwner()) {
        player.shards += 5;
     }
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
            <span class="text-[9px] text-gray-400">${u.equippedTitle || 'مستكشف'}</span>
          </div>
        </div>
        <span class="text-xs font-black text-cyan-400">مرحلة ${u.currentLevel || 1}</span>
      </div>
    `;
  });
}

function calculateProfileRank() {
  if (!allUsers.length) return;
  const userIndex = allUsers.findIndex(u => u.uid === player.uid);
  const rankEl = document.getElementById('profile-stat-rank');
  if (rankEl) rankEl.innerText = userIndex !== -1 ? `#${userIndex + 1}` : '#--';
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
