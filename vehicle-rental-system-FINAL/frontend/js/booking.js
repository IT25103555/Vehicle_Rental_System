/* =========================================================
   booking.js — vehicle detail, booking form, simulated payment
   ========================================================= */
const params = new URLSearchParams(window.location.search);
const vehicleId = params.get("id");

async function init() {
  const wrap = document.getElementById("bookingWrap");
  if (!vehicleId) {
    wrap.innerHTML = `<div class="empty-state">No vehicle selected. <a href="vehicles.html">Browse the fleet</a>.</div>`;
    return;
  }
  try {
    const v = await Api.getVehicle(vehicleId);
    renderDetail(v);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state">Vehicle not found.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

function renderDetail(v) {
  const wrap = document.getElementById("bookingWrap");
  const user = Session.get();
  const img = v.imageUrl || "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600";
  const canBook = v.status === "AVAILABLE";

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:1.1fr .9fr;gap:36px;align-items:flex-start;">
      <div>
        <div style="border-radius:var(--radius);overflow:hidden;border:1px solid var(--line-light);margin-bottom:20px;">
          <img src="${img}" alt="${escapeHtml(v.name)}" style="width:100%;height:320px;object-fit:cover;" />
        </div>
        <div class="type" style="margin-bottom:6px;">${escapeHtml(v.type)} &middot; ${escapeHtml(v.brand)}</div>
        <h1 style="font-size:1.8rem;">${escapeHtml(v.name)}</h1>
        <span class="badge ${v.status}" style="position:static;display:inline-block;margin-bottom:16px;">${v.status}</span>
        <p>${escapeHtml(v.description || "No description provided.")}</p>
        <div class="feature-grid" style="grid-template-columns:repeat(3,1fr);margin-top:20px;">
          <div class="feature-card" style="padding:16px;">
            <div class="type">Fuel type</div>
            <h4 style="font-size:.98rem;margin:0;">${escapeHtml(v.fuelType || "-")}</h4>
          </div>
          <div class="feature-card" style="padding:16px;">
            <div class="type">Transmission</div>
            <h4 style="font-size:.98rem;margin:0;">${escapeHtml(v.transmission || "-")}</h4>
          </div>
          <div class="feature-card" style="padding:16px;">
            <div class="type">Reg. Number</div>
            <h4 style="font-size:.98rem;margin:0;">${escapeHtml(v.registrationNumber || "-")}</h4>
          </div>
        </div>
      </div>

      <div class="hero-panel" style="background:var(--paper-card);border:1px solid var(--line-light);">
        <h3 style="color:var(--ink);">${money(v.pricePerDay)} <small style="font-weight:400;font-size:.7em;color:var(--text-mute);">/ day</small></h3>
        <div id="bookingMsg" class="form-msg"></div>

        ${!user ? `
          <p style="font-size:.9rem;">You need an account to book a vehicle.</p>
          <a class="btn btn-primary btn-block" href="login.html?redirect=booking.html?id=${v.id}">Log in to book</a>
        ` : !canBook ? `
          <p style="font-size:.9rem;">This vehicle is currently <strong>${v.status.toLowerCase()}</strong> and can't be booked right now.</p>
          <a class="btn btn-outline btn-block" href="vehicles.html">See other vehicles</a>
        ` : `
          <form id="bookForm">
            <div class="field">
              <label for="startDate">Pick-up date</label>
              <input type="date" id="startDate" required />
            </div>
            <div class="field">
              <label for="endDate">Return date</label>
              <input type="date" id="endDate" required />
            </div>
            <div class="field" style="background:#0D141B;border-radius:7px;padding:12px 14px;display:flex;justify-content:space-between;">
              <span style="color:var(--text-onink-mute);font-size:.88rem;">Estimated total</span>
              <strong id="estTotal" style="color:var(--text-onink);">—</strong>
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="bookBtn">Confirm booking</button>
          </form>
        `}
      </div>
    </div>

    <!-- Payment modal -->
    <div class="modal-backdrop" id="payModal">
      <div class="modal">
        <h3>Complete payment</h3>
        <p style="margin-bottom:18px;">This is a simulated payment for academic purposes — no real transaction occurs.</p>
        <div class="field"><label>Card number</label><input type="text" id="payCardNumber" placeholder="4242 4242 4242 4242" maxlength="19" inputmode="numeric" autocomplete="off" /></div>
        <div class="grid-2">
          <div class="field"><label>Expiry</label><input type="text" id="payExpiry" placeholder="MM/YY" maxlength="5" inputmode="numeric" autocomplete="off" /></div>
          <div class="field"><label>CVV</label><input type="text" id="payCvv" placeholder="123" maxlength="4" inputmode="numeric" autocomplete="off" /></div>
        </div>
        <div id="payMsg" class="form-msg"></div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="payLaterBtn" type="button">Pay later</button>
          <button class="btn btn-primary" id="payNowBtn" type="button">Pay ${money(v.pricePerDay)} now</button>
        </div>
      </div>
    </div>
  `;

  if (user && canBook) wireBookingForm(v);
}

function wireBookingForm(v) {
  const startEl = document.getElementById("startDate");
  const endEl = document.getElementById("endDate");
  const estTotal = document.getElementById("estTotal");
  const today = new Date().toISOString().split("T")[0];
  startEl.min = today;
  endEl.min = today;

  // If dates were carried over from the homepage's quick search / fleet page,
  // pre-fill them here instead of making the customer re-enter what they already picked.
  const carriedStart = params.get("startDate");
  const carriedEnd = params.get("endDate");
  if (carriedStart && carriedStart >= today) startEl.value = carriedStart;
  if (carriedEnd && (!carriedStart || carriedEnd >= carriedStart)) endEl.value = carriedEnd;
  if (startEl.value) endEl.min = startEl.value;

  let aiPriceTimer = null;

  function recalc() {
    const s = startEl.value, e = endEl.value;
    if (!s || !e) { estTotal.textContent = "—"; return; }
    const days = Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000));
    estTotal.textContent = `${money(days * v.pricePerDay)} (${days} day${days === 1 ? "" : "s"})`;

    // UC-04: AI price prediction alongside the naive rate x days figure - debounced so
    // it only fires once the customer stops adjusting dates.
    clearTimeout(aiPriceTimer);
    aiPriceTimer = setTimeout(async () => {
      try {
        const ai = await Api.predictPrice(v.id, days);
        if (ai && ai.predictedPrice != null) {
          estTotal.innerHTML = `${money(days * v.pricePerDay)} (${days} day${days === 1 ? "" : "s"})`
            + `<br><span style="color:var(--amber-dark);font-size:.85rem;">AI price estimate: ${money(ai.predictedPrice)}</span>`;
        }
      } catch (err) {
        // AI estimate is a bonus figure - if it fails, the naive total above still stands
      }
    }, 400);
  }
  startEl.addEventListener("change", () => { endEl.min = startEl.value; recalc(); });
  endEl.addEventListener("change", recalc);
  if (startEl.value && endEl.value) recalc(); // dates were pre-filled - show the total right away

  document.getElementById("bookForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("bookingMsg");
    msg.className = "form-msg";
    const user = Session.get();

    if (endEl.value < startEl.value) {
      msg.textContent = "Return date must be after the pick-up date.";
      msg.classList.add("error");
      return;
    }

    const btn = document.getElementById("bookBtn");
    btn.disabled = true;
    btn.textContent = "Booking…";

    try {
      const booking = await Api.createBooking({
        vehicleId: v.id,
        customerId: user.id,
        startDate: startEl.value,
        endDate: endEl.value,
      });
      openPaymentModal(booking);
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add("error");
      btn.disabled = false;
      btn.textContent = "Confirm booking";
    }
  });
}

// Basic Luhn checksum - the same algorithm real card networks use to catch typos.
// Stripe's well-known test number 4242 4242 4242 4242 (this form's placeholder) passes it.
function luhnValid(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function openPaymentModal(booking) {
  const modal = document.getElementById("payModal");
  modal.classList.add("open");

  const cardEl = document.getElementById("payCardNumber");
  const expEl = document.getElementById("payExpiry");
  const cvvEl = document.getElementById("payCvv");
  const msg = document.getElementById("payMsg");
  const payBtn = document.getElementById("payNowBtn");
  payBtn.textContent = `Pay ${money(booking.totalCost)} now`; // actual total, not just the per-day rate

  // Live-format as the customer types: group card digits in 4s, auto-insert the "/" in MM/YY.
  cardEl.addEventListener("input", () => {
    cardEl.value = cardEl.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  });
  expEl.addEventListener("input", () => {
    let v = expEl.value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
    expEl.value = v;
  });
  cvvEl.addEventListener("input", () => {
    cvvEl.value = cvvEl.value.replace(/\D/g, "").slice(0, 4);
  });

  function validatePayment() {
    const cardDigits = cardEl.value.replace(/\D/g, "");
    if (cardDigits.length !== 16 || !luhnValid(cardDigits)) {
      return "Enter a valid 16-digit card number.";
    }

    const match = /^(\d{2})\/(\d{2})$/.exec(expEl.value.trim());
    if (!match) return "Enter the expiry as MM/YY.";
    const expMonth = parseInt(match[1], 10);
    const expYear = 2000 + parseInt(match[2], 10);
    if (expMonth < 1 || expMonth > 12) return "Expiry month must be between 01 and 12.";
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return "This card has expired.";
    }
    if (expYear > currentYear + 15) return "Enter a valid expiry year.";

    if (!/^\d{3,4}$/.test(cvvEl.value.trim())) return "CVV must be 3 or 4 digits.";

    return null;
  }

  payBtn.onclick = async () => {
    msg.className = "form-msg";
    const error = validatePayment();
    if (error) {
      msg.textContent = error;
      msg.classList.add("error");
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = "Processing…";
    try {
      await Api.payBooking(booking.id);
      toast("Payment successful — booking confirmed!", "success");
      setTimeout(() => (window.location.href = "my-bookings.html"), 700);
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add("error");
      payBtn.disabled = false;
      payBtn.textContent = `Pay ${money(booking.totalCost)} now`;
    }
  };
  document.getElementById("payLaterBtn").onclick = () => {
    toast("Booking saved — you can pay later from My Bookings.");
    setTimeout(() => (window.location.href = "my-bookings.html"), 700);
  };
}

document.addEventListener("DOMContentLoaded", init);
