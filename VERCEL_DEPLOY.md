# VERCEL DEPLOYMENT STEPS

## Step 1: Push to GitHub

Open Command Prompt in your project folder and run:

```bash
cd d:\proojects\DICTIONARY

git init
git add .
git commit -m "Dictionary app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub details.

---

## Step 2: Deploy on Vercel

### 2.1 Go to Vercel
- Open: https://vercel.com
- Click **"Sign Up"** or **"Login"**
- Choose **"Continue with GitHub"**

### 2.2 Import Project
- Click **"Add New..."** → **"Project"**
- Find your repository: `YOUR_REPO_NAME`
- Click **"Import"**

### 2.3 Configure Project
- **Framework Preset**: Other
- **Root Directory**: `./`
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)
- Click **"Deploy"**

### 2.4 Add Environment Variable
After deployment completes:
- Go to **Settings** → **Environment Variables**
- Click **"Add New"**
- **Name**: `GEMINI_API_KEY`
- Select: **Production**, **Preview**, **Development**
- Click **"Save"**

### 2.5 Redeploy
- Go to **Deployments** tab
- Click **"..."** on latest deployment
- Click **"Redeploy"**
- Wait 1-2 minutes

---

## Step 3: Access Your App

Your app will be live at:
```
https://your-project-name.vercel.app
```

---

## Test Your App

1. Open the Vercel URL
2. Wait 3 seconds (auto-redirect)
3. Login:
   - Username: 
   - Password: 
4. Search any word (e.g., "happy")
5. Check storage with password

---

## Admin Access

- Click **ADMIN** button on login page


---

## Done! 🎉

Your Dictionary app is now live on Vercel!
