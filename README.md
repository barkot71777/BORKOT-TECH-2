# Borkot Tech (বরকত টেক)

> **Pre-launch security note:** The current JSON-file storage is suitable only for local development/testing. Do not use it for a live store with real customer/order data until a transactional persistent database is configured and concurrency, backups, and restore are tested. Password reset remains unavailable until a secure email provider is integrated.
## Premier Bangladesh-Based Technology & Gaming E-Commerce Platform

Borkot Tech (বরকত টেক) is a full-stack e-commerce application intended for development and testing; production launch requires the remaining deployment and database security work engineered for the Bangladesh technology, computer accessories, electronics, and esports gaming market.

---

## 1. Brand Identity & Bangladesh Localization

- **Brand Name**: Borkot Tech (English) / **বরকত টেক** (Bengali)
- **Target Category**: Desktop PCs, High-Performance Components (CPUs, Motherboards, GPUs, NVMe Storage, RAM), Gaming Peripherals, Displays, and Accessories.
- **Showroom Base**: Configure the verified business address in Admin Settings before launch.
- **Original Logo & Monogram**: Scalable SVG asset featuring a circuit-inspired geometric BT monogram hexagon badge, bilingual typography, and clean contrast across dark and light surfaces.
- **Bilingual Interface**: One-click instant switcher between **English (EN)** and **Bengali (বাংলা)** across all pages, buttons, checkout forms, order tracking, and administrative interfaces.
- **Bangladeshi Currency (BDT)**: All pricing formatted in Bangladeshi Taka (`৳` / BDT) with tabular numerals and proper numeral grouping.
- **Bangladesh Administrative Divisions & Locations**: Pre-configured with all 8 administrative divisions (Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, Mymensingh) and major districts & thanas/upazilas.
- **Mobile Number Validation**: Strict regex validation for Bangladeshi contact formats (`+8801[3-9]XXXXXXXX` / `01[3-9]XXXXXXXX`).
- **Payment Architecture**:
  - **Cash on Delivery (COD)** with nationwide courier support.
  - **bKash & Nagad**: Manual transaction-ID submission is not automatic payment verification. Configure an official provider API and verify transactions server-side before accepting online payments.
  - **Bank Transfer**: Enter verified business bank details in Admin Settings before enabling this option.
- **Courier Logistics**: Delivery charges and free-shipping thresholds must be configured by the owner before launch; no unverified rates are pre-filled.

---

## 2. Strict Product Catalog Rule

**Important Architectural Note**:
To maintain total commercial credibility and eliminate fake "AI demo products", **the production product catalog starts completely empty**.
- No fabricated stock levels, fake discounts, sample prices, or dummy customer reviews are pre-populated.
- The storefront homepage, catalog, search, and PC builder display an authentic empty catalog notice explaining that real inventory is managed by store staff.
- **Only products explicitly created and published by an authorized administrator in the secure `/admin` portal will appear in the customer store**.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend**: Node.js, Express 4, `tsx` TypeScript runtime, Native Cryptography (`crypto.pbkdf2Sync`, `crypto.timingSafeEqual`, `crypto.createHmac`).
- **Database**: Durable file-backed relational-document store (`data/borkot_tech.db.json`) featuring:
  - Atomic rename-write durability to prevent corruption during host restarts.
  - Granular inventory transaction logs and zero-negative stock safeguards.
  - Foreign key relations between products, categories, brands, orders, and users.
  - One-click sanitized JSON backup export and disaster recovery procedures.

---

## 4. Data safety and backups

- Local/testing JSON data is stored at `data/borkot_tech.db.json` by default. Keep the `data/` folder when updating application code.
- Before each successful database replacement, the previous database is copied into `data/backups/`. The latest 10 automatic backups are retained.
- If the database JSON becomes unreadable, startup now stops and preserves a copy instead of silently creating a new empty database.
- Set `BORKOT_DATA_DIR` to a persistent mounted disk path when running on a host that supports persistent disks. A normal deploy/serverless filesystem may be temporary; JSON-file storage is **not suitable for a production store or multiple server instances**.
- Automatic local backups are not a substitute for an off-site backup. Periodically download/export a backup and test restoring it. Keep backups private because they contain customer and order information.
- Never commit `.env`, production secrets, database files, or backup files to GitHub.

## 5. Getting Started Locally (VS Code on Windows / Mac / Linux)

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher.
- Git.

### Step 1: Clone or Extract the Project
Open terminal or PowerShell in your desired folder:
```bash
git clone <repository_url> borkot-tech
cd borkot-tech
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac / Linux:
cp .env.example .env
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start the Full-Stack Dev Server
```bash
npm run dev
```
The server will start on **`http://localhost:3000`**.

---

## 6. Initial Super Admin Account Setup

When the application is first launched, **no default password or public admin account exists**:

1. Navigate in your browser to **`http://localhost:3000/admin`**.
2. The initial **Owner Account Setup Wizard** will automatically appear.
3. Provide your name, official work email, phone number, and a strong password (minimum 8 characters).
4. Submitting this form initializes the root `super_admin` account.
5. Once created, the setup endpoint automatically locks itself against duplicate registrations.

---

## 7. Administrative Modules (`/admin`)

- **Dashboard**: Real-time sales volume, orders awaiting processing, verified product count, low-stock alerts, and out-of-stock items.
- **Products & Catalog**:
  - Add and edit authentic hardware products with English and Bengali titles.
  - SKU assignment with uniqueness validation.
  - Cost price, selling price, and optional strikethrough original price.
  - Stock quantity and configurable low-stock threshold.
  - Technical hardware specifications (e.g. Chipset, VRAM, Clock speed, Socket).
  - Official Bangladesh warranty period and DOA return policy.
- **Inventory & Audit Logs**:
  - Stock intake from distributor shipments.
  - Damaged stock-out recording.
  - Mandatory reason documentation and timestamped operator audit trails.
  - Strict prevention of negative inventory.
- **Order Management**:
  - Inspect items, customer contact, and delivery destination.
  - Verify bKash / Nagad TrxIDs.
  - Progress order stages: `pending` → `confirmed` → `processing` → `shipped` → `delivered` (or `cancelled`).
  - Assign courier partner (Pathao, Steadfast, RedX, Sundarban) and tracking code.
  - **Generate Printable Tax Invoice**: Formatted for standard A4 printing with Borkot Tech trade license, itemized table, BDT pricing, and authorized seal block.
- **Staff & Roles**: Super Admin can provision staff accounts with restricted roles (`product_manager`, `inventory_manager`, `order_manager`, `customer_support`).
- **Store Settings**: Update showroom address, hotlines, shipping rates, merchant numbers, and policies.
- **Database Backup**: One-click download of the current database state as JSON.

---

## 8. Security Controls

1. **Password Hashing**: PBKDF2-SHA512 with 10,000 iterations and a unique 16-byte cryptographically random salt per user. Timing-safe comparison prevents side-channel timing attacks.
2. **Customer Data Isolation**: Server-side permission guards strictly prevent any customer from accessing another customer's orders or profile information.
3. **Price & Stock Tamper Prevention**: The browser client submits only `productId` and `quantity`. The server looks up authoritative database prices and decrements stock inside an atomic lock, preventing client-side price tampering.
4. **Order Cancellation Safety**: When an order is cancelled by customer or staff, reserved stock is automatically returned to active inventory with an audit log record (`order_cancel_return`).

---

## 9. Production Deployment

### Option A: Node.js Host (VPS / Ubuntu / Debian)
1. Build the production frontend:
   ```bash
   npm run build
   ```
2. Start the production server using PM2 or systemd:
   ```bash
   NODE_ENV=production PORT=3000 node server.js
   ```
3. Configure Nginx reverse proxy with SSL (Certbot) on port 80/443 pointing to `http://127.0.0.1:3000`.

### Option B: Cloud Hosting (Render / Railway / Fly.io)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node server.js` (or `npx tsx server.ts`)
- **Port**: `3000` (or host-provided `$PORT`)
- Set environment variables (`NODE_ENV=production`, `JWT_SECRET`).

---

## 10. License & Credits

© 2026 Borkot Tech (বরকত টেক). All rights reserved. Trade License Registered in Dhaka, Bangladesh.
