// --- إعدادات Firebase ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
}

// --- حالة البيانات المبدئية ---
const defaultData = {
  user: {
    coins: 500,
    gems: 20,
    inventory: {
      avatars: ['av_def'],
      frames: ['fr_none'],
      banners: ['bn_def'],
      titles: ['tt_none']
    },
    equipped: {
      avatar: 'av_def',
      frame: 'fr_none',
      banner: 'bn_def',
      title: 'tt_none'
    }
  },
  worlds: [
    {
      id: 'w_gaba',
      name: '🌴 عالم الغابة',
      stages: [
        { id: 's_1', name: 'المرحلة 1: البداية', coins: 100, gems: 2, title: '' },
        { id: 's_2', name: 'المرحلة 2: الكنز', coins: 250, gems: 5, title: '🏆 مستكشف الغابة' }
      ]
    }
  ]
};

// --- كتالوج العناصر في المتجر ---
const catalog = {
  avatars: [
    { id: 'av_def', name: 'افتراضي', coins: 0, gems: 0, img: 'https://via.placeholder.com/100/444/fff?text=Player' },
    { id: 'av_ninja', name: 'نينجا', coins: 200, gems: 0, img: 'https://via.placeholder.com/100/6c5ce7/fff?text=Ninja' },
    { id: 'av_king', name: 'ملك', coins: 0, gems: 15, img: 'https://via.placeholder.com/100/ffd700/000?text=King' }
  ],
  frames: [
    { id: 'fr_none', name: 'بدون إطار', coins: 0, gems: 0, class: '' },
    { id: 'fr_gold', name: 'إطار ذهبي', coins: 300, gems: 0, class: 'frame-gold' },
    { id: 'fr_fire', name: 'إطار ناري', coins: 0, gems: 20, class: 'frame-fire' },
    { id: 'fr_neon', name: 'إطار نيون', coins: 500, gems: 10, class: 'frame-neon' }
  ],
  banners: [
    { id: 'bn_def', name: 'رمادي بسيط', coins: 0, gems: 0, bg: '#3a3a4c' },
    { id: 'bn_space', name: 'بنر الفضاء', coins: 250, gems: 0, bg: 'linear-gradient(45deg, #0984e3, #6c5ce7)' },
    { id: 'bn_fire', name: 'بنر الشفق', coins: 0, gems: 15, bg: 'linear-gradient(45deg, #e17055, #d63031)' }
  ],
  titles: [
    { id: 'tt_none', name: 'بدون لقب', coins: 0, gems: 0, text: 'مبتدئ' },
    { id: 'tt_pro', name: 'المحترف', coins: 150, gems: 0, text: '⚡ المحترف' },
    { id: 'tt_hero', name: 'البطل', coins: 0, gems: 30, text: '👑 البطل' }
  ]
};

let appState = null;
let activeStoreTab = 'avatars';
let activeInvTab = 'avatars';

// --- عند فتح الصفحة ---
window.addEventListener('DOMContentLoaded', () => {
  loadAppData();
  setupNavigation();
  setupAuth();
  setupAdminControls();
  renderAllViews();
});

function loadAppData() {
  const saved = localStorage.getItem('lghzak_game_data');
  if (saved) {
    appState = JSON.parse(saved);
  } else {
    appState = JSON.parse(JSON.stringify(defaultData));
    saveAppData();
  }
}

function saveAppData() {
  localStorage.setItem('lghzak_game_data', JSON.stringify(appState));
}

function renderAllViews() {
  updateTopBar();
  renderWorldsView();
  renderStoreView(activeStoreTab);
  renderProfileView();
  renderInventoryView(activeInvTab);
  renderAdminView();
}

function updateTopBar() {
  document.getElementById('user-coins').innerText = appState.user.coins;
  document.getElementById('user-gems').innerText = appState.user.gems;
}

// --- التنقل بين الصفحات ---
function setupNavigation() {
  const tabs = [
    { btn: 'nav-worlds', view: 'section-worlds' },
    { btn: 'nav-store', view: 'section-store' },
    { btn: 'nav-profile', view: 'section-profile' },
    { btn: 'nav-admin', view: 'section-admin' }
  ];

  tabs.forEach(tab => {
    document.getElementById(tab.btn).onclick = () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));

      document.getElementById(tab.btn).classList.add('active');
      document.getElementById(tab.view).classList.remove('hidden');
    };
  });
}

// --- تسجيل الدخول عبر Google ---
function setupAuth() {
  document.getElementById('google-btn').onclick = () => {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then(res => setLoginState(res.user.displayName))
        .catch(err => alert("خطأ بالدخول: " + err.message));
    } else {
      setLoginState("لاعب Gmail (تجريبي)");
    }
  };

  document.getElementById('logout-btn').onclick = () => {
    document.getElementById('logged-in-view').classList.add('hidden');
    document.getElementById('logged-out-view').classList.remove('hidden');
    document.getElementById('profile-name').innerText = "لاعب تجريبي";
  };
}

function setLoginState(name) {
  document.getElementById('account-name').innerText = name;
  document.getElementById('profile-name').innerText = name;
  document.getElementById('logged-out-view').classList.add('hidden');
  document.getElementById('logged-in-view').classList.remove('hidden');
}

// --- 1. العوالم والمراحل ---
function renderWorldsView() {
  const container = document.getElementById('worlds-list');
  container.innerHTML = '';

  appState.worlds.forEach(w => {
    const box = document.createElement('div');
    box.className = 'world-box';

    let stagesHTML = '';
    w.stages.forEach(st => {
      let rText = [];
      if(st.coins > 0) rText.push(`${st.coins}🪙`);
      if(st.gems > 0) rText.push(`${st.gems}💎`);
      if(st.title) rText.push(`لقب: [${st.title}]`);

      stagesHTML += `
        <div class="stage-row">
          <div class="stage-info">
            <strong>${st.name}</strong><br>
            <span class="stage-rewards">الجوائز: ${rText.join(' + ') || 'لا يوجد'}</span>
          </div>
          <button class="btn-play" onclick="playStageAction('${w.id}', '${st.id}')">لعب ▶</button>
        </div>
      `;
    });

    box.innerHTML = `<h3>${w.name}</h3><div>${stagesHTML || '<p style="font-size:0.8rem; color:#888;">لا يوجد مراحل مضافة هنا بعد.</p>'}</div>`;
    container.appendChild(box);
  });
}

window.playStageAction = (wId, sId) => {
  const world = appState.worlds.find(w => w.id === wId);
  const stage = world.stages.find(s => s.id === sId);

  appState.user.coins += Number(stage.coins || 0);
  appState.user.gems += Number(stage.gems || 0);

  let msg = `أحسنت! أكملت ${stage.name}\nحصلت على: ${stage.coins} عملة و ${stage.gems} جوهر!`;

  if (stage.title && !appState.user.inventory.titles.includes(stage.title)) {
    appState.user.inventory.titles.push(stage.title);
    msg += `\n🎉 وحصلت أيضاً على لقب جديد: [${stage.title}]`;
  }

  alert(msg);
  saveAppData();
  renderAllViews();
};

// --- 2. المتجر ---
document.querySelectorAll('.sub-btn').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeStoreTab = e.target.dataset.storeTab;
    renderStoreView(activeStoreTab);
  };
});

function renderStoreView(cat) {
  const grid = document.getElementById('store-grid');
  grid.innerHTML = '';

  catalog[cat].forEach(item => {
    const isOwned = appState.user.inventory[cat].includes(item.id);
    const card = document.createElement('div');
    card.className = 'grid-card';

    let preview = '';
    if(cat === 'avatars') preview = `<img src="${item.img}">`;
    if(cat === 'banners') preview = `<div class="banner-sample" style="background:${item.bg}"></div>`;
    if(cat === 'frames') preview = `<div style="padding:10px;" class="${item.class}">إطار</div>`;
    if(cat === 'titles') preview = `<span class="badge-title">${item.text}</span>`;

    let price = item.coins > 0 ? `${item.coins} 🪙` : `${item.gems} 💎`;

    card.innerHTML = `
      <h4>${item.name}</h4>
      ${preview}
      <div class="price-tag">${price}</div>
      <button class="btn-buy" ${isOwned ? 'disabled' : ''} onclick="buyStoreItem('${cat}', '${item.id}')">
        ${isOwned ? 'تم الشراء' : 'شراء'}
      </button>
    `;
    grid.appendChild(card);
  });
}

window.buyStoreItem = (cat, id) => {
  const item = catalog[cat].find(i => i.id === id);

  if (item.coins > 0 && appState.user.coins < item.coins) return alert("العملات غير كافية!");
  if (item.gems > 0 && appState.user.gems < item.gems) return alert("الجواهر غير كافية!");

  appState.user.coins -= item.coins || 0;
  appState.user.gems -= item.gems || 0;
  appState.user.inventory[cat].push(id);

  saveAppData();
  renderAllViews();
};

// --- 3. البروفايل والتجهيز ---
function renderProfileView() {
  const eq = appState.user.equipped;

  const av = catalog.avatars.find(a => a.id === eq.avatar);
  if (av) document.getElementById('preview-avatar-img').src = av.img;

  const bn = catalog.banners.find(b => b.id === eq.banner);
  if (bn) document.getElementById('preview-banner-box').style.background = bn.bg;

  const fr = catalog.frames.find(f => f.id === eq.frame);
  document.getElementById('preview-frame-box').className = 'frame-box ' + (fr ? fr.class : '');

  const tt = catalog.titles.find(t => t.id === eq.title);
  document.getElementById('preview-title-badge').innerText = tt ? tt.text : eq.title;
}

document.querySelectorAll('.inv-btn').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.inv-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeInvTab = e.target.dataset.invTab;
    renderInventoryView(activeInvTab);
  };
});

function renderInventoryView(cat) {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';

  const ownedList = appState.user.inventory[cat] || [];
  const singleKey = cat.slice(0, -1);

  ownedList.forEach(id => {
    let item = catalog[cat]?.find(i => i.id === id);
    let titleName = item ? item.name : id;
    const isEquipped = appState.user.equipped[singleKey] === id;

    const card = document.createElement('div');
    card.className = 'grid-card';
    card.innerHTML = `
      <h4>${titleName}</h4>
      <button class="btn-equip ${isEquipped ? 'equipped' : ''}" onclick="equipUserItem('${singleKey}', '${id}')">
        ${isEquipped ? 'مُجهّز' : 'تجهيز'}
      </button>
    `;
    grid.appendChild(card);
  });
}

window.equipUserItem = (type, id) => {
  appState.user.equipped[type] = id;
  saveAppData();
  renderProfileView();
  renderInventoryView(activeInvTab);
};

// --- 4. لوحة المالك ---
function setupAdminControls() {
  document.getElementById('btn-add-world').onclick = () => {
    const val = document.getElementById('input-world-name').value.trim();
    if(!val) return alert("اكتب اسم العالم!");

    appState.worlds.push({ id: 'w_' + Date.now(), name: val, stages: [] });
    document.getElementById('input-world-name').value = '';
    saveAppData();
    renderAllViews();
  };

  document.getElementById('btn-add-stage').onclick = () => {
    const wId = document.getElementById('select-target-world').value;
    const sName = document.getElementById('input-stage-name').value.trim();
    const c = document.getElementById('input-reward-coins').value;
    const g = document.getElementById('input-reward-gems').value;
    const t = document.getElementById('input-reward-title').value.trim();

    if(!wId || !sName) return alert("اختر العالم واكتب اسم المرحلة!");

    const targetWorld = appState.worlds.find(w => w.id === wId);
    targetWorld.stages.push({
      id: 's_' + Date.now(),
      name: sName,
      coins: Number(c) || 0,
      gems: Number(g) || 0,
      title: t
    });

    document.getElementById('input-stage-name').value = '';
    saveAppData();
    renderAllViews();
  };
}

function renderAdminView() {
  // تحديث قائمة اختيار العالم
  const sel = document.getElementById('select-target-world');
  sel.innerHTML = '';
  appState.worlds.forEach(w => {
    sel.innerHTML += `<option value="${w.id}">${w.name}</option>`;
  });

  // عرض القائمة مع إمكانية الحذف
  const mgr = document.getElementById('admin-worlds-manager');
  mgr.innerHTML = '';

  appState.worlds.forEach(w => {
    let stagesHTML = '';
    w.stages.forEach(s => {
      stagesHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#121214; padding:6px; margin-top:4px; border-radius:6px;">
          <span style="font-size:0.8rem;">${s.name} (🪙${s.coins} | 💎${s.gems})</span>
          <button class="btn-del" onclick="deleteAdminStage('${w.id}', '${s.id}')">حذف المرحلة</button>
        </div>
      `;
    });

    const box = document.createElement('div');
    box.style.cssText = "background:#121214; padding:10px; border-radius:8px; margin-top:10px;";
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #3a3a4c; padding-bottom:6px;">
        <strong>${w.name}</strong>
        <button class="btn-del" onclick="deleteAdminWorld('${w.id}')">حذف العالم</button>
      </div>
      <div>${stagesHTML}</div>
    `;
    mgr.appendChild(box);
  });
}

window.deleteAdminWorld = (wId) => {
  appState.worlds = appState.worlds.filter(w => w.id !== wId);
  saveAppData();
  renderAllViews();
};

window.deleteAdminStage = (wId, sId) => {
  const world = appState.worlds.find(w => w.id === wId);
  world.stages = world.stages.filter(s => s.id !== sId);
  saveAppData();
  renderAllViews();
};
