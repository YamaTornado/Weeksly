const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function renderWeek(targetId, suffix = "") {
  const container = document.getElementById(targetId);
  const startOffset = (suffix === "_next") ? 7 : 0;

  days.forEach((day, index) => {
    const dayId = day.toLowerCase() + suffix;

    const date = new Date();
    date.setDate(date.getDate() + startOffset + index);
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
    title.textContent = day;

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
  });
}

function createEntry(title, desc, targetDayId, status = "open") {
  const entry = document.createElement("div");
  entry.className = "entry";

  const h4 = document.createElement("h4");
  h4.textContent = title;

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

  entry.appendChild(h4);
  entry.appendChild(p);
  entry.appendChild(bottom);

  document.getElementById(targetDayId).appendChild(entry);
}

function addEntry(targetDayId) {
  const title = prompt("Title of the task:");
  if (!title) return;

  const desc = prompt("Short description:");
  if (!desc) return;

  createEntry(title, desc, targetDayId);
  saveEntries(targetDayId);
}

function saveEntries(dayId) {
  const entries = [];
  const entryEls = document.getElementById(dayId).querySelectorAll(".entry");
  entryEls.forEach(entry => {
    const title = entry.querySelector("h4").textContent;
    const desc = entry.querySelector("p").textContent;
    const done = entry.querySelector("button").classList.contains("done") ? "done" : "open";
    entries.push({ title, desc, status: done });
  });
  localStorage.setItem("entries_" + dayId, JSON.stringify(entries));
}

function loadEntries(dayId) {
  const raw = localStorage.getItem("entries_" + dayId);
  if (!raw) return;
  const entries = JSON.parse(raw);
  entries.forEach(e => createEntry(e.title, e.desc, dayId, e.status));
}

// Render weeks
renderWeek("week_current");
renderWeek("week_next", "_next");