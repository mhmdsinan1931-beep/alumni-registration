// =====================================================
//  HOST PORTAL — JS
// =====================================================

const DEFAULT_PASSWORD = "host123";
let participants = [];
let unsubscribe = null;

// ── Password logic ──
async function getStoredPassword() {
  try {
    const doc = await db.collection("config").doc("host").get();
    if (doc.exists && doc.data().password) return doc.data().password;
  } catch (e) {}
  return DEFAULT_PASSWORD;
}

async function setStoredPassword(newPw) {
  await db.collection("config").doc("host").set({ password: newPw }, { merge: true });
}

// ── Login ──
document.getElementById("login-btn").addEventListener("click", async () => {
  const entered = document.getElementById("pw-input").value;
  const stored  = await getStoredPassword();
  if (entered === stored) {
    document.getElementById("password-overlay").style.display = "none";
    startListening();
  } else {
    document.getElementById("pw-error").textContent = "❌ Incorrect password.";
    document.getElementById("pw-input").value = "";
  }
});

document.getElementById("pw-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("login-btn").click();
});

// ── Real-time listener ──
function startListening() {
  if (unsubscribe) unsubscribe();
  unsubscribe = db.collection("registrations")
    .orderBy("registeredAt", "asc")
    .onSnapshot(snapshot => {
      participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderTable();
    }, err => {
      console.error(err);
      showToast("Firestore error: " + err.message);
    });
}

// ── Render table ──
function renderTable() {
  const tbody = document.getElementById("participants-tbody");
  const count  = document.getElementById("count-badge");
  count.textContent = participants.length + " participant" + (participants.length !== 1 ? "s" : "");

  if (participants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>No registrations yet.<br>Share the link below to get started!</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = participants.map((p, i) => {
    const progs  = (p.programmes || []).map(pr => `<span class="badge">${pr.label}</span>`).join(" ");
    const details = (p.programmes || []).map(pr => {
      return `<div style="font-size:0.85rem;margin-bottom:2px"><span style="color:#6b7280">${pr.label}:</span> ${pr.detail || "—"}</div>`;
    }).join("");
    const time = p.registeredAt
      ? (typeof p.registeredAt === "string"
          ? new Date(p.registeredAt).toLocaleString("en-IN")
          : new Date(p.registeredAt.seconds * 1000).toLocaleString("en-IN"))
      : "—";
    return `
      <tr>
        <td class="serial">${i + 1}</td>
        <td><strong>${escHtml(p.name)}</strong></td>
        <td>${progs}</td>
        <td>${details}</td>
        <td style="white-space:nowrap;font-size:0.82rem;color:#6b7280">${time}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteParticipant('${p.id}', '${escHtml(p.name).replace(/'/g,"\\'")}')">
            🗑️ Delete
          </button>
        </td>
      </tr>`;
  }).join("");
}

// ── Delete participant ──
async function deleteParticipant(docId, name) {
  const confirmed = window.confirm(`Delete registration for "${name}"?\nThis cannot be undone.`);
  if (!confirmed) return;
  try {
    await db.collection("registrations").doc(docId).delete();
    showToast(`🗑️ "${name}" deleted.`);
  } catch (err) {
    console.error(err);
    showToast("❌ Failed to delete. Try again.");
  }
}

// ── Download Excel ──
document.getElementById("download-btn").addEventListener("click", () => {
  if (!participants.length) { showToast("No data to download."); return; }

  // Flatten rows for Excel
  const rows = [["#", "Name", "Programme", "Detail (Topic / First Line)", "Registered At"]];
  participants.forEach((p, i) => {
    const time = p.registeredAt
      ? (typeof p.registeredAt === "string"
          ? new Date(p.registeredAt).toLocaleString("en-IN")
          : new Date(p.registeredAt.seconds * 1000).toLocaleString("en-IN"))
      : "";
    (p.programmes || []).forEach((pr, j) => {
      rows.push([
        j === 0 ? i + 1 : "",
        j === 0 ? p.name : "",
        pr.label,
        pr.detail || "",
        j === 0 ? time : ""
      ]);
    });
    if (!p.programmes || p.programmes.length === 0) {
      rows.push([i + 1, p.name, "", "", time]);
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [{ wch: 4 }, { wch: 22 }, { wch: 24 }, { wch: 36 }, { wch: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, "Registrations");
  XLSX.writeFile(wb, "cultural_programme_registrations.xlsx");
  showToast("📥 Excel file downloaded!");
});

// ── Change Password ──
document.getElementById("change-pw-btn").addEventListener("click", () => {
  document.getElementById("change-pw-modal").style.display = "flex";
  document.getElementById("new-pw-input").value = "";
  document.getElementById("confirm-pw-input").value = "";
  document.getElementById("change-pw-error").textContent = "";
});
document.getElementById("cancel-pw-btn").addEventListener("click", () => {
  document.getElementById("change-pw-modal").style.display = "none";
});
document.getElementById("save-pw-btn").addEventListener("click", async () => {
  const np = document.getElementById("new-pw-input").value.trim();
  const cp = document.getElementById("confirm-pw-input").value.trim();
  if (!np || np.length < 4) { document.getElementById("change-pw-error").textContent = "Password must be at least 4 characters."; return; }
  if (np !== cp) { document.getElementById("change-pw-error").textContent = "Passwords do not match."; return; }
  await setStoredPassword(np);
  document.getElementById("change-pw-modal").style.display = "none";
  showToast("✅ Password changed successfully!");
});

// ── Registration link ──
const regLink = document.getElementById("reg-link-url");
// Build URL pointing to register.html alongside host.html
const base = window.location.href.replace(/host\.html.*$/, "");
regLink.textContent = base + "register.html";

document.getElementById("copy-link-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(regLink.textContent).then(() => showToast("🔗 Link copied!"));
});

// ── Helper ──
function escHtml(s) {
  return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function showToast(msg, duration = 2800) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}
