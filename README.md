# Bites 🍓

A warm, private full-stack web application designed for one main user (partner) that gently encourages her to eat her meals through an interactive photo-reveal puzzle game.

Built with **React 18 + Vite + TypeScript + Tailwind CSS** on the frontend, and **Node.js + Express + SQLite (better-sqlite3) + Sharp** on the backend.

---

## ✨ Key Features

1. **Disguise Screen (`/`)**:
   - Opens as an authentic, minimal "No internet" browser error screen (`ERR_INTERNET_DISCONNECTED`).
   - Features an original, pixel-art baby dragon drawn from scratch with inline SVG that hops and blinks when tapped or when pressing Space/ArrowUp.
   - A secret 6px dot hidden in the bottom-right corner (opacity ~0.3) navigates straight to login, or directly to her home screen if already signed in.
   - The app name is never shown on the disguise page, and browser tab title is "No internet".

2. **Zero Punishment & Warmth**:
   - Skipped meals trigger **no penalties**, no losing tiles, and **tiles never re-lock**.
   - No guilt-inducing words like "failed", "missed", or "broken streak".
   - 10-minute gentle undo window for logged meals.

3. **Secure Photo-Reveal Puzzle**:
   - Sliced dynamically with **Sharp** into $3\times3$, $4\times4$, or $5\times5$ tiles.
   - Unlocked tile by tile with each meal slot.
   - Locked tiles are never transmitted to her browser until unlocked.
   - Each unlocked tile plays a 3D flip animation and reveals a hidden sweet note.
   - On 100% completion: confetti explosion, full photo reveal, and custom reward message (e.g. *"Date night, you pick the restaurant!"*).

4. **Permanent Album & Milestones (`/app/album`)**:
   - Every completed puzzle is permanently archived with start/finish dates, days taken, and reward.
   - Interactive timeline showing every unlocked tile, timestamp, meal eaten, and secret note.

5. **Partner Admin Panel (`/admin`)**:
   - Upload photos, choose grid size, customize tile hidden notes, and set final rewards.
   - Reorder the queued puzzles.
   - View today's meal status and historical calendar.
   - Compose and schedule love notes.
   - Edit meal window times (Breakfast, Lunch, Dinner).
   - Test Web Push notifications.

6. **Gentle Reminders & Love Notes**:
   - If a meal window has passed without a log, a warm pastel banner appears with an encouraging message.
   - Love notes appear on her home screen, optionally scheduled for specific dates.

---

## 🚀 Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### 2. Installation
From the root directory:
```bash
# Install root, server, and client dependencies
npm run install:all
```
*(Or install in each directory individually: `npm install`, `cd server && npm install`, `cd ../client && npm install`)*

### 3. Environment Configuration
Copy the example environment files:
```bash
cp .env.example server/.env
```

Review or edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
APP_TIMEZONE=America/New_York

# Seed Accounts
HER_NAME=Sweetheart
HER_PIN=1234

ADMIN_NAME=Fazal
ADMIN_PIN=4321

# Web Push (Optional - VAPID keys)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
```

### 4. Database Seeding
Initialize the SQLite database with default users, default meals, gentle reminders, an initial love note, and a starter photo puzzle:
```bash
npm run seed
```

### 5. Run the Application
Start both the backend server and frontend development server simultaneously with one command:
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Automated Tests

Run the test suite verifying all unlock and security rules:
```bash
npm test
```

This verifies:
- ✅ She logs a meal $\rightarrow$ exactly 1 tile unlocks.
- ✅ Same meal logged twice on the same day $\rightarrow$ still 1 tile (no duplicate unlocks).
- ✅ Admin actions never unlock tiles.
- ✅ Tiles never re-lock (even if a meal log is undone).
- ✅ Different meal slots advance unlocks until completion.

---

## 🧩 Uploading Your First Custom Puzzle

1. Go to [http://localhost:3000](http://localhost:3000) (the disguise page).
2. Click the tiny dot in the bottom-right corner.
3. Select **Admin** and enter the admin PIN (`4321` by default).
4. In the **Admin Dashboard**, stay on the **Puzzles** tab.
5. Enter a title, select a grid size ($3\times3$, $4\times4$, or $5\times5$), choose any photo from your computer, set the reward, and optionally add secret notes for each tile.
6. Click **Add Puzzle to Queue ✨**. Sharp will automatically crop and slice the photo into tiles.

---

## 📱 Mobile PWA Installation

The application includes a `manifest.json` and `sw.js` service worker.
- **iOS Safari**: Tap the **Share** button $\rightarrow$ tap **Add to Home Screen**.
- **Android Chrome**: Tap the menu (three dots) $\rightarrow$ tap **Install app** or **Add to Home screen**.

---

## 🚢 Production Deployment

1. Build both client and server:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```
   The Express server serves the compiled React client from `client/dist` and handles API requests and secure image delivery on the same port.
