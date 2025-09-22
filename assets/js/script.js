
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// -------- Date helpers --------
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
// Monday as week start (ISO-8601)
function getMonday(offset = 0) {
  const today = new Date();
  const day = today.getDay(); // 0=Sun,1=Mon,...6=Sat
  const mondayOffset = (day === 0 ? -6 : 1) - day; // distance to Monday
  const base = new Date(today);
  base.setDate(today.getDate() + mondayOffset + offset * 7);
  return startOfDay(base);
}

// -------- Rendering --------
function renderWeek(targetId, offset = 0) {
  const container = document.getElementById(targetId);
  const monday = getMonday(offset);
  const isCurrentWeek = offset === 0;

  const todayIso = toISODate(startOfDay(new Date()));

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    const isoKey = toISODate(date);
    const dayId = `day-${isoKey}`; // unique, date-based ID
    const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });

    // Root day container
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.id = dayId;
    dayDiv.dataset.date = isoKey;

    // Mark "today" visually (green vertical bar via CSS)
    if (isoKey === todayIso) {
      dayDiv.classList.add("is-today");
      dayDiv.setAttribute("aria-current", "date");
      dayDiv.setAttribute("title", "Heute");
    }

    // Header
    const header = document.createElement("div");
    header.className = "day-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "title-wrap";

    const title = document.createElement("h3");
    title.textContent = days[i];

    // Optional: strike-through for past days of the current week
    if (isCurrentWeek && isoKey < todayIso) {
      title.style.textDecoration = "line-through";
    }

    const dateTag = document.createElement("span");
    dateTag.className = "date";
    dateTag.textContent = dateStr;

    titleWrap.appendChild(title);
    titleWrap.appendChild(dateTag);

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.onclick = () => addEntry(dayId);

    header.appendChild(titleWrap);
    header.appendChild(addBtn);
    dayDiv.appendChild(header);
    container.appendChild(dayDiv);

    // Load stored entries for this date
    loadEntries(dayId);

    // Enable drag & drop within AND across days
    new Sortable(dayDiv, {
      group: "week", // cross-day dragging
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "ghost",
      onEnd: (evt) => {
        const fromId = evt.from.id;
        const toId = evt.to.id;
        // Save both source and target columns
        saveEntries(fromId);
        if (fromId !== toId) saveEntries(toId);
      }
    });
  }
}

// -------- Entry creators --------
function createEntry(title, desc, targetDayId, status = "open", time = "") {
  const entry = document.createElement("div");
  entry.className = "entry";

  // drag handle (6 dots)
  const handle = document.createElement("div");
  handle.className = "drag-handle";
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement("span");
    handle.appendChild(dot);
  }

  const contentWrap = document.createElement("div");
  contentWrap.className = "content-wrap";

  const topRow = document.createElement("div");
  topRow.className = "top-row";

  const h4 = document.createElement("h4");
  h4.textContent = title;

  const timeTag = document.createElement("span");
  timeTag.className = "entry-time";
  if (time) timeTag.textContent = time;

  topRow.appendChild(h4);
  topRow.appendChild(timeTag);

  const p = document.createElement("p");
  p.textContent = desc;

  const btn = document.createElement("button");
  btn.className = "status";
  btn.textContent = (status === "done") ? "Done" : "Not done";
  if (status === "done") btn.classList.add("done");

  btn.addEventListener("click", () => {
    btn.classList.toggle("done");
    btn.textContent = btn.classList.contains("done") ? "Done" : "Not done";
    saveEntries(targetDayId);
  });

  const del = document.createElement("span");
  del.className = "material-icons delete";
  del.textContent = "delete";
  del.title = "Delete";
  del.onclick = () => {
    entry.remove();
    saveEntries(targetDayId);
  };

  const bottom = document.createElement("div");
  bottom.className = "entry-bottom";
  bottom.appendChild(btn);
  bottom.appendChild(del);

  contentWrap.appendChild(topRow);
  contentWrap.appendChild(p);
  contentWrap.appendChild(bottom);

  entry.appendChild(handle);
  entry.appendChild(contentWrap);

  const column = document.getElementById(targetDayId);
  if (column) column.appendChild(entry);
}

function addEntry(targetDayId) {
  // close any existing modal
  const existingOverlay = document.querySelector(".overlay");
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const form = document.createElement("div");
  form.className = "entry-form";
  form.innerHTML = `
    <span class="close" title="Close">close</span>

    <div>
      <label for="title-input">Title</label>
      <input id="title-input" class="entry-title" type="text" autofocus>
    </div>

    <div>
      <label for="desc-input">Description</label>
      <textarea id="desc-input" class="entry-desc"></textarea>
    </div>

    <div>
      <label for="time-input">Time (optional)</label>
      <input id="time-input" class="entry-time" type="time">
    </div>

    <button class="save">Save entry</button>
  `;

  form.querySelector(".close").onclick = () => overlay.remove();

  form.querySelector(".save").onclick = () => {
    const title = form.querySelector(".entry-title").value.trim();
    const desc = form.querySelector(".entry-desc").value.trim();
    const timeRaw = (form.querySelector(".entry-time").value || "").trim();
    const timeUsed = timeRaw === "00:00" ? "" : timeRaw;

    if (!title || !desc) return;

    createEntry(title, desc, targetDayId, "open", timeUsed);
    saveEntries(targetDayId);
    overlay.remove();
  };

  window.addEventListener(
    "keydown",
    (e) => { if (e.key === "Escape") overlay.remove(); },
    { once: true }
  );

  overlay.appendChild(form);
  document.body.appendChild(overlay);
}

// -------- Storage (per actual date) --------
function storageKeyFor(dayId) {
  // dayId: "day-YYYY-MM-DD"
  const iso = dayId.replace(/^day-/, "");
  return "entries_" + iso;
}

function saveEntries(dayId) {
  const root = document.getElementById(dayId);
  if (!root) return;

  const entries = [];
  root.querySelectorAll(".entry").forEach((entry) => {
    const title = entry.querySelector("h4")?.textContent || "";
    const desc = entry.querySelector("p")?.textContent || "";
    const time = entry.querySelector(".entry-time")?.textContent || "";
    const done = entry.querySelector("button.status")?.classList.contains("done") ? "done" : "open";
    entries.push({ title, desc, time, status: done });
  });

  localStorage.setItem(storageKeyFor(dayId), JSON.stringify(entries));
}

function loadEntries(dayId) {
  const raw = localStorage.getItem(storageKeyFor(dayId));
  if (!raw) return;

  try {
    const entries = JSON.parse(raw);
    entries.forEach((e) => createEntry(e.title, e.desc, dayId, e.status, e.time));
  } catch {
    // corrupted JSON → clear it to avoid blocking
    localStorage.removeItem(storageKeyFor(dayId));
  }
}

// -------- Init: render current + next week --------
renderWeek("week_current", 0);
renderWeek("week_next", 1);