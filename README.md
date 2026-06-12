# Potato Pomodoro

A cozy Pomodoro timer with potato mascots, cute sayings, sounds, history, and settings.

## Run locally

Open `index.html` in your browser, or:

```powershell
Set-Location "C:\Users\Vida Alvarez\potato-pomodoro-cursor"
python -m http.server 8765
```

Then visit `http://127.0.0.1:8765`.

## Put it on GitHub (so you can open it anywhere)

GitHub is like cloud storage for code. Once uploaded, you can turn on **GitHub Pages** and get a link such as `https://yourname.github.io/potato-pomodoro/` that works on any phone or computer.

### One-time setup

1. Install **Git for Windows**: https://git-scm.com/download/win
2. Create a free GitHub account: https://github.com/signup
3. Create a new empty repository on GitHub named `potato-pomodoro` (no README needed)

### Upload the project

In PowerShell:

```powershell
Set-Location "C:\Users\Vida Alvarez\potato-pomodoro-cursor"
git init
git add .
git commit -m "Add Potato Pomodoro timer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/potato-pomodoro.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. GitHub will ask you to sign in.

### Turn on the live website

1. On GitHub, open your repo → **Settings** → **Pages**
2. Under **Build and deployment**, choose **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Save. After a minute or two, your site URL appears at the top of the Pages section.

## Transparent potato images

If you replace mascot PNGs, re-run:

```powershell
python scripts/remove_bg.py
```

This creates `*-transparent.png` files used by the app.
