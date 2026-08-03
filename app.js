// --- 1. حالة اللعبة والبيانات المحفوظة ---
let gameState = {
  user: {
    coins: 1000,
    gems: 50,
    inventory: {
      avatars: ['av_1'],
      frames: ['fr_0'],
      banners: ['bn_1'],
      titles: ['tt_0']
    },
    equipped: {
      avatar: 'av_1',
      frame: 'fr_0',
      banner: 'bn_1',
      title: 'tt_0'
    }
  },
  // قائمة العوالم والمراحل (يمكن للمالك التعديل عليها بالكامل)
  worlds: [
    {
      id: 'world_1',
      name: '🌴 عالم البداية',
      stages: [
        { id: 'st_1', name: 'المرحلة 1', coins: 100, gems: 5, title: '' },
        { id: 'st_2', name: 'المرحلة 2', coins: 200, gems: 10, title: '🏆 المغامر' }
      ]
    }
  ],
  // عناصر المتجر
  store: {
    avatars: [
      { id: 'av_1', name: 'الافتراضي', priceCoins: 0, priceGems: 0, img: 'https://via.placeholder.com/80/444/fff?text=User' },
      { id: 'av_2', name: 'المحارب', priceCoins: 500, priceGems: 0, img: 'https://via.placeholder.com/80/e74c3c/fff?text=Warrior' },
      { id: 'av_3', name: 'التنين', priceCoins: 0, priceGems: 20, img: 'https://via.placeholder.com/80/ffd700/000?text=Dragon' }
    ],
    frames: [
      { id: 'fr_0', name: 'بدون إطار', priceCoins: 0, priceGems: 0, class: '' },
      { id: 'fr_gold', name: 'إطار ذهبي', priceCoins: 800, priceGems: 0, class: 'frame-gold' },
      { id: 'fr_neon', name: 'إطار نيوان', priceCoins: 0, priceGems: 30, class: 'frame-neon' }
    ],
    banners: [
      { id: 'bn_1', name: 'افتراضي', priceCoins: 0, priceGems: 0, bg: '#333340' },
      { id: 'bn_fire', name: 'بنر الناري', priceCoins: 400, priceGems: 0, bg: 'linear-gradient(45deg, #e17055, #d63031)' }
    ],
    titles: [
      { id: 'tt_0', name: 'مبتدئ', priceCoins: 0, priceGems: 0, text: 'مبتدئ' },
      { id: 'tt_king', name: 'الملك', priceCoins: 1000, priceGems: 50, text: '👑 الملك' }
    ]
  }
};

// --- 2. التشغيل والتهيأة ---
window.onload = () => {
  loadGameData();
  setupNavigation();
  setupAuth();
  setupAdminPanel();
  renderAll();
};

function renderAll() {
  updateResourceUI();
  renderWorlds();
  renderStore('avatars');
  renderProfile();
  renderAdminManager();
}

// --- 3. التنقل بين الشاشات ---
function setupNavigation() {
  const navs = [
    { btn: 'nav-worlds', view: 'view-worlds' },
    { btn: 'nav-store', view: 'view-store' },
    { btn: 'nav-profile', view: 'view-profile' },
    { btn: 'nav-admin', view: 'view-admin' }
  ];

  navs.forEach(item => {
    document.getElementById(item.btn).onclick = () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
      
      document.getElementById(item.btn).classList.add('active');
      document.getElementById(item.view).classList.remove('hidden');
    };
  });
}

// --- 4. تسجيل الدخول عبر Google/Gmail ---
function setupAuth() {
  document.getElementById('gmail-login-btn').onclick = () => {
    // محاكاة تسجيل الدخول أو إمكانية استخدام Firebase Auth
    document.getElementById('logged-out-view').classList.add('hidden');
    document.getElementById('logged-in-view').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = "أهلاً، المالك/اللاعب 👋";
    document.getElementById('prof-name').innerText = "المالك المسجل";
  };

  document.getElementById('logout-btn').onclick = () => {
    document.getElementById('logged-out-view').classList.remove('hidden');
    document.getElementById('logged-in-view').classList.add('hidden');
    document.getElementById('prof-name').innerText = "لاعب تجريبي";
  };
}

// --- 5. نظام العوالم والمراحل واللعب (كسب الجوائز) ---
function renderWorlds() {
  const container = document.getElementById('worlds-list-container');
  container.innerHTML = '';

  gameState.worlds.forEach(world => {
    const worldBox = document.createElement('div');
    worldBox.className = 'world-block';
    
    let stagesHTML = '';
    world.stages.forEach(st => {
      let rewardsText = [];
      if(st.coins > 0) rewardsText.push(`${st.coins} 🪙`);
      if(st.gems > 0) rewardsText.push(`${st.gems} 💎`);
      if(st.title) rewardsText.push(`لقب: ${st.title}`);

      stagesHTML += `
        <div class="stage-card">
          <div>
            <strong>${st.name}</strong><br>
            <span class="reward-tag">الجوائز: ${rewardsText.join(' | ')}</span>
          </div>
          <button class="btn-play" onclick="playStage('${world.id}', '${st.id}')">إكمال المرحلة ▶</button>
        </div>
      `;
    });

    worldBox.innerHTML = `
      <div class="world-header">
        <h3>${world.name}</h3>
      </div>
      <div class="stages-list">${stagesHTML || '<p>لا يوجد مراحل بعد.</p>'}</div>
    `;
    container.appendChild(worldBox);
  });
}

// لعب مرحلة وحصد الجوائز
window.playStage = (worldId, stageId) => {
  const world = gameState.worlds.find(w => w.id === worldId);
  const stage = world.stages.find(s => s.id === stageId);

  gameState.user.coins += Number(stage.coins);
  gameState.user.gems += Number(stage.gems);

  if (stage.title && !gameState.user.inventory.titles.includes(stage.title)) {
    gameState.user.inventory.titles.push(stage.title);
    alert(`🎉 تهانينا! أكملت ${stage.name} وحصلت على العملات والجواهر ولقب جديد: [${stage.title}]`);
  } else {
    alert(`🎉 تهانينا! أكملت ${stage.name} وحصلت على: ${stage.coins} عملة و ${stage.gems} جوهر!`);
  }

  saveGameData();
  renderAll();
};

// --- 6. لوحة تحكم المالك (إضافة وحذف عوالم ومراحل) ---
function setupAdminPanel() {
  updateAdminWorldSelect();

  // إضافة عالم
  document.getElementById('btn-add-world').onclick = () => {
    const name = document.getElementById('admin-new-world-name').value.trim();
    if (!name) return alert("اكتب اسم العالم!");

    const newWorld = {
      id: 'world_' + Date.now(),
      name: name,
      stages: []
    };

    gameState.worlds.push(newWorld);
    document.getElementById('admin-new-world-name').value = '';
    saveGameData();
    renderAll();
    updateAdminWorldSelect();
  };

  // إضافة مرحلة
  document.getElementById('btn-add-stage').onclick = () => {
    const worldId = document.getElementById('admin-select-world').value;
    const stageName = document.getElementById('admin-stage-name').value.trim();
    const coins = document.getElementById('admin-reward-coins').value;
    const gems = document.getElementById('admin-reward-gems').value;
    const title = document.getElementById('admin-reward-title').value.trim();

    if (!worldId || !stageName) return alert("اختر العالم واكتب اسم المرحلة!");

    const world = gameState.worlds.find(w => w.id === worldId);
    world.stages.push({
      id: 'st_' + Date.now(),
      name: stageName,
      coins: Number(coins) || 0,
      gems: Number(gems) || 0,
      title: title
    });

    document.getElementById('admin-stage-name').value = '';
    saveGameData();
    renderAll();
  };
}

function updateAdminWorldSelect() {
  const select = document.getElementById('admin-select-world');
  select.innerHTML = '';
  gameState.worlds.forEach(w => {
    select.innerHTML += `<option value="${w.id}">${w.name}</option>`;
  });
}

function renderAdminManager() {
  const container = document.getElementById('admin-worlds-manager');
  container.innerHTML = '';

  gameState.worlds.forEach(w => {
    let stagesHTML = '';
    w.stages.forEach(s => {
      stagesHTML += `
        <div style="display:flex; justify-between; align-items:center; background:#18181c; padding:5px; margin-top:4px; border-radius:4px;">
          <span>${s.name} (🪙${s.coins} | 💎${s.gems})</span>
          <button class="btn-danger-sm" onclick="deleteStage('${w.id}', '${s.id}')">حذف Stage</button>
        </div>
      `;
    });

    const box = document.createElement('div');
    box.style.cssText = "background:#2c2c38; padding:8px; margin-bottom:8px; border-radius:6px;";
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>${w.name}</strong>
        <button class="btn-danger-sm" onclick="deleteWorld('${w.id}')">حذف العالم بالكامل</button>
      </div>
      <div>${stagesHTML}</div>
    `;
    container.appendChild(box);
  });
}

window.deleteWorld = (worldId) => {
  gameState.worlds = gameState.worlds.filter(w => w.id !== worldId);
  saveGameData();
  renderAll();
  updateAdminWorldSelect();
};

window.deleteStage = (worldId, stageId) => {
  const world = gameState.worlds.find(w => w.id === worldId);
  world.stages = world.stages.filter(s => s.id !== stageId);
  saveGameData();
  renderAll();
};

// --- 7. البروفايل والتجهيز ---
function renderProfile() {
  const eq = gameState.user.equipped;
  
  // تحديث البطاقة
  const av = gameState.store.avatars.find(a => a.id === eq.avatar);
  if(av) document.getElementById('prof-avatar').src = av.img;

  const bn = gameState.store.banners.find(b => b.id === eq.banner);
  if(bn) document.getElementById('prof-banner').style.background = bn.bg;

  const fr = gameState.store.frames.find(f => f.id === eq.frame);
  document.getElementById('prof-frame').className = 'frame-box ' + (fr ? fr.class : '');

  const tt = gameState.store.titles.find(t => t.id === eq.title);
  document.getElementById('prof-title').innerText = tt ? tt.text : eq.title;

  // عرض عناصر الحقيبة
  renderInventory('avatars');
}

document.querySelectorAll('.prof-tab').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.prof-tab').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderInventory(e.target.dataset.pcat);
  };
});

function renderInventory(category) {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';

  const owned = gameState.user.inventory[category] || [];
  const singleType = category.slice(0, -1);

  owned.forEach(itemId => {
    let item = gameState.store[category]?.find(i => i.id === itemId);
    let itemName = item ? item.name : itemId;
    const isEquipped = gameState.user.equipped[singleType] === itemId;

    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <h4>${itemName}</h4>
      <button class="btn-success" style="width:100%; margin-top:5px;" onclick="equipItem('${singleType}', '${itemId}')">
        ${isEquipped ? 'مُجهّز حالياً' : 'تجهيز'}
      </button>
    `;
    grid.appendChild(card);
  });
}

window.equipItem = (type, id) => {
  gameState.user.equipped[type] = id;
  saveGameData();
  renderProfile();
};

// --- 8. المتجر والشراء ---
document.querySelectorAll('.store-tab').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.store-tab').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderStore(e.target.dataset.cat);
  };
});

function renderStore(category) {
  const grid = document.getElementById('store-grid');
  grid.innerHTML = '';

  const items = gameState.store[category];
  items.forEach(item => {
    const isOwned = gameState.user.inventory[category].includes(item.id);
    const card = document.createElement('div');
    card.className = 'item-card';

    let priceText = item.priceCoins ? `${item.priceCoins} 🪙` : `${item.priceGems} 💎`;

    card.innerHTML = `
      <h4>${item.name}</h4>
      <p style="color:#ffd700; font-weight:bold;">${priceText}</p>
      <button class="btn-success" style="width:100%;" ${isOwned ? 'disabled style="background:#555"' : ''} 
        onclick="buyStoreItem('${category}', '${item.id}')">
        ${isOwned ? 'تم الشراء' : 'شراء'}
      </button>
    `;
    grid.appendChild(card);
  });
}

window.buyStoreItem = (category, id) => {
  const item = gameState.store[category].find(i => i.id === id);
  
  if (item.priceCoins > 0 && gameState.user.coins < item.priceCoins) return alert("لا تملك عملات كافية!");
  if (item.priceGems > 0 && gameState.user.gems < item.priceGems) return alert("لا تملك جواهر كافية!");

  gameState.user.coins -= item.priceCoins || 0;
  gameState.user.gems -= item.priceGems || 0;
  gameState.user.inventory[category].push(id);

  saveGameData();
  renderAll();
};

function updateResourceUI() {
  document.getElementById('res-coins').innerText = gameState.user.coins;
  document.getElementById('res-gems').innerText = gameState.user.gems;
}

// --- 9. حفظ وتنسيق البيانات localStoraeg ---
function saveGameData() {
  localStorage.setItem('full_game_state', JSON.stringify(gameState));
}

function loadGameData() {
  const saved = localStorage.getItem('full_game_state');
  if (saved) {
    gameState = JSON.parse(saved);
  }
}
