// Global variables
let today = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
let charactersData = {};
let weaponsData = {};
let materialsData = {};
let domainsData = {};
let elementsData = {};
let activeTab = "characters";
let activeCharacterFilter = "all";
let activeWeaponFilter = "all";

// DOM elements
const todayItemsContainer = document.getElementById("today-items");
const detailPanel = document.getElementById("detail-panel");
const allCharactersContainer = document.getElementById("all-characters");
const allWeaponsContainer = document.getElementById("all-weapons");
const characterFiltersContainer = document.getElementById("character-filters");
const weaponFiltersContainer = document.getElementById("weapon-filters");
const resetCountdownElement = document.getElementById("reset-countdown");
const localResetTimeElement = document.getElementById("local-reset-time");
const themeToggle = document.getElementById("theme-toggle");

// Initialize the app
async function init() {
  await loadData();
  setupEventListeners();
  updateResetTime();
  renderTodayItems();
  renderAllCharacters();
  renderAllWeapons();
  startCountdown();
  applyTheme();
}

// Load JSON data
async function loadData() {
  try {
    const responses = await Promise.all([
      fetch("database/characters.json"),
      fetch("database/weapons.json"),
      fetch("database/materials.json"),
      fetch("database/domains.json"),
      fetch("database/elements.json"),
    ]);

    charactersData = await responses[0].json();
    weaponsData = await responses[1].json();
    materialsData = await responses[2].json();
    domainsData = await responses[3].json();
    elementsData = await responses[4].json();

    // Add element filters
    Object.keys(elementsData).forEach((element) => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.filter = element;
      btn.innerHTML = `<img src="assets/icons/elements/${element}.png" width="16" height="16" alt="${element}"> ${elementsData[element].name}`;
      characterFiltersContainer.appendChild(btn);
    });

    // Add weapon type filters
    const weaponTypes = [
      ...new Set(Object.values(weaponsData).map((w) => w.type)),
    ];
    weaponTypes.forEach((type) => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.dataset.filter = type;
      btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      weaponFiltersContainer.appendChild(btn);
    });
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      renderTodayItems();
    });
  });

  // Filter buttons
  characterFiltersContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-btn")) {
      characterFiltersContainer
        .querySelectorAll(".filter-btn")
        .forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      activeCharacterFilter = e.target.dataset.filter;
      renderAllCharacters();
    }
  });

  weaponFiltersContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-btn")) {
      weaponFiltersContainer
        .querySelectorAll(".filter-btn")
        .forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      activeWeaponFilter = e.target.dataset.filter;
      renderAllWeapons();
    }
  });

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);
}

// Render today's items based on active tab
function renderTodayItems() {
  todayItemsContainer.innerHTML = "";

  if (activeTab === "characters") {
    // Find characters with materials available today
    Object.entries(charactersData).forEach(([id, char]) => {
      // Handle both material_id and material_ids cases
      const materialIds = char.material_ids || [char.material_id];

      // Find materials available today
      const todayMaterials = materialIds.filter((materialId) => {
        const material = materialsData[materialId];
        return (
          material &&
          material.domain_schedule.some(
            (day) => day.toLowerCase() === getDayName(today)
          )
        );
      });

      // Only show character if they have at least one material available today
      if (todayMaterials.length > 0) {
        createIconItem(id, char, "character", todayItemsContainer);
      }
    });
  } else {
    // Find weapons with materials available today
    Object.entries(weaponsData).forEach(([id, weapon]) => {
      const material = materialsData[weapon.material_id];
      if (
        material &&
        material.domain_schedule.some(
          (day) => day.toLowerCase() === getDayName(today)
        )
      ) {
        createIconItem(id, weapon, "weapon", todayItemsContainer);
      }
    });
  }
}

// Render all characters with filters
function renderAllCharacters() {
  allCharactersContainer.innerHTML = "";

  let characters = Object.entries(charactersData);

  // Apply A-Z filter
  if (activeCharacterFilter === "a-z") {
    characters.sort((a, b) => a[1].name.localeCompare(b[1].name));
  }

  // Apply element filter
  if (
    activeCharacterFilter !== "all" &&
    activeCharacterFilter in elementsData
  ) {
    characters = characters.filter(
      ([_, char]) => char.element_type === activeCharacterFilter
    );
  }

  characters.forEach(([id, char]) => {
    createIconItem(id, char, "character", allCharactersContainer);
  });
}

// Render all weapons with filters
function renderAllWeapons() {
  allWeaponsContainer.innerHTML = "";

  let weapons = Object.entries(weaponsData);

  // Apply A-Z filter
  if (activeWeaponFilter === "a-z") {
    weapons.sort((a, b) => a[1].name.localeCompare(b[1].name));
  }

  // Apply type filter
  if (activeWeaponFilter !== "all") {
    weapons = weapons.filter(
      ([_, weapon]) => weapon.type === activeWeaponFilter
    );
  }

  weapons.forEach(([id, weapon]) => {
    createIconItem(id, weapon, "weapon", allWeaponsContainer);
  });
}

// Create an icon item
function createIconItem(id, item, type, container) {
  const itemElement = document.createElement("div");
  itemElement.className = "icon-item";
  itemElement.dataset.id = id;
  itemElement.dataset.type = type;

  const icon = document.createElement("img");
  icon.className = "icon-img";
  icon.src = `assets/icons/${type}s/${item.icon}`;
  icon.alt = item.name;

  const name = document.createElement("div");
  name.className = "icon-name";
  name.textContent = item.name;

  itemElement.appendChild(icon);
  itemElement.appendChild(name);
  container.appendChild(itemElement);

  // Add click event to show details
  itemElement.addEventListener("click", () => showDetails(id, type));
}

// Show details panel
function showDetails(id, type) {
  detailPanel.style.display = "block";
  detailPanel.innerHTML = "";

  if (type === "character") {
    showCharacterDetails(id);
  } else if (type === "weapon") {
    showWeaponDetails(id);
  }

  // Scroll to details panel
  detailPanel.scrollIntoView({ behavior: "smooth" });
}

function showWeaponDetails(id) {
  const weapon = weaponsData[id];
  if (!weapon) return;

  const material = materialsData[weapon.material_id];
  if (!material) return;

  const domain = domainsData[material.domain_id];
  if (!domain) return;

  const isAvailableToday = material.domain_schedule.some(
    (day) => day.toLowerCase() === getDayName(today)
  );

  const header = document.createElement("div");
  header.className = "detail-header";

  const icon = document.createElement("img");
  icon.className = "detail-icon";
  icon.src = `assets/icons/weapons/${weapon.icon}`;
  icon.alt = weapon.name;

  const title = document.createElement("div");
  title.className = "detail-title";
  title.textContent = `${weapon.name} (${
    weapon.type.charAt(0).toUpperCase() + weapon.type.slice(1)
  })`;

  header.appendChild(icon);
  header.appendChild(title);

  const content = document.createElement("div");
  content.className = "detail-content";

  // Create combined card
  const card = document.createElement("div");
  card.className = "detail-card";
  if (isAvailableToday) {
    card.style.borderLeft = "4px solid var(--accent-color)";
  }

  // Material info
  const materialTitle = document.createElement("div");
  materialTitle.className = "detail-card-title";
  materialTitle.textContent = "Material";
  if (isAvailableToday) {
    materialTitle.innerHTML +=
      ' <span style="color: var(--accent-color);">(Available Today)</span>';
  }

  const materialInfo = document.createElement("div");
  materialInfo.style.display = "flex";
  materialInfo.style.alignItems = "center";
  materialInfo.style.gap = "8px";
  materialInfo.style.marginBottom = "10px";

  // Material icon - don't hide the entire div if icon fails to load
  const materialIcon = document.createElement("img");
  materialIcon.src = `assets/icons/materials/weapon-ascension/${material.icon}`;
  materialIcon.width = 24;
  materialIcon.height = 24;
  materialIcon.alt = material.name;
  materialIcon.onerror = function () {
    this.style.display = "none";
  };

  const materialName = document.createElement("span");
  materialName.textContent = material.name;

  materialInfo.appendChild(materialIcon);
  materialInfo.appendChild(materialName);

  // Domain info
  const domainTitle = document.createElement("div");
  domainTitle.className = "detail-card-title";
  domainTitle.textContent = "Domain";

  const domainInfo = document.createElement("div");
  domainInfo.style.display = "flex";
  domainInfo.style.flexDirection = "column";
  domainInfo.style.gap = "5px";

  const domainName = document.createElement("div");
  domainName.textContent = domain.name;

  const domainRegion = document.createElement("div");
  domainRegion.style.display = "flex";
  domainRegion.style.alignItems = "center";
  domainRegion.style.gap = "5px";

  // Region icon - don't hide the entire div if icon fails to load
  const regionIcon = document.createElement("img");
  regionIcon.src = `assets/icons/regions/${domain.region_icon}`;
  regionIcon.width = 16;
  regionIcon.height = 16;
  regionIcon.alt = domain.region;
  regionIcon.onerror = function () {
    this.style.display = "none";
  };

  const regionName = document.createElement("span");
  regionName.textContent = domain.region;

  domainRegion.appendChild(regionIcon);
  domainRegion.appendChild(regionName);

  const domainDays = document.createElement("div");
  domainDays.textContent = `Days: ${material.domain_schedule.join(", ")}`;

  domainInfo.appendChild(domainName);
  domainInfo.appendChild(domainRegion);
  domainInfo.appendChild(domainDays);

  card.appendChild(materialTitle);
  card.appendChild(materialInfo);
  card.appendChild(domainTitle);
  card.appendChild(domainInfo);

  content.appendChild(card);
  detailPanel.appendChild(header);
  detailPanel.appendChild(content);
}

// Show character details
function showCharacterDetails(id) {
  const char = charactersData[id];
  const element = elementsData[char.element_type];
  const materialIds = char.material_ids || [char.material_id]; // Handle both cases

  const header = document.createElement("div");
  header.className = "detail-header";

  const icon = document.createElement("img");
  icon.className = "detail-icon";
  icon.src = `assets/icons/characters/${char.icon}`;
  icon.alt = char.name;

  const title = document.createElement("div");
  title.className = "detail-title";
  title.textContent = char.name;

  const elementBadge = document.createElement("span");
  elementBadge.className = "element-badge";
  elementBadge.textContent = element.name;
  elementBadge.style.backgroundColor = element.color;

  title.appendChild(elementBadge);
  header.appendChild(icon);
  header.appendChild(title);

  const content = document.createElement("div");
  content.className = "detail-content";

  // Process all materials and their domains
  materialIds.forEach((materialId) => {
    const material = materialsData[materialId];
    if (!material) return;

    const domain = domainsData[material.domain_id];
    if (!domain) return;

    // Check if this material is available today
    const isAvailableToday = material.domain_schedule.some(
      (day) => day.toLowerCase() === getDayName(today)
    );

    // Create a card for each material-domain pair
    const card = document.createElement("div");
    card.className = "detail-card";
    if (isAvailableToday) {
      card.style.borderLeft = `4px solid ${element.color}`; // Highlight available materials
    }

    // Material info
    const materialTitle = document.createElement("div");
    materialTitle.className = "detail-card-title";
    materialTitle.textContent = "Material";
    if (isAvailableToday) {
      materialTitle.innerHTML +=
        ' <span style="color: var(--accent-color);">(Available Today)</span>';
    }

    const materialInfo = document.createElement("div");
    materialInfo.style.display = "flex";
    materialInfo.style.alignItems = "center";
    materialInfo.style.gap = "8px";
    materialInfo.style.marginBottom = "10px";
    materialInfo.innerHTML = `
      <img src="assets/icons/materials/character-ascension/${material.icon}" width="24" height="24" alt="${material.name}">
      <span>${material.name}</span>
  `;

    // Domain info
    const domainTitle = document.createElement("div");
    domainTitle.className = "detail-card-title";
    domainTitle.textContent = "Domain";

    const domainInfo = document.createElement("div");
    domainInfo.style.display = "flex";
    domainInfo.style.flexDirection = "column";
    domainInfo.style.gap = "5px";

    const domainName = document.createElement("div");
    domainName.textContent = domain.name;

    const domainRegion = document.createElement("div");
    domainRegion.style.display = "flex";
    domainRegion.style.alignItems = "center";
    domainRegion.style.gap = "5px";
    domainRegion.innerHTML = `
      <img src="assets/icons/regions/${domain.region_icon}" width="16" height="16" alt="${domain.region}">
      ${domain.region}
  `;

    const domainDays = document.createElement("div");
    domainDays.textContent = `Days: ${material.domain_schedule.join(", ")}`;

    domainInfo.appendChild(domainName);
    domainInfo.appendChild(domainRegion);
    domainInfo.appendChild(domainDays);

    card.appendChild(materialTitle);
    card.appendChild(materialInfo);
    card.appendChild(domainTitle);
    card.appendChild(domainInfo);

    content.appendChild(card);
  });

  detailPanel.appendChild(header);
  detailPanel.appendChild(content);
}
// Helper function to get day name
function getDayName(dayIndex) {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[dayIndex];
}

function updateResetTime() {
  // Server reset is always at UTC+8 04:00 (which is UTC 20:00 previous day)
  const serverResetUTC = new Date();
  serverResetUTC.setUTCHours(20, 0, 0, 0);

  // If current UTC time is past 20:00, set to next day
  const nowUTC = new Date();
  if (nowUTC.getUTCHours() >= 20) {
    serverResetUTC.setUTCDate(serverResetUTC.getUTCDate() + 1);
  }

  // Calculate local time equivalent
  const localResetTime = new Date(serverResetUTC);
  const localTimeStr = localResetTime
    .toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  // Get local timezone offset
  const localOffset = -nowUTC.getTimezoneOffset() / 60;
  const localOffsetStr = `UTC${localOffset >= 0 ? "+" : ""}${localOffset}`;

  // Update the display
  document.getElementById("reset-time-info").innerHTML = `
  <div><strong>Server Reset:</strong> Asia (UTC+8) | 04:00 am</div>
  <div><strong>Your Local Time:</strong> Asia (${localOffsetStr}) | ${localTimeStr}</div>
`;
}

// Start countdown to next reset
function startCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date();
  const resetTime = new Date();

  // Reset happens at UTC+8 04:00 which is UTC 20:00 previous day
  resetTime.setUTCHours(20, 0, 0, 0);

  // If current UTC time is past 20:00, set to next day
  if (now.getUTCHours() >= 20) {
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
  }

  const diff = resetTime - now;

  if (diff <= 0) {
    resetCountdownElement.textContent = "RESET NOW";
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  resetCountdownElement.textContent = `${hours
    .toString()
    .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

// Theme management
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

function applyTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

// Initialize the app
document.addEventListener("DOMContentLoaded", init);
