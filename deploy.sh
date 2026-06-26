#!/bin/bash
# ============================================================
# ELYRA AI 2 — FULL DEPLOY SCRIPT
# Run this from inside: D:\elyra-ai-2\ (or wherever you place the project)
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║         ELYRA AI 2 — DEPLOY STARTING             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── STEP 1: Git init ──────────────────────────────────────
echo "📁 Initializing Git repo..."
git init
git add .
git commit -m "feat: Elyra AI 2 Finance Agent — initial deploy"

# ── STEP 2: Create GitHub repo ────────────────────────────
echo ""
echo "🐙 Creating GitHub repo..."
gh repo create elyra-ai-2-finance --public --source=. --remote=origin --push
echo "✅ GitHub repo created and pushed"

# ── STEP 3: Deploy Backend to Render ──────────────────────
echo ""
echo "🚀 Deploying backend to Render..."
echo "   → Go to https://render.com/dashboard"
echo "   → New > Web Service"
echo "   → Connect GitHub repo: elyra-ai-2-finance"
echo "   → Root Directory: backend"
echo "   → Build Command: pip install -r requirements.txt"
echo "   → Start Command: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo "   → Add these env vars:"
echo "      DATABASE_URL = (your Neon URL)"
echo "      GROQ_API_KEY = (your Groq key)"
echo "      SECRET_KEY   = 14277ac633394d83f3162ab6c12e8c01c67f2adb4cc5ae041424790478fa857f"
echo "      ALGORITHM    = HS256"
echo "      ACCESS_TOKEN_EXPIRE_MINUTES = 1440"
echo ""
echo "   ⚠️  Once deployed, copy the Render URL (e.g. https://elyra-ai-2-backend.onrender.com)"
echo "      and update frontend/.env → VITE_API_URL=<your render url>"
read -p "   Paste your Render backend URL here: " RENDER_URL

# ── STEP 4: Update frontend .env ──────────────────────────
echo "VITE_API_URL=$RENDER_URL" > frontend/.env
echo "✅ Frontend .env updated with: $RENDER_URL"

# ── STEP 5: Deploy Frontend to Vercel ─────────────────────
echo ""
echo "🌐 Deploying frontend to Vercel..."
cd frontend
npm install
npm run build
npx vercel --prod --yes

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           ELYRA AI 2 — DEPLOYED ✅               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "🔐 Default login:"
echo "   Email:    admin@elyra.ai"
echo "   Password: Elyra@2026"
echo ""
