/* =========================================================
   profile.js — lets a logged-in user view and edit their own
   account details (name, email, phone, NIC, password).
   Reuses the same PUT /api/users/{id} endpoint the admin
   panel's "Users (CRUD)" tab already calls - the difference
   is this form only ever edits the currently logged-in user,
   and never exposes the role field, so nobody can promote
   themselves to ADMIN through it.
   ========================================================= */

function profileFormHtml(user) {
  return `
    <div class="auth-card" style="max-width:100%;">
      <h2>Account details</h2>
      <p class="sub">Update your contact details, or set a new password below.</p>
      <div id="profileMsg" class="form-msg"></div>
      <form id="profileForm">
        <div class="field">
          <label for="pFullName">Full name</label>
          <input type="text" id="pFullName" required value="${escapeHtml(user.fullName)}" />
        </div>
        <div class="field">
          <label for="pEmail">Email address</label>
          <input type="email" id="pEmail" required value="${escapeHtml(user.email)}" />
        </div>
        <div class="field">
          <label for="pPhone">Phone number</label>
          <input type="tel" id="pPhone" required maxlength="10"
                 pattern="^0\\d{9}$" title="Phone number must be exactly 10 digits, starting with 0."
                 value="${escapeHtml(user.phone || "")}" />
        </div>
        <div class="field">
          <label for="pNic">NIC number</label>
          <input type="text" id="pNic" required
                 pattern="^(\\d{9}[VvXx]|\\d{12})$"
                 title="Old NIC: 9 digits followed by V or X. New NIC: 12 digits."
                 value="${escapeHtml(user.nic || "")}" />
          <small class="field-hint">Old format: 9 digits + V/X. New format: 12 digits.</small>
        </div>
        <div class="field">
          <label for="pPassword">New password</label>
          <input type="password" id="pPassword" minlength="6" placeholder="Leave blank to keep your current password" />
          <small class="field-hint">Only fill this in if you want to change your password.</small>
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="profileSaveBtn">Save changes</button>
      </form>
    </div>
  `;
}

async function loadProfile() {
  const mount = document.getElementById("profileMount");
  const user = Session.get();

  if (!user) {
    mount.innerHTML = `<div class="empty-state">Please <a href="login.html?redirect=profile.html">log in</a> to view your profile.</div>`;
    return;
  }

  mount.innerHTML = profileFormHtml(user);

  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("profileMsg");
    const btn = document.getElementById("profileSaveBtn");
    msg.className = "form-msg";

    const phone = document.getElementById("pPhone").value.trim();
    const nic = document.getElementById("pNic").value.trim();

    if (!/^0\d{9}$/.test(phone)) {
      msg.textContent = "Phone number must be exactly 10 digits, starting with 0.";
      msg.classList.add("error");
      return;
    }
    if (!/^(\d{9}[VvXx]|\d{12})$/.test(nic)) {
      msg.textContent = "NIC must be 9 digits followed by V or X (old format) or exactly 12 digits (new format).";
      msg.classList.add("error");
      return;
    }

    const password = document.getElementById("pPassword").value;
    const payload = {
      fullName: document.getElementById("pFullName").value.trim(),
      email: document.getElementById("pEmail").value.trim(),
      phone,
      nic,
      role: user.role, // always their own current role - this form can never change it
    };
    if (password) payload.password = password;

    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      const updated = await Api.updateUser(user.id, payload);
      Session.save(updated); // keep the navbar greeting / stored session in sync
      msg.textContent = "Profile updated successfully.";
      msg.classList.remove("error");
      msg.classList.add("success");
      document.getElementById("pPassword").value = "";
      renderNav(document.body.dataset.page || ""); // refresh "Hi, Name" if it changed
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add("error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save changes";
    }
  });
}

document.addEventListener("DOMContentLoaded", loadProfile);
