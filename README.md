# UniVoice — Private Campus Confessions & Microblog

UniVoice is a private college version of Reddit focused on anonymous microblog confessions, discussions, and student campus life. Built strictly on the MERN stack with TypeScript, Tailwind CSS, and Socket.io, it features safe session JWT cookies, threaded replies, instant score tallies, emoji reactions, moderation reporting, and an administrative metrics control room.

---

## 🚀 Tech Stack Overview

-   **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
-   **Backend**: Node.js + Express.js + TypeScript
-   **Database**: MongoDB with Mongoose
-   **Real-time synchronization**: Socket.io
-   **Authentication**: JWT saved in secure HTTP-only cookies

---

## 📁 Repository Structure

```
UniVoice/
├── package.json         # Workspace configurations and run scripts
├── client/              # React frontend client
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/             # Source code (components, pages, context, hooks)
└── server/              # Express + TS backend API server
    ├── package.json
    ├── .env             # Database & JWT port configurations
    └── src/             # Source code (models, routes, controllers, middleware)
```

---

## 🛠️ Installation & Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on your computer.

### Step 1: Install Dependencies
Open your terminal in the project root directory (`UniVoice`) and run:
```bash
npm run install-all
```
This automatically installs node modules for the root workspaces, client, and server folders concurrently.

### Step 2: Configure Environment Variables
A standard development `.env` has already been generated inside `/server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/univoice
JWT_SECRET=univoice_secret_key_987654321
CLIENT_URL=http://localhost:5173
```
Ensure your local MongoDB instance is listening on `mongodb://127.0.0.1:27017/`.

### Step 3: Run the Application
Start the concurrent development servers from the root folder:
```bash
npm run dev
```
-   **Frontend Client**: [http://localhost:5173](http://localhost:5173)
-   **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🛡️ Admin & Testing Guides

### 1. Verification Simulation
To simulate a secure college signup flow:
1.  Navigate to the Sign In page and click **Create an account**.
2.  Input your details and click **Create Account**.
3.  An email verification screen will appear. Since this is a local demo, the **6-digit verification code** is instantly printed to the server terminal console!
4.  Copy the code from the server console, paste it, and verify.

### 2. Testing Administrative Controls
-   **Elevated Status**: The **very first** account registered in the database is automatically granted the `admin` role.
-   **Dashboard Access**: Once logged in as the admin, click the user profile icon in the top right, and select **Admin Panel** to access the `/admin` protected route.
-   **Moderation Flow**:
    1.  Create another test student account in a separate window or incognito session.
    2.  Browse as a student and flag a post/comment using the **Report** button.
    3.  Return to the Admin Dashboard under **Report Queue** to audit the report, and click **Delete Content** or **Dismiss Report**.
    4.  Under **Users Directory**, you can audit students and toggle **Ban Student** controls.
