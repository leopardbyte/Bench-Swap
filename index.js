import utils from '../_utils'

let isFunction1On = false;
let predefinedChampionIds = [];
let deactivatedChampionIds = JSON.parse(localStorage.getItem("deactivatedChampionIds") || "[]");
let intervalId;
let toastIntervalId = null;
let idToNameMap = {};
let playableChampionIds = [];


const champPresets = {
  "Assassins": ["Zed", "Kha'Zix", "Evelynn", "Akali", "Naafiri", "Yone", "Qiyana", "Pyke", "Rengar", "Fizz", "Talon", "Lee Sin", "Nocturne", "Evelynn", "Katarina", "Shaco", "Xin Zhao"],
  "Tanks": ["Malphite", "Ornn", "Sion", "Maokai", "Rell", "Illaoi", "Tahm Kench", "Braum", "Zac", "Darius", "Nautilus", "Sejuani", "Volibear", "Leona", "Alistar", "Amumu", "Blitzcrank", "Cho'Gath", "Galio", "Nunu & Willump", "Poppy", "Rammus", "Shen", "Singed"],
  "Mages": ["Lux", "Syndra", "Viktor", "Zoe", "Aurora", "Hwei", "Vex", " Lillia", "Sylas", "Neeko", "Zoe", "Taliyah", "Aurelion Sol", "Azir", "Vel'koz", "Lissandra", "Elise", "Diana", "Zyra", "Ziggs", "Ahri", "Xerath", "Orianna"],
  "Marksman": ["Jinx", "Caitlyn", "Neeko", "Ashe", "Bel'Veth", "Kog'Maw", "Zeri", "Xayah", "Senna", "Kalista", "Varus", "Twisted Fate", "Vayne", "Miss Fortune", "Tristana", "Twitch", "Sivir", "Quinn", "Kai'Sa"]
};

function getPresetChampionIds(names) {
  const nameToId = Object.fromEntries(Object.entries(idToNameMap).map(([id, name]) => [name, Number(id)]));
  return names.map(name => nameToId[name]).filter(id => id !== undefined);
}

const champListStyles = `
  .champ-popout-container {
    position: fixed;
    bottom: 60px;
    right: 140px;
    width: 340px;
    max-height: 420px;
    background: #0a192f;
    border: 1.5px solid cyan;
    border-radius: 10px;
    box-shadow: 0 8px 32px 0 rgba(0,255,255,0.15);
    z-index: 99999;
    padding: 0;
    display: flex;
    flex-direction: column;
    animation: fadeInPop 0.22s;
  }
  @keyframes fadeInPop {
    from { opacity: 0; transform: translateY(40px) scale(0.95);}
    to   { opacity: 1; transform: translateY(0) scale(1);}
  }
  .champ-popout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 16px 8px 16px;
    border-bottom: 1px solid rgba(0,255,255,0.1);
  }
  .champ-popout-title {
    font-weight: bold;
    font-size: 18px;
    color: cyan;
    letter-spacing: 0.5px;
  }
  .champ-popout-close {
    background: transparent;
    border: none;
    color: cyan;
    font-size: 22px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    transition: color 0.15s;
  }
  .champ-popout-close:hover {
    color: #00ffea;
  }
  .champ-search-bar-row {
    display: flex;
    align-items: center;
    margin: 12px 16px 0 16px;
    gap: 8px;
  }
  .champ-search-bar {
    flex: 1 1 auto;
    padding: 7px 12px;
    border-radius: 5px;
    border: 1px solid cyan;
    background: #0a192f;
    color: cyan;
    font-size: 15px;
    outline: none;
    font-family: 'Roboto', sans-serif;
    transition: border 0.2s;
    box-sizing: border-box;
  }
  .champ-search-bar:focus {
    border: 1.5px solid #00ffea;
  }
  .champ-tooltip-icon {
    position: relative;
    display: inline-block;
    width: 22px;
    height: 22px;
    color: cyan;
    background: transparent;
    border: none;
    font-size: 17px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 50%;
    text-align: center;
    line-height: 22px;
    margin-left: 2px;
    transition: background 0.15s;
  }
  .champ-tooltip-icon:hover {
    background: rgba(0,255,255,0.08);
  }
  .champ-tooltip-icon::after {
    content: "Click to (de)activate champions or select a preset";
    visibility: hidden;
    opacity: 0;
    width: max-content;
    max-width: 220px;
    background: #0a192f;
    color: cyan;
    text-align: left;
    border-radius: 6px;
    border: 1px solid cyan;
    padding: 7px 12px;
    position: absolute;
    z-index: 100000;
    right: 28px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 13px;
    font-family: 'Roboto', sans-serif;
    box-shadow: 0 2px 12px 0 rgba(0,255,255,0.10);
    transition: opacity 0.15s;
    pointer-events: none;
  }
  .champ-tooltip-icon:hover::after {
    visibility: visible;
    opacity: 1;
  }
  .champ-list-container {
    flex: 1 1 auto;
    max-height: 220px;
    overflow-y: auto;
    margin: 0 8px 14px 8px;
    border-radius: 6px;
    background: #091624;
    border: 1px solid rgba(0,255,255,0.10);
  }
  .champ-list-container::-webkit-scrollbar {
    width: 8px;
    background: #091624;
    border-radius: 6px;
  }
  .champ-list-container::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, cyan 0%, #0a192f 100%);
    border-radius: 6px;
  }
  .champ-list-container::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #00eaff 0%, #0a192f 100%);
  }
  .champ-item {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(0, 255, 255, 0.08);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    user-select: none;
    font-weight: bold;
    font-family: 'Roboto', sans-serif;
    font-size: 15px;
    letter-spacing: 0.3px;
  }
  .champ-item:last-child {
    border-bottom: none;
  }
  .champ-item.activated {
    color: #00ff7f;
    text-shadow: 0 0 5px #00ff7f99, 0 0 1px #00ff7f;
    background: rgba(0,255,127,0.05);
  }
  .champ-item.unowned {
  color: #b0b0b0 !important; /* <--- Change this to any color you want */
  background: #181f2a !important;
  cursor: not-allowed !important;
  text-shadow: none !important;
  text-decoration: none !important;
  pointer-events: none !important;
  opacity: 0.6;
}

  .champ-item.deactivated {
    color: #ff3b3b;
    background: rgba(255, 59, 59, 0.08);
    text-decoration: line-through;
  }
`;

function applyPreset(presetName, champNames) {
  const presetIds = getPresetChampionIds(champNames);
  deactivatedChampionIds = predefinedChampionIds.filter(id => !presetIds.includes(id));
  localStorage.setItem("deactivatedChampionIds", JSON.stringify(deactivatedChampionIds));

  
  if (typeof renderChampList === "function") renderChampList();
  showPresetToast(`Preset ${presetName} applied!`);

  const popout = document.getElementById("benchSwapSettingsPopout");
  if (popout) popout.remove();

}

function showPresetToast(message) {
  const existingToast = document.getElementById("presetToast");
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement("div");
  toast.id = "presetToast";
  toast.style = `
    position: absolute; top: 80px; right: 20px;
    background: #0a192f; border: 1px solid cyan;
    color: cyan; font-weight: bold;
    padding: 10px 20px; border-radius: 6px; z-index: 9999;
    font-family: 'Roboto', sans-serif;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

async function getAllChampions() {
  const response = await fetch("/lol-game-data/assets/v1/champion-summary.json");
  const responseData = await response.json();
  responseData.sort((a, b) => a.name.localeCompare(b.name));
  return responseData;
}

async function getPlayableChampions(retryCount = 0) {
  let response = await fetch("/lol-champions/v1/owned-champions-minimal");
  while (!response.ok) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    response = await fetch("/lol-champions/v1/owned-champions-minimal");
  }
  const responseData = await response.json();
  if (responseData.length <= 21 && retryCount < 5) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return getPlayableChampions(retryCount + 1);
  }
  responseData.sort((a, b) => a.name.localeCompare(b.name));
  return responseData;
}


async function initializeChampionData() {
  const [allChamps, ownedChamps] = await Promise.all([
    getAllChampions(),
    getPlayableChampions()
  ]);
  predefinedChampionIds = allChamps.map(champ => champ.id);
  idToNameMap = {};
  for (const champ of allChamps) {
    idToNameMap[champ.id] = champ.name;
  }
  playableChampionIds = ownedChamps.map(champ => champ.id);
}

window.extraFunction1 = async function() {
  isFunction1On = !isFunction1On;
  const activeChampionIds = predefinedChampionIds.filter(id =>
    !deactivatedChampionIds.includes(id) && playableChampionIds.includes(id)
  );
  if (isFunction1On) {
    showObservingToast();
    intervalId = setInterval(async () => {
      let gamePhaseResponse = await fetch("/lol-gameflow/v1/gameflow-phase");
      let gamePhase = await gamePhaseResponse.json();
      if (gamePhase !== "ChampSelect") {
        clearInterval(intervalId);
        isFunction1On = false;
        document.getElementById("extraButton1").querySelector('lol-uikit-flat-button').innerHTML = "Switch On";
        hideObservingToast();
        return;
      }
      let response = await fetch("/lol-champ-select/v1/session");
      let data = await response.json();
      let benchChampionIds = data.benchChampions.map(champ => champ.championId);
      for (let id of activeChampionIds) {
        if (benchChampionIds.includes(id)) {
          try {
            await fetch(`/lol-champ-select/v1/session/bench/swap/${id}`, { method: "POST" });
            showNowPlayingToast(idToNameMap[id.toString()] || `ID ${id}`);
            clearInterval(intervalId);
            isFunction1On = false;
            document.getElementById("extraButton1").querySelector('lol-uikit-flat-button').innerHTML = "Switch On";
            hideObservingToast();
          } catch (error) {
            console.error(`Failed to swap champion with ID ${id}: ${error}`);
          }
          break;
        }
      }
    }, 200);
  } else {
    clearInterval(intervalId);
    hideObservingToast();
  }
};

function showObservingToast() {
  if (document.getElementById("observingToast")) return;
  const toast = document.createElement("div");
  toast.id = "observingToast";
  toast.style = `
    position: absolute; top: 40px; right: 20px;
    background: #0a192f; border: 1px solid cyan;
    color: cyan; font-weight: bold;
    padding: 10px 20px; border-radius: 6px; z-index: 9999;
    font-family: 'Roboto', sans-serif;
  `;
  document.body.appendChild(toast);
  let dotCount = 1;
  toast.textContent = "Observing" + ".".repeat(dotCount);
  toastIntervalId = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    toast.textContent = "Observing" + ".".repeat(dotCount);
  }, 500);
}

function hideObservingToast() {
  if (toastIntervalId) {
    clearInterval(toastIntervalId);
    toastIntervalId = null;
  }
  const toast = document.getElementById("observingToast");
  if (toast) toast.remove();
}

function showNowPlayingToast(champName) {
  const existingToast = document.getElementById("nowPlayingToast");
  if (existingToast) existingToast.remove();
  const toast = document.createElement("div");
  toast.id = "nowPlayingToast";
  toast.style = `
    position: absolute; top: 40px; right: 20px;
    background: #0a192f; border: 1px solid cyan;
    color: cyan; font-weight: bold;
    padding: 10px 20px; border-radius: 6px; z-index: 9999;
    font-family: 'Roboto', sans-serif;
  `;
  toast.textContent = `Now playing ${champName}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

async function generateButtons(siblingDiv) {
  let gamePhaseResponse = await fetch("/lol-gameflow/v1/gameflow-phase");
  let gamePhase = await gamePhaseResponse.json();
  if (gamePhase === "ChampSelect") {
    const parentDiv = document.createElement("div");
    parentDiv.setAttribute("class", "switch-button-container");
    parentDiv.setAttribute("style", "position: absolute; right: 10px; bottom: 57px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;");
    const title = document.createElement("div");
    title.textContent = "Bench Swap";
    title.style.color = "cyan";
    title.style.fontWeight = "bold";
    title.style.fontSize = "16px";
    title.style.marginBottom = "4px";
    parentDiv.appendChild(title);
    const extraButton1Div = createButton("extraButton1", isFunction1On ? "Switch off" : "Switch On", "window.extraFunction1()");
    parentDiv.appendChild(extraButton1Div);
    const settingsButtonDiv = document.createElement("div");
    settingsButtonDiv.setAttribute("class", "button ember-view");
    settingsButtonDiv.style.cursor = "pointer";
    settingsButtonDiv.style.width = "100%";
    settingsButtonDiv.onclick = openSettingsWindow;
    const settingsButton = document.createElement("lol-uikit-flat-button");
    settingsButton.textContent = "Settings";
    settingsButtonDiv.appendChild(settingsButton);
    parentDiv.appendChild(settingsButtonDiv);
    siblingDiv.parentNode.insertBefore(parentDiv, siblingDiv);
  }
}

function createButton(id, text, onclick) {
  const div = document.createElement("div");
  div.setAttribute("class", "button ember-view");
  div.setAttribute("id", id);
  const button = document.createElement("lol-uikit-flat-button");
  button.innerHTML = text;
  div.appendChild(button);
  if (id === "extraButton1") {
    div.onclick = function() {
      window.extraFunction1();
      div.querySelector('lol-uikit-flat-button').innerHTML = isFunction1On ? "Switch off" : "Switch On";
    };
  } else {
    div.setAttribute("onclick", onclick);
  }
  return div;
}

function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) === a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function openSettingsWindow() {
  if (document.getElementById("benchSwapSettingsPopout")) return;

  if (!document.getElementById("champListCustomStyles")) {
    const styleTag = document.createElement("style");
    styleTag.id = "champListCustomStyles";
    styleTag.textContent = champListStyles;
    document.head.appendChild(styleTag);
  }

  const popout = document.createElement("div");
  popout.id = "benchSwapSettingsPopout";
  popout.className = "champ-popout-container";

  const header = document.createElement("div");
  header.className = "champ-popout-header";
  const title = document.createElement("div");
  title.className = "champ-popout-title";
  title.textContent = "Bench Swap Settings";
  header.appendChild(title);
  const closeBtn = document.createElement("button");
  closeBtn.className = "champ-popout-close";
  closeBtn.textContent = "✕";
  closeBtn.onclick = () => popout.remove();
  header.appendChild(closeBtn);
  popout.appendChild(header);

  const presetContainer = document.createElement("div");
  presetContainer.style = "display: flex; gap: 8px; margin: 10px 16px 0 16px;";
  
  Object.entries(champPresets).forEach(([presetName, champNames]) => {
    const btn = document.createElement("button");
    btn.textContent = presetName;
    btn.style = "flex: 1; background: #0a192f; color: cyan; border: 1px solid cyan; border-radius: 5px; padding: 6px 10px; cursor: pointer;";
    btn.onclick = () => applyPreset(presetName, champNames);
    presetContainer.appendChild(btn);
  });
  popout.appendChild(presetContainer);

  const searchBarRow = document.createElement("div");
  searchBarRow.className = "champ-search-bar-row";
  const searchBar = document.createElement("input");
  searchBar.type = "text";
  searchBar.className = "champ-search-bar";
  searchBar.placeholder = "Search champions...";
  searchBarRow.appendChild(searchBar);

  const tooltipIcon = document.createElement("button");
  tooltipIcon.className = "champ-tooltip-icon";
  tooltipIcon.type = "button";
  tooltipIcon.textContent = "?";
  searchBarRow.appendChild(tooltipIcon);
  popout.appendChild(searchBarRow);

  const champListContainer = document.createElement("div");
  champListContainer.className = "champ-list-container";
  popout.appendChild(champListContainer);

  const allIds = predefinedChampionIds.slice();

  function renderChampList(filter = "") {
    champListContainer.innerHTML = "";
    let items = allIds.map(id => ({
      id,
      name: idToNameMap[id.toString()] || `ID ${id}`,
      isActive: !deactivatedChampionIds.includes(id),
      isOwned: playableChampionIds.includes(id)
    }));

    if (filter.trim()) {
      items.forEach(item => {
        item.distance = levenshtein(item.name, filter);
      });
      items = items
        .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()) || item.distance <= 3)
        .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name));
    }

    if (items.length === 0) {
      champListContainer.textContent = "No champions found.";
      return;
    }
    for (const item of items) {
      const div = document.createElement("div");
      div.className = "champ-item";
      div.textContent = item.name;
      if (!item.isOwned) {
        div.classList.add("unowned");
      } else {
        div.classList.add(item.isActive ? "activated" : "deactivated");
        div.onclick = () => {
          if (div.classList.contains("activated")) {
            div.classList.remove("activated");
            div.classList.add("deactivated");
            if (!deactivatedChampionIds.includes(item.id)) {
              deactivatedChampionIds.push(item.id);
              localStorage.setItem("deactivatedChampionIds", JSON.stringify(deactivatedChampionIds));
            }
          } else {
            div.classList.remove("deactivated");
            div.classList.add("activated");
            deactivatedChampionIds = deactivatedChampionIds.filter(cid => cid !== item.id);
            localStorage.setItem("deactivatedChampionIds", JSON.stringify(deactivatedChampionIds));
          }
        };
      }
      champListContainer.appendChild(div);
    }
  }
  renderChampList();
  searchBar.addEventListener("input", () => {
    renderChampList(searchBar.value);
  });

  document.body.appendChild(popout);

  setTimeout(() => {
    function clickOutsideHandler(e) {
      if (!popout.contains(e.target)) {
        popout.remove();
        document.removeEventListener("mousedown", clickOutsideHandler);
      }
    }
    document.addEventListener("mousedown", clickOutsideHandler);
  }, 0);
}

let addButtonObserver = async (mutations) => {
  if (
    utils.phase == "ChampSelect" &&
    document.querySelector(".bottom-right-buttons") &&
    !document.querySelector(".switch-button-container")
  ) {
    await generateButtons(document.querySelector(".bottom-right-buttons"));
  }
}

window.addEventListener('load', async () => {
  await initializeChampionData();
  utils.routineAddCallback(addButtonObserver, ["bottom-right-buttons"]);
});





var UPLCore = class {
  constructor(context) {
    this.Context = context;
  }
};
var Core;
function initCore(context) {
  if (Core != void 0) {
    throw new Error("UPL is already initialized!");
  }
  Core = new UPLCore(context);
}
var Once = class {
  constructor(callback) {
    this._callback = callback;
  }
  trigger() {
    if (this._callback !== void 0) {
      this._callback();
      this._callback = void 0;
    }
  }
};
var _observer;
var _initOnce$3 = new Once(init$4);
var _entriesCreation = [];
var _entriesDeletion = [];
function matches(element, selector) {
  return Element.prototype.matches.call(element, selector);
}
function observerHandleElement(element, isNew) {
  if (isNew) {
    for (const entry of _entriesCreation) {
      if (matches(element, entry.selector)) {
        entry.callback(element);
      }
    }
  } else {
    for (const entry of _entriesDeletion) {
      if (matches(element, entry.selector)) {
        entry.callback(element);
      }
    }
  }
  for (const child of element.children) {
    observerHandleElement(child, isNew);
  }
  if (element.shadowRoot != null) {
    for (const child of element.shadowRoot.children) {
      observerHandleElement(child, isNew);
    }
    if (isNew) {
      _observer.observe(element.shadowRoot, { attributes: false, childList: true, subtree: true });
    }
  }
}
function observerCallback(mutationsList) {
  for (const mutation of mutationsList) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        observerHandleElement(node, true);
      }
    }
    for (const node of mutation.removedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        observerHandleElement(node, false);
      }
    }
  }
}
function init$4() {
  _observer = new MutationObserver(observerCallback);
  _observer.observe(document, { attributes: false, childList: true, subtree: true });
}
var _xhrHookMap = {};
var _initOnce$2 = new Once(init$3);
function hookPre(path, callback) {
  _initOnce$2.trigger();
  var entry = _xhrHookMap[path];
  if (entry === void 0) {
    _xhrHookMap[path] = { pre_callback: callback, post_callback: void 0 };
  } else {
    _xhrHookMap[path].pre_callback = callback;
  }
}
function hookPost(path, callback) {
  _initOnce$2.trigger();
  var entry = _xhrHookMap[path];
  if (entry === void 0) {
    _xhrHookMap[path] = { pre_callback: void 0, post_callback: callback };
  } else {
    _xhrHookMap[path].post_callback = callback;
  }
}
function hookTextPre(path, callback) {
  hookPre(path, (_, body, original) => {
    if (typeof body !== "string") {
      console.error("UPL: Tried to hook text XHR request but body is not a string!");
      return original(body);
    }
    const _original = (newBody) => {
      original(newBody);
    };
    callback(body, _original);
  });
}
function hookTextPost(path, callback) {
  hookPost(path, (request, original) => {
    if (request.responseType !== "" && request.responseType !== "text") {
      console.error("UPL: Tried to hook text XHR request but response is not a string!");
      return original();
    }
    const _original = (response) => {
      if (request.responseText != response) {
        Object.defineProperty(request, "responseText", {
          writable: true,
          value: response
        });
      }
      original();
    };
    callback(this.responseText, _original);
  });
}
var _xhrOriginalOpen = XMLHttpRequest.prototype.open;
function hookedOpen(_, url) {
  var entry = _xhrHookMap[url.toString()];
  if (entry !== void 0) {
    let originalSend = this.send;
    this.send = function(body) {
      if (body instanceof Document) {
        return originalSend.apply(this, [body]);
      }
      if (entry.pre_callback !== void 0) {
        let original = (content) => {
          body = content;
        };
        entry.pre_callback(this, body || null, original);
      }
      if (entry.post_callback !== void 0) {
        let originalOnReadyStateChanged = this.onreadystatechange;
        this.onreadystatechange = function(ev) {
          if (this.readyState === 4 && entry.post_callback !== void 0) {
            let original = () => {
              originalOnReadyStateChanged.apply(this, [ev]);
            };
            entry.post_callback(this, original);
            return;
          }
          return originalOnReadyStateChanged.apply(this, arguments);
        };
      }
      originalSend.apply(this, [body]);
    };
  }
  _xhrOriginalOpen.apply(this, arguments);
}
function init$3() {
  XMLHttpRequest.prototype.open = hookedOpen;
}
var xhr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hookPost,
  hookPre,
  hookTextPost,
  hookTextPre
}, Symbol.toStringTag, { value: "Module" }));
var _wsHookMap = {};
var _initOnce$1 = new Once(init$2);
function hook(endpoint, callback) {
  _initOnce$1.trigger();
  _wsHookMap[endpoint] = callback;
}
function hookText(endpoint, callback) {
  hook(endpoint, (content, original) => {
    if (typeof content !== "string") {
      console.error("UPL: Tried to hook text websocket endpoint but content is not a string!");
      return original(content);
    }
    const _original = (newContent) => {
      original(newContent);
    };
    callback(content, _original);
  });
}
function init$2() {
  let context = Core == null ? void 0 : Core.Context;
  if (context == null) {
    throw new Error("UPL is not initialized!");
  }
  context.rcp.postInit("rcp-fe-common-libs", async (api) => {
    let originalGetDataBinding = api.getDataBinding;
    api.getDataBinding = async function(rcp_name) {
      let originalDataBinding = await originalGetDataBinding.apply(this, arguments);
      let hookedDataBinding = function(basePath, socket) {
        let dataBinding = originalDataBinding.apply(this, arguments);
        let cache = dataBinding.cache;
        let originalTriggerObservers = cache._triggerResourceObservers;
        cache._triggerResourceObservers = function(endpoint, content, error) {
          const callback = _wsHookMap[endpoint];
          if (callback == void 0) {
            return originalTriggerObservers.apply(this, [endpoint, content, error]);
          }
          let original = (content2) => {
            originalTriggerObservers.apply(this, [endpoint, content2, error]);
          };
          return callback(content, original);
        };
        return dataBinding;
      };
      hookedDataBinding.bindTo = function(socket) {
        let result = originalDataBinding.bindTo.apply(this, arguments);
        result.dataBinding = hookedDataBinding;
        return result;
      };
      return Promise.resolve(hookedDataBinding);
    };
  });
}
var ws = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hook,
  hookText
}, Symbol.toStringTag, { value: "Module" }));
var _entriesName = /* @__PURE__ */ new Map();
var _entriesMatching = [];
var _initOnce = new Once(init$1);
function hookComponentMethodByName(className, methodName, callback) {
  _initOnce.trigger();
  var hookEntry = { method: methodName, callback };
  var entry = _entriesName.get(className);
  if (entry === void 0) {
    _entriesName.set(className, { hooks: [hookEntry], mixins: [] });
  } else {
    entry.hooks.push(hookEntry);
  }
}
function hookComponentMethodByMatching(matcher, methodName, callback) {
  _initOnce.trigger();
  var hookEntry = { method: methodName, callback };
  _entriesMatching.push({ matcher, entry: { hooks: [hookEntry], mixins: [] } });
}
function extendClassByName(className, callback) {
  _initOnce.trigger();
  var entry = _entriesName.get(className);
  if (entry === void 0) {
    _entriesName.set(className, { hooks: [], mixins: [callback] });
  } else {
    entry.mixins.push(callback);
  }
}
function extendClassByMatching(matcher, callback) {
  _initOnce.trigger();
  _entriesMatching.push({ matcher, entry: { hooks: [], mixins: [callback] } });
}
function init$1() {
  let context = Core == null ? void 0 : Core.Context;
  if (context == null) {
    throw new Error("UPL is not initialized!");
  }
  context.rcp.postInit("rcp-fe-ember-libs", async (api) => {
    const originalGetEmber = api.getEmber;
    api.getEmber = function(...args) {
      const result = originalGetEmber.apply(this, args);
      result.then((Ember) => {
        const originalExtend = Ember.Component.extend;
        Ember.Component.extend = function(...args2) {
          let result2 = originalExtend.apply(this, arguments);
          const potentialObjects = args2.filter((x) => typeof x === "object");
          for (const obj of potentialObjects) {
            for (const entry of _entriesMatching) {
              if (entry.matcher(obj)) {
                result2 = handleComponent(Ember, entry.entry, result2);
              }
            }
          }
          const classNames = potentialObjects.filter((x) => x.classNames && Array.isArray(x.classNames)).map((x) => x.classNames.join(" "));
          for (const className of classNames) {
            const entry = _entriesName.get(className);
            if (entry === void 0) {
              continue;
            }
            result2 = handleComponent(Ember, entry, result2);
          }
          return result2;
        };
        return Ember;
      });
      return result;
    };
  });
}
function handleComponent(Ember, entry, result) {
  const proto = result.proto();
  if (proto.__UPL_IS_HOOKED) {
    return result;
  }
  proto.__UPL_IS_HOOKED = true;
  for (const mixin of entry.mixins) {
    result = result.extend(mixin(Ember));
  }
  for (const hook2 of entry.hooks) {
    const original = proto[hook2.method];
    proto[hook2.method] = function(...args) {
      const proxyOriginal = (...args2) => {
        if (original != void 0) {
          return original.apply(this, args2);
        }
      };
      return hook2.callback.call(this, Ember, proxyOriginal, ...args);
    };
  }
  return result;
}
var ember = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  extendClassByMatching,
  extendClassByName,
  hookComponentMethodByMatching,
  hookComponentMethodByName
}, Symbol.toStringTag, { value: "Module" }));
var index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ember,
  ws,
  xhr
}, Symbol.toStringTag, { value: "Module" }));
function init(penguContext) {
  if (penguContext.rcp === void 0 || typeof penguContext.rcp.preInit != "function" || typeof penguContext.rcp.postInit != "function") {
    throw new Error("context is not a valid Pengu Context!");
  }
  initCore(penguContext);
}

// index.ts
function init2(context) {
  init(context);
  function hookRunTask(componentName) {
    index.ember.hookComponentMethodByName(componentName, "runTask", (ember2, originalMethod, ...args) => {
      console.log(`Hooked runTask in ${componentName} component.`, args);
      if (args.length > 1) {
        args[1] = 0;
      }
      return originalMethod(...args);
    });
  }
  hookRunTask("champion-bench");
  hookRunTask("champion-bench-item");
}
export {
  init2 as init
};

