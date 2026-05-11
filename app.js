const STORAGE_KEY = "us-ledger-transactions";
const RATE_KEY = "us-ledger-exchange-rate";
const RATE_UPDATED_KEY = "us-ledger-exchange-rate-updated";
const LIVE_RATE_URL = "https://fxapi.app/api/USD/TWD.json";
const PRETRIP_FILTER = "pretrip";
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
    category: "美國電信",
    note: "永豐信用卡",
    amount: 91.2,
  },
  {
    id: "工作表1-2026-05-07-2",
    date: "2026-05-07",
    type: "expense",
    category: "早餐",
    note: "永豐信用卡",
    amount: 7.8,
  },
  {
    id: "工作表1-2026-05-07-3",
    date: "2026-05-07",
    type: "expense",
    category: "超商",
    note: "cash",
    amount: 14.75,
  },
  {
    id: "工作表1-2026-05-08-4",
    date: "2026-05-08",
    type: "expense",
    category: "Walmart/大賣場",
    note: "cash",
    amount: 70.19,
  },
  {
    id: "工作表1-2026-05-09-5",
    date: "2026-05-09",
    type: "expense",
    category: "Walmart/大賣場",
    note: "cash",
    amount: 31.65,
  },
];

const elements = {
  form: document.querySelector("#transactionForm"),
  date: document.querySelector("#date"),
  type: document.querySelector("#type"),
  category: document.querySelector("#category"),
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
  categoryBars: document.querySelector("#categoryBars"),
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
elements.date.value = new Date().toISOString().slice(0, 10);
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
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const transaction = {
      id: editingId || makeId(),
      date: elements.date.value,
      type: elements.type.value,
      category: elements.category.value,
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
      ["date", "type", "category", "note", "amount"],
      ...transactions.map((item) => [
        item.date,
        item.type,
        item.category,
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
    if (!response.ok) return sampleTransactions;
    const publicTransactions = normalizeTransactions(await response.json());
    return publicTransactions.length ? publicTransactions : sampleTransactions;
  } catch {
    return sampleTransactions;
  }
}

function saveTransactions() {
  if (!isEditMode) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function normalizeTransactions(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      id: item.id || makeId(),
      date: String(item.date || "").slice(0, 10),
      type: item.type === "income" ? "income" : "expense",
      category: String(item.category || "其他"),
      note: String(item.note || ""),
      amount: Number(item.amount || 0),
    }))
    .filter((item) => item.date && item.amount > 0);
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
    renderPretripCategoryBars();
    renderPretripRows();
    return;
  }

  const filtered = transactions
    .filter((item) => item.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  renderStats(filtered);
  renderCategoryBars(filtered);
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
  const largest = [...pretripExpenses].sort((a, b) => b.twd - a.twd)[0];

  elements.monthlyIncomeLabel.textContent = "必要花費";
  elements.monthlyIncome.textContent = formatTwdAmount(required);
  elements.monthlyIncomeTwd.textContent = `約 ${formatUsd(required / getExchangeRate())}`;
  elements.monthlyExpenseLabel.textContent = "非必要花費";
  elements.monthlyExpense.textContent = formatTwdAmount(optional);
  elements.monthlyExpenseTwd.textContent = `約 ${formatUsd(optional / getExchangeRate())}`;
  elements.monthlyBalanceLabel.textContent = "行前總計";
  elements.monthlyBalance.textContent = formatTwdAmount(total);
  elements.monthlyBalanceTwd.textContent = `約 ${formatUsd(total / getExchangeRate())}`;
  elements.dailyAverageLabel.textContent = "最大項目";
  elements.dailyAverage.textContent = formatTwdAmount(largest.twd);
  elements.dailyAverageNote.textContent = largest.item;
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
      <td>${escapeHtml(item.note ? `${item.item}｜${item.note}` : item.item)}</td>
      <td class="amount">${formatPretripUsd(item)}</td>
      <td class="amount">${formatTwdAmount(item.twd)}</td>
      <td class="edit-only row-actions"></td>
    `;
    elements.transactionRows.append(tr);
  }
}

function renderCategoryBars(items) {
  const expenses = items.filter((item) => item.type === "expense");
  const totals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map((entry) => entry[1]), 0);

  elements.categoryBars.innerHTML = "";

  if (!entries.length) {
    elements.categoryBars.innerHTML = '<p class="empty-state">這個月份沒有支出資料。</p>';
    return;
  }

  for (const [category, amount] of entries) {
    const node = elements.barTemplate.content.cloneNode(true);
    node.querySelector(".category-name").textContent = category;
    node.querySelector(".category-amount").textContent = formatUsd(amount);
    node.querySelector(".bar-fill").style.width = `${Math.max((amount / max) * 100, 4)}%`;
    elements.categoryBars.append(node);
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
  ensureCategoryOption(transaction.category);
  elements.date.value = transaction.date;
  elements.type.value = transaction.type;
  elements.category.value = transaction.category;
  elements.amount.value = transaction.amount;
  elements.note.value = transaction.note;
  elements.saveTransaction.textContent = "儲存修改";
  elements.cancelEdit.hidden = false;
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  editingId = "";
  elements.form.reset();
  elements.date.value = new Date().toISOString().slice(0, 10);
  elements.type.value = "expense";
  elements.saveTransaction.textContent = "加入記帳";
  elements.cancelEdit.hidden = true;
}

function ensureCategoryOption(category) {
  const exists = [...elements.category.options].some((option) => option.value === category);
  if (exists) return;

  const option = document.createElement("option");
  option.textContent = category;
  option.value = category;
  elements.category.append(option);
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

function getExchangeRate() {
  return Number(elements.exchangeRate.value) || 32.5;
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
  if (expense.usd) return `已付 ${formatUsd(expense.usd)}`;
  return `約 ${formatUsd(expense.twd / getExchangeRate())}`;
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
