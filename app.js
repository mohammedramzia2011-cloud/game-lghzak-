// بيانات النظام والمستخدم الحالي (المالك)
let currentUser = {
    name: "مالك اللعبة",
    role: "owner", // صلاحية كاملة للمالك
    gems: 999999999,
    shards: 999999999,
    money: "∞",
    title: "مطور ومؤسس اللعبة",
    xp: 99999,
    completedWorlds: 10,
    inventory: ["قالب أسطوري", "لقب الملك", "أفاتار ذهبي"],
    favorites: []
};

// قاعدة بيانات وهمية قابلة للتعديل بالكامل بواسطة المالك
let gameDatabase = {
    stages: {},
    storeItems: [
        { id: 1, name: "قالب بروفايل ملكي", price: 100 },
        { id: 2, name: "أفاتار نيون", price: 250 },
        { id: 3, name: "لقب صائد الألغاز", price: 500 }
    ],
    customCodes: {
        "OWNER2026": { type: "title", value: "الملك المطلق" },
        "FREEGIFT": { type: "avatar", value: "قالب الماس" }
    }
};

// تهيئة اللعبة عند التحميل
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

function initializeApp() {
    updateUserInterface();
    renderWorlds();
    renderStore();
    renderBoxes();
    renderProfileItems();

    if (currentUser.role === "owner") {
        document.getElementById("adminBtn").classList.remove("hidden");
        document.getElementById("ownerBadge").classList.remove("hidden");
        document.getElementById("userMoney").innerText = `🪙 ∞`;
        document.getElementById("userMoney").classList.add("infinite-money");
    }
}

// التنقل بين الأقسام
function showSection(sectionId) {
    const sections = document.querySelectorAll("main section");
    sections.forEach(sec => sec.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");
}

// تحديث واجهة البيانات العامة
function updateUserInterface() {
    document.getElementById("userGems").innerText = `💎 ${currentUser.gems}`;
    document.getElementById("userShards").innerText = `🧩 ${currentUser.shards}`;
    document.getElementById("profileName").innerText = currentUser.name;
    document.getElementById("playerTitle").innerHTML = `اللقب الحالي: <span>${currentUser.title}</span>`;
    document.getElementById("playerXP").innerText = currentUser.xp;
}

// توليد 10 عوالم وكل عالم يحوي مراحل
function renderWorlds() {
    const worldsList = document.getElementById("worldsList");
    worldsList.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        let worldCard = document.createElement("div");
        worldCard.className = "card-box box-rare";
        worldCard.innerHTML = `العالم ${i} <br><small>100 مرحلة</small>`;
        worldCard.onclick = () => completeWorldChallenge(i);
        worldsList.appendChild(worldCard);
    }
}

// إتمام العالم ومنح الألقاب والـ XP
function completeWorldChallenge(worldNum) {
    currentUser.completedWorlds = worldNum;
    currentUser.xp += 500;
    const autoTitles = ["مبتدئ الألغاز", "مستكشف متمرس", "قاهر الصعاب", "عبقري العصر", "أسطورة الألغاز", "خبير اللغز", "سيد العوالم العشرة"];
    let assignedTitle = autoTitles[Math.min(worldNum - 1, autoTitles.length - 1)];
    currentUser.title = assignedTitle;
    alert(`تهانينا! أنهيت العالم ${worldNum}. تم منحك لقب تلقائي جديد: "${assignedTitle}" و 500 XP!`);
    updateUserInterface();
}

// عرض متجر العناصر القابلة للتعديل
function renderStore() {
    const storeContainer = document.getElementById("storeItems");
    storeContainer.innerHTML = "";
    gameDatabase.storeItems.forEach(item => {
        let itemDiv = document.createElement("div");
        itemDiv.className = "card-box box-epic";
        itemDiv.innerHTML = `${item.name}<br><small>السعر: ${item.price} جوهرة</small>`;
        itemDiv.onclick = () => buyStoreItem(item);
        storeContainer.appendChild(itemDiv);
    });
}

function buyStoreItem(item) {
    currentUser.inventory.push(item.name);
    alert(`تم شراء العنصر (${item.name}) وإضافته إلى حقيبتك بنجاح!`);
    renderProfileItems();
}

// عرض الصناديق المتعددة الندرة
function renderBoxes() {
    const boxesContainer = document.getElementById("boxesList");
    boxesContainer.innerHTML = "";
    const boxTypes = [
        { name: "صندوق شائع", class: "box-common" },
        { name: "صندوق نادر", class: "box-rare" },
        { name: "صندوق ملحمي", class: "box-epic" },
        { name: "صندوق أسطوري", class: "box-legendary" }
    ];

    boxTypes.forEach(box => {
        let boxDiv = document.createElement("div");
        boxDiv.className = `card-box ${box.class}`;
        boxDiv.innerText = box.name;
        boxDiv.onclick = () => openMysteryBox(box.name);
        boxesContainer.appendChild(boxDiv);
    });
}

function openMysteryBox(boxName) {
    alert(`لقد فتحت ${boxName}! حصلت عشوائياً على قالب أفاتار وعنصر مميز.`);
}

// عرض عناصر البروفايل المميز
function renderProfileItems() {
    const list = document.getElementById("profileItemsList");
    list.innerHTML = "";
    currentUser.inventory.forEach(invItem => {
        let div = document.createElement("div");
        div.className = "card-box box-common";
        div.innerText = invItem;
        list.appendChild(div);
    });
}

// استرداد الأكواد (قوالب، ألقاب، عناصر)
function redeemCode() {
    const codeInput = document.getElementById("promoCode").value.trim();
    if (gameDatabase.customCodes[codeInput]) {
        let reward = gameDatabase.customCodes[codeInput];
        if (reward.type === "title") {
            currentUser.title = reward.value;
            alert(`تم استرداد الكود بنجاح! حصلت على اللقب: ${reward.value}`);
        } else {
            currentUser.inventory.push(reward.value);
            alert(`تم استرداد الكود بنجاح! حصلت على العنصر: ${reward.value}`);
        }
        updateUserInterface();
        renderProfileItems();
    } else {
        alert("الكود غير صحيح أو منتهي الصلاحية.");
    }
}

// نظام البحث عن الأشخاص والمفضلين
function searchUsers() {
    const query = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("searchResults");
    if (!query) return;

    resultsContainer.innerHTML = `
        <div style="background:#1b1b2f; padding:12px; margin-top:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span>اللاعب: <strong>${query}</strong> (المستوى: 45)</span>
            <button onclick="addToFavorites('${query}')" style="background:#e94560; border:none; padding:6px 12px; color:#fff; border-radius:4px; cursor:pointer;">إضافة للمفضلة ⭐</button>
        </div>
    `;
}

function addToFavorites(username) {
    if (!currentUser.favorites.includes(username)) {
        currentUser.favorites.push(username);
        renderFavorites();
        alert(`تمت إضافة ${username} إلى قائمة المفضلين.`);
    }
}

function renderFavorites() {
    const favContainer = document.getElementById("favoriteUsers");
    favContainer.innerHTML = "";
    currentUser.favorites.forEach(fav => {
        let div = document.createElement("div");
        div.className = "card-box box-rare";
        div.innerText = fav;
        favContainer.appendChild(div);
    });
}

// ----------------------------------------------------
// وظائف لوحة تحكم المالك (Admin Panel Functions)
// ----------------------------------------------------

function adminUpdateStage() {
    if (currentUser.role !== "owner") return;
    const stageId = document.getElementById("stageIdInput").value;
    const xpVal = document.getElementById("stageXpInput").value;
    const rewardVal = document.getElementById("stageRewardInput").value;

    if (!stageId) {
        alert("يرجى إدخال رقم المرحلة.");
        return;
    }

    gameDatabase.stages[stageId] = { xp: xpVal, reward: rewardVal };
    alert(`تم تحديث بيانات المرحلة ${stageId} بنجاح: XP = ${xpVal} | الجائزة = ${rewardVal}`);
}

function adminAddStoreItem() {
    if (currentUser.role !== "owner") return;
    const name = document.getElementById("storeItemNameInput").value;
    const price = parseInt(document.getElementById("storeItemPriceInput").value);

    if (!name || isNaN(price)) {
        alert("يرجى إدخال اسم وسعر صحيح للعنصر.");
        return;
    }

    let newItem = { id: gameDatabase.storeItems.length + 1, name: name, price: price };
    gameDatabase.storeItems.push(newItem);
    renderStore();
    alert(`تمت إضافة العنصر "${name}" إلى المتجر بنجاح وتحديثه للجميع.`);
}

function adminRemoveStoreItem() {
    if (currentUser.role !== "owner") return;
    const name = document.getElementById("storeItemNameInput").value;
    gameDatabase.storeItems = gameDatabase.storeItems.filter(item => item.name !== name);
    renderStore();
    alert(`تم حذف العنصر "${name}" من المتجر بنجاح.`);
}

function adminCreateCode() {
    if (currentUser.role !== "owner") return;
    const code = document.getElementById("adminCodeInput").value.trim();
    const type = document.getElementById("adminCodeRewardType").value;
    const value = document.getElementById("adminCodeValueInput").value.trim();

    if (!code || !value) {
        alert("يرجى تعبئة الحقول المطلوبة لإنشاء الكود.");
        return;
    }

    gameDatabase.customCodes[code] = { type: type, value: value };
    alert(`تم إنشاء الكود البرمجي (${code}) بنجاح للمالك واللاعبين!`);
}

function adminChangeAppIcon() {
    if (currentUser.role !== "owner") return;
    const iconUrl = document.getElementById("adminIconUrlInput").value.trim();
    if (iconUrl) {
        document.getElementById("appIcon").src = iconUrl;
        alert("تم تحديث وتغيير أيقونة التطبيق الرئيسية بنجاح.");
    }
}
