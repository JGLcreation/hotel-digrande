# The Grand Luxe Hotel & Resort — Luxury Management & Reservation System

An enterprise-grade luxury hotel reservation, property management (PMS), and access control platform built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js/Express**, and **MySQL** with Spatie-compatible Role & Granular Permission architecture, fully tailored for local development with **Laravel Herd**.

---

## 🏛️ System Architecture

- **Frontend:** React 19 (SPA), Vite, Tailwind CSS, Lucide Icons, Cormorant Garamond & Inter typography.
- **Backend:** Express, TypeScript (`tsx`), JWT Authentication, Role & Permission Gates.
- **Database:** MySQL on port `3307` (`hotel` database) with full schema for users, roles, permissions, rooms, reservations, folios, system rules, and audit logs.
- **Laravel Herd / Nginx Gateway:** Custom `LocalValetDriver.php` and `index.php` reverse-proxy ensuring instant routing, zero blank-screen issues, and automated fallback.

---

## 🔑 Default Roles & Credentials

The system comes pre-seeded with four primary operational roles:

| Role | Username | Password | Dashboard Access | Key Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **Super Administrator** | `lozada` | `lozada123` | **SuperAdmin Dashboard** | Full system governance, user registration, role & granular permission editing, business rules configuration, audit logs |
| **General Manager (Admin)** | `admin` | `admin123` | **Staff / GM Dashboard** | Real-time hotel KPIs (ADR, RevPAR, Occupancy), room inventory matrix, folios, billing management |
| **Front Desk Staff** | `clara` | `staff123` | **Staff Dashboard** | Guest arrivals/departures, room assignments, check-in / check-out, room status updates, folio item charges |
| **VIP Guest** | `guest_vip` | `guest123` | **Guest Portal** | Suite browsing, date & party reservation flow, curated experiences (Spa, Yacht, Dining) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Laravel Herd** (or standard Nginx / PHP 8.2+)
- **MySQL Database Server** (running on port `3307`)

### 2. Database Setup
Create the MySQL database and import the pre-configured schema & seeds:
```sql
CREATE DATABASE IF NOT EXISTS hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Import the schema located at [`database/hotel_schema_and_seeds.sql`](database/hotel_schema_and_seeds.sql):
```bash
mysql -h 127.0.0.1 -P 3307 -u root -p hotel < database/hotel_schema_and_seeds.sql
```

### 3. Environment Variables
Create or verify your `.env` file in the project root:
```ini
PORT=3000
NODE_ENV=development

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=hotel
DB_USERNAME=root
DB_PASSWORD=lozada2004

JWT_SECRET=the-grand-luxe-secret-key-2026-luxury-hotel
VITE_API_URL=/api
```

### 4. Install Dependencies & Build Frontend
```bash
npm install
npm run build
```

### 5. Launch Backend Server
```bash
npm run dev
# or: node node_modules/tsx/dist/cli.mjs server.ts
```

### 6. Laravel Herd Access
In Laravel Herd, park or link the repository directory:
- Domain: `https://the-grand-luxe-hotel-resort-1.test`
- The custom `LocalValetDriver.php` and `index.php` will serve static assets and proxy all `/api/*` traffic automatically to the Node server.

---

## 🌟 Key Features

### 1. SuperAdmin User & Permission Governance
- **Granular Spatie-Style Permissions:** Assign individual privileges (`manage_users`, `manage_roles`, `manage_rules`, `manage_inventory`, `manage_reservations`, `manage_folios`, `front_desk_checkin`, `view_analytics`, `book_suites`) to any registered account.
- **Account Registration:** Register new staff, administrators, or guests with role presets and custom permissions directly from the User Directory.
- **Reservation Folio Inspector:** View any guest's complete reservation history, party size, assigned rooms, and folio totals.
- **Hotel Business Rules Engine:** Configure live policies including overbooking allowance, complimentary cancellation windows, advance booking limits, and automatic folio item charges.
- **Audit Trails:** Immutable logging of user creations, role transitions, and permission updates.

### 2. Front Desk & GM Management Dashboard
- **Executive KPIs:** Live ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), Occupancy Rate, Total Folio Revenue, and Active In-House Guests.
- **Visual Floor & Room Matrix:** Interactive grid displaying real-time room statuses: *Available*, *Occupied*, *Reserved*, *Housekeeping / Cleaning*, and *Maintenance*.
- **Arrivals & Departures Management:** One-click guest check-in, check-out, and room re-assignment.
- **Guest Folios & Billing:** Real-time billing breakdowns, service charges, spa treatments, Michelin dining, and private transfers.

### 3. Guest Sanctuary Portal & Booking Flow
- **Signature Accommodations:** Explore Classic Heritage King Room, Deluxe Ocean Vista Suite, Executive Grand Suite, Presidential Penthouse, and Private Garden Sanctuary Villa.
- **Interactive Reservation Wizard:** Multi-step date selection, guest party count, luxury add-ons, and instant booking confirmation.
