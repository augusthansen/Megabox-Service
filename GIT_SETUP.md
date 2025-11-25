# Git Repository Setup Instructions

## Option 1: Using GitHub CLI (Recommended)

1. **Authenticate with GitHub:**
   ```bash
   gh auth login
   ```
   Follow the prompts to authenticate.

2. **Create and push the repository:**
   ```bash
   cd "/Users/augusthansen/Documents/Programs/Megabox Service App/megabox-service"
   gh repo create "Megabox-Service" --public --source=. --remote=origin --push
   ```

## Option 2: Manual Setup on GitHub

1. **Go to GitHub.com** and sign in
2. **Click the "+" icon** in the top right → "New repository"
3. **Repository name:** `Megabox-Service`
4. **Description:** "Remote service management platform for mail inserter machines"
5. **Visibility:** Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. **Click "Create repository"**

8. **Then run these commands:**
   ```bash
   cd "/Users/augusthansen/Documents/Programs/Megabox Service App/megabox-service"
   git remote add origin https://github.com/YOUR_USERNAME/Megabox-Service.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

## Verify

After pushing, verify with:
```bash
git remote -v
git log --oneline
```

