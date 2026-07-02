# UniVoice Database Setup Guide

This guide explains how to set up the MongoDB database for the UniVoice website.

If you encountered a **"Failed to fetch"** error during login, signup, or while loading the website, it is because **the backend API server is unable to connect to a running MongoDB database**. 

When the backend cannot connect to MongoDB, the process restarts repeatedly, preventing the frontend from communicating with the server. Follow one of the options below to get MongoDB running.

---

## Option 1: MongoDB Atlas (Recommended - Easiest & Free)
MongoDB Atlas is a free, cloud-hosted MongoDB service. You do not need to install MongoDB on your computer.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a new free cluster (Shared tier - $0/month).
3. Under **Security > Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (IP `0.0.0.0/0`) for testing, or add your current IP.
4. Under **Security > Database Access**, create a database user with a username and password (e.g., user: `univoice_user`, password: `yourpassword`).
5. On the cluster dashboard, click **Connect > Drivers** to get your connection string. It will look like this:
   `mongodb+srv://univoice_user:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
6. Open your [backend/.env](file:///c:/Users/AADHITHYA/Desktop/UniVoice/backend/.env) file.
7. Replace the `MONGO_URI` line with your new connection string:
   ```env
   MONGO_URI=mongodb+srv://univoice_user:yourpassword@cluster0.xxxx.mongodb.net/univoice?retryWrites=true&w=majority
   ```
   *(Note: Make sure to replace `<password>` or `yourpassword` with the actual password you created for the database user, and optionally add `/univoice` before the query parameters to set the database name).*
8. Save the file and restart the dev server using `npm run dev`.

---

## Option 2: Run MongoDB Locally (Windows)
If you prefer running MongoDB on your machine, you must install and run the MongoDB service.

1. Download the **MongoDB Community Server** installer for Windows:
   👉 [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the `.msi` installer and make sure **"Install MongoDB as a Service"** is checked.
3. Keep the default port as `27017`.
4. Once installed, MongoDB will run automatically in the background.
5. In your [backend/.env](file:///c:/Users/AADHITHYA/Desktop/UniVoice/backend/.env) file, keep the default URI:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/univoice
   ```
6. Start the server using `npm run dev`.

---

## Option 3: Run MongoDB via Docker
If you have Docker Desktop installed, you can start MongoDB instantly:

1. Run the following command in your terminal:
   ```bash
   docker run -d -p 27017:27017 --name univoice-mongo mongo:latest
   ```
2. Keep the default URI in [backend/.env](file:///c:/Users/AADHITHYA/Desktop/UniVoice/backend/.env):
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/univoice
   ```
3. Start the server using `npm run dev`.
