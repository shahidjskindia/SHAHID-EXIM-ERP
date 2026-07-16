// ========================================================================
// COMPLETE JAVASCRIPT – Gateway EXIM Freight Quotation System
// ========================================================================

// ==================== DATA DEFINITIONS ====================
const defaultCharges = {
    sea: ["FREIGHT", "THC", "SEAL", "MUC", "DOCS", "SWITCH BL", "ETS", "HAZ DOCS", "AMS", "CFS", "CLEARANCE", "VGM",
        "TOLL", "LASHING & CHOKING", "HAZ STICKER", "TRANSPORTATION", "LOLO", "ON WHEEL", "OTHER LOCALS"
    ],
    air: ["AIR FREIGHT", "CARTAGE", "MCC", "XRAY", "GATE PASS", "ASI GMAX", "CUSTOM CLEARANCE", "TERMINAL TRANSFER",
        "AWB FEES", "TEDI", "AMS", "PALLETISATION", "LOADING & UNLOADING", "DG FEES", "DG AGENT FEE", "PLY",
        "REPACKING", "TRANSPORATION", "ADD.SURCHARGE"
    ],
    lcl: ["FREIGHT", "THC", "MUC", "DOCS", "SWITCH BL", "HAZ DOCS", "AMS", "CLEARANCE", "VGM"]
};

const chargeCategories = {
    sea: {
        "Freight": ["FREIGHT"],
        "Carrier Charges": ["THC", "SEAL", "MUC", "DOCS", "SWITCH BL", "ETS", "HAZ DOCS", "AMS"],
        "CFS / Transport Charges": ["CFS", "CLEARANCE", "VGM", "TOLL", "LASHING & CHOKING", "HAZ STICKER",
            "ON WHEEL", "TRANSPORTATION", "LOLO", "OTHER LOCALS"
        ]
    },
    air: {
        "Freight": ["AIR FREIGHT"],
        "Origin Charges": ["CARTAGE", "MCC", "XRAY", "GATE PASS", "ASI GMAX", "AMS", "PALLETISATION",
            "LOADING & UNLOADING", "DG FEES", "DG AGENT FEE", "PLY", "REPACKING", "AWB FEES", "TEDI",
            "ADD.SURCHARGE", "TRANSPORATION"
        ],
        "Local Charges": ["CUSTOM CLEARANCE", "TERMINAL TRANSFER"]
    },
    lcl: {
        "Freight": ["FREIGHT"],
        "Origin Charges": ["THC", "MUC", "DOCS", "SWITCH BL", "HAZ DOCS", "AMS", "CLEARANCE", "VGM"]
    }
};

const airChargePlaceholders = {
    "AIR FREIGHT": "Min 850 INR",
    "CARTAGE": "Min 850 INR",
    "MCC": "Min 850 INR",
    "XRAY": "Min 850 INR",
    "GATE PASS": "Wt×3, Min 850",
    "PALLETISATION": "1450/pallet"
};

const defaultContainerDimensions = [
    { type: "20 GP", length: "5.898m", width: "2.352m", height: "2.393m", maxWeight: "28,200 kg", cbm: "33.2" },
    { type: "40 GP", length: "12.032m", width: "2.352m", height: "2.393m", maxWeight: "26,580 kg", cbm: "67.7" },
    { type: "40 HC", length: "12.032m", width: "2.352m", height: "2.698m", maxWeight: "26,480 kg", cbm: "76.3" },
    { type: "20 RF", length: "5.444m", width: "2.286m", height: "2.275m", maxWeight: "27,700 kg", cbm: "28.4" },
    { type: "40 RF", length: "11.572m", width: "2.286m", height: "2.275m", maxWeight: "26,500 kg", cbm: "54.3" },
    { type: "20 TK", length: "5.898m", width: "2.352m", height: "2.393m", maxWeight: "24,000 kg", cbm: "33.2" },
    { type: "40 TK", length: "12.032m", width: "2.352m", height: "2.393m", maxWeight: "26,000 kg", cbm: "67.7" }
];

const defaultDB = {
    carriers: [],
    pol: ["HAZIRA, IN", "NHAVA SHEVA, IN", "MUNDRA, IN", "DXB Airport", "DEL Airport"],
    pod: ["Rotterdam", "Hamburg", "New York", "FRA Airport", "LHR Airport", "Jebel Ali"],
    incoterms: ["EXW", "FOB", "CIF", "CFR", "DAP", "DDP", "FCA", "CPT"],
    containers: ["20 GP", "40 GP", "40 HC", "20 RF", "40 RF", "20 TK", "40 TK"],
    containerDimensions: JSON.parse(JSON.stringify(defaultContainerDimensions)),
    companyName: "GATEWAY EXIM",
    companyAddress: "OFFICE NO.523, TOWER 1A, 73, EAST AVENUE, NR. GENDA CIRCLE, SARA BHAI CAMPUS, VADODARA, GUJARAT 390007 - INDIA",
    defaultUser: "Shaikh Shahid",
    exchangeRates: { USD: 83.50, GBP: 105.20, RMB: 11.50, EUR: 90.10, AED: 22.75, INR: 1.00 },
    defaultSeaCharges: [],
    defaultAirCharges: [],
    defaultLclCharges: [],
    carrierChargesSeaLcl: [],
    carrierChargesAir: [],
    drafts: { sea: [], air: [], lcl: [] },
    rates: { sea: [], air: [], lcl: [] },
    rateSheet: [],
    hiddenItems: { pol: [], pod: [], incoterms: [], containers: [], carriers: [] },
    theme: "light",
    lastBackup: null,
    duplicateDetectionDays: 30,
    navState: { expandedCategories: ['newQuote', 'savedQuotes', 'tools', 'admin'], lastTab: 'sea' }
};

// ==================== DATABASE INIT ====================
let db = JSON.parse(localStorage.getItem('freight_db_v20'));
if (!db) {
    db = JSON.parse(JSON.stringify(defaultDB));
    if (!db.carriers || db.carriers.length === 0) {
        db.carriers = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE", "Emirates SkyCargo", "Lufthansa Cargo"];
    }
    db.defaultSeaCharges = [
        { carrier: "ALL", pol: "HAZIRA, IN", container: "20 GP", charges: { CFS: { amount: 16950,
                    currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25,
                    currency: "USD" }, "LASHING & CHOKING": { amount: 2000, currency: "INR" },
                "HAZ STICKER": { amount: 500, currency: "INR" }, LOLO: { amount: 2020,
                currency: "INR" }, "OTHER LOCALS": { amount: 5000, currency: "INR" } } },
        { carrier: "ALL", pol: "HAZIRA, IN", container: "40 HC", charges: { CFS: { amount: 23950,
                    currency: "INR" }, CLEARANCE: { amount: 3000, currency: "INR" }, VGM: { amount: 25,
                    currency: "USD" }, "LASHING & CHOKING": { amount: 3000, currency: "INR" },
                "HAZ STICKER": { amount: 900, currency: "INR" }, LOLO: { amount: 3320,
                currency: "INR" }, "OTHER LOCALS": { amount: 5000, currency: "INR" } } },
        { carrier: "ALL", pol: "NHAVA SHEVA, IN", container: "20 GP", charges: { CFS: { amount: 15300,
                    currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25,
                    currency: "USD" }, TOLL: { amount: 600, currency: "INR" },
                "LASHING & CHOKING": { amount: 2500, currency: "INR" }, "HAZ STICKER": { amount: 700,
                    currency: "INR" } } },
        { carrier: "ALL", pol: "MUNDRA, IN", container: "20 GP", charges: { CFS: { amount: 17900,
                    currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25,
                    currency: "USD" }, "LASHING & CHOKING": { amount: 2000, currency: "INR" },
                "HAZ STICKER": { amount: 500, currency: "INR" }, TRANSPORTATION: { amount: 3000,
                    currency: "INR" }, LOLO: { amount: 2020, currency: "INR" }, "OTHER LOCALS": { amount: 5000,
                    currency: "INR" } } }
    ];
    db.defaultAirCharges = [
        { pol: "DEL Airport", charges: { "AIR FREIGHT": { amount: 850, currency: "INR" }, "CARTAGE": { amount: 850,
                    currency: "INR" }, "MCC": { amount: 850, currency: "INR" }, "XRAY": { amount: 850,
                    currency: "INR" }, "CUSTOM CLEARANCE": { amount: 2500, currency: "INR" },
                "AWB FEES": { amount: 500, currency: "INR" } } }
    ];
    db.defaultLclCharges = [
        { pol: "NHAVA SHEVA, IN", charges: { FREIGHT: { amount: 0, currency: "INR" }, THC: { amount: 1500,
                    currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25,
                    currency: "USD" } } }
    ];
    saveDB();
}
if (!db.exchangeRates) db.exchangeRates = { ...defaultDB.exchangeRates };
if (!db.defaultSeaCharges) db.defaultSeaCharges = [];
if (!db.defaultAirCharges) db.defaultAirCharges = [];
if (!db.defaultLclCharges) db.defaultLclCharges = [];
if (!db.carrierChargesSeaLcl) db.carrierChargesSeaLcl = [];
if (!db.carrierChargesAir) db.carrierChargesAir = [];
if (!db.rateSheet) db.rateSheet = [];
if (!db.hiddenItems) db.hiddenItems = { pol: [], pod: [], incoterms: [], containers: [], carriers: [] };
if (!db.companyName) db.companyName = defaultDB.companyName;
if (!db.companyAddress) db.companyAddress = defaultDB.companyAddress;
if (!db.defaultUser) db.defaultUser = defaultDB.defaultUser;
if (!db.theme) db.theme = "light";
if (!db.lastBackup) db.lastBackup = null;
if (!db.duplicateDetectionDays) db.duplicateDetectionDays = 30;
if (!db.containerDimensions) db.containerDimensions = JSON.parse(JSON.stringify(defaultContainerDimensions));
if (!db.navState) db.navState = { expandedCategories: ['newQuote', 'savedQuotes', 'tools', 'admin'], lastTab: 'sea' };
if (!db.carriers || db.carriers.length === 0) {
    db.carriers = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE", "Emirates SkyCargo", "Lufthansa Cargo"];
    saveDB();
}

// ==================== APPLICATION STATE ====================
let editingRecord = null;
let currentAddChargeMode = '';
let pendingDeleteCallback = null;
let currentEmailData = null;
let chargesOrder = { sea: null, air: null, lcl: null };
let searchTimeout = null;
let pendingTabSwitch = null;
let hasUnsavedChanges = { sea: false, air: false, lcl: false };
let rateSheetFilter = 'all';
let rateSheetPage = 1;
let rateSheetPerPage = 20;
let currentMasterTab = 'pol';
let masterPage = 1;
let masterPerPage = 20;
let masterSearch = '';
let masterShowMode = 'visible';
let masterSort = 'alpha-asc';
let backupFolderHandle = null;
let autoBackupInterval = null;

// ==================== DATABASE OPERATIONS ====================
function saveDB() {
    try {
        localStorage.setItem('freight_db_v20', JSON.stringify(db));
        return true;
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        alert('Storage limit reached! Please export your data and clear some old records.');
        return false;
    }
}

// ==================== NAVIGATION ====================
function toggleCategory(categoryId) {
    const items = document.getElementById(`cat-${categoryId}`);
    const arrow = document.getElementById(`arrow-${categoryId}`);
    const header = arrow.parentElement;
    if (items.classList.contains('collapsed')) {
        items.classList.remove('collapsed');
        header.classList.remove('collapsed');
        if (!db.navState.expandedCategories.includes(categoryId)) db.navState.expandedCategories.push(categoryId);
    } else {
        items.classList.add('collapsed');
        header.classList.add('collapsed');
        db.navState.expandedCategories = db.navState.expandedCategories.filter(c => c !== categoryId);
    }
    saveDB();
}

function restoreNavState() {
    db.navState.expandedCategories.forEach(catId => {
        const items = document.getElementById(`cat-${catId}`);
        const arrow = document.getElementById(`arrow-${catId}`);
        if (items && arrow) {
            items.classList.remove('collapsed');
            arrow.parentElement.classList.remove('collapsed');
        }
    });
    ['newQuote', 'savedQuotes', 'tools', 'admin'].forEach(catId => {
        if (!db.navState.expandedCategories.includes(catId)) {
            const items = document.getElementById(`cat-${catId}`);
            const arrow = document.getElementById(`arrow-${catId}`);
            if (items && arrow) {
                items.classList.add('collapsed');
                arrow.parentElement.classList.add('collapsed');
            }
        }
    });
}

document.querySelectorAll('.tab-btn-vertical').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const targetTab = this.dataset.tab;
        const currentTab = document.querySelector('.tab-panel.active')?.id;
        if (['sea', 'air', 'lcl'].includes(currentTab) && hasUnsavedChanges[currentTab] && currentTab !==
            targetTab) {
            e.preventDefault();
            e.stopPropagation();
            pendingTabSwitch = targetTab;
            openModal('tabSwitchModal');
            return;
        }
        switchToTab(targetTab);
    });
});

function switchToTab(targetTab) {
    document.querySelectorAll('.tab-btn-vertical').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn-vertical[data-tab="${targetTab}"]`);
    if (btn) btn.classList.add('active');
    const panel = document.getElementById(targetTab);
    if (panel) panel.classList.add('active');
    db.navState.lastTab = targetTab;
    saveDB();
    if (targetTab === 'drafts') renderRecords('drafts');
    if (targetTab === 'rates') renderRecords('rates');
    if (targetTab === 'ratesheet') { renderRateSheet();
        updateExpiryDashboard(); }
    if (targetTab === 'followup') renderFollowups();
    if (targetTab === 'dashboard') renderDashboard();
    if (targetTab === 'database') renderDatabase();
    if (targetTab === 'measurement') renderContainerDimensions();
    if (targetTab === 'localcharges') {
        renderDefaultChargesMaster('sea');
        renderDefaultChargesMaster('air');
        renderDefaultChargesMaster('lcl');
        renderCarrierChargesMaster('sealcl');
        renderCarrierChargesMaster('air');
    }
    editingRecord = null;
    chargesOrder = { sea: null, air: null, lcl: null };
}

function openModal(id) { document.getElementById(id).classList.add('active'); }

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

document.getElementById('tabSwitchSaveBtn').addEventListener('click', function() {
    if (pendingTabSwitch) {
        const currentTab = document.querySelector('.tab-panel.active')?.id;
        if (currentTab && ['sea', 'air', 'lcl'].includes(currentTab)) saveRecord(currentTab, 'drafts');
        hasUnsavedChanges = { sea: false, air: false, lcl: false };
        closeModal('tabSwitchModal');
        switchToTab(pendingTabSwitch);
        pendingTabSwitch = null;
    }
});

document.getElementById('tabSwitchDiscardBtn').addEventListener('click', function() {
    if (pendingTabSwitch) {
        const currentTab = document.querySelector('.tab-panel.active')?.id;
        if (currentTab && ['sea', 'air', 'lcl'].includes(currentTab)) clearForm(currentTab);
        hasUnsavedChanges = { sea: false, air: false, lcl: false };
        closeModal('tabSwitchModal');
        switchToTab(pendingTabSwitch);
        pendingTabSwitch = null;
    }
});

function markUnsaved(mode) { hasUnsavedChanges[mode] = true; }

// ==================== DARK MODE ====================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('.theme-toggle').textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    db.theme = theme;
    saveDB();
}

function toggleDarkMode() { applyTheme(db.theme === 'dark' ? 'light' : 'dark'); }

// ==================== KEYBOARD SHORTCUTS ====================
function showShortcutHint(text) {
    const hint = document.getElementById('shortcutHint');
    hint.textContent = text;
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 2000);
}
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
            e.preventDefault();
            const a = document.querySelector('.tab-panel.active');
            if (a && ['sea', 'air', 'lcl'].includes(a.id)) { saveRecord(a.id, 'drafts');
                showShortcutHint('💾 Saved'); }
        } else if (e.key === 'p') {
            e.preventDefault();
            const a = document.querySelector('.tab-panel.active');
            if (a && ['sea', 'air', 'lcl'].includes(a.id)) { downloadPDF(a.id);
                showShortcutHint('📄 PDF'); }
        } else if (e.key === 'n') {
            e.preventDefault();
            const a = document.querySelector('.tab-panel.active');
            if (a && ['sea', 'air', 'lcl'].includes(a.id)) { clearFormWithConfirm(a.id);
                showShortcutHint('✨ New'); }
        }
    }
    if (e.key === 'Escape') { document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active')); }
});

// ==================== INPUT FOCUS HIGHLIGHT ====================
function highlightInput(el) {
    el.classList.add('input-focus-red');
}

function unhighlightInput(el) {
    el.classList.remove('input-focus-red');
}

// ==================== CURRENCY HELPERS ====================
function getCurrencyOptions(selected) {
    if (!selected) selected = 'USD';
    return Object.keys(db.exchangeRates).map(c =>
        `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`
    ).join('');
}

function toINR(amount, currency) {
    if (!amount || isNaN(amount)) return 0;
    const rate = db.exchangeRates[currency] || 1;
    return Math.round(parseFloat(amount) * rate * 100) / 100;
}

function formatINR(n) {
    return '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ==================== QUOTE NUMBER GENERATION ====================
function generateQuoteNumber(mode) {
    const map = { sea: 'S', air: 'A', lcl: 'L' };
    const now = new Date();
    const base =
        `RQ-${map[mode]}-${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    const all = [...db.rates[mode], ...db.drafts[mode]];
    let seq = 1;
    let qn = base;
    while (all.some(r => r.quoteNumber === qn)) { seq++;
        qn = `${base}-${String(seq).padStart(2,'0')}`; }
    return qn;
}

function generateRRNumber() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `RR${d}${m}${y}-${h}${min}`;
}

// ==================== VALIDITY CHECK ====================
function getValidityStatus(validityDate) {
    if (!validityDate) return { status: 'none', text: '', class: '' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const valid = new Date(validityDate);
    valid.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((valid - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'expired', text: `Expired ${Math.abs(diffDays)}d ago`,
        class: 'validity-expired' };
    if (diffDays <= 3) return { status: 'warning', text: `Expires in ${diffDays}d`, class: 'validity-warning' };
    return { status: 'ok', text: `Valid ${diffDays}d`, class: 'validity-ok' };
}

// ==================== DUPLICATE DETECTION ====================
function checkDuplicate(mode, client, pol, pod) {
    if (!client || !pol || !pod) return null;
    const daysBack = db.duplicateDetectionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const allRecords = [...db.rates[mode], ...db.drafts[mode]];
    const duplicates = allRecords.filter(r => {
        if (!r.timestamp) return false;
        const recDate = new Date(r.timestamp);
        if (recDate < cutoffDate) return false;
        return (r.client || '').toLowerCase() === client.toLowerCase() &&
            (r.pol || '').toLowerCase() === pol.toLowerCase() &&
            (r.pod || '').toLowerCase() === pod.toLowerCase();
    });
    if (duplicates.length > 0) {
        const latest = duplicates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        return {
            count: duplicates.length,
            lastQuote: latest.quoteNumber,
            lastDate: new Date(latest.timestamp).toLocaleDateString('en-IN'),
            lastAmount: formatINR(latest.totalSellINR)
        };
    }
    return null;
}

// ==================== AIR CHARGE AUTO-CALCULATION ====================
function calculateAirCharges() {
    const weight = parseFloat(document.getElementById('air-weight')?.value) || 0;
    const pallets = parseFloat(document.getElementById('air-pallets')?.value) || 0;
    ['AIR FREIGHT', 'CARTAGE', 'MCC', 'XRAY'].forEach(charge => {
        const el = document.getElementById(`air-amt-${charge.replace(/[^A-Z0-9]/gi,'_')}`);
        if (el && !el.value) { el.value = 850;
            recalcCharge('air', charge); }
    });
    if (weight > 0) {
        const el = document.getElementById('air-amt-GATE_PASS');
        if (el && !el.value) { el.value = Math.max(weight * 3, 850).toFixed(2);
            recalcCharge('air', 'GATE PASS'); }
    }
    if (pallets > 0) {
        const el = document.getElementById('air-amt-PALLETISATION');
        if (el && !el.value) { el.value = (pallets * 1450).toFixed(2);
            recalcCharge('air', 'PALLETISATION'); }
    }
}

// ==================== LCL PER CBM ====================
function updateLCLPerCBM() {
    const volume = parseFloat(document.getElementById('lcl-volume')?.value) || 0;
    if (volume <= 0) return;
    recalcTotal('lcl');
}

// ==================== CHARGES UI WITH DRAG & DROP ====================
function buildChargesGrid(mode, savedCharges = {}, customOrder = null) {
    const grid = document.getElementById(`${mode}-charges-grid`);
    let html = '';
    const categories = chargeCategories[mode];
    let orderedCategories = {};
    Object.entries(categories).forEach(([cat, charges]) => {
        orderedCategories[cat] = [...charges];
    });
    if (customOrder) {
        orderedCategories = {};
        Object.entries(customOrder).forEach(([cat, charges]) => { orderedCategories[cat] = charges; });
        Object.entries(categories).forEach(([cat, charges]) => {
            if (!orderedCategories[cat]) orderedCategories[cat] = [];
            charges.forEach(ch => {
                if (!Object.values(orderedCategories).flat().includes(ch)) orderedCategories[cat].push(
                ch);
            });
        });
    }
    Object.entries(orderedCategories).forEach(([category, charges]) => {
        if (charges.length === 0) return;
        html +=
            `<div class="charge-category-header" data-category="${category}" ondragover="handleDragOver(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event,'${mode}','${category}')">${category}</div>`;
        charges.forEach(charge => {
            const data = savedCharges[charge] || { amount: '', currency: 'INR', buyAmount: '',
                buyCurrency: 'INR', basis: 'Normal' };
            const safe = charge.replace(/[^A-Z0-9]/gi, '_');
            let placeholder = "0.00";
            if (mode === 'air' && airChargePlaceholders[charge]) placeholder = airChargePlaceholders[
            charge];
            if (mode === 'lcl' && (charge === 'FREIGHT' || charge === 'THC')) placeholder =
                "Per CBM rate";
            const isFreight = charge === 'FREIGHT' || charge === 'AIR FREIGHT';
            const freightClass = isFreight ? ' freight-row' : '';
            let basisHtml = '';
            let basisVal = 'Normal';
            if (mode === 'air') {
                if (['AIR FREIGHT', 'CARTAGE', 'MCC', 'XRAY'].includes(charge)) {
                    basisVal = 'Per KGS';
                } else if (charge === 'GATE PASS') {
                    basisVal = 'Per KGS × 3';
                } else {
                    basisVal = data.basis || 'Normal';
                }
            }
            if (mode === 'lcl') {
                if (charge === 'FREIGHT' || charge === 'THC') {
                    basisVal = 'Per CBM';
                } else {
                    basisVal = data.basis || 'Normal';
                }
            }
            if (mode === 'air' || mode === 'lcl') {
                const basis = basisVal;
                let opts = '';
                if (mode === 'air') {
                    if (charge === 'GATE PASS') {
                        opts = `<option value="Normal">Normal</option>
                                <option value="Per KGS">Per KGS</option>
                                <option value="Per KGS × 3" selected>Per KGS × 3</option>
                                <option value="Per CBM">Per CBM</option>`;
                    } else {
                        opts = `<option value="Normal" ${basis==='Normal'?'selected':''}>Normal</option>
                                <option value="Per KGS" ${basis==='Per KGS'?'selected':''}>Per KGS</option>
                                <option value="Per CBM" ${basis==='Per CBM'?'selected':''}>Per CBM</option>`;
                    }
                } else {
                    opts = `<option value="Normal" ${basis==='Normal'?'selected':''}>Normal</option>
                            <option value="Per KGS" ${basis==='Per KGS'?'selected':''}>Per KGS</option>
                            <option value="Per CBM" ${basis==='Per CBM'?'selected':''}>Per CBM</option>`;
                }
                basisHtml =
                    `<select class="charge-basis" onchange="recalcCharge('${mode}','${charge}')">${opts}</select>`;
            }
            let curOpts = '';
            if (mode === 'sea' && isFreight) {
                curOpts = getCurrencyOptions('USD');
            } else if (mode === 'lcl' && isFreight) {
                curOpts = getCurrencyOptions('USD');
            } else {
                curOpts = getCurrencyOptions(data.currency || 'INR');
            }
            let buyCurOpts = getCurrencyOptions(data.buyCurrency || 'INR');
            if ((mode === 'sea' || mode === 'lcl') && isFreight) {
                buyCurOpts = getCurrencyOptions('USD');
            }
            html += `<div class="charge-row${freightClass}" data-charge="${charge}" data-category="${category}" 
                        draggable="true" 
                        ondragstart="handleDragStart(event,'${mode}','${charge}')" 
                        ondragover="handleDragOver(event)" 
                        ondragenter="handleDragEnterRow(event)" 
                        ondragleave="handleDragLeaveRow(event)" 
                        ondrop="handleDropRow(event,'${mode}','${charge}')">
                        <span class="charge-name">
                            <span class="charge-name-wrap">
                                <span>${charge}</span>
                            </span>
                        </span>
                        <input type="text" step="0.01" class="sell-amt" id="${mode}-amt-${safe}" 
                            value="${data.amount||''}" placeholder="${placeholder}" 
                            oninput="recalcCharge('${mode}','${charge}')" 
                            onblur="evaluateFormula(this,'${mode}','${charge}')"
                            onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                        <select class="sell-cur" id="${mode}-cur-${safe}" 
                            onchange="recalcCharge('${mode}','${charge}')">
                            ${curOpts}
                        </select>
                        <input type="number" step="0.01" class="buy-input" id="${mode}-buyAmt-${safe}" 
                            value="${data.buyAmount||''}" placeholder="0.00" 
                            oninput="recalcCharge('${mode}','${charge}')"
                            onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                        <select class="buy-select" id="${mode}-buyCur-${safe}" 
                            onchange="recalcCharge('${mode}','${charge}')">
                            ${buyCurOpts}
                        </select>
                        <span class="charge-inr" id="${mode}-inr-${safe}">—</span>
                        <span class="charge-buy-inr" id="${mode}-buyInr-${safe}">—</span>
                        <span class="charge-margin" id="${mode}-margin-${safe}">—</span>
                        <span class="charge-margin" id="${mode}-marginPct-${safe}">—</span>
                        ${basisHtml}
                        <button class="charge-delete-btn" onclick="removeChargeRow('${mode}','${charge}')">×</button>
                    </div>`;
        });
    });
    grid.innerHTML = html;
    recalcTotal(mode);
}

function evaluateFormula(input, mode, charge) {
    const val = input.value.trim();
    if (/^[\d+\-*/.()\s]+$/.test(val)) {
        try {
            const result = Function('"use strict"; return (' + val + ')')();
            if (!isNaN(result) && isFinite(result)) { input.value = result;
                recalcCharge(mode, charge); }
        } catch (e) {}
    }
}

let dragData = { mode: null, charge: null, sourceCategory: null };

function handleDragStart(e, mode, charge) {
    dragData = { mode, charge };
    const row = e.target.closest('.charge-row');
    dragData.sourceCategory = row?.getAttribute('data-category');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', charge);
    setTimeout(() => row?.classList.add('dragging'), 0);
}

function handleDragOver(e) { e.preventDefault();
    e.dataTransfer.dropEffect = 'move'; }

function handleDragEnter(e) {
    e.preventDefault();
    const header = e.target.closest('.charge-category-header');
    if (header) header.classList.add('drag-over');
}

function handleDragLeave(e) {
    const header = e.target.closest('.charge-category-header');
    if (header) header.classList.remove('drag-over');
}

function handleDragEnterRow(e) {
    e.preventDefault();
    const row = e.target.closest('.charge-row');
    if (row) row.classList.add('drag-over-row');
}

function handleDragLeaveRow(e) {
    const row = e.target.closest('.charge-row');
    if (row) row.classList.remove('drag-over-row');
}

function handleDrop(e, mode, targetCategory) {
    e.preventDefault();
    const header = e.target.closest('.charge-category-header');
    if (header) header.classList.remove('drag-over');
    if (!dragData.charge || dragData.mode !== mode) return;
    moveChargeToCategory(mode, dragData.charge, dragData.sourceCategory, targetCategory);
    dragData = { mode: null, charge: null, sourceCategory: null };
}

function handleDropRow(e, mode, targetCharge) {
    e.preventDefault();
    const row = e.target.closest('.charge-row');
    if (row) row.classList.remove('drag-over-row');
    if (!dragData.charge || dragData.mode !== mode || dragData.charge === targetCharge) return;
    moveChargeBefore(mode, dragData.charge, dragData.sourceCategory, targetCharge, targetCharge);
    dragData = { mode: null, charge: null, sourceCategory: null };
}

function getCurrentChargesOrder(mode) {
    const grid = document.getElementById(`${mode}-charges-grid`);
    const order = {};
    let currentCategory = null;
    grid.childNodes.forEach(node => {
        if (node.classList?.contains('charge-category-header')) {
            currentCategory = node.getAttribute('data-category');
            if (!order[currentCategory]) order[currentCategory] = [];
        } else if (node.classList?.contains('charge-row')) {
            const charge = node.getAttribute('data-charge');
            const cat = node.getAttribute('data-category');
            if (!order[cat]) order[cat] = [];
            order[cat].push(charge);
        }
    });
    return order;
}

function moveChargeToCategory(mode, charge, fromCategory, toCategory) {
    const currentOrder = getCurrentChargesOrder(mode);
    if (fromCategory && currentOrder[fromCategory]) currentOrder[fromCategory] = currentOrder[fromCategory].filter(
        c => c !== charge);
    if (!currentOrder[toCategory]) currentOrder[toCategory] = [];
    currentOrder[toCategory].push(charge);
    chargesOrder[mode] = currentOrder;
    buildChargesGrid(mode, getCurrentChargesData(mode), chargesOrder[mode]);
}

function moveChargeBefore(mode, charge, fromCategory, targetCharge, targetCategory) {
    const currentOrder = getCurrentChargesOrder(mode);
    if (fromCategory && currentOrder[fromCategory]) currentOrder[fromCategory] = currentOrder[fromCategory].filter(
        c => c !== charge);
    if (!currentOrder[targetCategory]) currentOrder[targetCategory] = [];
    const idx = currentOrder[targetCategory].indexOf(targetCharge);
    if (idx >= 0) currentOrder[targetCategory].splice(idx, 0, charge);
    else currentOrder[targetCategory].push(charge);
    chargesOrder[mode] = currentOrder;
    buildChargesGrid(mode, getCurrentChargesData(mode), chargesOrder[mode]);
}

function getCurrentChargesData(mode) {
    const data = {};
    document.querySelectorAll(`#${mode}-charges-grid .charge-row`).forEach(row => {
        const charge = row.getAttribute('data-charge');
        const safe = charge.replace(/[^A-Z0-9]/gi, '_');
        const basisEl = row.querySelector('.charge-basis');
        data[charge] = {
            amount: document.getElementById(`${mode}-amt-${safe}`)?.value || '',
            currency: document.getElementById(`${mode}-cur-${safe}`)?.value || 'INR',
            buyAmount: document.getElementById(`${mode}-buyAmt-${safe}`)?.value || '',
            buyCurrency: document.getElementById(`${mode}-buyCur-${safe}`)?.value || 'INR',
            basis: basisEl ? basisEl.value : 'Normal'
        };
    });
    return data;
}

function removeChargeRow(mode, charge) {
    const row = document.querySelector(`#${mode}-charges-grid [data-charge="${charge}"]`);
    if (row) { row.remove();
        recalcTotal(mode); }
}

function recalcCharge(mode, charge) {
    const safe = charge.replace(/[^A-Z0-9]/gi, '_');
    let sellAmt = parseFloat(document.getElementById(`${mode}-amt-${safe}`)?.value) || 0;
    let buyAmt = parseFloat(document.getElementById(`${mode}-buyAmt-${safe}`)?.value) || 0;
    const sellCur = document.getElementById(`${mode}-cur-${safe}`)?.value || 'INR';
    const buyCur = document.getElementById(`${mode}-buyCur-${safe}`)?.value || 'INR';
    if (mode === 'air' || mode === 'lcl') {
        const row = document.querySelector(`#${mode}-charges-grid .charge-row[data-charge="${charge}"]`);
        const basisEl = row ? row.querySelector('.charge-basis') : null;
        if (basisEl) {
            const basis = basisEl.value;
            if (basis === 'Per KGS') {
                const weight = parseFloat(document.getElementById(`${mode}-weight`)?.value) || 0;
                sellAmt *= weight;
                buyAmt *= weight;
            } else if (basis === 'Per CBM') {
                const volume = parseFloat(document.getElementById(`${mode}-volume`)?.value) || 0;
                sellAmt *= volume;
                buyAmt *= volume;
            } else if (basis === 'Per KGS × 3') {
                const weight = parseFloat(document.getElementById(`${mode}-weight`)?.value) || 0;
                sellAmt *= weight * 3;
                buyAmt *= weight * 3;
            }
        }
    }
    const sellINR = toINR(sellAmt, sellCur);
    const buyINR = toINR(buyAmt, buyCur);
    const margin = sellINR - buyINR;
    const marginPct = sellINR > 0 ? (margin / sellINR) * 100 : 0;
    const inrEl = document.getElementById(`${mode}-inr-${safe}`);
    const buyInrEl = document.getElementById(`${mode}-buyInr-${safe}`);
    const marginEl = document.getElementById(`${mode}-margin-${safe}`);
    const marginPctEl = document.getElementById(`${mode}-marginPct-${safe}`);
    if (inrEl) inrEl.textContent = sellAmt ? formatINR(sellINR) : '—';
    if (buyInrEl) buyInrEl.textContent = buyAmt ? formatINR(buyINR) : '—';
    if (marginEl) {
        marginEl.textContent = (sellAmt || buyAmt) ? formatINR(margin) : '—';
        marginEl.style.color = margin < 0 ? 'var(--danger)' : margin > 0 ? 'var(--success)' : 'var(--text)';
    }
    if (marginPctEl) marginPctEl.textContent = sellINR > 0 ? marginPct.toFixed(2) + '%' : 'N/A';
    recalcTotal(mode);
}

function recalcTotal(mode) {
    let totalSell = 0,
        totalBuy = 0;
    document.querySelectorAll(`#${mode}-charges-grid .charge-row`).forEach(row => {
        const charge = row.getAttribute('data-charge');
        const safe = charge.replace(/[^A-Z0-9]/gi, '_');
        let sellAmt = parseFloat(document.getElementById(`${mode}-amt-${safe}`)?.value) || 0;
        const sellCur = document.getElementById(`${mode}-cur-${safe}`)?.value || 'INR';
        let buyAmt = parseFloat(document.getElementById(`${mode}-buyAmt-${safe}`)?.value) || 0;
        const buyCur = document.getElementById(`${mode}-buyCur-${safe}`)?.value || 'INR';
        if (mode === 'air' || mode === 'lcl') {
            const basisEl = row.querySelector('.charge-basis');
            if (basisEl) {
                const basis = basisEl.value;
                if (basis === 'Per KGS') {
                    const weight = parseFloat(document.getElementById(`${mode}-weight`)?.value) || 0;
                    sellAmt *= weight;
                    buyAmt *= weight;
                } else if (basis === 'Per CBM') {
                    const volume = parseFloat(document.getElementById(`${mode}-volume`)?.value) || 0;
                    sellAmt *= volume;
                    buyAmt *= volume;
                } else if (basis === 'Per KGS × 3') {
                    const weight = parseFloat(document.getElementById(`${mode}-weight`)?.value) || 0;
                    sellAmt *= weight * 3;
                    buyAmt *= weight * 3;
                }
            }
        }
        if (mode === 'lcl' && (charge === 'FREIGHT' || charge === 'THC')) {
            const volume = parseFloat(document.getElementById('lcl-volume')?.value) || 0;
            if (volume > 0) {
                const basisEl = row.querySelector('.charge-basis');
                if (!basisEl || basisEl.value === 'Normal') {
                    sellAmt = sellAmt * volume;
                    buyAmt = buyAmt * volume;
                }
            }
        }
        totalSell += toINR(sellAmt, sellCur);
        totalBuy += toINR(buyAmt, buyCur);
    });
    const margin = totalSell - totalBuy;
    const marginPct = totalSell > 0 ? (margin / totalSell) * 100 : 0;
    document.getElementById(`${mode}-totalSell`).textContent = formatINR(totalSell);
    document.getElementById(`${mode}-totalBuy`).textContent = formatINR(totalBuy);
    document.getElementById(`${mode}-totalMargin`).textContent = formatINR(margin);
    document.getElementById(`${mode}-totalMarginPct`).textContent = totalSell > 0 ? marginPct.toFixed(2) + '%' :
    'N/A';
    const warningEl = document.getElementById(`${mode}-margin-warning`);
    if (warningEl) {
        if (margin < 0 && (totalSell > 0 || totalBuy > 0)) warningEl.classList.add('show');
        else warningEl.classList.remove('show');
    }
}

// ==================== ADD CUSTOM CHARGE ====================
function openAddChargeModal(mode) {
    currentAddChargeMode = mode;
    document.getElementById('addChargeTitle').textContent = `Add Charge — ${mode.toUpperCase()}`;
    document.getElementById('new-charge-name').value = '';
    document.getElementById('new-charge-sell-amt').value = '';
    document.getElementById('new-charge-buy-amt').value = '';
    const defaultCur = (mode === 'sea' || mode === 'lcl') ? 'USD' : 'INR';
    document.getElementById('new-charge-sell-cur').innerHTML = getCurrencyOptions(defaultCur);
    document.getElementById('new-charge-buy-cur').innerHTML = getCurrencyOptions('INR');
    openModal('addChargeModal');
}

document.getElementById('addChargeSaveBtn').addEventListener('click', function() {
    const chargeName = document.getElementById('new-charge-name').value.trim().toUpperCase();
    if (!chargeName) { alert('Enter charge name'); return; }
    const grid = document.getElementById(`${currentAddChargeMode}-charges-grid`);
    if (grid.querySelector(`[data-charge="${chargeName}"]`)) { alert('Charge exists!'); return; }
    const data = getCurrentChargesData(currentAddChargeMode);
    data[chargeName] = {
        amount: document.getElementById('new-charge-sell-amt').value,
        currency: document.getElementById('new-charge-sell-cur').value,
        buyAmount: document.getElementById('new-charge-buy-amt').value,
        buyCurrency: document.getElementById('new-charge-buy-cur').value,
        basis: 'Normal'
    };
    const order = chargesOrder[currentAddChargeMode] || getCurrentChargesOrder(currentAddChargeMode);
    const lastCat = Object.keys(order).pop() || "Other Charges";
    if (!order[lastCat]) order[lastCat] = [];
    order[lastCat].push(chargeName);
    chargesOrder[currentAddChargeMode] = order;
    if (!defaultCharges[currentAddChargeMode].includes(chargeName)) defaultCharges[currentAddChargeMode].push(
        chargeName);
    buildChargesGrid(currentAddChargeMode, data, chargesOrder[currentAddChargeMode]);
    closeModal('addChargeModal');
});

// ==================== CLEAR FORM ====================
function clearFormWithConfirm(mode) {
    if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) clearForm(mode);
}

// ==================== DELETE CONFIRMATION ====================
function showDeleteConfirm(message, callback, showLostReason = false) {
    document.getElementById('deleteMessage').innerHTML = message;
    const lostBox = document.getElementById('lost-reason-box');
    if (showLostReason) lostBox.classList.add('show');
    else lostBox.classList.remove('show');
    pendingDeleteCallback = callback;
    openModal('deleteModal');
}
document.getElementById('deleteConfirmBtn').addEventListener('click', function() {
    if (pendingDeleteCallback) {
        const lostReason = document.getElementById('lost-reason-select').value;
        pendingDeleteCallback(lostReason);
        pendingDeleteCallback = null;
    }
    closeModal('deleteModal');
    document.getElementById('lost-reason-select').value = '';
});

function deleteRecord(target, mode, idx) {
    const rec = db[target][mode][idx];
    showDeleteConfirm(
        `Delete quotation?<br><br><strong>${rec.client||'?'}</strong> (${rec.pol||'?'} → ${rec.pod||'?'})<br>${rec.quoteNumber||''}`,
        function() {
            try { db[target][mode].splice(idx, 1);
                saveDB();
                renderRecords(target);
                renderFollowups(); } catch (e) { alert('Error: ' + e.message); }
        }
    );
}

// ==================== AUTO-LOAD CHARGES ====================
function onCarrierChange(mode) { markUnsaved(mode);
    onCarrierPolChangeInternal(mode); }

function onPolChange(mode) { markUnsaved(mode);
    onCarrierPolChangeInternal(mode); }

function onContainerChange(mode) { markUnsaved(mode);
    onCarrierPolChangeInternal(mode); }

function onCarrierPolChangeInternal(mode) {
    const carrier = document.getElementById(`${mode}-carrier`).value;
    const pol = document.getElementById(`${mode}-pol`).value;
    const containerEl = document.getElementById(`${mode}-container`);
    const container = containerEl ? containerEl.value : '';
    if (!carrier || !pol) { buildChargesGrid(mode); return; }
    let finalCharges = {};
    if (mode === 'sea') {
        let defMatch = db.defaultSeaCharges.find(d => d.carrier === carrier && d.pol === pol && d.container ===
        container);
        if (!defMatch) defMatch = db.defaultSeaCharges.find(d => d.carrier === 'ALL' && d.pol === pol && d
            .container === container);
        if (defMatch) Object.assign(finalCharges, defMatch.charges);
        let custMatch = db.carrierChargesSeaLcl.find(c => c.mode === mode && c.carrier === carrier && c.pol ===
            pol && (c.container || '') === container);
        if (custMatch) Object.assign(finalCharges, custMatch.charges);
    } else if (mode === 'air') {
        let defMatch = db.defaultAirCharges.find(d => d.pol === pol);
        if (defMatch) Object.assign(finalCharges, defMatch.charges);
        let custMatch = db.carrierChargesAir.find(c => c.carrier === carrier && c.pol === pol);
        if (custMatch) Object.assign(finalCharges, custMatch.charges);
    } else if (mode === 'lcl') {
        let defMatch = db.defaultLclCharges.find(d => d.pol === pol);
        if (defMatch) Object.assign(finalCharges, defMatch.charges);
        let custMatch = db.carrierChargesSeaLcl.find(c => c.mode === mode && c.carrier === carrier && c.pol ===
            pol);
        if (custMatch) Object.assign(finalCharges, custMatch.charges);
    }
    buildChargesGrid(mode, finalCharges);
}

// ==================== SEA AUTO RATE SELECTION ====================
function checkSeaRateAuto() {
    const mode = 'sea';
    const pol = document.getElementById('sea-pol')?.value;
    const pod = document.getElementById('sea-pod')?.value;
    const container = document.getElementById('sea-container')?.value;
    const commodity = document.getElementById('sea-commodity')?.value;
    if (!pol || !pod || !container) return;
    const matches = db.rateSheet.filter(r =>
        r.freightType === 'SEA' &&
        r.pol === pol &&
        r.pod === pod &&
        (r.containerType === container || r.containerType === '' || !r.containerType) &&
        parseFloat(r.freightAmount) > 0
    );
    if (matches.length === 0) return;
    showAutoRateModal(matches, 'sea');
}

function showAutoRateModal(matches, mode) {
    const body = document.getElementById('autoRateBody');
    let html = `<p style="margin-bottom:12px;color:var(--text-light);">Found <strong>${matches.length}</strong> matching rate(s) for this route. Click on a rate to apply it.</p>
                <table class="master-table">
                    <thead><tr><th>Carrier</th><th>Container</th><th>Amount</th><th>Currency</th><th>Valid To</th><th>Action</th></tr></thead>
                    <tbody>`;
    matches.forEach((r, idx) => {
        const expiry = getExpiryStatus(r.validTo);
        const statusClass = expiry.status === 'expired' ? 'status-expired' :
            expiry.status === 'expiring' ? 'status-expiring' : 'status-active';
        html += `<tr>
                    <td><strong>${r.carrierName}</strong></td>
                    <td>${r.containerType || '-'}</td>
                    <td>${Number(r.freightAmount).toLocaleString('en-IN')}</td>
                    <td>${r.currency || 'INR'}</td>
                    <td><span class="status-badge ${statusClass}">${r.validTo || '-'}</span></td>
                    <td><button class="btn btn-sm btn-success" onclick="applyAutoRate(${idx},'${mode}')">✅ Apply</button></td>
                </tr>`;
    });
    html += `</tbody></table>
            <div style="margin-top:12px;text-align:right;">
                <button class="btn btn-clear" onclick="closeModal('autoRateModal')">Close</button>
            </div>`;
    body.innerHTML = html;
    window._autoRateMatches = matches;
    window._autoRateMode = mode;
    openModal('autoRateModal');
}

function applyAutoRate(idx, mode) {
    const matches = window._autoRateMatches;
    if (!matches || !matches[idx]) return;
    const rate = matches[idx];
    const freightKey = 'FREIGHT';
    const safe = freightKey.replace(/[^A-Z0-9]/gi, '_');
    const amtEl = document.getElementById(`${mode}-amt-${safe}`);
    const curEl = document.getElementById(`${mode}-cur-${safe}`);
    const carrierEl = document.getElementById(`${mode}-carrier`);
    const buyAmtEl = document.getElementById(`${mode}-buyAmt-${safe}`);
    if (buyAmtEl) buyAmtEl.value = rate.freightAmount;
    if (curEl) curEl.value = rate.currency || 'USD';
    if (carrierEl && rate.carrierName) {
        let found = false;
        for (let opt of carrierEl.options) {
            if (opt.value === rate.carrierName) { found = true; break; }
        }
        if (!found) {
            const opt = document.createElement('option');
            opt.value = rate.carrierName;
            opt.text = rate.carrierName;
            carrierEl.add(opt);
        }
        carrierEl.value = rate.carrierName;
    }
    recalcCharge(mode, freightKey);
    closeModal('autoRateModal');
    alert(`✅ Rate applied from ${rate.carrierName} - ${rate.currency} ${rate.freightAmount}`);
}

// ==================== FORM DATA COLLECTION ====================
function getFormData(mode) {
    const data = {
        mode: mode.toUpperCase(),
        timestamp: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    data.autoDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const fields = ['client', 'carrier', 'pol', 'pod', 'incoterm', 'commodity', 'weight', 'transit', 'validityDate'];
    if (mode === 'sea') fields.push('container');
    if (mode === 'air' || mode === 'lcl') fields.push('volume');
    if (mode === 'air') fields.push('pallets');
    fields.forEach(f => {
        const el = document.getElementById(`${mode}-${f}`);
        if (el && el.value) data[f] = el.value;
    });
    const remarksEl = document.getElementById(`${mode}-remarks`);
    if (remarksEl && remarksEl.value) data.remarks = remarksEl.value;
    data.charges = {};
    document.querySelectorAll(`#${mode}-charges-grid .charge-row`).forEach(row => {
        const charge = row.getAttribute('data-charge');
        const safe = charge.replace(/[^A-Z0-9]/gi, '_');
        let sellAmt = parseFloat(document.getElementById(`${mode}-amt-${safe}`)?.value) || 0;
        const sellCur = document.getElementById(`${mode}-cur-${safe}`)?.value || 'INR';
        let buyAmt = parseFloat(document.getElementById(`${mode}-buyAmt-${safe}`)?.value) || 0;
        const buyCur = document.getElementById(`${mode}-buyCur-${safe}`)?.value || 'INR';
        const basisEl = row.querySelector('.charge-basis');
        const basis = basisEl ? basisEl.value : 'Normal';
        if (sellAmt > 0 || buyAmt > 0) {
            data.charges[charge] = {
                amount: sellAmt,
                currency: sellCur,
                buyAmount: buyAmt,
                buyCurrency: buyCur,
                basis: basis
            };
        }
    });
    data.chargesOrder = chargesOrder[mode] || getCurrentChargesOrder(mode);
    data.totalSellINR = 0;
    data.totalBuyINR = 0;
    Object.values(data.charges).forEach(c => {
        data.totalSellINR += toINR(c.amount, c.currency);
        data.totalBuyINR += toINR(c.buyAmount, c.buyCurrency);
    });
    data.marginINR = data.totalSellINR - data.totalBuyINR;
    data.marginPct = data.totalSellINR > 0 ? (data.marginINR / data.totalSellINR) * 100 : 0;
    return data;
}

// ==================== SAVE / QUOTE ====================
function saveRecord(mode, target, status = 'DRAFT') {
    const data = getFormData(mode);
    if (!data.client && Object.keys(data.charges).length === 0) return alert(
        'Fill Client Name or at least one charge.');
    if (data.marginINR < 0 && (data.totalSellINR > 0 || data.totalBuyINR > 0)) {
        if (!confirm('⚠️ WARNING: This quote has a negative margin (loss). Do you want to proceed?')) return;
    }
    const dup = checkDuplicate(mode, data.client, data.pol, data.pod);
    if (dup && !editingRecord) {
        const alertEl = document.getElementById(`${mode}-dup-alert`);
        const msgEl = document.getElementById(`${mode}-dup-msg`);
        msgEl.innerHTML =
            `This client + route was quoted <strong>${dup.count} time(s)</strong> in last ${db.duplicateDetectionDays} days. Last: ${dup.lastQuote} on ${dup.lastDate} for ${dup.lastAmount}.`;
        alertEl.classList.add('show');
        setTimeout(() => alertEl.classList.remove('show'), 10000);
    }
    data.status = status;
    if (editingRecord && editingRecord.target === target && editingRecord.mode === mode) {
        data.quoteNumber = editingRecord.originalQN || generateQuoteNumber(mode);
        data.lastModified = new Date().toISOString();
        db[target][mode][editingRecord.index] = data;
        editingRecord = null;
    } else {
        if (target === 'rates') data.quoteNumber = generateQuoteNumber(mode);
        else data.quoteNumber = 'DRAFT-' + Date.now();
        db[target][mode].push(data);
    }
    if (target === 'drafts' && data.carrier && data.pol) upsertCarrierCharges(mode, data);
    updateRateSheetFromQuote(data, mode);
    if (!saveDB()) return;
    document.getElementById(`${mode}-qn-value`).textContent = data.quoteNumber;
    document.getElementById(`${mode}-qn-box`).classList.add('show');
    hasUnsavedChanges[mode] = false;
    alert(target === 'rates' ? `Quotation finalized!\nQuote No: ${data.quoteNumber}` : 'Saved as Draft.');
    if (target === 'drafts') renderRecords('drafts');
    if (target === 'rates') renderRecords('rates');
    renderFollowups();
}

function updateRateSheetFromQuote(data, mode) {
    const freightKey = mode === 'air' ? 'AIR FREIGHT' : 'FREIGHT';
    const freight = data.charges && data.charges[freightKey];
    if (!freight) return;
    const freightAmount = parseFloat(freight.amount) || 0;
    const freightCurrency = freight.currency || 'INR';
    if (freightAmount === 0) return;
    const carrier = data.carrier || '';
    const pol = data.pol || '';
    const pod = data.pod || '';
    const container = data.container || '';
    const freightType = mode.toUpperCase();
    const existing = db.rateSheet.find(r =>
        r.carrierName === carrier &&
        r.freightType === freightType &&
        r.pol === pol &&
        r.pod === pod &&
        r.containerType === container &&
        parseFloat(r.freightAmount) === freightAmount &&
        r.currency === freightCurrency
    );
    if (existing) return;
    const rateData = {
        id: 'RS-' + Date.now(),
        carrierName: carrier,
        freightType: freightType,
        pol: pol,
        pod: pod,
        containerType: container,
        currency: freightCurrency,
        freightAmount: freightAmount,
        transitTime: data.transit ? `${data.transit} days` : '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: data.validityDate || '',
        remarks: `Auto-saved from quote ${data.quoteNumber || 'N/A'}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'quote',
        quoteNumber: data.quoteNumber
    };
    db.rateSheet.push(rateData);
    saveDB();
}

function upsertCarrierCharges(mode, data) {
    if (mode === 'air') {
        const idx = db.carrierChargesAir.findIndex(c => c.carrier === data.carrier && c.pol === data.pol);
        const entry = { carrier: data.carrier, pol: data.pol, charges: data.charges, updated: new Date()
                .toISOString() };
        if (idx >= 0) db.carrierChargesAir[idx] = entry;
        else db.carrierChargesAir.push(entry);
    } else {
        const key = { mode, carrier: data.carrier, pol: data.pol, container: data.container || '' };
        const idx = db.carrierChargesSeaLcl.findIndex(c => c.mode === key.mode && c.carrier === key.carrier && c
            .pol === key.pol && (c.container || '') === key.container);
        const entry = { ...key, charges: data.charges, updated: new Date().toISOString() };
        if (idx >= 0) db.carrierChargesSeaLcl[idx] = entry;
        else db.carrierChargesSeaLcl.push(entry);
    }
}

function clearForm(mode) {
    const panel = document.getElementById(mode);
    panel.querySelectorAll('input,select,textarea').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
    document.getElementById(`${mode}-qn-box`).classList.remove('show');
    document.getElementById(`${mode}-dup-alert`).classList.remove('show');
    document.getElementById(`${mode}-margin-warning`).classList.remove('show');
    chargesOrder[mode] = null;
    buildChargesGrid(mode);
    editingRecord = null;
    hasUnsavedChanges[mode] = false;
    setValidityDefault(mode);
}

function setValidityDefault(mode) {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const formatted = lastDay.toISOString().split('T')[0];
    const el = document.getElementById(`${mode}-validityDate`);
    if (el && !el.value) el.value = formatted;
}

function editRecord(target, mode, idx) {
    const rec = db[target][mode][idx];
    document.querySelectorAll('.tab-btn-vertical').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`.tab-btn-vertical[data-tab="${mode}"]`).classList.add('active');
    document.getElementById(mode).classList.add('active');
    const fields = ['client', 'carrier', 'pol', 'pod', 'incoterm', 'commodity', 'weight', 'transit',
        'validityDate'];
    if (mode === 'sea') fields.push('container');
    if (mode === 'air' || mode === 'lcl') fields.push('volume');
    if (mode === 'air') fields.push('pallets');
    fields.forEach(f => {
        const el = document.getElementById(`${mode}-${f}`);
        if (el && rec[f]) el.value = rec[f];
    });
    const remarksEl = document.getElementById(`${mode}-remarks`);
    if (remarksEl) remarksEl.value = rec.remarks || '';
    setTimeout(() => {
        chargesOrder[mode] = rec.chargesOrder || null;
        buildChargesGrid(mode, rec.charges || {}, chargesOrder[mode]);
        if (rec.quoteNumber) {
            document.getElementById(`${mode}-qn-value`).textContent = rec.quoteNumber;
            document.getElementById(`${mode}-qn-box`).classList.add('show');
        }
    }, 80);
    editingRecord = { target, mode, index: idx, originalQN: rec.quoteNumber };
    hasUnsavedChanges[mode] = false;
}

function duplicateQuote(target, mode, idx) {
    const rec = db[target][mode][idx];
    const newRec = JSON.parse(JSON.stringify(rec));
    newRec.quoteNumber = 'DRAFT-' + Date.now();
    newRec.timestamp = new Date().toISOString();
    newRec.lastModified = new Date().toISOString();
    newRec.status = 'DRAFT';
    newRec.followUpStatus = 'PENDING';
    delete newRec.followUpUpdated;
    delete newRec.lostReason;
    db.drafts[mode].push(newRec);
    saveDB();
    renderRecords('drafts');
    alert(`Quote duplicated successfully!\nNew Quote No: ${newRec.quoteNumber}\nSaved to Drafts.`);
}

function clearFilters(target) {
    document.getElementById(`${target}-search-text`).value = '';
    document.getElementById(`${target}-search-qn`).value = '';
    document.getElementById(`${target}-search-date`).value = '';
    if (target === 'rates') document.getElementById('rates-margin-filter').value = '';
    renderRecords(target);
}

function debouncedSearch(target) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { renderRecords(target); }, 300);
}

// ==================== RECORDS RENDERING ====================
function renderRecords(target) {
    const counterId = target === 'drafts' ? 'drafts-counters' : 'rates-counters';
    const countersEl = document.getElementById(counterId);
    if (countersEl) {
        const seaC = db[target].sea.length;
        const airC = db[target].air.length;
        const lclC = db[target].lcl.length;
        const prefix = target === 'drafts' ? 'Draft' : 'Quoted';
        countersEl.innerHTML = `
                    <div class="counter-card sea"><div class="counter-label">🚢 ${prefix} Sea</div><div class="counter-value">${seaC}</div></div>
                    <div class="counter-card air"><div class="counter-label">✈️ ${prefix} Air</div><div class="counter-value">${airC}</div></div>
                    <div class="counter-card lcl"><div class="counter-label">📦 ${prefix} LCL</div><div class="counter-value">${lclC}</div></div>
                    <div class="counter-card" style="border-color:#8b5cf6;"><div class="counter-label">📊 Total</div><div class="counter-value">${seaC+airC+lclC}</div></div>
                `;
    }
    const searchText = (document.getElementById(`${target}-search-text`)?.value || '').toLowerCase();
    const searchQN = (document.getElementById(`${target}-search-qn`)?.value || '').toLowerCase();
    const searchDate = document.getElementById(`${target}-search-date`)?.value || '';
    const marginFilter = target === 'rates' ? (document.getElementById('rates-margin-filter')?.value || '') : '';
    ['sea', 'air', 'lcl'].forEach(mode => {
        const list = document.getElementById(`${target}-${mode}-list`);
        let records = [...db[target][mode]];
        records = records.filter(r => {
            const text = `${r.client||''} ${r.pol||''} ${r.pod||''} ${r.carrier||''}`.toLowerCase();
            if (searchText && !text.includes(searchText)) return false;
            const qn = (r.quoteNumber || '').toLowerCase();
            if (searchQN && !qn.includes(searchQN)) return false;
            if (searchDate) {
                const d = new Date(r.timestamp).toISOString().split('T')[0];
                if (d !== searchDate) return false;
            }
            if (target === 'rates') {
                if (marginFilter === 'positive' && r.marginINR <= 0) return false;
                if (marginFilter === 'negative' && r.marginINR >= 0) return false;
                if (marginFilter === 'high' && r.marginPct <= 15) return false;
                if (marginFilter === 'low' && r.marginPct >= 5) return false;
            }
            return true;
        });
        if (records.length === 0) {
            list.innerHTML = `<p style="color:var(--text-light);padding:10px;">No records.</p>`;
            return;
        }
        list.innerHTML = records.map(rec => {
            const realIdx = db[target][mode].indexOf(rec);
            const status = rec.followUpStatus || 'PENDING';
            const validity = getValidityStatus(rec.validityDate);
            const lastMod = rec.lastModified ? new Date(rec.lastModified).toLocaleString('en-IN') :
                new Date(rec.timestamp).toLocaleString('en-IN');
            return `<div class="record-card highlight-${mode}">
                        <div class="record-info">
                            <h4>${rec.client||'?'} (${rec.pol||'?'} → ${rec.pod||'?'}) 
                                ${validity.status !== 'none' ? `<span class="validity-badge ${validity.class}">${validity.text}</span>` : ''}
                            </h4>
                            <p>Carrier: ${rec.carrier||'?'} | Status: <strong>${rec.status}</strong> 
                                ${rec.lostReason ? `| Lost Reason: <strong style="color:#991b1b;">${rec.lostReason}</strong>` : ''}
                            </p>
                            <p>Sell: <strong>${formatINR(rec.totalSellINR)}</strong> | 
                               Buy: <strong style="color:var(--buy-red);">${formatINR(rec.totalBuyINR)}</strong></p>
                            <p class="margin-info">Margin: ${formatINR(rec.marginINR)} (${rec.marginPct.toFixed(2)}%)</p>
                            <p class="quote-num">📋 ${rec.quoteNumber||'?'}</p>
                            <p class="last-modified">🕐 Last Modified: ${lastMod}</p>
                            <div style="margin-top:6px;display:flex;align-items:center;gap:8px;">
                                <label style="font-size:0.72rem;font-weight:700;color:var(--text-light);">ACTION:</label>
                                <select class="follow-up-select follow-up-${status.toLowerCase().replace('-','')}" 
                                    onchange="setFollowUpStatus('${target}','${mode}',${realIdx},this.value)">
                                    <option value="PENDING" ${status==='PENDING'?'selected':''}>⏳ Pending</option>
                                    <option value="SENT" ${status==='SENT'?'selected':''}>📤 Sent</option>
                                    <option value="FOLLOW-UP" ${status==='FOLLOW-UP'?'selected':''}>🔄 Follow-up</option>
                                    <option value="WON" ${status==='WON'?'selected':''}>✅ Won</option>
                                    <option value="LOST" ${status==='LOST'?'selected':''}>❌ Lost</option>
                                </select>
                            </div>
                        </div>
                        <div class="record-actions">
                            <button class="btn btn-sm btn-preview" onclick="previewSavedRecord('${target}','${mode}',${realIdx})">👁 Preview</button>
                            <button class="btn btn-sm btn-pdf" onclick="downloadSavedPDF('${target}','${mode}',${realIdx})">📄 PDF</button>
                            <button class="btn btn-sm btn-email" onclick="emailSavedQuote('${target}','${mode}',${realIdx})">📧 Email</button>
                            <button class="btn btn-sm btn-duplicate" onclick="duplicateQuote('${target}','${mode}',${realIdx})">📋 Duplicate</button>
                            <button class="btn btn-sm btn-draft" onclick="editRecord('${target}','${mode}',${realIdx})">✏️ Edit</button>
                            <button class="btn btn-sm btn-clear" onclick="deleteRecord('${target}','${mode}',${realIdx})">🗑️ Delete</button>
                        </div>
                    </div>`;
        }).join('');
    });
}

// ==================== FOLLOW-UPS ====================
function renderFollowups() {
    const filterStatus = document.getElementById('followup-filter-status')?.value || '';
    const list = document.getElementById('followup-list');
    const counters = document.getElementById('followup-counters');
    let allQuotes = [];
    ['sea', 'air', 'lcl'].forEach(mode => {
        db.rates[mode].forEach((rec, idx) => {
            allQuotes.push({ ...rec, _target: 'rates', _mode: mode, _idx: idx });
        });
    });
    const pending = allQuotes.filter(r => !r.followUpStatus || r.followUpStatus === 'PENDING').length;
    const sent = allQuotes.filter(r => r.followUpStatus === 'SENT').length;
    const followup = allQuotes.filter(r => r.followUpStatus === 'FOLLOW-UP').length;
    const won = allQuotes.filter(r => r.followUpStatus === 'WON').length;
    const lost = allQuotes.filter(r => r.followUpStatus === 'LOST').length;
    if (counters) {
        counters.innerHTML = `
                    <div class="counter-card" style="border-color:#f59e0b;"><div class="counter-label">⏳ Pending</div><div class="counter-value">${pending}</div></div>
                    <div class="counter-card" style="border-color:#3b82f6;"><div class="counter-label">📤 Sent</div><div class="counter-value">${sent}</div></div>
                    <div class="counter-card" style="border-color:#f97316;"><div class="counter-label">🔄 Follow-up</div><div class="counter-value">${followup}</div></div>
                    <div class="counter-card" style="border-color:#10b981;"><div class="counter-label">✅ Won</div><div class="counter-value">${won}</div></div>
                    <div class="counter-card" style="border-color:#ef4444;"><div class="counter-label">❌ Lost</div><div class="counter-value">${lost}</div></div>
                `;
    }
    let filtered = allQuotes.filter(r => {
        if (!filterStatus) return true;
        return (r.followUpStatus || 'PENDING') === filterStatus;
    });
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (filtered.length === 0) {
        list.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center;">No quotes found</p>';
        return;
    }
    list.innerHTML = filtered.map(rec => {
        const status = rec.followUpStatus || 'PENDING';
        const updated = rec.followUpUpdated ? new Date(rec.followUpUpdated) : new Date(rec.timestamp);
        const daysSince = Math.floor((new Date() - updated) / (1000 * 60 * 60 * 24));
        const overdue = daysSince >= 3 && status !== 'WON' && status !== 'LOST';
        const validity = getValidityStatus(rec.validityDate);
        return `<div class="follow-up-card ${overdue?'overdue':''}" style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;border-left:5px solid var(--warning);">
                    <h4 style="color:var(--primary);margin-bottom:4px;font-size:0.9rem;">
                        ${rec.client||'Unknown'} (${rec.pol||'N/A'} → ${rec.pod||'N/A'}) 
                        ${validity.status !== 'none' ? `<span class="validity-badge ${validity.class}">${validity.text}</span>` : ''}
                    </h4>
                    <p style="font-size:0.8rem;color:var(--text-light);margin-bottom:2px;">
                        Quote: <strong>${rec.quoteNumber||'N/A'}</strong> | Carrier: ${rec.carrier||'N/A'}
                    </p>
                    <p style="font-size:0.8rem;color:var(--text-light);margin-bottom:2px;">
                        Status: <strong>${status}</strong> | Last Updated: ${updated.toLocaleDateString('en-IN')}
                    </p>
                    ${rec.lostReason ? `<p style="color:#991b1b;font-weight:600;font-size:0.8rem;">Lost Reason: ${rec.lostReason}</p>` : ''}
                    ${overdue ? `<p style="color:var(--danger);font-weight:700;font-size:0.85rem;margin-top:4px;">⚠️ Overdue: ${daysSince} days since last update</p>` : ''}
                    <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap;align-items:center;">
                        <button class="btn btn-sm btn-preview" onclick="previewSavedRecord('rates','${rec._mode}',${rec._idx})">👁 Preview</button>
                        <select class="follow-up-select follow-up-${status.toLowerCase().replace('-','')}" 
                            onchange="setFollowUpStatus('rates','${rec._mode}',${rec._idx},this.value)">
                            <option value="PENDING" ${status==='PENDING'?'selected':''}>⏳ Pending</option>
                            <option value="SENT" ${status==='SENT'?'selected':''}>📤 Sent</option>
                            <option value="FOLLOW-UP" ${status==='FOLLOW-UP'?'selected':''}>🔄 Follow-up</option>
                            <option value="WON" ${status==='WON'?'selected':''}>✅ Won</option>
                            <option value="LOST" ${status==='LOST'?'selected':''}>❌ Lost</option>
                        </select>
                    </div>
                </div>`;
    }).join('');
}

function setFollowUpStatus(target, mode, idx, status) {
    db[target][mode][idx].followUpStatus = status;
    db[target][mode][idx].followUpUpdated = new Date().toISOString();
    db[target][mode][idx].lastModified = new Date().toISOString();
    if (status === 'LOST') {
        saveDB();
        renderFollowups();
        renderRecords(target);
        setTimeout(() => {
            const reason = prompt(
                'Please enter reason for losing this quote:\n\nOptions:\n- High Rates\n- Slow Response\n- No Service\n- Client Not Interested\n- Competitor Won\n- Budget Constraints\n- Other'
                );
            if (reason) {
                db[target][mode][idx].lostReason = reason;
                saveDB();
                renderFollowups();
                renderRecords(target);
            }
        }, 100);
    } else {
        saveDB();
        renderFollowups();
        renderRecords(target);
    }
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    const allRates = [...db.rates.sea, ...db.rates.air, ...db.rates.lcl];
    const totalRevenue = allRates.reduce((sum, r) => sum + (r.totalSellINR || 0), 0);
    const totalMargin = allRates.reduce((sum, r) => sum + (r.marginINR || 0), 0);
    const totalQuotes = allRates.length;
    const wonCount = allRates.filter(r => r.followUpStatus === 'WON').length;
    const conversion = totalQuotes > 0 ? ((wonCount / totalQuotes) * 100).toFixed(1) : 0;
    let expiringCount = 0,
        expiredCount = 0;
    allRates.forEach(r => {
        const v = getValidityStatus(r.validityDate);
        if (v.status === 'warning') expiringCount++;
        if (v.status === 'expired') expiredCount++;
    });
    document.getElementById('dash-total-revenue').textContent = formatINR(totalRevenue);
    document.getElementById('dash-total-margin').textContent = formatINR(totalMargin);
    document.getElementById('dash-total-quotes').textContent = totalQuotes;
    document.getElementById('dash-conversion').textContent = conversion + '%';
    document.getElementById('dash-expiring').textContent = expiringCount;
    document.getElementById('dash-expired').textContent = expiredCount;
    const clientMap = {};
    allRates.forEach(r => {
        const client = r.client || 'Unknown';
        clientMap[client] = (clientMap[client] || 0) + (r.totalSellINR || 0);
    });
    const topClients = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('dash-top-clients').innerHTML = topClients.length ?
        topClients.map(([c, v], i) =>
            `<li style="padding:6px 8px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;"><span><strong style="color:var(--primary);">#${i+1}</strong> ${c}</span><strong>${formatINR(v)}</strong></li>`
        ).join('') :
        '<li style="padding:10px;color:var(--text-light);">No data</li>';
    const routeMap = {};
    allRates.forEach(r => {
        const route = `${r.pol||'?'} → ${r.pod||'?'}`;
        routeMap[route] = (routeMap[route] || 0) + 1;
    });
    const topRoutes = Object.entries(routeMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('dash-top-routes').innerHTML = topRoutes.length ?
        topRoutes.map(([r, c], i) =>
            `<li style="padding:6px 8px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;"><span><strong style="color:var(--primary);">#${i+1}</strong> ${r}</span><strong>${c} quotes</strong></li>`
        ).join('') :
        '<li style="padding:10px;color:var(--text-light);">No data</li>';
}

// ==================== MEASUREMENT TOOLS ====================
function calculateCBM() {
    const length = parseFloat(document.getElementById('cbm-length')?.value) || 0;
    const width = parseFloat(document.getElementById('cbm-width')?.value) || 0;
    const height = parseFloat(document.getElementById('cbm-height')?.value) || 0;
    const unit = document.getElementById('cbm-unit')?.value || 'cm';
    const qty = parseFloat(document.getElementById('cbm-qty')?.value) || 1;
    let lengthM = length,
        widthM = width,
        heightM = height;
    if (unit === 'cm') { lengthM = length / 100;
        widthM = width / 100;
        heightM = height / 100; } else if (unit === 'inch') { lengthM = length * 0.0254;
        widthM = width * 0.0254;
        heightM = height * 0.0254; } else if (unit === 'mm') { lengthM = length / 1000;
        widthM = width / 1000;
        heightM = height / 1000; }
    const cbm = lengthM * widthM * heightM * qty;
    document.getElementById('cbm-result').value = cbm.toFixed(4) + ' CBM';
}

function calculateAirChargeable() {
    const length = parseFloat(document.getElementById('air-length')?.value) || 0;
    const width = parseFloat(document.getElementById('air-width')?.value) || 0;
    const height = parseFloat(document.getElementById('air-height')?.value) || 0;
    const unit = document.getElementById('air-unit')?.value || 'cm';
    const qty = parseFloat(document.getElementById('air-qty')?.value) || 1;
    let volumeCm3 = 0;
    if (unit === 'cm') volumeCm3 = length * width * height;
    else if (unit === 'inch') volumeCm3 = (length * 2.54) * (width * 2.54) * (height * 2.54);
    else if (unit === 'mm') volumeCm3 = (length / 10) * (width / 10) * (height / 10);
    const chargeableWeight = (volumeCm3 / 6000) * qty;
    document.getElementById('air-result').value = chargeableWeight.toFixed(2) + ' KGS';
}

function renderContainerDimensions() {
    const tbody = document.getElementById('container-dimensions-body');
    if (!tbody) return;
    tbody.innerHTML = db.containerDimensions.map((c, idx) => `
                <tr>
                    <td><input type="text" value="${c.type}" onchange="updateContainerDim(${idx},'type',this.value)" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td><input type="text" value="${c.length}" onchange="updateContainerDim(${idx},'length',this.value)" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td><input type="text" value="${c.width}" onchange="updateContainerDim(${idx},'width',this.value)" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td><input type="text" value="${c.height}" onchange="updateContainerDim(${idx},'height',this.value)" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td><input type="text" value="${c.maxWeight}" onchange="updateContainerDim(${idx},'maxWeight',this.value)" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td><input type="text" value="${c.cbm}" onchange="updateContainerDim(${idx},'cbm',this.value)" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td><button class="btn btn-sm btn-clear" onclick="deleteContainerDim(${idx})">×</button></td>
                </tr>
            `).join('');
}

function updateContainerDim(idx, field, value) { db.containerDimensions[idx][field] = value; }

function saveContainerDimensions() { saveDB();
    alert('Container dimensions saved successfully!'); }

function addContainerDimension() {
    db.containerDimensions.push({ type: "NEW", length: "", width: "", height: "", maxWeight: "", cbm: "" });
    renderContainerDimensions();
}

function deleteContainerDim(idx) {
    if (confirm('Delete this container?')) { db.containerDimensions.splice(idx, 1);
        renderContainerDimensions(); }
}

let calcExpression = '';

function calcInput(val) { calcExpression += val;
    document.getElementById('calc-display').value = calcExpression; }

function calcClear() { calcExpression = '';
    document.getElementById('calc-display').value = ''; }

function calcEquals() {
    try { const result = eval(calcExpression);
        document.getElementById('calc-display').value = result;
        calcExpression = String(result); } catch (e) { document.getElementById('calc-display').value = 'Error';
        calcExpression = ''; }
}

// ==================== RATE SHEET MANAGEMENT ====================
function getExpiryStatus(validTo) {
    if (!validTo) return { status: 'unknown', days: null, color: 'gray' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const valid = new Date(validTo);
    valid.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((valid - today) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) return { status: 'expired', days: daysRemaining, color: 'red' };
    if (daysRemaining <= 7) return { status: 'critical', days: daysRemaining, color: 'red' };
    if (daysRemaining <= 30) return { status: 'expiring', days: daysRemaining, color: 'yellow' };
    return { status: 'active', days: daysRemaining, color: 'green' };
}

function updateExpiryDashboard() {
    const rates = db.rateSheet || [];
    let active = 0,
        expiring30 = 0,
        expiring7 = 0,
        expired = 0;
    rates.forEach(r => {
        const expiry = getExpiryStatus(r.validTo);
        if (expiry.status === 'active') active++;
        else if (expiry.status === 'expiring') { expiring30++; if (expiry.days <= 7) expiring7++; } else if (
            expiry.status === 'expired' || expiry.status === 'critical') { expired++; if (expiry.days <= 7 &&
                expiry.days >= 0) expiring7++; }
    });
    document.getElementById('expiry-active-count').textContent = active;
    document.getElementById('expiry-30-count').textContent = expiring30;
    document.getElementById('expiry-7-count').textContent = expiring7;
    document.getElementById('expiry-expired-count').textContent = expired;
}

function filterRateSheet(filter) {
    rateSheetFilter = filter;
    rateSheetPage = 1;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderRateSheet();
}

function clearRateSheetFilter() {
    rateSheetFilter = 'all';
    rateSheetPage = 1;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    renderRateSheet();
}

function getFilteredRateSheet() {
    let rates = [...(db.rateSheet || [])];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (rateSheetFilter === 'active') {
        rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.status === 'active'; });
    } else if (rateSheetFilter === 'expiring30') {
        rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.status ===
            'expiring'; });
    } else if (rateSheetFilter === 'expiring15') {
        rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.days !== null &&
                expiry.days >= 0 && expiry.days <= 15; });
    } else if (rateSheetFilter === 'expiring7') {
        rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.days !== null &&
                expiry.days >= 0 && expiry.days <= 7; });
    } else if (rateSheetFilter === 'today') {
        rates = rates.filter(r => { const valid = new Date(r.validTo);
            valid.setHours(0, 0, 0, 0); return valid.getTime() === today.getTime(); });
    } else if (rateSheetFilter === 'expired') {
        rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.status === 'expired' ||
                expiry.status === 'critical'; });
    }
    return rates;
}

function renderRateSheet() {
    const tbody = document.getElementById('ratesheet-body');
    if (!tbody) return;
    const filtered = getFilteredRateSheet();
    const perPage = rateSheetPerPage;
    const totalPages = Math.ceil(filtered.length / perPage) || 1;
    if (rateSheetPage > totalPages) rateSheetPage = totalPages;
    if (rateSheetPage < 1) rateSheetPage = 1;
    const start = (rateSheetPage - 1) * perPage;
    const pageData = filtered.slice(start, start + perPage);
    tbody.innerHTML = pageData.map((r, idx) => {
        const realIdx = db.rateSheet.indexOf(r);
        const expiry = getExpiryStatus(r.validTo);
        const rowClass = expiry.status === 'active' ? 'row-active' :
            expiry.status === 'expiring' ? 'row-expiring' : 'row-expired';
        let statusClass, statusText;
        if (expiry.status === 'expired') { statusClass = 'status-expired';
            statusText = 'Expired'; } else if (expiry.status === 'expiring') { statusClass =
                'status-expiring';
            statusText = `Expiring (${expiry.days}d)`; } else { statusClass = 'status-active';
            statusText = 'Active'; }
        return `<tr class="${rowClass}">
                    <td>${r.carrierName || '-'}</td>
                    <td>${r.freightType || '-'}</td>
                    <td>${r.pol || '-'}</td>
                    <td>${r.pod || '-'}</td>
                    <td>${r.containerType || '-'}</td>
                    <td>${Number(r.freightAmount || 0).toLocaleString('en-IN')}</td>
                    <td>${r.currency || 'INR'}</td>
                    <td>${r.transitTime || '-'}</td>
                    <td>${r.validFrom || '-'}</td>
                    <td>${r.validTo || '-'}</td>
                    <td>${expiry.days !== null ? expiry.days + ' days' : '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-preview" onclick="editRateSheet(${realIdx})">✏️</button>
                        <button class="btn btn-sm btn-duplicate" onclick="duplicateRateSheet(${realIdx})">📋</button>
                        <button class="btn btn-sm btn-success" onclick="renewRateSheet(${realIdx})">🔄</button>
                        <button class="btn btn-sm btn-clear" onclick="deleteRateSheet(${realIdx})">×</button>
                    </td>
                </tr>`;
    }).join('');
    const pagination = document.getElementById('ratesheet-pagination');
    if (filtered.length === 0) { pagination.innerHTML =
            '<p style="color:var(--text-light);padding:10px;text-align:center;">No rates found</p>'; return; }
    let pagHtml =
        `<button class="page-btn" onclick="changeRateSheetPage(${rateSheetPage - 1})" ${rateSheetPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
    pagHtml +=
        `<span class="page-info">Page ${rateSheetPage} of ${totalPages} (${filtered.length} records)</span>`;
    pagHtml +=
        `<button class="page-btn" onclick="changeRateSheetPage(${rateSheetPage + 1})" ${rateSheetPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
    pagination.innerHTML = pagHtml;
}

function changeRateSheetPage(page) {
    const filtered = getFilteredRateSheet();
    const totalPages = Math.ceil(filtered.length / rateSheetPerPage) || 1;
    if (page < 1 || page > totalPages) return;
    rateSheetPage = page;
    renderRateSheet();
}

function openRateSheetModal(editIdx = null) {
    const modal = document.getElementById('rateSheetModal');
    const title = document.getElementById('rateSheetModalTitle');
    const visibleCarriers = [...new Set(db.carriers.filter(c => !(db.hiddenItems.carriers || []).includes(c)))].sort((a,
        b) => a.localeCompare(b));
    document.getElementById('rs-pol').innerHTML = '<option value="">Select POL</option>' + db.pol.map(p =>
        `<option value="${p}">${p}</option>`).join('');
    document.getElementById('rs-pod').innerHTML = '<option value="">Select POD</option>' + db.pod.map(p =>
        `<option value="${p}">${p}</option>`).join('');
    document.getElementById('rs-container').innerHTML = '<option value="">Select Container</option>' + db.containers
        .map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('rs-currency').innerHTML = getCurrencyOptions('INR');
    if (editIdx !== null) {
        const r = db.rateSheet[editIdx];
        title.textContent = 'Edit Rate';
        document.getElementById('rs-carrier').value = r.carrierName || '';
        document.getElementById('rs-freightType').value = r.freightType || 'SEA';
        document.getElementById('rs-pol').value = r.pol || '';
        document.getElementById('rs-pod').value = r.pod || '';
        document.getElementById('rs-container').value = r.containerType || '';
        document.getElementById('rs-currency').value = r.currency || 'INR';
        document.getElementById('rs-amount').value = r.freightAmount || '';
        document.getElementById('rs-transit').value = r.transitTime || '';
        document.getElementById('rs-validFrom').value = r.validFrom || '';
        document.getElementById('rs-validTo').value = r.validTo || '';
        document.getElementById('rs-remarks').value = r.remarks || '';
        document.getElementById('rateSheetSaveBtn').onclick = () => saveRateSheet(editIdx);
    } else {
        title.textContent = 'Add New Rate';
        document.getElementById('rs-carrier').value = '';
        document.getElementById('rs-freightType').value = 'SEA';
        document.getElementById('rs-pol').value = '';
        document.getElementById('rs-pod').value = '';
        document.getElementById('rs-container').value = '';
        document.getElementById('rs-currency').value = 'INR';
        document.getElementById('rs-amount').value = '';
        document.getElementById('rs-transit').value = '';
        document.getElementById('rs-validFrom').value = '';
        document.getElementById('rs-validTo').value = '';
        document.getElementById('rs-remarks').value = '';
        document.getElementById('rateSheetSaveBtn').onclick = () => saveRateSheet(null);
    }
    openModal('rateSheetModal');
}

function saveRateSheet(editIdx) {
    const rateData = {
        carrierName: document.getElementById('rs-carrier').value.trim(),
        freightType: document.getElementById('rs-freightType').value,
        pol: document.getElementById('rs-pol').value,
        pod: document.getElementById('rs-pod').value,
        containerType: document.getElementById('rs-container').value,
        currency: document.getElementById('rs-currency').value,
        freightAmount: parseFloat(document.getElementById('rs-amount').value) || 0,
        transitTime: document.getElementById('rs-transit').value.trim(),
        validFrom: document.getElementById('rs-validFrom').value,
        validTo: document.getElementById('rs-validTo').value,
        remarks: document.getElementById('rs-remarks').value.trim(),
        updatedAt: new Date().toISOString()
    };
    if (!rateData.carrierName || !rateData.pol || !rateData.pod || !rateData.validTo) return alert(
        'Please fill Carrier, POL, POD, and Valid To fields.');
    if (editIdx !== null) {
        db.rateSheet[editIdx] = { ...db.rateSheet[editIdx], ...rateData };
    } else {
        rateData.createdAt = new Date().toISOString();
        rateData.id = 'RS-' + Date.now();
        db.rateSheet.push(rateData);
    }
    saveDB();
    closeModal('rateSheetModal');
    renderRateSheet();
    updateExpiryDashboard();
    alert(editIdx !== null ? 'Rate updated successfully!' : 'Rate saved successfully!');
}

function editRateSheet(idx) { openRateSheetModal(idx); }

function duplicateRateSheet(idx) {
    const original = db.rateSheet[idx];
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = 'RS-' + Date.now();
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.carrierName = original.carrierName + ' (Copy)';
    db.rateSheet.push(copy);
    saveDB();
    renderRateSheet();
    updateExpiryDashboard();
    alert('Rate duplicated successfully!');
}

function renewRateSheet(idx) {
    const original = db.rateSheet[idx];
    const renewBody = document.getElementById('renewBody');
    renewBody.innerHTML = `
                <p style="margin-bottom:12px;">Renewing rate for <strong>${original.carrierName}</strong>: ${original.pol} → ${original.pod}</p>
                <div class="form-grid-2col">
                    <div class="form-group"><label>New Valid From</label><input type="date" id="renew-validFrom" value="${new Date().toISOString().split('T')[0]}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                    <div class="form-group"><label>New Valid To</label><input type="date" id="renew-validTo" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                    <div class="form-group"><label>Freight Amount</label><input type="number" id="renew-amount" value="${original.freightAmount}" step="0.01" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                    <div class="form-group"><label>Currency</label><select id="renew-currency">${getCurrencyOptions(original.currency || 'INR')}</select></div>
                    <div class="form-group"><label>Transit Time</label><input type="text" id="renew-transit" value="${original.transitTime || ''}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                    <div class="form-group"><label>Remarks</label><input type="text" id="renew-remarks" value="${original.remarks || ''}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                </div>
                <div style="margin-top:16px;text-align:right;display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-clear" onclick="closeModal('renewModal')">Cancel</button>
                    <button class="btn btn-success" onclick="confirmRenew(${idx})">🔄 Confirm Renewal</button>
                </div>
            `;
    openModal('renewModal');
}

function confirmRenew(originalIdx) {
    const original = db.rateSheet[originalIdx];
    const newRate = {
        id: 'RS-' + Date.now(),
        carrierName: original.carrierName,
        freightType: original.freightType,
        pol: original.pol,
        pod: original.pod,
        containerType: original.containerType,
        currency: document.getElementById('renew-currency').value,
        freightAmount: parseFloat(document.getElementById('renew-amount').value) || 0,
        transitTime: document.getElementById('renew-transit').value.trim(),
        validFrom: document.getElementById('renew-validFrom').value,
        validTo: document.getElementById('renew-validTo').value,
        remarks: document.getElementById('renew-remarks').value.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRenewal: true,
        parentRecordId: original.id
    };
    if (!newRate.validTo) return alert('Please set Valid To date.');
    db.rateSheet.push(newRate);
    saveDB();
    closeModal('renewModal');
    renderRateSheet();
    updateExpiryDashboard();
    alert('Rate renewed successfully! New record created.');
}

function deleteRateSheet(idx) {
    const rec = db.rateSheet[idx];
    showDeleteConfirm(
        `Delete rate?<br><br><strong>${rec.carrierName}</strong> (${rec.pol} → ${rec.pod})<br>Amount: ${rec.currency} ${rec.freightAmount}`,
        function() {
            db.rateSheet.splice(idx, 1);
            saveDB();
            renderRateSheet();
            updateExpiryDashboard();
        }
    );
}

function openBulkImportModal() {
    document.getElementById('bulk-rates-data').value = '';
    document.getElementById('bulk-import-rates-status').textContent = '';
    openModal('bulkImportModal');
}

function processBulkRateImport() {
    const data = document.getElementById('bulk-rates-data').value.trim();
    const statusEl = document.getElementById('bulk-import-rates-status');
    if (!data) { statusEl.textContent = '❌ Please paste some data';
        statusEl.style.color = 'var(--danger)'; return; }
    const lines = data.split('\n').filter(l => l.trim());
    let imported = 0,
        skipped = 0;
    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length >= 10) {
            const rateData = {
                id: 'RS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                carrierName: parts[0].trim(),
                freightType: parts[1].trim().toUpperCase(),
                pol: parts[2].trim(),
                pod: parts[3].trim(),
                containerType: parts[4].trim(),
                currency: parts[5].trim().toUpperCase() || 'INR',
                freightAmount: parseFloat(parts[6]) || 0,
                transitTime: parts[7].trim(),
                validFrom: parts[8].trim(),
                validTo: parts[9].trim(),
                remarks: parts[10] ? parts[10].trim() : '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            if (rateData.carrierName && rateData.pol && rateData.pod && rateData.validTo) {
                db.rateSheet.push(rateData);
                imported++;
            } else { skipped++; }
        } else { skipped++; }
    });
    saveDB();
    statusEl.textContent = `✅ Imported ${imported} rates, ⏭️ Skipped ${skipped}`;
    statusEl.style.color = 'var(--success)';
    document.getElementById('bulk-rates-data').value = '';
    setTimeout(() => { closeModal('bulkImportModal');
        renderRateSheet();
        updateExpiryDashboard(); }, 1500);
}

function exportRateSheetReport(format) {
    const filtered = getFilteredRateSheet();
    if (filtered.length === 0) return alert('No data to export');
    if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        const wsData = filtered.map(r => ({
            'Carrier': r.carrierName,
            'Freight Type': r.freightType,
            'POL': r.pol,
            'POD': r.pod,
            'Container': r.containerType,
            'Amount': r.freightAmount,
            'Currency': r.currency,
            'Transit': r.transitTime,
            'Valid From': r.validFrom,
            'Valid To': r.validTo,
            'Days Remaining': getExpiryStatus(r.validTo).days,
            'Status': getExpiryStatus(r.validTo).status,
            'Remarks': r.remarks
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Rate Sheet Report');
        XLSX.writeFile(wb, `RateSheet_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFontSize(16);
        doc.text('Rate Sheet Expiry Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 22);
        doc.text(`Filter: ${rateSheetFilter} | Total Records: ${filtered.length}`, 14, 28);
        const tableData = filtered.map(r => [
            r.carrierName || '-',
            r.freightType || '-',
            r.pol || '-',
            r.pod || '-',
            r.containerType || '-',
            `${r.currency || 'INR'} ${Number(r.freightAmount || 0).toLocaleString('en-IN')}`,
            r.transitTime || '-',
            r.validFrom || '-',
            r.validTo || '-',
            getExpiryStatus(r.validTo).days !== null ? `${getExpiryStatus(r.validTo).days} days` : '-',
            getExpiryStatus(r.validTo).status.toUpperCase()
        ]);
        doc.autoTable({
            startY: 32,
            head: [
                ['Carrier', 'Type', 'POL', 'POD', 'Container', 'Amount', 'Transit', 'Valid From',
                    'Valid To', 'Days Left', 'Status'
                ]
            ],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [30, 58, 138], textColor: 255 },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 10) {
                    const status = data.cell.raw;
                    if (status === 'ACTIVE') data.cell.styles.textColor = [16, 185, 129];
                    else if (status === 'EXPIRING') data.cell.styles.textColor = [245, 158, 11];
                    else if (status === 'EXPIRED') data.cell.styles.textColor = [239, 68, 68];
                }
            },
            margin: { left: 14, right: 14 }
        });
        doc.save(`RateSheet_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

// ==================== SAVE LOCAL CHARGES ====================
function saveLocalCharges(mode) {
    const carrier = document.getElementById(`${mode}-carrier`).value;
    const pol = document.getElementById(`${mode}-pol`).value;
    const container = document.getElementById(`${mode}-container`)?.value || '';
    if (!carrier || !pol) return alert('Please select Carrier and POL first.');
    const charges = getCurrentChargesData(mode);
    const hasData = Object.values(charges).some(c => c.amount || c.buyAmount);
    if (!hasData) return alert('No charges to save.');
    if (mode === 'air') {
        const idx = db.carrierChargesAir.findIndex(c => c.carrier === carrier && c.pol === pol);
        const entry = { carrier, pol, charges, updated: new Date().toISOString() };
        if (idx >= 0) { if (confirm('Update existing charges for this carrier?')) { db.carrierChargesAir[idx] =
                entry; } else return; } else { db.carrierChargesAir.push(entry); }
    } else {
        const key = { mode, carrier, pol, container };
        const idx = db.carrierChargesSeaLcl.findIndex(c => c.mode === mode && c.carrier === carrier && c.pol ===
            pol && (c.container || '') === container);
        const entry = { ...key, charges, updated: new Date().toISOString() };
        if (idx >= 0) { if (confirm('Update existing charges for this carrier?')) { db.carrierChargesSeaLcl[
                idx] = entry; } else return; } else { db.carrierChargesSeaLcl.push(entry); }
    }
    saveDB();
    alert(`Local charges saved for ${carrier} - ${pol}!`);
}

// ==================== SAVE FREIGHT RATE ====================
function saveFreightRate(mode) {
    const carrier = document.getElementById(`${mode}-carrier`).value;
    const pol = document.getElementById(`${mode}-pol`).value;
    const pod = document.getElementById(`${mode}-pod`).value;
    const container = document.getElementById(`${mode}-container`)?.value || '';
    const transit = document.getElementById(`${mode}-transit`).value;
    const validityDate = document.getElementById(`${mode}-validityDate`).value;
    if (!carrier || !pol || !pod) return alert('Please select Carrier, POL, and POD first.');
    const charges = getCurrentChargesData(mode);
    const freightCharge = charges['FREIGHT'] || charges['AIR FREIGHT'] || {};
    // ✅ CHANGED: now uses buyAmount
    const freightAmount = parseFloat(freightCharge.buyAmount) || 0;
    const currency = freightCharge.buyCurrency || 'INR';
    const rateData = {
        id: 'RS-' + Date.now(),
        carrierName: carrier,
        freightType: mode.toUpperCase(),
        pol: pol,
        pod: pod,
        containerType: container,
        currency: currency,
        freightAmount: freightAmount,
        transitTime: transit ? `${transit} days` : '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: validityDate || '',
        remarks: `Saved from ${mode.toUpperCase()} quotation`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.rateSheet.push(rateData);
    saveDB();
    alert(`Freight rate saved to Rate Sheet!\n\nCarrier: ${carrier}\nRoute: ${pol} → ${pod}\nAmount: ${formatINR(freightAmount)}`);
}

// ==================== BULK IMPORT (POL/POD/CARRIER) ====================
function bulkImport() {
    const type = document.getElementById('bulk-import-type').value;
    const data = document.getElementById('bulk-import-data').value.trim();
    const statusEl = document.getElementById('bulk-import-status');
    if (!data) { statusEl.textContent = '❌ Please paste some data';
        statusEl.style.color = 'var(--danger)'; return; }
    const lines = data.split('\n').filter(l => l.trim());
    let imported = 0,
        skipped = 0;
    if (type === 'pol' || type === 'pod') {
        lines.forEach(line => {
            const val = line.trim().toUpperCase();
            if (val && !db[type].includes(val)) { db[type].push(val);
                imported++; } else { skipped++; }
        });
    } else if (type === 'carrier') {
        lines.forEach(line => {
            const parts = line.split('\t');
            if (parts.length >= 5) {
                const carrier = parts[0].trim();
                const pol = parts[1].trim();
                const chargeType = parts[2].trim().toUpperCase();
                const amount = parseFloat(parts[3]);
                const currency = parts[4].trim().toUpperCase() || 'INR';
                if (carrier && pol && chargeType && amount) {
                    const isAir = defaultCharges.air.includes(chargeType);
                    const listKey = isAir ? 'carrierChargesAir' : 'carrierChargesSeaLcl';
                    const mode = isAir ? 'air' : 'sea';
                    let entry;
                    if (isAir) {
                        entry = db[listKey].find(c => c.carrier === carrier && c.pol === pol);
                        if (!entry) { entry = { carrier, pol, charges: {}, updated: new Date()
                                    .toISOString() };
                            db[listKey].push(entry); }
                    } else {
                        entry = db[listKey].find(c => c.mode === mode && c.carrier === carrier && c
                            .pol === pol);
                        if (!entry) { entry = { mode, carrier, pol, container: '', charges: {},
                                    updated: new Date().toISOString() };
                            db[listKey].push(entry); }
                    }
                    entry.charges[chargeType] = { amount, currency };
                    imported++;
                } else { skipped++; }
            } else { skipped++; }
        });
    }
    saveDB();
    statusEl.textContent = `✅ Imported ${imported} records, ⏭️ Skipped ${skipped} (duplicates/invalid)`;
    statusEl.style.color = 'var(--success)';
    document.getElementById('bulk-import-data').value = '';
    if (type === 'pol' || type === 'pod') populateDropdowns();
}

// ==================== BACKUP FUNCTIONS ====================
async function selectBackupFolder() {
    try {
        if (typeof window.showDirectoryPicker === 'function') {
            const folder = await window.showDirectoryPicker();
            backupFolderHandle = folder;
            document.getElementById('backup-folder-path').textContent = `📁 ${folder.name}`;
            alert('Backup folder selected successfully! Auto backup will run every 15 minutes.');
            startAutoBackup();
        } else {
            alert('Your browser does not support folder selection. Please use the Export buttons to save manually.');
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error(e);
            alert('Folder selection failed: ' + e.message);
        }
    }
}

function startAutoBackup() {
    if (autoBackupInterval) { clearInterval(autoBackupInterval); }
    autoBackupInterval = setInterval(() => {
        if (backupFolderHandle) { autoBackupToFolder(); } else {
            document.getElementById('auto-backup-status').textContent = '⚠️ No folder selected'; }
    }, 15 * 60 * 1000);
    document.getElementById('auto-backup-status').textContent = '✅ Running (every 15 min)';
}

async function autoBackupToFolder() {
    try {
        const backupData = { timestamp: new Date().toISOString(), data: db };
        const json = JSON.stringify(backupData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const fileName = `Gateway_EXIM_AutoBackup_${new Date().toISOString().split('T')[0]}.json`;
        const fileHandle = await backupFolderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        db.lastBackup = new Date().toISOString();
        saveDB();
        const statusEl = document.getElementById('backup-status');
        statusEl.textContent =
        `✅ Last backup: ${new Date().toLocaleString('en-IN')} (in ${backupFolderHandle.name})`;
        statusEl.className = 'backup-status success';
        console.log('Auto backup saved to folder:', fileName);
    } catch (e) { console.error('Auto backup failed:', e); }
}

async function autoBackup() {
    try {
        const backupData = { timestamp: new Date().toISOString(), data: db };
        const json = JSON.stringify(backupData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const fileName = `Gateway_EXIM_AutoBackup_${new Date().toISOString().split('T')[0]}.json`;
        if (backupFolderHandle) {
            const fileHandle = await backupFolderHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            db.lastBackup = new Date().toISOString();
            saveDB();
            const statusEl = document.getElementById('backup-status');
            statusEl.textContent =
                `✅ Last backup: ${new Date().toLocaleString('en-IN')} (in ${backupFolderHandle.name})`;
            statusEl.className = 'backup-status success';
            alert('✅ Auto backup saved to selected folder!');
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            db.lastBackup = new Date().toISOString();
            saveDB();
            const statusEl = document.getElementById('backup-status');
            statusEl.textContent = `✅ Last backup: ${new Date().toLocaleString('en-IN')}`;
            statusEl.className = 'backup-status success';
            alert('✅ Auto backup downloaded successfully!');
        }
    } catch (e) {
        const statusEl = document.getElementById('backup-status');
        statusEl.textContent = `❌ Backup failed: ${e.message}`;
        statusEl.className = 'backup-status error';
        alert('❌ Backup failed: ' + e.message);
    }
}

// ==================== EXPORT/IMPORT ====================
function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const sheets = {
        'Sea Quotes': db.rates.sea,
        'Air Quotes': db.rates.air,
        'LCL Quotes': db.rates.lcl,
        'Sea Drafts': db.drafts.sea,
        'Air Drafts': db.drafts.air,
        'LCL Drafts': db.drafts.lcl,
        'Rate Sheet': db.rateSheet,
        'POL': db.pol.map(p => ({ POL: p })),
        'POD': db.pod.map(p => ({ POD: p })),
        'Incoterms': db.incoterms.map(i => ({ Incoterm: i })),
        'Containers': db.containers.map(c => ({ Container: c })),
        'Carriers': db.carriers.map(c => ({ Carrier: c })),
        'Exchange Rates': Object.entries(db.exchangeRates).map(([k, v]) => ({ Currency: k, Rate: v }))
    };
    Object.entries(sheets).forEach(([name, data]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
    });
    XLSX.writeFile(wb, `Gateway_EXIM_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('Excel file downloaded successfully!');
}

function exportToJSON() {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gateway_EXIM_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('JSON backup downloaded successfully!');
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (file.name.endsWith('.json')) {
                const imported = JSON.parse(e.target.result);
                if (confirm('This will replace all current data. Continue?')) {
                    db = imported.data || imported;
                    saveDB();
                    alert('Data imported successfully!');
                    location.reload();
                }
            } else if (file.name.endsWith('.xlsx')) {
                alert('Excel import is complex. Please use JSON format for full backup restore.');
            }
        } catch (err) { alert('Error importing file: ' + err.message); }
    };
    reader.readAsText(file);
    input.value = '';
}

// ==================== RATE SHEET IMPORT ====================
function importRateSheet(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
            if (jsonData.length === 0) { alert('No data found in Excel file.'); return; }
            const normalized = jsonData.map(row => {
                const newRow = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_').replace(
                        /[^a-z0-9_]/g, '');
                    newRow[normalizedKey] = row[key];
                });
                return newRow;
            });
            const preview = document.getElementById('rate-import-preview');
            let html =
                `<h4 style="color:var(--primary);margin-bottom:8px;">Preview: ${normalized.length} rows found</h4>`;
            html += `<table class="master-table" style="font-size:0.72rem;"><thead><tr>`;
            const cols = Object.keys(normalized[0]);
            cols.forEach(k => html += `<th>${k}</th>`);
            html += `</tr></thead><tbody>`;
            normalized.slice(0, 10).forEach(row => {
                html += '<tr>';
                cols.forEach(c => html += `<td>${row[c] || ''}</td>`);
                html += '</tr>';
            });
            if (normalized.length > 10) html +=
                `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--text-light);">... and ${normalized.length - 10} more rows</td></tr>`;
            html += `</tbody></table>`;
            html +=
                `<div style="margin-top:10px;text-align:right;"><button class="btn btn-success" onclick="confirmRateImport()">✅ Import All ${normalized.length} Rows</button> <button class="btn btn-clear" onclick="document.getElementById('rate-import-preview').style.display='none'">Cancel</button></div>`;
            preview.innerHTML = html;
            preview.style.display = 'block';
            window._rateSheetData = normalized;
        } catch (err) { alert('Error reading Excel: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
}

function confirmRateImport() {
    const data = window._rateSheetData;
    if (!data) return;
    let imported = 0,
        skipped = 0,
        errors = [];
    data.forEach((row, i) => {
        try {
            let carrier = row.carrier || row.liner || row.shipping_line || row.name || row
            .shippingline || '';
            let pol = row.pol || row.port_of_loading || row.loading_port || row.origin || row
                .portofloading || '';
            let chargeType = row.charge_type || row.charge || row.charge_name || row.description ||
                row.type || row.chargetype || '';
            let amount = row.amount || row.rate || row.price || row.value || row.charge_amount || 0;
            let currency = row.currency || row.cur || row.ccy || row.currency_code || 'INR';
            let container = row.container || row.container_type || row.size || row.containertype || '';
            carrier = String(carrier).trim();
            pol = String(pol).trim();
            chargeType = String(chargeType).trim().toUpperCase();
            amount = parseFloat(String(amount).replace(/[^\d.-]/g, '')) || 0;
            currency = String(currency).trim().toUpperCase() || 'INR';
            container = String(container).trim();
            if (!carrier || !pol || !chargeType || !amount) { skipped++; return; }
            const isAir = defaultCharges.air.includes(chargeType);
            const isLcl = defaultCharges.lcl.includes(chargeType) && !defaultCharges.sea.includes(
                chargeType);
            let listKey;
            if (isAir) listKey = 'carrierChargesAir';
            else if (isLcl) listKey = 'carrierChargesSeaLcl';
            else listKey = 'carrierChargesSeaLcl';
            const mode = isAir ? 'air' : (isLcl ? 'lcl' : 'sea');
            let entry;
            if (mode === 'air') {
                entry = db[listKey].find(c => c.carrier === carrier && c.pol === pol);
                if (!entry) { entry = { carrier, pol, charges: {}, updated: new Date()
                            .toISOString() };
                    db[listKey].push(entry); }
            } else {
                entry = db[listKey].find(c => c.mode === mode && c.carrier === carrier && c.pol ===
                    pol && (c.container || '') === container);
                if (!entry) { entry = { mode, carrier, pol, container, charges: {}, updated: new Date()
                                .toISOString() };
                    db[listKey].push(entry); }
            }
            entry.charges[chargeType] = { amount, currency };
            imported++;
        } catch (err) { errors.push(`Row ${i+1}: ${err.message}`);
            skipped++; }
    });
    saveDB();
    let msg = `Import Complete!\n✅ Imported: ${imported} charges\n⏭️ Skipped: ${skipped} rows`;
    if (errors.length > 0) msg += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`;
    alert(msg);
    document.getElementById('rate-import-preview').style.display = 'none';
    window._rateSheetData = null;
}

// ==================== COPY QUOTE DATA ====================
function copyQuoteData(mode) {
    const data = getFormData(mode);
    if (!data.client && Object.keys(data.charges).length === 0) {
        alert('No data to copy. Please fill the form first.');
        return;
    }
    let text = '========================================\n';
    text += `       ${mode.toUpperCase()} FREIGHT QUOTATION\n`;
    text += '========================================\n\n';
    text += `Quote Number: ${data.quoteNumber || 'DRAFT'}\n`;
    text += `Date: ${data.autoDate || ''}\n\n`;
    text += '--- CUSTOMER & SHIPMENT DETAILS ---\n';
    text += `Client: ${data.client || '-'}\n`;
    text += `Carrier: ${data.carrier || '-'}\n`;
    text += `POL: ${data.pol || '-'}\n`;
    text += `POD: ${data.pod || '-'}\n`;
    text += `Incoterm: ${data.incoterm || '-'}\n`;
    if (mode === 'sea') text += `Container: ${data.container || '-'}\n`;
    text += `Commodity: ${data.commodity || '-'}\n`;
    text += `Weight (KGS): ${data.weight || '-'}\n`;
    if (mode === 'air') {
        text += `Volume (CBM): ${data.volume || '-'}\n`;
        text += `Pallets: ${data.pallets || '-'}\n`;
    }
    if (mode === 'lcl') text += `Volume (CBM): ${data.volume || '-'}\n`;
    text += `Transit Time: ${data.transit ? data.transit + ' Days' : '-'}\n`;
    text += `Validity Date: ${data.validityDate || '-'}\n`;
    text += `Remarks: ${data.remarks || '-'}\n\n`;
    text += '--- CHARGES BREAKDOWN ---\n';
    const order = data.chargesOrder || getCurrentChargesOrder(mode);
    Object.entries(order).forEach(([category, charges]) => {
        if (charges.length === 0) return;
        const catEntries = charges.filter(ch => data.charges[ch]).map(ch => [ch, data.charges[ch]]);
        if (catEntries.length === 0) return;
        text += `\n[${category.toUpperCase()}]\n`;
        text +=
            '  #  Charge Type              Amount   Currency   INR Equivalent   Basis\n';
        text += '  ----------------------------------------------------------------\n';
        let catTotal = 0;
        catEntries.forEach(([type, c], i) => {
            const inr = toINR(c.amount, c.currency);
            catTotal += inr;
            const typeStr = type.padEnd(24).slice(0, 24);
            const amtStr = String(Number(c.amount).toLocaleString('en-IN')).padStart(8);
            const curStr = c.currency.padEnd(9);
            const inrStr = formatINR(inr);
            const basisStr = (c.basis || 'Normal').padEnd(10);
            text += `  ${String(i+1).padStart(2)}  ${typeStr}  ${amtStr}  ${curStr}  ${inrStr}  ${basisStr}\n`;
        });
        text += `  ----------------------------------------------------------------\n`;
        text += `  Subtotal: ${formatINR(catTotal)}\n`;
    });
    let grandTotal = 0;
    Object.values(data.charges).forEach(c => { grandTotal += toINR(c.amount, c.currency); });
    text += '\n  =========================================\n';
    text += `  GRAND TOTAL (INR): ${formatINR(grandTotal)}\n`;
    text += '  =========================================\n\n';
    text += `--- COMPANY ---\n`;
    text += `${db.companyName || 'GATEWAY EXIM'}\n`;
    text += `${db.companyAddress || ''}\n\n`;
    text += `Prepared By: ${db.defaultUser || 'N/A'}\n`;
    text += `Generated on: ${new Date().toLocaleString('en-IN')}`;

    document.getElementById('copyContent').value = text;
    document.getElementById('modal-title').textContent = `📋 Copy Quote Data — ${mode.toUpperCase()}`;
    openModal('copyModal');
}

function copyToClipboard() {
    const textarea = document.getElementById('copyContent');
    textarea.select();
    document.execCommand('copy');
    alert('✅ Data copied to clipboard!');
}

// ==================== EMAIL FUNCTIONS ====================
function buildEmailHTML(data, mode) {
    const modeLabel = { sea: 'SEA FREIGHT', air: 'AIR FREIGHT', lcl: 'LCL FREIGHT' }[mode];
    const rows = Object.entries(data.charges || {}).map(([name, c]) =>
        `<tr><td>${name}</td><td>${c.amount}</td><td>${c.currency}</td><td>${formatINR(toINR(c.amount, c.currency))}</td></tr>`
    ).join('');
    return `<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>${modeLabel} Quotation</title></head>
            <body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#f9fafb;">
            <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <h2 style="color:#1e3a8a;border-bottom:2px solid #3b82f6;padding-bottom:10px;">${modeLabel} QUOTATION</h2>
                <p><strong>Quote No:</strong> ${data.quoteNumber || 'DRAFT'}</p>
                <p><strong>Date:</strong> ${data.autoDate || ''}</p>
                <p><strong>Client:</strong> ${data.client || '-'}</p>
                <p><strong>Route:</strong> ${data.pol || '-'} → ${data.pod || '-'}</p>
                <p><strong>Carrier:</strong> ${data.carrier || '-'}</p>
                ${mode === 'sea' ? `<p><strong>Container:</strong> ${data.container || '-'}</p>` : ''}
                <p><strong>Commodity:</strong> ${data.commodity || '-'}</p>
                <p><strong>Transit Time:</strong> ${data.transit ? data.transit + ' Days' : '-'}</p>
                <p><strong>Validity:</strong> ${data.validityDate || '-'}</p>
                <h3 style="margin-top:20px;">Charge Breakdown</h3>
                <table style="width:100%;border-collapse:collapse;margin:10px 0;">
                    <thead><tr style="background:#1e3a8a;color:white;">
                        <th style="padding:8px;text-align:left;">Charge</th>
                        <th style="padding:8px;text-align:right;">Amount</th>
                        <th style="padding:8px;text-align:left;">Currency</th>
                        <th style="padding:8px;text-align:right;">INR Equivalent</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot><tr style="background:#10b981;color:white;font-weight:bold;">
                        <td colspan="3" style="padding:8px;text-align:right;">GRAND TOTAL (INR)</td>
                        <td style="padding:8px;text-align:right;">${formatINR(data.totalSellINR)}</td>
                    </tr></tfoot>
                </table>
                ${data.remarks ? `<p><strong>Remarks:</strong> ${data.remarks}</p>` : ''}
                <p style="margin-top:20px;font-size:0.9rem;color:#64748b;text-align:center;">
                    ${db.companyName || 'GATEWAY EXIM'}<br>${db.companyAddress || ''}
                </p>
            </div>
            </body>
            </html>`;
}

function emailQuote(mode) {
    const data = getFormData(mode);
    if (!data.client && Object.keys(data.charges).length === 0) return alert('Fill data first');
    if (!data.quoteNumber) data.quoteNumber = document.getElementById(`${mode}-qn-value`).textContent || 'DRAFT';
    currentEmailData = { data, mode };
    const modeLabel = mode.toUpperCase();
    const containerInfo = mode === 'sea' ? (data.container || 'N/A') : (data.volume ? `${data.volume} CBM` :
        'N/A');
    document.getElementById('email-subject').value =
        `${modeLabel} FREIGHT QUOTE // ${data.quoteNumber} // ${data.pol||'N/A'} TO ${data.pod||'N/A'} // ${containerInfo} // ${data.commodity||'N/A'}`;
    const htmlContent = buildEmailHTML(data, mode);
    document.getElementById('email-html-preview').innerHTML = htmlContent;
    openModal('emailModal');
}

function emailSavedQuote(target, mode, idx) {
    const rec = db[target][mode][idx];
    currentEmailData = { data: rec, mode };
    const modeLabel = mode.toUpperCase();
    const containerInfo = mode === 'sea' ? (rec.container || 'N/A') : (rec.volume ? `${rec.volume} CBM` :
        'N/A');
    document.getElementById('email-subject').value =
        `${modeLabel} FREIGHT QUOTE // ${rec.quoteNumber} // ${rec.pol||'N/A'} TO ${rec.pod||'N/A'} // ${containerInfo} // ${rec.commodity||'N/A'}`;
    const htmlContent = buildEmailHTML(rec, mode);
    document.getElementById('email-html-preview').innerHTML = htmlContent;
    openModal('emailModal');
}

function copyEmailHTML() {
    const previewDiv = document.getElementById('email-html-preview');
    const html = previewDiv.innerHTML;
    navigator.clipboard.writeText(html).then(() => {
        alert("HTML copied to clipboard! Paste it into your email client's HTML editor.");
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = html;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('HTML copied to clipboard!');
    });
}

function sendEmail() {
    if (!currentEmailData) return alert('No data');
    const to = document.getElementById('email-to').value.trim();
    if (!to) return alert('Enter recipient email');
    const { data, mode } = currentEmailData;
    const htmlContent = buildEmailHTML(data, mode);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Email_Quotation_${data.quoteNumber || 'DRAFT'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    const subject = encodeURIComponent(document.getElementById('email-subject').value);
    const body = encodeURIComponent(
        `Please find the attached HTML quotation.\n\nQuote No: ${data.quoteNumber}\nTotal: ${formatINR(data.totalSellINR)}`
        );
    let mailto = `mailto:${to}?subject=${subject}&body=${body}`;
    const cc = document.getElementById('email-cc').value.trim();
    if (cc) mailto += `&cc=${cc}`;
    window.location.href = mailto;
    closeModal('emailModal');
    setTimeout(() => { alert('✅ HTML email file downloaded. Please attach it to your email.'); }, 500);
}

// ==================== PDF GENERATION (using html2canvas for exact match) ====================
function generatePDF(data, mode) {
    if (typeof html2canvas === 'undefined') {
        alert('html2canvas library not loaded. Please check your internet connection and refresh the page.');
        return;
    }
    const html = buildPreviewHTML(data, mode);
    const renderArea = document.getElementById('pdf-render-area');
    if (!renderArea) {
        alert('PDF render area not found. Please refresh the page.');
        return;
    }
    renderArea.innerHTML = html;
    renderArea.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: 800px;
        background: white !important;
        z-index: 9999;
        opacity: 1;
        padding: 20px;
        box-shadow: 0 0 20px rgba(0,0,0,0.2);
        font-family: 'Segoe UI', Arial, sans-serif !important;
    `;
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
        th { background: #f1f5f9; font-weight: bold; }
        .charge-row { display: none !important; }
        .charges-header { display: none !important; }
    `;
    renderArea.appendChild(styleTag);
    setTimeout(() => {
        html2canvas(renderArea, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 800,
            windowWidth: 800,
            onclone: (clonedDoc) => {
                const rows = clonedDoc.querySelectorAll('.charge-row, .charges-header');
                rows.forEach(el => el.style.display = 'none');
            }
        }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;
            pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }
            const fileName = `${data.quoteNumber || 'Quote'}.pdf`;
            pdf.save(fileName);
            renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
            renderArea.innerHTML = '';
        }).catch(err => {
            console.error('PDF error:', err);
            alert('PDF generation failed: ' + err.message);
            renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
            renderArea.innerHTML = '';
        });
    }, 500);
}

function downloadPDF(mode) {
    const data = getFormData(mode);
    if (!data.client && Object.keys(data.charges).length === 0) {
        alert('Please fill the form with at least a Client Name and charges before generating PDF.');
        return;
    }
    if (!data.quoteNumber) {
        data.quoteNumber = document.getElementById(`${mode}-qn-value`).textContent || 'DRAFT-' + Date.now();
    }
    if (!data.chargesOrder || Object.keys(data.chargesOrder).length === 0) {
        data.chargesOrder = getCurrentChargesOrder(mode);
    }
    generatePDF(data, mode);
}

function downloadSavedPDF(target, mode, idx) {
    const rec = db[target][mode][idx];
    if (!rec.chargesOrder || Object.keys(rec.chargesOrder).length === 0) {
        rec.chargesOrder = getCurrentChargesOrder(mode);
    }
    generatePDF(rec, mode);
}

// ==================== PREVIEW ====================
function buildPreviewHTML(data, mode) {
    const modeLabel = { sea: 'SEA FREIGHT', air: 'AIR FREIGHT', lcl: 'LCL FREIGHT' }[mode];
    const validityDisplay = data.validityDate ? new Date(data.validityDate).toLocaleDateString('en-IN', { day: '2-digit',
        month: 'short', year: 'numeric' }) : '—';
    const transitDisplay = data.transit ? `${data.transit} Days` : '—';
    const userName = db.defaultUser || 'N/A';
    const order = data.chargesOrder || getCurrentChargesOrder(mode);
    const toUpper = (val) => val ? String(val).toUpperCase() : '-';
    let html =
        `<div style="background:#ffffff !important; color:#1a1a1a !important; font-family:'Segoe UI',Arial,sans-serif; max-width:800px; margin:0 auto; padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
                    <div style="text-align:left;">
                        <div style="font-size:1.4rem;color:#1e3a8a !important;font-weight:800;letter-spacing:1px;">${modeLabel} QUOTATION</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-family:'Courier New',monospace;color:#d97706 !important;font-weight:700;font-size:0.95rem;background:#fffbeb;padding:5px 12px;border-radius:5px;">Quote No: ${data.quoteNumber||'DRAFT'}</div>
                    </div>
                </div>
                <div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:7px 11px;margin-top:16px;border-radius:5px 5px 0 0;font-size:0.88rem;">Customer & Shipment Details</div>
                <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.82rem;">
                    <tr><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Client</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${toUpper(data.client)}</td><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Quote Date</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${data.autoDate||'-'}</td></tr>
                    <tr><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Carrier</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${toUpper(data.carrier)}</td><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Incoterm</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${toUpper(data.incoterm)}</td></tr>
                    <tr><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">POL</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${toUpper(data.pol)}</td><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">POD</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${toUpper(data.pod)}</td></tr>
                    <tr><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Commodity</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${toUpper(data.commodity)}</td><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Weight (KGS)</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${data.weight||'-'}</td></tr>
                    <tr><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">${mode==='sea'?'Container':'Volume (CBM)'}</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${mode==='sea'?toUpper(data.container):(data.volume||'-')}</td><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Transit Time</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${transitDisplay}</td></tr>
                    <tr><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Validity Date</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${validityDisplay}</td><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Status</th><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${toUpper(data.status)}</td></tr>
                </table>`;
    const entries = Object.entries(data.charges || {});
    if (entries.length > 0) {
        Object.entries(order).forEach(([category, charges]) => {
            if (charges.length === 0) return;
            const catEntries = charges.filter(ch => data.charges[ch]).map(ch => [ch, data.charges[ch]]);
            if (catEntries.length === 0) return;
            html +=
                `<div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:7px 11px;margin-top:16px;border-radius:5px 5px 0 0;font-size:0.88rem;">${category.toUpperCase()}</div>
                    <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.82rem;">
                        <tr><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">#</th><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Charge Type</th><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Amount</th><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Currency</th><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">INR Equivalent</th><th style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Basis</th></tr>`;
            let catTotal = 0;
            catEntries.forEach(([type, c], i) => {
                const inr = toINR(c.amount, c.currency);
                catTotal += inr;
                const isFreight = type.toUpperCase() === 'FREIGHT' || type.toUpperCase() ===
                    'AIR FREIGHT';
                const rowStyle = isFreight ?
                    'background:#fee2e2 !important;font-weight:700;color:#dc2626 !important;' : '';
                html += `<tr style="${rowStyle}">
                            <td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${i+1}</td>
                            <td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${type.toUpperCase()}</td>
                            <td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${Number(c.amount).toLocaleString('en-IN')}</td>
                            <td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${c.currency}</td>
                            <td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${formatINR(inr)}</td>
                            <td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;">${c.basis || 'Normal'}</td>
                        </tr>`;
            });
            html +=
                `<tr style="background:#f1f5f9 !important;"><td colspan="5" style="border:1px solid #d1d5db;padding:6px 9px;text-align:right;font-weight:700;color:#334155 !important;">Subtotal:</td><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;font-weight:700;color:#334155 !important;">${formatINR(catTotal)}</td></tr></table>`;
        });
        let grandTotal = 0;
        entries.forEach(([type, c]) => { grandTotal += toINR(c.amount, c.currency); });
        html += `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:0.82rem;">
                    <tr style="background:#10b981 !important;color:white !important;font-weight:700;">
                        <td colspan="5" style="border:1px solid #059669;padding:8px 11px;text-align:right;color:white !important;"><strong>GRAND TOTAL (INR)</strong></td>
                        <td style="border:1px solid #059669;padding:8px 11px;text-align:left;color:white !important;"><strong>${formatINR(grandTotal)}</strong></td>
                    </tr>
                </table>`;
    }
    if (data.remarks) {
        html += `<div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:7px 11px;margin-top:16px;border-radius:5px 5px 0 0;font-size:0.88rem;">Remarks</div>
                <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.82rem;">
                    <tr><td style="border:1px solid #d1d5db;padding:8px 11px;text-align:left;color:#1a1a1a !important;white-space:pre-wrap;line-height:1.5;">${data.remarks.toUpperCase()}</td></tr>
                </table>`;
    }
    html += `<div style="margin-top:20px;padding:12px;background:#f8fafc !important;border:1px solid #e2e8f0;border-radius:6px;text-align:center;font-size:0.72rem;color:#475569 !important;line-height:1.5;">
                <strong style="color:#1e3a8a !important;font-size:0.9rem;display:block;margin-bottom:4px;">${db.companyName||'GATEWAY EXIM'}</strong>
                ${db.companyAddress||''}
            </div>
            <div style="margin-top:16px;font-size:0.78rem;color:#64748b !important;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px;">
                <p style="font-size:0.9rem;color:#334155 !important;margin-bottom:8px;"><strong>Prepared By:</strong> ${userName}</p>
                <p>This quotation is system-generated. Rates are subject to change based on validity date.</p>
                <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            </div>
            </div>`;
    return html;
}

function previewQuote(mode) {
    const data = getFormData(mode);
    if (!data.client && Object.keys(data.charges).length === 0) return alert('Fill data first');
    if (!data.quoteNumber) data.quoteNumber = document.getElementById(`${mode}-qn-value`).textContent || 'DRAFT';
    document.getElementById('modal-title').textContent = 'Quotation Preview';
    document.getElementById('previewBody').innerHTML = buildPreviewHTML(data, mode);
    document.getElementById('previewBody').style.background = 'white';
    openModal('previewModal');
}

function previewSavedRecord(target, mode, idx) {
    const rec = db[target][mode][idx];
    document.getElementById('modal-title').textContent = 'Quotation Preview';
    document.getElementById('previewBody').innerHTML = buildPreviewHTML(rec, mode);
    document.getElementById('previewBody').style.background = 'white';
    openModal('previewModal');
}

// ==================== DATABASE MANAGEMENT ====================
function saveCompanyInfo() {
    const name = document.getElementById('company-name').value.trim();
    const address = document.getElementById('company-address').value.trim();
    if (!name || !address) return alert('Please fill both fields');
    db.companyName = name;
    db.companyAddress = address;
    saveDB();
    document.getElementById('current-company-name').textContent = name;
    alert('Company information saved!');
}

function saveDefaultUser() {
    const val = document.getElementById('default-user-input').value.trim();
    if (!val) return alert('Enter name');
    db.defaultUser = val;
    saveDB();
    document.getElementById('current-default-user').textContent = val;
    document.getElementById('default-user-input').value = '';
    alert('Saved!');
}

function renderDatabase() {
    document.getElementById('current-company-name').textContent = db.companyName || 'Not Set';
    document.getElementById('current-default-user').textContent = db.defaultUser || 'Not Set';
    document.getElementById('company-name').value = db.companyName || '';
    document.getElementById('company-address').value = db.companyAddress || '';
    const statusEl = document.getElementById('backup-status');
    if (db.lastBackup) {
        statusEl.textContent = `✅ Last backup: ${new Date(db.lastBackup).toLocaleString('en-IN')}`;
        statusEl.className = 'backup-status success';
    } else {
        statusEl.textContent = 'Last backup: Never';
        statusEl.className = 'backup-status';
    }
    populateDropdowns();
    renderExchangeTable();
    renderMasterData();
}

// ==================== MASTER DATA MANAGEMENT ====================
function switchMasterTab(tab) {
    currentMasterTab = tab;
    masterPage = 1;
    document.querySelectorAll('.master-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.master === tab);
    });
    renderMasterData();
}

function addMultipleMasterItems() {
    const textarea = document.getElementById('new-master-items');
    const raw = textarea.value;
    if (!raw.trim()) { alert('Please enter at least one item.'); return; }
    const items = raw.split(/[\n.]+/).map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    if (items.length === 0) { alert('No valid items found.'); return; }
    let added = 0,
        skipped = 0;
    items.forEach(item => {
        const exists = db[currentMasterTab].some(existing => existing.toUpperCase() === item);
        if (!exists) {
            db[currentMasterTab].push(item);
            added++;
        } else {
            skipped++;
        }
    });
    if (added === 0 && skipped > 0) {
        alert('All items already exist. No new items added.');
    } else {
        saveDB();
        renderMasterData();
        populateDropdowns();
        alert(`✅ Added ${added} new item(s). Skipped ${skipped} duplicate(s).`);
    }
    textarea.value = '';
}

function renderMasterData() {
    const list = document.getElementById('master-list');
    if (!list) return;
    masterSearch = (document.getElementById('master-search')?.value || '').toLowerCase();
    masterShowMode = document.getElementById('master-show-hidden')?.value || 'visible';
    masterSort = document.getElementById('master-sort')?.value || 'alpha-asc';
    masterPerPage = parseInt(document.getElementById('master-per-page')?.value || '20');
    let items = [...db[currentMasterTab]];
    const hidden = db.hiddenItems[currentMasterTab] || [];
    if (masterShowMode === 'visible') items = items.filter(item => !hidden.includes(item));
    else if (masterShowMode === 'hidden') items = items.filter(item => hidden.includes(item));
    if (masterSearch) items = items.filter(item => item.toLowerCase().includes(masterSearch));
    if (masterSort === 'alpha-asc') items.sort((a, b) => a.localeCompare(b));
    else if (masterSort === 'alpha-desc') items.sort((a, b) => b.localeCompare(a));
    const totalPages = Math.ceil(items.length / masterPerPage) || 1;
    if (masterPage > totalPages) masterPage = totalPages;
    if (masterPage < 1) masterPage = 1;
    const start = (masterPage - 1) * masterPerPage;
    const pageItems = items.slice(start, start + masterPerPage);
    if (items.length === 0) {
        list.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center;">No items found</p>';
    } else {
        list.innerHTML = pageItems.map(item => {
            const isHidden = hidden.includes(item);
            return `<div class="master-item ${isHidden ? 'hidden-item' : ''}">
                        <span>${item} ${isHidden ? '<em style="color:var(--text-light);">(Hidden)</em>' : ''}</span>
                        <div class="master-item-actions">
                            <button class="btn btn-sm ${isHidden ? 'btn-success' : 'btn-draft'}" onclick="toggleHideItem('${currentMasterTab}','${item.replace(/'/g, "\\'")}')">
                                ${isHidden ? '👁 Show' : '🔒 Hide'}
                            </button>
                            <button class="btn btn-sm btn-clear" onclick="removeMasterItem('${currentMasterTab}','${item.replace(/'/g, "\\'")}')">×</button>
                        </div>
                    </div>`;
        }).join('');
    }
    const pagination = document.getElementById('master-pagination');
    if (items.length === 0) { pagination.innerHTML = ''; return; }
    let pagHtml =
        `<button class="page-btn" onclick="changeMasterPage(${masterPage - 1})" ${masterPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
    pagHtml += `<span class="page-info">Page ${masterPage} of ${totalPages} (${items.length} items)</span>`;
    pagHtml +=
        `<button class="page-btn" onclick="changeMasterPage(${masterPage + 1})" ${masterPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
    pagination.innerHTML = pagHtml;
}

function changeMasterPage(page) {
    let items = [...db[currentMasterTab]];
    const hidden = db.hiddenItems[currentMasterTab] || [];
    const showMode = document.getElementById('master-show-hidden')?.value || 'visible';
    const search = (document.getElementById('master-search')?.value || '').toLowerCase();
    if (showMode === 'visible') items = items.filter(item => !hidden.includes(item));
    else if (showMode === 'hidden') items = items.filter(item => hidden.includes(item));
    if (search) items = items.filter(item => item.toLowerCase().includes(search));
    const sort = document.getElementById('master-sort')?.value || 'alpha-asc';
    if (sort === 'alpha-asc') items.sort((a, b) => a.localeCompare(b));
    else if (sort === 'alpha-desc') items.sort((a, b) => b.localeCompare(a));
    const totalPages = Math.ceil(items.length / masterPerPage) || 1;
    if (page < 1 || page > totalPages) return;
    masterPage = page;
    renderMasterData();
}

function addMasterItem() {
    const input = document.getElementById('new-master-item');
    const val = input.value.trim();
    if (!val) return alert('Enter item value');
    const normalized = val.toUpperCase().trim();
    const exists = db[currentMasterTab].some(item => item.toUpperCase().trim() === normalized);
    if (exists) { alert('This entry already exists.'); return; }
    db[currentMasterTab].push(val);
    saveDB();
    input.value = '';
    renderMasterData();
    populateDropdowns();
}

function removeMasterItem(tab, item) {
    if (confirm(`Delete "${item}"?`)) {
        db[tab] = db[tab].filter(i => i !== item);
        if (db.hiddenItems[tab]) db.hiddenItems[tab] = db.hiddenItems[tab].filter(i => i !== item);
        saveDB();
        renderMasterData();
        populateDropdowns();
    }
}

function toggleHideItem(tab, item) {
    if (!db.hiddenItems[tab]) db.hiddenItems[tab] = [];
    const idx = db.hiddenItems[tab].indexOf(item);
    if (idx >= 0) db.hiddenItems[tab].splice(idx, 1);
    else db.hiddenItems[tab].push(item);
    saveDB();
    renderMasterData();
    populateDropdowns();
}

// ==================== POPULATE DROPDOWNS (duplicate-free & sorted) ====================
function populateDropdowns() {
    const hiddenPol = db.hiddenItems.pol || [];
    const hiddenPod = db.hiddenItems.pod || [];
    const hiddenIncoterms = db.hiddenItems.incoterms || [];
    const hiddenContainers = db.hiddenItems.containers || [];
    const hiddenCarriers = db.hiddenItems.carriers || [];

    const visiblePol = [...new Set(db.pol.filter(p => !hiddenPol.includes(p)))].sort((a, b) => a.localeCompare(b));
    const visiblePod = [...new Set(db.pod.filter(p => !hiddenPod.includes(p)))].sort((a, b) => a.localeCompare(b));
    const visibleIncoterms = [...new Set(db.incoterms.filter(i => !hiddenIncoterms.includes(i)))].sort((a, b) => a
        .localeCompare(b));
    const visibleContainers = [...new Set(db.containers.filter(c => !hiddenContainers.includes(c)))].sort((a, b) => a
        .localeCompare(b));
    const visibleCarriers = [...new Set(db.carriers.filter(c => !hiddenCarriers.includes(c)))].sort((a, b) => a
        .localeCompare(b));

    ['sea', 'air', 'lcl'].forEach(mode => {
        populateSelect(`${mode}-carrier`, visibleCarriers);
        populateSelect(`${mode}-pol`, visiblePol);
        populateSelect(`${mode}-pod`, visiblePod);
        populateSelect(`${mode}-incoterm`, visibleIncoterms);
        if (mode === 'sea') populateSelect(`${mode}-container`, visibleContainers);
    });
    populateSelect('dc-sea-filter-carrier', ['ALL', ...visibleCarriers]);
    populateSelect('dc-sea-filter-pol', visiblePol);
    populateSelect('dc-air-filter-pol', visiblePol);
    populateSelect('dc-lcl-filter-pol', visiblePol);
}

function populateSelect(id, options) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">Select</option>' + options.map(o => `<option value="${o}">${o}</option>`).join('');
    sel.value = cur;
}

// ==================== EXCHANGE RATES ====================
function renderExchangeTable() {
    const t = document.getElementById('exchange-table');
    let html = `<tr><th>Currency</th><th>Rate</th><th>Action</th></tr>`;
    Object.keys(db.exchangeRates).forEach(cur => {
        const disabled = cur === 'INR' ? 'disabled' : '';
        html += `<tr><td><strong>${cur}</strong>${cur === 'INR' ? ' (Base)' : ''}</td>
                    <td><input type="number" step="0.0001" value="${db.exchangeRates[cur]}" ${disabled} onchange="updateRate('${cur}',this.value)" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td>${cur !== 'INR' ? `<button class="btn btn-sm btn-clear" onclick="deleteRate('${cur}')">×</button>` : ''}</td></tr>`;
    });
    t.innerHTML = html;
}

function addExchangeRate() {
    const code = document.getElementById('new-currency').value.trim().toUpperCase();
    const rate = parseFloat(document.getElementById('new-rate').value);
    if (!code) return alert('Enter code');
    if (isNaN(rate) || rate <= 0) return alert('Valid rate');
    if (db.exchangeRates[code]) return alert('Exists');
    db.exchangeRates[code] = rate;
    saveDB();
    document.getElementById('new-currency').value = '';
    document.getElementById('new-rate').value = '';
    renderExchangeTable();
    populateDropdowns();
}

function updateRate(cur, val) {
    const v = parseFloat(val);
    if (isNaN(v) || v <= 0) return alert('Invalid');
    db.exchangeRates[cur] = v;
    saveDB();
}

function deleteRate(cur) {
    if (cur === 'INR') return;
    showDeleteConfirm(`Delete <strong>${cur}</strong>?`, function() {
        delete db.exchangeRates[cur];
        saveDB();
        renderExchangeTable();
        populateDropdowns();
    });
}

// ==================== DEFAULT CHARGES MASTER ====================
function renderDefaultChargesMaster(mode) {
    const search = (document.getElementById(`dc-${mode}-search`)?.value || '').toLowerCase();
    let records = [];
    if (mode === 'sea') records = db.defaultSeaCharges;
    else if (mode === 'air') records = db.defaultAirCharges;
    else if (mode === 'lcl') records = db.defaultLclCharges;
    const filterCarrier = mode === 'sea' ? (document.getElementById(`dc-sea-filter-carrier`)?.value || '') : '';
    const filterPol = document.getElementById(`dc-${mode}-filter-pol`)?.value || '';
    records = records.filter(r => {
        let text = '';
        if (mode === 'sea') text = `${r.carrier} ${r.pol} ${r.container}`.toLowerCase();
        else text = `${r.pol}`.toLowerCase();
        if (search && !text.includes(search)) return false;
        if (mode === 'sea' && filterCarrier && r.carrier !== filterCarrier) return false;
        if (filterPol && r.pol !== filterPol) return false;
        return true;
    });
    const disp = document.getElementById(`dc-${mode}-master-table`);
    const chargeTypes = mode === 'sea' ?
        ['CFS', 'CLEARANCE', 'VGM', 'TOLL', 'LASHING & CHOKING', 'HAZ STICKER', 'TRANSPORTATION', 'LOLO',
            'OTHER LOCALS'
        ] :
        mode === 'air' ?
        ['AIR FREIGHT', 'CARTAGE', 'MCC', 'XRAY', 'CUSTOM CLEARANCE', 'AWB FEES'] :
        ['FREIGHT', 'THC', 'CLEARANCE', 'VGM'];
    let html = `<table class="master-table"><thead><tr>`;
    if (mode === 'sea') html += `<th>Carrier</th>`;
    html += `<th>POL</th>`;
    if (mode === 'sea') html += `<th>Container</th>`;
    chargeTypes.forEach(ct => html += `<th>${ct}</th>`);
    html += `<th>Action</th></tr></thead><tbody>`;
    if (records.length === 0) {
        const cols = mode === 'sea' ? 4 + chargeTypes.length + 1 : 2 + chargeTypes.length + 1;
        html +=
            `<tr><td colspan="${cols}" style="text-align:center;padding:16px;color:var(--text-light);">No records.</td></tr>`;
    } else {
        records.forEach((rec, idx) => {
            html += `<tr>`;
            if (mode === 'sea') html += `<td><strong>${rec.carrier}</strong></td>`;
            html += `<td>${rec.pol}</td>`;
            if (mode === 'sea') html += `<td>${rec.container}</td>`;
            chargeTypes.forEach(ct => {
                const data = rec.charges[ct];
                html += `<td>${data ? `${data.amount} ${data.currency}` : '—'}</td>`;
            });
            html += `<td>
                        <button class="btn btn-sm btn-preview" onclick="openEditDefaultChargeModal('${mode}',${idx})">Edit</button>
                        <button class="btn btn-sm btn-clear" onclick="deleteDefaultChargeEntry('${mode}',${idx})">×</button>
                    </td></tr>`;
        });
    }
    html += '</tbody></table>';
    disp.innerHTML = html;
}

function openAddDefaultChargeModal(mode) {
    let html = `<h3 style="color:var(--primary);margin-bottom:12px;">Add Default ${mode.toUpperCase()} Charge</h3>`;
    if (mode === 'sea') {
        const carrierNames = db.carriers.map(c => c.name);
        html += `<div class="form-grid-2col">
                    <div class="form-group"><label>Carrier</label><select id="modal-dc-carrier"><option value="ALL">ALL</option>${carrierNames.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                    <div class="form-group"><label>POL</label><select id="modal-dc-pol">${db.pol.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Container</label><select id="modal-dc-container">${db.containers.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                </div>`;
    } else {
        html +=
            `<div class="form-grid-2col"><div class="form-group"><label>POL</label><select id="modal-dc-pol">${db.pol.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div></div>`;
    }
    html += `<h4 style="color:var(--primary);margin:12px 0 8px;">Add Charges</h4>
                <div id="modal-dc-charges-list"></div>
                <div style="margin-top:8px;display:flex;gap:8px;align-items:end;">
                    <div class="form-group" style="flex:1;"><label>Charge Type</label><select id="modal-dc-add-charge">${defaultCharges[mode].map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                    <div class="form-group" style="width:100px;"><label>Amount</label><input type="number" id="modal-dc-add-amt" step="0.01" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                    <div class="form-group" style="width:90px;"><label>Currency</label><select id="modal-dc-add-cur">${getCurrencyOptions('INR')}</select></div>
                    <button class="btn btn-sm btn-success" style="height:33px;" onclick="addChargeToDCModal()">+</button>
                </div>
                <div style="margin-top:16px;text-align:right;">
                    <button class="btn btn-clear" onclick="closeModal('previewModal')">Cancel</button>
                    <button class="btn btn-quoted" onclick="saveNewDefaultCharge('${mode}')">Save</button>
                </div>`;
    document.getElementById('modal-title').textContent = `Add Default ${mode.toUpperCase()} Charge`;
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}

function addChargeToDCModal() {
    const key = document.getElementById('modal-dc-add-charge').value;
    const amt = parseFloat(document.getElementById('modal-dc-add-amt').value) || 0;
    const cur = document.getElementById('modal-dc-add-cur').value;
    const list = document.getElementById('modal-dc-charges-list');
    if (list.querySelector(`[data-charge-key="${key}"]`)) return alert('Exists');
    list.insertAdjacentHTML('beforeend', `<div style="margin-bottom:6px;background:var(--bg);padding:6px;border-radius:5px;border:1px solid var(--border);" data-charge-key="${key}">
                <div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:0.8rem;">${key} <button class="btn btn-sm btn-clear" style="float:right;height:22px;padding:2px 6px;" onclick="this.closest('[data-charge-key]').remove()">×</button></div>
                <div style="display:flex;gap:6px;">
                    <input type="number" step="0.01" class="modal-chg-amt" value="${amt}" style="flex:1;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                    <select class="modal-chg-cur" style="width:80px;padding:4px 6px;border:1px solid var(--border);border-radius:3px;">${getCurrencyOptions(cur)}</select>
                </div>
            </div>`);
    document.getElementById('modal-dc-add-amt').value = '';
}

function saveNewDefaultCharge(mode) {
    const pol = document.getElementById('modal-dc-pol').value;
    if (!pol) return alert('POL required');
    const charges = {};
    document.querySelectorAll('#modal-dc-charges-list [data-charge-key]').forEach(row => {
        const key = row.getAttribute('data-charge-key');
        const amt = parseFloat(row.querySelector('.modal-chg-amt').value) || 0;
        const cur = row.querySelector('.modal-chg-cur').value;
        if (amt > 0) charges[key] = { amount: amt, currency: cur };
    });
    if (mode === 'sea') {
        const carrier = document.getElementById('modal-dc-carrier').value.trim() || 'ALL';
        const container = document.getElementById('modal-dc-container').value;
        if (!container) return alert('Container required');
        if (db.defaultSeaCharges.find(d => d.carrier === carrier && d.pol === pol && d.container === container))
            return alert('Exists!');
        db.defaultSeaCharges.push({ carrier, pol, container, charges });
    } else if (mode === 'air') {
        if (db.defaultAirCharges.find(d => d.pol === pol)) return alert('Exists!');
        db.defaultAirCharges.push({ pol, charges });
    } else if (mode === 'lcl') {
        if (db.defaultLclCharges.find(d => d.pol === pol)) return alert('Exists!');
        db.defaultLclCharges.push({ pol, charges });
    }
    saveDB();
    closeModal('previewModal');
    renderDefaultChargesMaster(mode);
    alert('Added!');
}

function openEditDefaultChargeModal(mode, idx) {
    let rec;
    if (mode === 'sea') rec = db.defaultSeaCharges[idx];
    else if (mode === 'air') rec = db.defaultAirCharges[idx];
    else rec = db.defaultLclCharges[idx];
    const carrierNames = db.carriers.map(c => c.name);
    let html = `<h3 style="color:var(--primary);margin-bottom:12px;">Edit Default ${mode.toUpperCase()} Charge</h3>`;
    if (mode === 'sea') {
        html += `<div class="form-grid-2col">
                    <div class="form-group"><label>Carrier</label><select id="modal-dc-carrier-edit"><option value="ALL" ${rec.carrier==='ALL'?'selected':''}>ALL</option>${carrierNames.map(c => `<option value="${c}" ${rec.carrier===c?'selected':''}>${c}</option>`).join('')}</select></div>
                    <div class="form-group"><label>POL</label><input type="text" id="modal-dc-pol-edit" value="${rec.pol}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                    <div class="form-group"><label>Container</label><input type="text" id="modal-dc-container-edit" value="${rec.container}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                </div>`;
    } else {
        html +=
            `<div class="form-grid-2col"><div class="form-group"><label>POL</label><input type="text" id="modal-dc-pol-edit" value="${rec.pol}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div></div>`;
    }
    html += `<h4 style="color:var(--primary);margin:12px 0 8px;">Charges</h4><div id="modal-dc-charges-list">`;
    Object.entries(rec.charges).forEach(([key, val]) => {
        html += `<div style="margin-bottom:6px;background:var(--bg);padding:6px;border-radius:5px;border:1px solid var(--border);" data-charge-key="${key}">
                    <div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:0.8rem;">${key} <button class="btn btn-sm btn-clear" style="float:right;height:22px;padding:2px 6px;" onclick="this.closest('[data-charge-key]').remove()">×</button></div>
                    <div style="display:flex;gap:6px;">
                        <input type="number" step="0.01" class="modal-chg-amt" value="${val.amount}" style="flex:1;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                        <select class="modal-chg-cur" style="width:80px;padding:4px 6px;border:1px solid var(--border);border-radius:3px;">${getCurrencyOptions(val.currency)}</select>
                    </div>
                </div>`;
    });
    html += `</div>
                <div style="margin-top:8px;display:flex;gap:8px;align-items:end;">
                    <div class="form-group" style="flex:1;"><label>Add Charge</label><select id="modal-dc-add-charge">${defaultCharges[mode].map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                    <div class="form-group" style="width:100px;"><label>Amount</label><input type="number" id="modal-dc-add-amt" step="0.01" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                    <div class="form-group" style="width:90px;"><label>Currency</label><select id="modal-dc-add-cur">${getCurrencyOptions('INR')}</select></div>
                    <button class="btn btn-sm btn-success" style="height:33px;" onclick="addChargeToDCModal()">+</button>
                </div>
                <div style="margin-top:16px;text-align:right;">
                    <button class="btn btn-clear" onclick="closeModal('previewModal')">Cancel</button>
                    <button class="btn btn-quoted" onclick="saveEditDefaultCharge('${mode}',${idx})">Save</button>
                </div>`;
    document.getElementById('modal-title').textContent = `Edit Default ${mode.toUpperCase()} Charge`;
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}

function saveEditDefaultCharge(mode, idx) {
    let rec;
    if (mode === 'sea') rec = db.defaultSeaCharges[idx];
    else if (mode === 'air') rec = db.defaultAirCharges[idx];
    else rec = db.defaultLclCharges[idx];
    if (mode === 'sea') {
        rec.carrier = document.getElementById('modal-dc-carrier-edit').value.trim();
        rec.container = document.getElementById('modal-dc-container-edit').value.trim();
    }
    rec.pol = document.getElementById('modal-dc-pol-edit').value.trim();
    rec.charges = {};
    document.querySelectorAll('#modal-dc-charges-list [data-charge-key]').forEach(row => {
        const key = row.getAttribute('data-charge-key');
        const amt = parseFloat(row.querySelector('.modal-chg-amt').value) || 0;
        const cur = row.querySelector('.modal-chg-cur').value;
        if (amt > 0) rec.charges[key] = { amount: amt, currency: cur };
    });
    saveDB();
    closeModal('previewModal');
    renderDefaultChargesMaster(mode);
    alert('Saved!');
}

function deleteDefaultChargeEntry(mode, idx) {
    showDeleteConfirm('Delete this entry?', function() {
        if (mode === 'sea') db.defaultSeaCharges.splice(idx, 1);
        else if (mode === 'air') db.defaultAirCharges.splice(idx, 1);
        else db.defaultLclCharges.splice(idx, 1);
        saveDB();
        renderDefaultChargesMaster(mode);
    });
}

// ==================== CARRIER-WISE CHARGES ====================
function renderCarrierChargesMaster(type) {
    const search = (document.getElementById(`cc-${type}-search`)?.value || '').toLowerCase();
    const filterMode = type === 'sealcl' ? (document.getElementById('cc-sealcl-filter-mode')?.value || '') : '';
    let records = type === 'sealcl' ? db.carrierChargesSeaLcl : db.carrierChargesAir;
    records = records.filter(r => {
        const text = `${r.mode||''} ${r.carrier} ${r.pol} ${r.container||''}`.toLowerCase();
        if (search && !text.includes(search)) return false;
        if (type === 'sealcl' && filterMode && r.mode !== filterMode) return false;
        return true;
    });
    const disp = document.getElementById(`cc-${type}-master-table`);
    let html = `<table class="master-table"><thead><tr>`;
    if (type === 'sealcl') html += `<th>Mode</th>`;
    html += `<th>Carrier</th><th>POL</th>`;
    if (type === 'sealcl') html += `<th>Container</th>`;
    html += `<th>Charges</th><th>Updated</th><th>Action</th></tr></thead><tbody>`;
    if (records.length === 0) {
        const cols = type === 'sealcl' ? 7 : 5;
        html +=
            `<tr><td colspan="${cols}" style="text-align:center;padding:16px;color:var(--text-light);">No records.</td></tr>`;
    } else {
        records.forEach((rec, idx) => {
            const chargeCount = Object.keys(rec.charges || {}).length;
            const updated = rec.updated ? new Date(rec.updated).toLocaleDateString('en-IN') : '—';
            html += `<tr>`;
            if (type === 'sealcl') html +=
                `<td><strong style="color:var(--primary);">${(rec.mode||'').toUpperCase()}</strong></td>`;
            html += `<td>${rec.carrier}</td><td>${rec.pol}</td>`;
            if (type === 'sealcl') html += `<td>${rec.container || '—'}</td>`;
            html += `<td style="text-align:center;"><strong>${chargeCount}</strong></td><td>${updated}</td>
                        <td>
                            <button class="btn btn-sm btn-preview" onclick="openEditCarrierChargeModal('${type}',${idx})">Edit</button>
                            <button class="btn btn-sm btn-clear" onclick="deleteCarrierChargeEntry('${type}',${idx})">×</button>
                        </td></tr>`;
        });
    }
    html += '</tbody></table>';
    disp.innerHTML = html;
}

function openAddCarrierChargeModal(type) {
    const carrierNames = db.carriers.map(c => c.name);
    let html =
        `<h3 style="color:var(--primary);margin-bottom:12px;">Add Carrier-Wise Charge — ${type === 'sealcl' ? 'Sea/LCL' : 'Air'}</h3><div class="form-grid-2col">`;
    if (type === 'sealcl') html +=
        `<div class="form-group"><label>Mode</label><select id="modal-cc-mode"><option value="sea">SEA</option><option value="lcl">LCL</option></select></div>`;
    html += `<div class="form-group"><label>Carrier</label><select id="modal-cc-carrier">${carrierNames.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                <div class="form-group"><label>POL</label><select id="modal-cc-pol">${db.pol.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div>`;
    if (type === 'sealcl') html +=
        `<div class="form-group"><label>Container</label><select id="modal-cc-container"><option value="">N/A</option>${db.containers.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>`;
    html += `</div><div style="margin-top:16px;text-align:right;">
                <button class="btn btn-clear" onclick="closeModal('previewModal')">Cancel</button>
                <button class="btn btn-quoted" onclick="saveNewCarrierCharge('${type}')">Save</button>
            </div>`;
    document.getElementById('modal-title').textContent =
        `Add Carrier-Wise Charge — ${type === 'sealcl' ? 'Sea/LCL' : 'Air'}`;
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}

function saveNewCarrierCharge(type) {
    const carrier = document.getElementById('modal-cc-carrier').value;
    const pol = document.getElementById('modal-cc-pol').value;
    if (type === 'sealcl') {
        const mode = document.getElementById('modal-cc-mode').value;
        const container = document.getElementById('modal-cc-container').value;
        if (db.carrierChargesSeaLcl.find(c => c.mode === mode && c.carrier === carrier && c.pol === pol && (c
                .container || '') === container)) return alert('Exists!');
        db.carrierChargesSeaLcl.push({ mode, carrier, pol, container, charges: {}, updated: new Date()
                .toISOString() });
    } else {
        if (db.carrierChargesAir.find(c => c.carrier === carrier && c.pol === pol)) return alert('Exists!');
        db.carrierChargesAir.push({ carrier, pol, charges: {}, updated: new Date().toISOString() });
    }
    saveDB();
    closeModal('previewModal');
    renderCarrierChargesMaster(type);
    alert('Added!');
}

function openEditCarrierChargeModal(type, idx) {
    const rec = type === 'sealcl' ? db.carrierChargesSeaLcl[idx] : db.carrierChargesAir[idx];
    const mode = type === 'sealcl' ? (rec.mode || 'sea') : 'air';
    const modeCharges = defaultCharges[mode] || [];
    let html =
        `<h3 style="color:var(--primary);margin-bottom:12px;">Edit Carrier-Wise Charge</h3><div class="form-grid-2col">`;
    if (type === 'sealcl') html +=
        `<div class="form-group"><label>Mode</label><select id="modal-cc-mode-edit"><option value="sea" ${rec.mode==='sea'?'selected':''}>SEA</option><option value="lcl" ${rec.mode==='lcl'?'selected':''}>LCL</option></select></div>`;
    html += `<div class="form-group"><label>Carrier</label><input type="text" id="modal-cc-carrier-edit" value="${rec.carrier}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
                <div class="form-group"><label>POL</label><input type="text" id="modal-cc-pol-edit" value="${rec.pol}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>`;
    if (type === 'sealcl') html +=
        `<div class="form-group"><label>Container</label><input type="text" id="modal-cc-container-edit" value="${rec.container||''}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>`;
    html += `</div><h4 style="color:var(--primary);margin:12px 0 8px;">Charges (Sell & Buy)</h4><div id="modal-cc-charges-list">`;
    Object.entries(rec.charges).forEach(([key, val]) => {
        html += `<div style="margin-bottom:6px;background:var(--bg);padding:6px;border-radius:5px;border:1px solid var(--border);" data-charge-key="${key}">
                    <div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:0.8rem;">${key} <button class="btn btn-sm btn-clear" style="float:right;height:22px;padding:2px 6px;" onclick="this.closest('[data-charge-key]').remove()">×</button></div>
                    <div class="form-grid-2col">
                        <div style="display:flex;gap:4px;">
                            <input type="number" step="0.01" class="modal-cc-sell-amt" value="${val.amount||''}" placeholder="Sell" style="flex:1;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                            <select class="modal-cc-sell-cur" style="width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:3px;">${getCurrencyOptions(val.currency||'INR')}</select>
                        </div>
                        <div style="display:flex;gap:4px;">
                            <input type="number" step="0.01" class="modal-cc-buy-amt" value="${val.buyAmount||''}" placeholder="Buy" style="flex:1;padding:4px 6px;border:1px solid var(--border);border-radius:3px;color:var(--buy-red);" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                            <select class="modal-cc-buy-cur" style="width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:3px;color:var(--buy-red);">${getCurrencyOptions(val.buyCurrency||'INR')}</select>
                        </div>
                    </div>
                </div>`;
    });
    html += `</div><div style="margin-top:8px;display:flex;gap:8px;align-items:end;">
                <div class="form-group" style="flex:1;"><label>Add Charge</label><select id="modal-cc-add-charge">${modeCharges.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                <button class="btn btn-sm btn-success" style="height:33px;" onclick="addCCChargeToModal()">+</button>
            </div>
            <div style="margin-top:16px;text-align:right;">
                <button class="btn btn-clear" onclick="closeModal('previewModal')">Cancel</button>
                <button class="btn btn-quoted" onclick="saveEditCarrierCharge('${type}',${idx})">Save</button>
            </div>`;
    document.getElementById('modal-title').textContent = 'Edit Carrier-Wise Charge';
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}

function addCCChargeToModal() {
    const key = document.getElementById('modal-cc-add-charge').value;
    const list = document.getElementById('modal-cc-charges-list');
    if (list.querySelector(`[data-charge-key="${key}"]`)) return alert('Exists');
    list.insertAdjacentHTML('beforeend', `<div style="margin-bottom:6px;background:var(--bg);padding:6px;border-radius:5px;border:1px solid var(--border);" data-charge-key="${key}">
                <div style="font-weight:700;color:var(--primary);margin-bottom:4px;font-size:0.8rem;">${key} <button class="btn btn-sm btn-clear" style="float:right;height:22px;padding:2px 6px;" onclick="this.closest('[data-charge-key]').remove()">×</button></div>
                <div class="form-grid-2col">
                    <div style="display:flex;gap:4px;">
                        <input type="number" step="0.01" class="modal-cc-sell-amt" placeholder="Sell" style="flex:1;padding:4px 6px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                        <select class="modal-cc-sell-cur" style="width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:3px;">${getCurrencyOptions('INR')}</select>
                    </div>
                    <div style="display:flex;gap:4px;">
                        <input type="number" step="0.01" class="modal-cc-buy-amt" placeholder="Buy" style="flex:1;padding:4px 6px;border:1px solid var(--border);border-radius:3px;color:var(--buy-red);" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                        <select class="modal-cc-buy-cur" style="width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:3px;color:var(--buy-red);">${getCurrencyOptions('INR')}</select>
                    </div>
                </div>
            </div>`);
}

function saveEditCarrierCharge(type, idx) {
    const rec = type === 'sealcl' ? db.carrierChargesSeaLcl[idx] : db.carrierChargesAir[idx];
    if (type === 'sealcl') {
        rec.mode = document.getElementById('modal-cc-mode-edit').value;
        rec.container = document.getElementById('modal-cc-container-edit').value.trim();
    }
    rec.carrier = document.getElementById('modal-cc-carrier-edit').value.trim();
    rec.pol = document.getElementById('modal-cc-pol-edit').value.trim();
    rec.updated = new Date().toISOString();
    rec.charges = {};
    document.querySelectorAll('#modal-cc-charges-list [data-charge-key]').forEach(row => {
        const key = row.getAttribute('data-charge-key');
        const sellAmt = parseFloat(row.querySelector('.modal-cc-sell-amt').value) || 0;
        const sellCur = row.querySelector('.modal-cc-sell-cur').value;
        const buyAmt = parseFloat(row.querySelector('.modal-cc-buy-amt').value) || 0;
        const buyCur = row.querySelector('.modal-cc-buy-cur').value;
        if (sellAmt > 0 || buyAmt > 0) rec.charges[key] = { amount: sellAmt, currency: sellCur,
            buyAmount: buyAmt, buyCurrency: buyCur };
    });
    saveDB();
    closeModal('previewModal');
    renderCarrierChargesMaster(type);
    alert('Saved!');
}

function deleteCarrierChargeEntry(type, idx) {
    showDeleteConfirm('Delete this entry?', function() {
        if (type === 'sealcl') db.carrierChargesSeaLcl.splice(idx, 1);
        else db.carrierChargesAir.splice(idx, 1);
        saveDB();
        renderCarrierChargesMaster(type);
    });
}

// ==================== INIT ====================
function init() {
    applyTheme(db.theme);
    restoreNavState();
    const lastTab = db.navState.lastTab || 'sea';
    switchToTab(lastTab);
    populateDropdowns();
    renderDatabase();
    if (lastTab === 'drafts') renderRecords('drafts');
    if (lastTab === 'rates') renderRecords('rates');
    if (lastTab === 'ratesheet') { renderRateSheet();
        updateExpiryDashboard(); }
    if (lastTab === 'followup') renderFollowups();
    if (lastTab === 'dashboard') renderDashboard();
    if (lastTab === 'measurement') renderContainerDimensions();
    if (lastTab === 'localcharges') {
        renderDefaultChargesMaster('sea');
        renderDefaultChargesMaster('air');
        renderDefaultChargesMaster('lcl');
        renderCarrierChargesMaster('sealcl');
        renderCarrierChargesMaster('air');
    }
    ['sea', 'air', 'lcl'].forEach(mode => {
        buildChargesGrid(mode);
        setValidityDefault(mode);
    });
    if (backupFolderHandle) {
        startAutoBackup();
        document.getElementById('backup-folder-path').textContent = `📁 ${backupFolderHandle.name}`;
    }
    console.log('🚢 Gateway EXIM Freight Quotation System loaded successfully.');
    console.log(
        `📊 ${db.rates.sea.length + db.rates.air.length + db.rates.lcl.length} quoted records, ${db.drafts.sea.length + db.drafts.air.length + db.drafts.lcl.length} drafts.`
        );
}

document.addEventListener('DOMContentLoaded', init);