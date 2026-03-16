## CASA DE LABADA – Laundry Shop Ledger & Tracking System

### Project Overview / Introduction

**CASA DE LABADA** is a small, focused web application designed for laundry shop owners and staff.  
It helps you:

- **Record customers and their laundry** (name, weight, service type).
- **Automatically compute prices and machine cycles** based on the weight and service.
- **Track payments and balances** (unpaid, partial, fully paid).
- **Mark orders as claimed** once customers pick up their laundry.
- **Generate simple PDF reports** for daily or weekly summaries.

The system was created to replace manual notebooks or spreadsheets with a **simple, mobile‑friendly ledger** that can be used right inside a phone’s browser or installed as a PWA (Progressive Web App) on Android / iOS.

---

### Key Features

- **Mobile‑first, PWA‑ready interface**
  - Works well on phones, tablets, and desktops.
  - Can be **installed to the home screen** like a native app.

- **Customer entry and automatic pricing**
  - Add a customer with **OR (receipt) number**, name, weight, and service type.
  - System automatically:
    - Calculates **estimated price**.
    - Calculates **number of machine cycles** (e.g., 1–7 kg = 1 cycle, etc.).
    - Warns if weight exceeds recommended per‑cycle limits.

- **Payment tracking**
  - Record **advance or full payments**.
  - Automatically tracks **remaining balance**.
  - Status labels like **UNPAID**, **BALANCE**, and **PAID**.

- **Order lifecycle management**
  - Orders can be:
    - **Added** (new entry).
    - **Updated** when payment is settled.
    - **Marked as claimed** once picked up.
    - **Voided** in case of wrong entries.

- **Search and filter**
  - Search today’s orders by **customer name** or **OR number**.

- **PDF reporting**
  - Generate **daily or weekly** PDF reports of transactions.

- **Offline‑friendly Firestore**
  - Uses Firebase Firestore with **offline caching** and **multi‑tab support**, so data is robust even with spotty internet.

---

### System Architecture / How the System Works

At a high level, the system works like this:

1. **User signs in**
   - Authentication is handled by **Firebase Auth**.
   - If you are not signed in, you see the **Login Screen**.
   - Once signed in, you are taken to the **Dashboard**.

2. **Dashboard – the main workspace**
   - Top area shows **summary cards**:
     - Loads done.
     - Cash collected.
     - Unpaid balance.
   - Middle area has a **“How does the system work?”** guide that explains the workflow in plain language.
   - Main section shows **Today’s Orders**:
     - A list of active orders with actions: **Settle**, **Claim**, **Void**, **View details**.
   - There is also a **Claims / Picked Up** section for completed orders.

3. **Adding customers**
   - When you click **“Add Customer”**, a **responsive modal** opens (bottom sheet on mobile, centered on desktop).
   - You fill in:
     - OR number.
     - Customer name.
     - Weight.
     - Service type (e.g., regular, comforter, etc.).
     - Optional payment.
   - The system:
     - Validates input (e.g., unique OR number).
     - Computes total price, cycles, balance, and status.
     - Saves the new entry to Firestore.

4. **Updating and claiming orders**
   - **Settle Payment**:
     - Opens a modal for recording a payment.
     - Automatically recalculates balance and status.
   - **Claim**:
     - Opens a confirmation modal.
     - Once confirmed, the order is marked as **CLAIMED** and moved to the Claims section.
   - **Void**:
     - Marks an entry as voided (useful for mistakes).

5. **Reporting**
   - From the header, you can open a **Report modal**.
   - Choose **Daily** or **Weekly** report.
   - The system fetches records, filters them by date, and exports a **PDF** via `html2canvas` + `jsPDF`.

6. **PWA install**
   - When supported by the browser, a **banner** appears asking if you want to install **CASA DE LABADA**.
   - If accepted, the app can be launched directly from the home screen.

---

### Technology Stack

- **Frontend Framework**
  - `React` – UI library for building the interface.
  - `Vite` – fast development server and build tool.

- **UI & Styling**
  - `Tailwind CSS` – utility‑first CSS framework for styling.
  - `lucide-react` – icon set used across the UI.

- **State & Logic**
  - Custom hook `useLedgerStore` for managing ledger data and statistics.

- **Backend / Data**
  - `Firebase`
    - `firebase/auth` – user authentication.
    - `firebase/firestore` – cloud database with offline cache.

- **Reporting & Export**
  - `html2canvas` – renders HTML to canvas for exporting.
  - `jspdf` and `jspdf-autotable` – creates PDF files with tables.

- **Notifications**
  - `sonner` – toast notifications (small messages in the corner).

- **Build & Tooling**
  - `ESLint` – code linting.
  - `PostCSS`, `Autoprefixer`, `Tailwind` – CSS processing.
  - `vite-plugin-pwa` – service worker + PWA support.

---

### Project Structure

High‑level folders (under `src/`):

- **`index.jsx`**
  - Entry point that mounts the React app into the page.

- **`App.jsx`**
  - Main component that:
    - Handles **authentication state** (logged in or not).
    - Shows **LoginScreen** or **Dashboard**.
    - Manages the **PWA install banner**.
    - Sets up the **toast notification** system.

- **`pages/Dashboard.jsx`**
  - Main working screen after login.
  - Shows:
    - Summary cards (`BentoCard`).
    - Today’s Orders and Claimed Orders using `LedgerTable`.
    - Guide explaining the workflow.
    - Footer, modals for new entry, payments, details, claims, and reports.

- **`components/`**
  - `LoginScreen.jsx` – login UI.
  - `Logo.jsx` – brand logo.
  - `BentoCard.jsx` – small dashboard statistics tiles.
  - `LedgerTable.jsx` – table that lists customer entries with actions.
  - `NewEntryModal.jsx` – form for adding a new customer/order.
  - `SettlePaymentModal.jsx` – form to record or update payment.
  - `TransactionDetailsModal.jsx` – detailed breakdown of a single order.
  - `ClaimConfirmationModal.jsx` – confirmation dialog for marking an order as claimed.
  - `ReportModal.jsx` – UI for choosing and generating PDF reports.
  - `Modal.jsx` – **reusable responsive modal system**:
    - Fixed overlay with backdrop.
    - Body scrolls internally.
    - Uses viewport‑safe heights (e.g., `100dvh`) for mobile.
  - `Toast.jsx` – helper for toast notifications (if used).
  - `ExportUtils.js` – logic to build and export PDF reports.

- **`hooks/useLedgerStore.js`**
  - Central store for:
    - List of ledger entries.
    - Computed statistics (loads done, revenue, receivables).
    - Functions to add, void, settle, and mark entries as claimed.

- **`services/db.js`**
  - Wrapper around Firestore:
    - CRUD operations (create, read, update, etc.).
    - Helper like `checkOrNumberExists` to ensure OR numbers are unique.
    - `fetchAllForReport` to gather data for PDF export.

- **`types/ledger.js`**
  - Business logic and helpers:
    - Service labels.
    - Price calculation based on weight and service type.
    - Cycle computation.
    - Balance and status calculation.
    - Validation helpers.

- **`config/firebase.js`**
  - Sets up Firebase app, Firestore, and Auth.
  - Uses environment variables (`VITE_FIREBASE_*`) so secrets are not hard‑coded.

- **`index.css`**
  - Global styles and Tailwind directives.
  - Custom utilities for:
    - Scroll behavior.
    - Animations (`fade-in`, `scale-in`, `slide-up`).
    - Modal viewport handling (`modal-viewport`, `modal-panel`).
    - Mobile usability tweaks (tap highlights, number input behavior).

Other important files:

- **`firebase.json`, `firestore.rules`, `firestore.indexes.json`**
  - Firebase hosting, database rules, and index configuration (used when deploying to Firebase).

- **`vite.config.js`**
  - Vite configuration including PWA plugin setup.

- **`package.json`**
  - Scripts and dependency list.

---

### Installation Guide

These steps explain how to run the project locally on your computer.

#### 1. Prerequisites

Make sure you have:

- **Node.js** (recommended: latest LTS version, e.g. 18+).
- **Yarn** (preferred) or `npm`.
- A **Firebase project** (for production‑like use) if you want real data sync.

#### 2. Clone the repository

```bash
git clone <your-repo-url>
cd CASA-DE-LABADA
```

#### 3. Install dependencies

Using Yarn:

```bash
yarn install
```

Or with npm:

```bash
npm install
```

#### 4. Configure environment variables

Create a file named **`.env`** or **`.env.local`** in the project root with your Firebase settings:

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

If you are only exploring the UI and have no Firebase project yet, you can:

- Use a **test Firebase project**, or
- Comment out Firebase‑dependent parts (not recommended for real use).

#### 5. Run the development server

Using Yarn:

```bash
yarn dev
```

Then open the URL shown in the terminal, usually:

```text
http://localhost:5173
```

#### 6. Create a production build (optional)

```bash
yarn build
```

This outputs static files into the `dist/` directory, which can be deployed to Firebase Hosting or any static hosting service.

---

### Usage Guide

1. **Open the app**
   - Visit the local URL (`http://localhost:5173`) or your deployed URL (for example `https://casa-de-labada.web.app`).

2. **Log in**
   - The **Login Screen** will appear.
   - Log in using the configured Firebase Auth credentials (e.g., email/password configured in your Firebase project).

3. **View dashboard**
   - After login, you will see:
     - Summary cards (Loads Done, Cash Collected, Unpaid Balance).
     - A “How does the system work?” collapsible guide.
     - **Today’s Orders** list with search bar.

4. **Add a new customer**
   - Click **“Add Customer”**.
   - Fill in:
     - OR / receipt number.
     - Customer name.
     - Weight.
     - Service type.
     - Optional advance payment.
   - The system calculates:
     - Estimated total price.
     - Number of machine cycles.
     - Remaining balance and payment status.
   - Click **“Add Customer”** button to save.

5. **Update payment**
   - In the orders list, click **“Settle”** for a customer.
   - Enter the amount paid.
   - The system updates the balance and status.

6. **Mark as claimed**
   - When a customer picks up their laundry, click **“Claim”**.
   - Confirm in the popup.
   - The order moves to the **Claims / Picked Up** section.

7. **Void an order**
   - If an entry is wrong, click **“Void”**.
   - The status is updated so it does not count in statistics.

8. **Generate a report**
   - Click **“Generate Report”** in the header.
   - Choose **Daily** or **Weekly**.
   - Wait for the PDF to be created and downloaded.

9. **Install as PWA (optional)**
   - If supported, a top banner will show **“Install Casa de Labada”**.
   - Click **Install** to add the app icon to your device’s home screen.

---

### Configuration

Most configuration revolves around **Firebase** and **PWA**.

- **Firebase configuration** (`src/config/firebase.js`)
  - Reads settings from environment variables (`VITE_FIREBASE_*`).
  - Initializes:
    - `auth` (authentication).
    - `db` (Firestore database) with persistent cache and multi‑tab support.

- **Environment variables**
  - Must start with `VITE_` for Vite to expose them to the frontend.
  - Set them in `.env` or through your hosting provider’s environment settings.

- **PWA configuration**
  - Managed in `vite.config.js` using `vite-plugin-pwa`.
  - `public/manifest.webmanifest`, icons, and service worker (`sw.js`) control the installable behavior.

---

### Screens / UI Explanation

- **Login Screen**
  - Simple form to log into the system using Firebase Auth.

- **Dashboard**
  - **Header**
    - Logo.
    - Current date and time.
    - Buttons for **Generate Report** and **Logout**.
  - **Stats section**
    - “Bento” style cards for daily totals.
  - **Guide**
    - Collapsible area explaining workflow and actions in friendly language.
  - **Today’s Orders**
    - Search bar (by name or OR#).
    - Table of active orders with actions:
      - **Settle**, **Claim**, **Void**, **View details**.
  - **Claims / Picked Up**
    - List of completed / claimed orders.
  - **Footer**
    - Fixed footer with version and small credit note.

- **Modals**
  - **Add Customer**
    - Form for OR#, name, weight, service, payment.
    - Shows calculated price, cycles, balance, and warnings.
  - **Settle Payment**
    - Accepts new payment and recomputes balance.
  - **Transaction Details**
    - Shows more detailed breakdown per order.
  - **Claim Confirmation**
    - Confirms marking an order as claimed.
  - **Report Modal**
    - Lets you pick report type (daily / weekly) and triggers PDF export.

All modals use the shared `Modal` component, which is:

- Fully **responsive**.
- Uses **fixed position** with backdrop and body lock.
- Keeps **header and footer pinned** while content scrolls.
- Handles **mobile viewport issues** (like browser toolbars and virtual keyboard).

---

### Future Improvements / Possible Enhancements

- **User management and roles**
  - Multiple user accounts with roles (admin, staff).

- **More flexible pricing rules**
  - Configurable per‑kg price and cycle rules from an admin settings screen.

- **Additional services**
  - Support for more service types (e.g., ironing, pickup/delivery fees).

- **More advanced reporting**
  - Monthly summaries, profit estimation, export to CSV.

- **Localization**
  - Multiple languages (e.g., English and Filipino toggle).

- **Dark / light theme toggle**
  - Allow switching themes based on preference or system setting.

- **Better offline support**
  - Background sync for queued operations when internet returns.

---

### Contribution Guidelines (Optional)

If you want to contribute or customize this project:

1. **Fork** the repository.
2. Create a new branch for your changes:

   ```bash
   git checkout -b feature/my-change
   ```

3. Make your changes and ensure the app still runs:

   ```bash
   yarn dev
   ```

4. Run linting (optional but recommended):

   ```bash
   yarn lint
   ```

5. Commit and push your branch, then open a **Pull Request** with a clear description.

---

### License

If you plan to open‑source this project, you can add a license here (for example, MIT).  
For now, you can treat this as **proprietary / private code** controlled by the project owner.

---

### Author

**Angelito Halmain**

