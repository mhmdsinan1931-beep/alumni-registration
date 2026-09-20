# Meelad Programme Registration Portal

A Firebase-backed, two-portal web app for managing Meelad Programme registrations.

## 🗂 Folder Structure

```
cultural-programme-portal/
├── index.html             ← Redirects to host.html
├── host.html              ← Password-protected host dashboard
├── register.html          ← Participant registration form
├── css/
│   └── style.css          ← Shared styles
├── js/
│   ├── firebase-config.js ← ⚠️ Fill in your Firebase credentials here
│   ├── host.js            ← Host portal logic
│   └── register.js        ← Registration logic
├── .gitignore
└── README.md
```

---

## 🚀 Setup Instructions

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**, give it a name (e.g. `cultural-programme`)
3. Disable Google Analytics (optional) → **Create project**

### Step 2 — Enable Firestore

1. In the Firebase console, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (you can secure it later)
4. Select a location → **Done**

### Step 3 — Get Your Firebase Config

1. Go to **Project Settings** (gear icon) → **Your apps**
2. Click **Add app** → choose **Web** (`</>`)
3. Register the app (any nickname)
4. Copy the `firebaseConfig` object shown

### Step 4 — Fill in `js/firebase-config.js`

Open `js/firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  ...
};
```

### Step 5 — Upload to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cultural-programme-portal.git
git push -u origin main
```

### Step 6 — Enable GitHub Pages (optional free hosting)

1. Go to your GitHub repo → **Settings → Pages**
2. Source: **Deploy from a branch** → `main` → `/ (root)`
3. Your site will be live at: `https://YOUR_USERNAME.github.io/cultural-programme-portal/`

---

## 🔐 Host Portal

- Default password: **`host123`**
- You can change the password from inside the dashboard
- The password is stored securely in Firestore

## 🎭 Programmes

| Programme | Asks for |
|---|---|
| Malayalam Speech | Topic |
| Madh Song | First line of the song |
| Mappilappattu | First line of the song |
| Group Song | First line of the song |
| Kathaprasangam | Topic |
| Malayalam Conversation | Topic |

---

## 📋 Firestore Rules (recommended for production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /registrations/{doc} {
      allow read, write: if true;  // tighten after testing
    }
    match /config/{doc} {
      allow read, write: if true;
    }
  }
}
```
