const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getMonday(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function renderWeek(targetId, offset = 0) {
  const container = document.getElementById(targetId);
  const monday = getMonday(offset);
  const isCurrentWeek = offset === 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const dayId = days[i].toLowerCase() + (offset === 1 ? "_next" : "");
    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit"
    });

    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.id = dayId;

    const header = document.createElement("div");
    header.className = "day-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "title-wrap";

    const title = document.createElement("h3");
    title.textContent = days[i];
    if (isCurrentWeek && date < today) {
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

    loadEntries(dayId);

    new Sortable(dayDiv, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "ghost",
      onEnd: () => {
        saveEntries(dayId);
      }
    });
  }
}

function createEntry(title, desc, targetDayId, status = "open", time = "") {
  const entry = document.createElement("div");
  entry.className = "entry";

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
  document.getElementById(targetDayId).appendChild(entry);
}

function addEntry(targetDayId) {
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
      <input id="title-input" class="entry-title" type="text">
    </div>

    <div>
      <label for="desc-input">Description</label>
      <textarea id="desc-input" class="entry-desc"></textarea>
    </div>

    <div>
      <label for="time-input">Time (optional)</label>
      <input id="time-input" class="entry-time" type="time" value="00:00">
    </div>

    <button class="save">Save entry</button>
  `;

  form.querySelector(".close").onclick = () => overlay.remove();

  form.querySelector(".save").onclick = () => {
    const title = form.querySelector(".entry-title").value.trim();
    const desc = form.querySelector(".entry-desc").value.trim();
    const timeInput = form.querySelector(".entry-time");
    const time = timeInput.value.trim();
    const timeUsed = time !== "00:00" ? time : "";

    if (!title || !desc) return;

    createEntry(title, desc, targetDayId, "open", timeUsed);
    saveEntries(targetDayId);
    overlay.remove();
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
  }, { once: true });

  overlay.appendChild(form);
  document.body.appendChild(overlay);
}

function saveEntries(dayId) {
  const entries = [];
  const entryEls = document.getElementById(dayId).querySelectorAll(".entry");
  entryEls.forEach(entry => {
    const title = entry.querySelector("h4").textContent;
    const desc = entry.querySelector("p").textContent;
    const time = entry.querySelector(".entry-time")?.textContent || "";
    const done = entry.querySelector("button").classList.contains("done") ? "done" : "open";
    entries.push({ title, desc, time, status: done });
  });
  localStorage.setItem("entries_" + dayId, JSON.stringify(entries));
}

function loadEntries(dayId) {
  const raw = localStorage.getItem("entries_" + dayId);
  if (!raw) return;
  const entries = JSON.parse(raw);
  entries.forEach(e => createEntry(e.title, e.desc, dayId, e.status, e.time));
}

// Render both weeks
renderWeek("week_current", 0);
renderWeek("week_next", 1);