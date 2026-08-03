// ==========================================
// 📌 1. الإعدادات والمتغيرات العامة (Global State)
// ==========================================
const OWNER_EMAIL = "mohammedabudayya2011@gmail.com";
window.DB_PATH = window.DB_PATH || ""; // المسار المخصص إن وجد في Firebase

let screenHistory = ['home'];
let allUsers = [];
let dbWorlds = [];
let dbLevels = [];
let dbShopItems = [];
let dbCodes = [];
let dbCrates = [];

window.appSettings = {}; 
window.isUserBannedLocally = false;
window.listenersActive = false;

// هيكل بيانات اللاعب الافتراضي
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
  frames: ['بدون إطار'], 
  equippedFrame: 'بدون إطار',
  banners: ['بدون بنر'], 
  equippedBanner: 'بدون بنر',
  badges: [], 
  lastDaily: '', 
  isOwner: false, 
  isBanned: false
};

let player = JSON.parse(JSON.stringify(defaultPlayer));
let currentLevelObj = null;
let currentSlots = [];
let availableLetters = [];

// ==========================================
// 🛠️ 2. الدوال المساعدة (Helper Functions)
// ==========================================
function isOwner() { 
  return player.email === OWNER_EMAIL; 
}

function getDisplayGems() { 
  return isOwner() ? "∞" : player.gems; 
}

function getDisplayShards() { 
  return isOwner() ? "∞" : player.shards; 
}

function calcAccLevel(puzzleStage) { 
  return Math.floor((puzzleStage - 1) / 10) + 1; 
}

function openModal(id) { 
  const el = document.getElementById(id); 
  if (el) el.classList.remove('hidden'); 
}

function closeModal(id) { 
  const el = document.getElementById(id); 
  if (el) el.classList.add('hidden'); 
}

function openAuthModal() { openModal('modal-auth'); }
function openRedeemModal() { openModal('modal-redeem'); }

function showToast(msg, icon = '✨', type = 'info') {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  
  document.getElementById('toast-text').innerText = msg; 
  document.getElementById('toast-icon').innerText = icon;
  
  toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white border px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transition-all duration-300 pointer-events-none z-50';
  
  if (type === 'error') toast.classList.add('border-red-500');
  else if (type === 'success') toast.classList.add('border-green-500');
  else toast.classList.add('border-cyan-500');
  
  toast.classList.remove('-translate-y-10', 'opacity-0');
  setTimeout(() => { 
    toast.classList.add('-translate-y-10', 'opacity-0'); 
  }, 3000);
}

// مؤشرات الصوت (Web Audio API)
let audioCtx = null;
function playSFX(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator(); 
    const gain = audioCtx.createGain();
    osc.connect(gain); 
    gain.connect(audioCtx.destination);
    
    if (type === 'click') { 
      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(400, audioCtx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05); 
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
      osc.start(); 
      osc.stop(audioCtx.currentTime + 0.1); 
    } else if (type === 'win') { 
      osc.type = 'triangle'; 
      osc.frequency.setValueAtTime(400, audioCtx.currentTime); 
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1); 
      osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2); 
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime); 
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); 
      osc.start(); 
      osc.stop(audioCtx.currentTime + 0.5); 
    } else if (type === 'wrong') { 
      osc.type = 'sawtooth'; 
      osc.frequency.setValueAtTime(200, audioCtx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2); 
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime); 
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2); 
      osc.start(); 
      osc.stop(audioCtx.currentTime + 0.2); 
    }
  } catch (e) {}
}

function getUniqueName(baseName) {
  let newName = baseName;
  while (allUsers.some(u => u.name === newName)) { 
    newName = baseName + '_' + Math.floor(Math.random() * 9999); 
  }
  return newName;
}

// ==========================================
// 📱 3. التنقل بين الشاشات (Navigation System)
// ==========================================
function navigateTo(screenId) {
  if (window.isUserBannedLocally) return;
  
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) targetScreen.classList.remove('hidden');
  
  if (screenHistory[screenHistory.length - 1] !== screenId && screenId !== 'splash') {
    screenHistory.push(screenId);
  }
  
  updateNavStyles(screenId);
  
  if (screenId === 'worlds') renderWorldsGrid();
  if (screenId === 'leaderboard') renderLeaderboard();
  if (screenId === 'admin') populateAdminDropdowns();
  if (screenId === 'shop') renderShopItems();
  if (screenId === 'crates') renderCrates();
  if (screenId === 'profile') { calculateProfileRank(); updateUI(); window.updateUIForAuth(); }
  if (screenId === 'home') { window.updateUIForAuth(); }
}

function goBack() {
  if (screenHistory.length > 1) { 
    screenHistory.pop(); 
    navigateTo(screenHistory.pop()); 
  } else { 
    navigateTo('home'); 
  }
}

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
// 🔄 4. مزامنة بيانات اللاعب و Firebase
// ==========================================
window.resetPlayerData = () => { 
  player = JSON.parse(JSON.stringify(defaultPlayer)); 
  updateUI(); 
};

window.loadPlayerData = async (user) => {
  try {
    const userRef = window.doc(window.firebaseDb, window.DB_PATH + 'users', user.uid);
    const snap = await window.getDoc(userRef);
    
    if (snap.exists()) { 
       const data = snap.data();
       if (data.isBanned) { 
         window.isUserBannedLocally = true; 
         openModal('modal-banned'); 
         return; 
       }
       
       player = { ...defaultPlayer, ...data, uid: user.uid, email: user.email || '' };
       player.xp = data.xp || 0;
       player.accLevel = calcAccLevel(player.currentLevel);
    } else {
       let newName = getUniqueName('لاعب');
       player = { ...defaultPlayer, uid: user.uid, email: user.email || '', name: newName, accLevel: 1 };
       await window.setDoc(userRef, player);
    }
  } catch (error) { 
    player.uid = user.uid; 
    player.email = user.email || '';
  }
  
  player.isOwner = (player.email === OWNER_EMAIL);
  updateUI(); 
  window.updateUIForAuth();
};

window.setupRealtimeListeners = () => {
  if (window.listenersActive) return;
  window.listenersActive = true;

  // الإعدادات العامة
  window.onSnapshot(window.doc(window.firebaseDb, window.DB_PATH + 'settings', 'global'), (docSnap) => {
     if (docSnap.exists()){ 
       window.appSettings = docSnap.data(); 
       applyGlobalSettings(); 
     }
  });

  // العوالم
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'worlds'), (snap) => {
    dbWorlds = snap.docs.map(d => d.data()).sort((a,b) => a.start - b.start);
    const hwCount = document.getElementById('home-worlds-count');
    const wtBadge = document.getElementById('worlds-total-badge');
    if (hwCount) hwCount.innerText = `${dbWorlds.length} عوالم ساحرة`;
    if (wtBadge) wtBadge.innerText = `${dbWorlds.length} عالم`;
    if (screenHistory[screenHistory.length-1] === 'worlds') renderWorldsGrid();
    populateAdminDropdowns();
  });

  // المراحل
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'levels'), (snap) => {
    dbLevels = snap.docs.map(d => d.data()).sort((a,b) => a.num - b.num);
  });

  // المتجر والصناديق
  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'shop'), (snap) => {
    dbShopItems = snap.docs.map(d => d.data());
    if (screenHistory[screenHistory.length-1] === 'shop') renderShopItems();
  });

  window.onSnapshot(window.collection(window.firebaseDb, window.DB_PATH + 'crates'), (snap) => {
    dbCrates = snap.docs.map(d => d.data());
    if (screenHistory[screenHistory.length-1] === 'crates') renderCrates();
  });

  // ⚡ استعلام سريع ومحدد للوحة المتصدرين (أعلى 50 لاعب لمنع البطء)
  const topUsersQuery = window.query(
      window.collection(window.firebaseDb, window.DB_PATH + 'users'), 
      window.orderBy('currentLevel', 'desc'), 
      window.limit(50)
  );
  
  window.onSnapshot(topUsersQuery, (snap) => {
    allUsers = snap.docs.map(d => d.data());
    if (screenHistory[screenHistory.length-1] === 'leaderboard') renderLeaderboard();
    if (screenHistory[screenHistory.length-1] === 'profile') calculateProfileRank();
  });

  // مزامنة بيانت المستخدم الحالية
  if (player.uid) {
     window.onSnapshot(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), (docSnap) => {
        if (docSnap.exists()){
           const data = docSnap.data(); 
           if (data.isBanned) { 
             window.isUserBannedLocally = true; 
             openModal('modal-banned'); 
             return; 
           }
           player.shards = data.shards; 
           player.gems = data.gems; 
           player.xp = data.xp || 0;
           player.currentLevel = data.currentLevel; 
           player.name = data.name; 
           player.accLevel = calcAccLevel(player.currentLevel);
           player.titles = data.titles || ['مستكشف الألغاز']; 
           player.equippedTitle = data.equippedTitle || 'مستكشف الألغاز';
           player.avatars = data.avatars || ['https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak']; 
           player.equippedAvatar = data.equippedAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak';
           player.frames = data.frames || ['بدون إطار']; 
           player.equippedFrame = data.equippedFrame || 'بدون إطار';
           player.banners = data.banners || ['بدون بنر']; 
           player.equippedBanner = data.equippedBanner || 'بدون بنر';
           player.badges = data.badges || []; 
           player.lastDaily = data.lastDaily || '';
           updateUI(); 
           window.updateUIForAuth();
        }
     });
  }
};

function applyGlobalSettings() {
    if (!window.appSettings) return;
    const container = document.getElementById('app-container');
    if (container) {
        if (window.appSettings.bgUrl) container.style.backgroundImage = `url('${window.appSettings.bgUrl}')`; 
        else container.style.backgroundImage = 'none';
    }
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
      if (emailText) emailText.innerText = currentUser.email || player.name || 'حساب مسجل';
      if (homeLoginBanner) homeLoginBanner.classList.add('hidden');
      
      if (currentUser.email === OWNER_EMAIL) {
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

function updateUI() {
  player.accLevel = calcAccLevel(player.currentLevel); 
  
  const curShards = document.getElementById('currency-shards');
  const curGems = document.getElementById('currency-gems');
  if (curShards) curShards.innerText = getDisplayShards(); 
  if (curGems) curGems.innerText = getDisplayGems();
  
  const hName = document.getElementById('header-name');
  const hTitle = document.getElementById('header-title');
  if (hName) hName.innerText = player.name; 
  if (hTitle) hTitle.innerHTML = `${player.equippedTitle} <span class="bg-cyan-500 text-white text-[8px] px-1 rounded font-bold">LVL ${player.accLevel}</span>`;
  
  const hAvatar = document.getElementById('header-avatar');
  if (hAvatar) hAvatar.src = player.equippedAvatar;

  const profName = document.getElementById('profile-display-name');
  const profAvatar = document.getElementById('profile-avatar-img');
  const profLevel = document.getElementById('profile-stat-level');
  if (profName) profName.innerText = player.name;
  if (profAvatar) profAvatar.src = player.equippedAvatar;
  if (profLevel) profLevel.innerText = player.currentLevel;
}

async function savePlayer() {
  if (!player.uid) return;
  try { 
    await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), { 
      name: player.name, 
      currentLevel: player.currentLevel, 
      shards: isOwner() ? 0 : player.shards, 
      gems: isOwner() ? 0 : player.gems, 
      xp: player.xp || 0,
      equippedTitle: player.equippedTitle, 
      titles: player.titles, 
      avatars: player.avatars, 
      equippedAvatar: player.equippedAvatar, 
      frames: player.frames, 
      equippedFrame: player.equippedFrame, 
      banners: player.banners, 
      equippedBanner: player.equippedBanner, 
      badges: player.badges, 
      lastDaily: player.lastDaily, 
      isBanned: player.isBanned
    }); 
  } catch(e) {}
}

// ==========================================
// 🔑 5. تسجيل الدخول واختبار الحسابات
// ==========================================
async function handleEmailLogin() {
  const email = document.getElementById('auth-email-input').value.trim();
  const pass = document.getElementById('auth-pass-input').value;
  if (!email || !pass) return showToast("أدخل البيانات كاملة", "⚠️", "error");
  
  try { 
      const cred = await window.signInWithEmailAndPassword(window.firebaseAuth, email, pass); 
      await window.loadPlayerData(cred.user);
      window.updateUIForAuth();
      closeModal('modal-auth'); 
      showToast("تم تسجيل الدخول بنجاح", "✅", "success"); 
  } catch (e) {
      try { 
          const cred = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, pass); 
          await window.loadPlayerData(cred.user);
          window.updateUIForAuth();
          closeModal('modal-auth'); 
          showToast("تم إنشاء الحساب بنجاح", "✅", "success"); 
      } catch(err) { 
          showToast("الرقم السري خاطئ أو البريد مستخدم", "❌", "error"); 
      }
  }
}

async function handleGoogleLogin() { 
    try { 
        const provider = new window.GoogleAuthProvider(); 
        const cred = await window.signInWithPopup(window.firebaseAuth, provider); 
        await window.loadPlayerData(cred.user);
        window.updateUIForAuth();
        closeModal('modal-auth'); 
        showToast("تم الدخول بحساب Google", "✅", "success"); 
    } catch(e) { showToast("فشل الدخول بحساب Google", "❌", "error"); } 
}

// ==========================================
// 🎮 6. طريقة اللعب وإدارة اللغز (Game Mechanics)
// ==========================================
function playCurrentLevel() {
  const lvl = dbLevels.find(l => l.num == player.currentLevel);
  if (!lvl) return showToast("أنت أسطورة! أنهيت جميع المراحل المتاحة حالياً.", "🚀", "info");
  loadLevel(lvl); 
  navigateTo('game');
}

function loadLevel(lvl) {
  currentLevelObj = lvl; 
  document.getElementById('game-level-num').innerText = `مرحلة ${lvl.num}`; 
  document.getElementById('game-question-text').innerText = lvl.q;
  
  const w = dbWorlds.find(x => x.id === lvl.world); 
  if (w) document.getElementById('game-world-bg-icon').innerText = w.icon;
  
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

function addLetterToSlot(letterId) { 
  playSFX('click'); 
  const emptyIndex = currentSlots.findIndex(s => s === null); 
  if (emptyIndex !== -1) { 
    const l = availableLetters.find(x => x.id === letterId); 
    if (l && !l.used) { 
      l.used = true; 
      currentSlots[emptyIndex] = l; 
      renderGameUI(); 
    } 
  } 
}

function removeLetterFromSlot(slotIndex) { 
  const slot = currentSlots[slotIndex]; 
  if (slot) { 
    playSFX('click'); 
    const l = availableLetters.find(x => x.id === slot.id); 
    if (l) l.used = false; 
    currentSlots[slotIndex] = null; 
    renderGameUI(); 
  } 
}

function checkWin() {
  const currentWord = currentSlots.map(s => s ? s.char : '').join('');
  if (currentWord === currentLevelObj.a) {
    playSFX('win'); 
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    const winShards = currentLevelObj.shards || window.appSettings.defaultRewardShards || 5;
    const winXP = currentLevelObj.xp || window.appSettings.defaultRewardXp || 20;

    document.getElementById('win-reward-text').innerText = `حصلت على +${winShards} شظية 🧩 و +${winXP} XP ✨`;
    setTimeout(() => { openModal('modal-win'); }, 400);
  }
}

async function nextLevelFromWinModal() {
  closeModal('modal-win');
  if (player.currentLevel === currentLevelObj.num) {
     const winShards = currentLevelObj.shards || window.appSettings.defaultRewardShards || 5;
     const winXP = currentLevelObj.xp || window.appSettings.defaultRewardXp || 20;

     if (!isOwner()) {
        player.shards += winShards;
        player.xp = (player.xp || 0) + winXP;
     }
     player.currentLevel += 1; 
     player.accLevel = calcAccLevel(player.currentLevel); 
     await savePlayer();
  }
  playCurrentLevel();
}

// ==========================================
// 🗺️ 7. عرض العوالم والمتصدرين والمتجر
// ==========================================
function renderWorldsGrid() {
  const container = document.getElementById('worlds-grid-container');
  if (!container) return;
  container.innerHTML = '';

  if (dbWorlds.length === 0) {
    container.innerHTML = `<div class="text-center text-xs text-gray-400 py-8">لا توجد عوالم بعد.</div>`;
    return;
  }

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

  if (allUsers.length === 0) {
    container.innerHTML = `<div class="text-center text-xs text-gray-400 py-8">جاري تحميل الأبطال...</div>`;
    return;
  }

  allUsers.forEach((u, idx) => {
    const rank = idx + 1;
    let badge = `#${rank}`;
    if (rank === 1) badge = '🥇';
    if (rank === 2) badge = '🥈';
    if (rank === 3) badge = '🥉';

    container.innerHTML += `
      <div class="glass-card p-3 rounded-2xl border border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm font-black w-6 text-center">${badge}</span>
          <img src="${u.equippedAvatar || defaultPlayer.equippedAvatar}" class="w-8 h-8 rounded-full border border-cyan-500/50 object-cover">
          <div>
            <h4 class="text-xs font-bold text-white">${u.name}</h4>
            <span class="text-[9px] text-gray-400">${u.equippedTitle || 'مستكشف'}</span>
          </div>
        </div>
        <span class="text-xs font-black text-cyan-400">مرحلة ${u.currentLevel || 1}</span>
      </div>
    `;
  });
}

function renderShopItems() {
  const container = document.getElementById('shop-items-grid');
  if (!container) return;
  container.innerHTML = dbShopItems.length ? '' : `<div class="col-span-2 text-center text-xs text-gray-400 py-8">لا توجد عناصر بالمتجر حالياً.</div>`;
  
  dbShopItems.forEach(item => {
    container.innerHTML += `
      <div class="glass-card p-4 rounded-2xl text-center space-y-2 border border-white/10">
        <span class="text-3xl">${item.icon || '🎁'}</span>
        <h4 class="text-xs font-bold">${item.name}</h4>
        <button class="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black py-1.5 rounded-xl text-xs">
          ${item.price} 🧩
        </button>
      </div>
    `;
  });
}

function renderCrates() {
  const container = document.getElementById('crates-grid');
  if (!container) return;
  container.innerHTML = dbCrates.length ? '' : `<div class="text-center text-xs text-gray-400 py-8">لا توجد صناديق متاحة حالياً.</div>`;
  
  dbCrates.forEach(crate => {
    container.innerHTML += `
      <div class="glass-card p-4 rounded-2xl flex justify-between items-center border border-amber-500/20">
        <div class="flex items-center gap-3">
          <span class="text-3xl">📦</span>
          <div>
            <h4 class="text-xs font-bold text-amber-400">${crate.name}</h4>
            <span class="text-[10px] text-gray-400">${crate.desc || 'صندوق جوائز أسطوري'}</span>
          </div>
        </div>
        <button class="btn-3d-orange px-4 py-2 rounded-xl text-xs font-black">فتح الصندوق</button>
      </div>
    `;
  });
}

function calculateProfileRank() {
  if (!allUsers.length) return;
  const userIndex = allUsers.findIndex(u => u.uid === player.uid);
  const rankEl = document.getElementById('profile-stat-rank');
  if (rankEl) {
    rankEl.innerText = userIndex !== -1 ? `#${userIndex + 1}` : '#--';
  }
}

async function handleRedeemCode() {
  const input = document.getElementById('redeem-code-input');
  if (!input || !input.value.trim()) return showToast("أدخل الكود أولاً", "⚠️", "error");
  
  showToast("جاري فحص الكود...", "⏳", "info");
  closeModal('modal-redeem');
  input.value = '';
}

// ==========================================
// 👑 8. لوحة تحكم المالك وتوليد 1000 مرحلة
// ==========================================
function populateAdminDropdowns() {}

async function adminSaveGlobalSettings() {
    const bg = document.getElementById('adm-setting-bg')?.value.trim();
    const splashT = document.getElementById('adm-setting-splash-title')?.value.trim();
    const defaultShards = parseInt(document.getElementById('adm-setting-reward-shards')?.value) || 5;
    const defaultXp = parseInt(document.getElementById('adm-setting-reward-xp')?.value) || 20;

    try {
        await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'settings', 'global'), { 
            bgUrl: bg, 
            splashTitle: splashT,
            defaultRewardShards: defaultShards,
            defaultRewardXp: defaultXp
        }, { merge: true });
        showToast("تم حفظ الإعدادات بنجاح!", "🚀", "success");
    } catch(e) { 
        showToast("خطأ أثناء حفظ الإعدادات", "❌", "error"); 
    }
}

async function adminGenerateMassiveGame() {
   if (!confirm("تنبيه: سيتم إنشاء 10 عوالم وبداخلها 1000 مرحلة بتدرج صعوبة محكم. هل أنت موقن؟")) return;
   showToast("جاري إنشاء العوالم والمراحل...", "⏳", "info");
   
   const easyWords = ['قمر','شمس','بحر','نهر','جبل','نجم','سماء','نار','ماء','ثلج','رمل','أسد','نمر','ورد'];
   const medWords = ['كوكب','محيط','صحراء','غابة','بركان','زلزال','عاصفة','إعصار','سفينة','طائرة','سيارة'];
   const hardWords = ['جاذبية','ديناميكا','فلسفة','تاريخ','جغرافيا','اقتصاد','خوارزمية','إلكترون','مجرة'];
   const expertWords = ['أنثروبولوجيا','ميكانيكا','ميتافيزيقيا','سوسيولوجيا','ترانسيلفانيا','استراتيجية'];

   const worlds = [
        { id: 'w1', name: 'غابة البداية', icon: '🌲', rewardTitle: 'حارس الغابة' },
        { id: 'w2', name: 'صحراء الغموض', icon: '🏜️', rewardTitle: 'فارس الصحراء' },
        { id: 'w3', name: 'جبل الجليد', icon: '🏔️', rewardTitle: 'قاهر الصقيع' },
        { id: 'w4', name: 'بركان الغضب', icon: '🌋', rewardTitle: 'سيد النار' },
        { id: 'w5', name: 'أعماق المحيط', icon: '🌊', rewardTitle: 'حاكم البحار' },
        { id: 'w6', name: 'مدينة السحاب', icon: '☁️', rewardTitle: 'صقر السماء' },
        { id: 'w7', name: 'بوابة المجرة', icon: '🌌', rewardTitle: 'رائد الفضاء' },
        { id: 'w8', name: 'عالم النيون', icon: '🏙️', rewardTitle: 'المخترق' },
        { id: 'w9', name: 'متاهة الزمن', icon: '⏳', rewardTitle: 'حارس الزمن' },
        { id: 'w10', name: 'قلعة الأساطير', icon: '🏰', rewardTitle: 'الأسطورة الخالدة' }
   ];

   try {
     let globalLevel = 1;
     for (let i = 0; i < worlds.length; i++) { 
         let w = worlds[i]; 
         let start = globalLevel; 
         let end = globalLevel + 99; // 100 مرحلة لكل عالم

         await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', w.id), { 
            id: w.id, name: w.name, icon: w.icon, start: start, end: end, rewardTitle: w.rewardTitle, finishersCount: 0 
         });
         
         let batchProms = [];
         for (let lvl = start; lvl <= end; lvl++) {
             let wordPool = lvl <= 200 ? easyWords : (lvl <= 500 ? medWords : (lvl <= 800 ? hardWords : expertWords));
             let answer = wordPool[Math.floor(Math.random() * wordPool.length)];
             let difficultyText = lvl <= 200 ? 'سهل' : (lvl <= 500 ? 'متوسط' : (lvl <= 800 ? 'صعب' : 'أسطوري'));
             let question = `المرحلة ${lvl} (${difficultyText}): خمن الكلمة الصحيحة للمرور!`;
             
             batchProms.push(window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'levels', 'lvl_'+lvl), { 
                 num: lvl, world: w.id, q: question, a: answer, shards: 5, xp: 20 
             }));
             
             if (batchProms.length >= 50) {
                 await Promise.all(batchProms);
                 batchProms = [];
             }
         }
         if (batchProms.length > 0) await Promise.all(batchProms);
         globalLevel = end + 1;
     }
     showToast("تم إنشاء 10 عوالم و 1000 مرحلة بنجاح!", "🔥", "success");
   } catch(e) { 
     console.error(e); 
     showToast("حدث خطأ أثناء التوليد", "❌", "error"); 
   }
}

// ==========================================
// 🚀 9. تشغيل التطبيق (App Initialization)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // تهيئة الواجهة
  navigateTo('splash');
  
  // تفعيل الاستماع الأحداث من Firebase فور اكتمال تحميل الصفحة
  const checkInterval = setInterval(() => {
    if (window.firebaseAuth && window.firebaseDb) {
      clearInterval(checkInterval);
      
      window.firebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
          await window.loadPlayerData(user);
        } else {
          try {
            const cred = await window.signInAnonymously(window.firebaseAuth);
            await window.loadPlayerData(cred.user);
          } catch (e) {
            window.resetPlayerData();
          }
        }
        window.setupRealtimeListeners();
      });
    }
  }, 100);
});
