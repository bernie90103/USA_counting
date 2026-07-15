const STORAGE_KEY = "us-ledger-transactions";
const RATE_KEY = "us-ledger-exchange-rate";
const RATE_UPDATED_KEY = "us-ledger-exchange-rate-updated";
const LIVE_RATE_URL = "https://fxapi.app/api/USD/TWD.json";
const PRETRIP_FILTER = "pretrip";
const CAMPUS_CARD_STARTING_BALANCE = 500;
const EXPENSE_CATEGORIES = ["房租", "超市", "學餐", "外食", "網購", "交通", "學費", "醫療", "娛樂", "其他"];
const INCOME_CATEGORIES = ["rec center", "學校"];
const MERCHANTS = [
  "Marshall",
  "Publix",
  "Trader Joe's",
  "Target",
  "Oriental Market",
  "Hometown market",
  "ALDI",
  "Dollar Tree",
  "好市多",
  "Sam's Club",
  "Walmart",
  "Amazon",
  "Walmart.com",
  "Target.com",
  "Costco.com",
  "Best Buy",
  "eBay",
  "Etsy",
  "Temu",
  "SHEIN",
  "AliExpress",
  "The Commons on the Green",
  "Chick-fil-A",
  "Starbucks HSC",
  "Mein Bowl",
  "Panera Bread",
  "Vocelli Pizza",
  "The Den by Denny's",
  "Moe's Southwest Grill",
  "WOW American Eats",
  "Einstein Bros. Bagels",
  "Blenz",
  "WOW Bao",
  "The Grid",
  "Magic City Eats",
  "校園餐車",
  "C-Store",
  "UAB 校內餐飲",
  "星巴克",
  "Canes",
  "珍珠奶茶",
  "一般外食",
  "operation assisted",
  "lifeguard",
  "UAB INTO",
  "其他",
];
const RENT_MERCHANTS = ["Marshall"];
const SCHOOL_MEAL_MERCHANTS = [
  "The Commons on the Green",
  "Chick-fil-A",
  "Starbucks HSC",
  "Mein Bowl",
  "Panera Bread",
  "Vocelli Pizza",
  "The Den by Denny's",
  "Moe's Southwest Grill",
  "WOW American Eats",
  "Einstein Bros. Bagels",
  "Blenz",
  "WOW Bao",
  "The Grid",
  "Magic City Eats",
  "校園餐車",
  "C-Store",
  "UAB 校內餐飲",
];
const GROCERY_MERCHANTS = [
  "Publix",
  "Trader Joe's",
  "Target",
  "Oriental Market",
  "Hometown market",
  "ALDI",
  "Dollar Tree",
  "好市多",
  "Sam's Club",
  "Walmart",
];
const DINING_MERCHANTS = ["星巴克", "Canes", "珍珠奶茶", "一般外食"];
const ONLINE_SHOPPING_MERCHANTS = [
  "Amazon",
  "Walmart.com",
  "Target.com",
  "Costco.com",
  "Best Buy",
  "eBay",
  "Etsy",
  "Temu",
  "SHEIN",
  "AliExpress",
];
const REC_CENTER_INCOME_MERCHANTS = ["operation assisted", "lifeguard"];
const SCHOOL_INCOME_MERCHANTS = ["UAB INTO"];
const INCOME_MERCHANTS = [...REC_CENTER_INCOME_MERCHANTS, ...SCHOOL_INCOME_MERCHANTS];
const CATEGORY_MERCHANTS = {
  房租: RENT_MERCHANTS,
  超市: GROCERY_MERCHANTS,
  學餐: SCHOOL_MEAL_MERCHANTS,
  外食: DINING_MERCHANTS,
  網購: ONLINE_SHOPPING_MERCHANTS,
  "rec center": REC_CENTER_INCOME_MERCHANTS,
  學校: SCHOOL_INCOME_MERCHANTS,
};
const PAYMENT_METHODS = ["台灣信用卡", "chase debit card", "chase credit prime VISA", "學生證", "現金"];
const isEditMode = isLocalEditingContext();

const pretripExpenses = [
  { group: "必要花費", item: "護照更新", twd: 1300 },
  { group: "必要花費", item: "密封文件申請", twd: 169 },
  { group: "必要花費", item: "IELTS-1", twd: 7700 },
  { group: "必要花費", item: "IELTS-2", twd: 7700 },
  { group: "必要花費", item: "IELTS-3", twd: 8300, note: "免讀語言學校" },
  { group: "必要花費", item: "保證金", twd: 125859, rate: 31.607, usd: 3982 },
  { group: "必要花費", item: "電匯手續費", twd: 600 },
  {
    group: "必要花費",
    item: "學費+住宿+膳食計畫+保險(第一次)",
    twd: 1260111,
    rate: 31.95,
    usd: 39393,
    note: "03/17 繳費",
  },
  { group: "必要花費", item: "DS-160-AIT面試", twd: 5842 },
  { group: "必要花費", item: "DS-160-AIT面試(高鐵票來回)", twd: 660 },
  { group: "必要花費", item: "SEVIS I-901", twd: 11068, rate: 31.622, usd: 350 },
  { group: "必要花費", item: "美簽5X5大頭照", twd: 400 },
  { group: "必要花費", item: "學校疫苗-MMR", twd: 1200 },
  { group: "必要花費", item: "學校疫苗-水痘", twd: 5649 },
  { group: "必要花費", item: "財力證明+戶籍-英版", twd: 60 },
  { group: "必要花費", item: "機票錢", twd: 36917 },
  { group: "非必要花費", item: "IDP代辦", twd: 28000 },
  { group: "非必要花費", item: "IELTS補習費用", twd: 30100 },
  { group: "非必要花費", item: "IELTS-4", twd: 8300 },
];

const sampleTransactions = [
  {
    id: "工作表1-2026-05-01-1",
    date: "2026-05-01",
    type: "expense",
    category: "其他",
    merchant: "",
    note: "永豐信用卡",
    amount: 91.2,
    paymentMethod: "台灣信用卡",
  },
  {
    id: "工作表1-2026-05-07-2",
    date: "2026-05-07",
    type: "expense",
    category: "外食",
    merchant: "",
    note: "永豐信用卡",
    amount: 7.8,
    paymentMethod: "台灣信用卡",
  },
  {
    id: "工作表1-2026-05-07-3",
    date: "2026-05-07",
    type: "expense",
    category: "其他",
    merchant: "",
    note: "cash",
    amount: 14.75,
    paymentMethod: "現金",
  },
  {
    id: "工作表1-2026-05-08-4",
    date: "2026-05-08",
    type: "expense",
    category: "超市",
    merchant: "Walmart",
    note: "cash",
    amount: 70.19,
    paymentMethod: "現金",
  },
  {
    id: "工作表1-2026-05-09-5",
    date: "2026-05-09",
    type: "expense",
    category: "超市",
    merchant: "Walmart",
    note: "cash",
    amount: 31.65,
    paymentMethod: "現金",
  },
];

const elements = {
  form: document.querySelector("#transactionForm"),
  date: document.querySelector("#date"),
  type: document.querySelector("#type"),
  category: document.querySelector("#category"),
  merchant: document.querySelector("#merchant"),
  paymentMethod: document.querySelector("#paymentMethod"),
  amount: document.querySelector("#amount"),
  note: document.querySelector("#note"),
  exchangeRate: document.querySelector("#exchangeRate"),
  refreshRate: document.querySelector("#refreshRate"),
  rateStatus: document.querySelector("#rateStatus"),
  monthFilter: document.querySelector("#monthFilter"),
  monthlyIncomeLabel: document.querySelector("#monthlyIncomeLabel"),
  monthlyIncome: document.querySelector("#monthlyIncome"),
  monthlyIncomeTwd: document.querySelector("#monthlyIncomeTwd"),
  monthlyExpenseLabel: document.querySelector("#monthlyExpenseLabel"),
  monthlyExpense: document.querySelector("#monthlyExpense"),
  monthlyExpenseTwd: document.querySelector("#monthlyExpenseTwd"),
  monthlyBalanceLabel: document.querySelector("#monthlyBalanceLabel"),
  monthlyBalance: document.querySelector("#monthlyBalance"),
  monthlyBalanceTwd: document.querySelector("#monthlyBalanceTwd"),
  dailyAverageLabel: document.querySelector("#dailyAverageLabel"),
  dailyAverage: document.querySelector("#dailyAverage"),
  dailyAverageNote: document.querySelector("#dailyAverageNote"),
  campusCardBalance: document.querySelector("#campusCardBalance"),
  campusCardNote: document.querySelector("#campusCardNote"),
  categoryBars: document.querySelector("#categoryBars"),
  merchantBars: document.querySelector("#merchantBars"),
  transactionRows: document.querySelector("#transactionRows"),
  emptyState: document.querySelector("#emptyState"),
  exportJson: document.querySelector("#exportJson"),
  exportCsv: document.querySelector("#exportCsv"),
  importJson: document.querySelector("#importJson"),
  importCsv: document.querySelector("#importCsv"),
  saveTransaction: document.querySelector("#saveTransaction"),
  cancelEdit: document.querySelector("#cancelEdit"),
  barTemplate: document.querySelector("#barTemplate"),
};

let transactions = [];
let selectedMonth = "";
let editingId = "";

document.body.classList.toggle("edit-mode", isEditMode);
document.body.classList.toggle("view-mode", !isEditMode);
if (isEditMode) {
  document.querySelectorAll(".edit-only[hidden]").forEach((element) => {
    element.hidden = false;
  });
}
setDefaultFormValues();
elements.exchangeRate.value = localStorage.getItem(RATE_KEY) || "32.50";
setRateStatusFromStorage();

elements.exchangeRate.addEventListener("input", () => {
  localStorage.setItem(RATE_KEY, elements.exchangeRate.value);
  localStorage.setItem(RATE_UPDATED_KEY, new Date().toISOString());
  setRateStatus("手動匯率已套用。");
  render();
});

elements.refreshRate.addEventListener("click", () => {
  refreshLiveRate();
});

elements.monthFilter.addEventListener("change", (event) => {
  selectedMonth = event.target.value;
  render();
});

if (isEditMode) {
  elements.type.addEventListener("change", () => {
    syncCategoryOptionsForType(elements.category.value);
    syncPaymentMethodForCategory(elements.category.value);
  });

  elements.category.addEventListener("change", () => {
    renderMerchantOptions(elements.category.value);
    syncPaymentMethodForCategory(elements.category.value);
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const transaction = {
      id: editingId || makeId(),
      date: elements.date.value,
      type: elements.type.value,
      category: elements.category.value,
      merchant: elements.merchant.value,
      paymentMethod: elements.paymentMethod.value,
      note: elements.note.value.trim(),
      amount: Number(elements.amount.value),
    };

    if (editingId) {
      transactions = transactions.map((item) => (item.id === editingId ? transaction : item));
    } else {
      transactions = [transaction, ...transactions];
    }

    saveTransactions();
    resetForm();
    render();
  });

  elements.cancelEdit.addEventListener("click", () => {
    resetForm();
  });

  elements.exportJson.addEventListener("click", () => {
    downloadFile("us-ledger.json", JSON.stringify(transactions, null, 2), "application/json");
  });

  elements.exportCsv.addEventListener("click", () => {
    const csv = [
      ["date", "type", "category", "merchant", "paymentMethod", "note", "amount"],
      ...transactions.map((item) => [
        item.date,
        item.type,
        item.category,
        item.merchant || "",
        item.paymentMethod,
        item.note,
        item.amount,
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    downloadFile("us-ledger.csv", csv, "text/csv;charset=utf-8");
  });

  elements.importJson.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imported = JSON.parse(await file.text());
    transactions = normalizeTransactions(imported);
    saveTransactions();
    resetForm();
    render();
    event.target.value = "";
  });

  elements.importCsv.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    transactions = normalizeTransactions(parseCsv(await file.text()));
    saveTransactions();
    resetForm();
    render();
    event.target.value = "";
  });
}

elements.transactionRows.addEventListener("click", (event) => {
  if (!isEditMode) return;

  const editButton = event.target.closest("[data-edit-id]");
  if (editButton) {
    beginEdit(editButton.dataset.editId);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-id]");
  if (!deleteButton) return;

  transactions = transactions.filter((item) => item.id !== deleteButton.dataset.deleteId);
  saveTransactions();
  if (editingId === deleteButton.dataset.deleteId) resetForm();
  render();
});

window.addEventListener("storage", (event) => {
  if (!isEditMode) return;

  if (event.key === STORAGE_KEY) {
    transactions = normalizeTransactions(JSON.parse(event.newValue || "[]"));
    render();
  }

  if (event.key === RATE_KEY) {
    elements.exchangeRate.value = event.newValue || "32.50";
    render();
  }
});

init();

async function init() {
  transactions = await loadTransactions();
  render();
  refreshLiveRate({ quiet: true });
}

async function refreshLiveRate(options = {}) {
  const { quiet = false } = options;
  elements.refreshRate.disabled = true;
  if (!quiet) setRateStatus("正在更新 USD → TWD 匯率...");

  try {
    const response = await fetch(LIVE_RATE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const rate = Number(data.rate);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid rate");

    const timestamp = data.timestamp || new Date().toISOString();
    elements.exchangeRate.value = rate.toFixed(2);
    localStorage.setItem(RATE_KEY, elements.exchangeRate.value);
    localStorage.setItem(RATE_UPDATED_KEY, timestamp);
    setRateStatus(`即時匯率已更新：${formatRateTime(timestamp)}，來源 fxapi.app。`);
    render();
  } catch {
    const fallback = localStorage.getItem(RATE_KEY) || elements.exchangeRate.value;
    elements.exchangeRate.value = fallback || "32.50";
    setRateStatus("即時匯率暫時無法更新，已保留目前匯率，可手動調整。");
    render();
  } finally {
    elements.refreshRate.disabled = false;
  }
}

async function loadTransactions() {
  if (!isEditMode) {
    return loadPublicTransactions();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return loadPublicTransactions();
  }

  try {
    return normalizeTransactions(JSON.parse(stored));
  } catch {
    return loadPublicTransactions();
  }
}

async function loadPublicTransactions() {
  try {
    const response = await fetch("./data/transactions.json", { cache: "no-store" });
    if (!response.ok) return loadBundledPublicTransactions();
    const publicTransactions = normalizeTransactions(await response.json());
    return publicTransactions.length ? publicTransactions : loadBundledPublicTransactions();
  } catch {
    return loadBundledPublicTransactions();
  }
}

function loadBundledPublicTransactions() {
  if (!Array.isArray(window.PUBLIC_TRANSACTIONS)) return sampleTransactions;

  const bundledTransactions = normalizeTransactions(window.PUBLIC_TRANSACTIONS);
  return bundledTransactions.length ? bundledTransactions : sampleTransactions;
}

function saveTransactions() {
  if (!isEditMode) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function normalizeTransactions(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const normalizedCategory = normalizeCategoryAndMerchant(item);

      return {
        id: item.id || makeId(),
        date: String(item.date || "").slice(0, 10),
        type: item.type === "income" ? "income" : "expense",
        category: normalizedCategory.category,
        merchant: normalizedCategory.merchant,
        paymentMethod:
          normalizePaymentMethod(item.paymentMethod || item.payment || item.method) ||
          inferPaymentMethod(item),
        note: String(item.note || ""),
        amount: Number(item.amount || 0),
      };
    })
    .filter((item) => item.date && item.amount > 0);
}

function normalizeCategoryAndMerchant(item) {
  const rawCategory = String(item.category || "").trim();
  const rawMerchant = String(item.merchant || "").trim();
  const note = String(item.note || "");

  if (item.type === "income") {
    const merchant = normalizeIncomeMerchant(rawMerchant, note);

    return {
      category: normalizeCategory(rawCategory, item.type, merchant),
      merchant,
    };
  }

  const inferredMerchant =
    normalizeMerchant(rawMerchant) || inferMerchant(rawCategory, note) || inferGenericSchoolMeal(item);
  const detectedMerchant =
    inferredMerchant === "星巴克" && isCampusCardPayment(item) ? "Starbucks HSC" : inferredMerchant;
  const schoolMealCategory = SCHOOL_MEAL_MERCHANTS.includes(detectedMerchant) ? "學餐" : "";
  const storeCategory = GROCERY_MERCHANTS.includes(detectedMerchant) ? "超市" : "";
  const categoryFromMerchant =
    schoolMealCategory || (detectedMerchant === "星巴克" ? "外食" : storeCategory);
  const category = categoryFromMerchant || normalizeCategory(rawCategory, item.type);

  return {
    category,
    merchant: detectedMerchant,
  };
}

function normalizeCategory(value, type, merchant = "") {
  const category = String(value || "").trim();

  if (type === "income") {
    return INCOME_CATEGORIES.includes(category)
      ? category
      : inferIncomeCategory(merchant) || INCOME_CATEGORIES[0];
  }

  if (EXPENSE_CATEGORIES.includes(category)) return category;

  if (category === "Walmart/大賣場" || category === "Publix超市") return "超市";
  if (category === "早餐" || category === "星巴克") return "外食";

  return type === "income" ? "收入" : "其他";
}

function normalizeIncomeMerchant(value, note) {
  const merchant = String(value || "").trim();
  if (INCOME_MERCHANTS.includes(merchant)) return merchant;

  return inferIncomeMerchant(`${merchant} ${note || ""}`);
}

function normalizeMerchant(value) {
  const merchant = String(value || "").trim();
  if (!merchant) return "";
  if (MERCHANTS.includes(merchant)) return merchant;

  return inferMerchant(merchant, "");
}

function inferIncomeMerchant(text) {
  const normalized = String(text || "").toLowerCase();

  if (normalized.includes("operation assisted")) return "operation assisted";
  if (
    normalized.includes("lifeguard") ||
    normalized.includes("life guard") ||
    normalized.includes("lifegrade")
  ) {
    return "lifeguard";
  }
  if (normalized.includes("uab into")) return "UAB INTO";

  return "";
}

function inferIncomeCategory(merchant) {
  if (SCHOOL_INCOME_MERCHANTS.includes(merchant)) return "學校";
  if (REC_CENTER_INCOME_MERCHANTS.includes(merchant)) return "rec center";
  return "";
}

function inferMerchant(category, note) {
  const text = `${category || ""} ${note || ""}`.toLowerCase();

  if (text.includes("commons") || text.includes("the commons")) return "The Commons on the Green";
  if (text.includes("chick-fil-a") || text.includes("chick fil a")) return "Chick-fil-A";
  if (text.includes("starbucks hsc") || text.includes("星巴克 hsc")) return "Starbucks HSC";
  if (text.includes("mein bowl")) return "Mein Bowl";
  if (text.includes("panera")) return "Panera Bread";
  if (text.includes("vocelli")) return "Vocelli Pizza";
  if (text.includes("denny") || text.includes("the den")) return "The Den by Denny's";
  if (text.includes("moe's") || text.includes("moes southwest")) return "Moe's Southwest Grill";
  if (text.includes("wow american")) return "WOW American Eats";
  if (text.includes("einstein")) return "Einstein Bros. Bagels";
  if (text.includes("blenz")) return "Blenz";
  if (text.includes("wow bao")) return "WOW Bao";
  if (text.includes("the grid")) return "The Grid";
  if (text.includes("magic city eats")) return "Magic City Eats";
  if (text.includes("校園餐車") || text.includes("餐車") || text.includes("food truck")) return "校園餐車";
  if (text.includes("c-store") || text.includes("c store")) return "C-Store";
  if (text.includes("uab") || text.includes("學餐") || text.includes("校內餐飲")) return "UAB 校內餐飲";
  if (text.includes("starbucks") || text.includes("星巴克")) return "星巴克";
  if (text.includes("canes")) return "Canes";
  if (text.includes("珍珠奶茶") || text.includes("珍奶")) return "珍珠奶茶";
  if (text.includes("marshall")) return "Marshall";
  if (text.includes("costco") || text.includes("好市多")) return "好市多";
  if (text.includes("sam's club") || text.includes("sams club")) return "Sam's Club";
  if (text.includes("trader joe")) return "Trader Joe's";
  if (text.includes("oriental market")) return "Oriental Market";
  if (text.includes("dollar tree")) return "Dollar Tree";
  if (text.includes("hometown market")) return "Hometown market";
  if (text.includes("publix")) return "Publix";
  if (text.includes("walmart")) return "Walmart";
  if (text.includes("target")) return "Target";
  if (text.includes("aldi")) return "ALDI";

  return "";
}

function inferGenericSchoolMeal(item) {
  const text = `${item.category || ""} ${item.note || ""}`.toLowerCase();
  const looksLikeSchoolMeal =
    text.includes("午餐") ||
    text.includes("晚餐") ||
    text.includes("三明治") ||
    text.includes("便當") ||
    text.includes("學餐");

  return isCampusCardPayment(item) && looksLikeSchoolMeal ? "UAB 校內餐飲" : "";
}

function isCampusCardPayment(item) {
  const paymentMethod = String(item.paymentMethod || item.payment || item.method || "");
  return paymentMethod === "學生證";
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function render() {
  const months = getAvailableMonths();
  if (!selectedMonth || (selectedMonth !== PRETRIP_FILTER && !months.includes(selectedMonth))) {
    selectedMonth = months[0] || new Date().toISOString().slice(0, 7);
  }

  renderMonthOptions(months);

  if (selectedMonth === PRETRIP_FILTER) {
    renderPretripStats();
    renderCampusCardSummary(transactions);
    renderPretripCategoryBars();
    renderEmptyMerchantBars("行前花費沒有店家資料。");
    renderPretripRows();
    return;
  }

  const filtered = transactions
    .filter((item) => item.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  renderStats(filtered);
  renderCampusCardSummary(transactions);
  renderCategoryBars(filtered);
  renderMerchantBars(filtered);
  renderRows(filtered);
}

function getAvailableMonths() {
  return [...new Set(transactions.map((item) => item.date.slice(0, 7)))].sort().reverse();
}

function renderMonthOptions(months) {
  elements.monthFilter.innerHTML = "";

  const list = months.length ? months : [new Date().toISOString().slice(0, 7)];
  for (const month of list) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = formatMonth(month);
    option.selected = month === selectedMonth;
    elements.monthFilter.append(option);
  }

  const pretripOption = document.createElement("option");
  pretripOption.value = PRETRIP_FILTER;
  pretripOption.textContent = "行前總花費";
  pretripOption.selected = selectedMonth === PRETRIP_FILTER;
  elements.monthFilter.append(pretripOption);
}

function renderStats(items) {
  elements.monthlyIncomeLabel.textContent = "本月收入";
  elements.monthlyExpenseLabel.textContent = "本月支出";
  elements.monthlyBalanceLabel.textContent = "本月結餘";
  elements.dailyAverageLabel.textContent = "每日平均支出";
  elements.dailyAverageNote.textContent = "用本月已過天數估算";

  const income = sumByType(items, "income");
  const expense = sumByType(items, "expense");
  const balance = income - expense;
  const average = expense / getElapsedDaysInSelectedMonth();

  elements.monthlyIncome.textContent = formatUsd(income);
  elements.monthlyIncomeTwd.textContent = formatTwdLine(income);
  elements.monthlyExpense.textContent = formatUsd(expense);
  elements.monthlyExpenseTwd.textContent = formatTwdLine(expense);
  elements.monthlyBalance.textContent = formatUsd(balance);
  elements.monthlyBalanceTwd.textContent = formatTwdLine(balance);
  elements.dailyAverage.textContent = formatUsd(average || 0);
}

function renderPretripStats() {
  const required = sumPretripByGroup("必要花費");
  const optional = sumPretripByGroup("非必要花費");
  const total = required + optional;
  const requiredUsd = sumPretripUsdByGroup("必要花費");
  const optionalUsd = sumPretripUsdByGroup("非必要花費");
  const totalUsd = requiredUsd + optionalUsd;
  const largest = [...pretripExpenses].sort((a, b) => b.twd - a.twd)[0];

  elements.monthlyIncomeLabel.textContent = "必要花費";
  elements.monthlyIncome.textContent = formatTwdAmount(required);
  elements.monthlyIncomeTwd.textContent = formatFixedUsdSummary(requiredUsd);
  elements.monthlyExpenseLabel.textContent = "非必要花費";
  elements.monthlyExpense.textContent = formatTwdAmount(optional);
  elements.monthlyExpenseTwd.textContent = formatFixedUsdSummary(optionalUsd);
  elements.monthlyBalanceLabel.textContent = "行前總計";
  elements.monthlyBalance.textContent = formatTwdAmount(total);
  elements.monthlyBalanceTwd.textContent = `固定匯率已記錄 ${formatUsd(totalUsd)}`;
  elements.dailyAverageLabel.textContent = "最大項目";
  elements.dailyAverage.textContent = formatTwdAmount(largest.twd);
  elements.dailyAverageNote.textContent = `${largest.item}｜匯率 ${formatRate(largest.rate)}`;
}

function renderPretripCategoryBars() {
  const groups = [
    ["必要花費", sumPretripByGroup("必要花費")],
    ["非必要花費", sumPretripByGroup("非必要花費")],
  ];
  const max = Math.max(...groups.map((group) => group[1]));

  elements.categoryBars.innerHTML = "";
  for (const [category, amount] of groups) {
    const node = elements.barTemplate.content.cloneNode(true);
    node.querySelector(".category-name").textContent = category;
    node.querySelector(".category-amount").textContent = formatTwdAmount(amount);
    node.querySelector(".bar-fill").style.width = `${Math.max((amount / max) * 100, 4)}%`;
    elements.categoryBars.append(node);
  }
}

function renderPretripRows() {
  const items = [...pretripExpenses].sort((a, b) => b.twd - a.twd);
  elements.transactionRows.innerHTML = "";
  elements.emptyState.hidden = items.length > 0;

  for (const item of items) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>行前</td>
      <td><span class="type-pill expense">支出</span></td>
      <td>${escapeHtml(item.group)}</td>
      <td>-</td>
      <td>-</td>
      <td>${escapeHtml(formatPretripNote(item))}</td>
      <td class="amount">${formatPretripUsd(item)}</td>
      <td class="amount">${formatTwdAmount(item.twd)}</td>
      <td class="edit-only row-actions"></td>
    `;
    elements.transactionRows.append(tr);
  }
}

function renderCategoryBars(items) {
  renderBars(elements.categoryBars, getExpenseTotals(items, "category"), "這個月份沒有支出資料。");
}

function renderMerchantBars(items) {
  renderBars(elements.merchantBars, getExpenseTotals(items, "merchant"), "這個月份沒有店家資料。");
}

function renderEmptyMerchantBars(message) {
  elements.merchantBars.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function getExpenseTotals(items, field) {
  return items
    .filter((item) => item.type === "expense" && item[field])
    .reduce((acc, item) => {
      acc[item[field]] = (acc[item[field]] || 0) + item.amount;
      return acc;
    }, {});
}

function renderBars(container, totals, emptyMessage) {
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map((entry) => entry[1]), 0);

  container.innerHTML = "";

  if (!entries.length) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(emptyMessage)}</p>`;
    return;
  }

  for (const [label, amount] of entries) {
    const node = elements.barTemplate.content.cloneNode(true);
    node.querySelector(".category-name").textContent = label;
    node.querySelector(".category-amount").textContent = formatUsd(amount);
    node.querySelector(".bar-fill").style.width = `${Math.max((amount / max) * 100, 4)}%`;
    container.append(node);
  }
}

function renderRows(items) {
  elements.transactionRows.innerHTML = "";
  elements.emptyState.hidden = items.length > 0;

  for (const item of items) {
    const tr = document.createElement("tr");
    const signedAmount = item.type === "income" ? item.amount : -item.amount;

    tr.innerHTML = `
      <td>${escapeHtml(item.date)}</td>
      <td><span class="type-pill ${item.type}">${item.type === "income" ? "收入" : "支出"}</span></td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.merchant || "-")}</td>
      <td>${escapeHtml(item.paymentMethod || "-")}</td>
      <td>${escapeHtml(item.note || "-")}</td>
      <td class="amount">${formatUsd(signedAmount)}</td>
      <td class="amount">${formatTwd(signedAmount)}</td>
      <td class="edit-only row-actions">
        <button class="secondary-button" type="button" data-edit-id="${escapeHtml(item.id)}">修改</button>
        <button class="delete-button" type="button" data-delete-id="${escapeHtml(item.id)}">刪除</button>
      </td>
    `;

    elements.transactionRows.append(tr);
  }
}

function beginEdit(id) {
  const transaction = transactions.find((item) => item.id === id);
  if (!transaction) return;

  editingId = id;
  elements.date.value = transaction.date;
  elements.type.value = transaction.type;
  syncCategoryOptionsForType(transaction.category);
  elements.category.value = transaction.category;
  renderMerchantOptions(transaction.category, transaction.merchant);
  elements.merchant.value = transaction.merchant || "";
  elements.paymentMethod.value = transaction.paymentMethod || inferPaymentMethod(transaction);
  elements.amount.value = transaction.amount;
  elements.note.value = transaction.note;
  elements.saveTransaction.textContent = "儲存修改";
  elements.cancelEdit.hidden = false;
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  editingId = "";
  elements.form.reset();
  setDefaultFormValues();
  elements.saveTransaction.textContent = "加入記帳";
  elements.cancelEdit.hidden = true;
}

function setDefaultFormValues() {
  elements.date.value = getLocalDateValue();
  elements.type.value = "expense";
  syncCategoryOptionsForType("超市");
  renderMerchantOptions(elements.category.value);
  syncPaymentMethodForCategory(elements.category.value);
}

function syncPaymentMethodForCategory(category) {
  elements.paymentMethod.value = category === "學餐" ? "學生證" : "chase debit card";
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderCampusCardSummary(items) {
  const spent = items
    .filter((item) => item.type === "expense" && item.paymentMethod === "學生證")
    .reduce((total, item) => total + item.amount, 0);
  const balance = CAMPUS_CARD_STARTING_BALANCE - spent;

  elements.campusCardBalance.textContent = formatUsd(balance);
  elements.campusCardNote.textContent = `5/11 加值 ${formatUsd(CAMPUS_CARD_STARTING_BALANCE)}，已扣 ${formatUsd(spent)}`;
}

function ensureCategoryOption(category) {
  const exists = [...elements.category.options].some((option) => option.value === category);
  if (exists) return;

  const option = document.createElement("option");
  option.textContent = category;
  option.value = category;
  elements.category.append(option);
}

function ensureMerchantOption(merchant) {
  if (!merchant) return;

  const exists = [...elements.merchant.options].some((option) => option.value === merchant);
  if (exists) return;

  const option = document.createElement("option");
  option.textContent = merchant;
  option.value = merchant;
  elements.merchant.append(option);
}

function syncCategoryOptionsForType(selectedCategory = "") {
  const categories = getCategoriesForType(elements.type.value);
  const category = categories.includes(selectedCategory) ? selectedCategory : categories[0];

  renderCategoryOptions(categories);
  elements.category.value = category;
  renderMerchantOptions(category, elements.merchant.value);
}

function renderCategoryOptions(categories) {
  elements.category.innerHTML = "";

  for (const category of categories) {
    const option = document.createElement("option");
    option.textContent = category;
    option.value = category;
    elements.category.append(option);
  }
}

function getCategoriesForType(type) {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

function renderMerchantOptions(category, selectedMerchant = "") {
  const merchants = getMerchantsForCategory(category);
  elements.merchant.innerHTML = "";

  if (INCOME_CATEGORIES.includes(category)) {
    for (const merchant of merchants) {
      appendMerchantOption(merchant, merchant);
    }

    elements.merchant.value = merchants.includes(selectedMerchant) ? selectedMerchant : merchants[0] || "";
    return;
  }

  appendMerchantOption("", "未指定");

  for (const merchant of merchants) {
    appendMerchantOption(merchant, merchant);
  }

  if (selectedMerchant && !merchants.includes(selectedMerchant)) {
    appendMerchantOption(selectedMerchant, selectedMerchant);
  }

  appendMerchantOption("其他", "其他");
  elements.merchant.value = selectedMerchant && hasMerchantOption(selectedMerchant) ? selectedMerchant : "";
}

function getMerchantsForCategory(category) {
  return CATEGORY_MERCHANTS[category] || [];
}

function appendMerchantOption(value, label) {
  if (hasMerchantOption(value)) return;

  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  elements.merchant.append(option);
}

function hasMerchantOption(value) {
  return [...elements.merchant.options].some((option) => option.value === value);
}

function normalizePaymentMethod(value) {
  const method = String(value || "").trim();
  if (method === "美國信用卡") return "chase debit card";
  return PAYMENT_METHODS.includes(method) ? method : "";
}

function inferPaymentMethod(item) {
  const text = `${item.paymentMethod || ""} ${item.note || ""} ${item.category || ""}`.toLowerCase();

  if (isKnownCampusCardTransaction(item)) {
    return "學生證";
  }

  if (text.includes("學生證") || text.includes("campuscard") || text.includes("campus card")) {
    return "學生證";
  }

  if (text.includes("永豐") || text.includes("台灣信用卡")) {
    return "台灣信用卡";
  }

  if (text.includes("美國信用卡")) {
    return "chase debit card";
  }

  if (text.includes("cash") || text.includes("現金")) {
    return "現金";
  }

  return "現金";
}

function isKnownCampusCardTransaction(item) {
  const amount = Number(item.amount || 0);
  const note = String(item.note || "");

  if (item.date !== "2026-05-13" || item.type === "income") {
    return false;
  }

  return (
    (amount === 6.88 && note.includes("星巴克")) ||
    (amount === 9 && (note.includes("午餐") || note.includes("三明治")))
  );
}

function sumByType(items, type) {
  return items
    .filter((item) => item.type === type)
    .reduce((total, item) => total + item.amount, 0);
}

function sumPretripByGroup(group) {
  return pretripExpenses
    .filter((expense) => expense.group === group)
    .reduce((total, expense) => total + expense.twd, 0);
}

function sumPretripUsdByGroup(group) {
  return pretripExpenses
    .filter((expense) => expense.group === group)
    .reduce((total, expense) => total + (expense.usd || 0), 0);
}

function getElapsedDaysInSelectedMonth() {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  if (selectedMonth === currentMonth) return now.getDate();

  const [year, month] = selectedMonth.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatTwd(value) {
  const rate = Number(elements.exchangeRate.value) || 0;
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value * rate);
}

function formatTwdAmount(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPretripUsd(expense) {
  if (expense.usd && expense.rate) {
    return `${formatUsd(expense.usd)}｜匯率 ${formatRate(expense.rate)}`;
  }

  if (expense.usd) return formatUsd(expense.usd);
  return "未記錄匯率";
}

function formatPretripNote(expense) {
  const note = expense.note ? `｜${expense.note}` : "";
  const rate = expense.rate ? `｜當時匯率 ${formatRate(expense.rate)}` : "";
  return `${expense.item}${note}${rate}`;
}

function formatFixedUsdSummary(value) {
  if (!value) return "未記錄當時匯率";
  return `固定匯率已記錄 ${formatUsd(value)}`;
}

function formatRate(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

function formatTwdLine(value) {
  return `約 ${formatTwd(value)}`;
}

function formatMonth(month) {
  const [year, monthNumber] = month.split("-");
  return `${year} 年 ${Number(monthNumber)} 月`;
}

function setRateStatus(message) {
  elements.rateStatus.textContent = message;
}

function setRateStatusFromStorage() {
  const updatedAt = localStorage.getItem(RATE_UPDATED_KEY);
  if (!updatedAt) {
    setRateStatus("載入後會自動抓取即時匯率，也可手動調整。");
    return;
  }

  setRateStatus(`目前使用上次匯率：${formatRateTime(updatedAt)}。`);
}

function formatRateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "時間未知";

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/).map(parseCsvLine);
  const headers = rows.shift()?.map((header) => header.trim()) || [];

  return rows.map((row) =>
    headers.reduce((item, header, index) => {
      item[header] = row[index] ?? "";
      return item;
    }, {}),
  );
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isLocalEditingContext() {
  const localHosts = new Set(["", "localhost", "127.0.0.1", "::1"]);
  return location.protocol === "file:" || localHosts.has(location.hostname);
}
