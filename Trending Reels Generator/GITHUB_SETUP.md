# GitHub Setup Instructions

Follow these steps to upload your Trendlyzer app to GitHub:

## Step 1: Configure Git (if not already done)

Set your Git user name and email:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Or for this repository only:

```powershell
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## Step 2: Create Initial Commit

```powershell
git commit -m "Initial commit: Trendlyzer - AI-Powered Reel Idea Generator"
```

## Step 3: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Fill in the details:
   - **Repository name**: `trendlyzer-app` (or your preferred name)
   - **Description**: "AI-Powered Reel Idea Generator for TikTok and Instagram"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

## Step 4: Add Remote and Push

After creating the repository, GitHub will show you commands. Use these:

```powershell
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/trendlyzer-app.git

# Rename the default branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

If you encounter authentication issues, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys

## Step 5: Verify

1. Go to your GitHub repository page
2. You should see all your files there
3. Make sure `.env` is NOT visible (it should be in .gitignore)

## Important Notes

- ✅ Your `.env` file is already in `.gitignore` and will NOT be uploaded
- ✅ All source code and configuration files will be uploaded
- ✅ Never commit API keys or sensitive information
- ✅ The `.env.example` file shows what environment variables are needed

## Troubleshooting

### If you get authentication errors:

**Option 1: Use Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` scope
3. Use the token as your password when pushing

**Option 2: Use SSH**
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your.email@example.com"`
2. Add SSH key to GitHub: Settings → SSH and GPG keys → New SSH key
3. Change remote URL: `git remote set-url origin git@github.com:YOUR_USERNAME/trendlyzer-app.git`

### If you need to update the repository later:

```powershell
git add .
git commit -m "Your commit message"
git push
```
