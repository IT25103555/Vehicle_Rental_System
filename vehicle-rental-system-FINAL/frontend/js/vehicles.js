/* =========================================================
   vehicles.js — full fleet browsing page
   ========================================================= */
let allVehicles = [];
let carriedDates = { startDate: null, endDate: null };

function vehicleCardHtml(v) {
  const img = v.imageUrl || "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600";
  const dateParams = carriedDates.startDate && carriedDates.endDate
    ? `&startDate=${carriedDates.startDate}&endDate=${carriedDates.endDate}`
    : "";
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
          <a class="btn btn-dark btn-sm" href="booking.html?id=${v.id}${dateParams}">${v.status === "AVAILABLE" ? "Book now" : "View"}</a>
        </div>
      </div>
    </div>
  `;
}

function applyFiltersAndRender() {
  const search = document.getElementById("fSearch").value.trim().toLowerCase();
  const type = document.getElementById("fType").value;
  const status = document.getElementById("fStatus").value;
  const sort = document.getElementById("fSort").value;

  let result = allVehicles.filter(v => {
    const matchesSearch = !search || v.name.toLowerCase().includes(search) || v.brand.toLowerCase().includes(search);
    const matchesType = !type || v.type === type;
    const matchesStatus = !status || v.status === status;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (sort === "price_asc") result.sort((a, b) => a.pricePerDay - b.pricePerDay);
  if (sort === "price_desc") result.sort((a, b) => b.pricePerDay - a.pricePerDay);

  const grid = document.getElementById("vehicleGrid");
  document.getElementById("resultsMeta").textContent = `${result.length} vehicle${result.length === 1 ? "" : "s"} found`;

  grid.innerHTML = result.length
    ? result.map(vehicleCardHtml).join("")
    : `<div class="empty-state" style="grid-column:1/-1;">No vehicles match your filters. Try adjusting them.</div>`;
}

async function loadVehicles() {
  const grid = document.getElementById("vehicleGrid");
  try {
    allVehicles = await Api.getVehicles();
    applyFiltersAndRender();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Couldn't reach the backend on port 8080.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Pre-fill type filter from ?type= query param (used by homepage/footer links)
  const params = new URLSearchParams(window.location.search);
  if (params.get("type")) document.getElementById("fType").value = params.get("type");

  // Dates picked on the homepage's "Find a vehicle" widget aren't used to filter
  // results here (availability isn't tracked per date range in this version) -
  // but they shouldn't just be silently dropped either, so carry them through
  // to whichever vehicle the customer books, and say so.
  if (params.get("startDate") && params.get("endDate")) {
    carriedDates = { startDate: params.get("startDate"), endDate: params.get("endDate") };
    const meta = document.getElementById("resultsMeta");
    meta.insertAdjacentHTML("beforebegin",
      `<div class="form-msg" style="display:block;background:#FFF6E8;color:var(--amber-dark);margin-bottom:14px;">
         Showing the fleet - your dates (${escapeHtml(carriedDates.startDate)} to ${escapeHtml(carriedDates.endDate)}) will be pre-filled when you book.
       </div>`);
  }

  loadVehicles();

  document.getElementById("filterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    applyFiltersAndRender();
  });
  ["fSearch"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFiltersAndRender);
  });
  ["fType", "fStatus", "fSort"].forEach(id => {
    document.getElementById(id).addEventListener("change", applyFiltersAndRender);
  });
});
