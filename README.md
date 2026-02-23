<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

This repo now includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that auto-deploys on pushes to `main`.

One-time setup in GitHub:

1. Go to **Settings -> Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. (Recommended) Add repository secret `GEMINI_API_KEY` under **Settings -> Secrets and variables -> Actions**.

After that, push to `main` and the site will publish to:

`https://jacobpopcantstop.github.io/School-Planner-Pro/`
