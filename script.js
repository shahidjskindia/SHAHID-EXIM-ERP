// ========================================================================
// COMPLETE JAVASCRIPT – Gateway EXIM Freight Quotation System
// ========================================================================
// CRITICAL FIXES APPLIED:
// - Login System & User Management (password preservation on edit)
// - Removed duplicate measurement calculator code
// - Removed renderContainerDimensions call from switchToTab
// - Added US Import Duty calculator (new tab)
// - Added Measurement Defaults (Database) and auto-population
// - Dual-currency output for Product Pricing & US Duty
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
    exchangeRates: { USD: 94.50, GBP: 105.20, RMB: 11.50, EUR: 90.10, AED: 22.75, INR: 1.00 },
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
    navState: { expandedCategories: ['newQuote', 'quoteSheet', 'dsrCat', 'reports', 'admin'], lastTab: 'sea' },
    shipments: [],
    bldrafts: [],
    cargoStatusMaster: ["Booked", "Confirmed", "In Transit", "Delivered", "Cancelled"],
    docsStatusMaster: ["Pending", "In Progress", "Ready", "Sent", "Received"],
    users: [],
    // --- NEW: Measurement Defaults ---
    defaults: {
        gst: 18,
        insurance: 0.05,
        profitMargin: 15,
        defaultCurrency: 'USD',
        usDuty: 0, // Duty % for US
        usTariff: 0, // Tariff % for US
        usMPF: 0.3464,
        usHMF: 0.125,
        inDuty: 7.5,
        inSocialWelfare: 10,
        drawback: 0,
        rodtep: 0
    }
};

// ==================== DATABASE INIT ====================
let db = JSON.parse(localStorage.getItem('freight_db_v20'));
if (!db) {
    db = JSON.parse(JSON.stringify(defaultDB));
    if (!db.carriers || db.carriers.length === 0) {
        db.carriers = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE", "Emirates SkyCargo", "Lufthansa Cargo"];
    }
    db.defaultSeaCharges = [
        { carrier: "ALL", pol: "HAZIRA, IN", container: "20 GP", charges: { CFS: { amount: 16950, currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25, currency: "USD" }, "LASHING & CHOKING": { amount: 2000, currency: "INR" }, "HAZ STICKER": { amount: 500, currency: "INR" }, LOLO: { amount: 2020, currency: "INR" }, "OTHER LOCALS": { amount: 5000, currency: "INR" } } },
        { carrier: "ALL", pol: "HAZIRA, IN", container: "40 HC", charges: { CFS: { amount: 23950, currency: "INR" }, CLEARANCE: { amount: 3000, currency: "INR" }, VGM: { amount: 25, currency: "USD" }, "LASHING & CHOKING": { amount: 3000, currency: "INR" }, "HAZ STICKER": { amount: 900, currency: "INR" }, LOLO: { amount: 3320, currency: "INR" }, "OTHER LOCALS": { amount: 5000, currency: "INR" } } },
        { carrier: "ALL", pol: "NHAVA SHEVA, IN", container: "20 GP", charges: { CFS: { amount: 15300, currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25, currency: "USD" }, TOLL: { amount: 600, currency: "INR" }, "LASHING & CHOKING": { amount: 2500, currency: "INR" }, "HAZ STICKER": { amount: 700, currency: "INR" } } },
        { carrier: "ALL", pol: "MUNDRA, IN", container: "20 GP", charges: { CFS: { amount: 17900, currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25, currency: "USD" }, "LASHING & CHOKING": { amount: 2000, currency: "INR" }, "HAZ STICKER": { amount: 500, currency: "INR" }, TRANSPORTATION: { amount: 3000, currency: "INR" }, LOLO: { amount: 2020, currency: "INR" }, "OTHER LOCALS": { amount: 5000, currency: "INR" } } }
    ];
    db.defaultAirCharges = [
        { pol: "DEL Airport", charges: { "AIR FREIGHT": { amount: 850, currency: "INR" }, "CARTAGE": { amount: 850, currency: "INR" }, "MCC": { amount: 850, currency: "INR" }, "XRAY": { amount: 850, currency: "INR" }, "CUSTOM CLEARANCE": { amount: 2500, currency: "INR" }, "AWB FEES": { amount: 500, currency: "INR" } } }
    ];
    db.defaultLclCharges = [
        { pol: "NHAVA SHEVA, IN", charges: { FREIGHT: { amount: 0, currency: "INR" }, THC: { amount: 1500, currency: "INR" }, CLEARANCE: { amount: 2500, currency: "INR" }, VGM: { amount: 25, currency: "USD" } } }
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
if (!db.navState) db.navState = { expandedCategories: ['newQuote', 'quoteSheet', 'dsrCat', 'reports', 'admin'], lastTab: 'sea' };
if (!db.carriers || db.carriers.length === 0) {
    db.carriers = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE", "Emirates SkyCargo", "Lufthansa Cargo"];
    saveDB();
}
if (!db.shipments) db.shipments = [];
if (!db.bldrafts) db.bldrafts = [];
if (!db.cargoStatusMaster) db.cargoStatusMaster = ["Booked", "Confirmed", "In Transit", "Delivered", "Cancelled"];
if (!db.docsStatusMaster) db.docsStatusMaster = ["Pending", "In Progress", "Ready", "Sent", "Received"];
// Ensure users and defaults
if (!db.users) db.users = [];
if (!db.users.find(u => u.id === 'Shaikh Shahid')) {
    db.users.push({
        id: 'Shaikh Shahid',
        password: '123789',
        name: 'Shaikh Shahid',
        role: 'master',
        permissions: 'all'
    });
}
if (!db.defaults) {
    db.defaults = JSON.parse(JSON.stringify(defaultDB.defaults));
}
saveDB();

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
let SQL = null;
let currentLocalContainer = null;
let sqliteLoadAttempts = 0;
const MAX_SQLITE_ATTEMPTS = 10;
let dsrDesignMode = false;

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
    ['newQuote', 'quoteSheet', 'dsrCat', 'reports', 'admin'].forEach(catId => {
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
        if (['sea', 'air', 'lcl'].includes(currentTab) && hasUnsavedChanges[currentTab] && currentTab !== targetTab) {
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
    if (targetTab === 'ratesheet') { renderRateSheet(); updateExpiryDashboard(); }
    if (targetTab === 'dsr') renderShipments();
    if (targetTab === 'bldraft') renderBLDrafts();
    if (targetTab === 'followup') renderFollowups();
    if (targetTab === 'dashboard') renderDashboard();
    if (targetTab === 'database') renderDatabase();
    if (targetTab === 'measurement') {
        showMeasurementMenu();
        refreshMeasurementDefaults();
        const activeCalc = document.querySelector('.calc-panel.active');
        if (activeCalc) {
            const id = activeCalc.id.replace('calc-', '');
            if (id === 'duty') calcDuty();
            else if (id === 'product') calcProduct();
            else if (id === 'insurance') calcInsurance();
            else if (id === 'us-duty') calcUSDuty();
        }
        setTimeout(populateOOGContainerDropdown, 200);
        setTimeout(renderOOGContainerTable, 300);
        setTimeout(populateDetentionLotDropdown, 200);
        setTimeout(populateFreightDropdowns, 200);
        setTimeout(renderFreightChargeRows, 300);
        setTimeout(renderFreightRecords, 400);
        setTimeout(renderDetentionLots, 250);
        setTimeout(renderDetentionRecords, 300);
        const validFromInput = document.getElementById('fr-valid-from');
        if (validFromInput && !validFromInput.value) {
            validFromInput.valueAsDate = new Date();
        }
    }

    if (['sea', 'air', 'lcl'].includes(targetTab)) {
        populateDropdowns();
    }
    if (targetTab === 'sealocal' || targetTab === 'airlocal' || targetTab === 'lcllocal') {
        populateDropdowns();
        const mode = targetTab === 'sealocal' ? 'sea' : targetTab === 'airlocal' ? 'air' : 'lcl';
        currentLocalContainer = targetTab + '-content';
        renderDefaultChargesMaster(mode);
        renderCarrierChargesMaster(mode === 'sea' ? 'sealcl' : mode);
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
            if (a && ['sea', 'air', 'lcl'].includes(a.id)) { saveRecord(a.id, 'drafts'); showShortcutHint('💾 Saved'); }
        } else if (e.key === 'p') {
            e.preventDefault();
            const a = document.querySelector('.tab-panel.active');
            if (a && ['sea', 'air', 'lcl'].includes(a.id)) { downloadPDF(a.id); showShortcutHint('📄 PDF'); }
        } else if (e.key === 'n') {
            e.preventDefault();
            const a = document.querySelector('.tab-panel.active');
            if (a && ['sea', 'air', 'lcl'].includes(a.id)) { clearFormWithConfirm(a.id); showShortcutHint('✨ New'); }
        }
    }
    if (e.key === 'Escape') { document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active')); }
});

// ==================== INPUT FOCUS HIGHLIGHT ====================
function highlightInput(el) { el.classList.add('input-focus-red'); }
function unhighlightInput(el) { el.classList.remove('input-focus-red'); }

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
    const base = `RQ-${map[mode]}-${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    const all = [...db.rates[mode], ...db.drafts[mode]];
    let seq = 1;
    let qn = base;
    while (all.some(r => r.quoteNumber === qn)) { seq++; qn = `${base}-${String(seq).padStart(2,'0')}`; }
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
    if (diffDays < 0) return { status: 'expired', text: `Expired ${Math.abs(diffDays)}d ago`, class: 'validity-expired' };
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
        if (el && !el.value) { el.value = 850; recalcCharge('air', charge); }
    });
    if (weight > 0) {
        const el = document.getElementById('air-amt-GATE_PASS');
        if (el && !el.value) { el.value = Math.max(weight * 3, 850).toFixed(2); recalcCharge('air', 'GATE PASS'); }
    }
    if (pallets > 0) {
        const el = document.getElementById('air-amt-PALLETISATION');
        if (el && !el.value) { el.value = (pallets * 1450).toFixed(2); recalcCharge('air', 'PALLETISATION'); }
    }
}

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
    Object.entries(categories).forEach(([cat, charges]) => { orderedCategories[cat] = [...charges]; });
    if (customOrder) {
        orderedCategories = {};
        Object.entries(customOrder).forEach(([cat, charges]) => { orderedCategories[cat] = charges; });
        Object.entries(categories).forEach(([cat, charges]) => {
            if (!orderedCategories[cat]) orderedCategories[cat] = [];
            charges.forEach(ch => {
                if (!Object.values(orderedCategories).flat().includes(ch)) orderedCategories[cat].push(ch);
            });
        });
    }
    Object.entries(orderedCategories).forEach(([category, charges]) => {
        if (charges.length === 0) return;
        html += `<div class="charge-category-header" data-category="${category}" ondragover="handleDragOver(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event,'${mode}','${category}')">${category}</div>`;
        charges.forEach(charge => {
            const data = savedCharges[charge] || { amount: '', currency: 'INR', buyAmount: '', buyCurrency: 'INR', basis: 'Normal' };
            const safe = charge.replace(/[^A-Z0-9]/gi, '_');
            let placeholder = "0.00";
            if (mode === 'air' && airChargePlaceholders[charge]) placeholder = airChargePlaceholders[charge];
            if (mode === 'lcl' && (charge === 'FREIGHT' || charge === 'THC')) placeholder = "Per CBM rate";
            const isFreight = charge === 'FREIGHT' || charge === 'AIR FREIGHT';
            const freightClass = isFreight ? ' freight-row' : '';
            let basisHtml = '';
            let basisVal = 'Normal';
            if (mode === 'air') {
                if (['AIR FREIGHT', 'CARTAGE', 'MCC', 'XRAY'].includes(charge)) basisVal = 'Per KGS';
                else if (charge === 'GATE PASS') basisVal = 'Per KGS × 3';
                else basisVal = data.basis || 'Normal';
            }
            if (mode === 'lcl') {
                if (charge === 'FREIGHT' || charge === 'THC') basisVal = 'Per CBM';
                else basisVal = data.basis || 'Normal';
            }
            if (mode === 'air' || mode === 'lcl') {
                const basis = basisVal;
                let opts = '';
                if (mode === 'air') {
                    if (charge === 'GATE PASS') {
                        opts = `<option value="Normal">Normal</option><option value="Per KGS">Per KGS</option><option value="Per KGS × 3" selected>Per KGS × 3</option><option value="Per CBM">Per CBM</option>`;
                    } else {
                        opts = `<option value="Normal" ${basis==='Normal'?'selected':''}>Normal</option><option value="Per KGS" ${basis==='Per KGS'?'selected':''}>Per KGS</option><option value="Per CBM" ${basis==='Per CBM'?'selected':''}>Per CBM</option>`;
                    }
                } else {
                    opts = `<option value="Normal" ${basis==='Normal'?'selected':''}>Normal</option><option value="Per KGS" ${basis==='Per KGS'?'selected':''}>Per KGS</option><option value="Per CBM" ${basis==='Per CBM'?'selected':''}>Per CBM</option>`;
                }
                basisHtml = `<select class="charge-basis" onchange="recalcCharge('${mode}','${charge}')">${opts}</select>`;
            }
            let curOpts = getCurrencyOptions(data.currency || 'INR');
            let buyCurOpts = getCurrencyOptions(data.buyCurrency || 'INR');
            if ((mode === 'sea' || mode === 'lcl') && isFreight) { curOpts = getCurrencyOptions('USD'); buyCurOpts = getCurrencyOptions('USD'); }
            html += `<div class="charge-row${freightClass}" data-charge="${charge}" data-category="${category}" draggable="true" ondragstart="handleDragStart(event,'${mode}','${charge}')" ondragover="handleDragOver(event)" ondragenter="handleDragEnterRow(event)" ondragleave="handleDragLeaveRow(event)" ondrop="handleDropRow(event,'${mode}','${charge}')">
                        <span class="charge-name"><span class="charge-name-wrap"><span>${charge}</span></span></span>
                        <input type="text" step="0.01" class="sell-amt" id="${mode}-amt-${safe}" value="${data.amount||''}" placeholder="${placeholder}" oninput="recalcCharge('${mode}','${charge}')" onblur="evaluateFormula(this,'${mode}','${charge}')" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                        <select class="sell-cur" id="${mode}-cur-${safe}" onchange="recalcCharge('${mode}','${charge}')">${curOpts}</select>
                        <input type="text" step="0.01" class="buy-input" id="${mode}-buyAmt-${safe}" value="${data.buyAmount||''}" placeholder="0.00" oninput="recalcCharge('${mode}','${charge}')" onfocus="highlightInput(this)" onblur="evaluateFormula(this,'${mode}','${charge}')">
                        <select class="buy-select" id="${mode}-buyCur-${safe}" onchange="recalcCharge('${mode}','${charge}')">${buyCurOpts}</select>
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
            if (!isNaN(result) && isFinite(result)) { input.value = result; recalcCharge(mode, charge); }
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
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function handleDragEnter(e) { e.preventDefault(); const header = e.target.closest('.charge-category-header'); if (header) header.classList.add('drag-over'); }
function handleDragLeave(e) { const header = e.target.closest('.charge-category-header'); if (header) header.classList.remove('drag-over'); }
function handleDragEnterRow(e) { e.preventDefault(); const row = e.target.closest('.charge-row'); if (row) row.classList.add('drag-over-row'); }
function handleDragLeaveRow(e) { const row = e.target.closest('.charge-row'); if (row) row.classList.remove('drag-over-row'); }
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
    if (fromCategory && currentOrder[fromCategory]) currentOrder[fromCategory] = currentOrder[fromCategory].filter(c => c !== charge);
    if (!currentOrder[toCategory]) currentOrder[toCategory] = [];
    currentOrder[toCategory].push(charge);
    chargesOrder[mode] = currentOrder;
    buildChargesGrid(mode, getCurrentChargesData(mode), chargesOrder[mode]);
}
function moveChargeBefore(mode, charge, fromCategory, targetCharge, targetCategory) {
    const currentOrder = getCurrentChargesOrder(mode);
    if (fromCategory && currentOrder[fromCategory]) currentOrder[fromCategory] = currentOrder[fromCategory].filter(c => c !== charge);
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
    if (row) { row.remove(); recalcTotal(mode); }
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
                sellAmt *= weight; buyAmt *= weight;
            } else if (basis === 'Per CBM') {
                const volume = parseFloat(document.getElementById(`${mode}-volume`)?.value) || 0;
                sellAmt *= volume; buyAmt *= volume;
            } else if (basis === 'Per KGS × 3') {
                const weight = parseFloat(document.getElementById(`${mode}-weight`)?.value) || 0;
                sellAmt *= weight * 3; buyAmt *= weight * 3;
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
    let totalSell = 0, totalBuy = 0;
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
                    sellAmt *= weight; buyAmt *= weight;
                } else if (basis === 'Per CBM') {
                    const volume = parseFloat(document.getElementById(`${mode}-volume`)?.value) || 0;
                    sellAmt *= volume; buyAmt *= volume;
                } else if (basis === 'Per KGS × 3') {
                    const weight = parseFloat(document.getElementById(`${mode}-weight`)?.value) || 0;
                    sellAmt *= weight * 3; buyAmt *= weight * 3;
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
    document.getElementById(`${mode}-totalMarginPct`).textContent = totalSell > 0 ? marginPct.toFixed(2) + '%' : 'N/A';
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
    if (!defaultCharges[currentAddChargeMode].includes(chargeName)) defaultCharges[currentAddChargeMode].push(chargeName);
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
    if (!db[target] || !db[target][mode] || idx < 0 || idx >= db[target][mode].length) {
        alert('Record not found. Please refresh and try again.');
        return;
    }
    const rec = db[target][mode][idx];
    showDeleteConfirm(`Delete quotation?<br><br><strong>${rec.client||'?'}</strong> (${rec.pol||'?'} → ${rec.pod||'?'})<br>${rec.quoteNumber||''}`, function() {
        try {
            if (idx < db[target][mode].length) {
                const recToDelete = db[target][mode][idx];
                db[target][mode].splice(idx, 1);
                saveDB();
                renderRecords(target);
                renderFollowups();
            } else {
                alert('Record no longer exists.');
            }
        } catch (e) { alert('Error: ' + e.message); }
    });
}

// ==================== AUTO-LOAD CHARGES (with "ALL" logic) ====================
function onCarrierChange(mode) { markUnsaved(mode); onCarrierPolChangeInternal(mode); }
function onPolChange(mode) { markUnsaved(mode); onCarrierPolChangeInternal(mode); }
function onContainerChange(mode) { markUnsaved(mode); onCarrierPolChangeInternal(mode); }

function onCarrierPolChangeInternal(mode) {
    const carrier = document.getElementById(`${mode}-carrier`).value;
    const pol = document.getElementById(`${mode}-pol`).value;
    const containerEl = document.getElementById(`${mode}-container`);
    const container = containerEl ? containerEl.value : '';
    const commodity = document.getElementById(`${mode}-commodity`).value;

    if (!carrier || !pol) { buildChargesGrid(mode); return; }
    let finalCharges = {};
    if (mode === 'sea') {
        let custMatch = db.carrierChargesSeaLcl.find(c => c.mode === mode && c.carrier === carrier && c.pol === pol && (c.container || '') === container);
        if (custMatch) Object.assign(finalCharges, custMatch.charges);
    } else if (mode === 'air') {
        let custMatch = db.carrierChargesAir.find(c => c.carrier === carrier && c.pol === pol);
        if (custMatch) Object.assign(finalCharges, custMatch.charges);
    } else if (mode === 'lcl') {
        let custMatch = db.carrierChargesSeaLcl.find(c => c.mode === mode && c.carrier === carrier && c.pol === pol);
        if (custMatch) Object.assign(finalCharges, custMatch.charges);
    }
    if (carrier !== 'ALL') {
        let allCharges = {};
        if (mode === 'sea') {
            let allMatch = db.defaultSeaCharges.find(d => d.carrier === 'ALL' && d.pol === pol && d.container === container && d.commodity === commodity);
            if (allMatch) Object.assign(allCharges, allMatch.charges);
        } else if (mode === 'air') {
            let allMatch = db.defaultAirCharges.find(d => d.pol === pol && d.commodity === commodity);
            if (allMatch) Object.assign(allCharges, allMatch.charges);
        } else if (mode === 'lcl') {
            let allMatch = db.defaultLclCharges.find(d => d.pol === pol && d.commodity === commodity);
            if (allMatch) Object.assign(allCharges, allMatch.charges);
        }
        Object.entries(allCharges).forEach(([key, val]) => {
            if (!finalCharges[key]) {
                finalCharges[key] = val;
            }
        });
    }
    if (mode === 'sea') {
        let defMatch = db.defaultSeaCharges.find(d => d.carrier === carrier && d.pol === pol && d.container === container && d.commodity === commodity);
        if (defMatch) {
            Object.entries(defMatch.charges).forEach(([key, val]) => {
                if (!finalCharges[key]) finalCharges[key] = val;
            });
        }
    } else if (mode === 'air') {
        let defMatch = db.defaultAirCharges.find(d => d.pol === pol && d.carrier === carrier && d.commodity === commodity);
        if (defMatch) {
            Object.entries(defMatch.charges).forEach(([key, val]) => {
                if (!finalCharges[key]) finalCharges[key] = val;
            });
        }
    } else if (mode === 'lcl') {
        let defMatch = db.defaultLclCharges.find(d => d.pol === pol && d.carrier === carrier && d.commodity === commodity);
        if (defMatch) {
            Object.entries(defMatch.charges).forEach(([key, val]) => {
                if (!finalCharges[key]) finalCharges[key] = val;
            });
        }
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
                <table class="master-table"><thead><tr><th>Carrier</th><th>Container</th><th>Amount</th><th>Currency</th><th>Commodity</th><th>Valid To</th><th>Action</th></tr></thead><tbody>`;
    matches.forEach((r, idx) => {
        const expiry = getExpiryStatus(r.validTo);
        const statusClass = expiry.status === 'expired' ? 'status-expired' : expiry.status === 'expiring' ? 'status-expiring' : 'status-active';
        html += `<tr><td><strong>${r.carrierName}</strong></td><td>${r.containerType || '-'}</td><td>${Number(r.freightAmount).toLocaleString('en-IN')}</td><td>${r.currency || 'INR'}</td><td>${r.commodity || '-'}</td><td><span class="status-badge ${statusClass}">${r.validTo || '-'}</span></td><td><button class="btn btn-sm btn-success" onclick="applyAutoRate(${idx},'${mode}')">✅ Apply</button></td></tr>`;
    });
    html += `</tbody></table><div style="margin-top:12px;text-align:right;"><button class="btn btn-clear" onclick="closeModal('autoRateModal')">Close</button></div>`;
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
    const data = { mode: mode.toUpperCase(), timestamp: new Date().toISOString(), lastModified: new Date().toISOString() };
    data.autoDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    data.sales = getLoggedInUserName() || db.defaultUser || 'N/A';
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
            data.charges[charge] = { amount: sellAmt, currency: sellCur, buyAmount: buyAmt, buyCurrency: buyCur, basis: basis };
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
    if (!data.client && Object.keys(data.charges).length === 0) return alert('Fill Client Name or at least one charge.');
    if (data.marginINR < 0 && (data.totalSellINR > 0 || data.totalBuyINR > 0)) {
        if (!confirm('⚠️ WARNING: This quote has a negative margin (loss). Do you want to proceed?')) return;
    }
    const dup = checkDuplicate(mode, data.client, data.pol, data.pod);
    if (dup && !editingRecord) {
        const alertEl = document.getElementById(`${mode}-dup-alert`);
        const msgEl = document.getElementById(`${mode}-dup-msg`);
        msgEl.innerHTML = `This client + route was quoted <strong>${dup.count} time(s)</strong> in last ${db.duplicateDetectionDays} days. Last: ${dup.lastQuote} on ${dup.lastDate} for ${dup.lastAmount}.`;
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
    autoBackup();
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
    const commodity = data.commodity || '';
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
        commodity: commodity,
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
        const entry = { carrier: data.carrier, pol: data.pol, charges: data.charges, updated: new Date().toISOString() };
        if (idx >= 0) db.carrierChargesAir[idx] = entry;
        else db.carrierChargesAir.push(entry);
    } else {
        const key = { mode, carrier: data.carrier, pol: data.pol, container: data.container || '' };
        const idx = db.carrierChargesSeaLcl.findIndex(c => c.mode === key.mode && c.carrier === key.carrier && c.pol === key.pol && (c.container || '') === key.container);
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
    const fields = ['client', 'carrier', 'pol', 'pod', 'incoterm', 'commodity', 'weight', 'transit', 'validityDate'];
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
        const seaC = db[target].sea.length, airC = db[target].air.length, lclC = db[target].lcl.length;
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
        if (records.length === 0) { list.innerHTML = '<p style="color:var(--text-light);padding:10px;">No records.</p>'; return; }
        list.innerHTML = records.map(rec => {
            const realIdx = db[target][mode].indexOf(rec);
            const status = rec.followUpStatus || 'PENDING';
            const validity = getValidityStatus(rec.validityDate);
            const lastMod = rec.lastModified ? new Date(rec.lastModified).toLocaleString('en-IN') : new Date(rec.timestamp).toLocaleString('en-IN');
            return `<div class="record-card highlight-${mode}">
                        <div class="record-info">
                            <h4>${rec.client||'?'} (${rec.pol||'?'} → ${rec.pod||'?'}) ${validity.status !== 'none' ? `<span class="validity-badge ${validity.class}">${validity.text}</span>` : ''}</h4>
                            <p>Carrier: ${rec.carrier||'?'} | Status: <strong>${rec.status}</strong> ${rec.lostReason ? `| Lost Reason: <strong style="color:#991b1b;">${rec.lostReason}</strong>` : ''}</p>
                            <p>Sell: <strong>${formatINR(rec.totalSellINR)}</strong> | Buy: <strong style="color:var(--buy-red);">${formatINR(rec.totalBuyINR)}</strong></p>
                            <p class="margin-info">Margin: ${formatINR(rec.marginINR)} (${rec.marginPct.toFixed(2)}%)</p>
                            <p class="quote-num">📋 ${rec.quoteNumber||'?'}</p>
                            <p class="last-modified">🕐 Last Modified: ${lastMod}</p>
                            <div style="margin-top:6px;display:flex;align-items:center;gap:8px;">
                                <label style="font-size:0.72rem;font-weight:700;color:var(--text-light);">ACTION:</label>
                                <select class="follow-up-select follow-up-${status.toLowerCase().replace('-','')}" onchange="setFollowUpStatus('${target}','${mode}',${realIdx},this.value)">
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
                            ${status === 'WON' ? `<button class="btn btn-sm btn-success" onclick="convertQuoteToShipmentByIndex('${target}','${mode}',${realIdx})">➕ Add Shipment</button>` : ''}
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
    let filtered = allQuotes.filter(r => { if (!filterStatus) return true; return (r.followUpStatus || 'PENDING') === filterStatus; });
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (filtered.length === 0) { list.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center;">No quotes found</p>'; return; }
    list.innerHTML = filtered.map(rec => {
        const status = rec.followUpStatus || 'PENDING';
        const updated = rec.followUpUpdated ? new Date(rec.followUpUpdated) : new Date(rec.timestamp);
        const daysSince = Math.floor((new Date() - updated) / (1000 * 60 * 60 * 24));
        const overdue = daysSince >= 3 && status !== 'WON' && status !== 'LOST';
        const validity = getValidityStatus(rec.validityDate);
        return `<div class="follow-up-card ${overdue?'overdue':''}" style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;border-left:5px solid var(--warning);">
                    <h4 style="color:var(--primary);margin-bottom:4px;font-size:0.9rem;">${rec.client||'Unknown'} (${rec.pol||'N/A'} → ${rec.pod||'N/A'}) ${validity.status !== 'none' ? `<span class="validity-badge ${validity.class}">${validity.text}</span>` : ''}</h4>
                    <p style="font-size:0.8rem;color:var(--text-light);margin-bottom:2px;">Quote: <strong>${rec.quoteNumber||'N/A'}</strong> | Carrier: ${rec.carrier||'N/A'}</p>
                    <p style="font-size:0.8rem;color:var(--text-light);margin-bottom:2px;">Status: <strong>${status}</strong> | Last Updated: ${updated.toLocaleDateString('en-IN')}</p>
                    ${rec.lostReason ? `<p style="color:#991b1b;font-weight:600;font-size:0.8rem;">Lost Reason: ${rec.lostReason}</p>` : ''}
                    ${overdue ? `<p style="color:var(--danger);font-weight:700;font-size:0.85rem;margin-top:4px;">⚠️ Overdue: ${daysSince} days since last update</p>` : ''}
                    <div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap;align-items:center;">
                        <button class="btn btn-sm btn-preview" onclick="previewSavedRecord('rates','${rec._mode}',${rec._idx})">👁 Preview</button>
                        <select class="follow-up-select follow-up-${status.toLowerCase().replace('-','')}" onchange="setFollowUpStatus('rates','${rec._mode}',${rec._idx},this.value)">
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
            const reason = prompt('Please enter reason for losing this quote:\n\nOptions:\n- High Rates\n- Slow Response\n- No Service\n- Client Not Interested\n- Competitor Won\n- Budget Constraints\n- Other');
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
        if (status === 'WON' && target === 'rates') {
            if (confirm('Quote marked as WON.\n\nDo you want to create a Shipment from this quotation?')) {
                convertQuoteToShipmentByIndex(target, mode, idx);
            }
        }
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
    let expiringCount = 0, expiredCount = 0;
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
        topClients.map(([c, v], i) => `<li style="padding:6px 8px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;"><span><strong style="color:var(--primary);">#${i+1}</strong> ${c}</span><strong>${formatINR(v)}</strong></li>`).join('') :
        '<li style="padding:10px;color:var(--text-light);">No data</li>';
    const routeMap = {};
    allRates.forEach(r => {
        const route = `${r.pol||'?'} → ${r.pod||'?'}`;
        routeMap[route] = (routeMap[route] || 0) + 1;
    });
    const topRoutes = Object.entries(routeMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('dash-top-routes').innerHTML = topRoutes.length ?
        topRoutes.map(([r, c], i) => `<li style="padding:6px 8px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;"><span><strong style="color:var(--primary);">#${i+1}</strong> ${r}</span><strong>${c} quotes</strong></li>`).join('') :
        '<li style="padding:10px;color:var(--text-light);">No data</li>';
}

// ==================== MEASUREMENT TOOLS ====================
function calculateCBM() {
    const length = parseFloat(document.getElementById('cbm-length')?.value) || 0;
    const width = parseFloat(document.getElementById('cbm-width')?.value) || 0;
    const height = parseFloat(document.getElementById('cbm-height')?.value) || 0;
    const unit = document.getElementById('cbm-unit')?.value || 'cm';
    const qty = parseFloat(document.getElementById('cbm-qty')?.value) || 1;
    let lengthM = length, widthM = width, heightM = height;
    if (unit === 'cm') { lengthM = length / 100; widthM = width / 100; heightM = height / 100; }
    else if (unit === 'inch') { lengthM = length * 0.0254; widthM = width * 0.0254; heightM = height * 0.0254; }
    else if (unit === 'mm') { lengthM = length / 1000; widthM = width / 1000; heightM = height / 1000; }
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

// ==================== CALCULATOR KEYBOARD SUPPORT ====================
document.addEventListener('DOMContentLoaded', function() {
    const calcDisplay = document.getElementById('calc-display');
    if (calcDisplay) {
        calcDisplay.addEventListener('keydown', function(e) {
            e.preventDefault();
            const key = e.key;
            if (/^[0-9]$/.test(key)) {
                calcInput(key);
            } else if (['+', '-', '*', '/'].includes(key)) {
                calcInput(key);
            } else if (key === '.') {
                calcInput('.');
            } else if (key === 'Enter') {
                calcEquals();
            } else if (key === 'Backspace') {
                const current = document.getElementById('calc-display').value;
                document.getElementById('calc-display').value = current.slice(0, -1);
                calcExpression = document.getElementById('calc-display').value;
            } else if (key === 'Delete' || key === 'Escape') {
                calcClear();
            } else if (key === 'Tab') {
                return;
            }
        });
        calcDisplay.focus();
    }
});

let calcExpression = '';
function calcInput(val) { calcExpression += val; document.getElementById('calc-display').value = calcExpression; }
function calcClear() { calcExpression = ''; document.getElementById('calc-display').value = ''; }
function calcEquals() { try { const result = eval(calcExpression); document.getElementById('calc-display').value = result; calcExpression = String(result); } catch (e) { document.getElementById('calc-display').value = 'Error'; calcExpression = ''; } }


document.querySelectorAll('#calc-stuffing input[type="number"]').forEach(input => {
    input.addEventListener('input', function() {
        document.querySelectorAll('#stuffing-table-body .stuffing-departure').forEach(depInput => {
            if (depInput.value) {
                updateStuffingDates(depInput);
            }
        });
    });
});

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
        else if (expiry.status === 'expiring') { expiring30++;
            if (expiry.days <= 7) expiring7++; } else if (expiry.status === 'expired' || expiry.status === 'critical') { expired++;
            if (expiry.days <= 7 && expiry.days >= 0) expiring7++; }
    });
    document.getElementById('expiry-active-count').textContent = active;
    document.getElementById('expiry-30-count').textContent = expiring30;
    document.getElementById('expiry-7-count').textContent = expiring7;
    document.getElementById('expiry-expired-count').textContent = expired;
}
function filterRateSheet(filter) {
    rateSheetFilter = filter;
    rateSheetPage = 1;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
    renderRateSheet();
}
function clearRateSheetFilter() { rateSheetFilter = 'all';
    rateSheetPage = 1;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === 'all'));
    renderRateSheet(); }
function getFilteredRateSheet() {
    let rates = [...(db.rateSheet || [])];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (rateSheetFilter === 'active') rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.status === 'active'; });
    else if (rateSheetFilter === 'expiring30') rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.status === 'expiring'; });
    else if (rateSheetFilter === 'expiring15') rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.days !== null && expiry.days >= 0 && expiry.days <= 15; });
    else if (rateSheetFilter === 'expiring7') rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.days !== null && expiry.days >= 0 && expiry.days <= 7; });
    else if (rateSheetFilter === 'today') rates = rates.filter(r => { const valid = new Date(r.validTo);
        valid.setHours(0, 0, 0, 0); return valid.getTime() === today.getTime(); });
    else if (rateSheetFilter === 'expired') rates = rates.filter(r => { const expiry = getExpiryStatus(r.validTo); return expiry.status === 'expired' || expiry.status === 'critical'; });
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
        const rowClass = expiry.status === 'active' ? 'row-active' : expiry.status === 'expiring' ? 'row-expiring' : 'row-expired';
        let statusClass, statusText;
        if (expiry.status === 'expired') { statusClass = 'status-expired';
            statusText = 'Expired'; } else if (expiry.status === 'expiring') { statusClass = 'status-expiring';
            statusText = `Expiring (${expiry.days}d)`; } else { statusClass = 'status-active';
            statusText = 'Active'; }
        return `<tr class="${rowClass}">
            <td>${r.carrierName || '-'}</td><td>${r.freightType || '-'}</td><td>${r.pol || '-'}</td><td>${r.pod || '-'}</td>
            <td>${r.containerType || '-'}</td><td>${Number(r.freightAmount || 0).toLocaleString('en-IN')}</td>
            <td>${r.currency || 'INR'}</td><td>${r.transitTime || '-'}</td>
            <td>${r.commodity || '-'}</td>
            <td>${r.validFrom || '-'}</td><td>${r.validTo || '-'}</td>
            <td>${expiry.days !== null ? expiry.days + ' days' : '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-preview" onclick="previewRateSheet(${realIdx})">👁</button>
                <button class="btn btn-sm btn-preview" onclick="editRateSheet(${realIdx})">✏️</button>
                <button class="btn btn-sm btn-duplicate" onclick="duplicateRateSheet(${realIdx})">📋</button>
                <button class="btn btn-sm btn-success" onclick="renewRateSheet(${realIdx})">🔄</button>
                <button class="btn btn-sm btn-clear" onclick="deleteRateSheet(${realIdx})">×</button>
            </td>
        </tr>`;
    }).join('');
    const pagination = document.getElementById('ratesheet-pagination');
    if (filtered.length === 0) { pagination.innerHTML = '<p style="color:var(--text-light);padding:10px;text-align:center;">No rates found</p>'; return; }
    let pagHtml = `<button class="page-btn" onclick="changeRateSheetPage(${rateSheetPage - 1})" ${rateSheetPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
    pagHtml += `<span class="page-info">Page ${rateSheetPage} of ${totalPages} (${filtered.length} records)</span>`;
    pagHtml += `<button class="page-btn" onclick="changeRateSheetPage(${rateSheetPage + 1})" ${rateSheetPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
    pagination.innerHTML = pagHtml;
}
function changeRateSheetPage(page) { const filtered = getFilteredRateSheet();
    const totalPages = Math.ceil(filtered.length / rateSheetPerPage) || 1; if (page < 1 || page > totalPages) return;
    rateSheetPage = page;
    renderRateSheet(); }
function openRateSheetModal(editIdx = null) {
    const modal = document.getElementById('rateSheetModal');
    const title = document.getElementById('rateSheetModalTitle');
    const visibleCarriers = ['ALL', ...db.carriers.filter(c => !(db.hiddenItems.carriers || []).includes(c))];
    const carrierSelect = document.getElementById('rs-carrier');
    carrierSelect.innerHTML = '<option value="">Select Carrier</option>' + visibleCarriers.map(c => `<option value="${c}">${c}</option>`).join('');

    document.getElementById('rs-pol').innerHTML = '<option value="">Select POL</option>' + db.pol.map(p => `<option value="${p}">${p}</option>`).join('');
    document.getElementById('rs-pod').innerHTML = '<option value="">Select POD</option>' + db.pod.map(p => `<option value="${p}">${p}</option>`).join('');
    document.getElementById('rs-container').innerHTML = '<option value="">Select Container</option>' + db.containers.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('rs-currency').innerHTML = getCurrencyOptions('USD');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rs-validFrom').value = today;

    if (editIdx !== null) {
        const r = db.rateSheet[editIdx];
        title.textContent = 'Edit Rate';
        document.getElementById('rs-carrier').value = r.carrierName || '';
        document.getElementById('rs-freightType').value = r.freightType || 'SEA';
        document.getElementById('rs-pol').value = r.pol || '';
        document.getElementById('rs-pod').value = r.pod || '';
        document.getElementById('rs-container').value = r.containerType || '';
        document.getElementById('rs-currency').value = r.currency || 'USD';
        document.getElementById('rs-amount').value = r.freightAmount || '';
        document.getElementById('rs-transit').value = r.transitTime || '';
        document.getElementById('rs-commodity').value = r.commodity || '';
        document.getElementById('rs-validFrom').value = r.validFrom || today;
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
        document.getElementById('rs-currency').value = 'USD';
        document.getElementById('rs-amount').value = '';
        document.getElementById('rs-transit').value = '';
        document.getElementById('rs-commodity').value = '';
        document.getElementById('rs-validFrom').value = today;
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
        commodity: document.getElementById('rs-commodity').value,
        validFrom: document.getElementById('rs-validFrom').value,
        validTo: document.getElementById('rs-validTo').value,
        remarks: document.getElementById('rs-remarks').value.trim(),
        updatedAt: new Date().toISOString()
    };
    if (!rateData.carrierName || !rateData.pol || !rateData.pod || !rateData.validTo) return alert('Please fill Carrier, POL, POD, and Valid To fields.');
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
    autoBackup();
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
function previewRateSheet(idx) {
    const r = db.rateSheet[idx];
    if (!r) return alert('Rate not found');
    const expiry = getExpiryStatus(r.validTo);
    const html = `
        <h3 style="color:var(--primary);margin-bottom:12px;">Rate Details</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div><strong>Carrier:</strong> ${r.carrierName}</div>
            <div><strong>Freight Type:</strong> ${r.freightType}</div>
            <div><strong>POL:</strong> ${r.pol}</div>
            <div><strong>POD:</strong> ${r.pod}</div>
            <div><strong>Container:</strong> ${r.containerType || '-'}</div>
            <div><strong>Amount:</strong> ${r.currency} ${Number(r.freightAmount).toLocaleString('en-IN')}</div>
            <div><strong>Transit Time:</strong> ${r.transitTime || '-'}</div>
            <div><strong>Commodity:</strong> ${r.commodity || '-'}</div>
            <div><strong>Valid From:</strong> ${r.validFrom}</div>
            <div><strong>Valid To:</strong> ${r.validTo}</div>
            <div><strong>Days Left:</strong> ${expiry.days !== null ? expiry.days + ' days' : '-'}</div>
            <div><strong>Status:</strong> <span class="status-badge ${expiry.status === 'active' ? 'status-active' : expiry.status === 'expiring' ? 'status-expiring' : 'status-expired'}">${expiry.status.toUpperCase()}</span></div>
            <div style="grid-column:1/-1;"><strong>Remarks:</strong> ${r.remarks || '-'}</div>
        </div>
    `;
    document.getElementById('modal-title').textContent = 'Rate Preview';
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
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
            <div class="form-group"><label>Currency</label><select id="renew-currency">${getCurrencyOptions(original.currency || 'USD')}</select></div>
            <div class="form-group"><label>Transit Time</label><input type="text" id="renew-transit" value="${original.transitTime || ''}" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></div>
            <div class="form-group"><label>Commodity</label><select id="renew-commodity"><option value="">Select</option><option value="NON HAZ" ${original.commodity==='NON HAZ'?'selected':''}>Non Hazardous</option><option value="HAZ" ${original.commodity==='HAZ'?'selected':''}>Hazardous</option></select></div>
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
        commodity: document.getElementById('renew-commodity').value,
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
    if (!db.rateSheet || idx < 0 || idx >= db.rateSheet.length) {
        alert('Rate not found.');
        return;
    }
    const rec = db.rateSheet[idx];
    showDeleteConfirm(`Delete rate?<br><br><strong>${rec.carrierName}</strong> (${rec.pol} → ${rec.pod})<br>Amount: ${rec.currency} ${rec.freightAmount}`, function() {
        if (idx < db.rateSheet.length) {
            db.rateSheet.splice(idx, 1);
            saveDB();
            renderRateSheet();
            updateExpiryDashboard();
            autoBackup();
        } else {
            alert('Rate no longer exists.');
        }
    });
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
                currency: parts[5].trim().toUpperCase() || 'USD',
                freightAmount: parseFloat(parts[6]) || 0,
                transitTime: parts[7].trim(),
                commodity: parts[8] ? parts[8].trim() : '',
                validFrom: parts[9] ? parts[9].trim() : new Date().toISOString().split('T')[0],
                validTo: parts[10] ? parts[10].trim() : '',
                remarks: parts[11] ? parts[11].trim() : '',
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
    autoBackup();
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
            'Commodity': r.commodity,
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
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFontSize(16);
        doc.text('Rate Sheet Expiry Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 22);
        doc.text(`Filter: ${rateSheetFilter} | Total Records: ${filtered.length}`, 14, 28);
        const tableData = filtered.map(r => [
            r.carrierName || '-', r.freightType || '-', r.pol || '-', r.pod || '-',
            r.containerType || '-', `${r.currency || 'USD'} ${Number(r.freightAmount || 0).toLocaleString('en-IN')}`,
            r.transitTime || '-', r.commodity || '-',
            r.validFrom || '-', r.validTo || '-',
            getExpiryStatus(r.validTo).days !== null ? `${getExpiryStatus(r.validTo).days} days` : '-',
            getExpiryStatus(r.validTo).status.toUpperCase()
        ]);
        doc.autoTable({
            startY: 32,
            head: [
                ['Carrier', 'Type', 'POL', 'POD', 'Container', 'Amount', 'Transit', 'Commodity', 'Valid From', 'Valid To', 'Days Left', 'Status']
            ],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [30, 58, 138], textColor: 255 },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 11) {
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

// ==================== LOCAL CHARGES SAVE ====================
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
        if (idx >= 0) { if (confirm('Update existing charges for this carrier?')) { db.carrierChargesAir[idx] = entry; } else return; } else { db.carrierChargesAir.push(entry); }
    } else {
        const key = { mode, carrier, pol, container };
        const idx = db.carrierChargesSeaLcl.findIndex(c => c.mode === mode && c.carrier === carrier && c.pol === pol && (c.container || '') === container);
        const entry = { ...key, charges, updated: new Date().toISOString() };
        if (idx >= 0) { if (confirm('Update existing charges for this carrier?')) { db.carrierChargesSeaLcl[idx] = entry; } else return; } else { db.carrierChargesSeaLcl.push(entry); }
    }
    saveDB();
    alert(`Local charges saved for ${carrier} - ${pol}!`);
    if (document.getElementById('sealocal').classList.contains('active') && mode === 'sea') {
        renderCarrierChargesMaster('sealcl');
    } else if (document.getElementById('airlocal').classList.contains('active') && mode === 'air') {
        renderCarrierChargesMaster('air');
    } else if (document.getElementById('lcllocal').classList.contains('active') && mode === 'lcl') {
        renderCarrierChargesMaster('lcl');
    }
    autoBackup();
}

function saveFreightRate(mode) {
    const carrier = document.getElementById(`${mode}-carrier`).value;
    const pol = document.getElementById(`${mode}-pol`).value;
    const pod = document.getElementById(`${mode}-pod`).value;
    const container = document.getElementById(`${mode}-container`)?.value || '';
    const transit = document.getElementById(`${mode}-transit`).value;
    const validityDate = document.getElementById(`${mode}-validityDate`).value;
    const commodity = document.getElementById(`${mode}-commodity`).value;
    if (!carrier || !pol || !pod) return alert('Please select Carrier, POL, and POD first.');
    const charges = getCurrentChargesData(mode);
    const freightCharge = charges['FREIGHT'] || charges['AIR FREIGHT'] || {};
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
        commodity: commodity,
        remarks: `Saved from ${mode.toUpperCase()} quotation`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.rateSheet.push(rateData);
    saveDB();
    alert(`Freight rate saved to Rate Sheet!\n\nCarrier: ${carrier}\nRoute: ${pol} → ${pod}\nAmount: ${formatINR(freightAmount)}`);
    autoBackup();
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
                        if (!entry) { entry = { carrier, pol, charges: {}, updated: new Date().toISOString() };
                            db[listKey].push(entry); }
                    } else {
                        entry = db[listKey].find(c => c.mode === mode && c.carrier === carrier && c.pol === pol);
                        if (!entry) { entry = { mode, carrier, pol, container: '', charges: {}, updated: new Date().toISOString() };
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
    autoBackup();
}

// ==================== BACKUP FUNCTIONS ====================
async function selectBackupFolder() {
    try {
        if (typeof window.showDirectoryPicker === 'function') {
            const folder = await window.showDirectoryPicker();
            backupFolderHandle = folder;
            document.getElementById('backup-folder-path').textContent = `📁 ${folder.name}`;
            alert('Backup folder selected successfully! Auto backup will run every 1 minute.');
            startAutoBackup();
        } else {
            alert('Your browser does not support folder selection. Please use the Export buttons to save manually.');
        }
    } catch (e) {
        if (e.name !== 'AbortError') { console.error(e);
            alert('Folder selection failed: ' + e.message); }
    }
}
function startAutoBackup() {
    if (autoBackupInterval) { clearInterval(autoBackupInterval); }
    autoBackupInterval = setInterval(() => {
        if (backupFolderHandle) { autoBackupToFolder(); } else {
            document.getElementById('auto-backup-status').textContent = '⚠️ No folder selected';
        }
    }, 60000);
    document.getElementById('auto-backup-status').textContent = '✅ Running (every 1 min)';
}
async function autoBackupToFolder() {
    try {
        if (!backupFolderHandle) {
            throw new Error('No folder selected');
        }
        const permission = await backupFolderHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            throw new Error('Permission denied to write to folder');
        }
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
        statusEl.textContent = `✅ Last backup: ${new Date().toLocaleString('en-IN')} (in ${backupFolderHandle.name})`;
        statusEl.className = 'backup-status success';
        console.log('Auto backup saved to folder:', fileName);
    } catch (e) {
        console.error('Folder backup failed, falling back to download:', e);
        await fallbackBackupDownload();
    }
}
async function fallbackBackupDownload() {
    try {
        const backupData = { timestamp: new Date().toISOString(), data: db };
        const json = JSON.stringify(backupData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Gateway_EXIM_AutoBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        db.lastBackup = new Date().toISOString();
        saveDB();
        const statusEl = document.getElementById('backup-status');
        statusEl.textContent = `✅ Last backup: ${new Date().toLocaleString('en-IN')} (download fallback)`;
        statusEl.className = 'backup-status success';
    } catch (e) {
        console.error('Fallback download also failed:', e);
        const statusEl = document.getElementById('backup-status');
        statusEl.textContent = `❌ Backup failed: ${e.message}`;
        statusEl.className = 'backup-status error';
    }
}
async function autoBackup() {
    try {
        if (backupFolderHandle) {
            await autoBackupToFolder();
        } else {
            await fallbackBackupDownload();
        }
    } catch (e) {
        console.error('Auto backup failed:', e);
        const statusEl = document.getElementById('backup-status');
        statusEl.textContent = `❌ Backup failed: ${e.message}`;
        statusEl.className = 'backup-status error';
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
        'Shipments': db.shipments,
        'BL Drafts': db.bldrafts,
        'POL': db.pol.map(p => ({ POL: p })),
        'POD': db.pod.map(p => ({ POD: p })),
        'Incoterms': db.incoterms.map(i => ({ Incoterm: i })),
        'Containers': db.containers.map(c => ({ Container: c })),
        'Carriers': db.carriers.map(c => ({ Carrier: c })),
        'Exchange Rates': Object.entries(db.exchangeRates).map(([k, v]) => ({ Currency: k, Rate: v }))
    };
    Object.entries(sheets).forEach(([name, data]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
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
                    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    newRow[normalizedKey] = row[key];
                });
                return newRow;
            });
            const preview = document.getElementById('rate-import-preview');
            let html = `<h4 style="color:var(--primary);margin-bottom:8px;">Preview: ${normalized.length} rows found</h4>`;
            html += `<table class="master-table" style="font-size:0.72rem;"><thead><tr>`;
            const cols = Object.keys(normalized[0]);
            cols.forEach(k => html += `<th>${k}</th>`);
            html += `</tr></thead><tbody>`;
            normalized.slice(0, 10).forEach(row => {
                html += '<tr>';
                cols.forEach(c => html += `<td>${row[c] || ''}</td>`);
                html += '</tr>';
            });
            if (normalized.length > 10) html += `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--text-light);">... and ${normalized.length - 10} more rows</td></tr>`;
            html += `</tbody></table>`;
            html += `<div style="margin-top:10px;text-align:right;"><button class="btn btn-success" onclick="confirmRateImport()">✅ Import All ${normalized.length} Rows</button> <button class="btn btn-clear" onclick="document.getElementById('rate-import-preview').style.display='none'">Cancel</button></div>`;
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
            let carrier = row.carrier || row.liner || row.shipping_line || row.name || row.shippingline || '';
            let pol = row.pol || row.port_of_loading || row.loading_port || row.origin || row.portofloading || '';
            let chargeType = row.charge_type || row.charge || row.charge_name || row.description || row.type || row.chargetype || '';
            let amount = row.amount || row.rate || row.price || row.value || row.charge_amount || 0;
            let currency = row.currency || row.cur || row.ccy || row.currency_code || 'INR';
            let container = row.container || row.container_type || row.size || row.containertype || '';
            let commodity = row.commodity || row.commodity_type || '';
            carrier = String(carrier).trim();
            pol = String(pol).trim();
            chargeType = String(chargeType).trim().toUpperCase();
            amount = parseFloat(String(amount).replace(/[^\d.-]/g, '')) || 0;
            currency = String(currency).trim().toUpperCase() || 'INR';
            container = String(container).trim();
            commodity = String(commodity).trim().toUpperCase();
            if (commodity && !['NON HAZ', 'HAZ'].includes(commodity)) commodity = 'NON HAZ';
            if (!carrier || !pol || !chargeType || !amount) { skipped++; return; }
            const isAir = defaultCharges.air.includes(chargeType);
            const isLcl = defaultCharges.lcl.includes(chargeType) && !defaultCharges.sea.includes(chargeType);
            let listKey;
            if (isAir) listKey = 'carrierChargesAir';
            else if (isLcl) listKey = 'carrierChargesSeaLcl';
            else listKey = 'carrierChargesSeaLcl';
            const mode = isAir ? 'air' : (isLcl ? 'lcl' : 'sea');
            let entry;
            if (mode === 'air') {
                entry = db[listKey].find(c => c.carrier === carrier && c.pol === pol);
                if (!entry) { entry = { carrier, pol, charges: {}, updated: new Date().toISOString() };
                    db[listKey].push(entry); }
            } else {
                entry = db[listKey].find(c => c.mode === mode && c.carrier === carrier && c.pol === pol && (c.container || '') === container);
                if (!entry) { entry = { mode, carrier, pol, container, charges: {}, updated: new Date().toISOString() };
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
    autoBackup();
}

// ==================== COPY QUOTE DATA ====================
function copyQuoteData(mode) {
    const data = getFormData(mode);
    if (!data.client && Object.keys(data.charges).length === 0) { alert('No data to copy. Please fill the form first.'); return; }
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
    if (mode === 'air') { text += `Volume (CBM): ${data.volume || '-'}\n`;
        text += `Pallets: ${data.pallets || '-'}\n`; }
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
        text += '  #  Charge Type              Amount   Currency   INR Equivalent   Basis\n';
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
    const order = data.chargesOrder || getCurrentChargesOrder(mode);
    const toUpper = (val) => val ? String(val).toUpperCase() : '-';
    const { chargesWithINR, grandTotal } = calculateChargesWithINR(data, mode);
    let chargeRowsHtml = '';
    if (Object.keys(chargesWithINR).length > 0) {
        Object.entries(order).forEach(([category, charges]) => {
            if (charges.length === 0) return;
            const catEntries = charges.filter(ch => chargesWithINR[ch]);
            if (catEntries.length === 0) return;
            chargeRowsHtml += `
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
                <tr><td style="background:#1e3a8a;color:white;padding:6px 10px;font-weight:bold;font-family:Arial;font-size:11px;">${category.toUpperCase()}</td></tr>
            </table>
            `;
            chargeRowsHtml += `
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #d1d5db;font-family:Arial;font-size:11px;">
                <thead>
                    <tr style="background:#1e3a8a;color:white;">
                        <th style="padding:5px;text-align:left;border-right:1px solid #d1d5db;">#</th>
                        <th style="padding:5px;text-align:left;border-right:1px solid #d1d5db;">Charge Type</th>
                        <th style="padding:5px;text-align:right;border-right:1px solid #d1d5db;">Sell Amt</th>
                        <th style="padding:5px;text-align:left;border-right:1px solid #d1d5db;">Currency</th>
                        <th style="padding:5px;text-align:right;border-right:1px solid #d1d5db;">INR Equivalent</th>
                        <th style="padding:5px;text-align:left;">Basis</th>
                    </tr>
                </thead>
                <tbody>`;
            let catTotal = 0;
            catEntries.forEach((ch, i) => {
                const c = chargesWithINR[ch];
                catTotal += c.sellINR;
                const isFreight = ch.toUpperCase() === 'FREIGHT' || ch.toUpperCase() === 'AIR FREIGHT';
                const rowStyle = isFreight ? 'background:#fee2e2;font-weight:bold;' : '';
                chargeRowsHtml += `
                <tr style="${rowStyle}">
                    <td style="padding:5px;border-bottom:1px solid #d1d5db;border-right:1px solid #d1d5db;">${i+1}</td>
                    <td style="padding:5px;border-bottom:1px solid #d1d5db;border-right:1px solid #d1d5db;">${ch.toUpperCase()}</td>
                    <td style="padding:5px;border-bottom:1px solid #d1d5db;border-right:1px solid #d1d5db;text-align:right;">${Number(c.unitSellAmt).toLocaleString('en-IN')}</td>
                    <td style="padding:5px;border-bottom:1px solid #d1d5db;border-right:1px solid #d1d5db;">${c.currency}</td>
                    <td style="padding:5px;border-bottom:1px solid #d1d5db;border-right:1px solid #d1d5db;text-align:right;">${formatINR(c.sellINR)}</td>
                    <td style="padding:5px;border-bottom:1px solid #d1d5db;">${c.basis}</td>
                </tr>`;
            });
            chargeRowsHtml += `
                <tr style="background:#f1f5f9;">
                    <td colspan="5" style="padding:5px;text-align:right;border-bottom:1px solid #d1d5db;font-weight:bold;">Subtotal:</td>
                    <td style="padding:5px;border-bottom:1px solid #d1d5db;font-weight:bold;">${formatINR(catTotal)}</td>
                </tr>
            </tbody></table>`;
        });
        chargeRowsHtml += `
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:6px;">
            <tr style="background:#10b981;color:white;font-weight:bold;">
                <td style="padding:6px 10px;text-align:right;font-family:Arial;font-size:11px;">GRAND TOTAL (INR)</td>
                <td style="padding:6px 10px;text-align:right;font-family:Arial;font-size:11px;">${formatINR(grandTotal)}</td>
            </tr>
        </table>`;
    }
    const detailRows = [
        ['Client', toUpper(data.client), 'Quote Date', data.autoDate || '-'],
        ['Carrier', toUpper(data.carrier), 'Incoterm', toUpper(data.incoterm)],
        ['POL', toUpper(data.pol), 'POD', toUpper(data.pod)],
        ['Commodity', toUpper(data.commodity), 'Weight (KGS)', data.weight || '-'],
        [mode === 'sea' ? 'Container' : 'Volume (CBM)', mode === 'sea' ? toUpper(data.container) : (data.volume || '-'), 'Transit Time', data.transit ? data.transit + ' Days' : '-'],
        ['Validity Date', data.validityDate ? new Date(data.validityDate).toLocaleDateString('en-IN') : '-', 'Status', toUpper(data.status)]
    ];
    let detailHtml = `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-family:Arial;font-size:11px;">
        <tbody>`;
    detailRows.forEach((row, idx) => {
        const bgColor = idx % 2 === 0 ? '#f1f5f9' : 'white';
        detailHtml += `
        <tr style="background:${bgColor};">
            <td style="padding:5px;border:1px solid #d1d5db;font-weight:bold;width:20%;">${row[0]}</td>
            <td style="padding:5px;border:1px solid #d1d5db;width:30%;">${row[1]}</td>
            <td style="padding:5px;border:1px solid #d1d5db;font-weight:bold;width:20%;">${row[2]}</td>
            <td style="padding:5px;border:1px solid #d1d5db;width:30%;">${row[3]}</td>
        </tr>`;
    });
    detailHtml += `</tbody></table>`;
    const titleHtml = `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:12px;">
        <tr>
            <td style="font-size:18px;font-weight:bold;color:#1e3a8a;font-family:Arial;text-align:left;">${modeLabel} QUOTATION</td>
            <td style="font-family:monospace;color:#d97706;font-weight:bold;font-size:12px;background:#fffbeb;padding:4px 10px;text-align:right;">Quote No: ${data.quoteNumber||'DRAFT'}</td>
        </tr>
    </table>`;
    let remarksHtml = '';
    if (data.remarks) {
        remarksHtml = `
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:12px;">
            <tr><td style="background:#1e3a8a;color:white;padding:4px 8px;font-weight:bold;font-family:Arial;font-size:11px;">Remarks</td></tr>
            <tr><td style="border:1px solid #d1d5db;padding:8px;font-family:Arial;font-size:11px;">${data.remarks.toUpperCase()}</td></tr>
        </table>`;
    }
    return `<!DOCTYPE html>
    <html><head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#ffffff;">
        <div style="background:white;">
            ${titleHtml}
            ${detailHtml}
            ${chargeRowsHtml}
            ${remarksHtml}
        </div>
    </body></html>`;
}
function emailQuote(mode) {
    const data = getFormData(mode);
    if (!data.client && Object.keys(data.charges).length === 0) return alert('Fill data first');
    if (!data.quoteNumber) data.quoteNumber = document.getElementById(`${mode}-qn-value`).textContent || 'DRAFT';
    currentEmailData = { data, mode };
    const modeLabel = mode.toUpperCase();
    const containerInfo = mode === 'sea' ? (data.container || 'N/A') : (data.volume ? `${data.volume} CBM` : 'N/A');
    document.getElementById('email-subject').value = `${modeLabel} FREIGHT QUOTE // ${data.quoteNumber} // ${data.pol||'N/A'} TO ${data.pod||'N/A'} // ${containerInfo} // ${data.commodity||'N/A'}`;
    const htmlContent = buildEmailHTML(data, mode);
    document.getElementById('email-html-preview').innerHTML = htmlContent;
    openModal('emailModal');
}
function emailSavedQuote(target, mode, idx) {
    const rec = db[target][mode][idx];
    currentEmailData = { data: rec, mode };
    const modeLabel = mode.toUpperCase();
    const containerInfo = mode === 'sea' ? (rec.container || 'N/A') : (rec.volume ? `${rec.volume} CBM` : 'N/A');
    document.getElementById('email-subject').value = `${modeLabel} FREIGHT QUOTE // ${rec.quoteNumber} // ${rec.pol||'N/A'} TO ${rec.pod||'N/A'} // ${containerInfo} // ${rec.commodity||'N/A'}`;
    const htmlContent = buildEmailHTML(rec, mode);
    document.getElementById('email-html-preview').innerHTML = htmlContent;
    openModal('emailModal');
}
function copyEmailHTML() {
    const previewDiv = document.getElementById('email-html-preview');
    const html = previewDiv.innerHTML;
    navigator.clipboard.writeText(html).then(() => alert("HTML copied to clipboard! Paste it into your email client's HTML editor."))
        .catch(() => {
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
    const cc = document.getElementById('email-cc').value.trim();
    const subject = document.getElementById('email-subject').value.trim();
    const { data, mode } = currentEmailData;
    const htmlContent = buildEmailHTML(data, mode);
    const boundary = 'boundary-' + Date.now();
    let emlContent = `MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="${boundary}"
Subject: ${subject}
To: ${to}
${cc ? 'CC: ' + cc + '\n' : ''}

--${boundary}
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: 7bit

${htmlContent}

--${boundary}--`;

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quotation_${data.quoteNumber || 'DRAFT'}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    closeModal('emailModal');
    setTimeout(() => {
        alert('✅ Email file (.eml) downloaded.\n\nDouble‑click it to open Outlook. All tables and colors will appear exactly as in the PDF preview.');
    }, 500);
}

// ==================== PDF GENERATION ====================
function calculateChargesWithINR(data, mode) {
    let grandTotal = 0;
    const chargesWithINR = {};
    Object.entries(data.charges || {}).forEach(([charge, c]) => {
        let unitSellAmt = c.amount;
        let unitBuyAmt = c.buyAmount || 0;
        let totalSellAmt = unitSellAmt;
        let totalBuyAmt = unitBuyAmt;
        if (mode === 'air' || mode === 'lcl') {
            const basis = c.basis || 'Normal';
            if (basis === 'Per KGS') {
                totalSellAmt *= (data.weight || 0);
                totalBuyAmt *= (data.weight || 0);
            } else if (basis === 'Per CBM') {
                totalSellAmt *= (data.volume || 0);
                totalBuyAmt *= (data.volume || 0);
            } else if (basis === 'Per KGS × 3') {
                totalSellAmt *= (data.weight || 0) * 3;
                totalBuyAmt *= (data.weight || 0) * 3;
            }
        }
        if (mode === 'lcl' && (charge === 'FREIGHT' || charge === 'THC')) {
            const volume = data.volume || 0;
            if (volume > 0) {
                const basis = c.basis || 'Normal';
                if (basis === 'Normal') {
                    totalSellAmt *= volume;
                    totalBuyAmt *= volume;
                }
            }
        }
        const sellINR = toINR(totalSellAmt, c.currency);
        const buyINR = toINR(totalBuyAmt, c.buyCurrency || c.currency);
        chargesWithINR[charge] = {
            unitSellAmt,
            totalSellAmt,
            currency: c.currency,
            sellINR,
            buyINR,
            basis: c.basis || 'Normal'
        };
        grandTotal += sellINR;
    });
    return { chargesWithINR, grandTotal };
}

function buildPDFDefinition(data, mode) {
    const modeLabel = { sea: 'SEA FREIGHT', air: 'AIR FREIGHT', lcl: 'LCL FREIGHT' }[mode];
    const userName = getLoggedInUserName() || db.defaultUser || 'N/A';
    const order = data.chargesOrder || getCurrentChargesOrder(mode);
    const toUpper = (val) => val ? String(val).toUpperCase() : '-';
    const { chargesWithINR, grandTotal } = calculateChargesWithINR(data, mode);
    function buildChargeTableRows(category, charges) {
        const catEntries = charges.filter(ch => chargesWithINR[ch]);
        if (catEntries.length === 0) return null;
        let rows = [
            [{ text: '#', style: 'Aptos', alignment: 'center' },
                { text: 'Charge Type', style: 'Aptos' },
                { text: 'Sell Amt', style: 'Aptos', alignment: 'center' },
                { text: 'Currency', style: 'Aptos', alignment: 'center' },
                { text: 'INR Equivalent', style: 'Aptos', alignment: 'center' },
                { text: 'Basis', style: 'Aptos', alignment: 'center' }]
        ];
        let catTotal = 0;
        catEntries.forEach((ch, i) => {
            const c = chargesWithINR[ch];
            catTotal += c.sellINR;
            const isFreight = ch.toUpperCase() === 'FREIGHT' || ch.toUpperCase() === 'AIR FREIGHT';
            rows.push([
                { text: String(i + 1), alignment: 'center' },
                { text: ch.toUpperCase(), bold: isFreight, color: isFreight ? '#dc2626' : '#000' },
                { text: Number(c.unitSellAmt).toLocaleString('en-IN'), alignment: 'center' },
                { text: c.currency, alignment: 'center' },
                { text: formatINR(c.sellINR), alignment: 'center' },
                { text: c.basis, alignment: 'center' }
            ]);
        });
        rows.push([
            { text: 'Subtotal:', colSpan: 4, alignment: 'center', bold: true },
            {}, {}, {},
            { text: formatINR(catTotal), alignment: 'center', bold: true },
            {}
        ]);
        return rows;
    }
    const content = [];
    content.push(
        { text: db.companyName || 'GATEWAY EXIM', style: 'companyName' },
        { text: db.companyAddress || '', style: 'companyAddress' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#1e3a8a' }] },
        { text: ' ' }
    );
    content.push({
        columns: [
            { text: modeLabel + ' QUOTATION', style: 'title' },
            { text: 'Quote No: ' + (data.quoteNumber || 'DRAFT'), style: 'quoteNum', alignment: 'right' }
        ]
    });
    const detailRows = [
        [{ text: 'Client', style: 'detailLabel' }, { text: toUpper(data.client) },
        { text: 'Quote Date', style: 'detailLabel' }, { text: data.autoDate || '-' }],
        [{ text: 'Carrier', style: 'detailLabel' }, { text: toUpper(data.carrier) },
        { text: 'Incoterm', style: 'detailLabel' }, { text: toUpper(data.incoterm) }],
        [{ text: 'POL', style: 'detailLabel' }, { text: toUpper(data.pol) },
        { text: 'POD', style: 'detailLabel' }, { text: toUpper(data.pod) }],
        [{ text: 'Commodity', style: 'detailLabel' }, { text: toUpper(data.commodity) },
        { text: 'Weight (KGS)', style: 'detailLabel' }, { text: data.weight || '-' }],
        [{ text: mode === 'sea' ? 'Container' : 'Volume (CBM)', style: 'detailLabel' },
        { text: mode === 'sea' ? toUpper(data.container) : (data.volume || '-') },
        { text: 'Transit Time', style: 'detailLabel' }, { text: data.transit ? data.transit + ' Days' : '-' }],
        [{ text: 'Validity Date', style: 'detailLabel' }, { text: data.validityDate ? new Date(data.validityDate).toLocaleDateString('en-IN') : '-' },
        { text: 'Status', style: 'detailLabel' }, { text: toUpper(data.status) }]
    ];
    content.push({
        table: {
            widths: ['*', '*', '*', '*'],
            body: detailRows
        },
        layout: {
            hLineWidth: function() { return 1; },
            vLineWidth: function() { return 1; },
            hLineColor: '#d1d5db',
            vLineColor: '#d1d5db',
            fillColor: function(rowIndex) {
                return (rowIndex % 2 === 0) ? '#f1f5f9' : null;
            }
        },
        margin: [0, 10, 0, 10]
    });
    if (Object.keys(chargesWithINR).length > 0) {
        Object.entries(order).forEach(([category, charges]) => {
            if (charges.length === 0) return;
            const rows = buildChargeTableRows(category, charges);
            if (!rows) return;
            content.push({ text: category.toUpperCase(), style: 'categoryHeader' });
            content.push({
                table: {
                    widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
                    body: rows
                },
                layout: {
                    hLineWidth: function() { return 1; },
                    vLineWidth: function() { return 1; },
                    hLineColor: '#d1d5db',
                    vLineColor: '#d1d5db',
                    fillColor: function(rowIndex) {
                        if (rowIndex === 0) return '#1e3a8a';
                        if (rowIndex === rows.length - 1) return '#f1f5f9';
                        return null;
                    }
                },
                margin: [0, 5, 0, 10]
            });
        });
        content.push({
            table: {
                widths: ['*', 'auto'],
                body: [
                    [{ text: 'GRAND TOTAL (INR)', alignment: 'right', bold: true, fontSize: 11, color: 'white' },
                    { text: formatINR(grandTotal), alignment: 'right', bold: true, fontSize: 11, color: 'white' }]
                ]
            },
            layout: {
                fillColor: '#10b981'
            },
            margin: [0, 0, 0, 10]
        });
    }
    if (data.remarks) {
        content.push({
            table: {
                widths: ['*'],
                body: [
                    [{ text: 'Remarks', style: 'categoryHeader' }],
                    [{ text: data.remarks.toUpperCase(), margin: [5, 5] }]
                ]
            },
            layout: 'noBorders',
            margin: [0, 5, 0, 10]
        });
    }
    content.push(
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }] },
        { text: 'This quotation is system-generated. Rates are subject to change based on validity date.', alignment: 'center', fontSize: 8, color: '#64748b', margin: [0, 8, 0, 2] },
        { text: 'Generated on ' + new Date().toLocaleString('en-IN'), alignment: 'center', fontSize: 8, color: '#64748b' },
        { text: 'Prepared By: ' + userName, alignment: 'center', fontSize: 8, color: '#64748b', margin: [0, 2, 0, 0] }
    );
    return {
        content: content,
        styles: {
            companyName: { fontSize: 14, bold: true, color: '#1e3a8a' },
            companyAddress: { fontSize: 9, color: '#64748b', margin: [0, 2, 0, 4] },
            title: { fontSize: 18, bold: true, color: '#ed0909' },
            quoteNum: { fontSize: 12, bold: true, color: '#d97706' },
            detailLabel: { fontSize: 11, bold: true, color: '#334155' },
            categoryHeader: { fontSize: 11, bold: true, color: '#2a0996', margin: [0, 8, 0, 4] },
            Aptos: { fontSize: 11, bold: true, color: 'white' }
        },
        defaultStyle: {
            fontSize: 10,
            font: 'Roboto'
        }
    };
}
function generatePDF(data, mode) {
    if (typeof pdfMake === 'undefined') {
        alert('pdfmake library is not loaded. Please add the scripts to your HTML and refresh.');
        return;
    }
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
    const docDefinition = buildPDFDefinition(data, mode);
    pdfMake.createPdf(docDefinition).download(`${data.quoteNumber || 'Quote'}.pdf`);
}
function downloadPDF(mode) {
    const data = getFormData(mode);
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
    const validityDisplay = data.validityDate ? new Date(data.validityDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const transitDisplay = data.transit ? `${data.transit} Days` : '—';
    const userName = getLoggedInUserName() || db.defaultUser || 'N/A';
    const order = data.chargesOrder || getCurrentChargesOrder(mode);
    const toUpper = (val) => val ? String(val).toUpperCase() : '-';
    let grandTotal = 0;
    const chargesWithINR = {};
    Object.entries(data.charges || {}).forEach(([charge, c]) => {
        let unitSellAmt = c.amount;
        let unitBuyAmt = c.buyAmount || 0;
        let totalSellAmt = unitSellAmt;
        let totalBuyAmt = unitBuyAmt;
        if (mode === 'air' || mode === 'lcl') {
            const basis = c.basis || 'Normal';
            if (basis === 'Per KGS') {
                totalSellAmt *= (data.weight || 0);
                totalBuyAmt *= (data.weight || 0);
            } else if (basis === 'Per CBM') {
                totalSellAmt *= (data.volume || 0);
                totalBuyAmt *= (data.volume || 0);
            } else if (basis === 'Per KGS × 3') {
                totalSellAmt *= (data.weight || 0) * 3;
                totalBuyAmt *= (data.weight || 0) * 3;
            }
        }
        if (mode === 'lcl' && (charge === 'FREIGHT' || charge === 'THC')) {
            const volume = data.volume || 0;
            if (volume > 0) {
                const basis = c.basis || 'Normal';
                if (basis === 'Normal') {
                    totalSellAmt *= volume;
                    totalBuyAmt *= volume;
                }
            }
        }
        const sellINR = toINR(totalSellAmt, c.currency);
        const buyINR = toINR(totalBuyAmt, c.buyCurrency || c.currency);
        chargesWithINR[charge] = {
            unitSellAmt,
            totalSellAmt,
            currency: c.currency,
            sellINR,
            buyINR,
            basis: c.basis || 'Normal'
        };
        grandTotal += sellINR;
    });
    let html = `<div style="background:#ffffff !important; color:#1a1a1a !important; font-family:'Segoe UI',Arial,sans-serif; max-width:800px; margin:0 auto; padding:10px;">
        <div style="border-bottom:2px solid #1e3a8a;padding-bottom:8px;margin-bottom:10px;">
            <div style="font-size:0.9rem;font-weight:700;color:#1e3a8a;">${db.companyName || 'GATEWAY EXIM'}</div>
            <div style="font-size:0.65rem;color:#64748b;">${db.companyAddress || ''}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div style="text-align:left;">
                <div style="font-size:1.2rem;color:#1e3a8a !important;font-weight:800;letter-spacing:1px;">${modeLabel} QUOTATION</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:'Courier New',monospace;color:#d97706 !important;font-weight:700;font-size:0.85rem;background:#fffbeb;padding:4px 10px;border-radius:5px;">Quote No: ${data.quoteNumber||'DRAFT'}</div>
            </div>
        </div>`;
    html += `
        <div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:5px 9px;margin-top:12px;border-radius:4px 4px 0 0;font-size:0.78rem;">Customer & Shipment Details</div>
        <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.72rem;">
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Client</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${toUpper(data.client)}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Quote Date</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${data.autoDate||'-'}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Carrier</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${toUpper(data.carrier)}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Incoterm</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${toUpper(data.incoterm)}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">POL</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${toUpper(data.pol)}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">POD</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${toUpper(data.pod)}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Commodity</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${toUpper(data.commodity)}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Weight (KGS)</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${data.weight||'-'}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">${mode==='sea'?'Container':'Volume (CBM)'}</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${mode==='sea'?toUpper(data.container):(data.volume||'-')}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Transit Time</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${transitDisplay}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Validity Date</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${validityDisplay}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Status</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${toUpper(data.status)}</td></tr>
        </table>`;
    if (Object.keys(chargesWithINR).length > 0) {
        Object.entries(order).forEach(([category, charges]) => {
            if (charges.length === 0) return;
            const catEntries = charges.filter(ch => chargesWithINR[ch]);
            if (catEntries.length === 0) return;
            html += `<div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:5px 9px;margin-top:12px;border-radius:4px 4px 0 0;font-size:0.78rem;">${category.toUpperCase()}</div>
                <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.72rem;">
                    <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">#</th><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Charge Type</th><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Sell Amount</th><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Currency</th><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">INR Equivalent</th><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Basis</th></tr>`;
            let catTotal = 0;
            catEntries.forEach((ch, i) => {
                const c = chargesWithINR[ch];
                catTotal += c.sellINR;
                const isFreight = ch.toUpperCase() === 'FREIGHT' || ch.toUpperCase() === 'AIR FREIGHT';
                const rowStyle = isFreight ? 'background:#fee2e2 !important;font-weight:700;color:#dc2626 !important;' : '';
                html += `<tr style="${rowStyle}">
                            <td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${i+1}</td>
                            <td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${ch.toUpperCase()}</td>
                            <td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${Number(c.unitSellAmt).toLocaleString('en-IN')}</td>
                            <td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${c.currency}</td>
                            <td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${formatINR(c.sellINR)}</td>
                            <td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${c.basis}</td>
                        </tr>`;
            });
            html += `<tr style="background:#f1f5f9 !important;"><td colspan="5" style="border:1px solid #d1d5db;padding:4px 7px;text-align:right;font-weight:700;color:#334155 !important;">Subtotal:</td><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;font-weight:700;color:#334155 !important;">${formatINR(catTotal)}</td></tr></table>`;
        });
        html += `<table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:0.72rem;">
                    <tr style="background:#10b981 !important;color:white !important;font-weight:700;">
                        <td colspan="5" style="border:1px solid #059669;padding:6px 9px;text-align:right;color:white !important;"><strong>GRAND TOTAL (INR)</strong></td>
                        <td style="border:1px solid #059669;padding:6px 9px;text-align:left;color:white !important;"><strong>${formatINR(grandTotal)}</strong></td>
                    </tr>
                </table>`;
    }
    if (data.remarks) {
        html += `<div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:5px 9px;margin-top:12px;border-radius:4px 4px 0 0;font-size:0.78rem;">Remarks</div>
                <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.72rem;">
                    <tr><td style="border:1px solid #d1d5db;padding:6px 9px;text-align:left;color:#1a1a1a !important;white-space:pre-wrap;line-height:1.5;">${data.remarks.toUpperCase()}</td></tr>
                </table>`;
    }
    html += `
        <div style="margin-top:12px;font-size:0.68rem;color:#64748b !important;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px;">
            <p>This quotation is system-generated. Rates are subject to change based on validity date.</p>
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <div style="font-size:0.65rem;color:#64748b;margin-top:2px;">Prepared By: ${userName}</div>			
        </div></div>`;
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
// ==================== DSR FUNCTIONS ====================
let addShipmentDropdownOpen = false;
function toggleAddShipmentDropdown() {
    const dd = document.getElementById('addShipmentDropdown');
    addShipmentDropdownOpen = !addShipmentDropdownOpen;
    dd.classList.toggle('show', addShipmentDropdownOpen);
}
document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.add-shipment-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById('addShipmentDropdown').classList.remove('show');
        addShipmentDropdownOpen = false;
    }
});

// ===== UNIFIED DSR GLOBAL VARIABLES =====
let dsrEditIdx = null;

// ===== UNIFIED DSR FORM BUILDER =====
function buildDsrForm(s, mode, isEdit) {
    const carriers = db.carriers.filter(c => !(db.hiddenItems.carriers || []).includes(c)).sort();
    const polList = db.pol.filter(p => !(db.hiddenItems.pol || []).includes(p)).sort();
    const podList = db.pod.filter(p => !(db.hiddenItems.pod || []).includes(p)).sort();

    let html = `<div class="dsr-btn-bar">
        <button class="btn btn-search" onclick="dsrSearch()">Search</button>
        <button class="btn btn-modify" onclick="dsrModify()">Modify</button>
        <button class="btn btn-addnew" onclick="dsrAddNew()">Add New</button>
        <button class="btn btn-clear-dsr" onclick="dsrClear()">Clear</button>
        <button class="btn btn-exit" onclick="closeModal('dsrModal')">Exit</button>
        ${isEdit ? `<button class="btn btn-update-dsr" onclick="saveDsrShipment(true)">Update</button>` : `<button class="btn btn-save-dsr" onclick="saveDsrShipment(false)">Save</button>`}
        <button class="btn btn-cancel-dsr" onclick="closeModal('dsrModal')">Cancel</button>
        <button class="btn btn-info" onclick="toggleDsrDesignMode()">🖱️ Layout</button>
        <button class="btn btn-print-dsr" onclick="window.print()">Print</button>
        <button class="btn btn-pdf-dsr" onclick="dsrPDF()">PDF</button>
        <button class="btn btn-dup-dsr" onclick="dsrDuplicate()">Duplicate</button>
        ${isEdit ? `<button class="btn btn-del-dsr" onclick="dsrDelete()">Delete</button>` : ''}
        <button class="btn btn-close-dsr" onclick="closeModal('dsrModal')">Close</button>
    </div>`;

    html += `<div style="background:#f8fafc;padding:10px;border:1px solid #cbd5e1;margin-bottom:10px;">
        <h3 style="text-align:center;font-weight:800;font-size:1.4rem;color:#1e3a8a;margin-bottom:10px;">GATEWAY EXIM <span style="font-weight:400;font-size:1rem;color:#64748b;"></span></h3>
        
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;margin-bottom:10px;">
            <div class="form-group" style="flex:1;"><label>Direction</label>
                <select id="dsr-direction" style="width:100%;"><option value="EXPORT" ${s.exportImport==='EXPORT'?'selected':''}>EXPORT</option><option value="IMPORT" ${s.exportImport==='IMPORT'?'selected':''}>IMPORT</option></select>
            </div>
            <div class="form-group" style="flex:1;"><label>Mode</label>
                <select id="dsr-mode" onchange="changeDsrMode()" style="width:100%;"><option value="SEA" ${mode==='SEA'?'selected':''}>SEA</option><option value="AIR" ${mode==='AIR'?'selected':''}>AIR</option></select>
            </div>
            <div class="form-group" style="flex:1;"><label>Service A</label>
                <select id="dsr-service-a" style="width:100%;"><option value="SELF SEAL" ${s.service1==='SELF SEAL'?'selected':''}>SELF SEAL</option><option value="DOCS STUFFING" ${s.service1==='DOCS STUFFING'?'selected':''}>DOCS STUFFING</option><option value="ON WHEEL CLEARANCE" ${s.service1==='ON WHEEL CLEARANCE'?'selected':''}>ON WHEEL CLEARANCE</option></select>
            </div>
            <div class="form-group" style="flex:1;"><label>Service B</label>
                <select id="dsr-service-b" style="width:100%;"><option value="CLEAN ONLY" ${s.service2==='CLEAN ONLY'?'selected':''}>CLEAN ONLY</option><option value="FORWARDING ONLY" ${s.service2==='FORWARDING ONLY'?'selected':''}>FORWARDING ONLY</option><option value="TRANSPORTATION ONLY" ${s.service2==='TRANSPORTATION ONLY'?'selected':''}>TRANSPORTATION ONLY</option></select>
            </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group" style="grid-column:span 2;display:flex;gap:10px;">
            </div>            
			<div class="form-group"><label>JOB NO.</label><input type="text" id="dsr-job-no" value="${s.jobNo || s.code || ''}" style="width:100%;"></div>
            <div class="form-group"><label>Date</label><input type="date" id="dsr-date" value="${s.date || ''}" style="width:100%;"></div>

            <div class="form-group"><label>Shipper</label><input type="text" id="dsr-shipper" value="${s.shipper || ''}" style="width:100%;"></div>
            <div class="form-group"><label>No. of Pkgs / Cntr.</label><input type="text" id="dsr-packages" value="${s.packages || ''}" style="width:100%;"></div>
            
            <div class="form-group"><label>Port of Loading (POL)</label><select id="dsr-pol" style="width:100%;"><option value="">Select</option></select></div>
            <div class="form-group"><label>Port of Discharge (POD)</label><select id="dsr-pod" style="width:100%;"><option value="">Select</option></select></div>
            
            <div class="form-group"><label>Shipping Line</label><select id="dsr-liner" style="width:100%;"><option value="">Select</option></select></div>
            <div class="form-group"><label>ETD</label><input type="date" id="dsr-etd" value="${s.etd || ''}" style="width:100%;"></div>
            
            <div class="form-group"><label>Shipping Bill NO.</label><input type="text" id="dsr-shipping-bill-no" value="${s.shippingBillNo || ''}" style="width:100%;"></div>
            <div class="form-group"><label>Date</label><input type="date" id="dsr-shipping-bill-date" value="${s.shippingBillDate || ''}" style="width:100%;"></div>
            
            <div class="form-group"><label>MBL NO.</label><input type="text" id="dsr-mbl-no" value="${s.mblNo || ''}" style="width:100%;"></div>
            <div class="form-group"><label>HBL NO</label><input type="text" id="dsr-hbl-no" value="${s.hblNo || ''}" style="width:100%;"></div>
            
            <div class="form-group"><label>Pickup Date</label><input type="date" id="dsr-pickup-date" value="${s.pickupDate || ''}" style="width:100%;"></div>
            <div class="form-group"><label>Clearance Date</label><input type="date" id="dsr-clearance-date" value="${s.clearanceDate || ''}" style="width:100%;"></div>
            
            <div class="form-group"><label>Docs hand. Date</label><input type="date" id="dsr-docs-hand-date" value="${s.docsHandDate || ''}" style="width:100%;"></div>
            <div class="form-group"><label>Gatein Date</label><input type="date" id="dsr-gatein-date" value="${s.gateinDate || ''}" style="width:100%;"></div>
            
            <div class="form-group"><label>DGD Indexing Date</label><input type="date" id="dsr-dgd-indexing-date" value="${s.dgdIndexingDate || ''}" style="width:100%;"></div>
            <div class="form-group"><label>BL Release Date</label><input type="date" id="dsr-bl-release-date" value="${s.blReleaseDate || ''}" style="width:100%;"></div>
            
            <div class="form-group" style="grid-column:span 2;display:flex;gap:10px;">
                <div style="flex:2;"><label>Vessel & ATD</label><input type="text" id="dsr-vessel-atd" value="${s.vesselAtd || ''}" style="width:100%;"></div>
                <div style="flex:1;"><label>ETA</label><input type="date" id="dsr-eta" value="${s.eta || ''}" style="width:100%;"></div>
            </div>
        </div>
        <div class="form-group"><label>Remarks</label><textarea id="dsr-remarks" rows="2" style="width:100%;">${s.remarks || ''}</textarea></div>
        <input type="hidden" id="dsr-code" value="${s.code || ''}" />
        <input type="hidden" id="dsr-cargo-status" value="${s.cargoStatus || 'Booked'}" />
        <input type="hidden" id="dsr-docs-status" value="${s.docsStatus || 'Pending'}" />
    </div>
    <div id="dsr-charges-area"></div>`;

    return html;
}

// ===== OPEN DSR MODAL (UNIFIED) =====
function openDsrModal(mode, editIdx = null, prefill = null) {
    document.getElementById('addShipmentDropdown').classList.remove('show');
    addShipmentDropdownOpen = false;
    dsrEditIdx = editIdx;

    const body = document.getElementById('dsrModalBody');
    let s = {};
    let isEdit = false;

    if (prefill) {
        s = { ...prefill };
    } else if (editIdx !== null && db.shipments && db.shipments[editIdx]) {
        s = { ...db.shipments[editIdx] };
        mode = s.mode || mode;
        isEdit = true;
    }

    body.innerHTML = buildDsrForm(s, mode, isEdit);
    document.getElementById('dsrModalTitle').textContent = `${mode} Shipment ~ DSR`;
    openModal('dsrModal');

    setTimeout(() => {
        const visibleCarriers = ['ALL', ...db.carriers.filter(c => !(db.hiddenItems.carriers || []).includes(c))];
        const visiblePol = db.pol.filter(p => !(db.hiddenItems.pol || []).includes(p));
        const visiblePod = db.pod.filter(p => !(db.hiddenItems.pod || []).includes(p));
        populateSelect('dsr-pol', visiblePol, s.pol);
        populateSelect('dsr-pod', visiblePod, s.pod);
        populateSelect('dsr-liner', visibleCarriers, s.liner);

        renderDsrCharges(mode, s);
    }, 100);
}

// ===== DSR MODE SWITCH & CHARGES RENDER =====
function changeDsrMode() {
    const mode = document.getElementById('dsr-mode').value;
    renderDsrCharges(mode, {});
}

function renderDsrCharges(mode, s = {}) {
    const area = document.getElementById('dsr-charges-area');
    if (!area) return;

    if (mode === 'SEA') {
        area.innerHTML = `
        <div style="display:flex; flex-direction:row; gap:10px; margin-bottom:12px; align-items:start;">
            <div class="form-group" style="flex:1; margin:0; min-width:0;">
                <label class="green-label" style="display:block; text-align:center; background:#008000; color:white; padding:6px 0; font-size:0.9rem;">SELL</label>
                <input type="number" id="sea-sell" value="0" oninput="calcSeaMargin()" step="0.01" style="width:100%; padding:6px; border:3px solid #d1d5db; border-radius:4px; background:white; color:#1a1a1a;" />
            </div>
            <div class="form-group" style="flex:1; margin:0; min-width:0;">
                <label class="red-label" style="display:block; text-align:center; background:#dc2626; color:white; padding:6px 0; font-size:0.9rem;">BUY</label>
                <input type="number" id="sea-buy" value="0" oninput="calcSeaMargin()" step="0.01" style="width:100%; padding:6px; border:3px solid #d1d5db; border-radius:4px; background:white; color:#1a1a1a;" />
            </div>
            <div class="form-group" style="flex:1; margin:0; min-width:0;">
                <label class="darkblue-label" style="display:block; text-align:center; background:#0f172a; color:white; padding:6px 0; font-size:0.9rem;">MARGIN</label>
                <input type="text" id="sea-margin" value="0.00" readonly style="width:100%; padding:6px; border:3px solid #d1d5db; border-radius:4px; background:#ffff00; font-weight:700; color:#1a1a1a;" />
            </div>
        </div>
        <div class="dsr-section-title green-title">Carrier - Local Charges</div>
        <div class="dsr-charges-grid" style="margin-bottom:12px;">
            <div class="form-group"><label class="teal">THC</label><input type="number" id="sea-thc" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">SEAWAY</label><input type="number" id="sea-seaway" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">SEAL</label><input type="number" id="sea-seal" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">ETS</label><input type="number" id="sea-ets" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">MUC</label><input type="number" id="sea-muc" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">HAZ DOCS</label><input type="number" id="sea-hazdocs" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">DOCS</label><input type="number" id="sea-docs" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">AMS</label><input type="number" id="sea-ams" value="0" step="0.01" /></div>
        </div>
        <div class="dsr-section-title darkblue-label">Other - Local Charges</div>
        <div class="dsr-charges-grid">
            <div class="form-group"><label class="teal">CFS</label><input type="number" id="sea-cfs" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">GR. WEIGHT</label><input type="number" id="sea-grweight" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">CLEARANCE</label><input type="number" id="sea-clearance" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">TRANSPORTATION</label><input type="number" id="sea-transport" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">VGM</label><input type="number" id="sea-vgm" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">LOLO</label><input type="number" id="sea-lolo" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">TOLL</label><input type="number" id="sea-toll" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">OTHER LOCAL</label><input type="number" id="sea-otherlocal" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">LASHING & CHOKING</label><input type="number" id="sea-lascho" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">OTHER LOCAL 2</label><input type="number" id="sea-otherlocal2" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">HAZ STICKER</label><input type="number" id="sea-hazsticker" value="0" step="0.01" /></div>
            <div class="form-group"><label class="teal">OTHER LOCAL 3</label><input type="number" id="sea-otherlocal3" value="0" step="0.01" /></div>
        </div>
        `;
        setTimeout(() => {
            if (document.getElementById('sea-sell')) document.getElementById('sea-sell').value = s.sell || 0;
            if (document.getElementById('sea-buy')) document.getElementById('sea-buy').value = s.buy || 0;
            if (document.getElementById('sea-thc')) document.getElementById('sea-thc').value = s.carrierCharges?.THC || 0;
            if (document.getElementById('sea-seaway')) document.getElementById('sea-seaway').value = s.carrierCharges?.SEAWAY || 0;
            if (document.getElementById('sea-seal')) document.getElementById('sea-seal').value = s.carrierCharges?.SEAL || 0;
            if (document.getElementById('sea-ets')) document.getElementById('sea-ets').value = s.carrierCharges?.ETS || 0;
            if (document.getElementById('sea-muc')) document.getElementById('sea-muc').value = s.carrierCharges?.MUC || 0;
            if (document.getElementById('sea-hazdocs')) document.getElementById('sea-hazdocs').value = s.carrierCharges?.HAZDOCS || 0;
            if (document.getElementById('sea-docs')) document.getElementById('sea-docs').value = s.carrierCharges?.DOCS || 0;
            if (document.getElementById('sea-ams')) document.getElementById('sea-ams').value = s.carrierCharges?.AMS || 0;
            if (document.getElementById('sea-cfs')) document.getElementById('sea-cfs').value = s.otherCharges?.CFS || 0;
            if (document.getElementById('sea-grweight')) document.getElementById('sea-grweight').value = s.otherCharges?.GRWEIGHT || 0;
            if (document.getElementById('sea-clearance')) document.getElementById('sea-clearance').value = s.otherCharges?.CLEARANCE || 0;
            if (document.getElementById('sea-transport')) document.getElementById('sea-transport').value = s.otherCharges?.TRANSPORTATION || 0;
            if (document.getElementById('sea-vgm')) document.getElementById('sea-vgm').value = s.otherCharges?.VGM || 0;
            if (document.getElementById('sea-lolo')) document.getElementById('sea-lolo').value = s.otherCharges?.LOLO || 0;
            if (document.getElementById('sea-toll')) document.getElementById('sea-toll').value = s.otherCharges?.TOLL || 0;
            if (document.getElementById('sea-otherlocal')) document.getElementById('sea-otherlocal').value = s.otherCharges?.OTHERLOCAL || 0;
            if (document.getElementById('sea-lascho')) document.getElementById('sea-lascho').value = s.otherCharges?.LASCHO || 0;
            if (document.getElementById('sea-otherlocal2')) document.getElementById('sea-otherlocal2').value = s.otherCharges?.OTHERLOCAL2 || 0;
            if (document.getElementById('sea-hazsticker')) document.getElementById('sea-hazsticker').value = s.otherCharges?.HAZSTICKER || 0;
            if (document.getElementById('sea-otherlocal3')) document.getElementById('sea-otherlocal3').value = s.otherCharges?.OTHERLOCAL3 || 0;
            calcSeaMargin();
        }, 50);
    } else if (mode === 'AIR') {
        area.innerHTML = `
        <div class="dsr-section-title teal-title">QUOTE CHARGES</div>
        <div class="dsr-air-charges-grid">
            <div class="charge-item"><label>Sell PK</label><input type="number" id="air-sellpk" value="0" oninput="calcAirMargin()" step="0.01" style="background:#008000;color:white;font-weight:700;" /></div>
            <div class="charge-item"><label>Buy PK</label><input type="number" id="air-buy pk" value="0" oninput="calcAirMargin()" step="0.01" style="background:#ff0000;color:white;font-weight:700;" /></div>
            <div class="charge-item"><label>Margin</label><input type="text" id="air-margin" value="0.00" readonly style="background:#ffff00;font-weight:700;color:#1a1a1a;" /></div>
            <div class="charge-item"><label>DG AGENT</label><input type="number" id="air-dgagent" value="0" step="0.01" /></div>
            <div class="charge-item"><label>TOTAL FRT</label><input type="number" id="air-totalfrt" value="0" step="0.01" /></div>
            <div class="charge-item"><label>AWB</label><input type="number" id="air-awb" value="0" step="0.01" /></div>
            <div class="charge-item"><label>GATE PASS</label><input type="number" id="air-gatepass" value="0" step="0.01" /></div>
            <div class="charge-item"><label>EXT-2</label><input type="number" id="air-ext2" value="0" step="0.01" /></div>
            <div class="charge-item"><label>CARTAGE</label><input type="number" id="air-cartage" value="0" step="0.01" /></div>
            <div class="charge-item"><label>TEDI</label><input type="number" id="air-tedi" value="0" step="0.01" /></div>
            <div class="charge-item"><label>CLEARANCE</label><input type="number" id="air-clearance" value="0" step="0.01" /></div>
            <div class="charge-item"><label>EXT-3</label><input type="number" id="air-ext3" value="0" step="0.01" /></div>
            <div class="charge-item"><label>MCC</label><input type="number" id="air-mcc" value="0" step="0.01" /></div>
            <div class="charge-item"><label>AMS</label><input type="number" id="air-ams" value="0" step="0.01" /></div>
            <div class="charge-item"><label>TRANSPORT</label><input type="number" id="air-transport" value="0" step="0.01" /></div>
            <div class="charge-item"><label>EXT-4</label><input type="number" id="air-ext4" value="0" step="0.01" /></div>
            <div class="charge-item"><label>X-RAY</label><input type="number" id="air-xray" value="0" step="0.01" /></div>
            <div class="charge-item"><label>DG FEE</label><input type="number" id="air-dgfee" value="0" step="0.01" /></div>
            <div class="charge-item"><label>PALLET</label><input type="number" id="air-pallet" value="0" step="0.01" /></div>
            <div class="charge-item"><label>EXT-5</label><input type="number" id="air-ext5" value="0" step="0.01" /></div>
            <div class="charge-item"><label>ASI</label><input type="number" id="air-asi" value="0" step="0.01" /></div>
            <div class="charge-item"><label>EXT-6</label><input type="number" id="air-ext6" value="0" step="0.01" /></div>
        </div>`;

        setTimeout(() => {
            if (document.getElementById('air-sellpk')) document.getElementById('air-sellpk').value = s.sellPK || 0;
            if (document.getElementById('air-buy pk')) document.getElementById('air-buy pk').value = s.buyPK || 0;
            if (document.getElementById('air-dgagent')) document.getElementById('air-dgagent').value = s.quoteCharges?.DGAGENT || 0;
            if (document.getElementById('air-totalfrt')) document.getElementById('air-totalfrt').value = s.quoteCharges?.TOTALFRT || 0;
            if (document.getElementById('air-awb')) document.getElementById('air-awb').value = s.quoteCharges?.AWB || 0;
            if (document.getElementById('air-gatepass')) document.getElementById('air-gatepass').value = s.quoteCharges?.GATEPASS || 0;
            if (document.getElementById('air-ext2')) document.getElementById('air-ext2').value = s.quoteCharges?.EXT2 || 0;
            if (document.getElementById('air-cartage')) document.getElementById('air-cartage').value = s.quoteCharges?.CARTAGE || 0;
            if (document.getElementById('air-tedi')) document.getElementById('air-tedi').value = s.quoteCharges?.TEDI || 0;
            if (document.getElementById('air-clearance')) document.getElementById('air-clearance').value = s.quoteCharges?.CLEARANCE || 0;
            if (document.getElementById('air-ext3')) document.getElementById('air-ext3').value = s.quoteCharges?.EXT3 || 0;
            if (document.getElementById('air-mcc')) document.getElementById('air-mcc').value = s.quoteCharges?.MCC || 0;
            if (document.getElementById('air-ams')) document.getElementById('air-ams').value = s.quoteCharges?.AMS || 0;
            if (document.getElementById('air-transport')) document.getElementById('air-transport').value = s.quoteCharges?.TRANSPORT || 0;
            if (document.getElementById('air-ext4')) document.getElementById('air-ext4').value = s.quoteCharges?.EXT4 || 0;
            if (document.getElementById('air-xray')) document.getElementById('air-xray').value = s.quoteCharges?.XRAY || 0;
            if (document.getElementById('air-dgfee')) document.getElementById('air-dgfee').value = s.quoteCharges?.DGFEE || 0;
            if (document.getElementById('air-pallet')) document.getElementById('air-pallet').value = s.quoteCharges?.PALLET || 0;
            if (document.getElementById('air-ext5')) document.getElementById('air-ext5').value = s.quoteCharges?.EXT5 || 0;
            if (document.getElementById('air-asi')) document.getElementById('air-asi').value = s.quoteCharges?.ASI || 0;
            if (document.getElementById('air-ext6')) document.getElementById('air-ext6').value = s.quoteCharges?.EXT6 || 0;
            calcAirMargin();
        }, 50);
    }
}

// ===== DSR HELPER FUNCTIONS =====
function calcSeaMargin() {
    const sell = parseFloat(document.getElementById('sea-sell').value) || 0;
    const buy = parseFloat(document.getElementById('sea-buy').value) || 0;
    document.getElementById('sea-margin').value = (sell - buy).toFixed(2);
}
function calcAirMargin() {
    const sell = parseFloat(document.getElementById('air-sellpk').value) || 0;
    const buy = parseFloat(document.getElementById('air-buy pk').value) || 0;
    document.getElementById('air-margin').value = (sell - buy).toFixed(2);
}

function dsrSearch() {
    closeModal('dsrModal');
    const s = document.getElementById('dsr-search');
    if (s) { s.focus();
        s.select(); }
}

function dsrModify() {
    const code = document.getElementById('dsr-job-no').value.trim() || document.getElementById('dsr-code').value.trim();
    if (!code) return alert('No shipment to modify.');
    const idx = db.shipments.findIndex(s => s.jobNo === code || s.code === code);
    if (idx === -1) return alert('Shipment not found.');
    closeModal('dsrModal');
    openDsrModal(db.shipments[idx].mode, idx);
}

function dsrAddNew() {
    closeModal('dsrModal');
    openDsrModal('SEA');
}

function dsrClear() {
    if (confirm('Clear all fields?')) {
        document.querySelectorAll('#dsrModalBody input, #dsrModalBody select, #dsrModalBody textarea').forEach(el => {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else if (el.type === 'number') el.value = '0';
            else if (el.type === 'date') el.value = '';
            else el.value = '';
        });
        document.getElementById('dsr-code').value = '';
        document.getElementById('dsr-job-no').value = '';
        dsrEditIdx = null;
    }
}

function dsrDuplicate() {
    const code = document.getElementById('dsr-job-no').value.trim() || document.getElementById('dsr-code').value.trim();
    if (!code) return alert('No shipment to duplicate.');
    const idx = db.shipments.findIndex(s => s.jobNo === code || s.code === code);
    if (idx === -1) return alert('Shipment not found.');
    const copy = JSON.parse(JSON.stringify(db.shipments[idx]));
    copy.code = (copy.mode === 'SEA' ? 'SR-' : 'AR-') + Date.now().toString(36).toUpperCase();
    copy.jobNo = copy.code;
    copy.createdAt = new Date().toISOString();
    copy.lastModified = new Date().toISOString();
    db.shipments.push(copy);
    saveDB();
    closeModal('dsrModal');
    renderShipments();
    alert('Shipment duplicated! New JOB NO: ' + copy.code);
    autoBackup();
}

function dsrDelete() {
    const code = document.getElementById('dsr-job-no').value.trim() || document.getElementById('dsr-code').value.trim();
    if (!code) return alert('No shipment to delete.');
    const idx = db.shipments.findIndex(s => s.jobNo === code || s.code === code);
    if (idx === -1) return alert('Shipment not found.');
    if (confirm(`Delete shipment "${code}"?`)) {
        db.shipments.splice(idx, 1);
        saveDB();
        closeModal('dsrModal');
        renderShipments();
        alert('Shipment deleted.');
        autoBackup();
    }
}

function dsrPDF() {
    const code = document.getElementById('dsr-job-no').value.trim() || document.getElementById('dsr-code').value.trim();
    if (!code) return alert('No shipment data to generate PDF.');
    const idx = db.shipments.findIndex(s => s.jobNo === code || s.code === code);
    if (idx === -1) return alert('Shipment not found.');
    const s = db.shipments[idx];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`${s.mode} SHIPMENT DSR`, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    let y = 35;
    const fields = [
        ['Job No', s.jobNo || s.code],
        ['Shipper', s.shipper],
        ['POL', s.pol],
        ['POD', s.pod],
        ['Shipping Line', s.liner],
        ['ETD', s.etd],
        ['ETA', s.eta],
        ['Cargo Status', s.cargoStatus],
        ['Docs Status', s.docsStatus]
    ];
    fields.forEach(([label, value]) => {
        doc.text(`${label}: ${value || '-'}`, 14, y);
        y += 7;
    });
    doc.save(`${s.mode}_Shipment_${s.code}.pdf`);
}

// ===== UNIFIED DSR SAVER =====
function saveDsrShipment(isUpdate) {
    const mode = document.getElementById('dsr-mode').value;
    const jobNo = document.getElementById('dsr-job-no').value.trim();
    const shipper = document.getElementById('dsr-shipper').value.trim();
    const pol = document.getElementById('dsr-pol').value;
    const pod = document.getElementById('dsr-pod').value;
    const liner = document.getElementById('dsr-liner').value;

    if (!jobNo || !shipper || !pol || !pod || !liner) {
        alert('Mandatory fields: JOB NO, Shipper, POL, POD, Shipping Line');
        return;
    }

    let code = document.getElementById('dsr-code').value.trim();
    if (!code) {
        code = (mode === 'SEA' ? 'SR-' : 'AR-') + Date.now().toString(36).toUpperCase();
    }

    const data = {
        mode: mode,
        exportImport: document.getElementById('dsr-direction').value,
        service1: document.getElementById('dsr-service-a').value,
        service2: document.getElementById('dsr-service-b').value,
        jobNo: jobNo,
        date: document.getElementById('dsr-date').value,
        shipper: shipper,
        packages: document.getElementById('dsr-packages').value.trim(),
        pol: pol,
        pod: pod,
        liner: liner,
        etd: document.getElementById('dsr-etd').value,
        shippingBillNo: document.getElementById('dsr-shipping-bill-no').value.trim(),
        shippingBillDate: document.getElementById('dsr-shipping-bill-date').value,
        mblNo: document.getElementById('dsr-mbl-no').value.trim(),
        hblNo: document.getElementById('dsr-hbl-no').value.trim(),
        pickupDate: document.getElementById('dsr-pickup-date').value,
        clearanceDate: document.getElementById('dsr-clearance-date').value,
        docsHandDate: document.getElementById('dsr-docs-hand-date').value,
        gateinDate: document.getElementById('dsr-gatein-date').value,
        dgdIndexingDate: document.getElementById('dsr-dgd-indexing-date').value,
        blReleaseDate: document.getElementById('dsr-bl-release-date').value,
        vesselAtd: document.getElementById('dsr-vessel-atd').value.trim(),
        eta: document.getElementById('dsr-eta').value,
        remarks: document.getElementById('dsr-remarks').value.trim(),
        code: code,
        cargoStatus: document.getElementById('dsr-cargo-status').value,
        docsStatus: document.getElementById('dsr-docs-status').value,
        sales: getLoggedInUserName() || db.defaultUser || '',
        lastModified: new Date().toISOString()
    };

    if (mode === 'SEA') {
        data.sell = parseFloat(document.getElementById('sea-sell').value) || 0;
        data.buy = parseFloat(document.getElementById('sea-buy').value) || 0;
        data.margin = data.sell - data.buy;
        data.carrierCharges = {
            THC: parseFloat(document.getElementById('sea-thc').value) || 0,
            SEAWAY: parseFloat(document.getElementById('sea-seaway').value) || 0,
            SEAL: parseFloat(document.getElementById('sea-seal').value) || 0,
            ETS: parseFloat(document.getElementById('sea-ets').value) || 0,
            MUC: parseFloat(document.getElementById('sea-muc').value) || 0,
            HAZDOCS: parseFloat(document.getElementById('sea-hazdocs').value) || 0,
            DOCS: parseFloat(document.getElementById('sea-docs').value) || 0,
            AMS: parseFloat(document.getElementById('sea-ams').value) || 0
        };
        data.otherCharges = {
            CFS: parseFloat(document.getElementById('sea-cfs').value) || 0,
            CLEARANCE: parseFloat(document.getElementById('sea-clearance').value) || 0,
            VGM: parseFloat(document.getElementById('sea-vgm').value) || 0,
            TOLL: parseFloat(document.getElementById('sea-toll').value) || 0,
            LASCHO: parseFloat(document.getElementById('sea-lascho').value) || 0,
            HAZSTICKER: parseFloat(document.getElementById('sea-hazsticker').value) || 0,
            GRWEIGHT: parseFloat(document.getElementById('sea-grweight').value) || 0,
            TRANSPORTATION: parseFloat(document.getElementById('sea-transport').value) || 0,
            LOLO: parseFloat(document.getElementById('sea-lolo').value) || 0,
            OTHERLOCAL: parseFloat(document.getElementById('sea-otherlocal').value) || 0,
            OTHERLOCAL2: parseFloat(document.getElementById('sea-otherlocal2').value) || 0,
            OTHERLOCAL3: parseFloat(document.getElementById('sea-otherlocal3').value) || 0
        };
    } else {
        data.sellPK = parseFloat(document.getElementById('air-sellpk').value) || 0;
        data.buyPK = parseFloat(document.getElementById('air-buy pk').value) || 0;
        data.margin = data.sellPK - data.buyPK;
        data.quoteCharges = {
            TOTALFRT: parseFloat(document.getElementById('air-totalfrt').value) || 0,
            AWB: parseFloat(document.getElementById('air-awb').value) || 0,
            CARTAGE: parseFloat(document.getElementById('air-cartage').value) || 0,
            TEDI: parseFloat(document.getElementById('air-tedi').value) || 0,
            MCC: parseFloat(document.getElementById('air-mcc').value) || 0,
            AMS: parseFloat(document.getElementById('air-ams').value) || 0,
            XRAY: parseFloat(document.getElementById('air-xray').value) || 0,
            DGFEE: parseFloat(document.getElementById('air-dgfee').value) || 0,
            ASI: parseFloat(document.getElementById('air-asi').value) || 0,
            GATEPASS: parseFloat(document.getElementById('air-gatepass').value) || 0,
            CLEARANCE: parseFloat(document.getElementById('air-clearance').value) || 0,
            TRANSPORT: parseFloat(document.getElementById('air-transport').value) || 0,
            PALLET: parseFloat(document.getElementById('air-pallet').value) || 0,
            DGAGENT: parseFloat(document.getElementById('air-dgagent').value) || 0,
            EXT2: parseFloat(document.getElementById('air-ext2').value) || 0,
            EXT3: parseFloat(document.getElementById('air-ext3').value) || 0,
            EXT4: parseFloat(document.getElementById('air-ext4').value) || 0,
            EXT5: parseFloat(document.getElementById('air-ext5').value) || 0,
            EXT6: parseFloat(document.getElementById('air-ext6').value) || 0
        };
    }

    const existing = db.shipments.findIndex(s => s.code === code && s.mode === mode);
    if (existing !== -1 && !isUpdate) {
        if (!confirm(`Shipment code "${code}" already exists. Do you want to overwrite?`)) return;
        db.shipments[existing] = { ...db.shipments[existing], ...data };
    } else if (isUpdate && dsrEditIdx !== null) {
        const idx = dsrEditIdx;
        if (idx !== undefined && db.shipments[idx]) {
            db.shipments[idx] = { ...db.shipments[idx], ...data };
        } else {
            alert('Edit index not found.');
            return;
        }
    } else {
        data.createdAt = new Date().toISOString();
        db.shipments.push(data);
    }

    saveDB();
    closeModal('dsrModal');
    renderShipments();
    alert(`${mode} Shipment saved successfully!`);
    autoBackup();
}

// ===== EDIT DSR SHIPMENT (CLICK FROM LIST) =====
function editDsrShipment(idx) {
    const s = db.shipments[idx];
    if (!s) return alert('Shipment not found.');
    openDsrModal(s.mode, idx);
}

// ===== Shipment List Rendering =====
function renderShipments() {
    const search = (document.getElementById('dsr-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('dsr-type-filter')?.value || '';
    const statusFilter = document.getElementById('dsr-status-filter')?.value || '';
    const sortMode = document.getElementById('dsr-sort')?.value || 'date-desc';
    const perPage = parseInt(document.getElementById('dsr-per-page')?.value) || 25;
    const list = document.getElementById('dsr-list');
    const pagination = document.getElementById('dsr-pagination');
    let shipments = db.shipments || [];
    shipments = shipments.filter(s => {
        const text = `${s.code||''} ${s.shipper||''} ${s.pol||''} ${s.pod||''} ${s.bookingNo||s.jobBkg||''} ${s.containerNo||''}`.toLowerCase();
        if (search && !text.includes(search)) return false;
        if (typeFilter && s.type !== typeFilter) return false;
        if (statusFilter && s.cargoStatus !== statusFilter) return false;
        return true;
    });
    shipments.sort((a, b) => {
        switch (sortMode) {
            case 'date-desc':
                return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
            case 'date-asc':
                return new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0);
            case 'code':
                return (a.code || '').localeCompare(b.code || '');
            case 'shipper':
                return (a.shipper || '').localeCompare(b.shipper || '');
            case 'pol':
                return (a.pol || '').localeCompare(b.pol || '');
            case 'pod':
                return (a.pod || '').localeCompare(b.pod || '');
            default:
                return 0;
        }
    });
    const total = shipments.length;
    const perPageVal = perPage === 0 ? total : perPage;
    const totalPages = perPageVal > 0 ? Math.ceil(total / perPageVal) : 1;
    let page = parseInt(sessionStorage.getItem('dsrPage') || '1');
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    sessionStorage.setItem('dsrPage', String(page));
    const start = (page - 1) * perPageVal;
    const pageData = shipments.slice(start, start + perPageVal);
    if (total === 0) {
        list.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center;">No shipments found.</p>';
        pagination.innerHTML = '';
        return;
    }
    const seaData = pageData.filter(s => s.type === 'SEA');
    const airData = pageData.filter(s => s.type === 'AIR');
    let html = '';
    if (seaData.length > 0) {
        html += `<div class="dsr-section-header sea-header">🚢 SEA Shipments <span class="badge">${seaData.length}</span></div>`;
        html += buildShipmentTable(seaData, 'SEA');
    }
    if (airData.length > 0) {
        html += `<div class="dsr-section-header">✈️ AIR Shipments <span class="badge">${airData.length}</span></div>`;
        html += buildShipmentTable(airData, 'AIR');
    }
    if (!html) {
        html = '<p style="color:var(--text-light);padding:20px;text-align:center;">No shipments match your filters.</p>';
    }
    list.innerHTML = html;
    if (totalPages <= 1) {
        pagination.innerHTML = '';
    } else {
        let pagHtml = `<button class="page-btn" onclick="changeDsrPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>`;
        pagHtml += `<span class="page-info">Page ${page} of ${totalPages} (${total} records)</span>`;
        pagHtml += `<button class="page-btn" onclick="changeDsrPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;
        pagination.innerHTML = pagHtml;
    }
}
function changeDsrPage(page) {
    const perPage = parseInt(document.getElementById('dsr-per-page')?.value) || 25;
    const total = (db.shipments || []).length;
    const perPageVal = perPage === 0 ? total : perPage;
    const totalPages = perPageVal > 0 ? Math.ceil(total / perPageVal) : 1;
    if (page < 1 || page > totalPages) return;
    sessionStorage.setItem('dsrPage', String(page));
    renderShipments();
}
function buildShipmentTable(data, type) {
    let html = `<table class="dsr-table"><thead><tr>
        <th>SR No.</th>
        <th>Quote Code</th>
        <th>Shipper</th>
        <th>POL</th>
        <th>POD</th>
        <th>Cargo Status</th>
        <th>Docs Status</th>
        <th>Remarks</th>
        <th>Actions</th>
    </tr></thead><tbody>`;
    data.forEach((s, idx) => {
        const realIdx = db.shipments.indexOf(s);
        const margin = (s.sell || s.sellPK || 0) - (s.buy || s.buyPK || 0);
        const marginColor = margin < 0 ? 'var(--danger)' : margin > 0 ? 'var(--success)' : 'var(--text)';
        html += `<tr>
            <td>${idx + 1}</td>
            <td><a href="javascript:void(0)" onclick="openDsrByCode('${s.code}')" style="color:var(--primary);font-weight:700;text-decoration:underline;cursor:pointer;">${s.code || '-'}</a></td>
            <td>${s.shipper || '-'}</td>
            <td>${s.pol || '-'}</td>
            <td>${s.pod || '-'}</td>
            <td><span class="status-badge ${s.cargoStatus === 'Delivered' ? 'status-active' : s.cargoStatus === 'In Transit' ? 'status-expiring' : 'status-expired'}">${s.cargoStatus || 'Booked'}</span></td>
            <td>${s.docsStatus || 'Pending'}</td>
            <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.remarks || '-'}</td>
            <td>
                <button class="btn btn-sm btn-preview" onclick="previewDsrShipment(${realIdx})">👁</button>
                <button class="btn btn-sm btn-pdf" onclick="downloadDsrPDF(${realIdx})">📄</button>
                <button class="btn btn-sm btn-duplicate" onclick="duplicateDsrShipment(${realIdx})">📋</button>
                <button class="btn btn-sm btn-preview" onclick="editDsrShipment(${realIdx})">✏️</button>
                <button class="btn btn-sm btn-clear" onclick="deleteDsrShipment(${realIdx})">×</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}
function openDsrByCode(code) {
    const idx = db.shipments.findIndex(s => s.code === code);
    if (idx === -1) return alert('Shipment not found.');
    editDsrShipment(idx);
}
function editDsrShipment(idx) {
    const s = db.shipments[idx];
    if (!s) return alert('Shipment not found.');
    if (s.type === 'SEA') {
        openSeaDsrModal(idx);
    } else if (s.type === 'AIR') {
        openAirDsrModal(idx);
    } else {
        openShipmentModal(idx);
    }
}
function previewDsrShipment(idx) {
    const s = db.shipments[idx];
    if (!s) return alert('Shipment not found.');
    const html = `
        <div class="dsr-preview-grid">
            ${Object.entries({
                'Code': s.code,
                'Type': s.type,
                'Shipper': s.shipper,
                'POL': s.pol,
                'POD': s.pod,
                'Booking No.': s.bookingNo || s.jobBkg,
                'Container No.': s.containerNo,
                'ETD': s.etd || s.dd,
                'ETA': s.eta,
                'Liner': s.liner,
                'Cargo Status': s.cargoStatus,
                'Docs Status': s.docsStatus,
                'Commodity': s.commodity,
                'Sell': formatINR(s.sell || s.sellPK || 0),
                'Buy': formatINR(s.buy || s.buyPK || 0),
                'Margin': formatINR((s.sell || s.sellPK || 0) - (s.buy || s.buyPK || 0)),
                'Remarks': s.remarks || '-'
            }).map(([k, v]) => `<div class="item"><span class="label">${k}</span><span class="value">${v}</span></div>`).join('')}
        </div>
    `;
    document.getElementById('modal-title').textContent = `Shipment Preview — ${s.code}`;
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}
function downloadDsrPDF(idx) {
    const s = db.shipments[idx];
    if (!s) return alert('Shipment not found.');
    const html = buildShipmentPreviewHTML(s, s.type === 'SEA' ? 'sea' : 'air');
    const renderArea = document.getElementById('pdf-render-area');
    renderArea.innerHTML = html;
    renderArea.style.cssText =
        `position: fixed; left: 0; top: 0; width: 800px; background: white !important; z-index: 9999; opacity: 1; padding: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.2); font-family: 'Segoe UI', Arial, sans-serif !important; font-size: 10px;`;
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        table { border-collapse: collapse; width: 100%; font-size: 10px; }
        th, td { border: 1px solid #ccc; padding: 3px 5px; text-align: left; }
        th { background: #f1f5f9; font-weight: bold; }
        h2 { font-size: 14px; } h3 { font-size: 12px; }
        .preview-grid { font-size: 9px; }
        .preview-charges-table { font-size: 9px; }
    `;
    renderArea.appendChild(styleTag);
    setTimeout(() => {
        html2canvas(renderArea, { scale: 1, useCORS: true, logging: false, backgroundColor: '#ffffff', width: 800,
                windowWidth: 800 })
            .then(canvas => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                let imgWidth = pdfWidth - 2 * margin;
                let imgHeight = (canvas.height * imgWidth) / canvas.width;
                const maxHeight = pdfHeight - 2 * margin;
                if (imgHeight > maxHeight) { const scale = maxHeight / imgHeight;
                    imgWidth *= scale;
                    imgHeight *= scale; }
                const x = (pdfWidth - imgWidth) / 2;
                const y = (pdfHeight - imgHeight) / 2;
                pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
                pdf.save(`${s.type}_Shipment_${s.code}.pdf`);
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = '';
            }).catch(err => { console.error('PDF error:', err);
                alert('PDF generation failed: ' + err.message);
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = ''; });
    }, 500);
}
function duplicateDsrShipment(idx) {
    const s = db.shipments[idx];
    if (!s) return alert('Shipment not found.');
    const copy = JSON.parse(JSON.stringify(s));
    const prefix = s.type === 'SEA' ? 'SR-' : 'AR-';
    copy.code = prefix + Date.now().toString(36).toUpperCase();
    copy.createdAt = new Date().toISOString();
    copy.lastModified = new Date().toISOString();
    db.shipments.push(copy);
    saveDB();
    renderShipments();
    alert(`${s.type} Shipment duplicated! New code: ${copy.code}`);
    autoBackup();
}
function deleteDsrShipment(idx) {
    const s = db.shipments[idx];
    if (!s) return alert('Shipment not found.');
    if (confirm(`Delete ${s.type} shipment "${s.code}"?`)) {
        db.shipments.splice(idx, 1);
        saveDB();
        renderShipments();
        alert('Shipment deleted.');
        autoBackup();
    }
}
function clearDSRFilters() {
    document.getElementById('dsr-search').value = '';
    document.getElementById('dsr-type-filter').value = '';
    document.getElementById('dsr-status-filter').value = '';
    document.getElementById('dsr-sort').value = 'date-desc';
    document.getElementById('dsr-per-page').value = '25';
    sessionStorage.setItem('dsrPage', '1');
    renderShipments();
}
function addShipmentFromQuote(target, mode, idx) {
    const quote = db[target][mode][idx];
    if (!quote) return alert('Quote not found.');
    let freightSell = 0,
        freightBuy = 0;
    const freightKey = mode === 'air' ? 'AIR FREIGHT' : 'FREIGHT';
    if (quote.charges && quote.charges[freightKey]) {
        const f = quote.charges[freightKey];
        freightSell = toINR(f.amount, f.currency);
        freightBuy = toINR(f.buyAmount || 0, f.buyCurrency || f.currency);
    }
    const shipmentBase = {
        shipper: quote.client || '',
        pol: quote.pol || '',
        pod: quote.pod || '',
        liner: quote.carrier || '',
        commodity: quote.commodity || '',
        weight: quote.weight || 0,
        incoterm: quote.incoterm || '',
        sales: getLoggedInUserName() || db.defaultUser || '',
        date: new Date().toISOString().split('T')[0],
        cargoStatus: (db.cargoStatusMaster && db.cargoStatusMaster[0]) || 'Booked',
        docsStatus: (db.docsStatusMaster && db.docsStatusMaster[0]) || 'Pending',
        remarks: quote.remarks || ''
    };
    if (mode === 'sea') {
        let s = createEmptySeaShipment();
        Object.assign(s, shipmentBase);
        s.code = 'SR-' + Date.now().toString(36).toUpperCase();
        s.sell = freightSell;
        s.buy = freightBuy;
        s.containerNo = quote.container || '';
        const carrierMap = { 'THC': 'THC', 'SEAL': 'SEAL', 'MUC': 'MUC', 'DOCS': 'DOCS', 'SEAWAY': 'SEAWAY', 'ETS': 'ETS',
            'HAZ DOCS': 'HAZDOCS', 'AMS': 'AMS' };
        const otherMap = { 'CFS': 'CFS', 'CLEARANCE': 'CLEARANCE', 'VGM': 'VGM', 'TOLL': 'TOLL',
            'LASHING & CHOKING': 'LASCHO', 'HAZ STICKER': 'HAZSTICKER', 'TRANSPORTATION': 'TRANSPORTATION', 'LOLO': 'LOLO',
            'OTHER LOCALS': 'OTHERLOCAL' };
        const charges = quote.charges || {};
        Object.entries(carrierMap).forEach(([k, v]) => { if (charges[k]) s.carrierCharges[v] = parseFloat(charges[k].amount) ||
                0; });
        Object.entries(otherMap).forEach(([k, v]) => { if (charges[k]) s.otherCharges[v] = parseFloat(charges[k].amount) ||
                0; });
        openSeaDsrModal(null, s);
    } else if (mode === 'air') {
        let s = createEmptyAirShipment();
        Object.assign(s, shipmentBase);
        s.code = 'AR-' + Date.now().toString(36).toUpperCase();
        s.sellPK = freightSell;
        s.buyPK = freightBuy;
        s.grossWeight = quote.weight || 0;
        s.validEtd = quote.validityDate || '';
        const airMap = { 'AIR FREIGHT': 'TOTALFRT', 'AWB FEES': 'AWB', 'CARTAGE': 'CARTAGE', 'TEDI': 'TEDI', 'MCC': 'MCC',
            'AMS': 'AMS', 'XRAY': 'XRAY', 'DG FEES': 'DGFEE', 'ASI GMAX': 'ASI', 'GATE PASS': 'GATEPASS',
            'CUSTOM CLEARANCE': 'CLEARANCE', 'TRANSPORATION': 'TRANSPORT', 'PALLETISATION': 'PALLET', 'DG AGENT FEE': 'DGAGENT' };
        const charges = quote.charges || {};
        Object.entries(airMap).forEach(([k, v]) => { if (charges[k]) s.quoteCharges[v] = parseFloat(charges[k].amount) ||
                0; });
        openAirDsrModal(null, s);
    }
}
function convertQuoteToShipmentByIndex(target, mode, idx) {
    addShipmentFromQuote(target, mode, idx);
}
const originalRenderRecords = renderRecords;
renderRecords = function(target) {
    originalRenderRecords(target);
    if (target === 'rates') {
        document.querySelectorAll('#rates-sea-list .record-actions, #rates-air-list .record-actions, #rates-lcl-list .record-actions')
            .forEach(container => {
                const btns = container.querySelectorAll('.btn-success');
                btns.forEach(btn => {
                    if (btn.textContent.includes('Convert to Shipment')) {
                        const match = btn.onclick.toString().match(/convertQuoteToShipmentByIndex\('([^']+)','([^']+)',(\d+)\)/);
                        if (match) {
                            const [, t, m, i] = match;
                            btn.textContent = '➕ Add Shipment';
                            btn.onclick = function() { addShipmentFromQuote(t, m, parseInt(i)); };
                            btn.classList.remove('btn-success');
                            btn.classList.add('btn-save');
                        }
                    }
                });
            });
    }
};
function buildShipmentPreviewHTML(s, mode) {
    const userName = getLoggedInUserName() || db.defaultUser || 'N/A';
    const modeLabel = { sea: 'SEA SHIPMENT DSR', air: 'AIR SHIPMENT DSR' }[mode] || 'SHIPMENT DSR';
    let chargeRows = '';
    let totalSell = 0;
    if (mode === 'sea') {
        totalSell = s.sell || 0;
        chargeRows = `<tr><td>Freight</td><td>${(s.sell || 0).toFixed(2)}</td><td>INR</td><td>${formatINR(s.sell || 0)}</td></tr>`;
        Object.entries(s.carrierCharges || {}).forEach(([k, v]) => { if (v > 0) chargeRows +=
                `<tr><td>${k}</td><td>${v.toFixed(2)}</td><td>INR</td><td>${formatINR(v)}</td></tr>`; });
        Object.entries(s.otherCharges || {}).forEach(([k, v]) => { if (v > 0) chargeRows +=
                `<tr><td>${k}</td><td>${v.toFixed(2)}</td><td>INR</td><td>${formatINR(v)}</td></tr>`; });
    } else {
        totalSell = s.sellPK || 0;
        chargeRows =
            `<tr><td>Sell PK</td><td>${(s.sellPK || 0).toFixed(2)}</td><td>INR</td><td>${formatINR(s.sellPK || 0)}</td></tr>`;
        Object.entries(s.quoteCharges || {}).forEach(([k, v]) => { if (v > 0) chargeRows +=
                `<tr><td>${k}</td><td>${v.toFixed(2)}</td><td>INR</td><td>${formatINR(v)}</td></tr>`; });
    }
    return `
    <div style="background:#ffffff !important; color:#1a1a1a !important; font-family:'Segoe UI',Arial,sans-serif; max-width:800px; margin:0 auto; padding:10px;">
        <div style="border-bottom:2px solid #1e3a8a;padding-bottom:8px;margin-bottom:10px;">
            <div style="font-size:0.9rem;font-weight:700;color:#1e3a8a;">${db.companyName || 'GATEWAY EXIM'}</div>
            <div style="font-size:0.65rem;color:#64748b;">${db.companyAddress || ''}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div style="text-align:left;">
                <div style="font-size:1.2rem;color:#1e3a8a !important;font-weight:800;letter-spacing:1px;">${modeLabel}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:'Courier New',monospace;color:#d97706 !important;font-weight:700;font-size:0.85rem;background:#fffbeb;padding:4px 10px;border-radius:5px;">Ref: ${s.code}</div>
            </div>
        </div>
        <div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:5px 9px;margin-top:12px;border-radius:4px 4px 0 0;font-size:0.78rem;">Customer & Shipment Details</div>
        <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.72rem;">
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Shipper</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.shipper||'-'}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Date</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.date||'-'}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Carrier / Liner</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.liner||'-'}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Incoterm</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.incoterm||'-'}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">POL</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.pol||'-'}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">POD</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.pod||'-'}</td></tr>
            <tr><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Commodity</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.commodity||'-'}</td><th style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;background:#f1f5f9 !important;color:#334155 !important;font-weight:700;">Weight</th><td style="border:1px solid #d1d5db;padding:4px 7px;text-align:left;color:#1a1a1a !important;">${s.weight || s.grossWeight || '-'}</td></tr>
        </table>
        <div style="background:#1e3a8a !important;color:white !important;font-weight:700;padding:5px 9px;margin-top:12px;border-radius:4px 4px 0 0;font-size:0.78rem;">Charge Breakdown</div>
        <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:0.72rem;">
            <thead><tr style="background:#1e3a8a;color:white;"><th style="padding:6px 8px;text-align:left;">Charge</th><th style="padding:6px 8px;text-align:right;">Amount</th><th style="padding:6px 8px;text-align:left;">Currency</th><th style="padding:6px 8px;text-align:right;">INR Equivalent</th></tr></thead>
            <tbody>${chargeRows}</tbody>
            <tfoot><tr style="background:#10b981 !important;color:white !important;font-weight:bold;"><td colspan="3" style="padding:6px 8px;text-align:right;">TOTAL (INR)</td><td style="padding:6px 8px;text-align:right;">${formatINR(totalSell)}</td></tr></tfoot>
        </table>
        <div style="margin-top:12px;font-size:0.68rem;color:#64748b !important;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px;">
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <div style="font-size:0.65rem;color:#64748b;margin-top:2px;">Prepared By: ${s.sales || userName}</div>	
        </div>
    </div>`;
}
const originalSaveDB = saveDB;
saveDB = function() {
    const result = originalSaveDB();
    const dsrPanel = document.getElementById('dsr');
    if (dsrPanel && dsrPanel.classList.contains('active')) {
        setTimeout(renderShipments, 100);
    }
    return result;
};
const originalCloseModal = closeModal;
closeModal = function(id) {
    originalCloseModal(id);
    if (id === 'seaDsrModal' || id === 'airDsrModal') {
        const dsrPanel = document.getElementById('dsr');
        if (dsrPanel && dsrPanel.classList.contains('active')) {
            setTimeout(renderShipments, 200);
        }
    }
};

// ==================== BL DRAFT ====================
function openBLModal(editIdx = null, shipmentIdx = null) {
    try {
        const modal = document.getElementById('blModal');
        const title = document.getElementById('blModalTitle');
        const body = document.getElementById('blModalBody');
        if (!modal || !title || !body) {
            console.error('BL Modal elements missing');
            return alert('BL Draft modal not found – please refresh the page.');
        }
        if (!db.bldrafts) db.bldrafts = [];
        if (!db.shipments) db.shipments = [];
        if (!db.pol) db.pol = [];
        if (!db.pod) db.pod = [];
        if (!db.containers) db.containers = [];
        if (!db.carriers) db.carriers = [];
        if (!db.hiddenItems) db.hiddenItems = { pol: [], pod: [], containers: [], carriers: [] };
        if (!db.hiddenItems.pol) db.hiddenItems.pol = [];
        if (!db.hiddenItems.pod) db.hiddenItems.pod = [];
        if (!db.hiddenItems.containers) db.hiddenItems.containers = [];
        if (!db.hiddenItems.carriers) db.hiddenItems.carriers = [];
        let b = { status: 'Draft', issueDate: new Date().toISOString().split('T')[0] };
        let isEdit = false;
        if (editIdx !== null && db.bldrafts[editIdx]) {
            b = { ...db.bldrafts[editIdx] };
            isEdit = true;
            title.textContent = 'Edit BL Draft';
        } else {
            title.textContent = 'Bill of Lading Draft';
            if (shipmentIdx !== null && db.shipments[shipmentIdx]) {
                const s = db.shipments[shipmentIdx];
                b.shipmentCode = s.code || '';
                b.shipper = s.shipper || '';
                b.consignee = s.shipper || '';
                b.vessel = s.liner || '';
                b.pol = s.pol || '';
                b.pod = s.pod || '';
                b.placeOfIssue = s.pol || '';
                b.containers = [];
                if (s.containerNo) {
                    b.containers.push({ containerNo: s.containerNo, type: '', seal: '', weight: s.weight || 0, volume: 0,
                        packages: '' });
                }
            }
        }
        const ports = db.pod.filter(p => !db.hiddenItems.pod.includes(p)).sort();
        const pols = db.pol.filter(p => !db.hiddenItems.pol.includes(p)).sort();
        const containers = db.containers.filter(c => !db.hiddenItems.containers.includes(c)).sort();
        const carriers = db.carriers.filter(c => !db.hiddenItems.carriers.includes(c)).sort();
        let containerRows = '';
        (b.containers || []).forEach((c, i) => {
            containerRows += `<div class="bl-container-row" data-row="${i}">
                <input type="text" class="bl-cont-no" value="${c.containerNo||''}" placeholder="Container No." />
                <select class="bl-cont-type"><option value="">Type</option>${containers.map(t => `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('')}</select>
                <input type="text" class="bl-cont-seal" value="${c.seal||''}" placeholder="Seal" />
                <input type="number" class="bl-cont-weight" value="${c.weight||''}" placeholder="Weight (KGS)" />
                <input type="number" class="bl-cont-volume" value="${c.volume||''}" placeholder="Volume (CBM)" />
                <input type="text" class="bl-cont-packages" value="${c.packages||''}" placeholder="Packages" />
                <button class="btn btn-sm btn-clear" onclick="this.closest('.bl-container-row').remove(); updateBLTotals();">×</button>
            </div>`;
        });
        body.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
                <div class="form-group"><label>BL Number</label><input type="text" id="bl-number" value="${b.blNumber || 'BL-'+Date.now().toString(36).toUpperCase()}" style="font-weight:bold;font-size:1.1rem;" /></div>
                <div class="form-group"><label>DSR Ref</label><input type="text" id="bl-shipment" value="${b.shipmentCode||''}" /></div>
                <div class="form-group"><label>Status</label><input type="text" id="bl-status" value="${b.status || 'Draft'}" readonly style="background:#f1f5f9;font-weight:bold;color:var(--primary);" /></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;background:var(--bg);padding:12px;border-radius:8px;">
                <div><h4 style="color:var(--primary);margin-bottom:6px;">Shipper</h4>
                    <div class="form-group"><label>Name</label><input type="text" id="bl-shipper" value="${b.shipper||''}" /></div>
                    <div class="form-group"><label>Address</label><input type="text" id="bl-shipper-addr" value="${b.shipperAddr||''}" /></div>
                </div>
                <div><h4 style="color:var(--primary);margin-bottom:6px;">Consignee</h4>
                    <div class="form-group"><label>Name</label><input type="text" id="bl-consignee" value="${b.consignee||''}" /></div>
                    <div class="form-group"><label>Address</label><input type="text" id="bl-consignee-addr" value="${b.consigneeAddr||''}" /></div>
                </div>
            </div>
            <div style="margin-bottom:16px;background:var(--bg);padding:12px;border-radius:8px;">
                <h4 style="color:var(--primary);margin-bottom:6px;">Notify Party</h4>
                <div class="form-group"><label>Name</label><input type="text" id="bl-notify" value="${b.notifyParty||''}" /></div>
                <div class="form-group"><label>Address</label><input type="text" id="bl-notify-addr" value="${b.notifyAddr||''}" /></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;background:var(--bg);padding:12px;border-radius:8px;">
                <div><h4 style="color:var(--primary);margin-bottom:6px;">Voyage & Routing</h4>
                    <div class="form-group"><label>Vessel / Flight</label><input type="text" id="bl-vessel" value="${b.vessel||''}" /></div>
                    <div class="form-group"><label>Voyage No.</label><input type="text" id="bl-voyage" value="${b.voyage||''}" /></div>
                    <div class="form-group"><label>Port of Loading (POL)</label><input type="text" id="bl-pol" value="${b.pol||''}" list="bl-pol-list" /></div>
                    <datalist id="bl-pol-list">${pols.map(p => `<option value="${p}">`).join('')}</datalist>
                    <div class="form-group"><label>Port of Discharge (POD)</label><input type="text" id="bl-pod" value="${b.pod||''}" list="bl-pod-list" /></div>
                    <datalist id="bl-pod-list">${ports.map(p => `<option value="${p}">`).join('')}</datalist>
                    <div class="form-group"><label>Place of Delivery</label><input type="text" id="bl-delivery" value="${b.placeOfDelivery||''}" /></div>
                </div>
            </div>
            <div style="margin-bottom:16px;background:var(--bg);padding:12px;border-radius:8px;">
                <h4 style="color:var(--primary);margin-bottom:6px;">Container & Cargo Details <button class="btn btn-sm btn-success" onclick="addBLContainerRow()">+ Add Row</button></h4>
                <div id="bl-container-rows">${containerRows}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-top:10px;">
                    <div class="form-group"><label>Marks & Numbers</label><input type="text" id="bl-marks" value="${b.marks||''}" /></div>
                    <div class="form-group"><label>Description of Goods</label><input type="text" id="bl-goods" value="${b.goodsDesc||''}" /></div>
                    <div class="form-group"><label>Total Gross Weight (KGS)</label><input type="text" id="bl-total-weight" readonly style="background:#f1f5f9;font-weight:bold;" /></div>
                    <div class="form-group"><label>Total Measurement (CBM)</label><input type="text" id="bl-total-volume" readonly style="background:#f1f5f9;font-weight:bold;" /></div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;background:var(--bg);padding:12px;border-radius:8px;">
                <div><h4 style="color:var(--primary);margin-bottom:6px;">Freight & Charges</h4>
                    <div class="form-group"><label>Freight Terms</label><select id="bl-freight"><option value="Prepaid" ${b.freightType==='Prepaid'?'selected':''}>Prepaid</option><option value="Collect" ${b.freightType==='Collect'?'selected':''}>Collect</option></select></div>
                    <div class="form-group"><label>Amount</label><input type="number" id="bl-freight-amt" value="${b.freightAmount||''}" /></div>
                    <div class="form-group"><label>Currency</label><select id="bl-freight-cur">${getCurrencyOptions(b.freightCurrency||'INR')}</select></div>
                </div>
                <div><h4 style="color:var(--primary);margin-bottom:6px;">Issuance Details</h4>
                    <div class="form-group"><label>No. of Original B/L</label><select id="bl-originals"><option value="1" ${b.numOriginals===1?'selected':''}>1</option><option value="2" ${b.numOriginals===2?'selected':''}>2</option><option value="3" ${b.numOriginals===3?'selected':''}>3</option></select></div>
                    <div class="form-group"><label>Place of Issue</label><input type="text" id="bl-place" value="${b.placeOfIssue||''}" /></div>
                    <div class="form-group"><label>Issue Date</label><input type="date" id="bl-issue-date" value="${b.issueDate||''}" /></div>
                    <div class="form-group"><label>Signature (Agent)</label><input type="text" id="bl-signature" value="${b.signature||''}" /></div>
                </div>
            </div>
            <div style="margin-top:16px;text-align:right;display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-clear" onclick="closeModal('blModal')">Cancel</button>
                <button class="btn btn-success" onclick="saveBLDraft(${editIdx !== null ? editIdx : 'null'})">💾 Save Draft</button>
                ${isEdit ? `<button class="btn btn-quoted" onclick="finalizeBLDraft(${editIdx})">✅ Finalize</button>` : ''}
            </div>
        `;
        openModal('blModal');
        setTimeout(updateBLTotals, 200);
    } catch (e) {
        console.error('Error opening BL modal:', e);
        alert('Failed to open BL Draft. Please check the console for details.');
    }
}

// ==================== DATABASE RENDER ====================
function renderDatabase() {
    document.getElementById('company-name').value = db.companyName || '';
    document.getElementById('company-address').value = db.companyAddress || '';
    document.getElementById('current-company-name').textContent = db.companyName || 'Not Set';
    document.getElementById('default-user-input').value = db.defaultUser || '';
    document.getElementById('current-default-user').textContent = db.defaultUser || 'Not Set';
    renderExchangeRates();
    switchMasterTab(currentMasterTab);
    renderUserTable();
    const d = db.defaults || {};

    document.getElementById('def-gst').value = d.gst || 0;
    document.getElementById('def-insurance').value = d.insurance || 0;
    document.getElementById('def-profit').value = d.profitMargin || 0;
    document.getElementById('def-us-duty').value = d.usDuty || 0;
    document.getElementById('def-us-tariff').value = d.usTariff || 0;
    document.getElementById('def-us-mpf').value = d.usMPF || 0;
    document.getElementById('def-us-hmf').value = d.usHMF || 0;
    document.getElementById('def-in-duty').value = d.inDuty || 0;
    document.getElementById('def-in-social').value = d.inSocialWelfare || 0;
    document.getElementById('def-drawback').value = d.drawback || 0;
    document.getElementById('def-rodtep').value = d.rodtep || 0;

    const curSelect = document.getElementById('def-currency');
    if (curSelect) {
        curSelect.innerHTML = Object.keys(db.exchangeRates).map(c =>
            `<option value="${c}" ${c === (d.defaultCurrency || 'USD') ? 'selected' : ''}>${c}</option>`
        ).join('');
    }
}

// ==================== MASTER DATA ====================
function switchMasterTab(tab) {
    currentMasterTab = tab;
    document.querySelectorAll('.master-tab').forEach(t => t.classList.toggle('active', t.dataset.master === tab));
    renderMasterData();
}
function renderMasterData() {
    const list = document.getElementById('master-list');
    const pagination = document.getElementById('master-pagination');
    let data = [];
    if (currentMasterTab === 'carriers') data = db.carriers || [];
    else if (currentMasterTab === 'pol') data = db.pol || [];
    else if (currentMasterTab === 'pod') data = db.pod || [];
    else if (currentMasterTab === 'incoterms') data = db.incoterms || [];
    else if (currentMasterTab === 'containers') data = db.containers || [];
    else if (currentMasterTab === 'cargostatus') data = db.cargoStatusMaster || [];
    else if (currentMasterTab === 'docsstatus') data = db.docsStatusMaster || [];
    const hidden = db.hiddenItems[currentMasterTab] || [];
    let filteredData = data.map((item, idx) => ({ item, idx }));
    if (masterShowMode === 'visible') filteredData = filteredData.filter(({ item }) => !hidden.includes(item));
    else if (masterShowMode === 'hidden') filteredData = filteredData.filter(({ item }) => hidden.includes(item));
    if (masterSearch) {
        const searchLower = masterSearch.toLowerCase();
        filteredData = filteredData.filter(({ item }) => item.toLowerCase().includes(searchLower));
    }
    if (masterSort === 'alpha-asc') filteredData.sort((a, b) => a.item.localeCompare(b.item));
    else if (masterSort === 'alpha-desc') filteredData.sort((a, b) => b.item.localeCompare(a.item));
    const perPage = parseInt(masterPerPage) || 20;
    const totalPages = Math.ceil(filteredData.length / perPage) || 1;
    if (masterPage > totalPages) masterPage = totalPages;
    if (masterPage < 1) masterPage = 1;
    const start = (masterPage - 1) * perPage;
    const pageData = filteredData.slice(start, start + perPage);
    if (pageData.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-light);">No items found.</p>';
        pagination.innerHTML = '';
        return;
    }
    list.innerHTML = pageData.map(({ item, idx: originalIdx }) => {
        const isHidden = hidden.includes(item);
        const hiddenClass = isHidden ? 'hidden-item' : '';
        return `<div class="master-item ${hiddenClass}">
            <span>${item}</span>
            <div class="master-item-actions">
                <button class="btn btn-sm btn-preview" onclick="editMasterItem('${currentMasterTab}',${originalIdx})">✏️</button>
                <button class="btn btn-sm btn-warning" onclick="toggleHiddenMasterItem('${currentMasterTab}',${originalIdx})">${isHidden ? '👁 Show' : '🙈 Hide'}</button>
                <button class="btn btn-sm btn-clear" onclick="deleteMasterItem('${currentMasterTab}',${originalIdx})">×</button>
            </div>
        </div>`;
    }).join('');
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    let pagHtml = `<button class="page-btn" onclick="changeMasterPage(${masterPage - 1})" ${masterPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
    pagHtml += `<span class="page-info">Page ${masterPage} of ${totalPages}</span>`;
    pagHtml += `<button class="page-btn" onclick="changeMasterPage(${masterPage + 1})" ${masterPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
    pagination.innerHTML = pagHtml;
}
function changeMasterPage(page) {
    const data = currentMasterTab === 'carriers' ? db.carriers :
        currentMasterTab === 'pol' ? db.pol :
        currentMasterTab === 'pod' ? db.pod :
        currentMasterTab === 'incoterms' ? db.incoterms :
        currentMasterTab === 'containers' ? db.containers :
        currentMasterTab === 'cargostatus' ? db.cargoStatusMaster :
        currentMasterTab === 'docsstatus' ? db.docsStatusMaster :
        db.carriers;
    const hidden = db.hiddenItems[currentMasterTab] || [];
    let filteredData = data.map((item, idx) => ({ item, idx }));
    if (masterShowMode === 'visible') filteredData = filteredData.filter(({ item }) => !hidden.includes(item));
    else if (masterShowMode === 'hidden') filteredData = filteredData.filter(({ item }) => hidden.includes(item));
    if (masterSearch) filteredData = filteredData.filter(({ item }) => item.toLowerCase().includes(masterSearch.toLowerCase()));
    const perPage = parseInt(masterPerPage) || 20;
    const totalPages = Math.ceil(filteredData.length / perPage) || 1;
    if (page < 1 || page > totalPages) return;
    masterPage = page;
    renderMasterData();
}
function addMasterItem() {
    const input = document.getElementById('new-master-item');
    const val = input.value.trim();
    if (!val) return alert('Enter a value');
    const listKey = currentMasterTab === 'carriers' ? 'carriers' :
        currentMasterTab === 'pol' ? 'pol' :
        currentMasterTab === 'pod' ? 'pod' :
        currentMasterTab === 'incoterms' ? 'incoterms' :
        currentMasterTab === 'containers' ? 'containers' :
        currentMasterTab === 'cargostatus' ? 'cargoStatusMaster' :
        currentMasterTab === 'docsstatus' ? 'docsStatusMaster' :
        'carriers';
    if (db[listKey].includes(val)) return alert('Item already exists');
    db[listKey].push(val);
    saveDB();
    input.value = '';
    renderMasterData();
    populateDropdowns();
    autoBackup();
}
function addMultipleMasterItems() {
    const textarea = document.getElementById('new-master-items');
    const items = textarea.value.split(/\n/).map(s => s.trim().toUpperCase()).filter(s => s);
    if (!items.length) return alert('Enter at least one item');
    const listKey = currentMasterTab === 'carriers' ? 'carriers' :
        currentMasterTab === 'pol' ? 'pol' :
        currentMasterTab === 'pod' ? 'pod' :
        currentMasterTab === 'incoterms' ? 'incoterms' :
        currentMasterTab === 'containers' ? 'containers' :
        currentMasterTab === 'cargostatus' ? 'cargoStatusMaster' :
        currentMasterTab === 'docsstatus' ? 'docsStatusMaster' :
        'carriers';
    let added = 0;
    items.forEach(item => {
        if (!db[listKey].includes(item)) {
            db[listKey].push(item);
            added++;
        }
    });
    saveDB();
    textarea.value = '';
    renderMasterData();
    populateDropdowns();
    alert(`Added ${added} items`);
    autoBackup();
}
function editMasterItem(tab, originalIdx) {
    const listKey = tab === 'carriers' ? 'carriers' :
        tab === 'pol' ? 'pol' :
        tab === 'pod' ? 'pod' :
        tab === 'incoterms' ? 'incoterms' :
        tab === 'containers' ? 'containers' :
        tab === 'cargostatus' ? 'cargoStatusMaster' :
        tab === 'docsstatus' ? 'docsStatusMaster' :
        'carriers';
    const data = db[listKey];
    const item = data[originalIdx];
    if (!item) return alert('Item not found');
    const newVal = prompt('Edit item:', item);
    if (newVal && newVal.trim() !== item) {
        data[originalIdx] = newVal.trim();
        saveDB();
        renderMasterData();
        populateDropdowns();
        autoBackup();
    }
}
function toggleHiddenMasterItem(tab, originalIdx) {
    const listKey = tab === 'carriers' ? 'carriers' :
        tab === 'pol' ? 'pol' :
        tab === 'pod' ? 'pod' :
        tab === 'incoterms' ? 'incoterms' :
        tab === 'containers' ? 'containers' :
        tab === 'cargostatus' ? 'cargoStatusMaster' :
        tab === 'docsstatus' ? 'docsStatusMaster' :
        'carriers';
    const data = db[listKey];
    const item = data[originalIdx];
    if (!item) return;
    const hidden = db.hiddenItems[tab] || [];
    if (hidden.includes(item)) {
        db.hiddenItems[tab] = hidden.filter(h => h !== item);
    } else {
        db.hiddenItems[tab].push(item);
    }
    saveDB();
    renderMasterData();
    populateDropdowns();
    autoBackup();
}
function deleteMasterItem(tab, originalIdx) {
    const listKey = tab === 'carriers' ? 'carriers' :
        tab === 'pol' ? 'pol' :
        tab === 'pod' ? 'pod' :
        tab === 'incoterms' ? 'incoterms' :
        tab === 'containers' ? 'containers' :
        tab === 'cargostatus' ? 'cargoStatusMaster' :
        tab === 'docsstatus' ? 'docsStatusMaster' :
        'carriers';
    const data = db[listKey];
    const item = data[originalIdx];
    if (!item) return alert('Item not found');
    if (confirm(`Delete "${item}"?`)) {
        data.splice(originalIdx, 1);
        const hidden = db.hiddenItems[tab] || [];
        if (hidden.includes(item)) {
            db.hiddenItems[tab] = hidden.filter(h => h !== item);
        }
        saveDB();
        renderMasterData();
        populateDropdowns();
        autoBackup();
    }
}

// ==================== EXCHANGE RATES ====================
function renderExchangeRates() {
    const table = document.getElementById('exchange-table');
    if (!table) return;
    table.innerHTML = `
        <thead><tr><th>Currency</th><th>Rate (1 INR = ?)</th><th>Action</th></tr></thead>
        <tbody>
            ${Object.entries(db.exchangeRates).map(([cur, rate]) => `
                <tr>
                    <td><strong>${cur}</strong></td>
                    <td><input type="number" step="0.0001" value="${rate}" onchange="updateExchangeRate('${cur}', this.value)" style="width:120px;padding:4px;border:1px solid var(--border);border-radius:3px;" onfocus="highlightInput(this)" onblur="unhighlightInput(this)"></td>
                    <td><button class="btn btn-sm btn-clear" onclick="deleteExchangeRate('${cur}')">×</button></td>
                </tr>
            `).join('')}
        </tbody>
    `;
}
function updateExchangeRate(currency, rate) {
    const val = parseFloat(rate);
    if (!isNaN(val) && val > 0) {
        db.exchangeRates[currency] = val;
        saveDB();
        ['sea', 'air', 'lcl'].forEach(m => {
            if (document.getElementById(m).classList.contains('active')) {
                recalcTotal(m);
            }
        });
        autoBackup();
    }
}
function addExchangeRate() {
    const cur = document.getElementById('new-currency').value.trim().toUpperCase();
    const rate = parseFloat(document.getElementById('new-rate').value);
    if (!cur || isNaN(rate) || rate <= 0) return alert('Enter valid currency and rate');
    if (db.exchangeRates[cur]) return alert('Currency already exists');
    db.exchangeRates[cur] = rate;
    saveDB();
    document.getElementById('new-currency').value = '';
    document.getElementById('new-rate').value = '';
    renderExchangeRates();
    autoBackup();
}
function deleteExchangeRate(currency) {
    if (currency === 'INR') return alert('Cannot delete INR');
    if (confirm(`Delete exchange rate for ${currency}?`)) {
        delete db.exchangeRates[currency];
        saveDB();
        renderExchangeRates();
        autoBackup();
    }
}

// ==================== COMPANY INFO ====================
function saveCompanyInfo() {
    const name = document.getElementById('company-name').value.trim();
    const address = document.getElementById('company-address').value.trim();
    if (!name) return alert('Company name is required');
    db.companyName = name;
    db.companyAddress = address;
    saveDB();
    document.getElementById('current-company-name').textContent = name;
    alert('Company info saved!');
    autoBackup();
}
function saveDefaultUser() {
    const user = document.getElementById('default-user-input').value.trim();
    if (!user) return alert('User name is required');
    db.defaultUser = user;
    saveDB();
    document.getElementById('current-default-user').textContent = user;
    alert('Default user saved!');
    autoBackup();
}

// ==================== POPULATE DROPDOWNS ====================
function populateDropdowns() {
    if (!db.carriers) db.carriers = [];
    if (!db.pol) db.pol = [];
    if (!db.pod) db.pod = [];
    if (!db.incoterms) db.incoterms = [];
    if (!db.containers) db.containers = [];
    if (!db.exchangeRates) db.exchangeRates = { USD: 94.50, INR: 1 };
    const hiddenCarriers = db.hiddenItems?.carriers || [];
    const hiddenPol = db.hiddenItems?.pol || [];
    const hiddenPod = db.hiddenItems?.pod || [];
    const hiddenIncoterms = db.hiddenItems?.incoterms || [];
    const hiddenContainers = db.hiddenItems?.containers || [];
    const visibleCarriers = ['ALL', ...db.carriers.filter(c => !hiddenCarriers.includes(c))];
    const visiblePol = db.pol.filter(p => !hiddenPol.includes(p));
    const visiblePod = db.pod.filter(p => !hiddenPod.includes(p));
    const visibleIncoterms = db.incoterms.filter(i => !hiddenIncoterms.includes(i));
    const visibleContainers = db.containers.filter(c => !hiddenContainers.includes(c));
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
    populateSelect('cc-sealcl-filter-mode', ['', 'sea', 'lcl']);
    populateSelect('cc-sealcl-filter-carrier', visibleCarriers);
    populateSelect('cc-air-filter-carrier', visibleCarriers);
    populateSelect('cc-lcl-filter-carrier', visibleCarriers);
}
function populateSelect(id, options) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    options = options || [];
    sel.innerHTML = '<option value="">Select</option>' + options.map(o => `<option value="${o}">${o}</option>`).join('');
    if (cur && options.includes(cur)) sel.value = cur;
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
    const filtered = records.map((rec, originalIdx) => ({ rec, originalIdx }))
        .filter(({ rec }) => {
            let text = '';
            if (mode === 'sea') text = `${rec.carrier} ${rec.pol} ${rec.container}`.toLowerCase();
            else text = `${rec.pol}`.toLowerCase();
            if (search && !text.includes(search)) return false;
            if (mode === 'sea' && filterCarrier && rec.carrier !== filterCarrier) return false;
            if (filterPol && rec.pol !== filterPol) return false;
            return true;
        });
    const disp = document.getElementById(`dc-${mode}-master-table`);
    let html = `<table class="master-table"><thead><tr>`;
    if (mode === 'sea') html += `<th>Carrier</th>`;
    html += `<th>POL</th>`;
    if (mode === 'sea') html += `<th>Container</th>`;
    html += `<th>Commodity / Cargo</th>`;
    html += `<th>Action</th></tr></thead><tbody>`;
    if (filtered.length === 0) {
        const cols = (mode === 'sea' ? 4 : 3);
        html += `<tr><td colspan="${cols}" style="text-align:center;padding:16px;color:var(--text-light);">No records.</td></tr>`;
    } else {
        filtered.forEach(({ rec, originalIdx }) => {
            html += `<tr>`;
            if (mode === 'sea') html += `<td><strong>${rec.carrier}</strong></td>`;
            html += `<td>${rec.pol}</td>`;
            if (mode === 'sea') html += `<td>${rec.container}</td>`;
            html += `<td>${rec.commodity || '—'}</td>`;
            html += `<td>
                <button class="btn btn-sm btn-preview" onclick="previewDefaultCharge('${mode}',${originalIdx})">👁</button>
                <button class="btn btn-sm btn-preview" onclick="openEditDefaultChargeModal('${mode}',${originalIdx})">✏️</button>
                <button class="btn btn-sm btn-duplicate" onclick="duplicateDefaultCharge('${mode}',${originalIdx})">📋</button>
                <button class="btn btn-sm btn-clear" onclick="deleteDefaultChargeEntry('${mode}',${originalIdx})">×</button>
            </td></tr>`;
        });
    }
    html += '</tbody></table>';
    disp.innerHTML = html;
}

// ==================== CARRIER CHARGES MASTER ====================
function renderCarrierChargesMaster(type) {
    const search = (document.getElementById(`cc-${type}-search`)?.value || '').toLowerCase();
    const filterMode = type === 'sealcl' ? (document.getElementById('cc-sealcl-filter-mode')?.value || '') : '';
    let records = type === 'sealcl' ? db.carrierChargesSeaLcl : db.carrierChargesAir;
    const filtered = records.map((rec, originalIdx) => ({ rec, originalIdx }))
        .filter(({ rec }) => {
            const text = `${rec.mode||''} ${rec.carrier} ${rec.pol} ${rec.container||''}`.toLowerCase();
            if (search && !text.includes(search)) return false;
            if (type === 'sealcl' && filterMode && rec.mode !== filterMode) return false;
            return true;
        });
    const disp = document.getElementById(`cc-${type}-master-table`);
    let html = `<table class="master-table"><thead><tr>`;
    if (type === 'sealcl') html += `<th>Mode</th>`;
    html += `<th>Carrier</th><th>POL</th>`;
    if (type === 'sealcl') html += `<th>Container</th>`;
    html += `<th>Commodity</th>`;
    html += `<th>Charges</th><th>Updated</th><th>Action</th></tr></thead><tbody>`;
    if (filtered.length === 0) {
        const cols = type === 'sealcl' ? 8 : 6;
        html += `<tr><td colspan="${cols}" style="text-align:center;padding:16px;color:var(--text-light);">No records.</td></tr>`;
    } else {
        filtered.forEach(({ rec, originalIdx }) => {
            const chargeCount = Object.keys(rec.charges || {}).length;
            const updated = rec.updated ? new Date(rec.updated).toLocaleDateString('en-IN') : '—';
            html += `<tr>`;
            if (type === 'sealcl') html += `<td><strong style="color:var(--primary);">${(rec.mode||'').toUpperCase()}</strong></td>`;
            html += `<td>${rec.carrier}</td><td>${rec.pol}</td>`;
            if (type === 'sealcl') html += `<td>${rec.container || '—'}</td>`;
            html += `<td>${rec.commodity || '—'}</td>`;
            html += `<td style="text-align:center;"><strong>${chargeCount}</strong></td><td>${updated}</td>
            <td>
                <button class="btn btn-sm btn-preview" onclick="previewCarrierCharge('${type}',${originalIdx})">👁</button>
                <button class="btn btn-sm btn-preview" onclick="openEditCarrierChargeModal('${type}',${originalIdx})">✏️</button>
                <button class="btn btn-sm btn-duplicate" onclick="duplicateCarrierCharge('${type}',${originalIdx})">📋</button>
                <button class="btn btn-sm btn-clear" onclick="deleteCarrierChargeEntry('${type}',${originalIdx})">×</button>
            </td></tr>`;
        });
    }
    html += '</tbody></table>';
    disp.innerHTML = html;
}

// ==================== ADD/EDIT DEFAULT CHARGES ====================
function openEditDefaultChargeModal(mode, idx) {
    let rec;
    if (mode === 'sea') rec = db.defaultSeaCharges[idx];
    else if (mode === 'air') rec = db.defaultAirCharges[idx];
    else rec = db.defaultLclCharges[idx];
    if (!rec) return alert('Record not found');
    let html = `<h3 style="color:var(--primary);margin-bottom:12px;">Edit Default ${mode.toUpperCase()} Charge</h3>`;
    if (mode === 'sea') {
        html += `<div class="form-grid-2col">
            <div class="form-group"><label>Carrier</label><select id="modal-dc-carrier-edit"><option value="ALL" ${rec.carrier==='ALL'?'selected':''}>ALL</option>${db.carriers.map(c => `<option value="${c}" ${rec.carrier===c?'selected':''}>${c}</option>`).join('')}</select></div>
            <div class="form-group"><label>POL</label><select id="modal-dc-pol-edit"><option value="">Select</option>${db.pol.map(p => `<option value="${p}" ${rec.pol===p?'selected':''}>${p}</option>`).join('')}</select></div>
            <div class="form-group"><label>Container</label><select id="modal-dc-container-edit"><option value="">Select</option>${db.containers.map(c => `<option value="${c}" ${rec.container===c?'selected':''}>${c}</option>`).join('')}</select></div>
            <div class="form-group"><label>Commodity</label><select id="modal-dc-commodity-edit"><option value="">Select</option><option value="NON HAZ" ${rec.commodity==='NON HAZ'?'selected':''}>Non Haz</option><option value="HAZ" ${rec.commodity==='HAZ'?'selected':''}>Haz</option></select></div>
        </div>`;
    } else {
        html += `<div class="form-grid-2col">
            <div class="form-group"><label>POL</label><select id="modal-dc-pol-edit"><option value="">Select</option>${db.pol.map(p => `<option value="${p}" ${rec.pol===p?'selected':''}>${p}</option>`).join('')}</select></div>
            <div class="form-group"><label>Commodity</label><select id="modal-dc-commodity-edit"><option value="">Select</option><option value="NON HAZ" ${rec.commodity==='NON HAZ'?'selected':''}>Non Haz</option><option value="HAZ" ${rec.commodity==='HAZ'?'selected':''}>Haz</option></select></div>
        </div>`;
    }
    html += `<h4 style="color:var(--primary);margin:12px 0 8px;">Charges</h4><div id="modal-dc-charges-list">`;
    const charges = rec.charges || {};
    Object.entries(charges).forEach(([key, val]) => {
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
        <div class="form-group" style="flex:1;"><label>Add Charge</label><select id="modal-dc-add-charge">${getDefaultChargeTypes(mode).map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
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
    if (!rec) return alert('Record not found');
    let updatedRecord;
    if (mode === 'sea') {
        const carrier = document.getElementById('modal-dc-carrier-edit').value.trim() || 'ALL';
        const pol = document.getElementById('modal-dc-pol-edit').value;
        const container = document.getElementById('modal-dc-container-edit').value;
        const commodity = document.getElementById('modal-dc-commodity-edit').value;
        if (!pol) return alert('POL is required');
        if (!container) return alert('Container is required');
        updatedRecord = { carrier, pol, container, commodity };
    } else {
        const pol = document.getElementById('modal-dc-pol-edit').value;
        const commodity = document.getElementById('modal-dc-commodity-edit').value;
        if (!pol) return alert('POL is required');
        updatedRecord = { pol, commodity };
    }
    if (findDefaultChargeDuplicate(mode, updatedRecord, idx)) {
        return alert('Duplicate entry!');
    }
    if (mode === 'sea') {
        rec.carrier = updatedRecord.carrier;
        rec.container = updatedRecord.container;
        rec.commodity = updatedRecord.commodity;
    }
    rec.pol = updatedRecord.pol;
    rec.commodity = updatedRecord.commodity || '';
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
    autoBackup();
}
function openAddDefaultChargeModal(mode) {
    let html = `<h3 style="color:var(--primary);margin-bottom:12px;">Add Default ${mode.toUpperCase()} Charge</h3>`;
    if (mode === 'sea') {
        html += `<div class="form-grid-2col">
            <div class="form-group"><label>Carrier</label><select id="modal-dc-carrier"><option value="ALL">ALL</option>${db.carriers.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
            <div class="form-group"><label>POL</label><select id="modal-dc-pol">${db.pol.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div>
            <div class="form-group"><label>Container</label><select id="modal-dc-container">${db.containers.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
            <div class="form-group"><label>Commodity</label><select id="modal-dc-commodity"><option value="">Select</option><option value="NON HAZ">Non Haz</option><option value="HAZ">Haz</option></select></div>
        </div>`;
    } else {
        html += `<div class="form-grid-2col">
            <div class="form-group"><label>POL</label><select id="modal-dc-pol">${db.pol.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div>
            <div class="form-group"><label>Commodity</label><select id="modal-dc-commodity"><option value="">Select</option><option value="NON HAZ">Non Haz</option><option value="HAZ">Haz</option></select></div>
        </div>`;
    }
    html += `<h4 style="color:var(--primary);margin:12px 0 8px;">Add Charges</h4>
    <div id="modal-dc-charges-list"></div>
    <div style="margin-top:8px;display:flex;gap:8px;align-items:end;">
        <div class="form-group" style="flex:1;"><label>Charge Type</label><select id="modal-dc-add-charge">${getDefaultChargeTypes(mode).map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
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
    if (list.querySelector(`[data-charge-key="${key}"]`)) {
        alert('Charge already added!');
        return;
    }
    const existingKeys = list.querySelectorAll('[data-charge-key]');
    for (let el of existingKeys) {
        if (el.getAttribute('data-charge-key') === key) {
            alert('Charge already exists!');
            return;
        }
    }
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
    const pol = document.getElementById('modal-dc-pol').value.trim();
    if (!pol) return alert('POL is required');
    const commodity = document.getElementById('modal-dc-commodity').value;
    const charges = {};
    document.querySelectorAll('#modal-dc-charges-list [data-charge-key]').forEach(row => {
        const key = row.getAttribute('data-charge-key');
        const amt = parseFloat(row.querySelector('.modal-chg-amt').value) || 0;
        const cur = row.querySelector('.modal-chg-cur').value;
        if (amt > 0) charges[key] = { amount: amt, currency: cur };
    });
    let record;
    if (mode === 'sea') {
        const carrier = document.getElementById('modal-dc-carrier').value.trim() || 'ALL';
        const container = document.getElementById('modal-dc-container').value.trim();
        if (!container) return alert('Container is required');
        record = { carrier, pol, container, commodity, charges };
        if (findDefaultChargeDuplicate(mode, record)) return alert('Duplicate entry!');
        db.defaultSeaCharges.push(record);
    } else if (mode === 'air') {
        record = { pol, commodity, charges };
        if (findDefaultChargeDuplicate(mode, record)) return alert('Duplicate entry!');
        db.defaultAirCharges.push(record);
    } else if (mode === 'lcl') {
        record = { pol, commodity, charges };
        if (findDefaultChargeDuplicate(mode, record)) return alert('Duplicate entry!');
        db.defaultLclCharges.push(record);
    }
    saveDB();
    closeModal('previewModal');
    renderDefaultChargesMaster(mode);
    alert('Added!');
    autoBackup();
}

// ==================== CARRIER CHARGE EDIT ====================
function openEditCarrierChargeModal(type, idx) {
    const rec = type === 'sealcl' ? db.carrierChargesSeaLcl[idx] : db.carrierChargesAir[idx];
    if (!rec) return alert('Record not found');
    const mode = type === 'sealcl' ? (rec.mode || 'sea') : 'air';
    const modeCharges = getDefaultChargeTypes(mode);
    let html = `<h3 style="color:var(--primary);margin-bottom:12px;">Edit Carrier-Wise Charge</h3><div class="form-grid-2col">`;
    if (type === 'sealcl') html += `<div class="form-group"><label>Mode</label><select id="modal-cc-mode-edit"><option value="sea" ${rec.mode==='sea'?'selected':''}>SEA</option><option value="lcl" ${rec.mode==='lcl'?'selected':''}>LCL</option></select></div>`;
    html += `<div class="form-group"><label>Carrier</label><select id="modal-cc-carrier-edit"><option value="">Select</option>${db.carriers.map(c => `<option value="${c}" ${rec.carrier===c?'selected':''}>${c}</option>`).join('')}</select></div>`;
    html += `<div class="form-group"><label>POL</label><select id="modal-cc-pol-edit"><option value="">Select</option>${db.pol.map(p => `<option value="${p}" ${rec.pol===p?'selected':''}>${p}</option>`).join('')}</select></div>`;
    if (type === 'sealcl') html += `<div class="form-group"><label>Container</label><select id="modal-cc-container-edit"><option value="">Select</option>${db.containers.map(c => `<option value="${c}" ${rec.container===c?'selected':''}>${c}</option>`).join('')}</select></div>`;
    html += `<div class="form-group"><label>Commodity</label><select id="modal-cc-commodity-edit"><option value="">Select</option><option value="NON HAZ" ${rec.commodity==='NON HAZ'?'selected':''}>Non Haz</option><option value="HAZ" ${rec.commodity==='HAZ'?'selected':''}>Haz</option></select></div>`;
    html += `</div><h4 style="color:var(--primary);margin:12px 0 8px;">Charges (Sell & Buy)</h4><div id="modal-cc-charges-list">`;
    const charges = rec.charges || {};
    Object.entries(charges).forEach(([key, val]) => {
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
    if (list.querySelector(`[data-charge-key="${key}"]`)) {
        alert('Charge already added!');
        return;
    }
    const existingKeys = list.querySelectorAll('[data-charge-key]');
    for (let el of existingKeys) {
        if (el.getAttribute('data-charge-key') === key) {
            alert('Charge already exists!');
            return;
        }
    }
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
    if (!rec) return alert('Record not found');
    let updatedRecord;
    if (type === 'sealcl') {
        const mode = document.getElementById('modal-cc-mode-edit').value;
        const carrier = document.getElementById('modal-cc-carrier-edit').value;
        const pol = document.getElementById('modal-cc-pol-edit').value;
        const container = document.getElementById('modal-cc-container-edit').value || '';
        const commodity = document.getElementById('modal-cc-commodity-edit').value;
        if (!carrier || !pol) return alert('Carrier and POL are required');
        updatedRecord = { mode, carrier, pol, container, commodity };
    } else {
        const carrier = document.getElementById('modal-cc-carrier-edit').value;
        const pol = document.getElementById('modal-cc-pol-edit').value;
        const commodity = document.getElementById('modal-cc-commodity-edit').value;
        if (!carrier || !pol) return alert('Carrier and POL are required');
        updatedRecord = { carrier, pol, commodity };
    }
    if (findCarrierChargeDuplicate(type, updatedRecord, idx)) {
        return alert('Duplicate entry!');
    }
    if (type === 'sealcl') {
        rec.mode = updatedRecord.mode;
        rec.container = updatedRecord.container;
        rec.commodity = updatedRecord.commodity;
    }
    rec.carrier = updatedRecord.carrier;
    rec.pol = updatedRecord.pol;
    rec.commodity = updatedRecord.commodity || '';
    rec.updated = new Date().toISOString();
    rec.charges = {};
    document.querySelectorAll('#modal-cc-charges-list [data-charge-key]').forEach(row => {
        const key = row.getAttribute('data-charge-key');
        const sellAmt = parseFloat(row.querySelector('.modal-cc-sell-amt').value) || 0;
        const sellCur = row.querySelector('.modal-cc-sell-cur').value;
        const buyAmt = parseFloat(row.querySelector('.modal-cc-buy-amt').value) || 0;
        const buyCur = row.querySelector('.modal-cc-buy-cur').value;
        if (sellAmt > 0 || buyAmt > 0) {
            rec.charges[key] = { amount: sellAmt, currency: sellCur, buyAmount: buyAmt, buyCurrency: buyCur };
        }
    });
    saveDB();
    closeModal('previewModal');
    renderCarrierChargesMaster(type);
    alert('Saved!');
    autoBackup();
}
function openAddCarrierChargeModal(type) {
    const mode = type === 'sealcl' ? 'sea' : 'air';
    const modeCharges = getDefaultChargeTypes(mode);
    let html = `<h3 style="color:var(--primary);margin-bottom:12px;">Add Carrier-Wise Charge</h3><div class="form-grid-2col">`;
    if (type === 'sealcl') html += `<div class="form-group"><label>Mode</label><select id="modal-cc-mode"><option value="sea">SEA</option><option value="lcl">LCL</option></select></div>`;
    html += `<div class="form-group"><label>Carrier</label><select id="modal-cc-carrier"><option value="">Select</option>${db.carriers.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>`;
    html += `<div class="form-group"><label>POL</label><select id="modal-cc-pol"><option value="">Select</option>${db.pol.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div>`;
    if (type === 'sealcl') html += `<div class="form-group"><label>Container</label><select id="modal-cc-container"><option value="">Select</option>${db.containers.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>`;
    html += `<div class="form-group"><label>Commodity</label><select id="modal-cc-commodity"><option value="">Select</option><option value="NON HAZ">Non Haz</option><option value="HAZ">Haz</option></select></div>`;
    html += `</div><h4 style="color:var(--primary);margin:12px 0 8px;">Add Charges (Sell & Buy)</h4><div id="modal-cc-charges-list"></div>
    <div style="margin-top:8px;display:flex;gap:8px;align-items:end;">
        <div class="form-group" style="flex:1;"><label>Add Charge</label><select id="modal-cc-add-charge">${modeCharges.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
        <button class="btn btn-sm btn-success" style="height:33px;" onclick="addCCChargeToModal()">+</button>
    </div>
    <div style="margin-top:16px;text-align:right;">
        <button class="btn btn-clear" onclick="closeModal('previewModal')">Cancel</button>
        <button class="btn btn-quoted" onclick="saveNewCarrierCharge('${type}')">Save</button>
    </div>`;
    document.getElementById('modal-title').textContent = 'Add Carrier-Wise Charge';
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}
function saveNewCarrierCharge(type) {
    let record;
    if (type === 'sealcl') {
        const mode = document.getElementById('modal-cc-mode').value;
        const carrier = document.getElementById('modal-cc-carrier').value;
        const pol = document.getElementById('modal-cc-pol').value;
        const container = document.getElementById('modal-cc-container').value || '';
        const commodity = document.getElementById('modal-cc-commodity').value;
        if (!carrier || !pol) return alert('Carrier and POL are required');
        record = { mode, carrier, pol, container, commodity, charges: {}, updated: new Date().toISOString() };
        if (findCarrierChargeDuplicate(type, record)) return alert('Duplicate entry!');
        db.carrierChargesSeaLcl.push(record);
    } else {
        const carrier = document.getElementById('modal-cc-carrier').value;
        const pol = document.getElementById('modal-cc-pol').value;
        const commodity = document.getElementById('modal-cc-commodity').value;
        if (!carrier || !pol) return alert('Carrier and POL are required');
        record = { carrier, pol, commodity, charges: {}, updated: new Date().toISOString() };
        if (findCarrierChargeDuplicate(type, record)) return alert('Duplicate entry!');
        db.carrierChargesAir.push(record);
    }
    document.querySelectorAll('#modal-cc-charges-list [data-charge-key]').forEach(row => {
        const key = row.getAttribute('data-charge-key');
        const sellAmt = parseFloat(row.querySelector('.modal-cc-sell-amt').value) || 0;
        const sellCur = row.querySelector('.modal-cc-sell-cur').value;
        const buyAmt = parseFloat(row.querySelector('.modal-cc-buy-amt').value) || 0;
        const buyCur = row.querySelector('.modal-cc-buy-cur').value;
        if (sellAmt > 0 || buyAmt > 0) {
            record.charges[key] = { amount: sellAmt, currency: sellCur, buyAmount: buyAmt, buyCurrency: buyCur };
        }
    });
    saveDB();
    closeModal('previewModal');
    renderCarrierChargesMaster(type);
    alert('Added!');
    autoBackup();
}

// ==================== DELETE FUNCTIONS ====================
function deleteDefaultChargeEntry(mode, idx) {
    if (!db.defaultSeaCharges || idx < 0 || idx >= db.defaultSeaCharges.length) {
        alert('Record not found.');
        return;
    }
    showDeleteConfirm('Delete this entry?', function() {
        if (idx < db.defaultSeaCharges.length) {
            if (mode === 'sea') db.defaultSeaCharges.splice(idx, 1);
            else if (mode === 'air') db.defaultAirCharges.splice(idx, 1);
            else db.defaultLclCharges.splice(idx, 1);
            saveDB();
            renderDefaultChargesMaster(mode);
            autoBackup();
        } else {
            alert('Record no longer exists.');
        }
    });
}
function deleteCarrierChargeEntry(type, idx) {
    if (!db.carrierChargesSeaLcl || idx < 0 || idx >= db.carrierChargesSeaLcl.length) {
        alert('Record not found.');
        return;
    }
    showDeleteConfirm('Delete this entry?', function() {
        if (idx < db.carrierChargesSeaLcl.length) {
            if (type === 'sealcl') db.carrierChargesSeaLcl.splice(idx, 1);
            else db.carrierChargesAir.splice(idx, 1);
            saveDB();
            renderCarrierChargesMaster(type);
            autoBackup();
        } else {
            alert('Record no longer exists.');
        }
    });
}

// ==================== PREVIEW FUNCTIONS ====================
function previewDefaultCharge(mode, idx) {
    let rec;
    if (mode === 'sea') rec = db.defaultSeaCharges[idx];
    else if (mode === 'air') rec = db.defaultAirCharges[idx];
    else rec = db.defaultLclCharges[idx];
    if (!rec) return alert('Record not found');
    const totalSell = Object.values(rec.charges).reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalBuy = Object.values(rec.charges).reduce((sum, c) => sum + (c.buyAmount || c.amount || 0), 0);
    let html = `
        <div class="preview-card">
            <h3>📋 Default Charge Preview</h3>
            <div class="preview-grid">
                <div class="item"><span class="label">Quote Type</span><span class="value">${mode.toUpperCase()}</span></div>
                <div class="item"><span class="label">Carrier</span><span class="value">${mode === 'sea' ? rec.carrier : 'ALL'}</span></div>
                <div class="item"><span class="label">POL</span><span class="value">${rec.pol}</span></div>
                ${mode === 'sea' ? `<div class="item"><span class="label">Container</span><span class="value">${rec.container}</span></div>` : ''}
                <div class="item"><span class="label">Commodity</span><span class="value">${rec.commodity || '-'}</span></div>
                <div class="item"><span class="label">Currency</span><span class="value">${rec.currency || 'INR'}</span></div>
                <div class="item"><span class="label">Created By</span><span class="value">${rec.createdBy || db.defaultUser || 'N/A'}</span></div>
                <div class="item"><span class="label">Created Date</span><span class="value">${rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('en-IN') : '-'}</span></div>
                <div class="item"><span class="label">Last Updated</span><span class="value">${rec.updatedAt ? new Date(rec.updatedAt).toLocaleString('en-IN') : '-'}</span></div>
                <div class="item"><span class="label">Status</span><span class="value"><span class="preview-status active">Active</span></span></div>
            </div>
        </div>
        <div class="preview-card">
            <h3>💲 Charges Breakdown</h3>
            <table class="preview-charges-table">
                <thead>
                    <tr><th>#</th><th>Charge Name</th><th>Buy Amount</th><th>Sell Amount</th><th>Currency</th><th>Unit</th><th>Vendor</th><th>Remarks</th></tr>
                </thead>
                <tbody>`;
    let count = 0;
    for (const [chargeName, chargeData] of Object.entries(rec.charges)) {
        count++;
        const buyAmt = chargeData.buyAmount || chargeData.amount || 0;
        const sellAmt = chargeData.amount || 0;
        html += `<tr>
                    <td>${count}</td>
                    <td>${chargeName}</td>
                    <td>${Number(buyAmt).toFixed(2)}</td>
                    <td>${Number(sellAmt).toFixed(2)}</td>
                    <td>${chargeData.currency || rec.currency || 'INR'}</td>
                    <td>${chargeData.unit || '-'}</td>
                    <td>${chargeData.vendor || '-'}</td>
                    <td>${chargeData.remarks || '-'}</td>
                </tr>`;
    }
    html += `
                </tbody>
                <tfoot>
                    <tr class="total-row"><td colspan="2"><strong>Total Buy</strong></td><td><strong>${Number(totalBuy).toFixed(2)}</strong></td><td></td><td></td><td></td><td></td><td></td></tr>
                    <tr class="total-row"><td colspan="2"><strong>Total Sell</strong></td><td></td><td><strong>${Number(totalSell).toFixed(2)}</strong></td><td></td><td></td><td></td><td></td></tr>
                    <tr class="total-row"><td colspan="2"><strong>Total Charges</strong></td><td colspan="2"><strong>${Number(totalSell).toFixed(2)}</strong></td><td></td><td></td><td></td><td></td></tr>
                </tfoot>
            </table>
        </div>
    `;
    document.getElementById('modal-title').textContent = 'Preview Default Charge';
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}
function duplicateDefaultCharge(mode, idx) {
    let rec;
    if (mode === 'sea') rec = db.defaultSeaCharges[idx];
    else if (mode === 'air') rec = db.defaultAirCharges[idx];
    else rec = db.defaultLclCharges[idx];
    if (!rec) return alert('Record not found');
    const copy = JSON.parse(JSON.stringify(rec));
    if (mode === 'sea') {
        copy.carrier = rec.carrier + ' (Copy)';
    } else {
        copy.pol = rec.pol + ' (Copy)';
    }
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;
    if (mode === 'sea') db.defaultSeaCharges.push(copy);
    else if (mode === 'air') db.defaultAirCharges.push(copy);
    else db.defaultLclCharges.push(copy);
    saveDB();
    renderDefaultChargesMaster(mode);
    alert('Default charge duplicated successfully!');
}
function previewCarrierCharge(type, idx) {
    let rec = type === 'sealcl' ? db.carrierChargesSeaLcl[idx] : db.carrierChargesAir[idx];
    if (!rec) return alert('Record not found');
    let html = `
        <div class="preview-card">
            <h3>Carrier Charge Details</h3>
            <div class="preview-grid">
                <div class="item"><span class="label">Mode</span><span class="value">${type.toUpperCase()}</span></div>
                <div class="item"><span class="label">Carrier</span><span class="value">${rec.carrier}</span></div>
                <div class="item"><span class="label">POL</span><span class="value">${rec.pol}</span></div>
                ${type === 'sealcl' ? `<div class="item"><span class="label">Container</span><span class="value">${rec.container || '—'}</span></div>` : ''}
                <div class="item"><span class="label">Updated</span><span class="value">${rec.updated ? new Date(rec.updated).toLocaleString() : '—'}</span></div>
            </div>
        </div>
        <div class="preview-card">
            <h3>Charges</h3>
            <table class="preview-charges-table">
                <thead><tr><th>Charge Name</th><th>Sell Amount</th><th>Buy Amount</th><th>Currency</th></tr></thead>
                <tbody>`;
    for (const [k, v] of Object.entries(rec.charges)) {
        html += `<tr><td>${k}</td><td>${v.amount || '—'}</td><td>${v.buyAmount || '—'}</td><td>${v.currency || 'INR'}</td></tr>`;
    }
    html += `</tbody></table></div>`;
    document.getElementById('modal-title').textContent = 'Preview Carrier Charge';
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}
function duplicateCarrierCharge(type, idx) {
    let rec = type === 'sealcl' ? db.carrierChargesSeaLcl[idx] : db.carrierChargesAir[idx];
    if (!rec) return alert('Record not found');
    const copy = JSON.parse(JSON.stringify(rec));
    copy.carrier = rec.carrier + ' (Copy)';
    copy.updated = new Date().toISOString();
    if (type === 'sealcl') db.carrierChargesSeaLcl.push(copy);
    else db.carrierChargesAir.push(copy);
    saveDB();
    renderCarrierChargesMaster(type);
    alert('Carrier charge duplicated successfully!');
}

// ==================== HELPER FUNCTIONS ====================
function getDefaultChargeTypes(mode) {
    return defaultCharges[mode] || [];
}
function findDefaultChargeDuplicate(mode, record, excludeIndex = -1) {
    const arr = mode === 'sea' ? db.defaultSeaCharges :
        mode === 'air' ? db.defaultAirCharges :
        db.defaultLclCharges;
    return arr.some((r, i) => {
        if (i === excludeIndex) return false;
        if (mode === 'sea') {
            return r.carrier === record.carrier &&
                r.pol === record.pol &&
                r.container === record.container &&
                r.commodity === (record.commodity || '');
        } else {
            return r.pol === record.pol &&
                r.commodity === (record.commodity || '');
        }
    });
}
function findCarrierChargeDuplicate(type, record, excludeIndex = -1) {
    const arr = type === 'sealcl' ? db.carrierChargesSeaLcl : db.carrierChargesAir;
    return arr.some((r, i) => {
        if (i === excludeIndex) return false;
        if (type === 'sealcl') {
            return r.mode === record.mode && r.carrier === record.carrier &&
                r.pol === record.pol && (r.container || '') === (record.container || '');
        } else {
            return r.carrier === record.carrier && r.pol === record.pol;
        }
    });
}

// ==================== LOGIN & USER MANAGEMENT ====================
function getLoggedInUserName() {
    try {
        const userData = sessionStorage.getItem('loggedInUser');
        if (!userData) return null;
        const user = JSON.parse(userData);
        return user.name || user.id || null;
    } catch (e) {
        return null;
    }
}
function checkLogin() {
    const user = sessionStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
}
function performLogin() {
    const id = document.getElementById('login-id').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');
    if (!id || !pass) {
        errorEl.textContent = 'Please enter ID and Password.';
        errorEl.style.display = 'block';
        return;
    }
    const user = db.users.find(u => u.id === id && u.password === pass);
    if (!user) {
        errorEl.textContent = 'Invalid User ID or Password.';
        errorEl.style.display = 'block';
        return;
    }
    errorEl.style.display = 'none';
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    document.getElementById('login-overlay').classList.add('hidden');
    applyPermissions();
    init();
}
function performLogout() {
    sessionStorage.removeItem('loggedInUser');
    location.reload();
}
function applyPermissions() {
    const user = checkLogin();
    if (!user) return;
    const adminUserMgmt = document.getElementById('admin-user-management');
    if (adminUserMgmt) adminUserMgmt.style.display = user.role === 'master' ? 'block' : 'none';
    document.querySelectorAll('.tab-btn-vertical').forEach(btn => {
        const tabId = btn.dataset.tab;
        if (user.role === 'master' || user.permissions === 'all' || user.permissions.includes(tabId)) {
            btn.style.display = 'block';
            btn.disabled = false;
        } else {
            btn.style.display = 'none';
            btn.disabled = true;
        }
    });
}
function renderUserTable() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    tbody.innerHTML = db.users.map((u, idx) => {
        const permDisplay = u.role === 'master' ? 'All Access' : (u.permissions || []).join(', ');
        return `<tr>
            <td><strong>${u.id}</strong></td>
            <td>${u.name || '-'}</td>
            <td><span class="status-badge ${u.role === 'master' ? 'status-active' : 'status-expiring'}">${u.role.toUpperCase()}</span></td>
            <td style="font-size:0.7rem;">${permDisplay}</td>
            <td>
                <button class="btn btn-sm btn-preview" onclick="openEditUserModal(${idx})">✏️</button>
                ${u.id !== 'Shaikh Shahid' ? `<button class="btn btn-sm btn-clear" onclick="deleteUser(${idx})">×</button>` : ''}
            </td>
        </tr>`;
    }).join('');
}
function openAddUserModal() {
    openUserModal(null);
}
function openEditUserModal(idx) {
    const user = db.users[idx];
    if (!user) return alert('User not found.');
    openUserModal(idx, user);
}
function openUserModal(idx, userData = null) {
    const isEdit = idx !== null;
    const title = isEdit ? 'Edit User' : 'Add New User';
    const data = userData || { id: '', name: '', password: '', role: 'user', permissions: [] };
    const allTabs = ['sea', 'air', 'lcl', 'drafts', 'rates', 'ratesheet', 'dsr', 'bldraft', 'dashboard', 'measurement',
        'database', 'sealocal', 'airlocal', 'lcllocal'
    ];
    let permHtml = '<div class="perm-grid">';
    allTabs.forEach(tab => {
        const checked = data.role === 'master' || (data.permissions && data.permissions.includes(tab)) ? 'checked' : '';
        const disabled = data.role === 'master' ? 'disabled' : '';
        permHtml += `<label class="${data.role === 'master' ? 'disabled' : ''}">
            <input type="checkbox" class="user-perm-cb" value="${tab}" ${checked} ${disabled}>
            ${tab.charAt(0).toUpperCase() + tab.slice(1)}
        </label>`;
    });
    permHtml += '</div>';
    const html = `
        <h3 style="color:var(--primary);margin-bottom:12px;">${title}</h3>
        <div class="form-grid-2col">
            <div class="form-group"><label>User ID *</label><input type="text" id="modal-user-id" value="${data.id}" ${isEdit ? 'readonly' : ''}></div>
            <div class="form-group"><label>Full Name</label><input type="text" id="modal-user-name" value="${data.name || ''}"></div>
            <div class="form-group"><label>Password *</label><input type="text" id="modal-user-pass" value="${data.password || ''}" placeholder="Set password"></div>
            <div class="form-group"><label>Role</label>
                <select id="modal-user-role" onchange="toggleUserPerms()">
                    <option value="user" ${data.role==='user'?'selected':''}>User</option>
                    <option value="master" ${data.role==='master'?'selected':''}>Master (Full Access)</option>
                </select>
            </div>
        </div>
        <div style="margin-top:10px;"><label style="font-weight:700;font-size:0.85rem;color:var(--text-light);">Tab Permissions (for Users)</label>${permHtml}</div>
        <div style="margin-top:16px;text-align:right;">
            <button class="btn btn-clear" onclick="closeModal('previewModal')">Cancel</button>
            <button class="btn btn-quoted" onclick="saveUser(${idx})">💾 Save User</button>
        </div>
    `;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}
function toggleUserPerms() {
    const role = document.getElementById('modal-user-role').value;
    document.querySelectorAll('#previewBody .user-perm-cb').forEach(cb => {
        cb.checked = role === 'master';
        cb.disabled = role === 'master';
        cb.closest('label').classList.toggle('disabled', role === 'master');
    });
}
function saveUser(idx) {
    const id = document.getElementById('modal-user-id').value.trim();
    const name = document.getElementById('modal-user-name').value.trim();
    let password = document.getElementById('modal-user-pass').value.trim();
    const role = document.getElementById('modal-user-role').value;
    if (!id) return alert('User ID is required.');
    if (idx === null && !password) return alert('New users must have a password.');
    if (idx !== null && !password) {
        password = db.users[idx].password;
    }
    let permissions = [];
    if (role !== 'master') {
        document.querySelectorAll('#previewBody .user-perm-cb:checked').forEach(cb => permissions.push(cb.value));
        if (permissions.length === 0) {
            if (!confirm('User has no permissions assigned. They will not see any tabs. Continue?')) return;
        }
    } else {
        permissions = 'all';
    }
    const userData = { id, name, password, role, permissions };
    if (idx !== null && idx >= 0 && idx < db.users.length) {
        if (db.users[idx].id === 'Shaikh Shahid' && role !== 'master') {
            return alert('The Master user must remain Master.');
        }
        db.users[idx] = { ...db.users[idx], ...userData };
    } else {
        if (db.users.find(u => u.id === id)) return alert('User ID already exists.');
        db.users.push(userData);
    }
    saveDB();
    closeModal('previewModal');
    renderUserTable();
    alert('User saved successfully!');
}
function deleteUser(idx) {
    if (idx < 0 || idx >= db.users.length) return alert('User not found.');
    const user = db.users[idx];
    if (user.id === 'Shaikh Shahid') return alert('Cannot delete the Master user.');
    if (!confirm(`Delete user "${user.id}"?`)) return;
    db.users.splice(idx, 1);
    saveDB();
    renderUserTable();
}

// ==================== SQLITE BACKUP ====================
async function initSQLite() {
    return new Promise((resolve, reject) => {
        if (window.SQL) {
            SQL = window.SQL;
            resolve();
            return;
        }
        let attempts = 0;
        const maxAttempts = MAX_SQLITE_ATTEMPTS;
        const loadScript = () => {
            attempts++;
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
            script.onload = () => {
                if (window.SQL) {
                    SQL = window.SQL;
                    resolve();
                } else {
                    if (attempts < maxAttempts) {
                        setTimeout(loadScript, 1000);
                    } else {
                        reject(new Error('SQLite library failed to load after ' + maxAttempts + ' attempts.'));
                    }
                }
            };
            script.onerror = () => {
                if (attempts < maxAttempts) {
                    setTimeout(loadScript, 1000);
                } else {
                    reject(new Error('SQLite library failed to load after ' + maxAttempts + ' attempts.'));
                }
            };
            document.head.appendChild(script);
        };
        loadScript();
    });
}
async function exportToSQLite() {
    try {
        await initSQLite();
        if (!SQL) {
            alert('SQLite library failed to load. Please check your internet connection and refresh the page.');
            return;
        }
        const dbInstance = new SQL.Database();
        const createTables = `
            CREATE TABLE IF NOT EXISTS rates (id TEXT, mode TEXT, client TEXT, carrier TEXT, pol TEXT, pod TEXT, incoterm TEXT, commodity TEXT, weight REAL, transit TEXT, validityDate TEXT, charges TEXT, totalSellINR REAL, totalBuyINR REAL, marginINR REAL, marginPct REAL, quoteNumber TEXT, status TEXT, timestamp TEXT, lastModified TEXT, followUpStatus TEXT, lostReason TEXT);
            CREATE TABLE IF NOT EXISTS drafts (id TEXT, mode TEXT, client TEXT, carrier TEXT, pol TEXT, pod TEXT, incoterm TEXT, commodity TEXT, weight REAL, transit TEXT, validityDate TEXT, charges TEXT, totalSellINR REAL, totalBuyINR REAL, marginINR REAL, marginPct REAL, quoteNumber TEXT, status TEXT, timestamp TEXT, lastModified TEXT);
            CREATE TABLE IF NOT EXISTS ratesheet (id TEXT, carrierName TEXT, freightType TEXT, pol TEXT, pod TEXT, containerType TEXT, currency TEXT, freightAmount REAL, transitTime TEXT, commodity TEXT, validFrom TEXT, validTo TEXT, remarks TEXT, createdAt TEXT, updatedAt TEXT);
            CREATE TABLE IF NOT EXISTS shipments (code TEXT, sr TEXT, date TEXT, type TEXT, liner TEXT, jobBkg TEXT, containerNo TEXT, shipper TEXT, pol TEXT, pod TEXT, commodity TEXT, weight REAL, incoterm TEXT, cargoStatus TEXT, docsStatus TEXT, dd TEXT, eta TEXT, dd2 TEXT, valid TEXT, sell REAL, buy REAL, sales TEXT, pickup TEXT, gatein TEXT, remarks TEXT, charges TEXT, createdAt TEXT, updatedAt TEXT);
            CREATE TABLE IF NOT EXISTS bldrafts (blNumber TEXT, shipmentCode TEXT, shipper TEXT, shipperAddr TEXT, consignee TEXT, consigneeAddr TEXT, notifyParty TEXT, vessel TEXT, voyage TEXT, pol TEXT, pod TEXT, placeOfDelivery TEXT, containers TEXT, marks TEXT, goodsDesc TEXT, freightType TEXT, freightAmount REAL, freightCurrency TEXT, numOriginals INTEGER, placeOfIssue TEXT, issueDate TEXT, signature TEXT, status TEXT, createdAt TEXT, updatedAt TEXT);
            CREATE TABLE IF NOT EXISTS master_pol (value TEXT);
            CREATE TABLE IF NOT EXISTS master_pod (value TEXT);
            CREATE TABLE IF NOT EXISTS master_incoterms (value TEXT);
            CREATE TABLE IF NOT EXISTS master_containers (value TEXT);
            CREATE TABLE IF NOT EXISTS master_carriers (value TEXT);
            CREATE TABLE IF NOT EXISTS exchange_rates (currency TEXT, rate REAL);
        `;
        dbInstance.exec(createTables);

        function insertData(table, columns, rows) {
            if (!rows || rows.length === 0) return;
            const placeholders = columns.map(() => '?').join(',');
            const stmt = dbInstance.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`);
            rows.forEach(row => {
                const values = columns.map(col => {
                    let val = row[col];
                    if (typeof val === 'object') val = JSON.stringify(val);
                    if (val === undefined || val === null) val = '';
                    return val;
                });
                stmt.run(values);
            });
            stmt.free();
        }
        const rates = [...db.rates.sea, ...db.rates.air, ...db.rates.lcl];
        insertData('rates', ['mode', 'client', 'carrier', 'pol', 'pod', 'incoterm', 'commodity', 'weight', 'transit',
            'validityDate', 'charges', 'totalSellINR', 'totalBuyINR', 'marginINR', 'marginPct', 'quoteNumber', 'status',
            'timestamp', 'lastModified', 'followUpStatus', 'lostReason'
        ], rates.map(r => ({ ...r, mode: r.mode || 'SEA' })));
        const drafts = [...db.drafts.sea, ...db.drafts.air, ...db.drafts.lcl];
        insertData('drafts', ['mode', 'client', 'carrier', 'pol', 'pod', 'incoterm', 'commodity', 'weight', 'transit',
            'validityDate', 'charges', 'totalSellINR', 'totalBuyINR', 'marginINR', 'marginPct', 'quoteNumber', 'status',
            'timestamp', 'lastModified'
        ], drafts.map(r => ({ ...r, mode: r.mode || 'SEA' })));
        insertData('ratesheet', ['id', 'carrierName', 'freightType', 'pol', 'pod', 'containerType', 'currency',
            'freightAmount', 'transitTime', 'commodity', 'validFrom', 'validTo', 'remarks', 'createdAt', 'updatedAt'
        ], db.rateSheet);
        insertData('shipments', ['code', 'sr', 'date', 'type', 'liner', 'jobBkg', 'containerNo', 'shipper', 'pol', 'pod',
            'commodity', 'weight', 'incoterm', 'cargoStatus', 'docsStatus', 'dd', 'eta', 'dd2', 'valid', 'sell', 'buy',
            'sales', 'pickup', 'gatein', 'remarks', 'charges', 'createdAt', 'updatedAt'
        ], db.shipments);
        insertData('bldrafts', ['blNumber', 'shipmentCode', 'shipper', 'shipperAddr', 'consignee', 'consigneeAddr',
            'notifyParty', 'vessel', 'voyage', 'pol', 'pod', 'placeOfDelivery', 'containers', 'marks', 'goodsDesc',
            'freightType', 'freightAmount', 'freightCurrency', 'numOriginals', 'placeOfIssue', 'issueDate', 'signature',
            'status', 'createdAt', 'updatedAt'
        ], db.bldrafts);
        insertData('master_pol', ['value'], db.pol.map(p => ({ value: p })));
        insertData('master_pod', ['value'], db.pod.map(p => ({ value: p })));
        insertData('master_incoterms', ['value'], db.incoterms.map(i => ({ value: i })));
        insertData('master_containers', ['value'], db.containers.map(c => ({ value: c })));
        insertData('master_carriers', ['value'], db.carriers.map(c => ({ value: c })));
        insertData('exchange_rates', ['currency', 'rate'], Object.entries(db.exchangeRates).map(([k, v]) => ({ currency: k,
            rate: v })));
        const data = dbInstance.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Gateway_EXIM_Backup_${new Date().toISOString().split('T')[0]}.sqlite`;
        a.click();
        URL.revokeObjectURL(url);
        alert('SQLite backup downloaded successfully!');
    } catch (e) {
        alert('SQLite export failed: ' + e.message);
    }
}
async function importFromSQLite(input) {
    const file = input.files[0];
    if (!file) return;
    try {
        await initSQLite();
        if (!SQL) {
            alert('SQLite library failed to load. Please check your internet connection and refresh the page.');
            return;
        }
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                const dbInstance = new SQL.Database(uint8Array);

                function readTable(tableName) {
                    const stmt = dbInstance.prepare(`SELECT * FROM ${tableName}`);
                    const rows = [];
                    while (stmt.step()) {
                        const row = stmt.getAsObject();
                        Object.keys(row).forEach(key => {
                            if (typeof row[key] === 'string' && row[key].startsWith('{')) {
                                try { row[key] = JSON.parse(row[key]); } catch (e) {}
                            }
                        });
                        rows.push(row);
                    }
                    stmt.free();
                    return rows;
                }
                const newRates = readTable('rates');
                const newDrafts = readTable('drafts');
                const newRateSheet = readTable('ratesheet');
                const newShipments = readTable('shipments');
                const newBLDrafts = readTable('bldrafts');
                const newPol = readTable('master_pol').map(r => r.value);
                const newPod = readTable('master_pod').map(r => r.value);
                const newIncoterms = readTable('master_incoterms').map(r => r.value);
                const newContainers = readTable('master_containers').map(r => r.value);
                const newCarriers = readTable('master_carriers').map(r => r.value);
                const newExchangeRates = readTable('exchange_rates').reduce((acc, r) => { acc[r.currency] = r.rate; return acc; },
                {});
                db.rates = { sea: [], air: [], lcl: [] };
                newRates.forEach(r => { const mode = (r.mode || 'SEA').toLowerCase(); if (db.rates[mode]) db.rates[mode].push(
                        r); });
                db.drafts = { sea: [], air: [], lcl: [] };
                newDrafts.forEach(r => { const mode = (r.mode || 'SEA').toLowerCase(); if (db.drafts[mode]) db.drafts[mode].push(
                        r); });
                db.rateSheet = newRateSheet;
                db.shipments = newShipments;
                db.bldrafts = newBLDrafts;
                db.pol = newPol;
                db.pod = newPod;
                db.incoterms = newIncoterms;
                db.containers = newContainers;
                db.carriers = newCarriers;
                db.exchangeRates = newExchangeRates;
                saveDB();
                alert('SQLite import successful! Refreshing...');
                location.reload();
            } catch (err) { alert('Import failed: ' + err.message); }
        };
        reader.readAsArrayBuffer(file);
    } catch (err) {
        alert('Import failed: ' + err.message);
    }
    input.value = '';
}

// ==================== DSR DESIGN MODE ====================
function toggleDsrDesignMode() {
    dsrDesignMode = !dsrDesignMode;
    const body = document.querySelector('#seaDsrBody, #airDsrBody');
    if (body) body.classList.toggle('dsr-design-mode', dsrDesignMode);
}
document.addEventListener('dragstart', function(e) {
    const field = e.target.closest('.dsr-field');
    if (!field) return;
    e.dataTransfer.setData('text/plain', field.dataset.fieldId || field.id || '');
    setTimeout(() => field.classList.add('dragging'), 0);
});
document.addEventListener('dragover', function(e) {
    e.preventDefault();
    const field = e.target.closest('.dsr-field');
    if (field && dsrDesignMode) field.classList.add('drag-over');
});
document.addEventListener('dragleave', function(e) {
    const field = e.target.closest('.dsr-field');
    if (field) field.classList.remove('drag-over');
});
document.addEventListener('drop', function(e) {
    e.preventDefault();
    const target = e.target.closest('.dsr-field');
    if (!target || !dsrDesignMode) return;
    target.classList.remove('drag-over');
    const sourceId = e.dataTransfer.getData('text/plain');
    const source = target.parentElement.querySelector(`[data-field-id="${sourceId}"]`);
    if (!source || source === target) return;
    const parent = target.parentElement;
    const children = Array.from(parent.children);
    const srcIdx = children.indexOf(source);
    const tgtIdx = children.indexOf(target);
    if (srcIdx < tgtIdx) {
        parent.insertBefore(source, target.nextSibling);
    } else {
        parent.insertBefore(source, target);
    }
    parent.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
});

// ==================== GLOBAL OMNI-SEARCH ====================
let globalSearchTimeout = null;

function debouncedGlobalSearch() {
    clearTimeout(globalSearchTimeout);
    globalSearchTimeout = setTimeout(() => performGlobalSearch(), 300);
}

function performGlobalSearch() {
    const input = document.getElementById('global-search');
    const resultsContainer = document.getElementById('global-search-results');
    const term = input.value.trim().toLowerCase();
    if (term.length < 2) {
        resultsContainer.classList.remove('show');
        resultsContainer.innerHTML = '';
        return;
    }
    let matches = [];

    function isMatch(rec, term) {
        const text =
            `${rec.quoteNumber||''} ${rec.client||''} ${rec.pol||''} ${rec.pod||''} ${rec.carrier||''} ${rec.shipper||''} ${rec.code||''} ${rec.blNumber||''} ${rec.carrierName||''}`.toLowerCase();
        return text.includes(term);
    }
    ['sea', 'air', 'lcl'].forEach(mode => {
        db.drafts[mode].forEach((rec, idx) => {
            if (isMatch(rec, term)) {
                matches.push({
                    category: 'Draft',
                    tab: 'drafts',
                    mode: mode,
                    idx: idx,
                    label: `${rec.quoteNumber} - ${rec.client}`,
                    subtitle: `${rec.pol || 'N/A'} → ${rec.pod || 'N/A'}`
                });
            }
        });
    });
    ['sea', 'air', 'lcl'].forEach(mode => {
        db.rates[mode].forEach((rec, idx) => {
            if (isMatch(rec, term)) {
                matches.push({
                    category: 'Quote',
                    tab: 'rates',
                    mode: mode,
                    idx: idx,
                    label: `${rec.quoteNumber} - ${rec.client}`,
                    subtitle: `${rec.pol || 'N/A'} → ${rec.pod || 'N/A'}`
                });
            }
        });
    });
    db.shipments.forEach((rec, idx) => {
        if (isMatch(rec, term)) {
            matches.push({
                category: 'Shipment',
                tab: 'dsr',
                mode: 'dsr',
                idx: idx,
                label: `${rec.code} - ${rec.shipper}`,
                subtitle: `${rec.pol || 'N/A'} → ${rec.pod || 'N/A'}`
            });
        }
    });
    db.bldrafts.forEach((rec, idx) => {
        if (isMatch(rec, term)) {
            matches.push({
                category: 'BL Draft',
                tab: 'bldraft',
                mode: 'bldraft',
                idx: idx,
                label: `${rec.blNumber || 'BL-Draft'} - ${rec.shipper}`,
                subtitle: `${rec.pol || 'N/A'} → ${rec.pod || 'N/A'}`
            });
        }
    });
    db.rateSheet.forEach((rec, idx) => {
        if (isMatch(rec, term)) {
            matches.push({
                category: 'Rate Sheet',
                tab: 'ratesheet',
                mode: 'ratesheet',
                idx: idx,
                label: `${rec.carrierName} - ${rec.freightType}`,
                subtitle: `${rec.pol || 'N/A'} → ${rec.pod || 'N/A'}`
            });
        }
    });
    if (matches.length === 0) {
        resultsContainer.innerHTML =
            `<div class="no-results">No records found matching "<strong>${input.value}</strong>"</div>`;
        resultsContainer.classList.add('show');
        return;
    }
    matches = matches.slice(0, 15);
    let html = '';
    let lastCategory = '';
    matches.forEach(item => {
        if (item.category !== lastCategory) {
            html += `<div class="result-group-title">${item.category}</div>`;
            lastCategory = item.category;
        }
        html += `<div class="result-item" onclick="jumpToRecord('${item.tab}', '${item.mode}', ${item.idx})">
                    <div class="title">${item.label}</div>
                    <div class="subtitle">${item.subtitle}</div>
                    <span class="tag">${item.category}</span>
                </div>`;
    });
    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('show');
}

function jumpToRecord(tab, mode, idx) {
    const resultsContainer = document.getElementById('global-search-results');
    resultsContainer.classList.remove('show');
    document.getElementById('global-search').value = '';
    switchToTab(tab);
    setTimeout(() => {
        if (tab === 'drafts' || tab === 'rates') {
            editRecord(tab, mode, idx);
        } else if (tab === 'dsr') {
            editDsrShipment(idx);
        } else if (tab === 'bldraft') {
            openBLModal(idx);
        } else if (tab === 'ratesheet') {
            openRateSheetModal(idx);
        }
    }, 400);
}
document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.global-search-wrapper');
    const results = document.getElementById('global-search-results');
    if (wrapper && !wrapper.contains(e.target)) {
        results.classList.remove('show');
    }
});

// ==================== MEASUREMENT DEFAULTS (New) ====================
function refreshMeasurementDefaults() {
    const d = db.defaults || {};
    const dutyPct = document.getElementById('duty-pct');
    if (dutyPct) dutyPct.value = d.inDuty || 0;
    const dutyService = document.getElementById('duty-service');
    if (dutyService) dutyService.value = d.inSocialWelfare || 0;
    const dutyGst = document.getElementById('duty-gst');
    if (dutyGst) dutyGst.value = d.gst || 0;
    const insPct = document.getElementById('ins-pct');
    if (insPct) insPct.value = d.insurance || 0;
    const insGst = document.getElementById('ins-gst');
    if (insGst) insGst.value = d.gst || 0;
    const prodProfit = document.getElementById('prod-profit');
    if (prodProfit) prodProfit.value = d.profitMargin || 0;
    const prodDrawback = document.getElementById('prod-drawback');
    if (prodDrawback) prodDrawback.value = d.drawback || 0;
    const prodRodtep = document.getElementById('prod-rodtep');
    if (prodRodtep) prodRodtep.value = d.rodtep || 0;
    const usDutyPct = document.getElementById('us-duty-pct');
    if (usDutyPct) usDutyPct.value = d.usDuty || 0;
    const usDutyTariff = document.getElementById('us-duty-tariff');
    if (usDutyTariff) usDutyTariff.value = d.usTariff || 0;
    const usDutyMpf = document.getElementById('us-duty-mpf');
    if (usDutyMpf) usDutyMpf.value = d.usMPF || 0;
    const usDutyHmf = document.getElementById('us-duty-hmf');
    if (usDutyHmf) usDutyHmf.value = d.usHMF || 0;
    const defaultCur = d.defaultCurrency || 'USD';
    ['duty-currency', 'prod-currency', 'ins-currency', 'us-duty-currency'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            sel.value = defaultCur;
            setExchangeRate(id.replace('-currency', '-exrate'), id);
        }
    });
}

function saveMeasurementDefaults() {
    db.defaults.gst = parseFloat(document.getElementById('def-gst').value) || 0;
    db.defaults.insurance = parseFloat(document.getElementById('def-insurance').value) || 0;
    db.defaults.profitMargin = parseFloat(document.getElementById('def-profit').value) || 0;
    db.defaults.defaultCurrency = document.getElementById('def-currency').value || 'USD';
    db.defaults.usDuty = parseFloat(document.getElementById('def-us-duty').value) || 0;
    db.defaults.usTariff = parseFloat(document.getElementById('def-us-tariff').value) || 0;
    db.defaults.usMPF = parseFloat(document.getElementById('def-us-mpf').value) || 0;
    db.defaults.usHMF = parseFloat(document.getElementById('def-us-hmf').value) || 0;
    db.defaults.inDuty = parseFloat(document.getElementById('def-in-duty').value) || 0;
    db.defaults.inSocialWelfare = parseFloat(document.getElementById('def-in-social').value) || 0;
    db.defaults.drawback = parseFloat(document.getElementById('def-drawback').value) || 0;
    db.defaults.rodtep = parseFloat(document.getElementById('def-rodtep').value) || 0;
    saveDB();
    alert('Measurement defaults saved!');
    refreshMeasurementDefaults();
}

// ==================== INIT ====================
function init() {
    const user = checkLogin();
    const overlay = document.getElementById('login-overlay');
    if (!user) {
        overlay.classList.remove('hidden');
        return;
    }
    overlay.classList.add('hidden');
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
    if (lastTab === 'dsr') renderShipments();
    if (lastTab === 'bldraft') renderBLDrafts();
    if (lastTab === 'followup') renderFollowups();
    if (lastTab === 'dashboard') renderDashboard();
    if (lastTab === 'measurement') {
        refreshMeasurementDefaults();
    }
    if (lastTab === 'sealocal' || lastTab === 'airlocal' || lastTab === 'lcllocal') {
        const mode = lastTab === 'sealocal' ? 'sea' : lastTab === 'airlocal' ? 'air' : 'lcl';
        renderDefaultChargesMaster(mode);
        renderCarrierChargesMaster(mode === 'sea' ? 'sealcl' : mode);
    }
    ['sea', 'air', 'lcl'].forEach(mode => { buildChargesGrid(mode);
        setValidityDefault(mode); });
    if (backupFolderHandle) {
        startAutoBackup();
        document.getElementById('backup-folder-path').textContent = `📁 ${backupFolderHandle.name}`;
    }
    console.log('🚢 Gateway EXIM Freight Quotation System loaded successfully.');
    console.log(
        `📊 ${db.rates.sea.length + db.rates.air.length + db.rates.lcl.length} quoted records, ${db.drafts.sea.length + db.drafts.air.length + db.drafts.lcl.length} drafts, ${db.shipments.length} shipments.`
        );
}
document.addEventListener('DOMContentLoaded', init);

// ==================== AUTO-SAVE MEASUREMENT DEFAULTS ON CHANGE ====================
function autoSaveMeasurementDefaults() {
    const inputIds = [
        'def-gst', 'def-insurance', 'def-profit',
        'def-us-tariff', 'def-us-mpf', 'def-us-hmf',
        'def-in-duty', 'def-in-social', 'def-drawback', 'def-rodtep'
    ];
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                db.defaults.gst = parseFloat(document.getElementById('def-gst').value) || 0;
                db.defaults.insurance = parseFloat(document.getElementById('def-insurance').value) || 0;
                db.defaults.profitMargin = parseFloat(document.getElementById('def-profit').value) || 0;
                db.defaults.usTariff = parseFloat(document.getElementById('def-us-tariff').value) || 0;
                db.defaults.usMPF = parseFloat(document.getElementById('def-us-mpf').value) || 0;
                db.defaults.usHMF = parseFloat(document.getElementById('def-us-hmf').value) || 0;
                db.defaults.inDuty = parseFloat(document.getElementById('def-in-duty').value) || 0;
                db.defaults.inSocialWelfare = parseFloat(document.getElementById('def-in-social').value) || 0;
                db.defaults.drawback = parseFloat(document.getElementById('def-drawback').value) || 0;
                db.defaults.rodtep = parseFloat(document.getElementById('def-rodtep').value) || 0;
                saveDB();
                refreshMeasurementDefaults();
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    autoSaveMeasurementDefaults();
});

// ==================== MEASUREMENT CALCULATORS ====================
function showMeasurementMenu() {
    document.getElementById('measurement-menu').style.display = 'block';
    document.getElementById('measurement-content').style.display = 'none';
    document.querySelectorAll('#measurement-content .calc-panel').forEach(p => p.classList.remove('active'));
}

function switchCalcTab(tabId) {
    document.getElementById('measurement-menu').style.display = 'none';
    document.getElementById('measurement-content').style.display = 'block';
    document.querySelectorAll('#measurement-content .calc-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('calc-' + tabId);
    if (panel) panel.classList.add('active');

    if (tabId === 'stuffing') {
        initStuffingPlanning();
    }

    if (['duty', 'product', 'insurance', 'us-duty'].includes(tabId)) {
        const ids = ['duty-currency', 'prod-currency', 'ins-currency', 'us-duty-currency'];
        ids.forEach(id => {
            const sel = document.getElementById(id);
            if (sel && sel.options.length === 0) {
                sel.innerHTML = '<option value="">Select</option>' + Object.keys(db.exchangeRates).map(c =>
                    `<option value="${c}">${c}</option>`).join('');
            }
        });
    }

    refreshMeasurementDefaults();
    if (tabId === 'duty') calcDuty();
    else if (tabId === 'product') calcProduct();
    else if (tabId === 'insurance') calcInsurance();
    else if (tabId === 'us-duty') calcUSDuty();
}

function setExchangeRate(targetInputId, currencyInputId) {
    const cur = document.getElementById(currencyInputId).value;
    const rate = db.exchangeRates[cur];
    if (rate) {
        document.getElementById(targetInputId).value = rate;
        document.getElementById(targetInputId).disabled = false;
    } else {
        document.getElementById(targetInputId).value = '';
        document.getElementById(targetInputId).disabled = false;
    }
    const panel = document.getElementById(currencyInputId).closest('.calc-panel');
    if (panel.id === 'calc-duty') calcDuty();
    else if (panel.id === 'calc-product') calcProduct();
    else if (panel.id === 'calc-insurance') calcInsurance();
    else if (panel.id === 'calc-us-duty') calcUSDuty();
}

document.addEventListener('change', function(e) {
    if (e.target.id === 'duty-currency') setExchangeRate('duty-exrate', 'duty-currency');
    if (e.target.id === 'prod-currency') setExchangeRate('prod-exrate', 'prod-currency');
    if (e.target.id === 'ins-currency') setExchangeRate('ins-exrate', 'ins-currency');
    if (e.target.id === 'us-duty-currency') setExchangeRate('us-duty-exrate', 'us-duty-currency');
});

function calcDuty() {
    const val = parseFloat(document.getElementById('duty-value').value) || 0;
    const freightInsUsd = parseFloat(document.getElementById('duty-freight').value) || 0;
    const ex = parseFloat(document.getElementById('duty-exrate').value) || 0;
    const dutyPct = parseFloat(document.getElementById('duty-pct').value) || 0;
    const swsPct = parseFloat(document.getElementById('duty-service').value) || 0;
    const gstPct = parseFloat(document.getElementById('duty-gst').value) || 0;

    const cargoInr = val * ex;
    const freightInsInr = freightInsUsd * ex;

    const duty = cargoInr * (dutyPct / 100);
    const sws = cargoInr * (swsPct / 100);
    const gstOnDuty = duty * (gstPct / 100);
    const totalGst = gstPct / 100 * (cargoInr + freightInsInr + duty + sws);
    const totalPayable = duty + sws + totalGst;

    const valUsd = val;
    const freightInsUsdDisplay = freightInsUsd;
    const dutyUsd = duty / ex;
    const swsUsd = sws / ex;
    const gstOnDutyUsd = gstOnDuty / ex;
    const totalGstUsd = totalGst / ex;
    const totalPayableUsd = totalPayable / ex;

    const formatUSD = (n) => '$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2,
        maximumFractionDigits: 2 });

    document.getElementById('duty-inr').textContent = formatINR(cargoInr);
    document.getElementById('duty-usd').textContent = formatUSD(valUsd);
    document.getElementById('duty-frt-inr').textContent = formatINR(freightInsInr);
    document.getElementById('duty-frt-usd').textContent = formatUSD(freightInsUsdDisplay);
    document.getElementById('duty-amt').textContent = formatINR(duty);
    document.getElementById('duty-amt-usd').textContent = formatUSD(dutyUsd);
    document.getElementById('duty-service-amt').textContent = formatINR(sws);
    document.getElementById('duty-service-usd').textContent = formatUSD(swsUsd);
    document.getElementById('duty-gst-amt').textContent = formatINR(gstOnDuty);
    document.getElementById('duty-gst-usd').textContent = formatUSD(gstOnDutyUsd);
    document.getElementById('duty-total-gst').textContent = formatINR(totalGst);
    document.getElementById('duty-total-gst-usd').textContent = formatUSD(totalGstUsd);
    document.getElementById('duty-total').textContent = formatINR(totalPayable);
    document.getElementById('duty-total-usd').textContent = formatUSD(totalPayableUsd);
}

function calcProduct() {
    const pricePerUnit = parseFloat(document.getElementById('prod-price').value) || 0;
    const weight = parseFloat(document.getElementById('prod-weight').value) || 0;
    const unit = document.getElementById('prod-unit').value;
    const ex = parseFloat(document.getElementById('prod-exrate').value) || 0;
    const freightUsd = parseFloat(document.getElementById('prod-freight').value) || 0;
    const otherUsd = parseFloat(document.getElementById('prod-other').value) || 0;
    const drawbackPct = parseFloat(document.getElementById('prod-drawback').value) || 0;
    const rodtepPct = parseFloat(document.getElementById('prod-rodtep').value) || 0;
    const profitPct = parseFloat(document.getElementById('prod-profit').value) || 0;

    let weightKgs = weight;
    if (unit === 'tons') weightKgs = weight * 1000;

    const productPriceUsd = pricePerUnit * weightKgs;
    const insuranceUsd = Math.max(productPriceUsd * 0.0005, 25);
    const drawbackUsd = productPriceUsd * (drawbackPct / 100);
    const rodtepUsd = productPriceUsd * (rodtepPct / 100);
    const totalCostUsd = productPriceUsd + freightUsd + insuranceUsd + otherUsd;

    const productPriceInr = productPriceUsd * ex;
    const freightInr = freightUsd * ex;
    const insuranceInr = insuranceUsd * ex;
    const otherInr = otherUsd * ex;
    const drawbackInr = drawbackUsd * ex;
    const rodtepInr = rodtepUsd * ex;
    const totalCostInr = totalCostUsd * ex;

    const profitInr = totalCostInr * (profitPct / 100);
    const profitUsd = profitInr / ex;
    const finalPriceInr = totalCostInr + profitInr;
    const finalPriceUsd = finalPriceInr / ex;
    const totalMarginInr = drawbackInr + rodtepInr + profitInr;
    const totalMarginUsd = drawbackUsd + rodtepUsd + profitUsd;

    const formatUSD = (n) => '$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2,
        maximumFractionDigits: 2 });

    document.getElementById('prod-inr').textContent = formatINR(productPriceInr);
    document.getElementById('prod-usd').textContent = formatUSD(productPriceUsd);
    document.getElementById('prod-ins-inr').textContent = formatINR(insuranceInr);
    document.getElementById('prod-ins-usd').textContent = formatUSD(insuranceUsd);
    document.getElementById('prod-freight-inr').textContent = formatINR(freightInr);
    document.getElementById('prod-freight-usd').textContent = formatUSD(freightUsd);
    document.getElementById('prod-other-inr').textContent = formatINR(otherInr);
    document.getElementById('prod-other-usd').textContent = formatUSD(otherUsd);
    document.getElementById('prod-landed-inr').textContent = formatINR(totalCostInr);
    document.getElementById('prod-landed-usd').textContent = formatUSD(totalCostUsd);
    document.getElementById('prod-profit-inr').textContent = formatINR(profitInr);
    document.getElementById('prod-profit-usd').textContent = formatUSD(profitUsd);
    document.getElementById('prod-final').textContent = formatINR(finalPriceInr);
    document.getElementById('prod-final-usd').textContent = formatUSD(finalPriceUsd);

    document.getElementById('prod-drawback-inr').textContent = formatINR(drawbackInr);
    document.getElementById('prod-drawback-usd').textContent = formatUSD(drawbackUsd);
    document.getElementById('prod-rodtep-inr').textContent = formatINR(rodtepInr);
    document.getElementById('prod-rodtep-usd').textContent = formatUSD(rodtepUsd);
    document.getElementById('prod-benefit-profit-inr').textContent = formatINR(profitInr);
    document.getElementById('prod-benefit-profit-usd').textContent = formatUSD(profitUsd);
    document.getElementById('prod-total-margin-inr').textContent = formatINR(totalMarginInr);
    document.getElementById('prod-total-margin-usd').textContent = formatUSD(totalMarginUsd);
}

function createStuffingRow(index) {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--border)';
    row.style.background = index % 2 === 0 ? 'var(--bg)' : 'var(--card-bg)';
    row.innerHTML = `
        <td style="padding:8px 14px;text-align:center;font-weight:600;">${index + 1}</td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="text" class="stuffing-vessel" placeholder="Vessel name" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-departure" onchange="updateStuffingDates(this)" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-eta" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#F1F5F9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-gate-open" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#F1F5F9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-gate-cut" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#F1F5F9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-sb-cut" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#F1F5F9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-si-cut" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#F1F5F9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <button class="btn btn-sm btn-clear" onclick="removeStuffingRow(this)" style="padding:2px 8px;">×</button>
        </td>
    `;
    return row;
}

function addStuffingRow() {
    const tbody = document.getElementById('stuffing-table-body');
    const index = tbody.children.length;
    const row = createStuffingRow(index);
    tbody.appendChild(row);
}

function removeStuffingRow(btn) {
    const row = btn.closest('tr');
    const tbody = document.getElementById('stuffing-table-body');
    if (tbody.children.length > 1) {
        row.remove();
        tbody.querySelectorAll('tr').forEach((tr, i) => {
            tr.querySelector('td:first-child').textContent = i + 1;
        });
    } else {
        alert('You must keep at least one row.');
    }
}

function clearStuffingRows() {
    if (confirm('Clear all stuffing rows?')) {
        const tbody = document.getElementById('stuffing-table-body');
        tbody.innerHTML = '';
        addStuffingRow();
    }
}

function updateStuffingDates(departureInput) {
    const row = departureInput.closest('tr');
    const depDate = new Date(departureInput.value);
    if (isNaN(depDate)) return;
    const offsetEta = parseInt(document.getElementById('offset-eta').value) || -1;
    const offsetGateOpen = parseInt(document.getElementById('offset-gate-open').value) || -5;
    const offsetGateCut = parseInt(document.getElementById('offset-gate-cut').value) || -2;
    const offsetSbCut = parseInt(document.getElementById('offset-sb-cut').value) || -2;
    const offsetSiCut = parseInt(document.getElementById('offset-si-cut').value) || -3;
    const formatDate = (date) => date.toISOString().split('T')[0];
    const eta = new Date(depDate);
    eta.setDate(eta.getDate() + offsetEta);
    row.querySelector('.stuffing-eta').value = formatDate(eta);
    const gateOpen = new Date(depDate);
    gateOpen.setDate(gateOpen.getDate() + offsetGateOpen);
    row.querySelector('.stuffing-gate-open').value = formatDate(gateOpen);
    const gateCut = new Date(depDate);
    gateCut.setDate(gateCut.getDate() + offsetGateCut);
    row.querySelector('.stuffing-gate-cut').value = formatDate(gateCut);
    const sbCut = new Date(depDate);
    sbCut.setDate(sbCut.getDate() + offsetSbCut);
    row.querySelector('.stuffing-sb-cut').value = formatDate(sbCut);
    const siCut = new Date(depDate);
    siCut.setDate(siCut.getDate() + offsetSiCut);
    row.querySelector('.stuffing-si-cut').value = formatDate(siCut);
}

function initStuffingPlanning() {
    const tbody = document.getElementById('stuffing-table-body');
    if (tbody && tbody.children.length === 0) {
        addStuffingRow();
    }
}

function calcInsurance() {
    const val = parseFloat(document.getElementById('ins-value').value) || 0;
    const ex = parseFloat(document.getElementById('ins-exrate').value) || 0;
    const insPct = parseFloat(document.getElementById('ins-pct').value) || 0;
    const gstPct = parseFloat(document.getElementById('ins-gst').value) || 0;
    const totalRow = document.getElementById('ins-total-row');
    if (val === 0 || ex === 0) {
        totalRow.style.display = 'none';
        document.getElementById('ins-inr').textContent = '₹ 0.00';
        document.getElementById('ins-usd').textContent = '$ 0.00';
        document.getElementById('ins-amt').textContent = '₹ 0.00';
        document.getElementById('ins-amt-usd').textContent = '$ 0.00';
        document.getElementById('ins-gst-amt').textContent = '₹ 0.00';
        document.getElementById('ins-gst-usd').textContent = '$ 0.00';
        document.getElementById('ins-total').textContent = '₹ 0.00';
        document.getElementById('ins-total-usd').textContent = '$ 0.00';
        return;
    }
    const cargoValueUsd = val;
    const calculatedIns = cargoValueUsd * (insPct / 100);
    const insUsd = Math.max(calculatedIns, 25);
    const insInr = insUsd * ex;
    const gstUsd = insUsd * (gstPct / 100);
    const gstInr = gstUsd * ex;
    const totalUsd = insUsd + gstUsd;
    const totalInr = insInr + gstInr;
    const formatUSD = (n) => '$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2,
        maximumFractionDigits: 2 });
    document.getElementById('ins-inr').textContent = formatINR(val * ex);
    document.getElementById('ins-usd').textContent = formatUSD(val);
    document.getElementById('ins-amt').textContent = formatINR(insInr);
    document.getElementById('ins-amt-usd').textContent = formatUSD(insUsd);
    document.getElementById('ins-gst-amt').textContent = formatINR(gstInr);
    document.getElementById('ins-gst-usd').textContent = formatUSD(gstUsd);
    document.getElementById('ins-total').textContent = formatINR(totalInr);
    document.getElementById('ins-total-usd').textContent = formatUSD(totalUsd);
    totalRow.style.display = 'table-footer-group';
}

function calcUSDuty() {
    const val = parseFloat(document.getElementById('us-duty-value').value) || 0;
    const ex = parseFloat(document.getElementById('us-duty-exrate').value) || 0;
    const dutyPct = parseFloat(document.getElementById('us-duty-pct').value) || 0;
    const tariffPct = parseFloat(document.getElementById('us-duty-tariff').value) || 0;
    const mpfPct = parseFloat(document.getElementById('us-duty-mpf').value) || 0;
    const hmfPct = parseFloat(document.getElementById('us-duty-hmf').value) || 0;
    const inr = val * ex;
    const duty = inr * (dutyPct / 100);
    const tariff = inr * (tariffPct / 100);
    const mpf = inr * (mpfPct / 100);
    const hmf = inr * (hmfPct / 100);
    const total = duty + tariff + mpf + hmf;
    const valUsd = val;
    const dutyUsd = duty / ex;
    const tariffUsd = tariff / ex;
    const mpfUsd = mpf / ex;
    const hmfUsd = hmf / ex;
    const totalUsd = total / ex;
    const formatUSD = (n) => '$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2,
        maximumFractionDigits: 2 });
    document.getElementById('us-duty-inr').textContent = formatINR(inr);
    document.getElementById('us-duty-usd').textContent = formatUSD(valUsd);
    document.getElementById('us-duty-amt').textContent = formatINR(duty);
    document.getElementById('us-duty-amt-usd').textContent = formatUSD(dutyUsd);
    document.getElementById('us-duty-tariff-amt').textContent = formatINR(tariff);
    document.getElementById('us-duty-tariff-usd').textContent = formatUSD(tariffUsd);
    document.getElementById('us-duty-mpf-amt').textContent = formatINR(mpf);
    document.getElementById('us-duty-mpf-usd').textContent = formatUSD(mpfUsd);
    document.getElementById('us-duty-hmf-amt').textContent = formatINR(hmf);
    document.getElementById('us-duty-hmf-usd').textContent = formatUSD(hmfUsd);
    document.getElementById('us-duty-total').textContent = formatINR(total);
    document.getElementById('us-duty-total-usd').textContent = formatUSD(totalUsd);
}

if (!db.stuffing) db.stuffing = [];

function createStuffingRow(index, data) {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--border)';
    row.style.background = index % 2 === 0 ? 'var(--bg)' : 'var(--card-bg)';
    row.dataset.index = index;
    row.innerHTML = `
        <td style="padding:8px 14px;text-align:center;font-weight:600;">${index + 1}</td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="text" class="stuffing-vessel" value="${data?.vessel || ''}" placeholder="Vessel name" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;" oninput="onStuffingInput()" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-departure" value="${data?.departure || ''}" onchange="updateStuffingDates(this); onStuffingInput();" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-eta" value="${data?.eta || ''}" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#f1f5f9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-gate-open" value="${data?.gateOpen || ''}" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#f1f5f9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-gate-cut" value="${data?.gateCut || ''}" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#f1f5f9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-sb-cut" value="${data?.sbCut || ''}" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#f1f5f9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <input type="date" class="stuffing-si-cut" value="${data?.siCut || ''}" readonly style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;background:#f1f5f9;" />
        </td>
        <td style="padding:8px 14px;text-align:center;">
            <button class="btn btn-sm btn-clear" onclick="removeStuffingRow(this)" style="padding:2px 8px;">×</button>
        </td>
    `;
    return row;
}

function saveStuffingData() {
    const rows = document.querySelectorAll('#stuffing-table-body tr');
    db.stuffing = [];
    rows.forEach((row, i) => {
        const vessel = row.querySelector('.stuffing-vessel').value;
        const departure = row.querySelector('.stuffing-departure').value;
        const eta = row.querySelector('.stuffing-eta').value;
        const gateOpen = row.querySelector('.stuffing-gate-open').value;
        const gateCut = row.querySelector('.stuffing-gate-cut').value;
        const sbCut = row.querySelector('.stuffing-sb-cut').value;
        const siCut = row.querySelector('.stuffing-si-cut').value;
        db.stuffing.push({ vessel, departure, eta, gateOpen, gateCut, sbCut, siCut });
    });
    saveDB();
}

function onStuffingInput() {
    saveStuffingData();
}

function onOffsetChange() {
    document.querySelectorAll('#stuffing-table-body .stuffing-departure').forEach(depInput => {
        if (depInput.value) {
            updateStuffingDates(depInput);
        }
    });
    saveStuffingData();
}

function removeStuffingRow(btn) {
    const row = btn.closest('tr');
    const tbody = document.getElementById('stuffing-table-body');
    if (tbody.children.length > 1) {
        row.remove();
        tbody.querySelectorAll('tr').forEach((tr, i) => {
            tr.querySelector('td:first-child').textContent = i + 1;
        });
        saveStuffingData();
    } else {
        alert('You must keep at least one row.');
    }
}

function initStuffingPlanning() {
    const tbody = document.getElementById('stuffing-table-body');
    tbody.innerHTML = '';
    const data = db.stuffing || [];
    if (data.length === 0) {
        addStuffingRow();
    } else {
        data.forEach((item, idx) => {
            const row = createStuffingRow(idx, item);
            tbody.appendChild(row);
        });
    }
    document.querySelectorAll('#stuffing-table-body .stuffing-departure').forEach(depInput => {
        if (depInput.value) {
            updateStuffingDates(depInput);
        }
    });
}

// ==================== USA TRUCKING MODULE ====================
if (!db.truckingShipments) db.truckingShipments = [];

function formatUSD(n) {
    return '$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function onTruckInput() {
    calcTruckingTotals();
    document.querySelectorAll('#truck-origin, #truck-dest').forEach(el => {
        el.value = el.value.toUpperCase();
    });
}

function calcTruckingTotals() {
    const miles = parseFloat(document.getElementById('truck-miles').value) || 0;
    const distance = miles * 2;
    document.getElementById('truck-distance').value = distance.toFixed(2);
    const perMile = parseFloat(document.getElementById('truck-per-mile').value) || 0;
    const min = parseFloat(document.getElementById('truck-minimum').value) || 0;
    const chassisDays = parseInt(document.getElementById('truck-chassis-days').value) || 2;
    const inventory = parseInt(document.getElementById('truck-inventory').value) || 1;
    let regTotal = Math.max(perMile * distance, min);
    const chassisCost = 45 * chassisDays * inventory;
    regTotal += chassisCost;
    document.getElementById('truck-regular-total').textContent = formatUSD(regTotal);
    let addTotal = 0;
    document.querySelectorAll('#truck-additional-container .truck-additional-row').forEach(row => {
        const amt = parseFloat(row.querySelector('.charge-amt').value) || 0;
        addTotal += amt;
    });
    document.getElementById('truck-additional-total').textContent = formatUSD(addTotal);
    const grand = regTotal + addTotal;
    document.getElementById('truck-grand-total').textContent = formatUSD(grand);
    return { regTotal, addTotal, grand };
}

function buildTruckingAdditionalRows(charges) {
    const container = document.getElementById('truck-additional-container');
    container.innerHTML = '';
    const defaultCharges = charges || [
        { name: 'STORAGE', amount: 0 },
        { name: 'PRE PULL', amount: 0 },
        { name: 'DETENTION', amount: 0 },
        { name: 'STOP OFF CHARGES', amount: 0 },
        { name: 'CHASSIS SPLIT', amount: 0 },
        { name: 'OVER WEIGHT CHARGES', amount: 0 },
        { name: 'TRIAXLE CHASSIS', amount: 0 }
    ];
    defaultCharges.forEach((charge, idx) => {
        addTruckingAdditionalRow(charge.name, charge.amount, idx);
    });
    enableTruckingDragDrop();
}

function addTruckingAdditionalRow(name = '', amount = 0, index = null) {
    const container = document.getElementById('truck-additional-container');
    const row = document.createElement('div');
    row.className = 'truck-additional-row';
    row.draggable = true;
    row.dataset.index = index !== null ? index : container.children.length;
    row.innerHTML = `
        <span class="charge-name">${name || 'NEW CHARGE'}</span>
        <input type="text" class="charge-name-input" value="${name}" placeholder="Charge Name" style="width:120px;font-weight:600;text-transform:uppercase;" oninput="this.value = this.value.toUpperCase(); onTruckInput();">
        <input type="number" class="charge-amt" value="${amount}" step="0.01" placeholder="0.00" oninput="onTruckInput()">
        <button class="charge-del" onclick="removeTruckingAdditionalRow(this)">×</button>
    `;
    container.appendChild(row);
    enableTruckingDragDrop();
    onTruckInput();
}

function removeTruckingAdditionalRow(btn) {
    const row = btn.closest('.truck-additional-row');
    if (document.querySelectorAll('#truck-additional-container .truck-additional-row').length > 1) {
        row.remove();
        onTruckInput();
    } else {
        alert('You must keep at least one additional charge row.');
    }
}

let truckDragData = null;

function enableTruckingDragDrop() {
    document.querySelectorAll('#truck-additional-container .truck-additional-row').forEach(row => {
        row.addEventListener('dragstart', function(e) {
            truckDragData = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        row.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            document.querySelectorAll('#truck-additional-container .truck-additional-row').forEach(r => r.classList.remove(
            'drag-over'));
        });
        row.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        row.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });
        row.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            if (truckDragData && truckDragData !== this) {
                const container = document.getElementById('truck-additional-container');
                const children = Array.from(container.children);
                const srcIdx = children.indexOf(truckDragData);
                const tgtIdx = children.indexOf(this);
                if (srcIdx < tgtIdx) {
                    container.insertBefore(truckDragData, this.nextSibling);
                } else {
                    container.insertBefore(truckDragData, this);
                }
                truckDragData = null;
                onTruckInput();
            }
        });
    });
}

function getTruckingFormData() {
    const data = {
        origin: document.getElementById('truck-origin').value.trim().toUpperCase(),
        destination: document.getElementById('truck-dest').value.trim().toUpperCase(),
        inventory: parseInt(document.getElementById('truck-inventory').value) || 1,
        miles: parseFloat(document.getElementById('truck-miles').value) || 0,
        perMile: parseFloat(document.getElementById('truck-per-mile').value) || 0,
        minimum: parseFloat(document.getElementById('truck-minimum').value) || 0,
        chassisDays: parseInt(document.getElementById('truck-chassis-days').value) || 2,
        additional: []
    };
    document.querySelectorAll('#truck-additional-container .truck-additional-row').forEach(row => {
        const name = row.querySelector('.charge-name-input').value.trim().toUpperCase();
        const amount = parseFloat(row.querySelector('.charge-amt').value) || 0;
        data.additional.push({ name, amount });
    });
    const totals = calcTruckingTotals();
    data.regularTotal = totals.regTotal;
    data.additionalTotal = totals.addTotal;
    data.grandTotal = totals.grand;
    data.timestamp = new Date().toISOString();
    data.lastModified = data.timestamp;
    return data;
}

function loadTruckingForm(data) {
    document.getElementById('truck-origin').value = data.origin || '';
    document.getElementById('truck-dest').value = data.destination || '';
    document.getElementById('truck-inventory').value = data.inventory || 1;
    document.getElementById('truck-miles').value = data.miles || 0;
    document.getElementById('truck-per-mile').value = data.perMile || 0;
    document.getElementById('truck-minimum').value = data.minimum || 0;
    document.getElementById('truck-chassis-days').value = data.chassisDays || 2;
    buildTruckingAdditionalRows(data.additional || []);
    onTruckInput();
}

function saveTruckingShipment() {
    const data = getTruckingFormData();
    if (!data.origin || !data.destination) {
        alert('Please fill Origin and Destination.');
        return;
    }
    const editId = document.getElementById('trucking-edit-id').value;
    if (editId) {
        const idx = db.truckingShipments.findIndex(s => s.id === editId);
        if (idx !== -1) {
            data.id = editId;
            data.createdAt = db.truckingShipments[idx].createdAt || data.timestamp;
            db.truckingShipments[idx] = data;
            document.getElementById('trucking-edit-id').value = '';
        } else {
            alert('Record not found.');
            return;
        }
    } else {
        data.id = 'TR-' + Date.now().toString(36).toUpperCase();
        data.createdAt = data.timestamp;
        data.status = 'Active';
        db.truckingShipments.push(data);
    }
    saveDB();
    renderTruckingList();
    alert('Trucking shipment saved!');
    clearTruckingForm();
    autoBackup();
}

function clearTruckingForm() {
    document.getElementById('truck-origin').value = '';
    document.getElementById('truck-dest').value = '';
    document.getElementById('truck-inventory').value = 1;
    document.getElementById('truck-miles').value = '';
    document.getElementById('truck-per-mile').value = '';
    document.getElementById('truck-minimum').value = '';
    document.getElementById('truck-chassis-days').value = 2;
    document.getElementById('trucking-edit-id').value = '';
    buildTruckingAdditionalRows();
    onTruckInput();
}

function renderTruckingList() {
    const search = (document.getElementById('truck-search').value || '').toLowerCase();
    const statusFilter = document.getElementById('truck-status-filter').value;
    const sort = document.getElementById('truck-sort').value;
    const perPage = parseInt(document.getElementById('truck-per-page').value) || 10;
    let shipments = db.truckingShipments || [];
    shipments = shipments.filter(s => {
        const text = `${s.origin} ${s.destination}`.toLowerCase();
        if (search && !text.includes(search)) return false;
        if (statusFilter && s.status !== statusFilter) return false;
        return true;
    });
    shipments.sort((a, b) => {
        switch (sort) {
            case 'date-desc':
                return new Date(b.timestamp) - new Date(a.timestamp);
            case 'date-asc':
                return new Date(a.timestamp) - new Date(b.timestamp);
            case 'origin':
                return (a.origin || '').localeCompare(b.origin || '');
            default:
                return 0;
        }
    });
    const total = shipments.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    let page = parseInt(sessionStorage.getItem('truckPage') || '1');
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    sessionStorage.setItem('truckPage', String(page));
    const start = (page - 1) * perPage;
    const pageData = shipments.slice(start, start + perPage);
    const list = document.getElementById('trucking-list');
    if (total === 0) {
        list.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center;">No trucking shipments found.</p>';
        document.getElementById('trucking-pagination').innerHTML = '';
        return;
    }
    list.innerHTML = pageData.map((s, i) => {
        const realIdx = db.truckingShipments.indexOf(s);
        const statusClass = s.status === 'Active' ? 'status-active' : s.status === 'Completed' ? 'status-expiring' :
            'status-expired';
        return `<div class="truck-shipment-card">
            <div class="info">
                <h4>${s.origin} → ${s.destination}</h4>
                <p>Inventory: ${s.inventory} | Miles: ${s.miles} | Grand Total: ${formatUSD(s.grandTotal)}</p>
                <p>Status: <span class="status-badge ${statusClass}">${s.status}</span> | Saved: ${new Date(s.timestamp).toLocaleDateString('en-IN')}</p>
            </div>
            <div class="actions">
                <button class="btn btn-sm btn-preview" onclick="previewTruckingShipment(${realIdx})">👁</button>
                <button class="btn btn-sm btn-preview" onclick="editTruckingShipment(${realIdx})">✏️</button>
                <button class="btn btn-sm btn-duplicate" onclick="duplicateTruckingShipment(${realIdx})">📋</button>
                <button class="btn btn-sm btn-clear" onclick="deleteTruckingShipment(${realIdx})">×</button>
            </div>
        </div>`;
    }).join('');
    const pag = document.getElementById('trucking-pagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    let pagHtml = `<button class="page-btn" onclick="changeTruckingPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>`;
    pagHtml += `<span class="page-info">Page ${page} of ${totalPages} (${total} records)</span>`;
    pagHtml += `<button class="page-btn" onclick="changeTruckingPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;
    pag.innerHTML = pagHtml;
}

function changeTruckingPage(page) {
    sessionStorage.setItem('truckPage', String(page));
    renderTruckingList();
}

function clearTruckingFilters() {
    document.getElementById('truck-search').value = '';
    document.getElementById('truck-status-filter').value = '';
    document.getElementById('truck-sort').value = 'date-desc';
    document.getElementById('truck-per-page').value = '10';
    sessionStorage.setItem('truckPage', '1');
    renderTruckingList();
}

function editTruckingShipment(idx) {
    const s = db.truckingShipments[idx];
    if (!s) return alert('Shipment not found.');
    loadTruckingForm(s);
    document.getElementById('trucking-edit-id').value = s.id;
    document.getElementById('calc-us-trucking').scrollIntoView({ behavior: 'smooth' });
}

function duplicateTruckingShipment(idx) {
    const s = db.truckingShipments[idx];
    if (!s) return alert('Shipment not found.');
    const copy = JSON.parse(JSON.stringify(s));
    copy.id = 'TR-' + Date.now().toString(36).toUpperCase();
    copy.timestamp = new Date().toISOString();
    copy.lastModified = copy.timestamp;
    copy.status = 'Active';
    delete copy._id;
    db.truckingShipments.push(copy);
    saveDB();
    renderTruckingList();
    alert('Shipment duplicated!');
    autoBackup();
}

function deleteTruckingShipment(idx) {
    const s = db.truckingShipments[idx];
    if (!s) return alert('Shipment not found.');
    if (confirm(`Delete trucking shipment "${s.origin} → ${s.destination}"?`)) {
        db.truckingShipments.splice(idx, 1);
        saveDB();
        renderTruckingList();
        autoBackup();
    }
}

function duplicateTruckingCurrent() {
    const data = getTruckingFormData();
    if (!data.origin || !data.destination) {
        alert('Please fill Origin and Destination.');
        return;
    }
    data.id = 'TR-' + Date.now().toString(36).toUpperCase();
    data.timestamp = new Date().toISOString();
    data.lastModified = data.timestamp;
    data.status = 'Active';
    db.truckingShipments.push(data);
    saveDB();
    renderTruckingList();
    alert('Current form duplicated and saved!');
    autoBackup();
}

function previewTruckingShipment(idx = null) {
    let data;
    if (idx !== null) {
        data = db.truckingShipments[idx];
        if (!data) return alert('Shipment not found.');
    } else {
        data = getTruckingFormData();
        if (!data.origin || !data.destination) {
            alert('Please fill Origin and Destination.');
            return;
        }
    }
    const html = buildTruckingPreviewHTML(data);
    document.getElementById('modal-title').textContent = 'Trucking Shipment Preview';
    document.getElementById('previewBody').innerHTML = html;
    openModal('previewModal');
}

function buildTruckingPreviewHTML(data) {
    const addRows = data.additional.map(a =>
        `<tr><td>${a.name}</td><td style="text-align:right;">${formatUSD(a.amount)}</td></tr>`).join('');
    return `
        <div style="background:#ffffff;color:#1a1a1a;font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:10px;">
            <h3 style="color:var(--primary);border-bottom:2px solid var(--primary);padding-bottom:6px;">🚛 US Trucking Shipment</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <tr><td style="padding:4px 8px;font-weight:bold;">Origin</td><td>${data.origin}</td><td style="padding:4px 8px;font-weight:bold;">Destination</td><td>${data.destination}</td></tr>
                <tr><td style="padding:4px 8px;font-weight:bold;">Inventory</td><td>${data.inventory}</td><td style="padding:4px 8px;font-weight:bold;">Miles</td><td>${data.miles}</td></tr>
                <tr><td style="padding:4px 8px;font-weight:bold;">Per Mile</td><td>${formatUSD(data.perMile)}</td><td style="padding:4px 8px;font-weight:bold;">Minimum</td><td>${formatUSD(data.minimum)}</td></tr>
                <tr><td style="padding:4px 8px;font-weight:bold;">Chassis Days</td><td>${data.chassisDays}</td><td style="padding:4px 8px;font-weight:bold;">Chassis Cost</td><td>${formatUSD(45 * data.chassisDays * data.inventory)}</td></tr>
            </table>
            <h4 style="color:var(--primary);margin-top:12px;">Regular Total: ${formatUSD(data.regularTotal)}</h4>
            <h4 style="color:var(--accent);margin-top:8px;">Additional Services</h4>
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <thead><tr style="background:#1e3a8a;color:white;"><th style="padding:4px 8px;text-align:left;">Service</th><th style="padding:4px 8px;text-align:right;">Amount</th></tr></thead>
                <tbody>${addRows || '<tr><td colspan="2" style="padding:4px 8px;text-align:center;color:var(--text-light);">No additional services</td></tr>'}</tbody>
                <tfoot><tr style="background:#f1f5f9;"><td style="padding:4px 8px;font-weight:bold;">Additional Total</td><td style="padding:4px 8px;text-align:right;font-weight:bold;">${formatUSD(data.additionalTotal)}</td></tr></tfoot>
            </table>
            <div style="margin-top:12px;background:#10b981;color:white;padding:8px;text-align:center;font-weight:bold;border-radius:4px;">
                GRAND TOTAL: ${formatUSD(data.grandTotal)}
            </div>
            <p style="margin-top:12px;font-size:0.7rem;color:var(--text-light);text-align:center;">Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
    `;
}

function downloadTruckingPDF(idx = null) {
    let data;
    if (idx !== null) {
        data = db.truckingShipments[idx];
        if (!data) return alert('Shipment not found.');
    } else {
        data = getTruckingFormData();
        if (!data.origin || !data.destination) {
            alert('Please fill Origin and Destination.');
            return;
        }
    }
    const html = buildTruckingPreviewHTML(data);
    const renderArea = document.getElementById('pdf-render-area');
    renderArea.innerHTML = html;
    renderArea.style.cssText = 'position:fixed;left:0;top:0;width:800px;background:white;z-index:9999;opacity:1;padding:10px;';
    setTimeout(() => {
        html2canvas(renderArea, { scale: 1, useCORS: true, backgroundColor: '#ffffff' })
            .then(canvas => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                let imgWidth = pdfWidth - 2 * margin;
                let imgHeight = (canvas.height * imgWidth) / canvas.width;
                const maxHeight = pdfHeight - 2 * margin;
                if (imgHeight > maxHeight) { const scale = maxHeight / imgHeight;
                    imgWidth *= scale;
                    imgHeight *= scale; }
                const x = (pdfWidth - imgWidth) / 2;
                const y = (pdfHeight - imgHeight) / 2;
                pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
                pdf.save(`Trucking_${data.origin}_${data.destination}.pdf`);
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = '';
            }).catch(err => {
                console.error(err);
                alert('PDF generation failed.');
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = '';
            });
    }, 500);
}

// ==================== OOG & OT (OVER DIMENSION / OVERWEIGHT) ====================
const oogContainerData = [
    { type: "20 GP", internal: { l: 5.898, w: 2.352, h: 2.393 }, door: { w: 2.340, h: 2.280 }, maxWeight: 28200 },
    { type: "40 GP", internal: { l: 12.032, w: 2.352, h: 2.393 }, door: { w: 2.340, h: 2.280 }, maxWeight: 26580 },
    { type: "40 HC", internal: { l: 12.032, w: 2.352, h: 2.698 }, door: { w: 2.340, h: 2.580 }, maxWeight: 26480 },
    { type: "20 RF", internal: { l: 5.444, w: 2.286, h: 2.275 }, door: { w: 2.280, h: 2.220 }, maxWeight: 27700 },
    { type: "40 RF", internal: { l: 11.572, w: 2.286, h: 2.275 }, door: { w: 2.280, h: 2.220 }, maxWeight: 26500 },
    { type: "20 TK", internal: { l: 5.898, w: 2.352, h: 2.393 }, door: { w: 2.340, h: 2.280 }, maxWeight: 24000 },
    { type: "40 TK", internal: { l: 12.032, w: 2.352, h: 2.393 }, door: { w: 2.340, h: 2.280 }, maxWeight: 26000 }
];

function populateOOGContainerDropdown() {
    console.log("▶️ populateOOGContainerDropdown started");
    const sel = document.getElementById('oog-container');
    if (!sel) {
        console.error("❌ Element #oog-container not found in HTML!");
        return;
    }
    let containerList = [];
    if (db.containerDimensions && db.containerDimensions.length > 0) {
        console.log("✅ Found db.containerDimensions with", db.containerDimensions.length, "items");
        containerList = db.containerDimensions.map(c => c.type);
        console.log("   Container types:", containerList);
    } else {
        console.warn("⚠️ db.containerDimensions is empty or missing. Using fallback list.");
        containerList = ["20 GP", "40 GP", "40 HC", "20 RF", "40 RF", "20 TK", "40 TK"];
    }
    sel.innerHTML = '<option value="">Select Container</option>' +
        containerList.map(t => `<option value="${t}">${t}</option>`).join('');
    console.log("✅ Dropdown populated with", containerList.length, "options");
}

const doorDimMap = {
    "20 GP": { w: 2.340, h: 2.280 },
    "40 GP": { w: 2.340, h: 2.280 },
    "40 HC": { w: 2.340, h: 2.580 },
    "20 RF": { w: 2.280, h: 2.220 },
    "40 RF": { w: 2.280, h: 2.220 },
    "20 TK": { w: 2.340, h: 2.280 },
    "40 TK": { w: 2.340, h: 2.280 }
};

function parseDim(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
}

function parseWeight(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/[^0-9.]/g, '')) || 0;
}

function calcOOG() {
    const containerType = document.getElementById('oog-container').value;
    const unit = document.getElementById('oog-unit').value;
    const cargoL = parseFloat(document.getElementById('oog-length').value) || 0;
    const cargoW = parseFloat(document.getElementById('oog-width').value) || 0;
    const cargoH = parseFloat(document.getElementById('oog-height').value) || 0;
    const cargoWeight = parseFloat(document.getElementById('oog-weight').value) || 0;
    let factor = 1;
    if (unit === 'cm') factor = 0.01;
    else if (unit === 'inch') factor = 0.0254;
    const cargoLm = cargoL * factor;
    const cargoWm = cargoW * factor;
    const cargoHm = cargoH * factor;
    let containerData = null;
    if (db.containerDimensions && db.containerDimensions.length) {
        containerData = db.containerDimensions.find(c => c.type === containerType);
    }
    if (!containerData) {
        const fallback = oogContainerData.find(c => c.type === containerType);
        if (fallback) {
            containerData = {
                type: fallback.type,
                length: fallback.internal.l,
                width: fallback.internal.w,
                height: fallback.internal.h,
                maxWeight: fallback.maxWeight
            };
        }
    }
    const resultArea = document.getElementById('oog-result-area');
    if (!containerType || !containerData) {
        resultArea.innerHTML =
            '<div class="modern-section" style="padding:20px;text-align:center;color:var(--text-light);">⚠️ Please select a container type.</div>';
        return;
    }
    const intL = parseDim(containerData.length);
    const intW = parseDim(containerData.width);
    const intH = parseDim(containerData.height);
    const maxWt = parseWeight(containerData.maxWeight);
    const door = doorDimMap[containerType] || { w: 0, h: 0 };
    const hasDoorData = door.w > 0 && door.h > 0;
    const intL_ok = cargoLm <= intL;
    const intW_ok = cargoWm <= intW;
    const intH_ok = cargoHm <= intH;
    const doorW_ok = hasDoorData ? (cargoWm <= door.w) : true;
    const doorH_ok = hasDoorData ? (cargoHm <= door.h) : true;
    const isOOG = !intL_ok || !intW_ok || !intH_ok || !doorW_ok || !doorH_ok;
    const isOT = cargoWeight > maxWt;

    function formatDimUnit(meters) {
        let val = meters;
        let unitLabel = 'm';
        if (unit === 'cm') { val = meters * 100;
            unitLabel = 'cm'; } else if (unit === 'inch') { val = meters / 0.0254;
            unitLabel = 'in'; }
        return val.toFixed(2) + ' ' + unitLabel;
    }
    const limitL = formatDimUnit(intL);
    const limitW_int = formatDimUnit(intW);
    const limitH_int = formatDimUnit(intH);
    const cL = formatDimUnit(cargoLm);
    const cW = formatDimUnit(cargoWm);
    const cH = formatDimUnit(cargoHm);
    let statusText = '',
        colorClass = '';
    if (isOOG && isOT) { statusText = '❌ OVER DIMENSION & OVERWEIGHT';
        colorClass = 'modern-footer-red'; } else if (isOOG) { statusText = '⚠️ OVER DIMENSION (OOG)';
        colorClass = 'modern-footer-orange'; } else if (isOT) { statusText = '⚠️ OVERWEIGHT (OT)';
        colorClass = 'modern-footer-orange'; } else { statusText = '✅ STANDARD FIT – NO OOG / OT';
        colorClass = 'modern-footer-green'; }
    let html = `
    <div class="modern-section">
        <div class="modern-section-title"><span>📦 Container & Cargo Breakdown</span></div>
        <table class="modern-table">
            <thead><tr><th>Component</th><th>Details / Limit</th><th>Your Cargo</th></tr></thead>
            <tbody>
                <tr><td><span class="badge badge-blue">CTR</span> Container</td><td>${containerType}</td><td class="text-muted">Internal: ${limitL} x ${limitW_int} x ${limitH_int}</td></tr>
                <tr><td><span class="badge badge-yellow">DOOR</span> Door</td><td>${hasDoorData ? formatDimUnit(door.w) + ' x ' + formatDimUnit(door.h) : 'N/A'}</td><td class="text-muted">Max Payload: ${maxWt.toLocaleString()} KGS</td></tr>
                <tr><td><span class="badge badge-purple">LEN</span> Length</td><td>${limitL}</td><td>${cL}</td></tr>
                <tr><td><span class="badge badge-purple">WID</span> Width</td><td>${limitW_int}</td><td>${cW}</td></tr>
                <tr><td><span class="badge badge-purple">HGT</span> Height</td><td>${limitH_int}</td><td>${cH}</td></tr>
                <tr><td><span class="badge badge-red">WGT</span> Weight</td><td>${maxWt.toLocaleString()} KGS</td><td>${cargoWeight.toLocaleString()} KGS</td></tr>
            </tbody>
        </table>
    </div>
    <div class="modern-section">
        <div class="modern-section-title"><span>📊 OOG / OT Analysis</span></div>
        <table class="modern-table">
            <thead><tr><th>Check</th><th>Container Limit</th><th>Your Cargo</th><th>Status</th></tr></thead>
            <tbody>
                <tr><td>Length</td><td>${limitL}</td><td>${cL}</td><td><span class="badge ${intL_ok ? 'badge-green' : 'badge-red'}">${intL_ok ? '✅ Fit' : '❌ Exceed'}</span></td></tr>
                <tr><td>Width (Int)</td><td>${limitW_int}</td><td>${cW}</td><td><span class="badge ${intW_ok ? 'badge-green' : 'badge-red'}">${intW_ok ? '✅ Fit' : '❌ Exceed'}</span></td></tr>
                <tr><td>Height (Int)</td><td>${limitH_int}</td><td>${cH}</td><td><span class="badge ${intH_ok ? 'badge-green' : 'badge-red'}">${intH_ok ? '✅ Fit' : '❌ Exceed'}</span></td></tr>
                <tr><td>Weight</td><td>${maxWt.toLocaleString()} KGS</td><td>${cargoWeight.toLocaleString()} KGS</td><td><span class="badge ${!isOT ? 'badge-green' : 'badge-red'}">${!isOT ? '✅ Fit' : '❌ Overweight'}</span></td></tr>
            </tbody>
            <tfoot><tr class="${colorClass}"><td colspan="4" class="text-center">${statusText}</td></tr></tfoot>
        </table>
    </div>
    `;
    resultArea.innerHTML = html;
}

function migrateOOGContainers() {
    if (!db.containerDimensions) {
        db.containerDimensions = JSON.parse(JSON.stringify(defaultContainerDimensions));
    }
    db.containerDimensions.forEach(c => {
        if (!c.tareWeight) c.tareWeight = "0 kg";
        if (!c.unit) {
            let match = String(c.length).match(/[a-zA-Z]+$/);
            c.unit = match ? match[0] : 'm';
            c.length = parseDim(c.length);
            c.width = parseDim(c.width);
            c.height = parseDim(c.height);
            c.maxWeight = parseWeight(c.maxWeight);
            c.cbm = parseDim(c.cbm);
        }
    });
    saveDB();
}

function renderOOGContainerTable() {
    const tbody = document.getElementById('oog-container-tbody');
    if (!tbody) return;
    migrateOOGContainers();
    tbody.innerHTML = db.containerDimensions.map((c, i) => {
        const unitOpts = ['m', 'cm', 'inch'].map(u =>
            `<option value="${u}" ${c.unit === u ? 'selected' : ''}>${u}</option>`
        ).join('');
        return `<tr data-index="${i}">
            <td style="text-align:center;font-weight:600;">${i+1}</td>
            <td><input type="text" class="oog-edit-type" value="${c.type}" placeholder="e.g. 45 GP"></td>
            <td><input type="number" step="0.001" class="oog-edit-length" value="${c.length}" placeholder="0.00"></td>
            <td><input type="number" step="0.001" class="oog-edit-width" value="${c.width}" placeholder="0.00"></td>
            <td><input type="number" step="0.001" class="oog-edit-height" value="${c.height}" placeholder="0.00"></td>
            <td><input type="text" class="oog-edit-tare" value="${c.tareWeight}" placeholder="e.g. 2,280 kg"></td>
            <td><input type="text" class="oog-edit-maxwt" value="${c.maxWeight}" placeholder="e.g. 28,200 kg"></td>
            <td><input type="number" step="0.01" class="oog-edit-cbm" value="${c.cbm}" placeholder="0.00"></td>
            <td><select class="oog-edit-unit">${unitOpts}</select></td>
            <td style="text-align:center;"><button class="btn btn-sm btn-clear" onclick="deleteOOGContainerRow(${i})">×</button></td>
        </tr>`;
    }).join('');
}

function addOOGContainerRow() {
    const tbody = document.getElementById('oog-container-tbody');
    const newRow = document.createElement('tr');
    const newIndex = tbody.children.length;
    newRow.innerHTML = `
        <td style="text-align:center;font-weight:600;">${newIndex+1}</td>
        <td><input type="text" class="oog-edit-type" value="NEW" placeholder="e.g. 45 GP"></td>
        <td><input type="number" step="0.001" class="oog-edit-length" value="0" placeholder="0.00"></td>
        <td><input type="number" step="0.001" class="oog-edit-width" value="0" placeholder="0.00"></td>
        <td><input type="number" step="0.001" class="oog-edit-height" value="0" placeholder="0.00"></td>
        <td><input type="text" class="oog-edit-tare" value="0 kg" placeholder="e.g. 2,280 kg"></td>
        <td><input type="text" class="oog-edit-maxwt" value="0 kg" placeholder="e.g. 28,200 kg"></td>
        <td><input type="number" step="0.01" class="oog-edit-cbm" value="0" placeholder="0.00"></td>
        <td><select class="oog-edit-unit"><option value="m">m</option><option value="cm">cm</option><option value="inch">inch</option></select></td>
        <td style="text-align:center;"><button class="btn btn-sm btn-clear" onclick="deleteOOGContainerRow(${newIndex})">×</button></td>
    `;
    tbody.appendChild(newRow);
}

function deleteOOGContainerRow(index) {
    if (!confirm('Delete this container dimension?')) return;
    const rows = document.querySelectorAll('#oog-container-tbody tr');
    if (rows[index]) rows[index].remove();
    document.querySelectorAll('#oog-container-tbody tr').forEach((row, i) => {
        row.querySelector('td:first-child').textContent = i + 1;
    });
}

function saveOOGContainers() {
    const newData = [];
    document.querySelectorAll('#oog-container-tbody tr').forEach(row => {
        const type = row.querySelector('.oog-edit-type').value.trim();
        const length = parseFloat(row.querySelector('.oog-edit-length').value) || 0;
        const width = parseFloat(row.querySelector('.oog-edit-width').value) || 0;
        const height = parseFloat(row.querySelector('.oog-edit-height').value) || 0;
        const tareWeight = row.querySelector('.oog-edit-tare').value.trim() || '0 kg';
        const maxWeight = row.querySelector('.oog-edit-maxwt').value.trim() || '0 kg';
        const cbm = parseFloat(row.querySelector('.oog-edit-cbm').value) || 0;
        const unit = row.querySelector('.oog-edit-unit').value;
        if (type) {
            newData.push({ type, length, width, height, tareWeight, maxWeight, cbm, unit });
        }
    });
    if (newData.length === 0) {
        alert('At least one valid container must exist.');
        return;
    }
    db.containerDimensions = newData;
    saveDB();
    populateOOGContainerDropdown();
    renderOOGContainerTable();
    calcOOG();
    alert('✅ Container dimensions saved successfully!');
    autoBackup();
}

// ==================== DETENTION & DEMURRAGE (5 SLAB PROGRESSIVE) ====================
if (!db.detentionLots) db.detentionLots = [];
if (!db.detentionRecords) db.detentionRecords = [];

const defaultDetentionSlabs = [
    { from: 1, to: 5, rate: 10 },
    { from: 6, to: 10, rate: 30 },
    { from: 11, to: 20, rate: 50 },
    { from: 21, to: 30, rate: 70 },
    { from: 31, to: 999, rate: 100 }
];

const defaultDetentionLots = [
    { id: 'lot-1', name: '20 GP Standard', freeDays: 5, slabs: JSON.parse(JSON.stringify(defaultDetentionSlabs)) },
    { id: 'lot-2', name: '40 GP Standard', freeDays: 5, slabs: JSON.parse(JSON.stringify(defaultDetentionSlabs)) },
    { id: 'lot-3', name: '40 HC Standard', freeDays: 5, slabs: JSON.parse(JSON.stringify(defaultDetentionSlabs)) },
    { id: 'lot-4', name: 'Reefer 20 RF', freeDays: 3, slabs: JSON.parse(JSON.stringify(defaultDetentionSlabs)) },
    { id: 'lot-5', name: 'Reefer 40 RF', freeDays: 3, slabs: JSON.parse(JSON.stringify(defaultDetentionSlabs)) }
];

function renderDetentionSlabs(slabs) {
    const container = document.getElementById('det-slabs-rows');
    if (!container) return;
    let displaySlabs = slabs || defaultDetentionSlabs;
    if (!displaySlabs || displaySlabs.length !== 5) {
        displaySlabs = JSON.parse(JSON.stringify(defaultDetentionSlabs));
    }
    container.innerHTML = displaySlabs.map((s, i) => `
        <div style="display:grid;grid-template-columns:80px 80px 1fr 1fr;gap:6px;margin-bottom:4px;align-items:center;">
            <span style="font-weight:600;font-size:0.8rem;color:var(--text);padding:4px 8px;">Slab ${i+1}</span>
            <input type="number" class="det-slab-from" value="${s.from}" min="1" style="padding:4px 6px;border:1px solid var(--border);border-radius:4px;width:100%;" oninput="calcDetention()" />
            <input type="number" class="det-slab-to" value="${s.to}" min="1" style="padding:4px 6px;border:1px solid var(--border);border-radius:4px;width:100%;" oninput="calcDetention()" />
            <input type="number" class="det-slab-rate" value="${s.rate}" step="0.01" style="padding:4px 6px;border:1px solid var(--border);border-radius:4px;width:100%;" oninput="calcDetention()" />
        </div>
    `).join('');
}

function populateDetentionLotDropdown() {
    const sel = document.getElementById('det-lot');
    if (!sel) return;
    if (!db.detentionLots || db.detentionLots.length === 0) {
        db.detentionLots = JSON.parse(JSON.stringify(defaultDetentionLots));
        saveDB();
    }
    sel.innerHTML = '<option value="">Select a Lot or Custom</option>' +
        db.detentionLots.map(l => `<option value="${l.id}">${l.name} (${l.freeDays}d free)</option>`).join('');
}

function onDetLotChange() {
    const sel = document.getElementById('det-lot');
    const selected = sel.options[sel.selectedIndex];
    if (selected && selected.value) {
        const lot = db.detentionLots.find(l => l.id === selected.value);
        if (lot) {
            document.getElementById('det-free-days').value = lot.freeDays;
            renderDetentionSlabs(lot.slabs);
        }
    } else {
        document.getElementById('det-free-days').value = '';
        renderDetentionSlabs(defaultDetentionSlabs);
    }
    calcDetention();
}

function calculateProgressiveCost(chargeableDays, slabs) {
    if (!chargeableDays || chargeableDays <= 0) return 0;
    let total = 0;
    const sortedSlabs = [...slabs].sort((a, b) => a.from - b.from);
    for (let d = 1; d <= chargeableDays; d++) {
        let rate = 0;
        for (let s of sortedSlabs) {
            if (d >= s.from && d <= s.to) {
                rate = s.rate;
                break;
            }
        }
        if (rate === 0 && sortedSlabs.length > 0) {
            rate = sortedSlabs[sortedSlabs.length - 1].rate;
        }
        total += rate;
    }
    return total;
}

function calcDetention() {
    const pickup = document.getElementById('det-pickup').value;
    const ret = document.getElementById('det-return').value;
    const freeDays = parseInt(document.getElementById('det-free-days').value) || 0;
    const currency = document.getElementById('det-currency').value;
    let slabs = [];
    document.querySelectorAll('#det-slabs-rows > div').forEach(row => {
        const from = parseInt(row.querySelector('.det-slab-from').value) || 1;
        const to = parseInt(row.querySelector('.det-slab-to').value) || 0;
        const rate = parseFloat(row.querySelector('.det-slab-rate').value) || 0;
        if (from > 0 && to >= from) slabs.push({ from, to, rate });
    });
    if (slabs.length === 0) slabs = JSON.parse(JSON.stringify(defaultDetentionSlabs));
    let totalDays = 0,
        chargeableDays = 0,
        totalUSD = 0,
        totalINR = 0,
        slabBreakdown = '';
    if (pickup && ret) {
        const p = new Date(pickup);
        const r = new Date(ret);
        if (r > p) {
            totalDays = Math.ceil((r - p) / (1000 * 60 * 60 * 24));
            chargeableDays = Math.max(0, totalDays - freeDays);
            totalUSD = calculateProgressiveCost(chargeableDays, slabs);
            const rate = currency === 'INR' ? 1 : (db.exchangeRates.USD || 94.5);
            totalINR = totalUSD * rate;
            const sortedSlabs = [...slabs].sort((a, b) => a.from - b.from);
            sortedSlabs.forEach(s => {
                const daysInSlab = Math.max(0, Math.min(chargeableDays, s.to) - s.from + 1);
                if (daysInSlab > 0) {
                    slabBreakdown +=
                        `<tr><td><span class="badge badge-yellow">SLB</span> Days ${s.from}-${s.to}</td><td class="text-right">${formatUSD(daysInSlab * s.rate)}</td><td class="text-right">${formatINR(daysInSlab * s.rate * rate)}</td></tr>`;
                }
            });
        }
    }
    const resultArea = document.getElementById('det-result-area');
    let html = `
    <div class="modern-section">
        <div class="modern-section-title"><span>⏳ Detention Breakdown</span></div>
        <table class="modern-table">
            <thead><tr><th>Component</th><th>Amount (USD)</th><th>Amount (INR)</th></tr></thead>
            <tbody>
                <tr><td><span class="badge badge-blue">DAY</span> Total Days Used</td><td class="text-right">${totalDays}</td><td class="text-right">${totalDays}</td></tr>
                <tr><td><span class="badge badge-green">FREE</span> Free Days</td><td class="text-right">${freeDays}</td><td class="text-right">${freeDays}</td></tr>
                <tr><td><span class="badge badge-red">CHG</span> Chargeable Days</td><td class="text-right">${chargeableDays}</td><td class="text-right">${chargeableDays}</td></tr>
                ${slabBreakdown || '<tr><td colspan="3" class="text-muted text-center">No chargeable days to display slabs</td></tr>'}
                <tr><td><span class="badge badge-purple">TOT</span> Total Charges</td><td class="text-right"><strong>${formatUSD(totalUSD)}</strong></td><td class="text-right"><strong>${formatINR(totalINR)}</strong></td></tr>
            </tbody>
            <tfoot><tr class="modern-footer-green"><td colspan="3" class="text-center">GRAND TOTAL: ${formatUSD(totalUSD)} / ${formatINR(totalINR)}</td></tr></tfoot>
        </table>
    </div>
    `;
    resultArea.innerHTML = html;
}

function clearDetentionForm() {
    document.getElementById('det-lot').value = '';
    document.getElementById('det-pickup').value = '';
    document.getElementById('det-return').value = '';
    document.getElementById('det-free-days').value = '';
    document.getElementById('det-edit-id').value = '';
    renderDetentionSlabs(defaultDetentionSlabs);
    calcDetention();
}

function openAddDetentionLotModal(editIdx = null) {
    const modalTitle = document.getElementById('modal-title');
    const body = document.getElementById('previewBody');
    let title = editIdx !== null ? 'Edit Lot' : 'Add New Lot';
    modalTitle.textContent = title;
    let lot = { name: '', freeDays: 5, slabs: JSON.parse(JSON.stringify(defaultDetentionSlabs)) };
    if (editIdx !== null && db.detentionLots[editIdx]) {
        lot = db.detentionLots[editIdx];
    }
    let slabHtml = lot.slabs.map((s, i) => `
        <div style="display:grid;grid-template-columns:80px 1fr 1fr 1fr;gap:6px;margin-bottom:4px;align-items:center;">
            <span style="font-weight:600;font-size:0.8rem;">Slab ${i+1}</span>
            <input type="number" class="modal-slab-from" value="${s.from}" min="1" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;" />
            <input type="number" class="modal-slab-to" value="${s.to}" min="1" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;" />
            <input type="number" class="modal-slab-rate" value="${s.rate}" step="0.01" style="width:100%;padding:4px;border:1px solid var(--border);border-radius:4px;" />
        </div>
    `).join('');
    body.innerHTML = `
        <div class="form-grid-2col">
            <div class="form-group" style="grid-column:1/-1;"><label>Lot Name *</label><input type="text" id="modal-det-lot-name" value="${lot.name}" placeholder="e.g. 20 GP Standard" /></div>
            <div class="form-group" style="grid-column:1/-1;"><label>Free Days</label><input type="number" id="modal-det-free" value="${lot.freeDays}" /></div>
        </div>
        <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
            <h4 style="color:var(--primary);font-size:0.9rem;margin-bottom:6px;">📈 Progressive Slabs (5 Lots)</h4>
            ${slabHtml}
        </div>
        <div style="margin-top:16px;text-align:right;display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-clear" onclick="closeModal('previewModal')">Cancel</button>
            <button class="btn btn-success" onclick="saveDetentionLot(${editIdx !== null ? editIdx : 'null'})">💾 Save Lot</button>
        </div>
    `;
    openModal('previewModal');
}

function saveDetentionLot(editIdx) {
    const name = document.getElementById('modal-det-lot-name').value.trim();
    const freeDays = parseInt(document.getElementById('modal-det-free').value) || 0;
    if (!name) return alert('Lot Name is required.');
    let slabs = [];
    document.querySelectorAll('#previewBody .modal-slab-from').forEach((el, i) => {
        const from = parseInt(el.value) || 1;
        const to = parseInt(document.querySelectorAll('#previewBody .modal-slab-to')[i].value) || 0;
        const rate = parseFloat(document.querySelectorAll('#previewBody .modal-slab-rate')[i].value) || 0;
        if (from > 0 && to >= from) slabs.push({ from, to, rate });
    });
    if (slabs.length !== 5) {
        alert('You must define exactly 5 slabs (From, To, Rate)');
        return;
    }
    if (editIdx !== null && editIdx >= 0) {
        db.detentionLots[editIdx] = { id: db.detentionLots[editIdx].id || 'lot-' + Date.now(), name, freeDays, slabs };
    } else {
        db.detentionLots.push({ id: 'lot-' + Date.now(), name, freeDays, slabs });
    }
    saveDB();
    closeModal('previewModal');
    renderDetentionLots();
    populateDetentionLotDropdown();
    alert('Lot saved with 5 slabs!');
    autoBackup();
}

function deleteDetentionLot(idx) {
    if (!confirm('Delete this lot?')) return;
    db.detentionLots.splice(idx, 1);
    saveDB();
    renderDetentionLots();
    populateDetentionLotDropdown();
    autoBackup();
}

function renderDetentionLots() {
    const container = document.getElementById('det-lot-list');
    if (!container) return;
    if (db.detentionLots.length === 0) {
        container.innerHTML =
            '<p style="color:var(--text-light);padding:10px;text-align:center;">No lots defined. Click "Add New Lot" to create one.</p>';
        return;
    }
    container.innerHTML = db.detentionLots.map((l, i) => `
        <div class="det-lot-card">
            <div class="lot-info">
                <h4>${l.name}</h4>
                <p>Free: ${l.freeDays} days | 5 Progressive Slabs</p>
            </div>
            <div style="display:flex;gap:4px;">
                <button class="btn btn-sm btn-preview" onclick="openAddDetentionLotModal(${i})">✏️</button>
                <button class="btn btn-sm btn-clear" onclick="deleteDetentionLot(${i})">×</button>
            </div>
        </div>
    `).join('');
}

function getDetentionFormData() {
    const lotName = document.getElementById('det-lot').selectedIndex > 0 ? document.getElementById('det-lot').value :
        'Custom';
    const pickup = document.getElementById('det-pickup').value;
    const ret = document.getElementById('det-return').value;
    const freeDays = parseInt(document.getElementById('det-free-days').value) || 0;
    let slabs = [];
    document.querySelectorAll('#det-slabs-rows > div').forEach(row => {
        const from = parseInt(row.querySelector('.det-slab-from').value) || 1;
        const to = parseInt(row.querySelector('.det-slab-to').value) || 0;
        const rate = parseFloat(row.querySelector('.det-slab-rate').value) || 0;
        if (from > 0 && to >= from) slabs.push({ from, to, rate });
    });
    if (slabs.length !== 5) slabs = JSON.parse(JSON.stringify(defaultDetentionSlabs));
    const totalDays = parseInt(document.getElementById('det-total-days').textContent) || 0;
    const chargeableDays = parseInt(document.getElementById('det-chargeable-days').textContent) || 0;
    const totalUSD = parseFloat(document.getElementById('det-total-usd').textContent.replace(/[^0-9.-]/g, '')) || 0;
    const totalINR = parseFloat(document.getElementById('det-total-inr').textContent.replace(/[^0-9.-]/g, '')) || 0;
    return { lotName, pickup, ret, freeDays, slabs, totalDays, chargeableDays, totalUSD, totalINR, timestamp: new Date()
            .toISOString() };
}

function saveDetentionRecord() {
    const data = getDetentionFormData();
    if (!data.pickup || !data.ret) return alert('Please select Pickup and Return dates.');
    const editId = document.getElementById('det-edit-id').value;
    if (editId) {
        const idx = db.detentionRecords.findIndex(r => r.id === editId);
        if (idx !== -1) {
            data.id = editId;
            data.createdAt = db.detentionRecords[idx].createdAt || data.timestamp;
            db.detentionRecords[idx] = data;
            document.getElementById('det-edit-id').value = '';
        } else { alert('Record not found.');
            return; }
    } else {
        data.id = 'DD-' + Date.now().toString(36).toUpperCase();
        data.createdAt = data.timestamp;
        db.detentionRecords.push(data);
    }
    saveDB();
    renderDetentionRecords();
    alert('Detention record saved with progressive slabs!');
    clearDetentionForm();
    autoBackup();
}

function renderDetentionRecords() {
    const search = (document.getElementById('det-search').value || '').toLowerCase();
    const perPage = parseInt(document.getElementById('det-per-page').value) || 10;
    let records = db.detentionRecords || [];
    records = records.filter(r => {
        const text = `${r.lotName} ${r.pickup} ${r.ret}`.toLowerCase();
        return text.includes(search);
    });
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const total = records.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    let page = parseInt(sessionStorage.getItem('detPage') || '1');
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    sessionStorage.setItem('detPage', String(page));
    const start = (page - 1) * perPage;
    const pageData = records.slice(start, start + perPage);
    const list = document.getElementById('det-records-list');
    if (total === 0) { list.innerHTML =
            '<p style="color:var(--text-light);padding:20px;text-align:center;">No detention records found.</p>';
        document.getElementById('det-records-pagination').innerHTML = ''; return; }
    list.innerHTML = pageData.map((r, i) => {
        const realIdx = db.detentionRecords.indexOf(r);
        return `<div class="det-record-card">
            <div class="info">
                <h4>${r.lotName} (${r.pickup} → ${r.ret})</h4>
                <p>Free Days: ${r.freeDays} | Chargeable: ${r.chargeableDays} | Total: ${formatUSD(r.totalUSD)} / ${formatINR(r.totalINR)}</p>
                <p style="font-size:0.7rem;color:var(--text-light);">Saved: ${new Date(r.timestamp).toLocaleDateString('en-IN')}</p>
            </div>
            <div class="actions">
                <button class="btn btn-sm btn-preview" onclick="previewDetentionRecord(${realIdx})">👁</button>
                <button class="btn btn-sm btn-preview" onclick="editDetentionRecord(${realIdx})">✏️</button>
                <button class="btn btn-sm btn-duplicate" onclick="duplicateDetentionRecord(${realIdx})">📋</button>
                <button class="btn btn-sm btn-clear" onclick="deleteDetentionRecord(${realIdx})">×</button>
            </div>
        </div>`;
    }).join('');
    const pag = document.getElementById('det-records-pagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    pag.innerHTML =
        `<button class="page-btn" onclick="changeDetentionPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>
    <span class="page-info">Page ${page} of ${totalPages} (${total} records)</span>
    <button class="page-btn" onclick="changeDetentionPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;
}

function changeDetentionPage(page) { sessionStorage.setItem('detPage', String(page));
    renderDetentionRecords(); }

function clearDetentionFilters() { document.getElementById('det-search').value = '';
    document.getElementById('det-per-page').value = '10';
    sessionStorage.setItem('detPage', '1');
    renderDetentionRecords(); }

function editDetentionRecord(idx) {
    const r = db.detentionRecords[idx];
    if (!r) return alert('Record not found.');
    document.getElementById('det-lot').value = db.detentionLots.find(l => l.name === r.lotName)?.id || '';
    document.getElementById('det-pickup').value = r.pickup;
    document.getElementById('det-return').value = r.ret;
    document.getElementById('det-free-days').value = r.freeDays;
    renderDetentionSlabs(r.slabs || defaultDetentionSlabs);
    document.getElementById('det-edit-id').value = r.id;
    calcDetention();
    document.getElementById('calc-detention').scrollIntoView({ behavior: 'smooth' });
}

function duplicateDetentionRecord(idx) {
    const r = db.detentionRecords[idx];
    if (!r) return alert('Record not found.');
    const copy = JSON.parse(JSON.stringify(r));
    copy.id = 'DD-' + Date.now().toString(36).toUpperCase();
    copy.timestamp = new Date().toISOString();
    copy.createdAt = copy.timestamp;
    delete copy._id;
    db.detentionRecords.push(copy);
    saveDB();
    renderDetentionRecords();
    alert('Record duplicated!');
    autoBackup();
}

function deleteDetentionRecord(idx) {
    const r = db.detentionRecords[idx];
    if (!r) return alert('Record not found.');
    if (confirm(`Delete record "${r.lotName}"?`)) { db.detentionRecords.splice(idx, 1);
        saveDB();
        renderDetentionRecords();
        autoBackup(); }
}

function buildDetentionPreviewHTML(data) {
    const slabHtml = (data.slabs || defaultDetentionSlabs).map(s =>
        `<tr><td style="padding:2px 8px;">${s.from} - ${s.to}</td><td style="padding:2px 8px;text-align:right;">${formatUSD(s.rate)}</td></tr>`
    ).join('');
    return `
        <div style="background:#ffffff;color:#1a1a1a;font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:10px;">
            <h3 style="color:var(--primary);border-bottom:2px solid var(--primary);padding-bottom:6px;">⏳ Detention / Demurrage Report</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <tr><td style="padding:4px 8px;font-weight:bold;">Lot / Reference</td><td>${data.lotName}</td><td style="padding:4px 8px;font-weight:bold;">Pickup Date</td><td>${data.pickup}</td></tr>
                <tr><td style="padding:4px 8px;font-weight:bold;">Return Date</td><td>${data.ret}</td><td style="padding:4px 8px;font-weight:bold;">Free Days Allowed</td><td>${data.freeDays}</td></tr>
                <tr><td style="padding:4px 8px;font-weight:bold;">Total Days Used</td><td>${data.totalDays}</td><td style="padding:4px 8px;font-weight:bold;">Chargeable Days</td><td>${data.chargeableDays}</td></tr>
                <tr><td style="padding:4px 8px;font-weight:bold;">Total Charge (USD)</td><td>${formatUSD(data.totalUSD)}</td><td style="padding:4px 8px;font-weight:bold;">Total Charge (INR)</td><td>${formatINR(data.totalINR)}</td></tr>
            </table>
            <h4 style="color:var(--text-light);font-size:0.8rem;margin-top:12px;">📈 Progressive Slabs Used</h4>
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;border:1px solid var(--border);">
                <thead><tr style="background:#1e3a8a;color:white;"><th style="padding:4px 8px;">Days Range</th><th style="padding:4px 8px;text-align:right;">Rate / Day</th></tr></thead>
                <tbody>${slabHtml}</tbody>
            </table>
            <p style="margin-top:12px;font-size:0.7rem;color:var(--text-light);text-align:center;">Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
    `;
}

function previewDetentionRecord(idx = null) {
    let data;
    if (idx !== null) { data = db.detentionRecords[idx]; if (!data) return alert('Record not found.'); } else { data =
            getDetentionFormData(); if (!data.pickup || !data.ret) return alert('Please fill dates.'); }
    document.getElementById('modal-title').textContent = 'Detention / Demurrage Preview';
    document.getElementById('previewBody').innerHTML = buildDetentionPreviewHTML(data);
    openModal('previewModal');
}

function downloadDetentionPDF(idx = null) {
    let data;
    if (idx !== null) { data = db.detentionRecords[idx]; if (!data) return alert('Record not found.'); } else { data =
            getDetentionFormData(); if (!data.pickup || !data.ret) return alert('Please fill dates.'); }
    const html = buildDetentionPreviewHTML(data);
    const renderArea = document.getElementById('pdf-render-area');
    renderArea.innerHTML = html;
    renderArea.style.cssText = 'position:fixed;left:0;top:0;width:800px;background:white;z-index:9999;opacity:1;padding:10px;';
    setTimeout(() => {
        html2canvas(renderArea, { scale: 1, useCORS: true, backgroundColor: '#ffffff' })
            .then(canvas => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                let imgWidth = pdfWidth - 2 * margin;
                let imgHeight = (canvas.height * imgWidth) / canvas.width;
                const maxHeight = pdfHeight - 2 * margin;
                if (imgHeight > maxHeight) { const scale = maxHeight / imgHeight;
                    imgWidth *= scale;
                    imgHeight *= scale; }
                const x = (pdfWidth - imgWidth) / 2;
                const y = (pdfHeight - imgHeight) / 2;
                pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
                pdf.save(`Detention_${data.lotName}_${data.pickup}.pdf`);
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = '';
            }).catch(err => { console.error(err);
                alert('PDF generation failed.');
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = ''; });
    }, 500);
}

// ==================== MULTI-CARRIER FREIGHT CALCULATOR ====================
if (!db.freightCalculations) db.freightCalculations = [];

const defaultFreightCharges = [
    { name: 'OCEAN FREIGHT', unit: 'CTR', currency: 'USD', rate20: 4900, qty20: 1, rate40: 5000, qty40: 1 },
    { name: 'BUNKER SURCHARGE', unit: 'TEU', currency: 'USD', rate20: 16, qty20: 1, rate40: 32, qty40: 1 },
    { name: 'ETS', unit: 'TEU', currency: 'USD', rate20: 78, qty20: 1, rate40: 156, qty40: 1 },
    { name: 'EFS', unit: 'TEU', currency: 'USD', rate20: 125, qty20: 1, rate40: 250, qty40: 1 },
    { name: 'TERMINAL HANDLING', unit: 'CTR', currency: 'USD', rate20: 150, qty20: 1, rate40: 200, qty40: 1 },
    { name: 'DOCUMENTATION', unit: 'BL', currency: 'USD', rate20: 30, qty20: 1, rate40: 30, qty40: 1 },
    { name: 'SECURITY S/M', unit: 'BL', currency: 'USD', rate20: 25, qty20: 1, rate40: 25, qty40: 1 }
];

function renderFreightChargeRows(charges) {
    const tbody = document.getElementById('fr-charges-tbody');
    if (!tbody) return;
    const rows = charges || defaultFreightCharges;
    tbody.innerHTML = rows.map((c, i) => `
        <tr draggable="true" data-index="${i}" ondragstart="onFrRowDragStart(event)" ondragover="onFrRowDragOver(event)" ondragleave="onFrRowDragLeave(event)" ondrop="onFrRowDrop(event)">
            <td style="text-align:center;font-weight:600;">${i+1}</td>
            <td><input type="text" class="fr-charge-name" value="${c.name}" oninput="calcFreight()" placeholder="Charge Name" onfocus="highlightInput(this)" onblur="unhighlightInput(this)" /></td>
            <td>
                <select class="fr-charge-unit" onchange="calcFreight()" onfocus="highlightInput(this)" onblur="unhighlightInput(this)" style="text-align:center;width:100%;">
                    <option value="CNT" ${c.unit === 'CNT' ? 'selected' : ''}>CNT</option>
                    <option value="TEU" ${c.unit === 'TEU' ? 'selected' : ''}>TEU</option>
                </select>
            </td>
            <td>
                <select class="fr-charge-currency" onchange="calcFreight()" onfocus="highlightInput(this)" onblur="unhighlightInput(this)">
                    <option value="USD" ${c.currency === 'USD' ? 'selected' : ''}>USD</option>
                    <option value="INR" ${c.currency === 'INR' ? 'selected' : ''}>INR</option>
                </select>
            </td>
            <td><input type="number" class="fr-rate20" step="0.01" value="${c.rate20}" oninput="calcFreight()" onfocus="highlightInput(this)" onblur="unhighlightInput(this)" /></td>
            <td><input type="number" class="fr-qty20" step="1" value="${c.qty20}" min="0" oninput="calcFreight()" onfocus="highlightInput(this)" onblur="unhighlightInput(this)" /></td>
            <td><input type="number" class="fr-rate40" step="0.01" value="${c.rate40}" oninput="calcFreight()" onfocus="highlightInput(this)" onblur="unhighlightInput(this)" /></td>
            <td><input type="number" class="fr-qty40" step="1" value="${c.qty40}" min="0" oninput="calcFreight()" onfocus="highlightInput(this)" onblur="unhighlightInput(this)" /></td>
            <td style="text-align:center;"><button class="btn btn-sm btn-clear" onclick="deleteFreightChargeRow(this)">×</button></td>
        </tr>
    `).join('');
    enableFreightDragDrop();
    calcFreight();
}

let frDragData = null;

function onFrRowDragStart(e) { frDragData = e.target.closest('tr');
    frDragData.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move'; }

function onFrRowDragOver(e) { e.preventDefault();
    const row = e.target.closest('tr'); if (row) row.classList.add('drag-over'); }

function onFrRowDragLeave(e) { const row = e.target.closest('tr'); if (row) row.classList.remove('drag-over'); }

function onFrRowDrop(e) {
    e.preventDefault();
    const target = e.target.closest('tr');
    if (target) target.classList.remove('drag-over');
    if (frDragData && frDragData !== target) {
        const container = document.getElementById('fr-charges-tbody');
        const children = Array.from(container.children);
        const srcIdx = children.indexOf(frDragData);
        const tgtIdx = children.indexOf(target);
        if (srcIdx < tgtIdx) container.insertBefore(frDragData, target.nextSibling);
        else container.insertBefore(frDragData, target);
        frDragData.classList.remove('dragging');
        frDragData = null;
        container.querySelectorAll('tr').forEach((tr, i) => tr.querySelector('td:first-child').textContent = i + 1);
        calcFreight();
    }
}

function enableFreightDragDrop() {
    document.querySelectorAll('#fr-charges-tbody tr').forEach(row => {
        row.addEventListener('dragend', (e) => { e.target.closest('tr').classList.remove('dragging'); });
    });
}

function addFreightChargeRow() {
    const tbody = document.getElementById('fr-charges-tbody');
    const newRow = document.createElement('tr');
    const idx = tbody.children.length;
    newRow.draggable = true;
    newRow.innerHTML = `
        <td style="text-align:center;font-weight:600;">${idx+1}</td>
        <td><input type="text" class="fr-charge-name" value="NEW CHARGE" oninput="calcFreight()" /></td>
        <td><input type="text" class="fr-charge-unit" value="CTR" oninput="calcFreight()" /></td>
        <td><select class="fr-charge-currency" onchange="calcFreight()"><option value="USD">USD</option><option value="INR">INR</option></select></td>
        <td><input type="number" class="fr-rate20" step="0.01" value="0" oninput="calcFreight()" /></td>
        <td><input type="number" class="fr-qty20" step="1" value="0" min="0" oninput="calcFreight()" /></td>
        <td><input type="number" class="fr-rate40" step="0.01" value="0" oninput="calcFreight()" /></td>
        <td><input type="number" class="fr-qty40" step="1" value="0" min="0" oninput="calcFreight()" /></td>
        <td class="row-total" id="fr-total-${idx}">$ 0.00</td>
        <td style="text-align:center;"><button class="btn btn-sm btn-clear" onclick="deleteFreightChargeRow(this)">×</button></td>
    `;
    tbody.appendChild(newRow);
    enableFreightDragDrop();
    calcFreight();
}

function deleteFreightChargeRow(btn) {
    const row = btn.closest('tr');
    if (document.querySelectorAll('#fr-charges-tbody tr').length > 1) {
        row.remove();
        document.querySelectorAll('#fr-charges-tbody tr').forEach((tr, i) => tr.querySelector('td:first-child').textContent = i +
            1);
        calcFreight();
    } else {
        alert('You must keep at least one charge row.');
    }
}

function calcFreight() {
    let grand20USD = 0,
        grand40USD = 0;
    document.querySelectorAll('#fr-charges-tbody tr').forEach((row) => {
        const unit = row.querySelector('.fr-charge-unit').value;
        let rate20 = parseFloat(row.querySelector('.fr-rate20').value) || 0;
        let rate40 = parseFloat(row.querySelector('.fr-rate40').value) || 0;
        if (unit === 'TEU') {
            rate40 = rate20 * 2;
            row.querySelector('.fr-rate40').value = rate40.toFixed(2);
        }
        const qty20 = parseInt(row.querySelector('.fr-qty20').value) || 0;
        const qty40 = parseInt(row.querySelector('.fr-qty40').value) || 0;
        const curr = row.querySelector('.fr-charge-currency').value;
        let row20 = rate20 * qty20;
        let row40 = rate40 * qty40;
        if (curr === 'INR') {
            const rateUSD = db.exchangeRates.USD || 94.5;
            row20 = row20 / rateUSD;
            row40 = row40 / rateUSD;
        }
        grand20USD += row20;
        grand40USD += row40;
    });
    document.getElementById('fr-summary-area').dataset.total20 = grand20USD;
    document.getElementById('fr-summary-area').dataset.total40 = grand40USD;
    applyFreightMargin();
}

function applyFreightMargin() {
    const marginPct = parseFloat(document.getElementById('fr-margin-pct').value) || 0;
    const total20 = parseFloat(document.getElementById('fr-summary-area').dataset.total20) || 0;
    const total40 = parseFloat(document.getElementById('fr-summary-area').dataset.total40) || 0;
    const margin20 = total20 * (marginPct / 100);
    const margin40 = total40 * (marginPct / 100);
    const sell20 = total20 + margin20;
    const sell40 = total40 + margin40;
    const html = `
    <div class="modern-section">
        <div class="modern-section-title"><span>💰 Freight Cost Breakdown</span></div>
        <table class="modern-table">
            <thead><tr><th>Component</th><th>20 GP (USD)</th><th>40 HC (USD)</th></tr></thead>
            <tbody>
                <tr><td><span class="badge badge-blue">FRT</span> Total Freight Cost</td><td class="text-right">${formatUSD(total20)}</td><td class="text-right">${formatUSD(total40)}</td></tr>
                <tr><td><span class="badge badge-yellow">MRG</span> Margin % (${marginPct}%)</td><td class="text-right">${formatUSD(margin20)}</td><td class="text-right">${formatUSD(margin40)}</td></tr>
                <tr><td><span class="badge badge-purple">SLP</span> Sell Price</td><td class="text-right"><strong>${formatUSD(sell20)}</strong></td><td class="text-right"><strong>${formatUSD(sell40)}</strong></td></tr>
            </tbody>
            <tfoot><tr class="modern-footer-orange"><td colspan="3" class="text-center">FINAL SELLING PRICE: ${formatUSD(sell20)} / ${formatUSD(sell40)}</td></tr></tfoot>
        </table>
    </div>
    `;
    document.getElementById('fr-summary-area').innerHTML = html;
}

function saveFreightRecord() {
    const carrier = document.getElementById('fr-carrier').value.trim().toUpperCase();
    const pol = document.getElementById('fr-pol').value.trim().toUpperCase();
    const pod = document.getElementById('fr-pod').value.trim().toUpperCase();
    const commodity = document.getElementById('fr-commodity').value;
    const validFrom = document.getElementById('fr-valid-from').value;
    const validTill = document.getElementById('fr-valid-till').value;

    if (!carrier || !pol || !pod || !validTill) {
        alert('Please fill Carrier, POL, POD, and Valid Till (mandatory fields).');
        return;
    }

    const sell20 = parseFloat(document.getElementById('fr-summary-area').dataset.total20) || 0;
    const sell40 = parseFloat(document.getElementById('fr-summary-area').dataset.total40) || 0;
    const marginPct = parseFloat(document.getElementById('fr-margin-pct').value) || 0;
    const final20 = sell20 + (sell20 * (marginPct / 100));
    const final40 = sell40 + (sell40 * (marginPct / 100));

    if (final20 <= 0 && final40 <= 0) {
        alert('No freight costs calculated. Please enter valid rates and quantities.');
        return;
    }

    const now = new Date().toISOString();

    const upsertRate = (containerType, amount) => {
        if (amount <= 0) return;
        const existingIdx = db.rateSheet.findIndex(r =>
            r.carrierName === carrier &&
            r.pol === pol &&
            r.pod === pod &&
            r.containerType === containerType &&
            r.freightType === 'SEA' &&
            r.validFrom === validFrom &&
            r.validTo === validTill
        );
        if (existingIdx !== -1) db.rateSheet.splice(existingIdx, 1);

        db.rateSheet.push({
            id: 'RS-' + Date.now().toString(36).toUpperCase() + '-' + containerType.replace(' ', ''),
            carrierName: carrier,
            freightType: 'SEA',
            pol: pol,
            pod: pod,
            containerType: containerType,
            currency: 'USD',
            freightAmount: amount,
            transitTime: '',
            commodity: commodity,
            validFrom: validFrom || new Date().toISOString().split('T')[0],
            validTo: validTill,
            remarks: `Auto-saved from Freight Calculator (${containerType})`,
            createdAt: now,
            updatedAt: now,
            source: 'calc'
        });
    };

    upsertRate('20 GP', final20);
    upsertRate('40 HC', final40);

    saveDB();
    alert('✅ Rates saved directly to the Rate Sheet (20 GP & 40 HC)!');
    clearFreightForm();
    if (document.getElementById('ratesheet')?.classList.contains('active')) {
        renderRateSheet();
        updateExpiryDashboard();
    }
    autoBackup();
}

function renderFreightRecords() {
    const search = (document.getElementById('fr-search').value || '').toLowerCase();
    const perPage = parseInt(document.getElementById('fr-per-page').value) || 10;
    let records = db.freightCalculations || [];
    records = records.filter(r => {
        const text = `${r.carrier} ${r.origin}`.toLowerCase();
        return text.includes(search);
    });
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const total = records.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    let page = parseInt(sessionStorage.getItem('frPage') || '1');
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    sessionStorage.setItem('frPage', String(page));
    const start = (page - 1) * perPage;
    const pageData = records.slice(start, start + perPage);

    const list = document.getElementById('fr-records-list');
    if (total === 0) { list.innerHTML =
            '<p style="color:var(--text-light);padding:20px;text-align:center;">No freight records found.</p>';
        document.getElementById('fr-records-pagination').innerHTML = ''; return; }
    list.innerHTML = pageData.map((r, i) => {
        const realIdx = db.freightCalculations.indexOf(r);
        return `<div class="det-record-card" style="border-left:4px solid var(--primary);">
            <div class="info">
                <h4>${r.carrier} (${r.origin})</h4>
                <p>${r.charges.length} charges | Total: ${formatUSD(r.totalUSD)} / ${formatINR(r.totalINR)}</p>
                <p style="font-size:0.7rem;color:var(--text-light);">Saved: ${new Date(r.timestamp).toLocaleDateString('en-IN')}</p>
            </div>
            <div class="actions">
                <button class="btn btn-sm btn-preview" onclick="previewFreightRecord(${realIdx})">👁</button>
                <button class="btn btn-sm btn-preview" onclick="editFreightRecord(${realIdx})">✏️</button>
                <button class="btn btn-sm btn-duplicate" onclick="duplicateFreightRecord(${realIdx})">📋</button>
                <button class="btn btn-sm btn-clear" onclick="deleteFreightRecord(${realIdx})">×</button>
            </div>
        </div>`;
    }).join('');
    const pag = document.getElementById('fr-records-pagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    pag.innerHTML =
        `<button class="page-btn" onclick="changeFreightPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>
    <span class="page-info">Page ${page} of ${totalPages} (${total} records)</span>
    <button class="page-btn" onclick="changeFreightPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next ›</button>`;
}

function changeFreightPage(page) { sessionStorage.setItem('frPage', String(page));
    renderFreightRecords(); }

function clearFreightFilters() { document.getElementById('fr-search').value = '';
    document.getElementById('fr-per-page').value = '10';
    sessionStorage.setItem('frPage', '1');
    renderFreightRecords(); }

function clearFreightForm() {
    document.getElementById('fr-carrier').value = '';
    document.getElementById('fr-pol').value = '';
    document.getElementById('fr-pod').value = '';
    document.getElementById('fr-commodity').value = 'NON HAZ';
    document.getElementById('fr-valid-from').valueAsDate = new Date();
    document.getElementById('fr-valid-till').value = '';
    document.getElementById('fr-currency').value = 'USD';
    document.getElementById('fr-margin-pct').value = '5';
    document.querySelectorAll('#fr-charges-tbody tr').forEach(row => {
        row.querySelector('.fr-rate20').value = '0';
        row.querySelector('.fr-rate40').value = '0';
        row.querySelector('.fr-qty20').value = '0';
        row.querySelector('.fr-qty40').value = '0';
        row.querySelector('.fr-charge-unit').value = 'CNT';
    });
    calcFreight();
}

function editFreightRecord(idx) {
    const r = db.freightCalculations[idx];
    if (!r) return alert('Record not found.');
    loadFreightForm(r);
    document.getElementById('calc-freight').scrollIntoView({ behavior: 'smooth' });
}

function duplicateFreightRecord(idx) {
    const r = db.freightCalculations[idx];
    if (!r) return alert('Record not found.');
    const copy = JSON.parse(JSON.stringify(r));
    copy.id = 'FR-' + Date.now().toString(36).toUpperCase();
    copy.timestamp = new Date().toISOString();
    copy.createdAt = copy.timestamp;
    delete copy._id;
    db.freightCalculations.push(copy);
    saveDB();
    renderFreightRecords();
    alert('Record duplicated!');
    autoBackup();
}

function duplicateFreightCurrent() {
    const data = getFreightFormData();
    if (!data.carrier) return alert('Please fill Carrier.');
    data.id = 'FR-' + Date.now().toString(36).toUpperCase();
    data.timestamp = new Date().toISOString();
    data.createdAt = data.timestamp;
    db.freightCalculations.push(data);
    saveDB();
    renderFreightRecords();
    alert('Current form duplicated and saved!');
    clearFreightForm();
    autoBackup();
}

function deleteFreightRecord(idx) {
    const r = db.freightCalculations[idx];
    if (!r) return alert('Record not found.');
    if (confirm(`Delete freight calculation for "${r.carrier}"?`)) { db.freightCalculations.splice(idx, 1);
        saveDB();
        renderFreightRecords();
        autoBackup(); }
}

function buildFreightPreviewHTML(data) {
    const chargeRows = data.charges.map((c, i) => `
        <tr><td>${i+1}</td><td>${c.name}</td><td>${c.unit}</td><td>${c.currency}</td>
        <td style="text-align:right;">${formatUSD(c.rate20)}</td><td style="text-align:center;">${c.qty20}</td>
        <td style="text-align:right;">${formatUSD(c.rate40)}</td><td style="text-align:center;">${c.qty40}</td>
        <td style="text-align:right;font-weight:700;">${formatUSD((c.rate20*c.qty20)+(c.rate40*c.qty40))}</td></tr>
    `).join('');
    return `
        <div style="background:#ffffff;color:#1a1a1a;font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:10px;">
            <h3 style="color:var(--primary);border-bottom:2px solid var(--primary);padding-bottom:6px;">💰 Freight Calculation</h3>
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:12px;">
                <tr><td style="padding:4px 8px;font-weight:bold;">Carrier</td><td>${data.carrier}</td><td style="padding:4px 8px;font-weight:bold;">Origin</td><td>${data.origin}</td></tr>
                <tr><td style="padding:4px 8px;font-weight:bold;">Base Currency</td><td colspan="3">${data.baseCurrency}</td></tr>
            </table>
            <h4 style="color:var(--primary);font-size:0.9rem;">📋 Charges Breakdown</h4>
            <table style="width:100%;border-collapse:collapse;font-size:0.8rem;border:1px solid var(--border);">
                <thead><tr style="background:#1e3a8a;color:white;"><th>#</th><th>Charge</th><th>Unit</th><th>Curr</th><th>20′ Rate</th><th>20′ Qty</th><th>40′ Rate</th><th>40′ Qty</th><th>Total</th></tr></thead>
                <tbody>${chargeRows}</tbody>
                <tfoot><tr style="background:#f1f5f9;font-weight:bold;"><td colspan="8" style="text-align:right;padding:6px 8px;">GRAND TOTAL</td><td style="text-align:right;padding:6px 8px;color:var(--primary);">${formatUSD(data.totalUSD)}</td></tr></tfoot>
            </table>
            <p style="margin-top:12px;font-size:0.7rem;color:var(--text-light);text-align:center;">Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
    `;
}

function previewFreightRecord(idx = null) {
    let data;
    if (idx !== null) { data = db.freightCalculations[idx]; if (!data) return alert('Record not found.'); } else { data =
            getFreightFormData(); if (!data.carrier) return alert('Please fill Carrier.'); }
    document.getElementById('modal-title').textContent = 'Freight Calculation Preview';
    document.getElementById('previewBody').innerHTML = buildFreightPreviewHTML(data);
    openModal('previewModal');
}

function downloadFreightPDF(idx = null) {
    let data;
    if (idx !== null) { data = db.freightCalculations[idx]; if (!data) return alert('Record not found.'); } else { data =
            getFreightFormData(); if (!data.carrier) return alert('Please fill Carrier.'); }
    const html = buildFreightPreviewHTML(data);
    const renderArea = document.getElementById('pdf-render-area');
    renderArea.innerHTML = html;
    renderArea.style.cssText = 'position:fixed;left:0;top:0;width:800px;background:white;z-index:9999;opacity:1;padding:10px;';
    setTimeout(() => {
        html2canvas(renderArea, { scale: 1, useCORS: true, backgroundColor: '#ffffff' })
            .then(canvas => {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                let imgWidth = pdfWidth - 2 * margin;
                let imgHeight = (canvas.height * imgWidth) / canvas.width;
                const maxHeight = pdfHeight - 2 * margin;
                if (imgHeight > maxHeight) { const scale = maxHeight / imgHeight;
                    imgWidth *= scale;
                    imgHeight *= scale; }
                const x = (pdfWidth - imgWidth) / 2;
                const y = (pdfHeight - imgHeight) / 2;
                pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
                pdf.save(`Freight_${data.carrier}_${data.origin}.pdf`);
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = '';
            }).catch(err => { console.error(err);
                alert('PDF generation failed.');
                renderArea.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:white;z-index:-1;';
                renderArea.innerHTML = ''; });
    }, 500);
}

function populateFreightDropdowns() {
    const selCarrier = document.getElementById('fr-carrier');
    const selPol = document.getElementById('fr-pol');
    const selPod = document.getElementById('fr-pod');
    const visibleCarriers = db.carriers.filter(c => !(db.hiddenItems.carriers || []).includes(c));
    const visiblePol = db.pol.filter(p => !(db.hiddenItems.pol || []).includes(p));
    const visiblePod = db.pod.filter(p => !(db.hiddenItems.pod || []).includes(p));
    if (selCarrier) {
        selCarrier.innerHTML = '<option value="">Select Carrier</option>' +
            visibleCarriers.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    if (selPol) {
        selPol.innerHTML = '<option value="">Select POL</option>' +
            visiblePol.map(p => `<option value="${p}">${p}</option>`).join('');
    }
    if (selPod) {
        selPod.innerHTML = '<option value="">Select POD</option>' +
            visiblePod.map(p => `<option value="${p}">${p}</option>`).join('');
    }
}
