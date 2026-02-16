# MongoDB Atlas Setup Guide for Century Cleaning Agency

This guide will help you set up a free MongoDB database in the cloud using MongoDB Atlas. This database will store all your products, sales, and worker information securely.

## Step 1: Create an Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Sign up for a free account using your Google account or email.

## Step 2: Deploy a Free Cluster
1. After logging in, you will be prompted to build a database.
2. Select the **M0 Free** tier (this is free forever).
3. Choose a provider (AWS is fine) and a region close to you (e.g., Frankfurt or any available free region).
4. Click **Create Deployment** or **Create Cluster**.

## Step 3: Create a Database User
1. You will be asked to set up security.
2. **Username**: Enter `century_admin` (or any name you prefer).
3. **Password**: Enter a strong password. **Important:** Write this password down, you will need it later!
4. Click **Create Database User**.

## Step 4: Allow Access (Network Access)
1. In the "Network Access" section or "Where would you like to connect from?", select **My Local Environment**.
2. To make it easier for now, you can add `0.0.0.0/0` to the IP Address list. This allows access from anywhere (useful if your internet IP changes).
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere**.
   - Click **Confirm/Add**.

## Step 5: Get Connection String
1. Go to your **Database** dashboard (click "Database" in the left menu).
2. Click the **Connect** button on your cluster.
3. Select **Drivers** (Node.js, Go, Python, etc.).
4. Ensure **Node.js** is selected with version **5.5 or later**.
5. You will see a connection string that looks like this:
   `mongodb+srv://century_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
6. **Copy this string**.

## Step 6: Configure Your Application
1. Open the file `.env.local` in your project folder (create it if it doesn't exist, using `.env.example` as a template).
2. Find the line `MONGODB_URI=`.
3. Paste your connection string there.
4. **Replace `<password>`** with the actual password you created in Step 3.
   - Example: `mongodb+srv://century_admin:MyStrongPassword123@cluster0...`

## Step 7: Seed Initial Data
1. Once connected, open your terminal in the project folder.
2. Run the command to populate the database with your initial products:
   ```bash
   curl -X POST http://localhost:3000/api/products/seed
   ```
   (Note: You need to have the application running first using `npm run dev`).

You are now ready to use the system!
