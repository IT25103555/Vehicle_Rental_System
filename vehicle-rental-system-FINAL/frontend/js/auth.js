/* =========================================================
   auth.js — login & register form handling
   ========================================================= */
function redirectAfterAuth(user) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (user.role === "ADMIN") {
    window.location.href = "admin.html";
  } else {
    window.location.href = redirect || "index.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Already logged in? bounce away from auth pages
  if (Session.get() && (document.getElementById("loginForm") || document.getElementById("registerForm"))) {
    redirectAfterAuth(Session.get());
    return;
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("loginMsg");
      const btn = document.getElementById("loginBtn");
      const emailVal = document.getElementById("email").value.trim();
      msg.className = "form-msg";
      msg.innerHTML = "";
      btn.disabled = true; btn.textContent = "Logging in…";
      try {
        const user = await Api.login({ email: emailVal, password: document.getElementById("password").value });
        Session.save(user);
        sessionStorage.setItem("dl_welcome_name", user.fullName.split(" ")[0]);
        redirectAfterAuth(user);
      } catch (err) {
        msg.classList.add("error");
        msg.textContent = err.message;

        // Unverified accounts get a one-click way to get a fresh link, right where they hit the wall.
        if (/verify your email/i.test(err.message)) {
          const resendBtn = document.createElement("button");
          resendBtn.type = "button";
          resendBtn.className = "btn btn-outline btn-sm";
          resendBtn.style.marginTop = "8px";
          resendBtn.textContent = "Resend verification email";
          resendBtn.addEventListener("click", async () => {
            resendBtn.disabled = true;
            resendBtn.textContent = "Sending…";
            try {
              const res = await Api.resendVerification(emailVal);
              toast(res.message, "success");
            } finally {
              resendBtn.disabled = false;
              resendBtn.textContent = "Resend verification email";
            }
          });
          msg.appendChild(document.createElement("br"));
          msg.appendChild(resendBtn);
        }

        btn.disabled = false; btn.textContent = "Log in";
      }
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("registerMsg");
      const btn = document.getElementById("registerBtn");
      msg.className = "form-msg";

      const nic = document.getElementById("nic").value.trim();
      const phone = document.getElementById("phone").value.trim();

      // NIC: old format = 9 digits + V/X, new format = 12 digits
      if (!/^(\d{9}[VvXx]|\d{12})$/.test(nic)) {
        msg.textContent = "NIC must be 9 digits followed by V or X (old format) or exactly 12 digits (new format).";
        msg.classList.add("error");
        return;
      }
      // Phone: exactly 10 digits
      if (!/^0\d{9}$/.test(phone)) {
        msg.textContent = "Phone number must be exactly 10 digits, starting with 0.";
        msg.classList.add("error");
        return;
      }

      btn.disabled = true; btn.textContent = "Creating account…";
      try {
        const result = await Api.register({
          fullName: document.getElementById("fullName").value.trim(),
          email: document.getElementById("email").value.trim(),
          nic,
          phone,
          password: document.getElementById("password").value,
        });
        // Account is created but NOT logged in yet - it still needs email verification.
        showCheckEmailPanel(result.email);
      } catch (err) {
        msg.textContent = err.message;
        msg.classList.add("error");
        btn.disabled = false; btn.textContent = "Create account";
      }
    });
  }
});

function showCheckEmailPanel(email) {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("registerMsg");
  msg.className = "form-msg";
  msg.textContent = "";
  form.style.display = "none";

  const panel = document.createElement("div");
  panel.innerHTML = `
    <div style="text-align:center;padding:8px 0 4px;">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--amber);color:#1A1204;
                  font-size:26px;line-height:52px;margin:0 auto 14px;">&#9993;</div>
      <h3 style="margin:0 0 8px;">Check your email</h3>
      <p style="color:var(--text-mute);margin:0 0 18px;">
        We've sent a verification link to <b>${escapeHtml(email)}</b>. Click it to activate your
        account, then come back and log in.
      </p>
      <button type="button" class="btn btn-outline btn-block" id="resendFromRegisterBtn">Resend the email</button>
      <a href="login.html" class="btn btn-primary btn-block" style="margin-top:10px;">Go to log in</a>
    </div>
  `;
  form.insertAdjacentElement("afterend", panel);

  document.getElementById("resendFromRegisterBtn").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const res = await Api.resendVerification(email);
      toast(res.message, "success");
    } finally {
      btn.disabled = false; btn.textContent = "Resend the email";
    }
  });
}
