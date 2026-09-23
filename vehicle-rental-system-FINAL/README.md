# DriveLanka — Web-Based Vehicle Rental System

SE2030 – Software Engineering | Group Y2-S1-MLB-B7G1-08

A full-stack implementation of the project: **Java (Spring Boot) backend**, a **SQL database**
(H2, file-based — real SQL, zero install), a **JavaScript frontend** for customers, and a
**JavaScript Admin Panel** with full CRUD (Create, Read, Update, Delete) that persists every
change straight to the database.

```
vehicle-rental-system/
├── backend/     Java Spring Boot REST API + SQL database
└── frontend/    Plain HTML/CSS/JS — customer site + Admin panel
```

---

## 1. Run the backend (IntelliJ IDEA)

1. Open IntelliJ → **File → Open** → select the `backend` folder.
2. IntelliJ will detect it's a Maven project and download dependencies automatically
   (this step needs an internet connection the first time).
3. Open `src/main/java/com/rental/vehiclerental/VehicleRentalApplication.java`.
4. Click the green ▶ Run button (or press `Shift+F10`).
5. Wait for the console to show:
   ```
   Vehicle Rental System backend is running!
   API base URL : http://localhost:8080/api
   ```

The database is **H2 running in file mode** — a real SQL database, automatically created at
`backend/data/vehicledb.mv.db` the first time you run the app. No installation, no separate
database server, and your data survives restarts. On first launch it seeds:

- **Admin login:** `admin@rentalsystem.lk` / `admin123`
- **Demo customer:** `kasun@example.com` / `customer123`
- 8 demo vehicles

To browse the database directly in your browser, visit `http://localhost:8080/h2-console` while
the app is running and use JDBC URL `jdbc:h2:file:./data/vehicledb`, user `sa`, blank password.

### Switching to MySQL instead
Open `backend/src/main/resources/application.properties` — the file has a commented block with
MySQL connection settings and instructions. Uncomment it, comment out the H2 block above it, and
create the database first (`CREATE DATABASE vehicle_rental_db;`). The MySQL driver is already
included in `pom.xml`.

---

## 2. Run the frontend

The frontend is plain HTML/CSS/JS — no build step needed. With the backend running on port 8080:

- **Easiest:** double-click `frontend/index.html` to open it in your browser, or
- **Recommended:** open the `frontend` folder in VS Code and use the "Live Server" extension
  (or in IntelliJ, right-click `index.html` → **Open in Browser**) so relative links between
  pages work smoothly.

If your backend runs somewhere other than `http://localhost:8080`, update `API_BASE` at the top
of `frontend/js/api.js`.

### Pages
| Page | Purpose |
|---|---|
| `index.html` | Homepage — hero, live fleet preview, FAQ |
| `vehicles.html` | Full fleet with search/filter/sort |
| `booking.html?id=<vehicleId>` | Vehicle detail, date selection, simulated payment |
| `login.html` / `register.html` | Customer authentication |
| `my-bookings.html` | Customer's own booking history (pay / cancel) |
| `admin.html` | **Admin Panel** — CRUD for Vehicles, Bookings, Users |

---

## 3. What the Admin Panel (CRUD) does

Log in with the admin account, then open **Admin Panel** from the nav bar (or go straight to
`admin.html`).

- **Vehicles tab** — Create, edit, and delete vehicles. Every save calls the REST API
  (`POST /api/vehicles`, `PUT /api/vehicles/{id}`, `DELETE /api/vehicles/{id}`), which writes
  directly to the SQL database through Spring Data JPA — refresh the page or check the H2
  console and the change is there.
- **Bookings tab** — Change a booking's status (which also updates the linked vehicle's
  availability) or delete a booking record.
- **Users tab** — Edit user details/role or delete an account.

Every list on every page (fleet, bookings, users) is fetched live from the backend on load, so
anything the admin changes is immediately reflected for customers too.

---

## 4. REST API reference

Base URL: `http://localhost:8080/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/vehicles` | List vehicles (optional `?type=&brand=&status=&search=`) |
| GET | `/vehicles/{id}` | Get one vehicle |
| POST | `/vehicles` | Create a vehicle |
| PUT | `/vehicles/{id}` | Update a vehicle |
| PATCH | `/vehicles/{id}/status` | Update just the status |
| DELETE | `/vehicles/{id}` | Delete a vehicle |
| POST | `/auth/register` | Register a customer account |
| POST | `/auth/login` | Log in |
| GET | `/users` | List users |
| PUT | `/users/{id}` | Update a user |
| DELETE | `/users/{id}` | Delete a user |
| GET | `/bookings` | List bookings (optional `?customerId=`) |
| POST | `/bookings` | Create a booking |
| PATCH | `/bookings/{id}/status` | Update booking status |
| PATCH | `/bookings/{id}/pay` | Mark a booking as paid (simulated) |
| PUT | `/bookings/{id}` | Update booking dates |
| DELETE | `/bookings/{id}` | Delete a booking |

---

## 5. Notes for the report/demo

- Passwords are hashed with BCrypt before being stored (`spring-security-crypto`) — never stored
  in plain text.
- CORS is open (`CorsConfig.java`) so the frontend can be opened as a static site or from a Live
  Server on any port while calling the API on port 8080.
- Payment is intentionally simulated (per the project proposal's stated limitation) — no real
  card processing occurs.
- This build covers the six core use cases from the group's use case documentation: registration/
  login, vehicle search & browsing, booking & payment, admin vehicle inventory management,
  booking/customer management, and reporting (dashboard stats). The AI recommendation/prediction
  module (UC-04) is not included in this build and would be a good next addition.
