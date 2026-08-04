// --- إعدادات اللعبة والبيانات ---
const OWNER_EMAIL = "mohammedabudayya2011@gmail.com";
let screenHistory = ['home'], allUsers = [], dbWorlds = [], dbLevels = [], dbShopItems = [], dbCodes = [], dbCrates = [];
window.appSettings = {}; 
window.isUserBannedLocally = false;
window.listenersActive = false;

let defaultPlayer = {
  uid: '', email: '', name: 'زائر', 
  currentLevel: 1, accLevel: 1, shards: 0, gems: 0,
  titles: ['مستكشف الألغاز'], equippedTitle: 'مستكشف الألغاز',
  avatars: ['https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak'], equippedAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lghzak',
  frames: ['بدون إطار'], equippedFrame: 'بدون إطار',
  banners: ['بدون بنر'], equippedBanner: 'بدون بنر',
  badges: [], lastDaily: '', isOwner: false, isBanned: false,
  favorites: [], claimedCodes: [] // حل مشكلة الأكواد
};
let player = JSON.parse(JSON.stringify(defaultPlayer));
let currentLevelObj = null, currentSlots = [], availableLetters = [];

// --- أدوات النظام ---
function isOwner() { return player.email === OWNER_EMAIL; }
function getDisplayGems() { return isOwner() ? "∞" : player.gems; }
function getDisplayShards() { return isOwner() ? "∞" : player.shards; }
function calcAccLevel(puzzleStage) { return Math.floor((puzzleStage - 1) / 10) + 1; }

const frameClassesMap = { 'بدون إطار': '', 'ذهبي': 'frame-gold', 'ناري': 'frame-fire', 'نيون': 'frame-neon', 'أسطوري': 'frame-mythic' };
function getFrameClass(frameName) { return frameClassesMap[frameName] || ''; }

// --- التنقل بين الشاشات ---
function navigateTo(screenId) {
  if(window.isUserBannedLocally) return;
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`screen-${screenId}`).classList.remove('hidden');
  if (screenHistory[screenHistory.length - 1] !== screenId && screenId !== 'splash') screenHistory.push(screenId);
  updateNavStyles(screenId);
  
  if(screenId === 'worlds') renderWorldsGrid();
  if(screenId === 'leaderboard') renderLeaderboard();
  if(screenId === 'admin') populateAdminDropdowns();
  if(screenId === 'shop') renderShopItems();
  if(screenId === 'crates') renderCrates();
  if(screenId === 'profile') { updateUI(); window.updateUIForAuth(); }
  if(screenId === 'home') { checkDailyReward(); window.updateUIForAuth(); }
}

function goBack() {
  if (screenHistory.length > 1) { screenHistory.pop(); navigateTo(screenHistory.pop()); } else { navigateTo('home'); }
}

function updateNavStyles(activeScreen) {
  document.querySelectorAll('#bottom-nav button').forEach(btn => { btn.classList.remove('text-brand-500'); btn.classList.add('text-gray-400'); });
  const activeBtn = document.getElementById(`nav-${activeScreen}`);
  if (activeBtn) { activeBtn.classList.remove('text-gray-400'); activeBtn.classList.add('text-brand-500'); }
  if (['splash', 'game', 'admin', 'public-profile'].includes(activeScreen)) { document.getElementById('bottom-nav').classList.add('hidden'); document.getElementById('top-bar').classList.add('hidden'); } else { document.getElementById('bottom-nav').classList.remove('hidden'); document.getElementById('top-bar').classList.remove('hidden'); }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openAuthModal() { openModal('modal-auth'); }
function openRedeemModal() { openModal('modal-redeem'); }

function showToast(msg, icon = '✨', type = 'info') {
  const toast = document.getElementById('toast-msg');
  document.getElementById('toast-text').innerText = msg; document.getElementById('toast-icon').innerText = icon;
  toast.className = 'bg-gray-900/95 text-white border px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transform transition-all duration-300 pointer-events-auto z-[100]';
  if(type === 'error') toast.classList.add('border-red-500'); else if(type === 'success') toast.classList.add('border-green-500'); else toast.classList.add('border-brand-500');
  toast.classList.remove('-translate-y-10', 'opacity-0');
  setTimeout(() => { toast.classList.add('-translate-y-10', 'opacity-0'); }, 3000);
}

// --- نظام الصوتيات ---
let audioCtx = null;
function playSFX(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1); } 
    else if (type === 'win') { osc.type = 'triangle'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1); gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); osc.start(); osc.stop(audioCtx.currentTime + 0.5); }
    else if (type === 'crate_open') { osc.type = 'square'; osc.frequency.setValueAtTime(300, audioCtx.currentTime); osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.7); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2); osc.start(); osc.stop(audioCtx.currentTime + 1.2); }
  } catch (e) {}
}

function getUniqueName(baseName) {
    let newName = baseName;
    while(allUsers.some(u => u.name === newName)) { newName = baseName + '_' + Math.floor(Math.random()*9999); }
    return newName;
}

// --- حفظ وقراءة البيانات ---
window.loadPlayerData = async (user) => {
  try {
    const userRef = window.doc(window.firebaseDb, window.DB_PATH + 'users', user.uid);
    const snap = await window.getDoc(userRef);
    if (snap.exists()) { 
       const data = snap.data();
       if(data.isBanned) { window.isUserBannedLocally = true; return; }
       player = { ...defaultPlayer, ...data, uid: user.uid, email: user.email || '' };
       if(!player.claimedCodes) player.claimedCodes = []; // تحديث للمستخدمين القدامى
       player.accLevel = calcAccLevel(player.currentLevel);
    } else {
       let newName = getUniqueName('لاعب');
       player = { ...defaultPlayer, uid: user.uid, email: user.email || '', name: newName, accLevel: 1 };
       await window.setDoc(userRef, player);
    }
  } catch (error) { player.uid = user.uid; player.email = user.email || ''; }
  
  player.isOwner = (player.email === OWNER_EMAIL);
  updateUI(); window.updateUIForAuth();
};

window.setupRealtimeListeners = () => {
  if(window.listenersActive) return;
  window.listenersActive = true;
  // أضف مستمعات قاعدة البيانات هنا للـ (Settings, Worlds, Levels, Shop, Crates, Codes, Users)
  // ... (نفس المستمعات السابقة لا تغيير فيها)
};

window.updateUIForAuth = () => {
  const currentUser = window.firebaseAuth ? window.firebaseAuth.currentUser : null;
  const isLogged = currentUser && !currentUser.isAnonymous ? true : false;
  
  const adminBtn = document.getElementById('owner-admin-btn-container');
  const homeLoginBanner = document.getElementById('home-login-banner');
  const ownerBadge = document.getElementById('header-owner-badge');

  if (isLogged) {
      if(homeLoginBanner) homeLoginBanner.classList.add('hidden');
      if (currentUser.email === OWNER_EMAIL) {
          if(adminBtn) adminBtn.classList.remove('hidden');
          if(ownerBadge) ownerBadge.classList.remove('hidden');
      } else {
          if(adminBtn) adminBtn.classList.add('hidden');
          if(ownerBadge) ownerBadge.classList.add('hidden');
      }
  } else {
      if(homeLoginBanner) homeLoginBanner.classList.remove('hidden');
      if(adminBtn) adminBtn.classList.add('hidden');
      if(ownerBadge) ownerBadge.classList.add('hidden');
  }
};

function updateUI() {
  player.accLevel = calcAccLevel(player.currentLevel); 
  document.getElementById('currency-shards').innerText = getDisplayShards(); 
  document.getElementById('currency-gems').innerText = getDisplayGems();
  document.getElementById('header-name').innerText = player.name; 
  document.getElementById('header-title').innerHTML = `${player.equippedTitle} <span class="bg-brand-500 text-white text-[8px] px-1 rounded">LVL ${player.accLevel}</span>`;
  document.getElementById('header-avatar').src = player.equippedAvatar;
  document.getElementById('header-frame-wrap').className = `relative rounded-full ${getFrameClass(player.equippedFrame)}`;
  
  const nameTxt = document.getElementById('profile-name-text'); if(nameTxt) nameTxt.innerText = player.name;
  const lvlTxt = document.getElementById('profile-stat-level'); if(lvlTxt) lvlTxt.innerText = player.currentLevel;
  const tBadge = document.getElementById('profile-title-badge'); if(tBadge) tBadge.innerText = player.equippedTitle;
  const pAvatar = document.getElementById('profile-avatar-img'); if(pAvatar) pAvatar.src = player.equippedAvatar;
  const cAccLvl = document.getElementById('crate-acc-level'); if(cAccLvl) cAccLvl.innerText = `مستواك: ${player.accLevel}`;
}

async function savePlayer() {
  if(!player.uid) return;
  try { await window.updateDoc(window.doc(window.firebaseDb, window.DB_PATH + 'users', player.uid), { 
      name: player.name, currentLevel: player.currentLevel, 
      shards: isOwner() ? 0 : player.shards, gems: isOwner() ? 0 : player.gems, 
      equippedTitle: player.equippedTitle, titles: player.titles, 
      avatars: player.avatars, equippedAvatar: player.equippedAvatar, 
      frames: player.frames, equippedFrame: player.equippedFrame, 
      banners: player.banners, equippedBanner: player.equippedBanner, 
      badges: player.badges, lastDaily: player.lastDaily, 
      favorites: player.favorites, claimedCodes: player.claimedCodes // تم إضافة الحفظ
  }); } catch(e) {}
}

// --- حل مشكلة بطء تسجيل الدخول ---
async function handleEmailLogin() {
  const email = document.getElementById('auth-email-input').value.trim();
  const pass = document.getElementById('auth-pass-input').value;
  if(!email || !pass) return showToast("أدخل البيانات", "⚠️", "error");
  
  const btn = document.getElementById('auth-main-btn');
  const origText = btn.innerText;
  btn.innerText = "جاري الدخول ⏳...";
  btn.disabled = true;
  
  try { 
      const cred = await window.signInWithEmailAndPassword(window.firebaseAuth, email, pass); 
      await window.loadPlayerData(cred.user);
      window.updateUIForAuth();
      closeModal('modal-auth'); 
      showToast("تم تسجيل الدخول", "✅", "success"); 
  } catch (e) {
      try { 
          const cred = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, pass); 
          await window.loadPlayerData(cred.user);
          window.updateUIForAuth();
          closeModal('modal-auth'); 
          showToast("تم إنشاء حساب جديد بنجاح", "✅", "success"); 
      } catch(err) { 
          showToast("الرقم السري خاطئ أو البريد مستخدم", "❌", "error"); 
      }
  } finally {
      btn.innerText = origText;
      btn.disabled = false;
  }
}

async function handleLogout() { try { await window.signOut(window.firebaseAuth); window.location.reload(); } catch(e) {} }

// --- حل مشكلة النقر على المكافأة اليومية ---
function checkDailyReward() {
   if(screenHistory[screenHistory.length-1] !== 'home') return;
   const today = new Date().toDateString();
   const banner = document.getElementById('daily-reward-banner');
   if(player.uid && player.lastDaily !== today) { if(banner) banner.classList.remove('hidden'); }
   else { if(banner) banner.classList.add('hidden'); }
}

async function claimDailyReward() {
   if(!player.uid) return showToast("سجل دخولك أولاً", "🔒", "error");
   const today = new Date().toDateString();
   if(player.lastDaily === today) return showToast("لقد استلمت مكافأتك اليوم!", "✅", "info");
   
   const isGem = Math.random() > 0.8; 
   const amount = isGem ? (Math.floor(Math.random() * 6) + 5) : (Math.floor(Math.random() * 21) + 10);
   if(isGem) player.gems += amount; else player.shards += amount;
   
   player.lastDaily = today; 
   await savePlayer(); updateUI();
   document.getElementById('daily-reward-banner').classList.add('hidden');
   playSFX('win'); 
   showToast(`استلمت مكافأة يومية: ${amount} ${isGem ? '💎' : '🧩'}`, "🎉", "success");
   confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

// --- نظام الألعاب والعوالم (بدون تغيير) ---
function playCurrentLevel() {
  const lvl = dbLevels.find(l => l.num == player.currentLevel);
  if(!lvl) return showToast("أنت أسطورة! أنهيت كل المراحل الحالية.", "🚀", "info");
  loadLevel(lvl); navigateTo('game');
}
function loadLevel(lvl) {
  currentLevelObj = lvl; document.getElementById('game-level-num').innerText = `مرحلة ${lvl.num}`; document.getElementById('game-question-text').innerText = lvl.q;
  currentSlots = Array(lvl.a.length).fill(null);
  const arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'; availableLetters = lvl.a.split('');
  while(availableLetters.length < 14) availableLetters.push(arabicLetters[Math.floor(Math.random() * arabicLetters.length)]);
  availableLetters = availableLetters.sort(() => Math.random() - 0.5).map((char, index) => ({ id: index, char: char, used: false }));
  renderGameUI();
}
function renderGameUI() {
  const slotsContainer = document.getElementById('answer-slots-container'); slotsContainer.innerHTML = '';
  currentSlots.forEach((slot, index) => { slotsContainer.innerHTML += `<div onclick="removeLetterFromSlot(${index})" class="letter-slot shadow-inner">${slot ? slot.char : ''}</div>`; });
  const poolContainer = document.getElementById('letters-pool-container'); poolContainer.innerHTML = '';
  availableLetters.forEach(l => { poolContainer.innerHTML += `<button onclick="addLetterToSlot(${l.id})" class="letter-btn ${l.used ? 'hidden-letter' : ''}">${l.char}</button>`; });
  
  const isFull = currentSlots.every(s => s !== null);
  const currentWord = currentSlots.map(s => s ? s.char : '').join('');
  if (isFull && currentWord === currentLevelObj.a) { playSFX('win'); showToast(`فزت! +${currentLevelObj.shards} شظية`, "🎉", "success"); player.currentLevel++; savePlayer(); setTimeout(playCurrentLevel, 1500); }
  else if (isFull) { playSFX('wrong'); }
}
function addLetterToSlot(letterId) { playSFX('click'); const emptyIndex = currentSlots.findIndex(s => s === null); if (emptyIndex !== -1) { const l = availableLetters.find(x => x.id === letterId); if(l && !l.used) { l.used = true; currentSlots[emptyIndex] = l; renderGameUI(); } } }
function removeLetterFromSlot(slotIndex) { const slot = currentSlots[slotIndex]; if (slot) { playSFX('click'); const l = availableLetters.find(x => x.id === slot.id); if(l) l.used = false; currentSlots[slotIndex] = null; renderGameUI(); } }
function removeLastLetter() { for(let i=currentSlots.length-1; i>=0; i--){ if(currentSlots[i] !== null) { removeLetterFromSlot(i); break; } } }
function shuffleLetters() { playSFX('click'); availableLetters.sort(() => Math.random() - 0.5); renderGameUI(); }

// --- حل مشكلة استرداد الأكواد للمستخدمين ---
async function claimPromoCode() {
   const codeInput = document.getElementById('redeem-code-input').value.trim().toUpperCase();
   if(!codeInput) return showToast("أدخل الكود", "⚠️", "error"); 
   if(!player.uid) return showToast("يجب تسجيل الدخول", "🔒", "error");
   try {
      const codeRef = window.doc(window.firebaseDb, window.DB_PATH + 'codes', codeInput); 
      const snap = await window.getDoc(codeRef);
      if(!snap.exists() || !snap.data().active) return showToast("كود غير صالح أو منتهي", "❌", "error");
      
      // هنا حل المشكلة: التأكد من الملف الشخصي بدلا من مجلدات الداتا بيز الفرعية التي تحتاج تصاريح
      if(player.claimedCodes && player.claimedCodes.includes(codeInput)) {
          return showToast("لقد استخدمت هذا الكود مسبقاً", "⚠️", "error");
      }
      
      const data = snap.data(); let msg = "حصلت على: ";
      if(data.gems > 0) { player.gems += data.gems; msg += `${data.gems}💎 `; }
      if(data.shards > 0) { player.shards += data.shards; msg += `${data.shards}🧩 `; }
      if(data.itemType && data.itemValue && data.itemType !== 'none') { 
         if(data.itemType === 'title' && !player.titles.includes(data.itemValue)) { player.titles.push(data.itemValue); msg += `لقب (${data.itemValue}) `; }
         if(data.itemType === 'frame' && !player.frames.includes(data.itemValue)) { player.frames.push(data.itemValue); msg += `إطار (${data.itemValue}) `; }
      }
      
      if(!player.claimedCodes) player.claimedCodes = [];
      player.claimedCodes.push(codeInput); // إضافة الكود للمستخدم
      await savePlayer(); updateUI();
      
      closeModal('modal-redeem'); 
      showToast(msg, "🎉", "success"); 
      document.getElementById('redeem-code-input').value = ''; 
      confetti(); playSFX('win');
   } catch(e) { showToast("حدث خطأ في استرداد الكود", "❌", "error"); }
}

// ================= لوحة تحكم الإدارة (المالك) =================

function switchAdminTab(tab) {
   document.querySelectorAll('[id^="admin-sec-"]').forEach(el => el.classList.add('hidden'));
   document.querySelectorAll('[id^="admintab-"]').forEach(el => el.className = el.id.includes('danger') ? "py-2 px-1 rounded-xl text-red-400 text-xs" : "py-2 px-1 rounded-xl text-gray-400 text-xs");
   document.getElementById(`admin-sec-${tab}`).classList.remove('hidden');
   const btn = document.getElementById(`admintab-${tab}`);
   if(tab === 'danger') btn.className = "py-2 px-1 rounded-xl bg-red-600 text-white font-black text-xs"; else btn.className = "py-2 px-1 rounded-xl bg-brand-500 text-white font-black text-xs";
}

// --- حل مشكلة إضافة العوالم ---
async function adminSaveWorld() {
    const id = document.getElementById('adm-world-id').value.trim();
    const name = document.getElementById('adm-world-name').value.trim();
    const icon = document.getElementById('adm-world-icon').value.trim() || '🗺️';
    const start = parseInt(document.getElementById('adm-world-start').value);
    const end = parseInt(document.getElementById('adm-world-end').value);

    if(!id || !name || !start || !end) return showToast("الرجاء إكمال بيانات العالم", "⚠️", "error");
    
    try {
        await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'worlds', id), { 
            id: id, name: name, icon: icon, start: start, end: end, finishersCount: 0 
        });
        showToast("تم حفظ العالم بنجاح!", "🌍", "success");
        // تفريغ الحقول
        document.getElementById('adm-world-id').value = '';
        document.getElementById('adm-world-name').value = '';
        document.getElementById('adm-world-start').value = '';
        document.getElementById('adm-world-end').value = '';
    } catch(e) { showToast("فشل حفظ العالم", "❌", "error"); }
}

async function adminSaveCrate() {
    const name = document.getElementById('adm-crate-name').value.trim(), icon = document.getElementById('adm-crate-icon').value.trim() || '📦', price = parseInt(document.getElementById('adm-crate-price').value), currency = document.getElementById('adm-crate-currency').value, minLevel = parseInt(document.getElementById('adm-crate-minlevel').value) || 1;
    if(!name || !price) return showToast("ادخل اسم البكج والسعر", "⚠️", "error");
    
    const drops = [];
    for(let i=1; i<=3; i++) {
        let type = document.getElementById(`adm-crate-type${i}`).value, val = document.getElementById(`adm-crate-val${i}`).value.trim(), chance = parseInt(document.getElementById(`adm-crate-chance${i}`).value) || 0;
        if(val && chance > 0) { drops.push({ type: type, amount: (type === 'shards' || type === 'gems') ? parseInt(val) : null, value: (type === 'title' || type === 'frame') ? val : null, chance: chance }); }
    }
    if(drops.length === 0) return showToast("اضف جائزة واحدة على الأقل في الصندوق", "⚠️", "error");
    
    const id = 'crate_' + Date.now();
    try { 
        await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'crates', id), { id, name, icon, price, currency, minLevel, drops }); 
        showToast("تم إنشاء البكج بنجاح", "📦", "success"); 
    } catch(e) { showToast("خطأ", "❌", "error"); }
}

async function adminCreateCode() {
   const code = document.getElementById('adm-code-name').value.trim().toUpperCase(), gems = parseInt(document.getElementById('adm-code-gems').value) || 0, shards = parseInt(document.getElementById('adm-code-shards').value) || 0, itemType = document.getElementById('adm-code-type').value, itemValue = document.getElementById('adm-code-item').value.trim();
   if(!code) return showToast("أدخل الرمز", "⚠️", "error"); 
   if(itemType !== 'none' && !itemValue) return showToast("أدخل اسم الهدية", "⚠️", "error");
   try { 
       await window.setDoc(window.doc(window.firebaseDb, window.DB_PATH + 'codes', code), { code, gems, shards, itemType, itemValue, active: true }); 
       showToast("تم إنشاء الكود وسيعمل مع الجميع!", "🎁", "success"); 
       document.getElementById('adm-code-name').value = '';
   } catch(e) { showToast("خطأ", "❌", "error"); }
}
