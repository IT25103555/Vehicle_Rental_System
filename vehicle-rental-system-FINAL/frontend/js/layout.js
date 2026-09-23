/* =========================================================
   layout.js — injects the shared nav bar and footer, and keeps
   them in sync with whether someone is logged in.
   ========================================================= */
function renderNav(activePage) {
  const mount = document.getElementById("nav-mount");
  if (!mount) return;
  const user = Session.get();

  const links = [
    { href: "index.html", label: "Home" },
    { href: "vehicles.html", label: "Fleet" },
    { href: "my-bookings.html", label: "My Bookings" },
  ];

  mount.innerHTML = `
    <div class="wrap">
      <a class="brand" href="index.html"><span class="dot"></span>DriveLanka</a>
      <ul class="nav-links" id="navLinks">
        ${links.map(l => `<li><a href="${l.href}" class="${activePage === l.href ? "active" : ""}">${l.label}</a></li>`).join("")}
      </ul>
      <div class="nav-actions">
        ${user
          ? `<a href="profile.html" style="color:var(--text-onink-mute);font-size:.88rem;">Hi, ${escapeHtml(user.fullName.split(" ")[0])}</a>
             ${user.role === "ADMIN" ? `<a href="admin.html" class="btn btn-outline btn-sm">Admin Panel</a>` : ""}
             <button class="btn btn-primary btn-sm" id="logoutBtn">Log out</button>`
          : `<a href="login.html" class="btn btn-outline btn-sm">Log in</a>
             <a href="register.html" class="btn btn-primary btn-sm">Sign up</a>`
        }
        <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">&#9776;</button>
      </div>
    </div>
  `;

  document.getElementById("navToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Session.clear();
      toast("Logged out.");
      setTimeout(() => (window.location.href = "index.html"), 400);
    });
  }
}

function renderFooter() {
  const mount = document.getElementById("footer-mount");
  if (!mount) return;
  mount.innerHTML = `
    <div class="wrap">
      <div class="cols">
        <div>
          <a class="brand" href="index.html"><span class="dot"></span>DriveLanka</a>
          <p style="margin-top:14px;max-width:32ch;">A web-based vehicle rental platform with real-time availability, online booking, and AI-assisted recommendations, built for SE2030.</p>
        </div>
        <div>
          <h5>Quick Links</h5>
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="vehicles.html">Browse Fleet</a></li>
            <li><a href="my-bookings.html">My Bookings</a></li>
            <li><a href="login.html">Log in</a></li>
          </ul>
        </div>
        <div>
          <h5>Vehicle Types</h5>
          <ul>
            <li><a href="vehicles.html?type=Car">Cars</a></li>
            <li><a href="vehicles.html?type=Van">Vans</a></li>
            <li><a href="vehicles.html?type=SUV">SUVs</a></li>
            <li><a href="vehicles.html?type=Motorbike">Motorbikes</a></li>
          </ul>
        </div>
        <div>
          <h5>Get in Touch</h5>
          <ul>
            <li>Island-wide service — Sri Lanka</li>
            <li>0766 221 422</li>
            <li>support@drivelanka.lk</li>
          </ul>
        </div>
      </div>
      <div class="bottom">
        <span>&copy; 2026 DriveLanka Vehicle Rental. SE2030 Group Y2-S1-MLB-B7G1-08.</span>
        <span>Built with Java Spring Boot &middot; SQL &middot; JavaScript</span>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderNav(document.body.dataset.page || "");
  renderFooter();

  // If auth.js just logged someone in, it stashes their first name here before
  // redirecting - show the "Welcome back" toast on the page they actually land
  // on, instead of on login.html where it barely has time to appear.
  const welcomeName = sessionStorage.getItem("dl_welcome_name");
  if (welcomeName) {
    sessionStorage.removeItem("dl_welcome_name");
    toast(`Welcome back, ${welcomeName}!`, "success");
  }
});
