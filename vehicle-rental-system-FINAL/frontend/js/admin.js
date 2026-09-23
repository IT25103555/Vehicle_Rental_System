/* =========================================================
   admin.js — admin dashboard: Create, Read, Update, Delete
   for Vehicles and Users, plus booking management. Every
   action calls the Java REST API, which persists straight
   to the SQL database.
   ========================================================= */

function guardAdmin() {
  const user = Session.get();
  const guard = document.getElementById("guardMount");
  const shell = document.getElementById("adminShell");

  if (!user) {
    guard.innerHTML = `<div class="section"><div class="wrap empty-state">Please <a href="login.html?redirect=admin.html">log in as an administrator</a> to access this panel.</div></div>`;
    return false;
  }
  if (user.role !== "ADMIN") {
    guard.innerHTML = `<div class="section"><div class="wrap empty-state">This area is for administrators only. Your account (${escapeHtml(user.email)}) doesn't have access.</div></div>`;
    return false;
  }
  document.getElementById("adminName").textContent = user.fullName;
  document.getElementById("adminEmail").textContent = user.email;
  shell.style.display = "grid";
  return true;
}

/* ---------------- TAB SWITCHING ---------------- */
function wireTabs() {
  document.querySelectorAll(".admin-nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".admin-tab").forEach(s => (s.style.display = "none"));
      document.getElementById(`tab-${btn.dataset.tab}`).style.display = "block";

      if (btn.dataset.tab === "dashboard") loadDashboard();
      if (btn.dataset.tab === "vehicles") loadVehiclesTable();
      if (btn.dataset.tab === "bookings") loadBookingsTable();
      if (btn.dataset.tab === "users") loadUsersTable();
      if (btn.dataset.tab === "reviews") loadReviewsTable();
      if (btn.dataset.tab === "reports") loadReports();
      if (btn.dataset.tab === "ai-insights") loadAiInsights();
    });
  });
}

/* ---------------- DASHBOARD ---------------- */
async function loadDashboard() {
  try {
    const [vehicles, bookings, users] = await Promise.all([
      Api.getVehicles(), Api.getBookings(), Api.getUsers(),
    ]);
    document.getElementById("statTotalVehicles").textContent = vehicles.length;
    document.getElementById("statAvail").textContent = vehicles.filter(v => v.status === "AVAILABLE").length;
    document.getElementById("statBookings").textContent = bookings.length;
    document.getElementById("statUsers").textContent = users.length;

    const recent = [...bookings].reverse().slice(0, 6);
    const mount = document.getElementById("recentBookings");
    mount.innerHTML = recent.length ? `
      <table>
        <thead><tr><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          ${recent.map(b => `
            <tr>
              <td>${escapeHtml(b.customer.fullName)}</td>
              <td>${escapeHtml(b.vehicle.name)}</td>
              <td>${b.startDate} &rarr; ${b.endDate}</td>
              <td>${money(b.totalCost)}</td>
              <td><span class="status-pill" style="background:${pillColor(b.status)}">${b.status}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : `<div class="empty-state">No bookings yet.</div>`;
  } catch (err) {
    toast("Couldn't load dashboard: " + err.message, "error");
  }
}

function pillColor(status) {
  return {
    CONFIRMED: "#E4F3EA;color:#2F8F5B", PENDING: "#FFF3DE;color:#C8811E",
    CANCELLED: "#FDEDE9;color:#C7462F", COMPLETED: "#EDEDED;color:#555",
    AVAILABLE: "#E4F3EA;color:#2F8F5B", RENTED: "#FDEDE9;color:#C7462F",
    RESERVED: "#FFF3DE;color:#C8811E", MAINTENANCE: "#EDEDED;color:#555",
  }[status] || "#EEE;color:#555";
}

/* ---------------- VEHICLES CRUD ---------------- */
async function loadVehiclesTable() {
  const mount = document.getElementById("vehiclesTable");
  try {
    const vehicles = await Api.getVehicles();
    mount.innerHTML = vehicles.length ? `
      <table>
        <thead><tr><th>Vehicle</th><th>Type</th><th>Price/day</th><th>Status</th><th>Reg. No.</th><th></th></tr></thead>
        <tbody>
          ${vehicles.map(v => `
            <tr>
              <td><strong>${escapeHtml(v.name)}</strong><br><span style="color:var(--text-mute);font-size:.82rem;">${escapeHtml(v.brand)}</span></td>
              <td>${escapeHtml(v.type)}</td>
              <td>${money(v.pricePerDay)}</td>
              <td><span class="status-pill" style="background:${pillColor(v.status)}">${v.status}</span></td>
              <td>${escapeHtml(v.registrationNumber || "-")}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-edit btn-sm" data-edit-vehicle="${v.id}">Edit</button>
                  <button class="btn btn-danger btn-sm" data-delete-vehicle="${v.id}">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : `<div class="empty-state">No vehicles yet. Click "Add Vehicle" to create one.</div>`;

    window.__vehicleCache = vehicles;
    wireVehicleRowActions();
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load vehicles.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

function wireVehicleRowActions() {
  document.querySelectorAll("[data-edit-vehicle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = window.__vehicleCache.find(x => String(x.id) === btn.dataset.editVehicle);
      openVehicleModal(v);
    });
  });
  document.querySelectorAll("[data-delete-vehicle]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this vehicle permanently?")) return;
      try {
        await Api.deleteVehicle(btn.dataset.deleteVehicle);
        toast("Vehicle deleted.", "success");
        loadVehiclesTable();
      } catch (err) { toast(err.message, "error"); }
    });
  });
}

function openVehicleModal(vehicle) {
  const modal = document.getElementById("vehicleModal");
  document.getElementById("vehicleModalTitle").textContent = vehicle ? "Edit Vehicle" : "Add Vehicle";
  document.getElementById("vId").value = vehicle ? vehicle.id : "";
  document.getElementById("vName").value = vehicle ? vehicle.name : "";
  document.getElementById("vBrand").value = vehicle ? vehicle.brand : "";
  document.getElementById("vType").value = vehicle ? vehicle.type : "Car";
  document.getElementById("vFuel").value = vehicle ? (vehicle.fuelType || "Petrol") : "Petrol";
  document.getElementById("vTransmission").value = vehicle ? (vehicle.transmission || "Automatic") : "Automatic";
  document.getElementById("vPrice").value = vehicle ? vehicle.pricePerDay : "";
  document.getElementById("vReg").value = vehicle ? (vehicle.registrationNumber || "") : "";
  document.getElementById("vStatus").value = vehicle ? vehicle.status : "AVAILABLE";
  document.getElementById("vImage").value = vehicle ? (vehicle.imageUrl || "") : "";
  document.getElementById("vDesc").value = vehicle ? (vehicle.description || "") : "";
  modal.classList.add("open");
}

function wireVehicleModal() {
  document.getElementById("addVehicleBtn").addEventListener("click", () => openVehicleModal(null));
  document.getElementById("vehicleCancelBtn").addEventListener("click", () => document.getElementById("vehicleModal").classList.remove("open"));

  document.getElementById("vehicleForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("vId").value;
    const payload = {
      name: document.getElementById("vName").value.trim(),
      brand: document.getElementById("vBrand").value.trim(),
      type: document.getElementById("vType").value,
      fuelType: document.getElementById("vFuel").value,
      transmission: document.getElementById("vTransmission").value,
      pricePerDay: parseFloat(document.getElementById("vPrice").value),
      registrationNumber: document.getElementById("vReg").value.trim(),
      status: document.getElementById("vStatus").value,
      imageUrl: document.getElementById("vImage").value.trim(),
      description: document.getElementById("vDesc").value.trim(),
    };
    const btn = document.getElementById("vehicleSaveBtn");
    btn.disabled = true; btn.textContent = "Saving…";
    try {
      if (id) {
        await Api.updateVehicle(id, payload);
        toast("Vehicle updated in the database.", "success");
      } else {
        await Api.createVehicle(payload);
        toast("Vehicle added to the database.", "success");
      }
      document.getElementById("vehicleModal").classList.remove("open");
      loadVehiclesTable();
      loadDashboard();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Save vehicle";
    }
  });
}

/* ---------------- BOOKINGS MANAGEMENT ---------------- */
async function loadBookingsTable() {
  const mount = document.getElementById("bookingsTable");
  try {
    const bookings = await Api.getBookings();
    mount.innerHTML = bookings.length ? `
      <table>
        <thead><tr><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th><th>Payment</th><th></th></tr></thead>
        <tbody>
          ${bookings.map(b => `
            <tr>
              <td>${escapeHtml(b.customer.fullName)}<br><span style="color:var(--text-mute);font-size:.8rem;">${escapeHtml(b.customer.email)}</span></td>
              <td>${escapeHtml(b.vehicle.name)}</td>
              <td>${b.startDate} &rarr; ${b.endDate}</td>
              <td>${money(b.totalCost)}</td>
              <td>
                <select data-status-select="${b.id}" style="padding:6px 8px;border-radius:6px;border:1px solid var(--line-light);font-size:.82rem;">
                  ${["PENDING","CONFIRMED","COMPLETED","CANCELLED"].map(s => `<option value="${s}" ${b.status === s ? "selected" : ""}>${s}</option>`).join("")}
                </select>
              </td>
              <td><span class="status-pill" style="background:${paymentBadgeStyle(b.paymentStatus)}">${b.paymentStatus}</span></td>
              <td><button class="btn btn-danger btn-sm" data-delete-booking="${b.id}">Delete</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : `<div class="empty-state">No bookings yet.</div>`;

    document.querySelectorAll("[data-status-select]").forEach(sel => {
      sel.addEventListener("change", async () => {
        try {
          await Api.setBookingStatus(sel.dataset.statusSelect, sel.value);
          toast("Booking status updated.", "success");
          loadBookingsTable();
        } catch (err) { toast(err.message, "error"); }
      });
    });
    document.querySelectorAll("[data-delete-booking]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this booking record?")) return;
        try {
          await Api.deleteBooking(btn.dataset.deleteBooking);
          toast("Booking deleted.", "success");
          loadBookingsTable();
        } catch (err) { toast(err.message, "error"); }
      });
    });
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load bookings.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

/* ---------------- USERS CRUD ---------------- */
async function loadUsersTable() {
  const mount = document.getElementById("usersTable");
  try {
    const users = await Api.getUsers();
    window.__userCache = users;
    mount.innerHTML = users.length ? `
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Verified</th><th></th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${escapeHtml(u.fullName)}</td>
              <td>${escapeHtml(u.email)}</td>
              <td>${escapeHtml(u.phone || "-")}</td>
              <td><span class="status-pill" style="background:${u.role === "ADMIN" ? "#FFF3DE;color:#C8811E" : "#EDEDED;color:#555"}">${u.role}</span></td>
              <td>${u.emailVerified
                  ? `<span class="status-pill" style="background:#E4F3EA;color:#2F8F5B;">Verified</span>`
                  : `<span class="status-pill" style="background:#FDEDE9;color:#C7462F;">Pending</span>`}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-edit btn-sm" data-edit-user="${u.id}">Edit</button>
                  <button class="btn btn-danger btn-sm" data-delete-user="${u.id}">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : `<div class="empty-state">No users yet.</div>`;

    wireUserRowActions();
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load users.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

function wireUserRowActions() {
  document.querySelectorAll("[data-edit-user]").forEach(btn => {
    btn.addEventListener("click", () => {
      const u = window.__userCache.find(x => String(x.id) === btn.dataset.editUser);
      openUserModal(u);
    });
  });
  document.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const current = Session.get();
      if (String(current.id) === btn.dataset.deleteUser) {
        toast("You can't delete your own logged-in account.", "error");
        return;
      }
      if (!confirm("Delete this user permanently?")) return;
      try {
        await Api.deleteUser(btn.dataset.deleteUser);
        toast("User deleted.", "success");
        loadUsersTable();
      } catch (err) { toast(err.message, "error"); }
    });
  });
}

function openUserModal(u) {
  document.getElementById("uId").value = u.id;
  document.getElementById("uName").value = u.fullName;
  document.getElementById("uEmail").value = u.email;
  document.getElementById("uNic").value = u.nic || "";
  document.getElementById("uPhone").value = u.phone || "";
  document.getElementById("uRole").value = u.role;
  document.getElementById("uPassword").value = "";
  document.getElementById("userModal").classList.add("open");
}

function wireUserModal() {
  document.getElementById("userCancelBtn").addEventListener("click", () => document.getElementById("userModal").classList.remove("open"));
  document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("uId").value;
    const payload = {
      fullName: document.getElementById("uName").value.trim(),
      email: document.getElementById("uEmail").value.trim(),
      nic: document.getElementById("uNic").value.trim(),
      phone: document.getElementById("uPhone").value.trim(),
      role: document.getElementById("uRole").value,
      password: document.getElementById("uPassword").value,
    };
    try {
      await Api.updateUser(id, payload);
      toast("User updated in the database.", "success");
      document.getElementById("userModal").classList.remove("open");
      loadUsersTable();

      const current = Session.get();
      if (String(current.id) === id) {
        Session.save(Object.assign({}, current, { fullName: payload.fullName, email: payload.email, role: payload.role }));
        document.getElementById("adminName").textContent = payload.fullName;
        document.getElementById("adminEmail").textContent = payload.email;
      }
    } catch (err) {
      toast(err.message, "error");
    }
  });
}

/* ---------------- REVIEWS (Manage customer feedback) ---------------- */
async function loadReviewsTable() {
  const mount = document.getElementById("reviewsTable");
  try {
    const reviews = await Api.getAllReviews();
    if (reviews.length === 0) {
      mount.innerHTML = `<div class="empty-state">No reviews yet.</div>`;
      return;
    }
    mount.innerHTML = `
      <table>
        <thead><tr><th>Customer</th><th>Vehicle</th><th>Rating</th><th>Comment</th><th>Date</th><th></th></tr></thead>
        <tbody>
          ${[...reviews].reverse().map(r => `
            <tr>
              <td>${escapeHtml(r.customer.fullName)}</td>
              <td>${escapeHtml(r.vehicle.name)}</td>
              <td>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td>
              <td>${escapeHtml(r.comment || "—")}</td>
              <td>${r.createdAt ? r.createdAt.split("T")[0] : "—"}</td>
              <td><button class="btn btn-danger btn-sm" data-delete-review="${r.id}">Delete</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    document.querySelectorAll("[data-delete-review]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Remove this review?")) return;
        try {
          await Api.deleteReview(btn.dataset.deleteReview);
          loadReviewsTable();
        } catch (err) { toast(err.message, "error"); }
      });
    });
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load reviews.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

/* ---------------- REPORTS & ANALYTICS ----------------
   Computed client-side from the same /vehicles, /bookings and /users data
   the Dashboard already uses - no extra backend endpoints needed. */
async function loadReports() {
  try {
    const [vehicles, bookings] = await Promise.all([Api.getVehicles(), Api.getBookings()]);

    const completed = bookings.filter(b => b.status === "COMPLETED");
    const cancelled = bookings.filter(b => b.status === "CANCELLED");
    const revenue = bookings
      .filter(b => b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + (b.totalCost || 0), 0);

    document.getElementById("repTotalBookings").textContent = bookings.length;
    document.getElementById("repTotalRevenue").textContent = money(revenue);
    document.getElementById("repCompleted").textContent = completed.length;
    document.getElementById("repCancelled").textContent = cancelled.length;

    // Most rented vehicles: count bookings per vehicle, sort descending
    const countByVehicleId = {};
    bookings.forEach(b => {
      countByVehicleId[b.vehicle.id] = (countByVehicleId[b.vehicle.id] || 0) + 1;
    });
    const topVehicles = vehicles
      .map(v => ({ ...v, bookingCount: countByVehicleId[v.id] || 0 }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 8);

    document.getElementById("reportTopVehicles").innerHTML = `
      <table>
        <thead><tr><th>Vehicle</th><th>Type</th><th>Bookings</th></tr></thead>
        <tbody>
          ${topVehicles.map(v => `
            <tr><td>${escapeHtml(v.name)} (${escapeHtml(v.brand)})</td><td>${escapeHtml(v.type)}</td><td>${v.bookingCount}</td></tr>
          `).join("")}
        </tbody>
      </table>
    `;

    // Customer activity: bookings + total spend per customer
    const activityByCustomer = {};
    bookings.forEach(b => {
      const key = b.customer.id;
      if (!activityByCustomer[key]) {
        activityByCustomer[key] = { name: b.customer.fullName, bookings: 0, spend: 0 };
      }
      activityByCustomer[key].bookings += 1;
      if (b.paymentStatus === "PAID") activityByCustomer[key].spend += (b.totalCost || 0);
    });
    const activityRows = Object.values(activityByCustomer).sort((a, b) => b.bookings - a.bookings);

    document.getElementById("reportCustomerActivity").innerHTML = activityRows.length ? `
      <table>
        <thead><tr><th>Customer</th><th>Bookings</th><th>Total Paid</th></tr></thead>
        <tbody>
          ${activityRows.map(a => `
            <tr><td>${escapeHtml(a.name)}</td><td>${a.bookings}</td><td>${money(a.spend)}</td></tr>
          `).join("")}
        </tbody>
      </table>
    ` : `<div class="empty-state">No customer activity yet.</div>`;

  } catch (err) {
    toast("Couldn't load reports: " + err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!guardAdmin()) return;
  wireTabs();
  wireVehicleModal();
  wireUserModal();
  loadDashboard();
});

/* ---------------- AI INSIGHTS (UC-04) ----------------
   Rule-based logic computed live from real booking/vehicle data via the
   /api/ai/* endpoints - see AiController.java for how each figure below
   is actually calculated (there's no hidden magic, every number here is
   explainable). */
async function loadAiInsights() {
  loadAiRecommendationsPreview();
  loadAiPatterns();
  loadAiModelComparison();

  document.getElementById("aiDemandBtn").onclick = loadAiDemand;
}

async function loadAiRecommendationsPreview() {
  const mount = document.getElementById("aiRecsOut");
  try {
    const data = await Api.getAiRecommendations();
    const recs = data.recommendations || [];
    mount.innerHTML = `
      <p style="color:var(--text-mute);font-size:.85rem;margin-bottom:10px;">
        Basis: <b>${data.basis}</b>${data.preferredType ? ` · Preferred type: <b>${escapeHtml(data.preferredType)}</b>` : ""}
      </p>
      <table>
        <thead><tr><th>Vehicle</th><th>Type</th><th>Rate/day</th><th>Match score</th></tr></thead>
        <tbody>
          ${recs.map(r => `
            <tr>
              <td>${escapeHtml(r.vehicle.name)} (${escapeHtml(r.vehicle.brand)})</td>
              <td>${escapeHtml(r.vehicle.type)}</td>
              <td>${money(r.vehicle.pricePerDay)}</td>
              <td>${(r.matchScore * 100).toFixed(0)}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load recommendations.</div>`;
  }
}

async function loadAiPatterns() {
  const mount = document.getElementById("aiPatternsOut");
  try {
    const data = await Api.getAiPatterns();
    if (data.note) { mount.innerHTML = `<div class="empty-state">${escapeHtml(data.note)}</div>`; return; }
    mount.innerHTML = `
      <div class="stat-row">
        <div class="stat-card"><span>Most popular type</span><b>${escapeHtml(data.mostPopularVehicleType || "-")}</b></div>
        <div class="stat-card"><span>Busiest month</span><b>${escapeHtml(data.busiestMonth || "-")}</b></div>
        <div class="stat-card"><span>Busiest weekday</span><b>${escapeHtml(data.busiestWeekday || "-")}</b></div>
        <div class="stat-card"><span>Cancellation rate</span><b>${data.cancellationRatePercent}%</b></div>
      </div>
    `;
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load booking patterns.</div>`;
  }
}

async function loadAiDemand() {
  const category = document.getElementById("aiDemandCategory").value;
  const mount = document.getElementById("aiDemandOut");
  mount.innerHTML = `<div class="spinner"></div>`;
  try {
    const data = await Api.getAiDemand(category);
    mount.innerHTML = `
      <p><b>Predicted bookings next month (${escapeHtml(data.category)}):</b> ${data.predictedNextMonthBookings}
        <span style="color:var(--text-mute);">(confidence: ${data.confidence})</span></p>
    `;
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load demand prediction.</div>`;
  }
}

async function loadAiModelComparison() {
  const mount = document.getElementById("aiComparisonOut");
  try {
    const data = await Api.getAiModelComparison();
    if (data.note) { mount.innerHTML = `<div class="empty-state">${escapeHtml(data.note)}</div>`; return; }
    mount.innerHTML = `
      <p style="color:var(--text-mute);font-size:.85rem;margin-bottom:10px;">Compared on ${data.comparedOn}</p>
      <table>
        <thead><tr><th>Strategy</th><th>Mean Absolute Error</th><th>Status</th></tr></thead>
        <tbody>
          ${data.strategies.map(s => `
            <tr style="${s.status === "selected" ? "font-weight:600;color:var(--good);" : ""}">
              <td>${escapeHtml(s.name)}</td><td>LKR ${s.meanAbsoluteError.toLocaleString()}</td><td>${s.status}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p style="margin-top:10px;">Best strategy: <b>${escapeHtml(data.bestStrategy)}</b></p>
    `;
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load model comparison.</div>`;
  }
}
