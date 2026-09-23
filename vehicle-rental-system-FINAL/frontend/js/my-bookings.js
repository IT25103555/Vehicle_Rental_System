/* =========================================================
   my-bookings.js — customer's own booking history
   ========================================================= */
async function loadMyBookings() {
  const mount = document.getElementById("bookingsMount");
  const user = Session.get();

  if (!user) {
    mount.innerHTML = `<div class="empty-state">Please <a href="login.html?redirect=my-bookings.html">log in</a> to view your bookings.</div>`;
    return;
  }

  try {
    const bookings = await Api.getBookings({ customerId: user.id });
    if (bookings.length === 0) {
      mount.innerHTML = `<div class="empty-state">You haven't made any bookings yet. <a href="vehicles.html">Browse the fleet</a> to get started.</div>`;
      return;
    }
    mount.innerHTML = `
      <div class="panel">
        <table>
          <thead>
            <tr><th>Vehicle</th><th>Pick-up</th><th>Return</th><th>Total</th><th>Status</th><th>Payment</th><th></th></tr>
          </thead>
          <tbody>
            ${bookings.map(bookingRowHtml).join("")}
          </tbody>
        </table>
      </div>
    `;
    wireRowActions();
  } catch (err) {
    mount.innerHTML = `<div class="empty-state">Couldn't load your bookings.<br><small>${escapeHtml(err.message)}</small></div>`;
  }
}

function statusColor(status) {
  return { CONFIRMED: "#E4F3EA;color:#2F8F5B", PENDING: "#FFF3DE;color:#C8811E",
           CANCELLED: "#FDEDE9;color:#C7462F", COMPLETED: "#EDEDED;color:#555" }[status] || "#EEE;color:#555";
}

function bookingRowHtml(b) {
  const canCancel = b.status !== "CANCELLED" && b.status !== "COMPLETED";
  const canPay = b.paymentStatus === "UNPAID" && b.status !== "CANCELLED";
  const canReview = b.status === "COMPLETED";
  return `
    <tr>
      <td><strong>${escapeHtml(b.vehicle.name)}</strong><br><span style="color:var(--text-mute);font-size:.82rem;">${escapeHtml(b.vehicle.brand)}</span></td>
      <td>${b.startDate}</td>
      <td>${b.endDate}</td>
      <td>${money(b.totalCost)}</td>
      <td><span class="status-pill" style="background:${statusColor(b.status)}">${b.status}</span></td>
      <td><span class="status-pill" style="background:${paymentBadgeStyle(b.paymentStatus)}">${b.paymentStatus}</span></td>
      <td>
        <div class="row-actions">
          ${canPay ? `<button class="btn btn-primary btn-sm" data-pay="${b.id}">Pay</button>` : ""}
          ${canReview ? `<button class="btn btn-edit btn-sm" data-review="${b.id}" data-vehicle-id="${b.vehicle.id}" data-vehicle-name="${escapeHtml(b.vehicle.name)}">Leave a Review</button>` : ""}
          ${canCancel ? `<button class="btn btn-danger btn-sm" data-cancel="${b.id}">Cancel</button>` : ""}
        </div>
      </td>
    </tr>
  `;
}

function wireRowActions() {
  document.querySelectorAll("[data-pay]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await Api.payBooking(btn.dataset.pay);
        toast("Payment recorded.", "success");
        loadMyBookings();
      } catch (err) { toast(err.message, "error"); }
    });
  });
  document.querySelectorAll("[data-cancel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Cancel this booking? The vehicle will become available again.")) return;
      try {
        await Api.setBookingStatus(btn.dataset.cancel, "CANCELLED");
        toast("Booking cancelled.", "success");
        loadMyBookings();
      } catch (err) { toast(err.message, "error"); }
    });
  });
  document.querySelectorAll("[data-review]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("reviewBookingId").value = btn.dataset.review;
      document.getElementById("reviewVehicleLabel").dataset.vehicleId = btn.dataset.vehicleId;
      document.getElementById("reviewVehicleLabel").textContent = `For your rental: ${btn.dataset.vehicleName}`;
      document.getElementById("reviewRating").value = "5";
      document.getElementById("reviewComment").value = "";
      document.getElementById("reviewModal").classList.add("open");
    });
  });
}

document.getElementById("reviewCancelBtn").addEventListener("click", () => {
  document.getElementById("reviewModal").classList.remove("open");
});

document.getElementById("reviewSubmitBtn").addEventListener("click", async () => {
  const user = Session.get();
  const vehicleId = document.getElementById("reviewVehicleLabel").dataset.vehicleId;
  const bookingId = document.getElementById("reviewBookingId").value;
  const rating = Number(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value.trim();
  try {
    await Api.createReview({ vehicleId: Number(vehicleId), customerId: user.id, bookingId: Number(bookingId), rating, comment });
    toast("Thanks for your feedback!", "success");
    document.getElementById("reviewModal").classList.remove("open");
  } catch (err) {
    toast(err.message, "error");
  }
});

document.addEventListener("DOMContentLoaded", loadMyBookings);
