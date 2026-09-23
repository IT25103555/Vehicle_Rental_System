/* =========================================================
   app.js — homepage behaviour
   ========================================================= */
async function loadFleetPreview() {
  const mount = document.getElementById("fleetPreview");
  try {
    const vehicles = await Api.getVehicles();

    document.getElementById("statVehicles").textContent = vehicles.length;
    document.getElementById("statAvailable").textContent =
      vehicles.filter(v => v.status === "AVAILABLE").length;

    const preview = vehicles.slice(0, 4);
    if (preview.length === 0) {
      mount.innerHTML = `<div class="empty-state">No vehicles in the database yet.</div>`;
      return;
    }
    mount.innerHTML = preview.map(vehicleCardHtml).join("");
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't reach the backend. Make sure the Spring Boot server is running on port 8080.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

function vehicleCardHtml(v) {
  const img = v.imageUrl || "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600";
  return `
    <div class="vcard">
      <div class="thumb" style="background-image:url('${img}')">
        <span class="badge ${v.status}">${v.status}</span>
      </div>
      <div class="body">
        <div class="type">${escapeHtml(v.type)} &middot; ${escapeHtml(v.brand)}</div>
        <h4>${escapeHtml(v.name)}</h4>
        <div class="specs">
          <span>&#9881; ${escapeHtml(v.transmission || "-")}</span>
          <span>&#9981; ${escapeHtml(v.fuelType || "-")}</span>
        </div>
        <div class="price-row">
          <div class="price">${money(v.pricePerDay)}<br><small>per day</small></div>
          <a class="btn btn-dark btn-sm" href="booking.html?id=${v.id}">${v.status === "AVAILABLE" ? "Book now" : "View"}</a>
        </div>
      </div>
    </div>
  `;
}

function wireFaq() {
  document.querySelectorAll(".faq-item").forEach(item => {
    item.querySelector(".faq-q").addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });
}

function wireQuickSearch() {
  const form = document.getElementById("quickSearchForm");
  if (!form) return;

  const pickupEl = document.getElementById("qPickup");
  const returnEl = document.getElementById("qReturn");
  const msg = document.getElementById("quickSearchMsg");

  // Same guard rails as the real booking form: can't pick a pick-up date in the
  // past, and the return date can't be before whatever pick-up date is chosen.
  const today = new Date().toISOString().split("T")[0];
  pickupEl.min = today;
  returnEl.min = today;
  pickupEl.addEventListener("change", () => { returnEl.min = pickupEl.value || today; });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.className = "form-msg";

    if (pickupEl.value && returnEl.value && returnEl.value < pickupEl.value) {
      msg.textContent = "Return date must be on or after the pick-up date.";
      msg.classList.add("error");
      return;
    }

    const type = document.getElementById("qType").value;
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (pickupEl.value) params.set("startDate", pickupEl.value);
    if (returnEl.value) params.set("endDate", returnEl.value);
    window.location.href = `vehicles.html${params.toString() ? "?" + params.toString() : ""}`;
  });
}

async function loadRecommendations() {
  const user = Session.get();
  if (!user || user.role !== "CUSTOMER") return; // only meaningful once we know who's asking

  const section = document.getElementById("recommendedSection");
  const grid = document.getElementById("recommendedGrid");
  try {
    const data = await Api.getAiRecommendations(user.id);
    const recs = (data.recommendations || []).map(r => r.vehicle);
    if (recs.length === 0) return; // nothing to show, keep the section hidden

    section.style.display = "";
    grid.innerHTML = recs.slice(0, 4).map(vehicleCardHtml).join("");
  } catch (err) {
    // AI recommendations are a nice-to-have on the homepage - if they fail, just
    // leave the section hidden rather than showing an error on the homepage.
  }
}

function adjustHeroCtaForSession() {
  const btn = document.getElementById("heroCreateAccountBtn");
  if (!btn) return;
  const user = Session.get();
  if (!user) return; // logged out - "Create an account" is the right CTA, leave it

  // Already have an account and are signed in - offering to create one again
  // doesn't make sense, so swap it for something actually useful to them.
  btn.textContent = "My Bookings";
  btn.href = "my-bookings.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadFleetPreview();
  loadRecommendations();
  wireFaq();
  wireQuickSearch();
  adjustHeroCtaForSession();
});
