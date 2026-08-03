// ==================== بيانات اللعبة وقواعد البيانات المشابهة ====================

// قاعدة بيانات اللاعبين الآخرين للبحث والمفضلة
const mockPlayersDatabase = [
  {
    id: "p_101",
    name: "الملك 99",
    coins: 4500,
    gems: 120,
    completedStages: 15,
    favoritesCount: 42,
    equipped: {
      avatar: "av_vip",
      frame: "fr_gold",
      banner: "bn_fire",
      title: "👑 ملك اللعبة"
    }
  },
  {
    id: "p_102",
    name: "سارة الأسطورة",
    coins: 2100,
    gems: 45,
    completedStages: 9,
    favoritesCount: 18,
    equipped: {
      avatar: "av_girl",
      frame: "fr_neon",
      banner: "bn_green",
      title: "💡 محترف"
    }
  },
  {
    id: "p_103",
    name: "خالد المحارب",
    coins: 890,
    gems: 12,
    completedStages: 4,
    favoritesCount: 5,
    equipped: {
      avatar: "av_warrior",
      frame: "fr_fire",
      banner: "bn_blue",
      title: "🌿 المستكشف"
    }
  },
  {
    id: "p_104",
    name: "أحمد الجيمر",
    coins: 3400,
    gems: 80,
    completedStages: 12,
    favoritesCount: 29,
    equipped: {
      avatar: "av_gamer",
      frame: "fr_gold",
      banner: "bn_purple",
      title: "🔥 أسطورة الألغاز"
    }
  }
];

// الكتالوج الثابت للمتجر
const storeCatalogData = {
  avatars: [
    { id: 'av_1', name: 'الافتراضي', coins: 0, gems: 0, img: 'https://via.placeholder.com/80/2563eb/ffffff?text=User' },
    { id: 'av_vip', name: 'افتار VIP', coins: 0, gems: 20, img: 'https://via.placeholder.com/80/dc2626/ffffff?text=VIP' },
    { id: 'av_girl', name: 'افتار 2', coins: 300, gems: 0, img: 'https://via.placeholder.com/80/16a34a/ffffff?text=Player2' },
    { id: 'av_warrior', name: 'المحارب', coins: 500, gems: 5, img: 'https://via.placeholder.com/80/f59e0b/ffffff?text=Warrior' },
    { id: 'av_gamer', name: 'الجيمر', coins: 800, gems: 10, img: 'https://via.placeholder.com/80/9333ea/ffffff?text=Gamer' }
  ],
  frames: [
    { id: 'fr_0', name: 'بدون إطار', coins: 0, gems: 0, class: '' },
    { id: 'fr_gold', name: 'إطار ذهبي', coins: 400, gems: 0, class: 'frame-gold' },
    { id: 'fr_fire', name: 'إطار ناري', coins: 0, gems: 15, class: 'frame-fire' },
    { id: 'fr_neon', name: 'إطار نيون', coins: 600, gems: 10, class: 'frame-neon' }
  ],
  banners: [
    { id: 'bn_blue', name: 'بنر أزرق', coins: 0, gems: 0, bg: '#2563eb' },
    { id: 'bn_green', name: 'بنر أخضر', coins: 200, gems: 0, bg: '#16a34a' },
    { id: 'bn_fire', name: 'بنر ناري', coins: 0, gems: 12, bg: 'linear-gradient(to right, #ef4444, #f59e0b)' },
    { id: 'bn_purple', name: 'بنر ملكي', coins: 500, gems: 5, bg: 'linear-gradient(to right, #8b5cf6, #ec4899)' }
  ],
  titles: [
    { id: 'tt_1', name: 'مبتدئ', coins: 0, gems: 0, text: 'مبتدئ' },
    { id: 'tt_2', name: 'محترف', coins: 300, gems: 0, text: '💡 محترف' },
    { id: 'tt_3', name: '👑 ملك اللعبة', coins: 0, gems: 25, text: '👑 ملك اللعبة' },
    { id: 'tt_4', name: '🔥 أسطورة الألغاز', coins: 1000, gems: 15, text: '🔥 أسطورة الألغاز' }
  ]
};

// البيانات الأولية للتطبيق
const defaultInitialState = {
  user: {
    name: "لاعب جديد",
    coins: 500,
    gems: 20,
    completedStagesCount: 0,
    favoritePlayers: ["p_101"], // يحتوي على المعرفات للاعبين المفضلين
    inventory: {
      avatars: ['av_1'],
      frames: ['fr_0'],
      banners: ['bn_blue'],
      titles: ['tt_1']
    },
    equipped: {
      avatar: 'av_1',
      frame: 'fr_0',
      banner: 'bn_blue',
      title: 'tt_1'
    }
  },
  announcements: [
    {
      id: 'ann_101',
      title: 'تحديث v2.0 الرئيسي!',
      text: 'تمت إضافة ميزة البحث عن بروفايلات اللاعبين والمفضلة الخاصة بالأشخاص ولوحة التحكم الجديدة للمالك!',
      date: '2026-08-03'
    }
  ],
  worlds: [
    {
      id: 'w_1',
      name: 'العالم الأول: بداية الألغاز',
      stages: [
        { id: 's_1', name: 'المرحلة 1: اللغز الأولي', coins: 100, gems: 2, rewardTitle: '' },
        { id: 's_2', name: 'المرحلة 2: لغز الذكاء', coins: 200, gems: 5, rewardTitle: '🌿 المستكشف' }
      ]
    }
  ]
};

let gameState = null;
let currentStoreCategory = 'avatars';
let currentInventoryCategory = 'avatars';

// ==================== البدء والتحميل ====================

window.onload = () => {
  loadSavedGameState();
  renderApp();
};

function loadSavedGameState() {
  const saved = localStorage.getItem('lghzak_full_state');
  if (saved) {
    gameState = JSON.parse(saved);
    if (!gameState.user.favoritePlayers) gameState.user.favoritePlayers = [];
  } else {
    gameState = JSON.parse(JSON.stringify(defaultInitialState));
    saveGameState();
  }
}

function saveGameState() {
  localStorage.setItem('lghzak_full_state', JSON.stringify(gameState));
}

function renderApp() {
  updateHeader();
  renderAnnouncements();
  renderWorlds();
  searchPlayers(); // تحديث نتائج البحث
  renderFavoritePlayers();
  renderStore(currentStoreCategory);
  renderMyProfile();
  renderInventory(currentInventoryCategory);
  renderOwnerPanel();
}

// ==================== تحديث الهيدر والإعلانات ====================

function updateHeader() {
  document.getElementById('user-coins').innerText = gameState.user.coins;
  document.getElementById('user-gems').innerText = gameState.user.gems;
  document.getElementById('header-username').innerText = gameState.user.name;

  const av = storeCatalogData.avatars.find(a => a.id === gameState.user.equipped.avatar);
  if (av) document.getElementById('header-avatar').src = av.img;

  const tt = storeCatalogData.titles.find(t => t.id === gameState.user.equipped.title);
  document.getElementById('header-user-title').innerText = tt ? tt.text : gameState.user.equipped.title;

  // تعبئة حقول المالك بأحدث البيانات
  document.getElementById('owner-input-username').value = gameState.user.name;
  document.getElementById('owner-input-coins').value = gameState.user.coins;
  document.getElementById('owner-input-gems').value = gameState.user.gems;
}

function renderAnnouncements() {
  const banner = document.getElementById('announcement-banner');
  if (gameState.announcements && gameState.announcements.length > 0) {
    const latest = gameState.announcements[0];
    document.getElementById('ann-title').innerText = latest.title;
    document.getElementById('ann-text').innerText = latest.text;
    document.getElementById('ann-date').innerText = latest.date || '';
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

// التنقل بين الأقسام الرئيسية
function switchMainTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));

  event.target.classList.add('active');
  document.getElementById('tab-' + tabId).classList.remove('hidden');
}

// ==================== العوالم والمراحل ====================

function renderWorlds() {
  const container = document.getElementById('worlds-list-container');
  container.innerHTML = '';

  gameState.worlds.forEach(w => {
    const worldBox = document.createElement('div');
    worldBox.className = 'world-card';

    let stagesHTML = '';
    w.stages.forEach(s => {
      stagesHTML += `
        <div class="stage-row-item">
          <div>
            <strong>${s.name}</strong>
            <div style="font-size:0.75rem; color:#16a34a;">الجوائز: 🪙${s.coins} | 💎${s.gems} ${s.rewardTitle ? '| لقب: ' + s.rewardTitle : ''}</div>
          </div>
          <button class="btn btn-success" onclick="playGameStage('${w.id}', '${s.id}')">لعب Stage</button>
        </div>
      `;
    });

    worldBox.innerHTML = `<h4>${w.name}</h4><div>${stagesHTML || '<p style="font-size:0.8rem;">لا توجد مراحل حالياً</p>'}</div>`;
    container.appendChild(worldBox);
  });
}

function playGameStage(worldId, stageId) {
  const w = gameState.worlds.find(item => item.id === worldId);
  const s = w.stages.find(item => item.id === stageId);

  gameState.user.coins += Number(s.coins || 0);
  gameState.user.gems += Number(s.gems || 0);
  gameState.user.completedStagesCount = (gameState.user.completedStagesCount || 0) + 1;

  let msg = `🎉 مبروك! أتممت ${s.name}\nحصلت على: ${s.coins} كوينز و ${s.gems} جواهر.`;

  if (s.rewardTitle && !gameState.user.inventory.titles.includes(s.rewardTitle)) {
    gameState.user.inventory.titles.push(s.rewardTitle);
    msg += `\n🎁 حصلت أيضاً على لقب جديد: [${s.rewardTitle}]!`;
  }

  alert(msg);
  saveGameState();
  renderApp();
}

// ==================== البحث عن بروفايلات اللاعبين والمفضلة ====================

// البحث الفوري عن اللاعبين
function searchPlayers() {
  const query = document.getElementById('player-search-input').value.toLowerCase().trim();
  const container = document.getElementById('players-search-results');
  container.innerHTML = '';

  const filtered = mockPlayersDatabase.filter(p => 
    p.name.toLowerCase().includes(query) || p.equipped.title.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; margin-top:15px;">لم يتم العثور على أي لاعب بهذا الاسم.</p>';
    return;
  }

  filtered.forEach(player => {
    container.appendChild(createPlayerCardElement(player));
  });
}

// التبديل في المفضلة لبروفايل شخص
function toggleFavoritePlayer(playerId) {
  const idx = gameState.user.favoritePlayers.indexOf(playerId);
  if (idx > -1) {
    gameState.user.favoritePlayers.splice(idx, 1);
  } else {
    gameState.user.favoritePlayers.push(playerId);
  }

  saveGameState();
  renderApp();
}

// عرض البروفايلات المفضلة
function renderFavoritePlayers() {
  const container = document.getElementById('favorite-players-list');
  container.innerHTML = '';

  if (gameState.user.favoritePlayers.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; margin-top:20px;">لم تقم بإضافة أي بروفايل للمفضلة حتى الآن.<br>ابحث عن اللاعبين واضغط على (❤️) لإضافتهم هنا!</p>';
    return;
  }

  gameState.user.favoritePlayers.forEach(pId => {
    const player = mockPlayersDatabase.find(p => p.id === pId);
    if (player) {
      container.appendChild(createPlayerCardElement(player));
    }
  });
}

// بناء مكون بطاقة بروفايل اللاعب
function createPlayerCardElement(player) {
  const isFav = gameState.user.favoritePlayers.includes(player.id);

  const card = document.createElement('div');
  card.className = 'player-profile-card';

  const avatarObj = storeCatalogData.avatars.find(a => a.id === player.equipped.avatar);
  const avatarImg = avatarObj ? avatarObj.img : 'https://via.placeholder.com/80';

  const frameObj = storeCatalogData.frames.find(f => f.id === player.equipped.frame);
  const frameClass = frameObj ? frameObj.class : '';

  const bannerObj = storeCatalogData.banners.find(b => b.id === player.equipped.banner);
  const bannerBg = bannerObj ? bannerObj.bg : '#2563eb';

  card.innerHTML = `
    <button class="fav-profile-btn" onclick="toggleFavoritePlayer('${player.id}')">
      ${isFav ? '❤️' : '🤍'}
    </button>
    <div class="card-banner-bg" style="background: ${bannerBg};">
      <div class="avatar-frame-wrapper">
        <img src="${avatarImg}" alt="${player.name}" class="card-avatar-img">
        <div class="card-frame-overlay ${frameClass}"></div>
      </div>
    </div>
    <div class="card-info-body">
      <h3>${player.name}</h3>
      <span class="badge-title">${player.equipped.title}</span>
      <div class="profile-stats-row">
        <div>🪙 الكوينز: <strong>${player.coins}</strong></div>
        <div>💎 الجواهر: <strong>${player.gems}</strong></div>
        <div>🏆 مراحل: <strong>${player.completedStages}</strong></div>
      </div>
    </div>
  `;

  return card;
}

// ==================== المتجر والمقتنيات ====================

function switchStoreTab(cat) {
  document.querySelectorAll('#tab-store .sub-nav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  currentStoreCategory = cat;
  renderStore(cat);
}

function renderStore(cat) {
  const grid = document.getElementById('store-catalog-grid');
  grid.innerHTML = '';

  const items = storeCatalogData[cat];

  items.forEach(item => {
    const isOwned = gameState.user.inventory[cat].includes(item.id);
    const box = document.createElement('div');
    box.className = 'catalog-item';

    let preview = '';
    if (cat === 'avatars') preview = `<img src="${item.img}" style="width:60px; height:60px; border-radius:50%;">`;
    if (cat === 'banners') preview = `<div style="width:100%; height:35px; background:${item.bg}; border-radius:6px;"></div>`;
    if (cat === 'frames') preview = `<div class="${item.class}" style="padding:4px; font-size:0.8rem;">معاينة الإطار</div>`;
    if (cat === 'titles') preview = `<span class="badge-title">${item.text}</span>`;

    let priceText = item.coins > 0 ? `${item.coins} 🪙` : `${item.gems} 💎`;
    if (item.coins === 0 && item.gems === 0) priceText = "مجاني";

    box.innerHTML = `
      <strong>${item.name}</strong>
      ${preview}
      <span style="font-size:0.8rem; font-weight:bold; color:#16a34a;">${priceText}</span>
      <button class="btn btn-primary" style="width:100%;" ${isOwned ? 'disabled' : ''} onclick="buyStoreItem('${cat}', '${item.id}')">
        ${isOwned ? 'مملوك' : 'شراء'}
      </button>
    `;
    grid.appendChild(box);
  });
}

function buyStoreItem(cat, itemId) {
  const item = storeCatalogData[cat].find(i => i.id === itemId);

  if (item.coins > 0 && gameState.user.coins < item.coins) return alert("الكوينز غير كافية!");
  if (item.gems > 0 && gameState.user.gems < item.gems) return alert("الجواهر غير كافية!");

  gameState.user.coins -= item.coins || 0;
  gameState.user.gems -= item.gems || 0;
  gameState.user.inventory[cat].push(itemId);

  saveGameState();
  renderApp();
}

// ==================== البروفايل الشخصي ====================

function renderMyProfile() {
  const eq = gameState.user.equipped;

  document.getElementById('my-card-username').innerText = gameState.user.name;
  document.getElementById('my-stats-stages').innerText = gameState.user.completedStagesCount || 0;
  document.getElementById('my-stats-favs').innerText = gameState.user.favoritePlayers.length || 0;

  const av = storeCatalogData.avatars.find(a => a.id === eq.avatar);
  if (av) document.getElementById('my-card-avatar').src = av.img;

  const bn = storeCatalogData.banners.find(b => b.id === eq.banner);
  if (bn) document.getElementById('my-card-banner').style.background = bn.bg;

  const fr = storeCatalogData.frames.find(f => f.id === eq.frame);
  document.getElementById('my-card-frame').className = 'card-frame-overlay ' + (fr ? fr.class : '');

  const tt = storeCatalogData.titles.find(t => t.id === eq.title);
  document.getElementById('my-card-title').innerText = tt ? tt.text : eq.title;
}

function switchInventoryTab(cat) {
  document.querySelectorAll('#tab-my-profile .sub-nav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  currentInventoryCategory = cat;
  renderInventory(cat);
}

function renderInventory(cat) {
  const grid = document.getElementById('my-inventory-grid');
  grid.innerHTML = '';

  const singleKey = cat.slice(0, -1);
  const owned = gameState.user.inventory[cat] || [];

  owned.forEach(id => {
    const itemObj = storeCatalogData[cat]?.find(i => i.id === id);
    const displayName = itemObj ? itemObj.name : id;
    const isEquipped = gameState.user.equipped[singleKey] === id;

    const box = document.createElement('div');
    box.className = 'catalog-item';
    box.innerHTML = `
      <strong>${displayName}</strong>
      <button class="btn ${isEquipped ? 'btn-danger-sm' : 'btn-primary'}" style="width:100%; margin-top:5px;" onclick="equipMyItem('${singleKey}', '${id}')">
        ${isEquipped ? 'مُجهّز الآن' : 'تجهيز'}
      </button>
    `;
    grid.appendChild(box);
  });
}

function equipMyItem(typeKey, id) {
  gameState.user.equipped[typeKey] = id;
  saveGameState();
  renderApp();
}

// ==================== لوحة تحكم المالك الشاملة (OWNER CONTROL PANEL) ====================

// 1. حفظ تعديلات حساب اللاعب والعملات بواسطة المالك
function ownerSaveUserData() {
  const newName = document.getElementById('owner-input-username').value.trim();
  const newCoins = document.getElementById('owner-input-coins').value;
  const newGems = document.getElementById('owner-input-gems').value;

  if (newName) gameState.user.name = newName;
  if (newCoins !== '') gameState.user.coins = Number(newCoins);
  if (newGems !== '') gameState.user.gems = Number(newGems);

  saveGameState();
  renderApp();
  alert("👑 تم حفظ كافة تعديلات المالك بنجاح!");
}

// 2. نشر تحديثات وإعلانات جديدة للعبة
function ownerPublishAnnouncement() {
  const title = document.getElementById('owner-update-title').value.trim();
  const text = document.getElementById('owner-update-text').value.trim();

  if (!title || !text) return alert("يرجى ملء عنوان التحديث والتفاصيل!");

  const newAnn = {
    id: 'ann_' + Date.now(),
    title: title,
    text: text,
    date: new Date().toISOString().split('T')[0]
  };

  gameState.announcements.unshift(newAnn);

  document.getElementById('owner-update-title').value = '';
  document.getElementById('owner-update-text').value = '';

  saveGameState();
  renderApp();
  alert("📢 تم نشر التحديث بنجاح وسيظهر للجميع!");
}

function ownerDeleteAnnouncement(annId) {
  gameState.announcements = gameState.announcements.filter(a => a.id !== annId);
  saveGameState();
  renderApp();
}

// 3. إضافة عالم جديد
function ownerAddWorld() {
  const name = document.getElementById('owner-new-world-name').value.trim();
  if (!name) return alert("اكتب اسم العالم!");

  gameState.worlds.push({ id: 'w_' + Date.now(), name: name, stages: [] });
  document.getElementById('owner-new-world-name').value = '';
  saveGameState();
  renderApp();
}

// 4. إضافة مرحلة جديدة
function ownerAddStage() {
  const worldId = document.getElementById('owner-select-world').value;
  const stageName = document.getElementById('owner-new-stage-name').value.trim();
  const coins = document.getElementById('owner-stage-coins').value;
  const gems = document.getElementById('owner-stage-gems').value;
  const rewardTitle = document.getElementById('owner-stage-title-reward').value.trim();

  if (!worldId || !stageName) return alert("اختر العالم واكتب اسم المرحلة!");

  const targetWorld = gameState.worlds.find(w => w.id === worldId);
  targetWorld.stages.push({
    id: 's_' + Date.now(),
    name: stageName,
    coins: Number(coins) || 0,
    gems: Number(gems) || 0,
    rewardTitle: rewardTitle
  });

  document.getElementById('owner-new-stage-name').value = '';
  saveGameState();
  renderApp();
}

// 5. إدارة وحذف العوالم والمراحل
function renderOwnerPanel() {
  // القائمة المنسدلة لاختيار العالم
  const select = document.getElementById('owner-select-world');
  select.innerHTML = '';
  gameState.worlds.forEach(w => {
    select.innerHTML += `<option value="${w.id}">${w.name}</option>`;
  });

  // قائمة التحديثات المنشورة
  const annList = document.getElementById('owner-announcements-list');
  annList.innerHTML = '';
  gameState.announcements.forEach(a => {
    annList.innerHTML += `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; padding:6px 10px; border-radius:6px; margin-top:6px; font-size:0.8rem;">
        <span><strong>${a.title}</strong> (${a.date})</span>
        <button class="btn btn-danger-sm" onclick="ownerDeleteAnnouncement('${a.id}')">حذف</button>
      </div>
    `;
  });

  // إدارة العوالم والمراحل
  const manageList = document.getElementById('owner-manage-worlds-list');
  manageList.innerHTML = '';

  gameState.worlds.forEach(w => {
    let stagesHTML = '';
    w.stages.forEach(s => {
      stagesHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px; background:#ffffff; padding:6px; border-radius:6px; font-size:0.8rem;">
          <span>${s.name} (🪙${s.coins} | 💎${s.gems})</span>
          <button class="btn btn-danger-sm" onclick="ownerDeleteStage('${w.id}', '${s.id}')">حذف المرحلة</button>
        </div>
      `;
    });

    const box = document.createElement('div');
    box.style.cssText = "border:1px solid #cbd5e1; padding:10px; margin-top:8px; border-radius:8px; background:#f8fafc;";
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #cbd5e1; padding-bottom:6px;">
        <strong>${w.name}</strong>
        <button class="btn btn-danger-sm" onclick="ownerDeleteWorld('${w.id}')">حذف العالم</button>
      </div>
      ${stagesHTML || '<p style="font-size:0.75rem; color:#64748b; margin-top:4px;">لا توجد مراحل في هذا العالم</p>'}
    `;
    manageList.appendChild(box);
  });
}

function ownerDeleteWorld(worldId) {
  if (confirm("هل أنت متأكد من حذف هذا العالم بالكامل؟")) {
    gameState.worlds = gameState.worlds.filter(w => w.id !== worldId);
    saveGameState();
    renderApp();
  }
}

function ownerDeleteStage(worldId, stageId) {
  const w = gameState.worlds.find(item => item.id === worldId);
  w.stages = w.stages.filter(s => s.id !== stageId);
  saveGameState();
  renderApp();
}
