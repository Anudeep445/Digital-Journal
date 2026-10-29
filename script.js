// Digital Journal App: entries are stored in this browser using localStorage.
const STORAGE_KEY = "codtechDigitalJournalEntries";
const ACCESS_KEY = "codtechDigitalJournalAccess";
const SESSION_KEY = "codtechDigitalJournalUnlocked";
const PBKDF2_ITERATIONS = 310000;
const accessScreen = document.getElementById("accessScreen");
const journalApp = document.getElementById("journalApp");
const accessForm = document.getElementById("accessForm");
const accessPassword = document.getElementById("accessPassword");
const confirmPassword = document.getElementById("confirmPassword");
const confirmPasswordField = document.getElementById("confirmPasswordField");
const accessTitle = document.getElementById("accessTitle");
const accessDescription = document.getElementById("accessDescription");
const accessMessage = document.getElementById("accessMessage");
const accessButton = document.getElementById("accessButton");
const lockButton = document.getElementById("lockButton");
const form = document.getElementById("entryForm");
const titleInput = document.getElementById("entryTitle");
const dateInput = document.getElementById("entryDate");
const moodInput = document.getElementById("entryMood");
const contentInput = document.getElementById("entryContent");
const searchInput = document.getElementById("searchInput");
const entriesList = document.getElementById("entriesList");
const emptyState = document.getElementById("emptyState");
const noResults = document.getElementById("noResults");
const entryCount = document.getElementById("entryCount");
const totalStat = document.getElementById("totalStat");
const latestStat = document.getElementById("latestStat");
const formHeading = document.getElementById("formHeading");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

let entries = [];
let editingId = null;
let credential = null;

function localDateString(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

document.getElementById("todayLabel").textContent =
  new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
dateInput.value = localDateString();

function loadEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Could not read saved journal entries:", error);
    return [];
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function derivePasswordHash(password, salt) {
  if (!window.crypto || !crypto.subtle) {
    throw new Error("Password protection requires a browser with Web Crypto support.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function showAccessError(message) {
  accessMessage.textContent = message;
}

function setAccessMode(isSetup) {
  accessTitle.textContent = isSetup ? "Set your journal password" : "Journal access";
  accessDescription.textContent = isSetup
    ? "Create a password to use this journal on this browser."
    : "Enter your password to open your journal.";
  confirmPasswordField.classList.toggle("hidden", !isSetup);
  confirmPassword.required = isSetup;
  accessPassword.autocomplete = isSetup ? "new-password" : "current-password";
  accessButton.textContent = isSetup ? "Create password" : "Unlock journal";
}

function unlockJournal() {
  accessScreen.classList.add("hidden");
  journalApp.classList.remove("hidden");
  entries = loadEntries();
  renderEntries();
  dateInput.value = localDateString();
}

accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showAccessError("");
  accessButton.disabled = true;

  try {
    const password = accessPassword.value;
    if (!credential) {
      if (password.length < 8) {
        showAccessError("Choose a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword.value) {
        showAccessError("The passwords do not match.");
        return;
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const newCredential = {
        salt: bytesToHex(salt),
        hash: await derivePasswordHash(password, salt)
      };
      localStorage.setItem(ACCESS_KEY, JSON.stringify(newCredential));
      credential = newCredential;
    } else {
      const salt = Uint8Array.from(
        credential.salt.match(/.{2}/g) || [],
        (byte) => Number.parseInt(byte, 16)
      );
      if (await derivePasswordHash(password, salt) !== credential.hash) {
        showAccessError("That password is not correct.");
        return;
      }
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    accessForm.reset();
    unlockJournal();
  } catch (error) {
    console.error("Could not unlock the journal:", error);
    showAccessError(error instanceof Error
      ? `${error.message} Your journal was not unlocked.`
      : "Could not unlock the journal. Your journal was not unlocked.");
  } finally {
    accessButton.disabled = false;
  }
});

lockButton.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  resetForm();
  entries = [];
  entriesList.replaceChildren();
  journalApp.classList.add("hidden");
  accessScreen.classList.remove("hidden");
  setAccessMode(false);
  showAccessError("");
  accessPassword.focus();
});

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function resetForm() {
  form.reset();
  dateInput.value = localDateString();
  editingId = null;
  formHeading.textContent = "Write an entry";
  saveButton.textContent = "Save entry";
  cancelButton.classList.add("hidden");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || !content || !dateInput.value) {
    alert("Please complete the title, date, and entry fields.");
    return;
  }

  let updatedEntries;
  if (editingId) {
    updatedEntries = entries.map((entry) => entry.id === editingId
      ? { ...entry, title, date: dateInput.value, mood: moodInput.value, content, updatedAt: new Date().toISOString() }
      : entry);
  } else {
    updatedEntries = [...entries, {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      title,
      date: dateInput.value,
      mood: moodInput.value,
      content,
      createdAt: new Date().toISOString()
    }];
  }

  const previousEntries = entries;
  entries = updatedEntries;
  try {
    persistEntries();
  } catch (error) {
    entries = previousEntries;
    console.error("Could not save journal entry:", error);
    alert("Could not save your entry. Check browser storage availability and try again.");
    return;
  }
  resetForm();
  renderEntries();
});

cancelButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderEntries);

function beginEdit(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;
  editingId = id;
  titleInput.value = entry.title;
  dateInput.value = entry.date;
  moodInput.value = entry.mood;
  contentInput.value = entry.content;
  formHeading.textContent = "Edit your entry";
  saveButton.textContent = "Update entry";
  cancelButton.classList.remove("hidden");
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteEntry(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry || !confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
  const previousEntries = entries;
  entries = entries.filter((item) => item.id !== id);
  try {
    persistEntries();
  } catch (error) {
    entries = previousEntries;
    console.error("Could not delete journal entry:", error);
    alert("Could not delete your entry because the change could not be saved.");
    return;
  }
  if (editingId === id) resetForm();
  renderEntries();
}

// Use textContent for user-entered text to avoid interpreting it as HTML.
function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function renderEntries() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = [...entries]
    .filter((entry) => [entry.title, entry.content, entry.mood, entry.date]
      .some((value) => String(value).toLowerCase().includes(query)))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));

  entriesList.replaceChildren();
  filtered.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    const top = document.createElement("div");
    top.className = "entry-top";
    const details = document.createElement("div");
    details.appendChild(createTextElement("h3", "", entry.title));
    const meta = document.createElement("div");
    meta.className = "entry-meta";
    meta.appendChild(createTextElement("span", "", new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, {
      day: "numeric", month: "short", year: "numeric"
    })));
    meta.appendChild(createTextElement("span", "mood", entry.mood || "🙂 Good"));
    details.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "entry-actions";
    const editButton = createTextElement("button", "", "Edit");
    editButton.type = "button";
    editButton.addEventListener("click", () => beginEdit(entry.id));
    const deleteButton = createTextElement("button", "delete", "Delete");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteEntry(entry.id));
    actions.append(editButton, deleteButton);
    top.append(details, actions);
    card.appendChild(top);
    card.appendChild(createTextElement("p", "entry-content", entry.content));
    entriesList.appendChild(card);
  });

  entryCount.textContent = String(entries.length);
  totalStat.textContent = String(entries.length);
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  latestStat.textContent = latest ? new Date(`${latest.date}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric", month: "short"
  }) : "—";
  emptyState.classList.toggle("hidden", entries.length !== 0);
  noResults.classList.toggle("hidden", entries.length === 0 || filtered.length !== 0);
}

try {
  const savedCredential = localStorage.getItem(ACCESS_KEY);
  if (savedCredential) {
    credential = JSON.parse(savedCredential);
    if (!credential || typeof credential.salt !== "string" || !/^[0-9a-f]{32}$/i.test(credential.salt) ||
        typeof credential.hash !== "string" || !/^[0-9a-f]{64}$/i.test(credential.hash)) {
      throw new Error("Saved password data is invalid.");
    }
  }
  setAccessMode(!credential);
  if (credential && sessionStorage.getItem(SESSION_KEY) === "true") {
    unlockJournal();
  } else {
    accessPassword.focus();
  }
} catch (error) {
  console.error("Could not initialize journal access:", error);
  accessButton.disabled = true;
  showAccessError("Could not read the saved access settings. Check browser storage and reload this page.");
}
