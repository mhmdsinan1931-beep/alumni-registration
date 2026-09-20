// =====================================================
//  REGISTRATION PORTAL — JS
// =====================================================

const PROGRAMMES = [
  { id: "malayalam_speech", label: "Malayalam Speech", emoji: "🎤", type: "topic" },
  { id: "madh_song",        label: "Madh Song",        emoji: "🎵", type: "song"  },
  { id: "mappilappattu",    label: "Mappilappattu",    emoji: "🎶", type: "song"  },
  { id: "group_song",       label: "Group Song",       emoji: "🎸", type: "song"  },
];

// ── DOM refs ──
const stepName    = document.getElementById("step-name");
const stepProg    = document.getElementById("step-prog");
const stepSuccess = document.getElementById("step-success");
const nameInput   = document.getElementById("participant-name");
const nameNext    = document.getElementById("name-next");
const progGrid    = document.getElementById("prog-grid");
const detailFields= document.getElementById("detail-fields");
const registerBtn = document.getElementById("register-btn");
const editBtn     = document.getElementById("edit-btn");
const successName = document.getElementById("success-name");
const successProgs= document.getElementById("success-progs");

let currentDocId = null;

// ── Build programme checkboxes ──
PROGRAMMES.forEach(p => {
  const div = document.createElement("label");
  div.className = "prog-item";
  div.innerHTML = `
    <input type="checkbox" id="prog_${p.id}" value="${p.id}">
    <span class="prog-emoji">${p.emoji}</span>
    <span>${p.label}</span>
  `;
  div.querySelector("input").addEventListener("change", updateDetailFields);
  div.addEventListener("click", e => {
    if (e.target.tagName !== "INPUT") div.querySelector("input").click();
  });
  progGrid.appendChild(div);
});

// ── Step navigation ──
nameNext.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) { showToast("Please enter your name."); return; }
  showStep(stepProg);
});

nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") nameNext.click();
});

// ── Update dynamic detail fields ──
function updateDetailFields() {
  detailFields.innerHTML = "";
  const checked = [...document.querySelectorAll("#prog-grid input:checked")];

  document.querySelectorAll(".prog-item").forEach(el => {
    el.classList.toggle("checked", el.querySelector("input").checked);
  });

  checked.forEach(input => {
    const prog = PROGRAMMES.find(p => p.id === input.value);
    if (!prog) return;
    const div = document.createElement("div");
    div.className = "detail-field";
    const promptText = prog.type === "song" ? "First line of the song" : "Topic";
    const placeholder = prog.type === "song" ? "Enter first line of the song…" : "Enter topic…";
    div.innerHTML = `
      <label>${prog.emoji} <strong>${prog.label}</strong> — ${promptText}</label>
      <input type="text" id="detail_${prog.id}" placeholder="${placeholder}" autocomplete="off">
    `;
    detailFields.appendChild(div);
  });

  registerBtn.disabled = checked.length === 0;
}

// ── Helper: save with timeout ──
function saveWithTimeout(promise, ms = 10000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), ms)
  );
  return Promise.race([promise, timeout]);
}

// ── Register ──
registerBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const checked = [...document.querySelectorAll("#prog-grid input:checked")];

  if (!name) { showToast("Name is required."); return; }
  if (checked.length === 0) { showToast("Select at least one programme."); return; }

  // Validate detail fields
  let valid = true;
  const programmes = [];
  checked.forEach(input => {
    const prog = PROGRAMMES.find(p => p.id === input.value);
    const detailInput = document.getElementById("detail_" + prog.id);
    const detail = detailInput ? detailInput.value.trim() : "";
    if (!detail) {
      if (detailInput) detailInput.style.borderColor = "red";
      valid = false;
    } else {
      if (detailInput) detailInput.style.borderColor = "";
    }
    programmes.push({ id: prog.id, label: prog.label, type: prog.type, detail });
  });

  if (!valid) { showToast("Please fill in all required fields."); return; }

  registerBtn.disabled = true;
  registerBtn.innerHTML = "⏳ Saving…";

  try {
    const now = new Date().toISOString(); // client-side timestamp as reliable fallback

    const data = {
      name,
      programmes,
      registeredAt: now,
      updatedAt: now,
    };

    if (currentDocId) {
      await saveWithTimeout(
        db.collection("registrations").doc(currentDocId).update(data)
      );
      showToast("✅ Registration updated!");
    } else {
      const docRef = await saveWithTimeout(
        db.collection("registrations").add(data)
      );
      currentDocId = docRef.id;
    }

    // Success screen
    successName.textContent = name;
    successProgs.innerHTML = programmes.map(p =>
      `<span class="badge">${p.label}</span>`
    ).join(" ");
    showStep(stepSuccess);

  } catch (err) {
    console.error("Registration error:", err);
    registerBtn.disabled = false;
    registerBtn.innerHTML = "✅ Register";

    if (err.message === "TIMEOUT") {
      showToast("⚠️ Connection timed out. Check your internet or Firestore rules.", 4000);
    } else if (err.code === "permission-denied") {
      showToast("🔒 Firestore permission denied. Set rules to test mode.", 4000);
    } else {
      showToast("❌ Error: " + (err.message || "Unknown error"), 4000);
    }
  }
});

// ── Edit button ──
editBtn.addEventListener("click", () => {
  showStep(stepProg);
  registerBtn.innerHTML = "✅ Update Registration";
  registerBtn.disabled = false;
});

// ── Helpers ──
function showStep(step) {
  [stepName, stepProg, stepSuccess].forEach(s => s.style.display = "none");
  step.style.display = "";
}

function showToast(msg, duration = 2800) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}
